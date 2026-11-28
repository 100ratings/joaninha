'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const files=['celebridadesaleatorias','nomesfemininosbebes','nomesmasculinosbebes','personalizada3','pareidolia'];
const read=file=>fs.readFileSync(path.join(root,'chat-test-gpt-2-listas',file+'.txt'),'utf8').trim().split(/\r?\n/);
const key=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');
const normalise=html.slice(html.indexOf(' function normalise(value){'),html.indexOf(' // v26:',html.indexOf(' function normalise(value){')));
const functions=html.slice(html.indexOf(' function titleCasePtBR(text){'),html.indexOf(' // Local response language engine:'));
const arrangement=html.slice(html.indexOf(' function arrange(items,'),html.indexOf(' // Place the secondary item'));
function setup(items,category,{manual=null,injectValue='Helena',online=true}={}){
 let calls=0;
 const context=vm.createContext({
  navigator:{onLine:online},fetch:async()=>{calls++;return {ok:true,json:async()=>({value:injectValue})}},
  fetchListFile:async()=>items,withSelectedForceFirst:xs=>xs,JoaninhaLists:{hasCustomItems:()=>false},
  SPECIAL_LENGTHS:{aura:31},hasAnimalCompanions:()=>false
 });
 vm.runInContext(normalise+functions+arrangement,context);
 if(manual!==null)vm.runInContext('pendingManualInject={text:'+JSON.stringify(manual)+',version:1}',context);
 return {resolve:q=>context.resolveList({candidates:[{file:category}],quantity:q}),
  arrange:context.arrange,calls:()=>calls,reserve:context.applyMarkerReserve};
}
test('five marker lists contain 100 unique presentation rows and a unique reserve',()=>{
 for(const file of files){
  const rows=read(file);
  assert.equal(rows.length,101,file);
  assert.ok(rows[0].includes('$$$'),file);
  assert.equal(rows.filter(x=>x.includes('$$$')).length,1,file);
  assert.equal(new Set(rows.map(key)).size,101,file);
 }
});
test('all four standalone-name lists handle every possible collision, preserve force and use the reserve exactly once',async()=>{
 for(const file of files.filter(x=>x!=='pareidolia')){
  const source=read(file),reserve=source[100];
  for(let i=1;i<100;i++){
   const forced=key(source[i]).toUpperCase(),p=setup(source,file,{manual:forced,online:false});
   const r=await p.resolve(null);
   assert.equal(r.quantity,100);assert.equal(r.items.length,100);
   assert.equal(r.items[0],forced); // manual capitalization remains literal
   assert.equal(r.items[i],reserve);
   assert.equal(r.items.filter(x=>key(x)===key(forced)).length,1);
   assert.equal(r.items.filter(x=>x===reserve).length,1);
   for(const position of [1,31,100]){
    const ordered=p.arrange(r.items,position,100,file);
    assert.equal(ordered[position-1],forced);
    assert.equal(ordered.length,100);
    assert.equal(new Set(ordered.map(key)).size,100);
   }
   assert.equal(p.calls(),0);
  }
 }
});
test('reserve is absent on noncollision and never increases the presentation quantity; Inject casing is unchanged',async()=>{
 for(const file of files){
  const source=read(file),reserve=source[100];
  const p=setup(source,file,{injectValue:'mArIa dE soUza'});
  const r=await p.resolve(100);
  assert.equal(r.items[0],source[0].replace('$$$','Maria de Souza'));
  assert.equal(r.items.length,100);assert.equal(r.quantity,100);assert.equal(r.items.includes(reserve),false);
  assert.equal(p.calls(),1);
  await assert.rejects(p.resolve(101),/quantidade indisponivel/);
  const p2=setup(source,file,{manual:reserve,online:false});
  const r2=await p2.resolve(null);
  assert.equal(r2.quantity,100);
  assert.equal(r2.items[0],source[0].replace('$$$',reserve));
  assert.equal(r2.items.filter(x=>key(x)===key(r2.items[0])).length,1);
 }
});
test('phrase comparison is case/accent insensitive but does not treat different sentences as duplicates',async()=>{
 const source=read('pareidolia'),p=setup(source,'pareidolia',{manual:'gato'});
 const r=await p.resolve(null);
 assert.equal(r.items[0],'Nuvem no céu parecendo gato');
 assert.ok(r.items.includes('Marca de sujeira parecendo gato'));
 assert.equal(r.items.includes(source[100]),false);
 const fixture=source.slice();fixture[25]='NUVEM NO CEU PARECENDO GATO';
 const p2=setup(fixture,'pareidolia',{manual:'gato'});
 const r2=await p2.resolve(null);
 assert.equal(r2.items[25],source[100]);assert.equal(r2.items[0],'Nuvem no céu parecendo gato');
});
test('ordinary lists, older custom 100-row marker lists, other sizes, and inappropriate reserve shapes retain original behavior',async()=>{
 const source=read('nomesfemininosbebes');
 const older=source.slice(0,100),p=setup(older,'old',{manual:'Helena'});
 const r=await p.resolve(null);assert.equal(r.quantity,100);assert.equal(r.items.filter(x=>x==='Helena').length,2);
 const ordinary=source.slice();ordinary[0]='Anna Original';
 const p2=setup(ordinary,'normal');const r2=await p2.resolve(null);
 assert.equal(r2.quantity,101);assert.equal(p2.calls(),0);
 const markerLast=source.slice();markerLast[100]='$$$';
 const p3=setup(markerLast,'other',{manual:'Nome'});
 assert.equal((await p3.resolve(null)).quantity,101);
 const invalid=source.slice();invalid[100]=invalid[2];
 const r3=await setup(invalid,'custom',{manual:'Helena'}).resolve(null);
 assert.equal(r3.quantity,100);assert.equal(r3.items.filter(x=>x===invalid[2]).length,1);
});
