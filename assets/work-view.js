/* One artwork route; archived generator-v1 fragments always open the original 2D UI. */
(() => {
 'use strict';
 const work=window.StudyGenerator.slug,spatial=['lorenz-orbit','octahedral-paths'];
 const selected=new URLSearchParams(location.search).get('view');
 const is3D=!location.hash.startsWith('#art=')&&(selected==='3d'||(!selected&&spatial.includes(work)));
 const navigation=document.createElement('nav');navigation.className='work-view';navigation.setAttribute('aria-label','作品の表示');
 for(const [mode,label] of [['2d','2D'],['3d','3D']]){
  const link=document.createElement('a'),url=new URL(location.href);url.search='';url.searchParams.set('view',mode);
  if(mode==='3d'||is3D)url.hash='';link.href=url.href;link.textContent=label;
  if((mode==='3d')===is3D)link.setAttribute('aria-current','page');navigation.append(link);
 }
 document.querySelector('.work-heading').after(navigation);
 window.ArtworkView={is3D,work};
 if(is3D){
  document.querySelector('.studio').classList.add('spatial-studio');
  addEventListener('hashchange',()=>{if(location.hash.startsWith('#art='))location.reload();});
  import('./sculpture.mjs').catch(()=>{
   const message=document.createElement('p');message.className='webgl-fallback';message.textContent='3D表示を読み込めませんでした。上の「2D」から作品を開けます。';
   document.getElementById('art').replaceChildren(message);
  });
 }
})();
