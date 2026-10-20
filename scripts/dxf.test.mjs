import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{dxf}=require('../assets/share.js');
// Group code/value pairs of the ENTITIES section, split into entities.
const entities=text=>{
 const lines=text.split('\n');assert.equal(lines.at(-1),'');lines.pop();assert.equal(lines.length%2,0);
 const pairs=[];for(let i=0;i<lines.length;i+=2){assert.match(lines[i],/^\d+$/);pairs.push([Number(lines[i]),lines[i+1]]);}
 assert.deepEqual(pairs.slice(0,4),[[0,'SECTION'],[2,'HEADER'],[9,'$ACADVER'],[1,'AC1009']]);assert.deepEqual(pairs.at(-1),[0,'EOF']);
 const start=pairs.findIndex(([c,v],i)=>c===2&&v==='ENTITIES'&&pairs[i-1][1]==='SECTION'),end=pairs.findIndex(([c,v],i)=>i>start&&c===0&&v==='ENDSEC'),result=[];
 for(const [c,v]of pairs.slice(start+1,end)){if(c===0)result.push({type:v,codes:[]});result.at(-1).codes.push([c,v]);}
 const out=[];for(const e of result){if(e.type==='VERTEX')out.at(-1).vertices.push(point(e));else if(e.type!=='SEQEND')out.push({...e,layer:e.codes.find(([c])=>c===8)[1],vertices:[]});}return out;
};
const value=(e,code)=>Number(e.codes.find(([c])=>c===code)[1]),point=e=>[value(e,10),value(e,20)];
const svg=body=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><title>タイトル</title><metadata>{"a":1}</metadata>${body}</svg>`;
test('DXF flips y, names layers by color and keeps hidden markup out',()=>{
 const [line,...rest]=entities(dxf(svg('<defs><rect width="5" height="5"/></defs><path d="M10 10L20 10" stroke="#ff0000"/>')));
 assert.equal(rest.length,0);assert.equal(line.type,'LINE');assert.equal(line.layer,'COLOR_FF0000');
 assert.deepEqual([point(line),[value(line,11),value(line,21)]],[[10,40],[20,40]]);
 assert.match(dxf(svg('<path d="M0 0h1" stroke="#f00"/>')),/\n2\nCOLOR_FF0000\n70\n0\n62\n1\n/);
});
test('DXF outlines filled shapes, keeps similar circles and flattens the rest',()=>{
 const [rect,circle,ellipse,arcs]=entities(dxf(svg('<rect x="10" y="10" width="20" height="10" fill="#355949"/><g transform="translate(50 25) scale(2)"><circle r="3" fill="#000"/></g><circle transform="scale(2 1)" cx="10" cy="10" r="3" stroke="#000" fill="none"/><path d="M60 10a5 5 0 1 0 10 0" stroke="#000"/>')));
 assert.equal(rect.type,'POLYLINE');assert.equal(value(rect,70),1);assert.deepEqual(rect.vertices,[[10,40],[30,40],[30,30],[10,30]]);assert.equal(rect.layer,'COLOR_355949');
 assert.equal(circle.type,'CIRCLE');assert.deepEqual([...point(circle),value(circle,40)],[50,25,6]);
 assert.equal(ellipse.type,'POLYLINE');assert.ok(ellipse.vertices.every(([x,y])=>Math.abs(((x-20)/6)**2+((y-40)/3)**2-1)<0.01));
 assert.deepEqual([arcs.vertices[0],arcs.vertices.at(-1)],[[60,40],[70,40]]);assert.ok(arcs.vertices.every(([x,y])=>Math.abs(Math.hypot(x-65,y-40)-5)<1e-3&&y<=40+1e-3));
});
test('DXF applies convex clip paths and escapes text',()=>{
 const [inside,trimmed,label]=entities(dxf(svg('<defs><clipPath id="c"><polygon points="25,0 75,0 75,50 25,50"/></clipPath></defs><g clip-path="url(#c)" stroke="#000"><path d="M30 5L70 5"/><path d="M0 25L100 25M0 0L10 0"/></g><text x="5" y="45" font-size="4" fill="#000">a&amp;日本</text>')));
 assert.deepEqual([point(inside),[value(inside,11),value(inside,21)]],[[30,45],[70,45]]);
 assert.deepEqual([point(trimmed),[value(trimmed,11),value(trimmed,21)]],[[25,25],[75,25]]);
 assert.equal(label.type,'TEXT');assert.equal(label.codes.find(([c])=>c===1)[1],'a&\\U+65E5\\U+672C');assert.deepEqual([...point(label),value(label,40)],[5,5,4]);
 assert.throws(()=>dxf('<svg/>'),/サイズ/);
});
test('every work converts its default and boundary drawings to DXF',async()=>{
 for(const f of JSON.parse(await readFile(new URL('./fixtures/all-works-v1.json',import.meta.url),'utf8'))){
  const c={window:{}};vm.createContext(c);
  if(f.key==='StudyGenerator'){vm.runInContext(await readFile('assets/study-core.js','utf8'),c);c.StudyCore=c.window.StudyCore;}
  vm.runInContext(await readFile(`works/${f.slug}/${f.file}`,'utf8'),c);
  const source=c.window[f.key].svg(f.settings),list=entities(dxf(source));assert.ok(list.length,f.slug);
  for(const e of list)for(const [x,y]of e.vertices.length?e.vertices:[point(e)])assert.ok(Number.isFinite(x)&&Number.isFinite(y),f.slug);
  if(f.slug==='layered-lines')for(const e of list.filter(e=>e.layer!==list[0].layer))for(const [x,y]of [point(e),[value(e,11),value(e,21)]])assert.ok(x>=30-1e-6&&x<=870+1e-6&&y>=30-1e-6&&y<=570+1e-6,'clipped to the panels');
 }
});
