/* Shared presentation; generator v1 normalization and geometry stay unchanged. */
(() => {
 'use strict';
 const G=window.StudyGenerator,form=document.getElementById('settings'),art=document.getElementById('art'),status=document.getElementById('status');
 const actions=document.getElementById('actions'),fields=new Map(),groups=new Map();
 for(const [key,value] of Object.entries(G.defaults)){
  const rule=G.schema[key]||{},definition=StudyControls.definition(G,key);
  const div=document.createElement('div');div.className='field';div.dataset.control=key;
  const label=document.createElement('label');label.htmlFor=key;label.append(document.createTextNode(definition.label));
  let input=document.createElement('input'),output;
  if(key==='seed'){input.type='text';input.maxLength=80;}
  else if(rule.options){input=document.createElement('select');for(const [v,text] of Object.entries(rule.options)){const option=document.createElement('option');option.value=v;option.textContent=text;option.defaultSelected=v===value;input.append(option);}}
  else{input.type=definition.control;for(const k of ['min','max','step'])input[k]=rule[k];output=document.createElement('output');output.id=key+'-value';output.htmlFor=key;label.append(output);}
  input.name=key;input.id=key;input.value=value;if(input.tagName==='INPUT')input.defaultValue=value;
  const help=document.createElement('p');help.id=key+'-help';help.textContent=definition.help;input.setAttribute('aria-describedby',help.id);div.append(label,input,help);
  let container=form;
  if(definition.group){if(!groups.has(definition.group)){const group=document.createElement('fieldset'),legend=document.createElement('legend');group.className='control-group';legend.textContent=definition.group;group.append(legend);const details=document.createElement('details'),summary=document.createElement('summary');details.className='control-details';summary.textContent=definition.group;details.append(summary,group);form.insertBefore(details,actions);groups.set(definition.group,group);}container=groups.get(definition.group);}
  if(container===form)form.insertBefore(div,actions);else container.append(div);
  fields.set(key,{input,output,div,definition});
 }
 let current=G.defaults,frame,job,jobKey,waiting=[];
 const caption=document.createElement('p');caption.id='art-note';caption.className='art-note';caption.setAttribute('role','status');if(G.note)form.before(caption);
 const show=s=>{art.innerHTML=G.svg(s);art.removeAttribute('aria-busy');if(G.note)caption.textContent=G.note(s);for(const resolve of waiting.splice(0))resolve();};
 // Resolves once the latest settings are drawn, so exports never compute a whole result synchronously.
 const drawn=()=>new Promise(resolve=>waiting.push(resolve));
 // Heavy studies compute in short chunks between frames; a newer setting cancels the old job so it never overwrites the view.
 function compute(s){
  const key=JSON.stringify(s);if(job&&jobKey===key)return drawn();
  job?.cancel();job=G.task?.(s);jobKey=key;if(!job){show(s);return;}
  const mine=job;art.setAttribute('aria-busy','true');if(G.note)caption.textContent='計算中…';
  const run=()=>{if(job!==mine)return;const end=performance.now()+12;let done=false;while(!done&&performance.now()<end)done=mine.step();if(job!==mine)return;if(done){job=null;show(s);}else setTimeout(run,0);};
  const result=drawn();run();return result;
 }
 const read=()=>Object.fromEntries([...fields].map(([k,{input}])=>[k,input.value]));
 const sync=()=>{for(const [k,{input}]of fields)input.value=current[k];};
 function render(){
  current=G.normalize(read());const pending=compute(current);
  for(const [key,{input,output,div,definition}]of fields){if(output)output.value=current[key]+definition.unit;const active=!definition.active||definition.active(current);div.hidden=!active;input.disabled=!active;}
  for(const group of groups.values())group.parentElement.hidden=![...group.querySelectorAll('.field')].some(f=>!f.hidden);
  return pending;
 }
 form.addEventListener('submit',e=>e.preventDefault());
 form.addEventListener('input',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(render);status.textContent='';});
 form.addEventListener('change',()=>{render();sync();});
 form.addEventListener('reset',()=>{cancelAnimationFrame(frame);requestAnimationFrame(()=>{current=G.defaults;sync();render();status.textContent='初期設定に戻しました。';});});
 if('seed' in G.defaults){const seed=document.createElement('button');seed.type='button';seed.id='new-seed';seed.textContent='別のシード';actions.prepend(seed);seed.addEventListener('click',()=>{const input=fields.get('seed').input,previous=input.value;input.value='s-'+Array.from(crypto.getRandomValues(new Uint32Array(2)),n=>n.toString(36)).join('-');if(input.value===previous)input.value+='-next';render();sync();status.textContent='新しいシードで生成しました。';});}
 document.getElementById('download').addEventListener('click',()=>{render();sync();const url=URL.createObjectURL(new Blob([G.svg(current)],{type:'image/svg+xml;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=G.slug+'.svg';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);status.textContent='SVGの保存を開始しました。';});
 render();ArtShare.attach(G,render);
})();
