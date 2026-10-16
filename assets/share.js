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
 function attach(G,render) {
  const form=document.getElementById('settings');
  const box=document.createElement('div');
  const button=document.createElement('button');button.type='button';button.textContent='この絵を共有';
  const label=document.createElement('label');label.textContent='共有URL（選択してコピーできます）';label.hidden=true;
  const field=document.createElement('textarea');field.readOnly=true;field.rows=4;field.className='share-url';label.append(field);
  const message=document.createElement('p');message.setAttribute('role','status');
  box.className='share-controls';button.className='share-button';field.setAttribute('aria-label','共有URL');
  box.append(button,label,message);
  // One action layout for both hand-authored works and schema-based studies.
  const actions=document.getElementById('actions')||document.createElement('div');actions.id='actions';actions.className='studio-actions';
  const row=document.createElement('div');row.className='button-row';
  for(const control of [document.getElementById('new-seed'),form.querySelector('button[type=reset]')])if(control)row.append(control);
  if(row.children.length===1)row.classList.add('single');
  const download=document.getElementById('download');download.classList.add('primary');download.textContent='SVGを保存';
  const status=document.getElementById('status');status.setAttribute('aria-live','polite');
  const note=form.querySelector('.save-note')||document.createElement('p');note.className='save-note';note.textContent='拡大できるSVG画像に、設定も一緒に保存します。';
  actions.append(row,download,box,note,status);form.append(actions);
  for(const empty of form.querySelectorAll('.button-row'))if(!empty.children.length)empty.remove();
  const clear=()=>{field.value='';label.hidden=true;message.textContent='';};
  form.addEventListener('reset',clear);form.addEventListener('input',clear);
  document.getElementById('new-seed')?.addEventListener('click',clear);
  for(const preset of form.querySelectorAll('[data-preset]'))preset.addEventListener('click',clear);
  const read=()=>Object.fromEntries(Object.keys(G.defaults).map(k=>[k,form.elements.namedItem(k).value]));
  const restore=()=>{
   // Ordinary page anchors must never change the drawing or form.
   if(!location.hash.startsWith('#art=')) return;
   try {
    const s=decode(location.hash,G);
    if(s){for(const [k,v] of Object.entries(s)) form.elements.namedItem(k).value=v;const actual=G.normalize(read());if(Object.keys(s).some(k=>actual[k]!==s[k]))throw Error('この画面で扱えない設定のため、復元できません。');render();message.textContent='共有された図形・配色を復元しました。';}
   } catch(e){message.textContent=e.message+' 初期設定を表示しています。';for(const [k,v] of Object.entries(G.defaults))form.elements.namedItem(k).value=v;render();}
  };
  button.addEventListener('click',async()=>{
   const url=new URL(location.href);url.search='';url.hash='';url.pathname=url.pathname.replace(/index\.html$/,'');
   url.hash=encode(read(),G);field.value=url.href;label.hidden=false;
   try {if(!navigator.clipboard?.writeText)throw Error();await navigator.clipboard.writeText(url.href);message.textContent='共有URLをコピーしました。';}
   catch {field.focus();field.select();message.textContent='自動コピーできませんでした。URLを選択して手動でコピーしてください。';}
  });
  window.addEventListener('hashchange',restore);restore();
 }
 const api={decode,encode,attach};
 if(typeof window!=='undefined')window.ArtShare=Object.freeze(api);
 if(typeof module!=='undefined')module.exports=api;
})();
