'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const version=JSON.parse(fs.readFileSync(path.join(root,'index-version.json'),'utf8')).version;
const inert=()=>{};
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
function fakePage({remote=version,currentURL='',worker=true}={}){
 const nodes=new Map(),messages=[],requests=[],reloads=[];
 const key=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',disabled:false,addEventListener:inert,setAttribute:inert});return nodes.get(id)};
 const state={remote,online:true,htmlVersion:null,fail:null,protocol:2,interactOnDownload:false};
 const context=vm.createContext({
  $:key,GPT_TEST_VERSION:version,latestTestVersion:null,updateCheckSequence:0,testUpdateInProgress:false,updateCheckRunning:false,
  startupInteraction:false,peekPanelOpen:false,lastSavedConversation:{title:'Minha lista'},recentAnimals:key('recentAnimals'),
  navigator:{onLine:true,serviceWorker:worker?{controller:{}}:{}},URL,AbortController,Date,setTimeout,clearTimeout,
  document:{baseURI:'https://example.test/joaninha/index.html',visibilityState:'visible'},
  location:{href:'https://example.test/joaninha/index.html'+currentURL,protocol:'https:',replace:url=>reloads.push(url)},
  fetch:async (url,options)=>{
   requests.push({url,options});const isMarker=url.includes('index-version.json');
   if(state.fail===(isMarker?'marker':'html'))throw Error('offline');
   return {ok:true,json:async()=>({version:state.remote}),text:async()=>`const GPT_TEST_VERSION=${state.htmlVersion??state.remote};`};
  },
  communicateWithOfflineWorker:async(type,payload)=>{
   messages.push(type);
   if(type==='STATUS')return {stagingProtocol:state.protocol};
   if(state.fail===type)throw Error('failed');
   if(type==='DOWNLOAD_UPDATE'&&state.interactOnDownload)context.startupInteraction=true;
   return {ready:true,version:payload.version};
  }
 });
 const a=html.indexOf(' function renderRecentEntry(){'),b=html.indexOf(' // V161: restore the sidebar swipe',a);
 vm.runInContext(html.slice(a,b),context);
 return {context,nodes,messages,requests,reloads,state,check:auto=>context.checkForTestUpdate(auto),apply:()=>context.applyAvailableTestUpdate(false)};
}
test('startup checks once, no periodic or resume update handlers, versioned assets agree',()=>{
 assert.equal((html.match(/checkForTestUpdate\(true\)/g)||[]).length,1);
 assert.doesNotMatch(html,/UPDATE_CHECK_POLL_MS|setInterval\([^]*?checkForTestUpdate/);
 assert.doesNotMatch(html,/addEventListener\(['"](?:pageshow|focus|online|visibilitychange)['"],\s*\(\)=>checkForTestUpdate/);
 assert.match(html,new RegExp('const GPT_TEST_VERSION='+version+';'));
 for(const match of html.matchAll(/(?:src|href)="\.\/[^"]+\?v=(\d+)"/g))assert.equal(Number(match[1]),version);
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
 for(const icon of manifest.icons)assert.equal(new URL(icon.src,'https://example.test').searchParams.get('v'),String(version));
 assert.doesNotMatch(html,/Deseja atualizar o app|update-attention/);
 assert.match(html,/function openPeekPanel\(\)\{[^]*?selectSettingsTab\('updates'\);\s*diag.event\('peek-panel-open'\)/);
 assert.match(html,/id="peekTabUpdatesButton"[^>]+aria-selected="true"/);
});
test('same version, invalid marker and offline failure never reload',async()=>{
 const p=fakePage();await p.check(true);assert.equal(p.nodes.get('updateStatus').textContent,'Atualizado');
 assert.equal(p.requests.length,1);assert.equal(p.requests[0].options.cache,'no-store');assert.equal(p.reloads.length,0);
 p.state.remote='999';await p.check(true);assert.match(p.nodes.get('updateStatus').textContent,/Não foi possível/);
 p.context.navigator.onLine=false;await p.check(true);assert.equal(p.requests.length,2);assert.equal(p.reloads.length,0);
});
test('manual check only enables update, then explicitly stages and reloads',async()=>{
 const p=fakePage({remote:version+1});await p.check(false);
 assert.equal(p.nodes.get('recentAnimals').textContent,'Minha lista');
 assert.equal(p.nodes.get('updateAppBtn').disabled,false);assert.equal(p.reloads.length,0);assert.equal(p.messages.length,0);
 await p.apply();assert.deepEqual(p.messages,['STATUS','DOWNLOAD_UPDATE','ACTIVATE_UPDATE']);
 assert.equal(new URL(p.reloads[0]).searchParams.get('v'),String(version+1));
 assert.ok(new URL(p.reloads[0]).searchParams.get('ts'));
});
test('real launch applies automatically, but same requested version and interaction suppress reload',async()=>{
 let p=fakePage({remote:version+1});await p.check(true);assert.equal(p.reloads.length,1);
 p=fakePage({remote:version+1,currentURL:'?v='+(version+1)});await p.check(true);assert.equal(p.reloads.length,0);
 p=fakePage({remote:version+1});p.context.startupInteraction=true;await p.check(true);assert.equal(p.messages.length,0);
 p=fakePage({remote:version+1});p.state.interactOnDownload=true;await p.check(true);
 assert.deepEqual(p.messages,['STATUS','DOWNLOAD_UPDATE']);assert.equal(p.reloads.length,0);
});
test('incomplete or mixed releases do not reload, legacy protocol allows explicit update',async()=>{
 let p=fakePage({remote:version+1});p.state.htmlVersion=version;await p.check(true);assert.equal(p.reloads.length,0);
 assert.match(p.nodes.get('updateStatus').textContent,/indisponível/);
 p=fakePage({remote:version+1});p.state.fail='DOWNLOAD_UPDATE';await p.check(true);assert.equal(p.reloads.length,0);
 assert.equal(p.nodes.get('updateAppBtn').disabled,false);
 p=fakePage({remote:version+1});p.state.protocol=undefined;await p.check(true);assert.deepEqual(p.messages,['STATUS']);assert.equal(p.reloads.length,0);
 await p.apply();assert.deepEqual(p.messages,['STATUS','STATUS','PREPARE_UPDATE']);assert.equal(p.reloads.length,1);
});
function fakeWorker(initial=version){
 const cacheMap=new Map(),handlers={},requests=[];
 const open=async name=>{
  if(!cacheMap.has(name))cacheMap.set(name,new Map());
  const entries=cacheMap.get(name);
  return {match:async key=>entries.get(String(key))?.clone(),put:async(key,response)=>entries.set(String(key),response.clone())};
 };
 const state={remote:initial,fail:null,htmlVersion:null};
 const self={registration:{scope:'https://example.test/joaninha/'},addEventListener:(type,cb)=>handlers[type]=cb,skipWaiting:inert,clients:{claim:inert}};
 const context=vm.createContext({self,URL,Response,AbortController,Date,setTimeout,clearTimeout,
  caches:{open,keys:async()=>[...cacheMap.keys()],delete:async name=>cacheMap.delete(name)},
  fetch:async(url,options)=>{
   requests.push({url,options});const filename=new URL(url).pathname.split('/').pop();
   if(filename===state.fail)throw Error('network failure');
   return new Response(filename==='index-version.json'?JSON.stringify({version:state.remote}):
    filename==='index.html'?`const GPT_TEST_VERSION=${state.htmlVersion??state.remote};`:'asset');
  }});
 vm.runInContext(sw,context);
 return {context,state,requests,cacheMap};
}
test('service worker installs complete snapshot, stages separately and preserves previous cache',async()=>{
 const w=fakeWorker();await w.context.stageRelease(version);
 assert.equal(await w.context.activeVersion(),version);
 w.state.remote=version+1;await w.context.downloadRelease(version+1);
 assert.equal(await w.context.activeVersion(),version);
 assert.equal((await w.context.offlineStatus()).stagingProtocol,2);
 await w.context.activateRelease(version+1);
 assert.equal(await w.context.activeVersion(),version+1);
 assert.ok(w.cacheMap.has('joaninha-shell-v1-'+version));
 assert.ok(w.requests.filter(r=>r.url.includes('v='+(version+1))).length>20);
 const status=await w.context.offlineStatus();assert.equal(status.ready,true);
});
test('failed or mixed download leaves active offline release usable',async()=>{
 const w=fakeWorker();await w.context.stageRelease(version);w.state.remote=version+1;
 w.state.fail='joaninha-palavras-ptbr.txt';await assert.rejects(w.context.downloadRelease(version+1));
 assert.equal(await w.context.activeVersion(),version);assert.equal((await w.context.offlineStatus()).ready,true);
 w.state.fail=null;w.state.htmlVersion=version;await assert.rejects(w.context.downloadRelease(version+1));
 assert.equal(await w.context.activeVersion(),version);
 await assert.rejects(w.context.activateRelease(version+1));
 w.state.htmlVersion=null;await w.context.stageRelease(version+1);
 assert.equal(await w.context.activeVersion(),version+1);
});
