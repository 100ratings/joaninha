'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const code=html.slice(html.indexOf(' function protectConversationRightEdge('),html.indexOf(' // A tap on any part of the conversation'));
function setup({ios=true,standalone=true,scene='end',drawer=false,width=428}={}){
 const listeners=[];
 const context=vm.createContext({isIOS:ios,standalone,scene,drawer,document:{documentElement:{clientWidth:width}},scroller:{addEventListener:(...args)=>listeners.push(args)}});
 vm.runInContext(code,context);
 return {listeners,touch({x=427,count=1,changed=1,cancelable=true,interactive=false}={}){
  let prevented=0;
  for(const [,handler] of listeners)handler({cancelable,touches:Array.from({length:count},()=>({clientX:x})),changedTouches:Array.from({length:changed}),target:{closest:()=>interactive?{}:null},preventDefault:()=>prevented++});
  return prevented;
 }};
}
test('right-edge guard registers only in iOS standalone with a cancellable capture listener',()=>{
 for(const config of [{ios:false},{standalone:false},{ios:false,standalone:false}])assert.equal(setup(config).listeners.length,0);
 const p=setup();assert.equal(p.listeners.length,1);assert.equal(p.listeners[0][0],'touchstart');
 assert.equal(p.listeners[0][2].capture,true);assert.equal(p.listeners[0][2].passive,false);
});
test('only the final 20 CSS pixels of active conversation content are protected',()=>{
 for(const scene of ['thinking','list','end']){
  const p=setup({scene});for(const x of [408,418,427,428])assert.equal(p.touch({x}),1);
  for(const x of [0,10,20,214,407,429,NaN])assert.equal(p.touch({x}),0);
 }
 for(const config of [{scene:'home'},{drawer:true},{width:0}])assert.equal(setup(config).touch(),0);
});
test('controls, multiple touches and noncancelable events are not intercepted',()=>{
 const p=setup();for(const opts of [{interactive:true},{count:2},{changed:2},{cancelable:false},{count:0}])assert.equal(p.touch(opts),0);
});
