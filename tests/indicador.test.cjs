'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
test('only the first existing dot fades, in both directions over exactly two seconds',()=>{
 assert.match(html,/#more circle:first-child\{opacity:1;transition: opacity 2s ease-in-out;\}/);
 assert.match(html,/#more\[data-word-list-state="force"\] circle:first-child\{opacity:0\}/);
 const marker=html.match(/<button id="more"[^>]*>([\s\S]*?)<\/button>/)[1];
 assert.equal((marker.match(/<circle /g)||[]).length,3);
 assert.match(marker,/<circle cx="4" cy="12" r="1\.8"\/><circle cx="12" cy="12" r="1\.8"\/><circle cx="20" cy="12" r="1\.8"\/>/);
});
test('unchanged force state never rewrites the indicator and the final pause restores all dots',()=>{
 let writes=0;const raw={};const dataset=new Proxy(raw,{set(t,k,v){writes++;t[k]=v;return true},deleteProperty(t,k){if(k in t)writes++;delete t[k];return true}});
 const c=vm.createContext({$:()=>({dataset})});
 const code=html.slice(html.indexOf(' function setWordListIndicator('),html.indexOf(' function disposeWordList('));
 vm.runInContext(code,c);
 c.setWordListIndicator('preview');assert.equal(writes,0);
 c.setWordListIndicator('armed');assert.equal(raw.wordListState,'force');assert.equal(writes,1);
 for(const state of ['running','ready','running','ready'])c.setWordListIndicator(state,false);
 assert.equal(writes,1);
 c.setWordListIndicator('ready',true);assert.equal(raw.wordListState,undefined);assert.equal(writes,2);
 c.setWordListIndicator('complete');c.setWordListIndicator('preview');assert.equal(writes,2);
});
