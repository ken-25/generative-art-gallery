/* A single page scroll, with a small preview that follows the visual viewport. */
(() => {
 'use strict';
 const studio=document.querySelector('.studio'),preview=studio?.querySelector('.paper-area'),controls=studio?.querySelector('.controls');
 if(!studio||!preview||!controls)return;
 const mobile=matchMedia('(max-width:900px)'),viewport=window.visualViewport;
 let frame;
 function update(){
  const height=viewport?.height||innerHeight,top=viewport?.offsetTop||0;
  studio.style.setProperty('--studio-preview-height',Math.min(300,Math.floor(height*.38))+'px');
  studio.style.setProperty('--studio-viewport-top',Math.max(0,top)+'px');
 }
 function reveal(){
  if(!mobile.matches||!controls.contains(document.activeElement))return;
  const field=document.activeElement;if(!field.matches('input,select,textarea,button,summary'))return;
  const minimum=preview.getBoundingClientRect().bottom+12,maximum=(viewport?.offsetTop||0)+(viewport?.height||innerHeight)-12;
  const block=(field.closest('.field,.png-resolution')||field).getBoundingClientRect();
  const rect=block.height<=maximum-minimum?block:field.getBoundingClientRect();
  if(rect.top<minimum)scrollBy(0,rect.top-minimum);
  else if(rect.bottom>maximum)scrollBy(0,rect.bottom-maximum);
 }
 function resize(){update();cancelAnimationFrame(frame);frame=requestAnimationFrame(reveal);}
 controls.addEventListener('focusin',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(reveal);});
 addEventListener('resize',resize);mobile.addEventListener('change',resize);
 viewport?.addEventListener('resize',resize);viewport?.addEventListener('scroll',update);
 update();
})();
