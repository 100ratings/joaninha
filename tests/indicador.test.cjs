'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
test('first and last existing dots fade in both directions over two seconds, middle and geometry unchanged',()=>{
 assert.match(html,/#more circle:first-child,#more circle:last-child\{opacity:1;transition: opacity 2s ease-in-out;\}/);
 assert.match(html,/#more\[data-word-list-state="force"\] circle:first-child\{opacity:0\}/);
 assert.match(html,/#more\[data-word-list-state="final"\] circle:last-child\{opacity:0\}/);
 const marker=html.match(/<button id="more"[^>]*>([\s\S]*?)<\/button>/)[1];
 assert.equal((marker.match(/<circle /g)||[]).length,3);
 assert.match(marker,/<circle cx="4" cy="12" r="1\.8"\/><circle cx="12" cy="12" r="1\.8"\/><circle cx="20" cy="12" r="1\.8"\/>/);
});
function fakeIndicator(){
 let writes=0;const raw={},freeze=[];
 const dataset=new Proxy(raw,{set(t,k,v){writes++;t[k]=v;return true},deleteProperty(t,k){if(k in t)writes++;delete t[k];return true}});
 const dots=Array.from({length:3},(_,i)=>({i,opacity:null,style:{removeProperty(prop){delete this[prop];}}}));
 const c=vm.createContext({$:()=>({dataset,querySelectorAll:()=>dots}),getComputedStyle(dot){
  if(dot.style.transition==='none')freeze.push([dot.i,dot.style.opacity]);
  return {opacity:dot.style.opacity??dot.opacity??String((dot.i===0&&raw.wordListState==='force'||dot.i===2&&raw.wordListState==='final')?0:1)};
 }});
 const code=html.slice(html.indexOf(' function setWordListIndicator('),html.indexOf(' function disposeWordList('));
 vm.runInContext(code,c);
 return{set:c.setWordListIndicator,raw,dots,freeze,get writes(){return writes;}};
}
test('same state never restarts fade; regular readiness restores three, final readiness hides only last',()=>{
 const f=fakeIndicator(),set=f.set;
 set('preview');assert.equal(f.writes,0);
 set('armed');assert.equal(f.raw.wordListState,'force');assert.equal(f.writes,1);
 set('running');assert.equal(f.writes,1);
 set('ready',false);assert.equal(f.raw.wordListState,undefined);assert.equal(f.writes,2);
 set('ready',false);assert.equal(f.writes,2);
 set('running');assert.equal(f.raw.wordListState,'force');assert.equal(f.writes,3);
 set('running');assert.equal(f.writes,3);
 set('ready',true);assert.equal(f.raw.wordListState,'final');assert.equal(f.writes,4);
 set('ready',true);assert.equal(f.writes,4);
 set('complete');assert.equal(f.raw.wordListState,undefined);assert.equal(f.writes,5);
 set('preview');assert.equal(f.writes,5);
 assert.deepEqual(f.freeze,[]);
});
test('interrupted first and last dots start new full fades from their current opacity',()=>{
 const f=fakeIndicator();f.set('armed');f.dots[0].opacity='0.42';
 f.set('ready',true);assert.deepEqual(f.freeze,[[0,'0.42']]);
 assert.equal(f.raw.wordListState,'final');
 f.dots[0].opacity='0.73';f.dots[2].opacity='0.27';
 f.set('running');
 assert.deepEqual(f.freeze,[[0,'0.42'],[0,'0.73'],[2,'0.27']]);
 for(const dot of f.dots){assert.equal(dot.style.opacity,undefined);assert.equal(dot.style.transition,undefined);}
 const writes=f.writes;f.set('running');assert.equal(f.writes,writes);
});
