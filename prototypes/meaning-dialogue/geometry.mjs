import * as T from '../../assets/vendor/three.module.js';
import {structure} from './model.mjs';
export function build(input){
 const s=structure(input),g=new T.Group(),material=new T.MeshStandardMaterial({color:'#8b7357',roughness:.62,metalness:.08});
 function mesh(geometry,position=[0,0,0],rotation=[0,0,0]){const m=new T.Mesh(geometry,material);m.position.set(...position);m.rotation.set(...rotation);g.add(m);return m;}
 function bridge(a,b,r=2.5){const start=new T.Vector3(...a),end=new T.Vector3(...b),d=end.clone().sub(start);const m=mesh(new T.CylinderGeometry(r,r,d.length(),16),start.clone().add(end).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());}
 const distance=s.relationship==='tension'?38:26;
 mesh(new T.SphereGeometry(s.coreRadius,28,20),[-distance,0,0]);
 for(let i=0;i<s.layers;i++){
  const y=(i-(s.layers-1)/2)*6;
  const center=s.motif==='explore'?[distance+i*2,y,i*2]:[distance,y,0];
  const ring=mesh(new T.TorusGeometry(16+i*.9,2,12,64),center,[Math.PI/2,0,s.motif==='explore'?i*.2:0]);
  if(s.motif==='connect')ring.rotation.x+=i%2?Math.PI/3:-Math.PI/3;
 }
 if(s.relationship==='support')bridge([-distance,0,0],[distance,0,0],3.5);
 if(s.relationship==='tension'){bridge([-distance,0,0],[-6,16,0]);bridge([distance,0,0],[6,-16,0]);}
 if(s.relationship==='alternate')mesh(new T.TorusGeometry(distance,2.8,12,80),[0,0,0],[Math.PI/2,0,0]).scale.x=1.35;
 if(s.arms===1)bridge([-distance,0,0],[-distance,40,0],3);
 if(s.arms===2){bridge([-distance,0,0],[-distance,25,0],3);bridge([-distance,25,0],[-distance-18,43,0]);bridge([-distance,25,0],[-distance+18,43,0]);}
 g.updateMatrixWorld(true);return g;
}
export function validate(group){let count=0;group.traverse(m=>{if(!m.isMesh)return;const a=m.geometry.getAttribute('position');for(const n of a.array)if(!Number.isFinite(n))throw Error('形を組み立てられませんでした。');count+=a.count;});if(!count)throw Error('形を組み立てられませんでした。');return count;}
