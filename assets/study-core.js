/* Project-owned utilities for new mathematical studies (MIT). Not cryptographic. */
(() => {
 'use strict';
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 function rng(seed){let h=1;for(const c of String(seed))h=(Math.imul(h,31)+c.codePointAt(0))>>>0;return ()=>{h=(Math.imul(h,1664525)+1013904223)>>>0;return h/4294967296;};}
 const palettes=Object.freeze({fern:['#f5f3e9','#355949','#79977a'],clay:['#f7efe7','#984d3e','#d79c69'],dusk:['#202938','#d0ccae','#839fac']});
 // Optional heavy step: simulate(s) is a generator function that yields between chunks of work
 // and returns its result; the latest result is cached by the settings it depends on (simulationKeys).
 function create({slug,title,schema,defaults,geometry,draw,simulate,simulationKeys,note}){
  defaults=Object.freeze(defaults);schema=Object.freeze(schema);
  let cached={key:null,value:null};const keyOf=s=>JSON.stringify((simulationKeys||Object.keys(defaults)).map(k=>s[k]));
  const finish=(it,key)=>{let r;do r=it.next();while(!r.done);cached={key,value:r.value};return r.value;};
  const simulated=s=>{if(!simulate)return undefined;const key=keyOf(s);return cached.key===key?cached.value:finish(simulate(s),key);};
  const build=s=>geometry(s,simulated(s));
  function normalize(input={}){const s={};for(const [key,d] of Object.entries(defaults)){
   if(key==='seed'){s[key]=String(input[key]??d).trim().slice(0,80)||d;continue;}
   const rule=schema[key];if(rule.options){s[key]=Object.hasOwn(rule.options,input[key])?input[key]:d;continue;}
   let n=input[key]===''||input[key]==null?d:Number(input[key]);if(!Number.isFinite(n))n=d;
   n=Math.max(rule.min,Math.min(rule.max,n));s[key]=Number((rule.min+Math.round((n-rule.min)/rule.step)*rule.step).toFixed(6));
  }return s;}
  function svg(input){const s=normalize(input),p=palettes[s.palette]||palettes.fern;const result=build(s);return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" width="900" height="600" role="img" aria-labelledby="study-title"><title id="study-title">${escape(title)}</title><metadata>${escape(JSON.stringify({generator:slug,version:1,...s}))}</metadata><rect width="900" height="600" fill="${p[0]}"/>${draw(result,s,p)}</svg>`;}
  const api={slug,title,version:1,schema,defaults,normalize,geometry:input=>build(normalize(input)),svg};
  // task() returns null when the result is ready, else a job whose step() runs one chunk and reports completion.
  if(simulate)api.task=input=>{const s=normalize(input),key=keyOf(s);if(cached.key===key)return null;const it=simulate(s);let done=false;
   return {step(){if(done)return true;const r=it.next();if(r.done){done=true;cached={key,value:r.value};}return done;},cancel(){done=true;it.return();}};};
  if(note)api.note=input=>{const s=normalize(input);return note(build(s),s);};
  return Object.freeze(api);
 }
 const palette={label:'配色',options:{fern:'葉',clay:'土',dusk:'夕'}};
 // Uniform unit vector by rejection sampling: avoids Math.cos/sin, whose last bit differs between engines.
 function direction(rng){for(;;){const x=rng()*2-1,y=rng()*2-1,d=x*x+y*y;if(d>1e-6&&d<=1){const m=Math.sqrt(d);return [x/m,y/m];}}}
 // Linear blend of two #rrggbb colors, t in [0,1].
 const mix=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
 const api=Object.freeze({rng,escape,palettes,create,palette,mix,direction});
 if(typeof module!=='undefined')module.exports=api;
 if(typeof window!=='undefined')window.StudyCore=api;
})();
