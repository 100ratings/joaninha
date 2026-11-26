const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const W = require('../joaninha-palavras.js');
const words = W.cleanWords(fs.readFileSync(require('node:path').join(__dirname,'../joaninha-palavras-ptbr.txt'),'utf8'));
const lines = text=>text.split('\n');
const extract = line=>line.slice(3).toLowerCase();
const validList = text=>{
  assert.equal(lines(text).length,10000);
  for(const line of lines(text)) assert.match(line,/^•  \p{L}{3,16}$/u);
};
test('corpus, supported requests and disjoint categories',()=>{
  assert.equal(words.length,28000);
  for(const request of ['liste 10 mil palavras aleatorias','liste dez mil palavras','liste 10000 palavras aleatorias','liste 10.000 palavras']) {
    assert.equal(W.matches(request),true);
    assert.equal(W.parseQuantity(request),10000);
  }
  for(const request of ['liste 100 animais aleatorios','liste 100 musicas aleatorias','liste 10 palavras para descrever uma pessoa','liste 20 nomes de bebes']) assert.equal(W.matches(request),false);
  assert.deepEqual(W.secretLetters('Éden'),['e','d','e','n']);
  for(const secret of ['','123','abc!','a'.repeat(33)]) assert.throws(()=>W.secretLetters(secret));
});
test('ten thousand real rows in every phase, correct letter even for repeats',()=>{
  const prepared=W.prepare(words,10000,'EDEN',3);
  validList(prepared.original);validList(prepared.clean);
  assert.equal(new Set(lines(prepared.original)).size,10000);
  assert.equal(prepared.phases.length,4);
  for(const [i,phase] of prepared.phases.entries()){
    validList(phase);
    const last=new Map();
    for(const [j,row] of lines(phase).entries()){
      const word=extract(row);
      assert.equal(word[2],'eden'[i]);
      assert.ok(j-(last.get(word)??-Infinity)>20);
      last.set(word,j);
    }
  }
  assert.notEqual(prepared.phases[0],prepared.phases[2]);
  assert.notEqual(prepared.original,prepared.clean);
  assert.equal(W.prepare(words,10000).phases.length,0);
  assert.throws(()=>W.prepare(words,10000,'test',0));
  assert.throws(()=>W.prepare(words,10000,'test',10));
  assert.throws(()=>W.prepare(words,10000,'ww',9));
  assert.throws(()=>W.prepare(words,10001));
});
test('positions apply to words rather than lines',()=>{
  for(const p of [1,2,3,4,5,6,7]){
    const prepared=W.prepare(words,10000,'a',p);
    assert.ok(lines(prepared.phases[0]).every(row=>extract(row)[p-1]==='a'));
  }
});
class Element {
  constructor(){this.handlers=new Map();this.children=[];this.scrollTop=100;this.style={};}
  addEventListener(n,f){const list=this.handlers.get(n)||[];list.push(f);this.handlers.set(n,list);}
  removeEventListener(n,f){this.handlers.set(n,(this.handlers.get(n)||[]).filter(x=>x!==f));}
  emit(n,e={}){for(const f of this.handlers.get(n)||[])f(e);}
  appendChild(c){this.children.push(c);}
  replaceChildren(...children){this.children=children;}
  contains(c){return this.children.includes(c);}
}
test('mount: real gestures, both directions, stationary pause, no automatic changes, cleanup',()=>{
  const saved={document:global.document,performance:global.performance,setTimeout:global.setTimeout,clearTimeout:global.clearTimeout};
  let now=0,seq=0;const tasks=new Map();
  function tick(ms){
    const end=now+ms;
    while(tasks.size){
      const [id,task]=[...tasks.entries()].sort((a,b)=>a[1].at-b[1].at)[0];
      if(task.at>end)break;
      now=task.at;tasks.delete(id);task.fn();
    }
    now=end;
  }
  try{
    global.document={createElement:()=>new Element(),createTextNode:data=>({data})};
    global.performance={now:()=>now};
    global.setTimeout=(fn,ms)=>{tasks.set(++seq,{fn,at:now+ms});return seq;};
    global.clearTimeout=id=>tasks.delete(id);
    const scroller=new Element(),target=new Element();
    const prepared={original:'random',phases:['phase a','phase b'],clean:'finished'};
    let completes=0;
    const states=[],readyForRandom=[];
    const mounted=W.mount({prepared,scroller,target,onComplete:()=>completes++,onStateChange:(state,finalPause)=>{
      states.push(state);if(state==='ready')readyForRandom.push(finalPause);
    }});
    const text=()=>target.children[0].children[0].data;
    const scroll=delta=>{scroller.scrollTop+=delta;scroller.emit('scroll');};
    const wheel=delta=>{scroller.emit('wheel');scroll(delta);};
    assert.equal(text(),'random');assert.deepEqual(states,['preview']);
    tick(15000);assert.equal(mounted.state,'preview'); // no movement
    scroll(30);tick(4000);assert.equal(mounted.state,'preview'); // programmatic only
    scroller.emit('touchstart',{touches:[{}]});
    scroller.emit('touchend',{touches:[]});tick(4000);
    assert.equal(mounted.state,'preview'); // tap without actual movement
    scroller.emit('touchstart',{touches:[{}]});scroll(30);
    tick(5000);assert.equal(mounted.state,'preview'); // finger still down
    scroller.emit('touchend',{touches:[]});tick(1000);wheel(-10);
    tick(2999);assert.equal(mounted.state,'preview');assert.equal(text(),'random');
    tick(1);assert.equal(mounted.state,'armed');assert.equal(text(),'random');
    assert.deepEqual(states,['preview','armed']);
    tick(2000);scroll(2);assert.equal(text(),'random');
    scroller.emit('touchstart',{touches:[{}]});scroll(3);
    assert.equal(text(),'phase a');assert.equal(states.at(-1),'running');
    tick(5000);assert.equal(mounted.state,'running'); // finger still down
    scroller.emit('touchend',{touches:[]});tick(2999);assert.equal(mounted.state,'running');
    tick(1);assert.equal(mounted.state,'ready');assert.equal(text(),'phase a');assert.equal(states.at(-1),'ready');assert.deepEqual(readyForRandom,[false]);
    tick(1000);scroll(10);assert.equal(text(),'phase a'); // no actual new gesture
    wheel(-1);assert.equal(text(),'phase b');assert.equal(mounted.state,'running');assert.equal(states.at(-1),'running');
    tick(1000);wheel(10);tick(2999);assert.equal(mounted.state,'running');
    tick(1);assert.equal(mounted.state,'ready');assert.equal(text(),'phase b');assert.deepEqual(readyForRandom,[false,true]);
    wheel(1);assert.equal(text(),'finished');assert.equal(completes,1);
    assert.deepEqual(states,['preview','armed','running','ready','running','ready','complete']);
    tick(5000);wheel(-10);assert.equal(text(),'finished');assert.equal(completes,1);
    mounted.dispose();assert.equal(states.at(-1),'preview');for(const list of scroller.handlers.values())assert.equal(list.length,0);
    const other=W.mount({prepared,scroller,target,onStateChange:state=>states.push(state)});
    wheel(10);tick(3000);assert.equal(other.state,'armed');assert.equal(text(),'random');
    wheel(10);assert.equal(text(),'phase a');
    other.dispose();assert.equal(text(),'random');assert.equal(states.at(-1),'preview');
    const plain=W.mount({prepared:{original:'random',phases:[],clean:'random'},scroller,target,onStateChange:state=>states.push(state)});
    wheel(10);tick(5000);
    assert.equal(plain.state,'preview');assert.equal(states.at(-1),'preview');
    plain.dispose();
    // Starting the scroll during the opening inherits the ongoing touch.
    const early=W.mount({prepared,scroller,target,initialGesture:{contact:true,gesture:true}});
    scroll(25);tick(5000);assert.equal(early.state,'preview');
    scroller.emit('touchend',{touches:[]});tick(2999);assert.equal(early.state,'preview');
    tick(1);assert.equal(early.state,'armed');assert.equal(text(),'random');
    wheel(-10);assert.equal(text(),'phase a');early.dispose();
    const alreadyMoved=W.mount({prepared,scroller,target,initialGesture:{gesture:true,moved:true}});
    tick(3000);assert.equal(alreadyMoved.state,'armed');alreadyMoved.dispose();

  }finally{Object.assign(global,saved);}
});

test('opening reveals line by line but all words are already present, then scroll finishes immediately',()=>{
 const saved={document:global.document,setTimeout:global.setTimeout,clearTimeout:global.clearTimeout};
 let now=0,seq=0;const tasks=new Map();
 function tick(ms){
  const end=now+ms;
  while(tasks.size){
   const [id,task]=[...tasks.entries()].sort((a,b)=>a[1].at-b[1].at)[0];
   if(task.at>end)break;
   now=task.at;tasks.delete(id);task.fn();
  }
  now=end;
 }
 try{
  global.document={createElement:()=>new Element(),createTextNode:data=>({data})};
  global.setTimeout=(fn,ms)=>{tasks.set(++seq,{fn,at:now+ms});return seq;};
  global.clearTimeout=id=>tasks.delete(id);
  const target=new Element(),scroller=new Element();
  const prepared=W.prepare(words,10000);
  const flatten=node=>node.data??node.children.map(flatten).join('');
  let completes=0,gestures=[],openingTexts=[];
  const show=()=>W.reveal({prepared,target,scroller,prefixCount:30,onFinish:(gesture,openingText)=>{completes++;gestures.push(gesture);openingTexts.push(openingText);}});
  const visible=()=>target.children[0].children.filter(x=>x.style?.visibility==='visible').length;
  const hidden=()=>target.children[0].children.filter(x=>x.style?.visibility==='hidden').length;
  let opening=show();
  assert.equal(flatten(target),prepared.original);
  assert.equal(hidden(),30);
  tick(249);assert.equal(visible(),0);
  tick(1);assert.equal(visible(),1);
  tick(76);assert.equal(visible(),2);
  scroller.emit('touchstart',{touches:[{clientY:300}]});
  scroller.emit('touchmove',{touches:[{clientY:298}]});
  assert.equal(completes,0);
  scroller.emit('touchmove',{touches:[{clientY:280}]});
  assert.equal(completes,1);assert.equal(flatten(target),prepared.original);
  assert.deepEqual(gestures[0],{contact:true,gesture:true});
  assert.equal(hidden(),0);assert.equal(target.children[0],openingTexts[0]);
  assert.equal(target.children[0].children.length,31); // keep touch target until pause
  tick(10000);assert.equal(completes,1);
  opening.dispose();
  opening=show();scroller.emit('wheel',{deltaY:-20});assert.equal(completes,2);assert.deepEqual(gestures[1],{gesture:true});
  opening=show();scroller.scrollTop+=40;scroller.emit('scroll');assert.equal(completes,3);assert.deepEqual(gestures[2],{contact:false,gesture:false,moved:false});
  opening=show();tick(4000);assert.equal(completes,4);assert.equal(flatten(target),prepared.original);
  opening=show();opening.dispose();tick(10000);assert.equal(completes,4);assert.equal(hidden(),0);
  assert.equal(flatten(target),prepared.original);
  for(const list of scroller.handlers.values())assert.equal(list.length,0);
 }finally{Object.assign(global,saved);}
});
