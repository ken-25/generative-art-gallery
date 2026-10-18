import {posix} from 'node:path';
const attribute=s=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
const asset=(name,siteURL,pageURL)=>attribute(posix.relative(new URL('.',pageURL).pathname,new URL('assets/brand/'+name,siteURL).pathname));
export function brandHead(siteURL,pageURL=siteURL){
 return `<link rel="icon" type="image/x-icon" sizes="16x16 32x32" href="${asset('favicon.ico',siteURL,pageURL)}"><link rel="icon" type="image/png" sizes="16x16" href="${asset('favicon-16.png',siteURL,pageURL)}"><link rel="icon" type="image/png" sizes="32x32" href="${asset('favicon-32.png',siteURL,pageURL)}">`;
}
export function brandHeader(html,siteURL,pageURL=siteURL){
 return html.replace(/<a\b([^>]*\bclass="brand"[^>]*)>([\s\S]*?)<\/a>/g,(tag,attrs,content)=>content.includes('class="brand-mark"')?tag:`<a${attrs}><img class="brand-mark" src="${asset('mark-32.svg',siteURL,pageURL)}" width="32" height="32" alt="" aria-hidden="true"><span class="brand-wordmark">${content}</span></a>`);
}
