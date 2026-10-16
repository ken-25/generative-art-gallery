/* Executed inside the browser. Expected controls come from every generator key;
   there is no DOM-count gate that could silently skip a missing panel. */
function inspectControls(contract){
 const errors=[],form=document.getElementById('settings');
 const fail=(key,message)=>errors.push(key+': '+message);
 if(!form)return ['settings form missing'];
 if(!Object.keys(contract.fields).length)return ['empty expected control contract'];
 const names=[...new Set([...form.querySelectorAll('input[name],select[name],textarea[name]')].map(e=>e.name))].sort();
 if(JSON.stringify(names)!==JSON.stringify(Object.keys(contract.fields).sort()))errors.push('input names differ from complete control contract');
 if(contract.schema){
  const keys=[...form.querySelectorAll('[data-control]')].map(e=>e.dataset.control).sort();
  if(JSON.stringify(keys)!==JSON.stringify(Object.keys(contract.fields).sort()))errors.push('data-control keys differ from complete schema contract');
 }
 for(const [key,expected] of Object.entries(contract.fields)){
  const inputs=[...form.querySelectorAll('[name]')].filter(e=>e.name===key);
  if(inputs.length!==(expected.type==='radio'?expected.options.length:1)){fail(key,'missing or duplicate element');continue;}
  for(const input of inputs){
   const type=input.tagName==='SELECT'?'select':input.type;
   if(type!==expected.type)fail(key,'wrong type');
   if(!input.labels?.length||![...input.labels].some(l=>l.textContent.trim()&&(!expected.label||l.textContent.includes(expected.label))))fail(key,'missing or incorrect associated label');
   const help=(input.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean).map(id=>document.getElementById(id));
   if(!help.length||help.some(e=>!e?.textContent.trim())||(expected.help&&!help.some(e=>e?.textContent===expected.help)))fail(key,'missing or incorrect associated explanation');
   if(expected.min!==undefined){
    for(const attribute of ['min','max','step'])if(input.getAttribute(attribute)!==String(expected[attribute]))fail(key,'wrong '+attribute);
   }
   if(type==='text'&&input.maxLength!==80)fail(key,'wrong maxlength');
   if(expected.output){
    const output=document.getElementById(key+'-value');
    if(!output||output.tagName!=='OUTPUT'||!output.htmlFor.contains(input.id)||!output.textContent.trim())fail(key,'missing associated current-value output');
    else{const total=expected.percentage?['nw','ne','se','sw'].reduce((sum,k)=>sum+Number(form.elements.namedItem(k)?.value||0),0):0;const value=expected.percentage?(total?Math.round(Number(input.value)/total*100):25):Number(input.value);if(parseFloat(output.textContent)!==value)fail(key,'current-value output out of sync');}
   }
   if(contract.schema){
    const wrapper=input.closest('[data-control]');if(wrapper?.dataset.control!==key)fail(key,'missing schema wrapper');
    if(wrapper?.hidden&&!input.disabled)fail(key,'hidden control remains enabled');
   }
  }
  if(expected.options){
   const values=expected.type==='select'?[...(inputs[0].options||[])].map(o=>o.value):inputs.map(i=>i.value);
   if(JSON.stringify(values)!==JSON.stringify(expected.options))fail(key,'wrong options');
  }
 }
 return errors;
}
// Legacy widgets have different layouts/percentage outputs. Keep their full
// contracts explicit, including the historical slider increments.
const numeric=(type,min,max,step)=>({type,min,max,step,output:type==='range'});
const dimensions=(maxRows=40)=>({columns:numeric('number',1,40,1),rows:numeric('number',1,maxRows,1)});
const seed={type:'text'};
const legacy={
 'order-and-chance':{...dimensions(60),position:numeric('range',0,2,.05),rotation:numeric('range',0,180,1),growth:numeric('range',.2,4,.1),seed},
 'truchet-tiles':{...dimensions(),nw:{...numeric('range',0,100,1),percentage:true},ne:{...numeric('range',0,100,1),percentage:true},se:{...numeric('range',0,100,1),percentage:true},sw:{...numeric('range',0,100,1),percentage:true},seed},
 'lissajous':{freqX:numeric('range',1,12,1),freqY:numeric('range',1,12,1),phase:numeric('range',0,360,1),ampX:numeric('range',.1,1,.05),ampY:numeric('range',.1,1,.05),weight:numeric('range',.5,4,.1),palette:{type:'radio',options:['indigo','vermilion','night']}}
};
module.exports={inspectControls,legacy};
