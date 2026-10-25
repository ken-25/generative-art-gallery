import {normalizeFor,defaultsFor} from '../../assets/sculpture-settings.mjs';
export const work='nested-hexagons';
export const features=['amount','spread','color'];
export const labels={amount:'重なり',spread:'ひねりの幅',color:'色'};
const colors=['#b27352','#527565','#495b75'];
export const colorName=value=>({ '#b27352':'土色','#527565':'深緑','#495b75':'青灰色' }[value]||value);
export const featureText=(key,state)=>key==='amount'?`${Math.round(state.amount/6)+3}層`:key==='spread'?`${state.spread}°`:colorName(state.color);
export const create=(seed='interview-001')=>({format:1,work,generator:1,seed,first:null,locks:[],round:0,choice:null,step:0});
const normalize=s=>normalizeFor(work,s);
function derivedSeed(seed,suffix){let hash=2166136261;for(const c of seed+':'+suffix)hash=Math.imul(hash^c.codePointAt(0),16777619)>>>0;return 'interview-'+hash.toString(36)+'-'+suffix;}
export function firstCandidates(recipe){return [18,42,66].map((amount,i)=>normalize({...defaultsFor(work),amount,spread:[12,26,42][i],seed:derivedSeed(recipe.seed,'first-'+i)}));}
export function candidates(recipe){
 if(recipe.first===null)return firstCandidates(recipe);
 const base=firstCandidates(recipe)[recipe.first];
 return [-1,0,1].map((direction,i)=>{
  const next=normalize({...base,amount:base.amount+direction*(12+6*(recipe.round%2)),spread:base.spread+direction*12,color:colors[(i+recipe.round)%colors.length],seed:derivedSeed(recipe.seed,'round-'+recipe.round+'-candidate-'+i)});
  for(const key of recipe.locks)next[key]=base[key];return next;
 });
}
export const selected=recipe=>recipe.first===null?null:(recipe.step===1||recipe.choice===null)?firstCandidates(recipe)[recipe.first]:candidates(recipe)[recipe.choice];
export function chooseFirst(recipe,index){
 if(![0,1,2].includes(index))throw Error('候補を選び直してください。');
 return {...recipe,first:index,step:1,...(recipe.first===index?{}:{locks:[],round:0,choice:null})};
}
export function toggleLock(recipe,key){
 if(recipe.first===null||!features.includes(key))throw Error('保持する特徴を確認してください。');
 return {...recipe,locks:features.filter(k=>k===key?!recipe.locks.includes(k):recipe.locks.includes(k)),choice:null,round:0,step:1};
}
export function advance(recipe){if(recipe.first===null)throw Error('最初の形を選んでください。');return {...recipe,choice:null,step:2};}
export function choose(recipe,index){if(recipe.first===null||![0,1,2].includes(index))throw Error('候補を選び直してください。');return {...recipe,choice:index,step:3};}
export function vary(recipe){if(recipe.round>=50)throw Error('前の段階から、特徴を選び直してください。');return {...recipe,round:recipe.round+1,choice:null,step:2};}
export const back=recipe=>({...recipe,step:Math.max(0,recipe.step-1),...(recipe.step===2?{choice:null}:{})});
export function validateRecipe(value){
 const expected=Object.keys(create()).sort().join();
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join()!==expected)throw Error('このレシピは読み込めません。');
 if(value.format!==1||value.work!==work||value.generator!==1)throw Error('対応していないレシピです。');
 if(typeof value.seed!=='string'||!value.seed.trim()||value.seed.length>80)throw Error('レシピのシードを確認してください。');
 if(![null,0,1,2].includes(value.first)||![null,0,1,2].includes(value.choice)||!Number.isInteger(value.round)||value.round<0||value.round>50||!Number.isInteger(value.step)||value.step<0||value.step>3)throw Error('レシピの選択を確認してください。');
 if(!Array.isArray(value.locks)||value.locks.some(k=>!features.includes(k))||new Set(value.locks).size!==value.locks.length)throw Error('保持する特徴を確認してください。');
 if((value.step>0&&value.first===null)||(value.first===null&&(value.choice!==null||value.locks.length||value.round))||(value.step===3&&value.choice===null))throw Error('レシピの手順を確認してください。');
 return {...value,locks:features.filter(k=>value.locks.includes(k))};
}
export const saveRecipe=recipe=>JSON.stringify(validateRecipe(recipe),null,2);
export function loadRecipe(text){if(typeof text!=='string'||text.length>16384)throw Error('レシピのサイズが大きすぎます。');let value;try{value=JSON.parse(text);}catch{throw Error('レシピの形式を確認してください。');}return validateRecipe(value);}
export const fragment=recipe=>'#recipe='+encodeURIComponent(saveRecipe(recipe));
export function fromFragment(hash){if(!hash||hash==='#main')return create();if(hash.length>16384||!hash.startsWith('#recipe='))throw Error('レシピのリンクを確認してください。');try{return loadRecipe(decodeURIComponent(hash.slice(8)));}catch(e){throw Error(e instanceof URIError?'レシピのリンクを確認してください。':e.message);}}
export function detailURL(recipe,base){const state=selected(recipe);if(!state)throw Error('形を選んでください。');const url=new URL('../../works/'+work+'/',base);url.search=new URLSearchParams({view:'3d',...state});return url.href;}
