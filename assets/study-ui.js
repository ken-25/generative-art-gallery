(() => {
 'use strict';
 const G=window.StudyGenerator,form=document.getElementById('settings'),art=document.getElementById('art'),status=document.getElementById('status');
 for(const [key,value] of Object.entries(G.defaults)){
  const div=document.createElement('div');div.className='field';const label=document.createElement('label');label.htmlFor=key;label.textContent=key==='seed'?'シード':G.schema[key].label;
  let input;
  if(key==='seed'){input=document.createElement('input');input.type='text';input.maxLength=80;}
  else if(G.schema[key].options){input=document.createElement('select');for(const [v,text] of Object.entries(G.schema[key].options)){const option=document.createElement('option');option.value=v;option.textContent=text;input.append(option);}}
  else{input=document.createElement('input');input.type='number';for(const k of ['min','max','step'])input[k]=G.schema[key][k];}
  input.name=key;input.id=key;input.value=value;input.defaultValue=value;
  if(input.tagName==='SELECT')for(const option of input.options)option.defaultSelected=option.value===value;
  div.append(label,input);form.insertBefore(div,form.firstElementChild?.id==='actions'?form.firstElementChild:document.getElementById('actions'));
 }
 let current=G.defaults,frame;
 const read=()=>Object.fromEntries(Object.keys(G.defaults).map(k=>[k,form.elements.namedItem(k).value]));
 const sync=()=>{for(const [k,v]of Object.entries(current))form.elements.namedItem(k).value=v;};
 function render(){current=G.normalize(read());art.innerHTML=G.svg(current);}
 form.addEventListener('submit',e=>e.preventDefault());
 form.addEventListener('input',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(render);});
 form.addEventListener('change',()=>{render();sync();});
 form.addEventListener('reset',()=>{cancelAnimationFrame(frame);requestAnimationFrame(()=>{current=G.defaults;sync();render();status.textContent='初期設定に戻しました。';});});
 document.getElementById('download').addEventListener('click',()=>{render();sync();const url=URL.createObjectURL(new Blob([G.svg(current)],{type:'image/svg+xml;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=G.slug+'.svg';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);status.textContent='SVGの保存を開始しました。';});
 render();ArtShare.attach(G,render);
})();
