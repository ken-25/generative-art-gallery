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
 function socialLinks(url,title) {
  const result={};for(const [key,base,param]of [['x','https://twitter.com/intent/tweet','url'],['line','https://social-plugins.line.me/lineit/share','url'],['facebook','https://www.facebook.com/sharer/sharer.php','u']]){
   const link=new URL(base);link.searchParams.set(param,url);if(key==='x')link.searchParams.set('text',title);result[key]=link.href;
  }return result;
 }
 function attach(G,render) {
  const form=document.getElementById('settings'),actions=document.getElementById('actions')||document.createElement('div');
  const destination=new URL(location.href);destination.search='';destination.hash='';form.action=destination.href;
  const read=()=>Object.fromEntries(Object.keys(G.defaults).map(k=>[k,form.elements.namedItem(k).value]));
  const title=G.title||document.querySelector('h1').textContent,slug=G.slug||location.pathname.split('/').filter(Boolean).filter(x=>x!=='index.html').at(-1);
  const track=(event,method)=>window.GalleryAnalytics?.track(event,method);
  const button=(id,text)=>{const b=document.createElement('button');b.type='button';b.id=id;b.textContent=text;return b;};
  const generation=document.createElement('fieldset');generation.className='generation-settings';
  const legend=document.createElement('legend');legend.textContent='生成の設定';generation.append(legend);
  const seed=form.elements.namedItem('seed');if(seed)generation.append(seed.closest('.field'));
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
   <section id="save-panel"><label for="save-format">保存形式</label><select id="save-format"><option value="png">PNG画像</option><option value="svg">SVG画像</option></select>
   <label class="png-resolution" for="png-size">PNGのサイズ<select id="png-size"><option value="1600">標準（長辺1600px）</option><option value="2400">高解像度（長辺2400px）</option></select></label>
   <p class="dialog-note">PNGは画像として、SVGは設定も含めて保存できます。</p><button type="button" class="primary" id="download-file">ダウンロード</button><button type="button" id="copy-svg">SVGコードをコピー</button>
   <label id="svg-code-label" hidden>SVGコード（選択してコピーできます）<textarea id="svg-code" readonly rows="4"></textarea></label></section>
   <section id="share-panel" hidden><button type="button" id="copy-link">リンクをコピー</button><button type="button" id="share-native">端末でリンクを共有</button><button type="button" id="share-png">現在のPNGを共有</button>
   <nav class="social-links" aria-label="SNSでリンクを共有"></nav><label for="share-url">共有URL<textarea id="share-url" readonly rows="3"></textarea></label>
   <p class="dialog-note">リンクのカードは作品の固定プレビューです。調整した絵はPNGで保存・共有できます。</p></section><p id="dialog-status" role="status" aria-live="polite"></p>`;
  document.body.append(dialog);
  const query=s=>dialog.querySelector(s),status=query('#dialog-status'),savePanel=query('#save-panel'),sharePanel=query('#share-panel'),format=query('#save-format'),size=query('#png-size'),download=query('#download-file'),imageShare=query('#share-png'),nativeShare=query('#share-native'),urlField=query('#share-url'),svgCode=query('#svg-code');
  query('#share-native').hidden=typeof navigator.share!=='function';
  const shareURL=()=>{const url=new URL(destination.href);url.pathname=url.pathname.replace(/index\.html$/,'');url.hash=encode(read(),G);return url.href;};
  const refreshURL=()=>{urlField.value=shareURL();};
  for(const [key,text]of [['x','X'],['line','LINE'],['facebook','Facebook']]){
   const b=button('share-'+key,text);b.dataset.social=key;
   const note=document.createElement('span');note.className='external-link-note';note.textContent='（新しいタブ）';b.append(note);query('.social-links').append(b);
   b.addEventListener('click',()=>{if(!dialog.open||dialog.dataset.mode!=='share')return;window.open(socialLinks(shareURL(),title)[key],'_blank','noopener,noreferrer');track('share_social',key);});
  }
  let busy=false,prepared=null,revision=0,session=0,copySequence=0,opener=null,locked=null;
  const imageKey=()=>JSON.stringify(G.normalize(read()))+'|'+size.value;
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
    const key=imageKey(),edge=Number(size.value);if(!await drawn()||!active(token))return;status.textContent='PNGを準備しています。';const snapshot={key,svg:G.svg(G.normalize(read())),edge};
    let file=prepared?.key===snapshot.key?prepared.file:null;if(!file)file=new File([await pngBlob(snapshot.svg,snapshot.edge)],slug+'.png',{type:'image/png'});
    if(version===revision&&imageKey()===snapshot.key){prepared={key:snapshot.key,file};imageShare.textContent='準備済みPNGを共有';}
    if(active(token))await action(file,token);
   }catch{if(active(token))status.textContent='PNGを作成できませんでした。SVG保存やリンクコピーもご利用ください。';}
   finally{finishBusy(token);}
  };
  download.addEventListener('click',()=>{
   if(!dialog.open||dialog.dataset.mode!=='save'||busy)return;
   if(format.value==='png')withPNG(async(file,token)=>{if(!active(token))return;save(file,slug+'.png');status.textContent='PNGの保存を開始しました。';track('download_png','png');});
   else{const token=session;busy=true;syncBusy();drawn().then(same=>{if(!same||!active(token))return;save(new Blob([G.svg(G.normalize(read()))],{type:'image/svg+xml;charset=utf-8'}),slug+'.svg');status.textContent='SVGの保存を開始しました。';track('download_svg','svg');}).finally(()=>finishBusy(token));}
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
   if(!location.hash.startsWith('#art='))return;invalidatePNG();
   try{const s=decode(location.hash,G);if(s){for(const[k,v]of Object.entries(s))form.elements.namedItem(k).value=v;const actual=G.normalize(read());if(Object.keys(s).some(k=>s[k]!==actual[k]))throw Error('この画面で扱えない設定のため、復元できません。');render();generationStatus.textContent='共有された図形・配色を復元しました。';}}
   catch(e){for(const[k,v]of Object.entries(G.defaults))form.elements.namedItem(k).value=v;render();generationStatus.textContent=e.message+' 初期設定を表示しています。';}
  };
  window.addEventListener('hashchange',restore);restore();
 }
 const api={decode,encode,attach,pngSize,pngBlob,socialLinks};
 if(typeof window!=='undefined')window.ArtShare=Object.freeze(api);
 if(typeof module!=='undefined')module.exports=api;
})();
