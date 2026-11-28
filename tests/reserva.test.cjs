'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const W=require('../joaninha-palavras.js');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const files=['celebridadesaleatorias','nomesfemininosbebes','nomesmasculinosbebes','personalizada3','pareidolia'];
const read=file=>fs.readFileSync(path.join(root,'chat-test-gpt-2-listas',file+'.txt'),'utf8').trim().split(/\r?\n/);
const key=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');
const normalise=html.slice(html.indexOf(' function normalise(value){'),html.indexOf(' // v26:',html.indexOf(' function normalise(value){')));
const functions=html.slice(html.indexOf(' function titleCasePtBR(text){'),html.indexOf(' // Local response language engine:'));
const arrangement=html.slice(html.indexOf(' function arrange(items,'),html.indexOf(' // Place the secondary item'));
const wordResolution=html.slice(html.indexOf(' async function resolveWordList('),html.indexOf(' function cancelReply()'));
function setup(items,category,{manual=null,injectValue='Helena',online=true}={}){
 let calls=0;
 const context=vm.createContext({
  navigator:{onLine:online},fetch:async()=>{calls++;return {ok:true,json:async()=>({value:injectValue})}},
  fetchListFile:async()=>items,withSelectedForceFirst:xs=>xs,JoaninhaLists:{hasCustomItems:()=>false},
  SPECIAL_LENGTHS:{aura:31},hasAnimalCompanions:()=>false,
  loadWordCorpus:async()=>['casa'],JoaninhaWords:{MAX_POSITION:W.MAX_POSITION,prepare:(_corpus,quantity,secret,position)=>({quantity,letters:secret===null?[]:W.secretLetters(secret),position})}
 });
 vm.runInContext(normalise+functions+arrangement+wordResolution,context);
 if(manual!==null)vm.runInContext('pendingManualInject={text:'+JSON.stringify(manual)+',version:1}',context);
 return {resolve:q=>context.resolveList({candidates:[{file:category}],quantity:q}),
  arrange:context.arrange,calls:()=>calls,reserve:context.applyMarkerReserve,
  resolveWords:position=>context.resolveWordList({quantity:10000},position,null)};
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
   assert.equal(key(r.items[0]),key(forced)); // force text preserved apart from capitalization
   assert.equal(r.items[i],reserve);
   assert.equal(r.items.filter(x=>key(x)===key(forced)).length,1);
   assert.equal(r.items.filter(x=>x===reserve).length,1);
   for(const position of [1,31,100]){
    const ordered=p.arrange(r.items,position,100,file);
    assert.equal(ordered[position-1],r.items[0]);
    assert.equal(ordered.length,100);
    assert.equal(new Set(ordered.map(key)).size,100);
   }
   assert.equal(p.calls(),0);
  }
 }
});
test('reserve is absent on noncollision and never increases the presentation quantity',async()=>{
 for(const file of files){
  const source=read(file),reserve=source[100];
  const p=setup(source,file,{injectValue:'mArIa dE soUza'});
  const r=await p.resolve(100);
  assert.equal(r.items[0],source[0].replace('$$$',source[0]==='$$$'?'Maria de Souza':'maria de souza'));
  assert.equal(r.items.length,100);assert.equal(r.quantity,100);assert.equal(r.items.includes(reserve),false);
  assert.equal(p.calls(),1);
  await assert.rejects(p.resolve(101),/quantidade indisponivel/);
  const p2=setup(source,file,{manual:reserve,online:false});
  const r2=await p2.resolve(null);
  assert.equal(r2.quantity,100);
  assert.equal(key(r2.items[0]),key(source[0].replace('$$$',reserve)));
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

test('both sources use precisely the same standalone pt-BR title casing',async()=>{
 const examples=[
  ['fernanda','Fernanda'],['FERNANDA','Fernanda'],['michael jackson','Michael Jackson'],
  ['MARIA DA SILVA','Maria da Silva'],['pão de açúcar','Pão de Açúcar'],
  ['a bela e a fera','A Bela e a Fera'],['rio de janeiro','Rio de Janeiro'],
  ['SÃO PAULO','São Paulo'],['dom pedro II','Dom Pedro II'],
  ['  ÁGUIA  ','Águia'],['JOÃO-PEDRO','João-Pedro']
 ];
 for(const [input,expected] of examples){
  for(const manual of [true,false]){
   const p=setup(['$$$','NÃO mexer neste ITEM'],'custom',manual?{manual:input,injectValue:'OUTRO',online:false}:{injectValue:input});
   const r=await p.resolve(null);
   assert.equal(r.items[0],expected);
   assert.equal(r.items[1],'NÃO mexer neste ITEM');
   assert.equal(p.calls(),manual?0:1);
   assert.equal(r.manualInjectVersion,manual?1:null);
  }
 }
});
test('embedded markers lowercase the inserted text only, wherever the marker occurs',async()=>{
 const examples=[
  ['Nuvem no céu parecendo $$$','CACHORRO','Nuvem no céu parecendo cachorro'],
  ['Nuvem no céu parecendo $$$','Cavalo Marinho','Nuvem no céu parecendo cavalo marinho'],
  ['Nuvem no céu parecendo $$$','ÁGUIA','Nuvem no céu parecendo águia'],
  ['Pessoas com roupa $$$ são legais','AZUL','Pessoas com roupa azul são legais'],
  ['Pessoas com roupa $$$ são legais','Amarelo Fluorescente','Pessoas com roupa amarelo fluorescente são legais'],
  ['$$$ no JARDIM','URSO POLAR','urso polar no JARDIM'],
  ['Um $$$ e outro $$$','PÃO','Um pão e outro pão'],
  ['Valor: $$$','R$ 10','Valor: r$ 10']
 ];
 for(const [template,input,expected] of examples){
  for(const manual of [true,false]){
   const p=setup([template,'SEM Alteração'],'custom',manual?{manual:input,injectValue:'OUTRO',online:false}:{injectValue:input});
   const r=await p.resolve(null);
   assert.equal(r.items[0],expected);
   assert.equal(r.items[1],'SEM Alteração');
   assert.equal(p.calls(),manual?0:1);
  }
 }
});
test('mixed templates use row-specific capitalization, consume the same value and read Inject only once',async()=>{
 for(const manual of [true,false]){
  const p=setup(['$$$','Pessoas com roupa $$$ são legais','SEM ALTERAÇÃO'],'custom',manual?{manual:'VERDE ESCURO',online:false}:{injectValue:'VERDE ESCURO'});
  const r=await p.resolve(null);
  assert.deepEqual(Array.from(r.items),['Verde Escuro','Pessoas com roupa verde escuro são legais','SEM ALTERAÇÃO']);
  assert.equal(p.calls(),manual?0:1);
 }
});
test('normal lists and unforced 10k words do not consult Inject or consume a pending manual value',async()=>{
 const p=setup(['NOME ORIGINAL'],'custom',{manual:'ÉDEN',online:false});
 const ordinary=await p.resolve(null);
 assert.equal(ordinary.manualInjectVersion,null);
 const random=await p.resolveWords(null);
 assert.equal(random.manualVersion,null);
 assert.deepEqual(Array.from(random.prepared.letters),[]);
 const forced=await p.resolveWords(3);
 assert.equal(forced.manualVersion,1);
 assert.deepEqual(Array.from(forced.prepared.letters),['e','d','e','n']);
 assert.equal(p.calls(),0);
 const remote=setup(['NOME ORIGINAL'],'custom',{injectValue:'ÉDEN'});
 assert.equal((await remote.resolveWords(null)).manualVersion,null);
 assert.equal(remote.calls(),0);
 const remoteForced=await remote.resolveWords(3);
 assert.deepEqual(Array.from(remoteForced.prepared.letters),['e','d','e','n']);
 assert.equal(remote.calls(),1);
});
