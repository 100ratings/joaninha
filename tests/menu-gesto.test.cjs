'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const code=html.slice(html.indexOf(' // V161: restore the sidebar swipe'),html.indexOf(' // Vertical drawer scrolling'));
function setup(overrides={}){
 const listeners=new Map(),opened=[],scheduled=[];
 const page={addEventListener(name,fn,options){const l=listeners.get(name)||[];l.push({fn,options});listeners.set(name,l)}};
 const base={
  scene:'home',drawer:false,keyboard:false,draft:'',generating:false,secretMode:false,numberGridVisible:false,
  probingStartupKeyboard:false,manualInjectOpen:false,peekPanelOpen:false,gridSettingsOpen:false,testUpdateInProgress:false,
  themePicker:{hidden:true},workPicker:{classList:{contains:()=>false}},app:{classList:{contains:()=>false}},
  document:{documentElement:{clientWidth:428},body:{classList:{contains:()=>false}},hidden:false},
  $:()=>({getBoundingClientRect:()=>({bottom:90})}),composer:{getBoundingClientRect:()=>({top:785})},
  page,isIOS:true,standalone:true,window:{addEventListener(){}},diag:{event(){}},
  setDrawer(open){opened.push(open);c.drawer=open},setTimeout(fn){scheduled.push(fn)}
 };
 const c=vm.createContext({...base,...overrides});vm.runInContext(code,c);
 function emit(name,{x=30,y=300,id=1,count=1,changed=1,target=page,cancelable=true,pointerType='mouse',button=0,isPrimary=true}={}){
  let prevented=0;const touch={identifier:id,clientX:x,clientY:y};
  const event={target,cancelable,touches:Array.from({length:count},()=>touch),changedTouches:Array.from({length:changed},()=>touch),
   preventDefault:()=>prevented++,pointerId:id,clientX:x,clientY:y,pointerType,button,isPrimary};
  for(const {fn} of listeners.get(name)||[])fn(event);
  return prevented;
 }
 const gesture=(start={},end={})=>{const before=emit('touchstart',start);const after=emit('touchend',{x:175,y:300,count:0,...end});return{before,after}};
 return{c,opened,listeners,emit,gesture,flush:()=>{for(const fn of scheduled.splice(0))fn()}};
}
test('clear rightward swipe opens only in the idle home from the left half',()=>{
 for(const x of [0,15,21,100,200]){
  const m=setup();const result=m.gesture({x},{x:x+125});
  assert.deepEqual(m.opened,[true]);assert.equal(result.after,1);assert.equal(result.before,x<=20?1:0);
 }
 for(const start of [{x:215},{x:300},{y:75},{y:800},{target:{id:'composer'}},{count:2},{changed:2}]){
  const m=setup();m.gesture(start,{x:390});assert.deepEqual(m.opened,[]);
 }
 for(const end of [{x:134},{x:12},{x:0},{x:180,y:340},{x:150,y:347},{x:180,count:1},{x:180,changed:2},{x:180,cancelable:false},{id:2},{x:NaN}]){
  const m=setup();m.gesture({},end);assert.deepEqual(m.opened,[]);
 }
});
test('keyboard, conversation, secret modes, drafts, overlays and updates never activate the swipe',()=>{
 for(const opts of [
  {scene:'thinking'},{scene:'list'},{scene:'end'},{drawer:true},{keyboard:true},{draft:'text'},{generating:true},
  {secretMode:true},{numberGridVisible:true},{probingStartupKeyboard:true},{manualInjectOpen:true},
  {peekPanelOpen:true},{gridSettingsOpen:true},{testUpdateInProgress:true},{themePicker:{hidden:false}},
  {workPicker:{classList:{contains:()=>true}}},{app:{classList:{contains:()=>true}}},
  {document:{documentElement:{clientWidth:428},body:{classList:{contains:()=>true}},hidden:false}},
  {document:{documentElement:{clientWidth:428},body:{classList:{contains:()=>false}},hidden:true}}
 ]){
  const m=setup(opts);const p=m.gesture({x:5},{x:200});assert.deepEqual(m.opened,[]);assert.deepEqual(p,{before:0,after:0});
 }
});
test('vertical movement, cancellation and changes of state invalidate candidates',()=>{
 for(const mode of ['vertical','multitouch','cancel','keyboard','list','different-touch']){
  const m=setup();m.emit('touchstart');
  if(mode==='vertical')m.emit('touchmove',{x:35,y:345});
  if(mode==='multitouch')m.emit('touchmove',{count:2});
  if(mode==='cancel')m.emit('touchcancel');
  if(mode==='keyboard')m.c.keyboard=true;
  if(mode==='list')m.c.scene='end';
  if(mode==='different-touch')m.emit('touchmove',{id:2});
  m.emit('touchend',{x:200,count:0});assert.deepEqual(m.opened,[]);
 }
});
test('native edge interception is limited to safe iOS standalone starts',()=>{
 for(const opts of [{isIOS:false},{standalone:false}]){
  const m=setup(opts);assert.equal(m.gesture({x:5},{x:175}).before,0);assert.deepEqual(m.opened,[true]);
 }
 const unsafe=setup();assert.equal(unsafe.gesture({x:5,cancelable:false},{x:175}).before,0);assert.deepEqual(unsafe.opened,[]);
 const safe=setup();assert.equal(safe.listeners.get('touchstart')[0].options.passive,false);
 assert.equal(safe.listeners.get('touchstart')[0].options.capture,true);
});
test('mouse preview uses the same guards, waits for the drag click, and touch pointers do not duplicate',()=>{
 const m=setup({isIOS:false,standalone:false});m.emit('pointerdown');m.emit('pointerup',{x:175});
 assert.deepEqual(m.opened,[]);m.flush();assert.deepEqual(m.opened,[true]);
 const t=setup();t.emit('pointerdown',{pointerType:'touch'});t.emit('pointerup',{pointerType:'touch',x:175});t.flush();assert.deepEqual(t.opened,[]);
 for(const change of [{scene:'end'},{keyboard:true}]){
  const n=setup();n.emit('pointerdown');n.emit('pointerup',{x:175});Object.assign(n.c,change);n.flush();assert.deepEqual(n.opened,[]);
 }
});
