import * as M from './model.mjs';
import {createView} from './view.mjs';
const root=document.getElementById('conversation'),status=document.getElementById('status');
let input={...M.empty(),effect:'',relation:'',eventMeaning:'none',frequency:'',importance:''},step=0,view;
try{view=createView();}catch{status.textContent='この端末では立体を表示できません。制作入力の保存はできます。';}
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
function button(text,action,primary=false){const b=el('button',text,primary?'primary':'');b.type='button';b.onclick=()=>{try{action();}catch(e){status.textContent=e.message;}};return b;}
function go(next){step=next;status.textContent='';render();root.querySelector('h2').focus({preventScroll:true});root.scrollIntoView({block:'start'});}
function field(form,key,label,type,options){const l=el('label',label,'field'),control=document.createElement(type);control.id=key;control.name=key;if(type==='textarea'){control.maxLength=300;control.rows=2;}else{control.append(new Option('選んでください',''));for(const [value,text]of Object.entries(options))control.append(new Option(text,value));}control.value=input[key];l.append(control);form.append(l);return control;}
function row(...buttons){const e=el('div',null,'actions');e.append(...buttons);return e;}
function save(blob,name){const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function render(){
 document.body.classList.toggle('stage-final',step===3);document.body.classList.toggle('stage-start',step===0);root.replaceChildren();document.getElementById('progress').textContent=['1 / 4 · 話す','2 / 4 · 意味を確かめる','3 / 4 · 解釈を見る','4 / 4 · 作品'][step];
 const title=el('h2',['あなたにとって、大切なものは？','その答えは、あなたにとってどんな意味がありますか？','この受け取り方は、あなたに近いですか？','話したことが、かたちに。'][step]);title.id='question';title.tabIndex=-1;root.append(title);
 if(step===0){
  root.append(el('p','短い名前だけでも、架空の話でもかまいません。出来事は書かずに進められます。','note'));
  const examples=el('details');examples.append(el('summary','回答例で試す'));const choices=el('div',null,'examples');for(const example of M.examples)choices.append(button(example.name,()=>{input={...example.input};go(0);}));examples.append(choices);root.append(examples);
  const form=el('form',null,'input-form');const controls=[field(form,'favorite','好きなもの・好きな時間','textarea'),field(form,'value','大切にしていること','textarea'),field(form,'event','印象に残る出来事（任意）','textarea')];controls[0].required=controls[1].required=true;
  const next=el('button','つながりを話す','primary');next.type='submit';form.append(row(next));form.onsubmit=e=>{e.preventDefault();const next={...input};controls.forEach(c=>next[c.name]=c.value.normalize('NFC').trim());if(!next.favorite||!next.value){status.textContent='好きなものと大切なことを、短い言葉で教えてください。';return;}if(next.favorite!==input.favorite||next.value!==input.value){next.effect='';next.relation='';next.frequency='';next.importance='';}if(next.event!==input.event||next.value!==input.value)next.eventMeaning=next.event?'':'none';input=next;go(1);};root.append(form);
 }else if(step===1){
  const form=el('form',null,'input-form');
  field(form,'effect',`「${input.favorite}」は、どんな時間をもたらしますか？`,'select',M.effects).required=true;
  field(form,'frequency','日常の中で、どのくらい関わっていますか？','select',{1:'たまに思い出す',2:'ときどき触れる',3:'よく触れる',4:'ほぼ毎日触れる',5:'日々の支えになっている'}).required=true;
  field(form,'relation',`「${input.favorite}」と「${input.value}」は、どうつながっていますか？`,'select',M.relations).required=true;
  field(form,'importance',`「${input.value}」を、今どのくらい大切に感じていますか？`,'select',{1:'少し気になる',2:'気に留めている',3:'大切にしたい',4:'かなり大切',5:'欠かせない'}).required=true;
  if(input.event)field(form,'eventMeaning',`「${input.event}」は、「${input.value}」とどう結び付きますか？`,'select',M.events).required=true;
  form.addEventListener('change',e=>{input[e.target.name]=['frequency','importance'].includes(e.target.name)?Number(e.target.value):e.target.value;});
  const next=el('button','解釈とかたちを見る','primary');next.type='submit';form.append(row(button('回答へ戻る',()=>go(0)),next));form.append(button('近い選択肢がない',()=>{status.textContent='この試作で扱える意味は、ここにある選択肢までです。無理に選ぶ必要はありません。回答はこの画面に残ります。';}));form.onsubmit=e=>{e.preventDefault();try{input=M.validate(input);go(2);}catch(err){status.textContent=err.message;}};root.append(form);
 }else{
  const layout=el('div',null,'layout'),visual=el('div'),host=el('div',null,'interview-view');host.tabIndex=0;host.setAttribute('role','img');host.setAttribute('aria-label','回答の関係から組み立てた立体。矢印キーで回転、プラスとマイナスで拡大縮小');host.onkeydown=e=>view?.key(e);visual.append(host,el('p','ドラッグで回転・ピンチで拡大。キーボードでも操作できます。','hint'));const panel=el('div',null,'interpretation');for(const text of M.interpretation(input))panel.append(el('p',text));
  const rules=el('details',null,'rules');rules.open=step===2;rules.append(el('summary','答えと形のつながり'));for(const text of M.explanation(input).filter(Boolean))rules.append(el('p',text));rules.append(el('p','この表現は、この作品のために決めたルールです。性格や心理の診断ではありません。'));panel.append(rules);
  layout.append(visual,panel);root.append(layout);if(view)view.mount(host,input);else host.append(el('p','立体を表示できません。制作入力を保存して、別の端末で開けます。','note'));
  if(step===2)panel.append(row(button('意味を答え直す',()=>go(1)),button('この解釈で仕上げる',()=>go(3),true)));
  else{
   panel.append(row(button('制作入力と結果を保存',()=>{save(new Blob([M.save(input)],{type:'application/json'}),'meaning-art-input.json');status.textContent='制作入力と結果の保存を開始しました。';},true),button('STLを保存',()=>{if(!view)throw Error('この端末ではSTLを準備できません。');save(view.stl(input),'meaning-art.stl');status.textContent='STLの保存を開始しました。';}),button('画像を保存',()=>{const canvas=host.querySelector('canvas');if(!canvas)throw Error('この端末では画像を準備できません。');canvas.toBlob(blob=>{if(blob)save(blob,'meaning-art.png');else status.textContent='画像を保存できませんでした。';});}),button('解釈へ戻る',()=>go(2))));
   panel.append(el('p','保存した制作入力を開くと、同じルールで同じ形を再現できます。','note'));
  }
 }
 window.meaning={get input(){return {...input};},get step(){return step;},get result(){return step>=2?M.structure(input):null;},get camera(){return view?.camera;}};
}
document.getElementById('file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>12000)throw Error('制作入力のファイルが大きすぎます。');const next=M.load(await f.text());input=next;go(3);status.textContent='制作入力から形を再現しました。';}catch(err){status.textContent=err.message;}finally{e.target.value='';}};
render();
