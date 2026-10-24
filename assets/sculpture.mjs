import * as T from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {STLExporter} from './vendor/STLExporter.js';
import {build,validate} from './sculpture-geometry.mjs';
import {profiles,defaultsFor,normalizeFor} from './sculpture-settings.mjs';

const {work}=window.ArtworkView,G=window.StudyGenerator;
const art=document.getElementById('art'),form=document.getElementById('settings');
const defaults=normalizeFor(work,defaultsFor(work)),normalize=input=>normalizeFor(work,input);
let state=normalize(Object.fromEntries(new URLSearchParams(location.search))),object,drawnKey;
form.replaceChildren();
const fields=new Map();
for(const f of [...profiles[work],{key:'color',label:'色',help:'立体の色を変えます。'}]){
 const div=document.createElement('div');div.className='field';div.dataset.control=f.key;
 const label=document.createElement('label');label.htmlFor='sculpture-'+f.key;label.textContent=f.label;
 const input=document.createElement('input');input.name=f.key;input.id=label.htmlFor;input.type=f.key==='color'?'color':'range';
 if(input.type==='range')for(const k of ['min','max','step'])input[k]=f[k];
 const output=document.createElement('output');output.htmlFor=input.id;label.append(output);
 const help=document.createElement('p');help.id=input.id+'-help';help.textContent=f.help;input.setAttribute('aria-describedby',help.id);
 div.append(label,input,help);form.append(div);fields.set(f.key,{input,output,definition:f});
}
for(const key of Object.keys(defaults))if(!fields.has(key)){
 const input=document.createElement('input');input.type='hidden';input.name=key;form.append(input);fields.set(key,{input});
}
const reset=document.createElement('button');reset.type='reset';reset.textContent='設定をリセット';
const actions=document.createElement('div');actions.id='actions';actions.append(reset);
const status=document.createElement('p');status.id='status';status.setAttribute('role','status');actions.append(status);form.append(actions);
const sync=()=>{for(const [key,{input,output,definition}] of fields){input.value=state[key];if(output){output.value=definition.display?definition.display(state[key]):state[key];if(input.type==='range')input.setAttribute('aria-valuetext',output.value);}}};
const read=()=>Object.fromEntries([...fields].map(([key,{input}])=>[key,input.value]));
sync();
art.replaceChildren();art.classList.add('sculpture-art');
const canvas=document.createElement('div');canvas.className='sculpture-canvas';canvas.tabIndex=0;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','3D作品。矢印キーで回転、プラスとマイナスで拡大・縮小');art.append(canvas);
const hint=document.createElement('p');hint.className='operation-hint';hint.textContent='ドラッグで回転・ホイールやピンチで拡大';art.after(hint);
const viewReset=document.createElement('button');viewReset.type='button';viewReset.className='view-reset';viewReset.textContent='視点を戻す';art.append(viewReset);
const scene=new T.Scene();scene.background=new T.Color('#e8eae1');
const camera=new T.PerspectiveCamera(38,1,.1,2000);camera.position.set(160,110,180);
scene.add(new T.HemisphereLight(0xffffff,0x53624c,3));const light=new T.DirectionalLight(0xffe9d2,4);light.position.set(80,150,100);scene.add(light);
let renderer,controls;
try{
 renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));canvas.append(renderer.domElement);
 controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=40;controls.maxDistance=600;controls.update();controls.saveState();
}catch{
 canvas.innerHTML='<p class="webgl-fallback">この端末では3D表示を開始できませんでした。上の「2D」から作品を開けます。</p>';viewReset.disabled=true;
}
function dispose(){if(!object)return;scene.remove(object);object.traverse(m=>{m.geometry?.dispose();m.material?.dispose();});}
function render(){
 state=normalize(read());sync();const key=JSON.stringify(state);if(key===drawnKey)return;
 try{const next=build(state,G,window.StudyCore);validate(next);dispose();object=next;scene.add(object);drawnKey=key;art.removeAttribute('aria-busy');status.textContent='';}
 catch{art.setAttribute('aria-busy','true');status.textContent='形状を生成できませんでした。設定をリセットしてお試しください。';}
}
form.addEventListener('submit',e=>e.preventDefault());
form.addEventListener('input',render);form.addEventListener('change',render);
form.addEventListener('reset',e=>{e.preventDefault();state={...defaults};sync();render();status.textContent='設定を初期値に戻しました。';});
viewReset.addEventListener('click',()=>controls?.reset());
canvas.addEventListener('keydown',e=>{
 if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(e.key)||!controls)return;e.preventDefault();
 // Stop residual drag damping before applying a keyboard step.
 controls.update();const spherical=new T.Spherical().setFromVector3(camera.position);
 if(e.key==='ArrowLeft')spherical.theta-=.15;if(e.key==='ArrowRight')spherical.theta+=.15;
 if(e.key==='ArrowUp')spherical.phi-=.15;if(e.key==='ArrowDown')spherical.phi+=.15;
 if(['+','='].includes(e.key))spherical.radius*=.9;if(e.key==='-')spherical.radius*=1.1;
 spherical.makeSafe();spherical.radius=T.MathUtils.clamp(spherical.radius,40,600);camera.position.setFromSpherical(spherical);controls.update();
});
if(renderer){
 const resize=()=>{const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};
 new ResizeObserver(resize).observe(canvas);resize();renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
}
render();
const model={defaults,normalize,slug:work,title:G.title};
window.ArtShare.attach(model,render,{
 formats:[['png','PNG画像'],['stl','STL']],
 shareURL:s=>{const url=new URL(location.href);url.pathname=url.pathname.replace(/index\.html$/,'');url.search=new URLSearchParams({view:'3d',...s});url.hash='';return url.href;},
 imageKey:()=>camera.position.toArray().join(',')+'|'+camera.quaternion.toArray().join(',')+'|'+camera.aspect,
 download:kind=>{if(kind!=='stl'||art.hasAttribute('aria-busy'))throw Error('No geometry');validate(object);return new Blob([new STLExporter().parse(object,{binary:true})],{type:'model/stl'});},
 pngBlob:async edge=>{
  if(!renderer||art.hasAttribute('aria-busy'))throw Error('No rendering');
  const oldSize=renderer.getSize(new T.Vector2()),ratio=renderer.getPixelRatio(),aspect=camera.aspect;
  const scale=edge/Math.max(oldSize.x,oldSize.y);renderer.setPixelRatio(1);renderer.setSize(Math.round(oldSize.x*scale),Math.round(oldSize.y*scale),false);renderer.render(scene,camera);
  try{return await new Promise((resolve,reject)=>renderer.domElement.toBlob(b=>b?resolve(b):reject(Error('No PNG'))));}
  finally{renderer.setPixelRatio(ratio);renderer.setSize(oldSize.x,oldSize.y,false);camera.aspect=aspect;camera.updateProjectionMatrix();}
 }
});
window.sculpture={get state(){return {...state};},get object(){return object;},get camera(){return camera;},validate:()=>validate(object)};
