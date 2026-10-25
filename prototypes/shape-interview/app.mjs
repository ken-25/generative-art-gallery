import * as M from './model.mjs';
import {createView} from './view.mjs';
const root=document.getElementById('conversation'),status=document.getElementById('status');let recipe=M.create(),view;
try{recipe=M.fromFragment(location.hash);}catch(e){status.textContent=e.message+' 最初から選べます。';}
try{view=createView(window.StudyGenerator,window.StudyCore);}catch{status.textContent='この端末では立体のプレビューを表示できません。別の端末でお試しください。';}
const button=(text,action,primary=false)=>{const b=document.createElement('button');b.type='button';b.textContent=text;if(primary)b.className='primary';b.addEventListener('click',()=>safe(action));return b;};
function safe(action){try{action();}catch(e){status.textContent=e.message;}}
function change(next,focusKey){const previousStep=recipe.step;recipe=M.validateRecipe(next);status.textContent='';render();const target=focusKey?root.querySelector('[data-lock='+focusKey+']'):root.querySelector('h2');target.focus({preventScroll:true});if(previousStep!==recipe.step||(!focusKey&&recipe.step===2))target.scrollIntoView({block:'start'});}
const summary=state=>M.features.map(key=>M.featureText(key,state)).join(' · ');
const held=()=>{const div=document.createElement('div');div.className='held';if(!recipe.locks.length){div.textContent='まだ特徴は固定していません。';return div;}const base=M.firstCandidates(recipe)[recipe.first];for(const key of recipe.locks){const span=document.createElement('span');span.textContent=`保持：${M.labels[key]} ${M.featureText(key,base)}`;div.append(span);}return div;};
const actions=()=>{const div=document.createElement('div');div.className='interview-actions';return div;};
function viewer(state){const host=document.createElement('div');host.className='interview-view';host.tabIndex=0;host.setAttribute('role','img');host.setAttribute('aria-label','選んだ立体。ドラッグや矢印キーで回転、プラスとマイナスで拡大・縮小');host.addEventListener('keydown',e=>view?.key(e));const hint=document.createElement('span');hint.className='view-hint';hint.textContent='ドラッグで回転・ピンチで拡大';host.append(hint);if(!view){const p=document.createElement('p');p.className='preview-error';p.textContent='立体のプレビューを表示できません。';host.append(p);}return {host,mount:()=>view?.mount(host,state)};}
function save(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function render(){
 root.replaceChildren();document.getElementById('progress').textContent=['1 / 4 · 最初の形','2 / 4 · 好きな特徴','3 / 4 · 比べて絞る','4 / 4 · 仕上げ'][recipe.step];
 const title=document.createElement('h2');title.id='question';title.tabIndex=-1;title.textContent=['まず、どの形に惹かれますか？','最初の形の、残したいところは？','好きなところを残して、比べましょう。','選んだ特徴から、この形に。'][recipe.step];root.append(title);
 const note=document.createElement('p');note.className='question-note';note.textContent=['正解はありません。近いものをひとつ選んでください。','残したい特徴を選んでください。あとで選び直せます。','保持した特徴はそのままに、六角形のずれ方も比べられます。','回して眺めたり、作品ページでさらに調整したりできます。'][recipe.step];root.append(note);
 if(recipe.step===0||recipe.step===2){
  if(recipe.step===2)root.append(held());const states=recipe.step===0?M.firstCandidates(recipe):M.candidates(recipe);let images=[];
  if(view){try{images=view.thumbnails(states);}catch{status.textContent='候補を表示できませんでした。レシピを開き直すか、別の端末でお試しください。';}}
  const cards=document.createElement('div');cards.className='candidates';
  states.forEach((state,index)=>{const card=button('',()=>change(recipe.step===0?M.chooseFirst(recipe,index):M.choose(recipe,index)));card.className='candidate';card.dataset.candidate=index;card.setAttribute('aria-pressed',String(index===(recipe.step===0?recipe.first:recipe.choice)));const img=document.createElement('img');if(images[index])img.src=images[index];img.alt=summary(state)+'の六角形の立体';const name=document.createElement('strong');name.textContent=recipe.step===0?['低く重ねる','ほどよく重ねる','高く重ねる'][index]:`候補 ${index+1}`;const detail=document.createElement('span');detail.textContent=summary(state);card.append(img,name,detail);cards.append(card);});root.append(cards);
  if(recipe.step===2){const row=actions();row.append(button('特徴を選び直す',()=>change(M.back(recipe))),button('別の候補を見る',()=>change(M.vary(recipe))));root.append(row);}
 }else{
  const state=M.selected(recipe),layout=document.createElement('div');layout.className='interview-layout';const {host,mount}=viewer(state),panel=document.createElement('div');layout.append(host,panel);root.append(layout);
  if(recipe.step===1){
   const locks=document.createElement('div');locks.className='lock-list';for(const key of M.features){const active=recipe.locks.includes(key),b=button('',()=>change(M.toggleLock(recipe,key),key));b.className='lock-choice';b.dataset.lock=key;b.setAttribute('aria-pressed',String(active));const label=document.createElement('strong');label.textContent=M.labels[key]+' '+M.featureText(key,state);const value=document.createElement('span');value.textContent=active?'保持中':'保持する';b.append(label,value);locks.append(b);}panel.append(locks);
   const row=actions();row.append(button('最初の形へ',()=>change(M.back(recipe))),button('次の候補を見る',()=>change(M.advance(recipe)),true));panel.append(row);
  }else{
   panel.append(held());const p=document.createElement('p');p.className='question-note';p.textContent=summary(state);panel.append(p);
   const row=actions();row.append(button('レシピを保存',()=>{save(new Blob([M.saveRecipe(recipe)],{type:'application/json'}),'nested-hexagons-recipe.json');status.textContent='レシピの保存を開始しました。';},true));
   const detail=document.createElement('a');detail.href=M.detailURL(recipe,location.href);detail.textContent='作品ページで仕上げる';row.append(detail);panel.append(row);
   const secondary=actions();secondary.append(button('候補へ戻る',()=>change(M.back(recipe))),button('リンクをコピー',async()=>{const url=new URL(location.href);url.hash=M.fragment(recipe);try{await navigator.clipboard.writeText(url.href);status.textContent='レシピのリンクをコピーしました。';}catch{status.textContent='コピーできませんでした。レシピを保存して開き直せます。';}}),button('STLを保存',()=>{if(!view)throw Error('この端末ではSTLを準備できません。作品ページをお試しください。');save(view.stl(state),'nested-hexagons.stl');status.textContent='STLの保存を開始しました。';}));panel.append(secondary);
   const memo=document.createElement('p');memo.className='recipe-note';memo.textContent='保存したレシピを開くと、同じ候補と形から再開できます。';panel.append(memo);
  }
  mount();
 }
 window.interview={get recipe(){return JSON.parse(M.saveRecipe(recipe));},get state(){return M.selected(recipe);},get candidates(){return recipe.step===0?M.firstCandidates(recipe):M.candidates(recipe);},get camera(){return view?.camera;}};
}
document.getElementById('recipe-file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>16384)throw Error('レシピのサイズが大きすぎます。');change(M.loadRecipe(await file.text()));status.textContent='レシピを読み込みました。';}catch(err){status.textContent=err.message;}finally{e.target.value='';}});
addEventListener('hashchange',()=>{if(location.hash.startsWith('#recipe='))safe(()=>change(M.fromFragment(location.hash)));});
document.querySelector('.skip').addEventListener('click',e=>{e.preventDefault();const main=document.getElementById('main');main.tabIndex=-1;main.focus();main.scrollIntoView();});render();
