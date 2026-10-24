import {defaults,normalize} from './sculpture-geometry.mjs';

// Only expose controls that affect this artwork. Geometry v1 remains unchanged.
const field=(key,label,help,min,max,step,display=value=>String(value))=>({key,label,help,min,max,step,display});
const thickness=field('thickness','線の太さ','立体を構成する線の太さです。',.5,3,.1);
export const profiles={
 'lorenz-orbit':[
  field('amount','ρ（軌道の形）','値を変えると、軌道が通る範囲と輪の形が変わります。',8,80,2,v=>String(22+v/4)),
  field('spread','奥行き','軌道の奥行き方向の倍率を変えます。',8,80,4,v=>(.8+v/40).toFixed(1)+'倍'),thickness],
 'octahedral-paths':[
  field('amount','立体の数','辺を組み合わせた立体を縦に並べます。',12,72,12,v=>String(Math.round(v/12))),
  field('spread','立体ごとの回転角','隣り合う立体の向きを少しずつ変えます。',8,80,1,v=>(v*.04*180/Math.PI).toFixed(0)+'°'),thickness],
 'nested-hexagons':[
  field('amount','重ねる層数','六角形の層を増減します。',12,66,6,v=>String(Math.round(v/6)+3)),
  field('spread','回転のゆらぎ','各層の六角形の向きが変わる範囲です。',8,45,1,v=>v+'°')],
 'voronoi-relaxation':[
  field('amount','母点の数','領域を分ける基準になる点の数です。',8,80,1),
  field('spread','領域の高さの差','大きくすると、領域ごとの高低差が広がります。',8,80,1)],
 'branching-rules':[
  field('amount','枝分かれの回数','枝を繰り返し分ける回数です。',12,60,12,v=>String(Math.round(v/12)+2)),
  field('spread','枝の開き','枝分かれの角度と奥行きへの広がりを変えます。',8,80,1),thickness]
};
export const defaultsFor=work=>({...defaults,work,...(work==='lorenz-orbit'?{amount:24,thickness:.7}: {})});
export function normalizeFor(work,input={}){
 const state=normalize({...defaultsFor(work),...input,work});
 for(const f of profiles[work])state[f.key]=Number(Math.min(f.max,Math.max(f.min,f.min+Math.round((state[f.key]-f.min)/f.step)*f.step)).toFixed(6));
 return state;
}
