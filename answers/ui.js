(() => {
 'use strict';
 const G=window.AnswerArt,form=document.getElementById('settings'),art=document.getElementById('art'),reading=document.getElementById('reading'),status=document.getElementById('status');
 const read=()=>Object.fromEntries(Object.keys(G.defaults).map(k=>[k,form.elements.namedItem(k).value]));
 function render(){
  const s=G.normalize(read());
  for(const [k,v]of Object.entries(s))form.elements.namedItem(k).value=v;
  art.innerHTML=G.svg(s);reading.textContent=G.explain(s);
 }
 form.addEventListener('submit',e=>e.preventDefault());
 form.addEventListener('input',()=>{render();status.textContent='選んだ答えで描きました。';});
 form.addEventListener('change',render);
 form.addEventListener('reset',()=>{
  // Native reset occurs after this event, as in the existing studio UI.
  requestAnimationFrame(()=>{render();status.textContent='最初の答えに戻しました。もう一度選んでみてください。';});
 });
 render();window.ArtShare.attach(G,render);
})();
