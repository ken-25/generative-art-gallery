/* Project-owned utilities for new mathematical studies (MIT).
   Seed hashing uses a base-31 recurrence; sampling uses the standard numerical
   LCG recurrence (1664525*x + 1013904223 mod 2^32). Not cryptographic. */
(() => {
 'use strict';
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 function rng(seed){let h=1;for(const c of String(seed))h=(Math.imul(h,31)+c.codePointAt(0))>>>0;return ()=>{h=(Math.imul(h,1664525)+1013904223)>>>0;return h/4294967296;};}
 const palettes=Object.freeze({fern:['#f5f3e9','#355949','#79977a'],clay:['#f7efe7','#984d3e','#d79c69'],dusk:['#202938','#d0ccae','#839fac']});
 function create({slug,title,schema,defaults,geometry,draw}){
  defaults=Object.freeze(defaults);schema=Object.freeze(schema);
  function normalize(input={}){const s={};for(const [key,d] of Object.entries(defaults)){
   if(key==='seed'){s[key]=String(input[key]??d).trim().slice(0,80)||d;continue;}
   const rule=schema[key];if(rule.options){s[key]=Object.hasOwn(rule.options,input[key])?input[key]:d;continue;}
   let n=input[key]===''||input[key]==null?d:Number(input[key]);if(!Number.isFinite(n))n=d;
   n=Math.max(rule.min,Math.min(rule.max,n));s[key]=Number((rule.min+Math.round((n-rule.min)/rule.step)*rule.step).toFixed(6));
  }return s;}
  function svg(input){const s=normalize(input),p=palettes[s.palette]||palettes.fern;const result=geometry(s);return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" width="900" height="600" role="img" aria-labelledby="study-title"><title id="study-title">${escape(title)}</title><metadata>${escape(JSON.stringify({generator:slug,version:1,...s}))}</metadata><rect width="900" height="600" fill="${p[0]}"/>${draw(result,s,p)}</svg>`;}
  return Object.freeze({slug,title,version:1,schema,defaults,normalize,geometry:input=>geometry(normalize(input)),svg});
 }
 const palette={label:'配色',options:{fern:'葉',clay:'土',dusk:'夕'}};
 const api=Object.freeze({rng,escape,palettes,create,palette});
 if(typeof module!=='undefined')module.exports=api;
 if(typeof window!=='undefined')window.StudyCore=api;
})();
