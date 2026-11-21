/* Joaninha offline runtime. Keep this file stable across ordinary app updates.
   New releases are staged only after the user confirms the existing update prompt. */
'use strict';

const OFFLINE_PREFIX='joaninha-shell-v1-';
const META_CACHE='joaninha-offline-meta-v1';
const SCOPE=self.registration.scope;
const absolute=path=>new URL(path,SCOPE).href;
const META_URL=absolute('__joaninha_offline_state__');
const SHELL=absolute('index.html');
const LIST_NAMES=[
 'aleatorias','animais','animaisaleatorios','aura','celebridades','cervejas','contatoespiritual',
 'familiareszoologicos','filmes','hobbies','insetos','musicas',
 'perguntas','pontosturisticos','personalizada2','personalizada3',
 'nomesfemininosbebes','nomesmasculinosbebes'
];
const FILES=[
 'index.html','chat-test-gpt-2-diag.js','joaninha-list-manager.js','joaninha-work-config.js','manifest.webmanifest',
 'icon-192.png','icon-512.png',
 ...LIST_NAMES.map(name=>'chat-test-gpt-2-listas/'+name+'.txt')
];
const VERSION_PATTERN=/const GPT_TEST_VERSION\s*=\s*(\d+)\s*;/;
let ongoingStage=null;

async function activeVersion(){
 try{
  const meta=await caches.open(META_CACHE);
  const entry=await meta.match(META_URL);
  if(!entry)return null;
  const value=Number((await entry.json()).version);
  return Number.isSafeInteger(value)&&value>=1?value:null;
 }catch(error){return null;}
}

async function missingFiles(version){
 if(!Number.isSafeInteger(version)||version<1)return FILES.slice();
 const cache=await caches.open(OFFLINE_PREFIX+version);
 const statuses=await Promise.all(FILES.map(async file=>{
  const entry=await cache.match(absolute(file));
  return !!entry&&entry.ok;
 }));
 return FILES.filter((_,i)=>!statuses[i]);
}

async function offlineStatus(){
 const version=await activeVersion();
 const missing=await missingFiles(version);
 return {ready:!!version&&missing.length===0,version,missingCount:missing.length};
}

async function getOnlineFile(path){
 const response=await fetch(absolute(path),{cache:'no-store'});
 if(!response.ok||response.type==='opaque')throw Error('Arquivo indisponível: '+path);
 return response;
}

async function getWebsiteVersion(){
 const html=await getOnlineFile('index.html');
 const version=Number((await html.clone().text()).match(VERSION_PATTERN)?.[1]);
 if(!Number.isSafeInteger(version)||version<1)throw Error('Versão do HTML inválida');
 return version;
}

async function stageRelease(version){
 if(!Number.isSafeInteger(version)||version<1)throw Error('Versão inválida');
 if(ongoingStage)return ongoingStage.then(()=>stageRelease(version));
 ongoingStage=(async()=>{
  const current=await activeVersion();
  if(current===version&&(await missingFiles(version)).length===0)
   return {ready:true,version};
  // Download everything before touching the currently active cache.
  const responses=await Promise.all(FILES.map(path=>getOnlineFile(path)));
  const htmlVersion=Number((await responses[0].clone().text()).match(VERSION_PATTERN)?.[1]);
  if(htmlVersion!==version)throw Error('Publicação ainda não disponível');
  const targetName=OFFLINE_PREFIX+version;
  const target=await caches.open(targetName);
  try{
   for(let i=0;i<FILES.length;i++){
    await target.put(absolute(FILES[i]),responses[i]);
   }
   if((await missingFiles(version)).length)throw Error('Cache incompleto');
   const meta=await caches.open(META_CACHE);
   await meta.put(META_URL,new Response(JSON.stringify({version}),{
    headers:{'Content-Type':'application/json'}
   }));
  }catch(error){
   // Never remove the cache still in use.
   if(current!==version)await caches.delete(targetName);
   throw error;
  }
  for(const name of await caches.keys()){
   if(name.startsWith(OFFLINE_PREFIX)&&name!==targetName)
    await caches.delete(name);
  }
  return {ready:true,version};
 })();
 try{return await ongoingStage;}
 finally{ongoingStage=null;}
}

async function repairOffline(){
 const current=await activeVersion();
 if(current){
  const missing=await missingFiles(current);
  if(!missing.length)return {ready:true,version:current};
  const target=await caches.open(OFFLINE_PREFIX+current);
  for(const path of missing){
   const response=await getOnlineFile(path);
   if(path==='index.html'){
    const htmlVersion=Number((await response.clone().text()).match(VERSION_PATTERN)?.[1]);
    if(htmlVersion!==current){
     // The previous HTML is no longer served online, so recover a complete
     // current release instead of leaving the installation broken.
     return stageRelease(htmlVersion);
    }
   }
   await target.put(absolute(path),response);
  }
  return await offlineStatus();
 }
 // Storage completely cleared: rebuild the version currently published.
 const latest=await getWebsiteVersion();
 return stageRelease(latest);
}

async function shellResponse(request){
 const current=await activeVersion();
 if(current){
  const cache=await caches.open(OFFLINE_PREFIX+current);
  const saved=await cache.match(SHELL);
  if(saved)return saved;
 }
 try{return await fetch(request);}
 catch(error){
  return new Response(
   '<!doctype html><html lang="pt-BR"><meta charset="utf-8">'+
   '<meta name="viewport" content="width=device-width,initial-scale=1">'+
   '<title>Joaninha offline</title><body style="background:#000;color:#fff;'+
   'font:16px system-ui;padding:38px 20px">'+
   '<h2>Arquivos offline indisponíveis</h2>'+
   '<p>Conecte-se à internet e abra a Joaninha novamente</p></body></html>',
   {status:503,headers:{'Content-Type':'text/html; charset=utf-8'}}
  );
 }
}

async function staticResponse(request,path,event){
 const version=await activeVersion();
 const cache=version?await caches.open(OFFLINE_PREFIX+version):null;
 const saved=cache?await cache.match(absolute(path)):null;
 if(saved)return saved;
 try{
  const response=await fetch(request);
  if(response.ok&&cache)
   event.waitUntil(cache.put(absolute(path),response.clone()).catch(()=>{}));
  return response;
 }catch(error){
  return new Response('Arquivo offline indisponível',{status:503});
 }
}

async function listResponse(request,path,event){
 const version=await activeVersion();
 const cache=version?await caches.open(OFFLINE_PREFIX+version):null;
 const saved=cache?await cache.match(absolute(path)):null;
 // Keep the active version's list snapshot stable even while online.
 // New TXT data becomes active only after PREPARE_UPDATE stages all versioned resources.
 if(saved)return saved;
 // An explicitly offline list request must never initiate a network request
 // if its saved snapshot is unavailable.
 if(new URL(request.url).searchParams.get('offline')==='1')
  return new Response('Lista offline indisponível',{status:503});
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),2200);
 try{
  const response=await fetch(request,{cache:'no-store',signal:controller.signal});
  if(!response.ok)throw Error('Arquivo indisponível');
  if(cache){
   const copy=response.clone();
   event.waitUntil(cache.put(absolute(path),copy).catch(()=>{}));
  }
  return response;
 }catch(error){
  return saved||new Response('Lista offline indisponível',{status:503});
 }finally{clearTimeout(timer);}
}

self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const state=await offlineStatus();
  if(!state.ready){
   if(state.version)await repairOffline();
   else await stageRelease(await getWebsiteVersion());
  }
  await self.skipWaiting();
 })());
});

self.addEventListener('activate',event=>{
 event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url),scope=new URL(SCOPE);
 if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 const path=url.pathname.slice(scope.pathname.length);
 if(request.mode==='navigate'&&(path===''||path==='index.html')){
  event.respondWith(shellResponse(request));
  return;
 }
 if(/^chat-test-gpt-2-listas\/[a-z0-9]+\.txt$/.test(path)){
  event.respondWith(listResponse(request,path,event));
  return;
 }
 if(['chat-test-gpt-2-diag.js','joaninha-list-manager.js','joaninha-work-config.js','manifest.webmanifest','icon-192.png','icon-512.png'].includes(path)){
  event.respondWith(staticResponse(request,path,event));
  return;
 }
 // index.html fetched explicitly to check a proposed version and
 // index-version.json must reach the network, never an old offline cache.
});

self.addEventListener('message',event=>{
 const port=event.ports&&event.ports[0];
 if(!port)return;
 event.waitUntil((async()=>{
  try{
   const data=event.data||{};
   let result;
   if(data.type==='STATUS')result=await offlineStatus();
   else if(data.type==='REPAIR')result=await repairOffline();
   else if(data.type==='PREPARE_UPDATE')result=await stageRelease(Number(data.version));
   else throw Error('Mensagem desconhecida');
   port.postMessage({ok:true,...result});
  }catch(error){
   port.postMessage({ok:false,error:String(error?.message||error)});
  }
 })());
});
