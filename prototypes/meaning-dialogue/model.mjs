export const VERSION='meaning-relations/1';
export const effects={rest:'落ち着きを取り戻せる',explore:'知らないことに出会える',connect:'誰かとのつながりを感じる'};
export const relations={support:'好きなものが、大切なことを支えている',tension:'どちらも大事だけれど、ときには両立しにくい',alternate:'場面によって、行き来している'};
export const events={reinforce:'大切なことを、改めて確かめた',change:'大切なこととの向き合い方が変わった',none:'今回は結び付けない'};
export const empty=()=>({favorite:'',value:'',event:'',effect:'rest',relation:'support',eventMeaning:'none',frequency:3,importance:3});
const keys=Object.keys(empty()).sort().join();
export function validate(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).sort().join()!==keys)throw Error('制作入力の形式を確認してください。');
 const copy={...input};
 for(const key of ['favorite','value','event']){if(typeof copy[key]!=='string'||copy[key].length>300)throw Error('回答はそれぞれ300文字以内にしてください。');copy[key]=copy[key].normalize('NFC').trim();}
 if(!copy.favorite||!copy.value)throw Error('好きなものと大切なことを、短い言葉で教えてください。');
 if(!Object.hasOwn(effects,copy.effect)||!Object.hasOwn(relations,copy.relation)||!Object.hasOwn(events,copy.eventMeaning))throw Error('答えの意味を選び直してください。');
 for(const key of ['frequency','importance'])if(!Number.isInteger(copy[key])||copy[key]<1||copy[key]>5)throw Error('答えの度合いを確認してください。');
 if(!copy.event&&copy.eventMeaning!=='none')throw Error('出来事を結び付ける場合は、短い言葉を添えてください。');
 return copy;
}
export function structure(raw){const a=validate(raw);return {generator:VERSION,motif:a.effect,relationship:a.relation,layers:a.frequency+2,coreRadius:12+a.importance*2,event:a.eventMeaning,arms:a.eventMeaning==='change'?2:a.eventMeaning==='reinforce'?1:0};}
export function interpretation(raw){const a=validate(raw);return [`「${a.favorite}」は、${effects[a.effect]}もの。`,`「${a.value}」との関係は「${relations[a.relation]}」。`,a.eventMeaning==='none'?'出来事は、今回は形に結び付けません。':`「${a.event}」を通して、${events[a.eventMeaning]}。`];}
export function explanation(raw){const s=structure(raw);return [({rest:'落ち着ける場所を、中心を囲む輪で表します。',explore:'新しい出会いを、外へ開く輪の連なりで表します。',connect:'つながりを、交わる輪で表します。'})[s.motif],({support:'支える関係を、二つのまとまりを結ぶ一本の橋で表します。',tension:'両立しにくさを、離れた二つと、それぞれに向かう橋で表します。',alternate:'行き来する関係を、二つのまとまりを巡る環で表します。'})[s.relationship],`日常との関わりの深さを${s.layers}層の重なりに、大切にしている度合いを中心の大きさに反映します。`,s.arms===2?'向き合い方の変化を、二方向へ分かれる枝で表します。':s.arms===1?'改めて確かめた出来事を、中心へつながる枝で表します。':''];}
export function save(raw){const input=validate(raw);return JSON.stringify({format:1,generator:VERSION,input,result:structure(input)},null,2);}
export function load(text){if(typeof text!=='string'||text.length>12000)throw Error('制作入力のファイルが大きすぎます。');let r;try{r=JSON.parse(text);}catch{throw Error('JSONファイルを確認してください。');}if(!r||Object.keys(r).sort().join()!=='format,generator,input,result'||r.format!==1||r.generator!==VERSION)throw Error('対応していない制作入力です。');const input=validate(r.input);if(JSON.stringify(r.result)!==JSON.stringify(structure(input)))throw Error('保存された結果と制作入力が一致しません。');return input;}
export const examples=[
 {name:'静かな時間と日々の支え',input:{favorite:'朝にお茶をいれる時間',value:'自分のペース',event:'慌ただしい日にも一息つけた',effect:'rest',relation:'support',eventMeaning:'reinforce',frequency:5,importance:4}},
 {name:'好奇心と、守りたい時間',input:{favorite:'知らない街を歩くこと',value:'家で過ごす時間',event:'旅から帰って、家の良さに気付いた',effect:'explore',relation:'tension',eventMeaning:'change',frequency:2,importance:5}},
 {name:'人とのつながりと一人の時間',input:{favorite:'友人と料理すること',value:'一人で考えること',event:'',effect:'connect',relation:'alternate',eventMeaning:'none',frequency:3,importance:3}}
];
