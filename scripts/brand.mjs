const attribute=s=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
const asset=(name,siteURL)=>attribute(new URL('assets/brand/'+name,siteURL).pathname);
export function brandHead(siteURL){
 return `<link rel="icon" type="image/x-icon" sizes="16x16 32x32" href="${asset('favicon.ico',siteURL)}"><link rel="icon" type="image/png" sizes="16x16" href="${asset('favicon-16.png',siteURL)}"><link rel="icon" type="image/png" sizes="32x32" href="${asset('favicon-32.png',siteURL)}">`;
}
export function brandHeader(html,siteURL){
 return html.replace(/<a\b([^>]*\bclass="brand"[^>]*)>([\s\S]*?)<\/a>/g,(tag,attrs,content)=>content.includes('class="brand-mark"')?tag:`<a${attrs}><img class="brand-mark" src="${asset('mark-32.svg',siteURL)}" width="32" height="32" alt="" aria-hidden="true"><span class="brand-wordmark">${content}</span></a>`);
}
