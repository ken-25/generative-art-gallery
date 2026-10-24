/* Share format 1. Version 1 generators are frozen; future generators must retain
   this implementation or dispatch version 1 URLs to a compatible renderer. */
(() => {
 'use strict';
 function decode(fragment,G) {
  if(!fragment) return null;
  if(fragment.length>8192||!fragment.startsWith('#art=')) throw Error('共有URLの形式が不正です。');
  let data;
  try {data=JSON.parse(decodeURIComponent(fragment.slice(5)));} catch {throw Error('共有URLを読み取れません。');}
  if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).sort().join()!=='format,generator,settings') throw Error('共有URLの項目が不正です。');
  if(data.format!==1||data.generator!==1) throw Error('未対応のバージョンです。元の絵は復元していません。');
  const s=data.settings, keys=Object.keys(G.defaults);
  if(!s||typeof s!=='object'||Array.isArray(s)||Object.keys(s).sort().join()!==[...keys].sort().join()) throw Error('共有URLの設定が不足しているか、対応していない項目が含まれています。');
  for(const key of keys) if(typeof s[key]!==typeof G.defaults[key]||(typeof s[key]==='number'&&!Number.isFinite(s[key]))) throw Error('共有URLに使えない設定値が含まれています。');
  const normalized=G.normalize(s);
  if(keys.some(k=>normalized[k]!==s[k])) throw Error('共有URLの設定値が範囲外のため、復元できません。');
  return normalized;
 }
 function encode(input,G) {
  const normalized=G.normalize(input),settings={};
  for(const key of Object.keys(G.defaults)) settings[key]=normalized[key];
  return '#art='+encodeURIComponent(JSON.stringify({format:1,generator:1,settings}));
 }
 function pngSize(width,height,edge=1600) {
  if(![width,height,edge].every(n=>Number.isFinite(n)&&n>0)||width>1e6||height>1e6)throw Error('画像のサイズを確認できません。');
  const factor=Math.min(edge/Math.max(width,height),4096/Math.max(width,height),Math.sqrt(8e6/(width*height)));
  return {width:Math.max(1,Math.floor(width*factor)),height:Math.max(1,Math.floor(height*factor))};
 }
 async function pngBlob(svg,edge=1600) {
  const documentSVG=new DOMParser().parseFromString(svg,'image/svg+xml'),root=documentSVG.documentElement;
  if(root.localName!=='svg'||documentSVG.querySelector('parsererror,script,foreignObject'))throw Error('PNGに変換できない画像です。');
  const box=root.getAttribute('viewBox')?.trim().split(/[ ,]+/).map(Number);
  if(!box||box.length!==4)throw Error('画像のサイズを確認できません。');
  const size=pngSize(box[2],box[3],edge),canvas=document.createElement('canvas');canvas.width=size.width;canvas.height=size.height;
  root.setAttribute('width',size.width);root.setAttribute('height',size.height);root.setAttribute('preserveAspectRatio','none');
  const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(root)],{type:'image/svg+xml;charset=utf-8'})),image=new Image();
  try {
   await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('PNGへの変換に失敗しました。SVG保存もご利用ください。'));image.src=url;});
   const context=canvas.getContext('2d');if(!context)throw Error('この端末ではPNGを作成できません。');
   context.fillStyle='#ffffff';context.fillRect(0,0,size.width,size.height);context.drawImage(image,0,0,size.width,size.height);
   return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('PNGを作成できませんでした。')),'image/png'));
  } finally {URL.revokeObjectURL(url);image.src='';canvas.width=canvas.height=1;}
 }
 // DXF R12 (AC1009) line drawing for CAD. Every painted shape becomes its outline: curves and arcs are
 // flattened to polylines, convex clip paths are applied, and y is flipped so the drawing stays upright.
 // DXF R12 has no true color, so each SVG color gets its own layer named after it (e.g. COLOR_355949).
 // One drawing unit is one SVG user unit (viewBox coordinates).
 function dxf(svg) {
  const entities=[],layers=new Map(),clips=new Map(),unescape=s=>s.replace(/&(lt|gt|quot|apos|amp|#\d+|#x[\da-f]+);/gi,(_,e)=>({lt:'<',gt:'>',quot:'"',apos:"'",amp:'&'})[e.toLowerCase()]??String.fromCodePoint(Number('0'+e.slice(1).replace(/^x/i,'x'))));
  const multiply=(m,n)=>[m[0]*n[0]+m[2]*n[1],m[1]*n[0]+m[3]*n[1],m[0]*n[2]+m[2]*n[3],m[1]*n[2]+m[3]*n[3],m[0]*n[4]+m[2]*n[5]+m[4],m[1]*n[4]+m[3]*n[5]+m[5]];
  const apply=(m,[x,y])=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
  const numbers=s=>(String(s||'').match(/[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi)||[]).map(Number);
  function transform(text){let m=[1,0,0,1,0,0];for(const [,name,args]of String(text||'').matchAll(/(\w+)\s*\(([^)]*)\)/g)){const v=numbers(args),r=(v[0]||0)*Math.PI/180;
   const t={matrix:v,translate:[1,0,0,1,v[0]||0,v[1]||0],scale:[v[0]??1,0,0,v[1]??v[0]??1,0,0],rotate:[Math.cos(r),Math.sin(r),-Math.sin(r),Math.cos(r),0,0],skewX:[1,0,Math.tan(r),1,0,0],skewY:[1,Math.tan(r),0,1,0,0]}[name];
   if(!t||t.length!==6)continue;if(name==='rotate'&&v.length===3)m=multiply(multiply(multiply(m,[1,0,0,1,v[1],v[2]]),t),[1,0,0,1,-v[1],-v[2]]);else m=multiply(m,t);}return m;}
  const root=svg.match(/<svg\b[^>]*>/)?.[0]||'',attribute=(tag,name)=>tag.match(new RegExp('\\s'+name+'="([^"]*)"'))?.[1];
  const box=numbers(attribute(root,'viewBox'));if(box.length!==4||!(box[2]>0&&box[3]>0))throw Error('画像のサイズを確認できません。');
  const flip=[1,0,0,-1,-box[0],box[1]+box[3]],size=(v,axis)=>/%$/.test(v||'')?parseFloat(v)/100*box[axis]:Number(v)||0;
  const color=c=>{if(!c||c==='none'||c.startsWith('url('))return null;const hex=c.trim().toLowerCase().match(/^#([\da-f]{3}|[\da-f]{6})$/)?.[1];if(hex)return hex.length===3?[...hex].map(x=>x+x).join(''):hex;
   const named={black:'000000',white:'ffffff',red:'ff0000',green:'008000',blue:'0000ff',gray:'808080',grey:'808080'}[c.trim().toLowerCase()];if(named)return named;
   const rgb=numbers(c.match(/rgba?\(([^)]*)\)/)?.[1]);return rgb.length>=3?rgb.slice(0,3).map(n=>Math.max(0,Math.min(255,Math.round(n))).toString(16).padStart(2,'0')).join(''):'000000';};
  // Nearest AutoCAD color index for viewers that ignore layer names: 1-9, the hue wheel 10-249 and grays 250-255.
  const aci=hex=>{const target=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16));let best=7,score=Infinity;
   const candidates=[[1,[255,0,0]],[2,[255,255,0]],[3,[0,255,0]],[4,[0,255,255]],[5,[0,0,255]],[6,[255,0,255]],[8,[128,128,128]],[9,[192,192,192]]];
   for(let i=10;i<250;i++){const h=(Math.floor(i/10)-1)*15/60,v=[1,1,.8,.8,.6,.6,.5,.5,.3,.3][i%10],light=i%2,f=k=>{const x=(k+h)%6;return 1-Math.max(0,Math.min(1,x,4-x));};candidates.push([i,[f(5),f(3),f(1)].map(c=>Math.round(255*v*(light?.5+c/2:c)))]);}
   [51,91,132,173,214,255].forEach((g,i)=>candidates.push([250+i,[g,g,g]]));
   for(const [index,rgb]of candidates){const d=rgb.reduce((s,c,i)=>s+(c-target[i])**2,0);if(d<score){score=d;best=index;}}return best;};
  const layer=hex=>{const name='COLOR_'+hex.toUpperCase();if(!layers.has(name))layers.set(name,aci(hex));return name;};
  // Shapes in user space: open or closed polylines, plus circles that survive as true circles.
  function arc(points,[x1,y1],rx,ry,phi,large,sweep,[x2,y2]){
   rx=Math.abs(rx);ry=Math.abs(ry);if(!rx||!ry||(x1===x2&&y1===y2)){points.push([x2,y2]);return;}
   const c=Math.cos(phi),s=Math.sin(phi),dx=(x1-x2)/2,dy=(y1-y2)/2,xp=c*dx+s*dy,yp=-s*dx+c*dy,l=xp*xp/(rx*rx)+yp*yp/(ry*ry);if(l>1){rx*=Math.sqrt(l);ry*=Math.sqrt(l);}
   const k=(large===sweep?-1:1)*Math.sqrt(Math.max(0,(rx*rx*ry*ry-rx*rx*yp*yp-ry*ry*xp*xp)/(rx*rx*yp*yp+ry*ry*xp*xp))),cx=k*rx*yp/ry,cy=-k*ry*xp/rx;
   const angle=(ux,uy)=>Math.atan2(uy,ux),start=angle((xp-cx)/rx,(yp-cy)/ry);let delta=angle((-xp-cx)/rx,(-yp-cy)/ry)-start;
   if(sweep&&delta<0)delta+=2*Math.PI;else if(!sweep&&delta>0)delta-=2*Math.PI;
   const n=Math.max(2,Math.ceil(Math.abs(delta)/(2*Math.PI)*steps(Math.max(rx,ry))));
   for(let i=1;i<=n;i++){const t=start+delta*i/n,ex=rx*Math.cos(t),ey=ry*Math.sin(t);points.push(i===n?[x2,y2]:[c*ex-s*ey+(x1+x2)/2+c*cx-s*cy,s*ex+c*ey+(y1+y2)/2+s*cx+c*cy]);}
  }
  const circle=(cx,cy,r)=>{const points=[[cx+r,cy]];arc(points,points[0],r,r,0,false,true,[cx-r,cy]);arc(points,[cx-r,cy],r,r,0,false,true,points[0]);return {points,closed:true};};
  let scale=1;const steps=r=>Math.min(256,Math.max(8,Math.ceil(2*Math.PI/(2*Math.acos(Math.max(-1,1-0.05/Math.max(r*scale,0.05)))))));
  function path(d){
   const shapes=[],tokens=String(d||'').match(/[a-zA-Z]|[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi)||[];let i=0,command='',current=[0,0],start=[0,0],points=null,control=null;
   const next=()=>Number(tokens[i++]),finish=closed=>{if(points&&points.length>1)shapes.push({points,closed});points=null;};
   const bezier=(p,n)=>{const length=p.slice(1).reduce((s,q,j)=>s+Math.hypot(q[0]-p[j][0],q[1]-p[j][1]),0),count=Math.min(64,Math.max(4,Math.ceil(length*scale/2)));
    for(let j=1;j<=count;j++){const t=j/count,u=1-t;points.push(n===3?[u*u*u*p[0][0]+3*u*u*t*p[1][0]+3*u*t*t*p[2][0]+t*t*t*p[3][0],u*u*u*p[0][1]+3*u*u*t*p[1][1]+3*u*t*t*p[2][1]+t*t*t*p[3][1]]:[u*u*p[0][0]+2*u*t*p[1][0]+t*t*p[2][0],u*u*p[0][1]+2*u*t*p[1][1]+t*t*p[2][1]]);}};
   while(i<tokens.length){
    if(/^[a-z]$/i.test(tokens[i]))command=tokens[i++];else if(!command)break;
    const relative=command===command.toLowerCase(),C=command.toUpperCase(),point=()=>{const x=next(),y=next();return relative?[current[0]+x,current[1]+y]:[x,y];};
    if(C==='Z'){if(points){points.push([...start]);finish(true);}current=[...start];control=null;continue;}
    if(!points){points=[[...current]];}
    if(C==='M'){finish(false);current=start=point();points=[[...current]];command=relative?'l':'L';control=null;}
    else if(C==='L'){current=point();points.push(current);control=null;}
    else if(C==='H'){const x=next();current=[relative?current[0]+x:x,current[1]];points.push(current);control=null;}
    else if(C==='V'){const y=next();current=[current[0],relative?current[1]+y:y];points.push(current);control=null;}
    else if(C==='C'||C==='S'){const reflected=C==='S'?(control?.cubic?[2*current[0]-control.p[0],2*current[1]-control.p[1]]:[...current]):point(),c2=point(),end=point();bezier([current,reflected,c2,end],3);control={cubic:true,p:c2};current=end;}
    else if(C==='Q'||C==='T'){const c1=C==='T'?(control?.quad?[2*current[0]-control.p[0],2*current[1]-control.p[1]]:[...current]):point(),end=point();bezier([current,c1,end],2);control={quad:true,p:c1};current=end;}
    else if(C==='A'){const rx=next(),ry=next(),phi=next()*Math.PI/180,large=!!next(),sweep=!!next(),end=point();arc(points,current,rx,ry,phi,large,sweep,end);current=end;control=null;}
    else break;
   }
   finish(false);return shapes.filter(s=>s.points.length>1);
  }
  function geometry(tag,a,text){
   const n=k=>Number(a[k])||0;
   if(tag==='rect'){const x=size(a.x,2),y=size(a.y,3),w=size(a.width,2),h=size(a.height,3);return w>0&&h>0?[{points:[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]],closed:true}]:[];}
   if(tag==='circle')return n('r')>0?[{circle:[n('cx'),n('cy'),n('r')]}]:[];
   if(tag==='ellipse'){const rx=n('rx'),ry=n('ry'),points=[[n('cx')+rx,n('cy')]];if(!(rx>0&&ry>0))return [];arc(points,points[0],rx,ry,0,false,true,[n('cx')-rx,n('cy')]);arc(points,points.at(-1),rx,ry,0,false,true,points[0]);return [{points,closed:true}];}
   if(tag==='line')return [{points:[[n('x1'),n('y1')],[n('x2'),n('y2')]],closed:false}];
   if(tag==='polygon'||tag==='polyline'){const v=numbers(a.points),points=[];for(let j=0;j+1<v.length;j+=2)points.push([v[j],v[j+1]]);if(tag==='polygon'&&points.length)points.push([...points[0]]);return points.length>1?[{points,closed:tag==='polygon'}]:[];}
   if(tag==='path')return path(a.d);
   if(tag==='text'&&text.trim())return [{text:text.trim(),at:[n('x'),n('y')],height:Number(a['font-size'])||16}];
   return [];
  }
  // Cyrus-Beck clipping of each segment against a convex polygon (the generators clip to rectangles and triangles).
  function clip(points,polygon){
   const area=polygon.reduce((s,p,j)=>{const q=polygon[(j+1)%polygon.length];return s+p[0]*q[1]-q[0]*p[1];},0),sign=area<0?-1:1,pieces=[];let piece=null,trimmed=false;
   for(let j=1;j<points.length;j++){const [a,b]=[points[j-1],points[j]];let t0=0,t1=1;
    for(let k=0;k<polygon.length&&t0<=t1;k++){const p=polygon[k],q=polygon[(k+1)%polygon.length],nx=-(q[1]-p[1])*sign,ny=(q[0]-p[0])*sign,num=nx*(a[0]-p[0])+ny*(a[1]-p[1]),den=nx*(b[0]-a[0])+ny*(b[1]-a[1]);
     if(Math.abs(den)<1e-12){if(num<0)t1=-1;}else{const t=-num/den;if(den>0)t0=Math.max(t0,t);else t1=Math.min(t1,t);}}
    if(t0>0||t1<1)trimmed=true;if(t0>t1){piece=null;continue;}
    const at=t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
    if(piece&&t0===0)piece.push(at(t1));else{piece=[at(t0),at(t1)];pieces.push(piece);}
    if(t1<1)piece=null;
   }
   return trimmed?pieces:null;
  }
  const format=v=>String(Math.round(v*1e4)/1e4||0),code=(c,v)=>`${c}\n${v}\n`;
  const textValue=s=>[...s].map(ch=>{const p=ch.codePointAt(0);return p<32?' ':p>126?'\\U+'+p.toString(16).toUpperCase().padStart(4,'0'):ch;}).join('');
  function emit(shape,m,clipList,name){
   if(shape.text){const [x,y]=apply(m,shape.at);entities.push(code(0,'TEXT')+code(8,name)+code(10,format(x))+code(20,format(y))+code(30,0)+code(40,format(shape.height*Math.sqrt(Math.abs(m[0]*m[3]-m[1]*m[2]))))+code(1,textValue(shape.text)));return;}
   if(shape.circle){const [cx,cy,r]=shape.circle,similar=Math.abs(Math.abs(m[0])-Math.abs(m[3]))<1e-9&&Math.abs(Math.abs(m[1])-Math.abs(m[2]))<1e-9&&Math.abs(m[0]*m[2]+m[1]*m[3])<1e-9;
    if(similar&&!clipList.length){const [x,y]=apply(m,[cx,cy]);entities.push(code(0,'CIRCLE')+code(8,name)+code(10,format(x))+code(20,format(y))+code(30,0)+code(40,format(r*Math.hypot(m[0],m[1]))));return;}
    shape=circle(cx,cy,r);}
   let pieces=[{points:shape.points.map(p=>apply(m,p)),closed:shape.closed}];
   for(const polygon of clipList){const next=[];for(const piece of pieces){const parts=clip(piece.points,polygon);if(!parts)next.push(piece);else for(const points of parts)next.push({points,closed:false});}pieces=next;}
   for(const {points,closed}of pieces){
    const unique=closed?points.slice(0,-1):points;if(unique.length<2)continue;
    if(unique.length===2&&!closed){entities.push(code(0,'LINE')+code(8,name)+code(10,format(unique[0][0]))+code(20,format(unique[0][1]))+code(30,0)+code(11,format(unique[1][0]))+code(21,format(unique[1][1]))+code(31,0));continue;}
    entities.push(code(0,'POLYLINE')+code(8,name)+code(66,1)+code(10,0)+code(20,0)+code(30,0)+code(70,closed?1:0)+unique.map(([x,y])=>code(0,'VERTEX')+code(8,name)+code(10,format(x))+code(20,format(y))+code(30,0)).join('')+code(0,'SEQEND')+code(8,name));
   }
  }
  // Walk the markup with an inherited paint/transform/clip state; title, desc, metadata and defs draw nothing.
  const stack=[{m:flip,fill:'#000000',stroke:'none',clips:[],hidden:0,clipId:null}];let pendingText=null;
  for(const [,closing,tag,attributes,selfClosing,body]of svg.matchAll(/<(\/?)([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>|([^<]+)/g)){
   const parent=stack.at(-1);
   if(body!==undefined){if(pendingText)pendingText.text+=unescape(body);continue;}
   if(closing){if(tag==='text'&&pendingText){const t=pendingText;pendingText=null;for(const shape of geometry('text',t.a,t.text))emit(shape,t.m,[],t.name);}if(stack.length>1)stack.pop();continue;}
   const a={};for(const [,k,v]of attributes.matchAll(/([\w:-]+)="([^"]*)"/g))a[k]=unescape(v);
   const style=Object.fromEntries((a.style||'').split(';').map(p=>p.split(':').map(x=>x.trim())).filter(p=>p.length===2&&p[0]));Object.assign(a,style);
   const m=tag==='svg'?parent.m:multiply(parent.m,transform(a.transform)),hidden=parent.hidden||['title','desc','metadata','defs','style','script'].includes(tag)||a.display==='none'||a.visibility==='hidden'?1:0;
   const state={m,fill:a.fill??parent.fill,stroke:a.stroke??parent.stroke,clips:parent.clips,hidden,clipId:tag==='clipPath'?a.id:parent.clipId};
   const reference=a['clip-path']?.match(/url\(#([^)]+)\)/)?.[1];
   if(reference&&clips.has(reference))state.clips=[...parent.clips,...clips.get(reference).map(shape=>shape.points.slice(0,-1).map(p=>apply(m,p)))];
   scale=Math.sqrt(Math.abs(m[0]*m[3]-m[1]*m[2]))||1;
   if(state.clipId&&tag!=='clipPath'){const local=geometry(tag,a,'').map(s=>s.circle?circle(...s.circle):s).filter(s=>s.points),t=transform(a.transform);clips.set(state.clipId,[...(clips.get(state.clipId)||[]),...local.map(s=>({points:s.points.map(p=>apply(t,p))}))]);}
   else if(!hidden){const paint=color(state.stroke)||color(state.fill);
    if(tag==='text'&&!selfClosing&&paint)pendingText={a,m,name:layer(paint),text:''};
    else if(paint)for(const shape of geometry(tag,a,''))emit(shape,m,state.clips,layer(paint));}
   if(!selfClosing)stack.push(state);
  }
  const tables=code(0,'SECTION')+code(2,'TABLES')+code(0,'TABLE')+code(2,'LTYPE')+code(70,1)+code(0,'LTYPE')+code(2,'CONTINUOUS')+code(70,0)+code(3,'Solid line')+code(72,65)+code(73,0)+code(40,0)+code(0,'ENDTAB')
   +code(0,'TABLE')+code(2,'LAYER')+code(70,layers.size+1)+[['0',7],...layers].map(([name,index])=>code(0,'LAYER')+code(2,name)+code(70,0)+code(62,index)+code(6,'CONTINUOUS')).join('')+code(0,'ENDTAB')+code(0,'ENDSEC');
  const header=code(0,'SECTION')+code(2,'HEADER')+code(9,'$ACADVER')+code(1,'AC1009')+code(9,'$EXTMIN')+code(10,0)+code(20,0)+code(9,'$EXTMAX')+code(10,format(box[2]))+code(20,format(box[3]))+code(9,'$LIMMIN')+code(10,0)+code(20,0)+code(9,'$LIMMAX')+code(10,format(box[2]))+code(20,format(box[3]))+code(0,'ENDSEC');
  return header+tables+code(0,'SECTION')+code(2,'ENTITIES')+entities.join('')+code(0,'ENDSEC')+code(0,'EOF');
 }
 function socialLinks(url,title) {
  const result={};for(const [key,base,param]of [['x','https://twitter.com/intent/tweet','url'],['line','https://social-plugins.line.me/lineit/share','url'],['facebook','https://www.facebook.com/sharer/sharer.php','u']]){
   const link=new URL(base);link.searchParams.set(param,url);if(key==='x')link.searchParams.set('text',title);result[key]=link.href;
  }return result;
 }
 function attach(G,render,output={}) {
  const form=document.getElementById('settings'),actions=document.getElementById('actions')||document.createElement('div');
  const destination=new URL(location.href);destination.search='';destination.hash='';form.action=destination.href;
  const read=()=>Object.fromEntries(Object.keys(G.defaults).map(k=>[k,form.elements.namedItem(k).value]));
  const title=G.title||document.querySelector('h1').textContent,slug=G.slug||location.pathname.split('/').filter(Boolean).filter(x=>x!=='index.html').at(-1);
  const track=(event,method)=>window.GalleryAnalytics?.track(event,method);
  const button=(id,text)=>{const b=document.createElement('button');b.type='button';b.id=id;b.textContent=text;return b;};
  const generation=document.createElement('fieldset');generation.className='generation-settings';
  const legend=document.createElement('legend');legend.textContent='生成の設定';generation.append(legend);
  const seed=form.elements.namedItem('seed');if(seed?.closest('.field'))generation.append(seed.closest('.field'));
  const row=document.createElement('div');row.className='button-row';
  for(const b of [document.getElementById('new-seed'),form.querySelector('button[type=reset]')])if(b)row.append(b);
  if(row.children.length===1)row.classList.add('single');generation.append(row);
  const generationStatus=document.getElementById('status');if(generationStatus)generation.append(generationStatus);
  document.getElementById('download')?.remove();form.querySelector('.save-note')?.remove();
  actions.id='actions';actions.className='studio-actions';
  const saveOpen=button('save-open','保存'),shareOpen=button('share-open','共有');saveOpen.className='primary';actions.replaceChildren(saveOpen,shareOpen);form.append(generation,actions);
  for(const empty of form.querySelectorAll('.button-row'))if(!empty.children.length)empty.remove();

  const dialog=document.createElement('dialog');dialog.id='studio-dialog';dialog.className='studio-dialog';dialog.setAttribute('aria-labelledby','dialog-title');
  dialog.innerHTML=`<header class="dialog-header"><h2 id="dialog-title"></h2><button type="button" id="dialog-close" aria-label="閉じる">閉じる</button></header>
   <section id="save-panel"><label for="save-format">保存形式</label><select id="save-format"><option value="png">PNG画像</option><option value="svg">SVG画像</option><option value="dxf">DXF</option></select>
   <label class="png-resolution" for="png-size">PNGのサイズ<select id="png-size"><option value="1600">標準（長辺1600px）</option><option value="2400">高解像度（長辺2400px）</option></select></label>
   <p class="dialog-note">PNGは画像として、SVGは設定も含めて、DXFはCADで編集できる線として保存できます。</p><button type="button" class="primary" id="download-file">ダウンロード</button><button type="button" id="copy-svg">SVGコードをコピー</button>
   <label id="svg-code-label" hidden>SVGコード（選択してコピーできます）<textarea id="svg-code" readonly rows="4"></textarea></label></section>
   <section id="share-panel" hidden><button type="button" id="copy-link">リンクをコピー</button><button type="button" id="share-native">端末でリンクを共有</button><button type="button" id="share-png">現在のPNGを共有</button>
   <nav class="social-links" aria-label="SNSでリンクを共有"></nav><label for="share-url">共有URL<textarea id="share-url" readonly rows="3"></textarea></label>
   <p class="dialog-note">リンクのカードは作品の固定プレビューです。調整した絵はPNGで保存・共有できます。</p></section><p id="dialog-status" role="status" aria-live="polite"></p>`;
  if(output.formats){
   const select=dialog.querySelector('#save-format');select.replaceChildren();
   for(const [value,label] of output.formats){const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option);}
   dialog.querySelector('#save-panel .dialog-note').textContent='PNGは現在の視点の画像、STLは立体の形状を保存します。';
  }
  document.body.append(dialog);
  const query=s=>dialog.querySelector(s),status=query('#dialog-status'),savePanel=query('#save-panel'),sharePanel=query('#share-panel'),format=query('#save-format'),size=query('#png-size'),download=query('#download-file'),imageShare=query('#share-png'),nativeShare=query('#share-native'),urlField=query('#share-url'),svgCode=query('#svg-code');
  query('#share-native').hidden=typeof navigator.share!=='function';
  const shareURL=()=>{if(output.shareURL)return output.shareURL(G.normalize(read()));const url=new URL(destination.href);url.pathname=url.pathname.replace(/index\.html$/,'');url.hash=encode(read(),G);return url.href;};
  const refreshURL=()=>{urlField.value=shareURL();};
  for(const [key,text]of [['x','X'],['line','LINE'],['facebook','Facebook']]){
   const b=button('share-'+key,text);b.dataset.social=key;
   const note=document.createElement('span');note.className='external-link-note';note.textContent='（新しいタブ）';b.append(note);query('.social-links').append(b);
   b.addEventListener('click',()=>{if(!dialog.open||dialog.dataset.mode!=='share')return;window.open(socialLinks(shareURL(),title)[key],'_blank','noopener,noreferrer');track('share_social',key);});
  }
  let busy=false,prepared=null,revision=0,session=0,copySequence=0,opener=null,locked=null;
  const imageKey=()=>JSON.stringify(G.normalize(read()))+'|'+size.value+'|'+(output.imageKey?.()||'');
  const active=token=>dialog.open&&session===token;
  const invalidatePNG=()=>{revision++;copySequence++;prepared=null;imageShare.textContent='現在のPNGを共有';query('#svg-code-label').hidden=true;svgCode.value='';if(dialog.open){refreshURL();status.textContent='';}};
  const syncBusy=()=>{download.disabled=imageShare.disabled=nativeShare.disabled=busy;};
  const finishBusy=token=>{busy=false;syncBusy();if(dialog.open&&session!==token&&status.textContent==='処理中です。')status.textContent=prepared?'PNGの準備ができました。ボタンを押して続けられます。':'もう一度操作を選んでください。';};
  const sizing=()=>dialog.style.setProperty('--dialog-height',Math.max(1,Math.floor(window.visualViewport?.height||innerHeight)-16)+'px');
  const release=()=>{
   if(locked){document.documentElement.style.overflow=locked.html;document.body.style.overflow=locked.body;scrollTo(0,locked.y);locked=null;}
   const target=opener;opener=null;target?.focus({preventScroll:true});
  };
  const close=()=>{if(!dialog.open)return;session++;copySequence++;dialog.close();release();};
  dialog.addEventListener('close',()=>{if(!dialog.open){session++;copySequence++;release();}});
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});query('#dialog-close').addEventListener('click',close);
  const outside=e=>{const r=dialog.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom;};
  let backdropDown=false;dialog.addEventListener('pointerdown',e=>{backdropDown=e.target===dialog&&outside(e);});
  dialog.addEventListener('click',e=>{if(backdropDown&&e.target===dialog&&outside(e))close();backdropDown=false;});
  dialog.addEventListener('keydown',e=>{
   if(e.key!=='Tab')return;
   const focusable=[...dialog.querySelectorAll('button,select,textarea,a[href],[tabindex]')].filter(n=>!n.disabled&&n.tabIndex>=0&&n.getClientRects().length);
   const first=focusable[0],last=focusable.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  });
  const updateFormat=()=>{query('.png-resolution').hidden=format.value!=='png';query('#copy-svg').hidden=format.value!=='svg';query('#svg-code-label').hidden=true;};
  const open=(mode,source)=>{
   if(dialog.open)return;session++;opener=source;dialog.dataset.mode=mode;savePanel.hidden=mode!=='save';sharePanel.hidden=mode!=='share';query('#dialog-title').textContent=mode==='save'?'保存':'共有';
   status.textContent=busy?'処理中です。':'';query('#svg-code-label').hidden=true;refreshURL();updateFormat();syncBusy();sizing();
   locked={html:document.documentElement.style.overflow,body:document.body.style.overflow,y:scrollY};document.documentElement.style.overflow='hidden';document.body.style.overflow='hidden';
   dialog.showModal();query('#dialog-close').focus();
  };
  saveOpen.addEventListener('click',()=>open('save',saveOpen));shareOpen.addEventListener('click',()=>open('share',shareOpen));
  addEventListener('resize',sizing);window.visualViewport?.addEventListener('resize',sizing);
  format.addEventListener('change',()=>{copySequence++;updateFormat();status.textContent='';});size.addEventListener('change',invalidatePNG);
  const save=(blob,name)=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);};
  const retryMessage=()=>{status.textContent=prepared?'PNGの準備ができました。もう一度「準備済みPNGを共有」を押してください。共有できない場合は保存とリンクコピーをご利用ください。':'設定が変わりました。現在のPNGをもう一度準備してください。';};
  const shareFile=async(file,token)=>{
   if(!active(token))return;
   try{
    if(!navigator.share||!navigator.canShare?.({files:[file]})){status.textContent='画像の共有に対応していません。保存とリンクコピーをご利用ください。';return;}
    if(navigator.userActivation?.isActive===false){retryMessage();return;}
    await navigator.share({files:[file],title});if(active(token)){status.textContent='PNGを共有しました。';track('share_image','png');}
   }catch(e){if(!active(token))return;if(e.name==='AbortError')status.textContent='共有をキャンセルしました。';else if(e.name==='NotAllowedError')retryMessage();else status.textContent='PNGを共有できませんでした。保存とリンクコピーをご利用ください。';}
  };
  // render() returns a promise while a heavy study is still computing; wait for it instead of computing synchronously.
  // The output is fixed at click time: if the settings change while waiting, the request is cancelled instead.
  const drawn=async()=>{const pending=render(),clicked=JSON.stringify(G.normalize(read()));if(pending){status.textContent='図形の計算を待っています。';await pending;}
   const same=JSON.stringify(G.normalize(read()))===clicked;if(!same)status.textContent='計算中に設定が変わったため、取り消しました。もう一度操作してください。';return same;};
  const withPNG=async action=>{
   if(busy||!dialog.open)return;busy=true;syncBusy();status.textContent='PNGを準備しています。';
   const token=session,version=revision;
   try{
    const key=imageKey(),edge=Number(size.value);if(!await drawn()||!active(token))return;status.textContent='PNGを準備しています。';const snapshot={key,svg:output.pngBlob?null:G.svg(G.normalize(read())),edge};
    let file=prepared?.key===snapshot.key?prepared.file:null;if(!file)file=new File([await (output.pngBlob?output.pngBlob(snapshot.edge):pngBlob(snapshot.svg,snapshot.edge))],slug+'.png',{type:'image/png'});
    if(version===revision&&imageKey()===snapshot.key){prepared={key:snapshot.key,file};imageShare.textContent='準備済みPNGを共有';}
    if(active(token))await action(file,token);
   }catch{if(active(token))status.textContent='PNGを作成できませんでした。ほかの保存形式やリンクコピーもご利用ください。';}
   finally{finishBusy(token);}
  };
  download.addEventListener('click',()=>{
   if(!dialog.open||dialog.dataset.mode!=='save'||busy)return;
   if(format.value==='png')withPNG(async(file,token)=>{if(!active(token))return;save(file,slug+'.png');status.textContent='PNGの保存を開始しました。';track('download_png','png');});
   else{const token=session,kind=format.value;busy=true;syncBusy();drawn().then(same=>{if(!same||!active(token))return;if(output.download){
     try{save(output.download(kind),slug+'.'+kind);status.textContent=kind.toUpperCase()+'の保存を開始しました。';}catch{status.textContent='保存できませんでした。';}return;
    }
    const svg=G.svg(G.normalize(read()));
    if(kind==='dxf'){try{save(new Blob([dxf(svg)],{type:'application/dxf'}),slug+'.dxf');status.textContent='DXFの保存を開始しました。';track('download_dxf','dxf');}catch{status.textContent='DXFを作成できませんでした。SVG保存もご利用ください。';}}
    else{save(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),slug+'.svg');status.textContent='SVGの保存を開始しました。';track('download_svg','svg');}}).finally(()=>finishBusy(token));}
  });
  imageShare.addEventListener('click',()=>{
   if(busy||!dialog.open||dialog.dataset.mode!=='share')return;const token=session;
   if(prepared?.key===imageKey()){busy=true;syncBusy();shareFile(prepared.file,token).finally(()=>finishBusy(token));}
   else withPNG(shareFile);
  });
  const copy=async(kind)=>{
   if(!dialog.open||dialog.dataset.mode!==(kind==='svg'?'save':'share'))return;
   // A link needs only the settings; SVG code waits for the drawing.
   const token=session,sequence=++copySequence;if(kind==='svg'){if(!await drawn())return;}else render();if(!active(token)||sequence!==copySequence)return;
   const version=revision,text=kind==='svg'?G.svg(G.normalize(read())):shareURL();
   if(kind==='url')urlField.value=text;
   try{if(!navigator.clipboard?.writeText)throw Error();await navigator.clipboard.writeText(text);if(active(token)&&version===revision&&sequence===copySequence){status.textContent=kind==='svg'?'SVGコードをコピーしました。':'共有URLをコピーしました。';if(kind==='url')track('share_link','copy');}}
   catch{if(!active(token)||version!==revision||sequence!==copySequence)return;const field=kind==='svg'?svgCode:urlField;if(kind==='svg')query('#svg-code-label').hidden=false;field.value=text;field.focus();field.select();status.textContent='自動コピーできませんでした。表示された内容を選択して手動でコピーしてください。';}
  };
  query('#copy-link').addEventListener('click',()=>copy('url'));query('#copy-svg').addEventListener('click',()=>copy('svg'));
  nativeShare.addEventListener('click',async()=>{if(busy||!dialog.open||dialog.dataset.mode!=='share')return;const token=session;busy=true;syncBusy();try{await navigator.share({title,url:shareURL()});if(active(token)){status.textContent='リンクを共有しました。';track('share_native','native');}}catch(e){if(active(token))status.textContent=e.name==='AbortError'?'共有をキャンセルしました。':'端末で共有できませんでした。リンクコピーをご利用ください。';}finally{finishBusy(token);}});
  form.addEventListener('input',invalidatePNG);form.addEventListener('change',invalidatePNG);form.addEventListener('reset',invalidatePNG);
  document.getElementById('new-seed')?.addEventListener('click',invalidatePNG);for(const preset of form.querySelectorAll('[data-preset]'))preset.addEventListener('click',invalidatePNG);
  const restore=()=>{
   if(output.shareURL||!location.hash.startsWith('#art='))return;invalidatePNG();
   try{const s=decode(location.hash,G);if(s){for(const[k,v]of Object.entries(s))form.elements.namedItem(k).value=v;const actual=G.normalize(read());if(Object.keys(s).some(k=>s[k]!==actual[k]))throw Error('この画面で扱えない設定のため、復元できません。');render();generationStatus.textContent='共有された図形・配色を復元しました。';}}
   catch(e){for(const[k,v]of Object.entries(G.defaults))form.elements.namedItem(k).value=v;render();generationStatus.textContent=e.message+' 初期設定を表示しています。';}
  };
  window.addEventListener('hashchange',restore);restore();
 }
 const api={decode,encode,attach,pngSize,pngBlob,dxf,socialLinks};
 if(typeof window!=='undefined')window.ArtShare=Object.freeze(api);
 if(typeof module!=='undefined')module.exports=api;
})();
