const notice='（新しいタブ）';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const entities={amp:'&',AMP:'&',quot:'"',QUOT:'"',apos:"'",lt:'<',LT:'<',gt:'>',GT:'>',colon:':',sol:'/',bsol:'\\',period:'.',commat:'@',Tab:'\t',NewLine:'\n'};
function decode(value){
 return value.replace(/&(#x[\da-f]+|#\d+|[a-z][a-z0-9]+);/gi,(original,key)=>{
  if(key[0]!=='#')return entities[key]??original;
  const n=key[1].toLowerCase()==='x'?parseInt(key.slice(2),16):Number(key.slice(1));
  return n>0&&n<=0x10ffff?String.fromCodePoint(n):original;
 });
}
export function isExternalWebLink(href,pageURL,siteURL){
 let url;try{url=new URL(href,pageURL);}catch{return false;}
 if(!['http:','https:'].includes(url.protocol))return false;
 const site=new URL(siteURL),root=site.pathname;
 return url.origin!==site.origin||!(url.pathname===root.slice(0,-1)||url.pathname.startsWith(root));
}
// Transform HTML tags only; comments and raw-text elements must retain their content.
export function externalLinks(html,pageURL,siteURL){
 const anchors=[];
 const tokens=/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<(script|style|textarea|title)\b(?:[^>"']|"[^"]*"|'[^']*')*>[\s\S]*?<\/\1\s*>|<\/?[a-z][^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*>/gi;
 return html.replace(tokens,tag=>{
  if(/^<\/a\s*>$/i.test(tag))return (anchors.pop()?`<span class="external-link-note">${notice}</span>`:'')+tag;
  if(!/^<a(?:\s|>)/i.test(tag))return tag;
  const attrs=[...tag.slice(2,-1).matchAll(/\s+([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)].map(m=>({name:m[1].toLowerCase(),value:m[2]??m[3]??m[4]??'',raw:m[0]}));
  const get=name=>attrs.find(a=>a.name===name),href=get('href');
  if(!href||get('download')||!isExternalWebLink(decode(href.value),pageURL,siteURL)){anchors.push(false);return tag;}
  const marked=!!get('data-external-link');anchors.push(!marked);
  const set=(name,value,encoded=false)=>{const next={name,value,raw:` ${name}="${encoded?value.replace(/"/g,'&quot;'):escape(value)}"`},index=attrs.findIndex(a=>a.name===name);if(index<0)attrs.push(next);else{attrs[index]=next;for(let i=attrs.length-1;i>index;i--)if(attrs[i].name===name)attrs.splice(i,1);}};
  const rel=new Set(decode(get('rel')?.value||'').toLowerCase().split(/\s+/).filter(t=>t&&t!=='opener'));
  rel.add('noopener');rel.add('noreferrer');set('target','_blank');set('rel',[...rel].join(' '));set('data-external-link','');
  const label=get('aria-label');
  if(label&&!decode(label.value).includes('新しいタブ'))set('aria-label',label.value+notice,true);
  return tag.slice(0,2)+attrs.map(a=>a.raw).join('')+'>';
 });
}
