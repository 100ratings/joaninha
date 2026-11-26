/* Joaninha V142: independent local word-list routine. No network integrations here. */
(function(root){
 'use strict';
 const COUNT=10000, PAUSE_MS=3000, MIN_POOL=40, MAX_POSITION=9, MAX_SECRET=32;
 const normalize=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const wordPattern=/^[a-zàáâãéêíóôõúüç]{3,16}$/u;
 const cleanWords=raw=>Array.from(new Map(String(raw).split(/\r?\n/)
  .map(s=>s.trim().normalize('NFC').toLowerCase()).filter(s=>wordPattern.test(s))
  .map(s=>[normalize(s),s])).values());
 function secretLetters(input){
  const value=normalize(String(input).trim()).replace(/[\s-]+/g,'');
  if(!/^[a-z]+$/.test(value)||value.length>MAX_SECRET)throw Error('Palavra secreta inválida');
  return Array.from(value);
 }
 function shuffle(values,random){
  const out=values.slice();
  for(let i=out.length-1;i>0;i--){
   const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];
  }
  return out;
 }
 function draw(pool,count,random=Math.random){
  if(pool.length<MIN_POOL)throw Error('Vocabulário insuficiente para esta posição');
  const out=[],lastSeen=new Map(),gap=Math.min(32,Math.floor(pool.length/2));
  let bag=[];
  while(out.length<count){
   if(!bag.length)bag=shuffle(pool,random);
   let at=bag.length-1;
   if(out.length-(lastSeen.get(bag[at])??-Infinity)<=gap){
    const safe=bag.findIndex(w=>out.length-(lastSeen.get(w)??-Infinity)>gap);
    if(safe>=0)at=safe;
   }
   const word=bag[at];
   bag[at]=bag[bag.length-1];bag.pop();
   lastSeen.set(word,out.length);out.push(word);
  }
  return out;
 }
 function display(words){
  return words.map(w=>'•  '+w.charAt(0).toLocaleUpperCase('pt-BR')+w.slice(1)).join('\n');
 }
 function parseQuantity(plain){
  const matched=plain.match(/\b(\d{1,2})[.\s,](\d{3})\b/)||
   plain.match(/\b(\d{1,2})\s+mil\b/);
  if(matched)return matched[2]?Number(matched[1]+matched[2]):Number(matched[1])*1000;
  if(/\bdez\s+mil\b/.test(plain))return 10000;
  if(/\bcinco\s+mil\b/.test(plain))return 5000;
  const digits=plain.match(/\b\d{1,5}\b/);
  return digits?Number(digits[0]):COUNT;
 }
 function matches(plain){
  return /\bpalavras?\s+(?:aleatorias?|ao acaso|randomicas?)\b/.test(plain)||
   /\b(?:\d{1,5}|dez|cinco)(?:[.,]\d{3}|\s+mil)?\s+palavras\s*[.!?]*$/.test(plain);
 }
 function prepare(words,quantity,secret=null,position=null,random=Math.random){
  if(!Number.isInteger(quantity)||quantity<1||quantity>COUNT)throw Error('Quantidade de palavras inválida');
  // Keep ordinary, high-frequency vocabulary for the demonstration.
  const general=words.slice(0,Math.min(words.length,16000));
  const original=display(draw(general,quantity,random));
  if(secret===null)return {original,phases:[],clean:original,quantity};
  if(!Number.isInteger(position)||position<1||position>MAX_POSITION)
   throw Error('Posição de letra inválida');
  const letters=secretLetters(secret);
  const pools=new Map();
  for(const letter of new Set(letters)){
   // Use unaccented target letters so the revealed spelling is unambiguous.
   // Accents elsewhere in each displayed word are preserved.
   const all=words.filter(w=>w[position-1]===letter);
   const common=general.filter(w=>w[position-1]===letter);
   const pool=common.length>=120?common:all;
   if(pool.length<MIN_POOL)throw Error('Vocabulário insuficiente para esta posição');
   pools.set(letter,pool);
  }
  const phases=letters.map(letter=>display(draw(pools.get(letter),quantity,random)));
  return {original,phases,clean:display(draw(general,quantity,random)),quantity};
 }
 // Logic shared by browser and deterministic tests. Waiting does not alter text:
 // only a new movement after a qualified stop advances the whole list.
 function sequence(phaseCount){
  let state='preview',index=-1;
  return {
   arm(){if(state!=='preview'||!phaseCount)return false;state='armed';return true;},
   moved(){
    if(state==='armed'||state==='ready'){
     index++;
     state=index<phaseCount?'running':'complete';
     return {changed:true,index,complete:state==='complete'};
    }
    return {changed:false,index,complete:state==='complete'};
   },
   pause(){if(state==='running'){state='ready';return true;}return false;},
   get state(){return state;},
   get index(){return index;}
  };
 }
 function mount({prepared,scroller,target,armZone,allowed=()=>true,pauseMs=PAUSE_MS,onComplete=()=>{}}){
  const text=document.createElement('div');
  text.className='words-content';
  const node=document.createTextNode(prepared.original);
  text.appendChild(node);
  target.replaceChildren(text);
  const machine=sequence(prepared.phases.length);
  let disposed=false,timer=null,lastTop=scroller.scrollTop,firstTap=null,tap=null;
  let contact=false,scrollUntil=0,hasMoved=false;
  const stopTimer=()=>{if(timer!==null)clearTimeout(timer);timer=null;};
  const permitted=()=>!disposed&&allowed()&&target.contains(text);
  const snooze=()=>{
   stopTimer();
   if(machine.state!=='running'||contact||!hasMoved)return;
   timer=setTimeout(()=>{
    timer=null;
    if(permitted()&&!contact)machine.pause();
   },pauseMs);
  };
  function onScroll(){
   const top=scroller.scrollTop,delta=Math.abs(top-lastTop);lastTop=top;
   if(!permitted()||delta<0.5||performance.now()>scrollUntil&&!contact)return;
   if(machine.state==='preview'||machine.state==='complete')return;
   scrollUntil=performance.now()+1600;
   hasMoved=true;
   const result=machine.moved();
   if(result.changed){
    // One text-node write; same line count and line height, no scroll reset,
    // animation, rebuild or visible change while sitting still.
    node.data=result.complete?prepared.clean:prepared.phases[result.index];
   }
   if(result.complete){stopTimer();onComplete();return;}
   snooze();
  }
  function onTouchStart(e){
   if(!permitted()||e.touches.length!==1)return;
   contact=true;scrollUntil=performance.now()+1600;stopTimer();
  }
  function onTouchEnd(e){
   if(e.touches.length)return;
   contact=false;scrollUntil=performance.now()+1600;snooze();
  }
  function onWheel(){
   if(permitted())scrollUntil=performance.now()+1600;
  }
  function onPointerDown(e){
   if(!permitted()||!e.isPrimary||e.button!==0)return;
   tap={id:e.pointerId,x:e.clientX,y:e.clientY,at:performance.now()};
  }
  function onPointerUp(e){
   const previous=tap;tap=null;
   if(!previous||previous.id!==e.pointerId||!permitted()||
      Math.hypot(e.clientX-previous.x,e.clientY-previous.y)>10||
      performance.now()-previous.at>350)return;
   const now=performance.now();
   if(firstTap!==null&&now-firstTap<=450){
    firstTap=null;
    if(machine.arm()){
     armZone.hidden=true;lastTop=scroller.scrollTop;
     contact=false;scrollUntil=0;hasMoved=false;
    }
   }else firstTap=now;
  }
  function onPointerCancel(){tap=null;}
  const bindings=[
   [scroller,'scroll',onScroll], [scroller,'touchstart',onTouchStart],
   [scroller,'touchend',onTouchEnd], [scroller,'touchcancel',onTouchEnd],
   [scroller,'wheel',onWheel], [armZone,'pointerdown',onPointerDown],
   [armZone,'pointerup',onPointerUp], [armZone,'pointercancel',onPointerCancel]
  ];
  bindings.forEach(([el,type,handler])=>el.addEventListener(type,handler,{passive:true}));
  armZone.hidden=!prepared.phases.length;
  return {
   get original(){return prepared.original;},
   get state(){return machine.state;},
   dispose(clean=true){
    if(disposed)return;
    disposed=true;stopTimer();armZone.hidden=true;
    bindings.forEach(([el,type,handler])=>el.removeEventListener(type,handler));
    if(clean&&target.contains(text)&&machine.state!=='complete')node.data=prepared.original;
   }
  };
 }
 const api={COUNT,PAUSE_MS,MIN_POOL,MAX_POSITION,cleanWords,secretLetters,parseQuantity,matches,draw,display,prepare,sequence,mount};
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.JoaninhaWords=api;
})(typeof window==='object'?window:null);
