/* Answer mapping v1. Keep these choices and rolling-circles v1 stable for shared URLs. */
(() => {
 'use strict';
 const node=typeof module!=='undefined';
 const rolling=node?require('../works/rolling-circles/generator.js'):window.StudyGenerator;
 const C=node?require('../assets/study-core.js'):window.StudyCore;
 const defaults=Object.freeze({pace:'gentle',layers:'woven',scene:'leaves'});
 const schema=Object.freeze({
  pace:{options:{gentle:'ゆったり',light:'軽やかに',bold:'大きく'}},
  layers:{options:{single:'一本をたどる',woven:'少し重ねる',rich:'たっぷり重ねる'}},
  scene:{options:{leaves:'木漏れ日の緑',earth:'あたたかな土',evening:'静かな夕空'}}
 });
 function normalize(input={}){
  if(!input||typeof input!=='object')input={};
  return Object.fromEntries(Object.keys(defaults).map(k=>[k,typeof input[k]==='string'&&Object.hasOwn(schema[k].options,input[k])?input[k]:defaults[k]]));
 }
 function settings(input){
  const s=normalize(input),shapes={gentle:{R:96,r:48,d:36},light:{R:96,r:32,d:52},bold:{R:100,r:40,d:72}};
  return rolling.normalize({...rolling.defaults,...shapes[s.pace],curves:{single:1,woven:3,rich:5}[s.layers],phase:17,palette:{leaves:'fern',earth:'clay',evening:'dusk'}[s.scene]});
 }
 function explain(input){
  const s=normalize(input);
  return [
   {gentle:'「ゆったり」から、丸みのある二つのふくらみを。',light:'「軽やかに」から、三方向へひらく輪を。',bold:'「大きく」から、五方向に伸びる花の輪郭を。'}[s.pace],
   {single:'一本の曲線をたどれるようにしました。',woven:'同じ曲線を少しずつ回して、三本重ねました。',rich:'同じ曲線を少しずつ回して、五本重ねました。'}[s.layers],
   {leaves:'木漏れ日の緑を、明るい紙に重ねています。',earth:'土の赤茶を基調に、あたたかな紙に描いています。',evening:'夕空の青に、淡い光の色を重ねています。'}[s.scene]
  ].join('');
 }
 function svg(input){
  const s=normalize(input);
  return rolling.svg(settings(s)).replace('</metadata>',`</metadata><metadata id="answer-settings">${C.escape(JSON.stringify({answerMapping:1,generator:'rolling-circles',version:1,answers:s}))}</metadata>`);
 }
 const G=Object.freeze({slug:'answer-art',title:'選んだ景色の軌跡',version:1,defaults,schema,normalize,settings,explain,svg});
 if(node)module.exports=G;else window.AnswerArt=G;
})();
