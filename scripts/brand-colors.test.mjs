import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const css=await readFile('assets/style.css','utf8');
const tokens=Object.fromEntries([...css.slice(0,css.indexOf('}')).matchAll(/--([a-z-]+):([^;]+);/g)].map(m=>[m[1],m[2]]));
const colors={primary:'#405944','primary-hover':'#304733',background:'#f4f4ee',surface:'#fafaf7',text:'#242720','text-muted':'#62665c','decorative-border':'#dedfd7','control-border':'#7d8777',focus:'#5a7459','on-primary':'#ffffff','surface-muted':'#eeefe7','surface-hover':'#e6e9dd','artwork-frame':'#e8eae1','card-frame':'#e6e8de'};
const luminance=hex=>{const rgb=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
test('brand colors keep the approved values and legacy token compatibility',()=>{
 for(const [name,value]of Object.entries(colors))assert.equal(tokens[name],value,name);
 for(const [old,current]of Object.entries({green:'primary',ground:'background',ink:'text',muted:'text-muted',line:'decorative-border'}))assert.equal(tokens[old],`var(--${current})`);
});
test('brand text, input borders, and offset focus colors meet the specified contrast',()=>{
 for(const background of ['background','surface','surface-muted','surface-hover','artwork-frame','card-frame']){
  for(const foreground of ['text','text-muted','primary'])assert.ok(contrast(colors[foreground],colors[background])>=4.5,`${foreground}/${background}`);
 }
 for(const background of ['primary','primary-hover'])assert.ok(contrast(colors['on-primary'],colors[background])>=4.5,`on-primary/${background}`);
 for(const background of ['background','surface','surface-muted','surface-hover'])for(const foreground of ['control-border','focus'])assert.ok(contrast(colors[foreground],colors[background])>=3,`${foreground}/${background}`);
 assert.match(css,/:focus-visible\{outline:3px solid var\(--focus\);outline-offset:5px\}/);
 assert.match(css,/button\.primary:hover\{background:var\(--primary-hover\)\}/);
 assert.doesNotMatch(css,/\.studio-actions button\.primary\{[^}]*background/);
});
