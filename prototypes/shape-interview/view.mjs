import * as T from '../../assets/vendor/three.module.js';
import {OrbitControls} from '../../assets/vendor/OrbitControls.js';
import {STLExporter} from '../../assets/vendor/STLExporter.js';
import {build,validate} from '../../assets/sculpture-geometry.mjs';
export function createView(G,C){
 const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);
 const scene=new T.Scene();scene.background=new T.Color('#e8eae1');scene.add(new T.HemisphereLight(0xffffff,0x53624c,3));
 const light=new T.DirectionalLight(0xffe9d2,4);light.position.set(80,150,100);scene.add(light);
 const camera=new T.PerspectiveCamera(38,4/3,.1,2000),controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;
 controls.minDistance=80;controls.maxDistance=500;let object,host,observer,lastKey;
 const dispose=()=>{if(!object)return;scene.remove(object);object.traverse(m=>{m.geometry?.dispose();m.material?.dispose();});object=null;};
 const shape=state=>{dispose();object=build(state,G,C);validate(object);scene.add(object);lastKey=JSON.stringify(state);};
 const reset=()=>{camera.position.set(160,110,180);controls.target.set(0,0,0);controls.update();};
 const resize=()=>{if(!host?.isConnected)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.render(scene,camera);};
 renderer.setAnimationLoop(()=>{if(host?.isConnected){controls.update();renderer.render(scene,camera);}});
 return {
  thumbnails(states){host=null;observer?.disconnect();return states.map(state=>{shape(state);reset();renderer.setSize(400,300);camera.aspect=4/3;camera.updateProjectionMatrix();renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');});},
  mount(element,state){host=element;observer?.disconnect();if(lastKey!==JSON.stringify(state)){shape(state);reset();}element.prepend(renderer.domElement);observer=new ResizeObserver(resize);observer.observe(element);resize();},
  stl(state){const model=build(state,G,C);try{validate(model);return new Blob([new STLExporter().parse(model,{binary:true})],{type:'model/stl'});}finally{model.traverse(m=>{m.geometry?.dispose();m.material?.dispose();});}},
  key(event){if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(event.key))return;event.preventDefault();const p=new T.Spherical().setFromVector3(camera.position);if(event.key==='ArrowLeft')p.theta-=.15;if(event.key==='ArrowRight')p.theta+=.15;if(event.key==='ArrowUp')p.phi-=.15;if(event.key==='ArrowDown')p.phi+=.15;if(['+','='].includes(event.key))p.radius*=.9;if(event.key==='-')p.radius*=1.1;p.makeSafe();p.radius=T.MathUtils.clamp(p.radius,80,500);camera.position.setFromSpherical(p);controls.update();},
  get camera(){return camera.position.toArray();}
 };
}
