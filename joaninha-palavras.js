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
 // The full list is already in the DOM when the first line appears.
 // Only a short opening section is concealed; a real scroll reveals everything.
 function reveal({prepared,scroller,target,prefixCount=null,onFinish=()=>{}}){
  const text=document.createElement('div');
  text.className='words-content';
  target.replaceChildren(text);
  const lines=prepared.original.split('\n');
  if(prefixCount===null){
   const height=Number.parseFloat(getComputedStyle(text).lineHeight)||24;
   const available=scroller.getBoundingClientRect().bottom-text.getBoundingClientRect().top;
   prefixCount=Math.max(1,Math.min(64,Math.ceil(available/height)+2));
  }
  const count=Math.min(lines.length,Math.max(1,prefixCount));
  const opening=[];
  for(let i=0;i<count;i++){
   const span=document.createElement('span');
   span.className='words-opening-line';
   span.style.visibility='hidden';
   span.appendChild(document.createTextNode(lines[i]+(i<lines.length-1?'\n':'')));
   text.appendChild(span);opening.push(span);
  }
  if(count<lines.length)text.appendChild(document.createTextNode(lines.slice(count).join('\n')));
  let done=false,timer=null,index=0,touch=null,lastTop=scroller.scrollTop;
  function close(notify,gesture={}){
   if(done)return;
   done=true;
   if(timer!==null)clearTimeout(timer);
   bindings.forEach(([type,handler])=>scroller.removeEventListener(type,handler));
   if(target.contains(text)){
    // A touch can be targeting an opening span. Keep those DOM nodes
    // alive until the gesture ends, so its touchend/touchcancel can bubble.
    if(notify&&gesture.gesture)opening.forEach(span=>{span.style.visibility='visible';});
    else text.replaceChildren(document.createTextNode(prepared.original));
    if(notify)onFinish(gesture,text);
   }
  }
  function emit(){
   if(done||!target.contains(text)){close(false);return;}
   opening[index++].style.visibility='visible';
   if(index===count){close(true,{contact:touch!==null,gesture:touch!==null});return;}
   timer=setTimeout(emit,76+(index%7===0?90:0));
  }
  function onScroll(){
   const top=scroller.scrollTop;
   if(Math.abs(top-lastTop)>.5)close(true,{contact:touch!==null,gesture:touch!==null,moved:touch!==null});
   lastTop=top;
  }
  function onStart(e){touch=e.touches.length===1?e.touches[0].clientY:null;}
  function onMove(e){
   if(touch!==null&&e.touches.length===1&&Math.abs(e.touches[0].clientY-touch)>6)close(true,{contact:true,gesture:true});
  }
  function onEnd(){touch=null;}
  function onWheel(e){if(e.deltaY!==0)close(true,{gesture:true});}
  const bindings=[['scroll',onScroll],['touchstart',onStart],['touchmove',onMove],
   ['touchend',onEnd],['touchcancel',onEnd],['wheel',onWheel]];
  bindings.forEach(([type,handler])=>scroller.addEventListener(type,handler,{passive:true}));
  timer=setTimeout(emit,250);
  return {dispose(){close(false);}};
 }
 function mount({prepared,scroller,target,initialGesture={},openingText=null,allowed=()=>true,pauseMs=PAUSE_MS,onComplete=()=>{},onStateChange=()=>{}}){
  const reuse=!!(initialGesture.gesture&&openingText&&target.contains(openingText));
  const text=reuse?openingText:document.createElement('div');
  text.className='words-content';
  let node=null;
  function render(value){
   if(node)node.data=value;
   else{node=document.createTextNode(value);text.replaceChildren(node);}
  }
  if(!reuse){render(prepared.original);target.replaceChildren(text);}
  const machine=sequence(prepared.phases.length);
  let disposed=false,timer=null,lastTop=scroller.scrollTop;
  let contact=!!initialGesture.contact,scrollUntil=initialGesture.gesture?performance.now()+1600:0,
   hasMoved=!!initialGesture.moved;
  const stopTimer=()=>{if(timer!==null)clearTimeout(timer);timer=null;};
  const permitted=()=>!disposed&&allowed()&&target.contains(text);
  const snooze=()=>{
   stopTimer();
   if(!prepared.phases.length||!['preview','running'].includes(machine.state)||contact||!hasMoved)return;
   timer=setTimeout(()=>{
    timer=null;
    if(!permitted()||contact)return;
    // The first qualified pause arms the effect without changing any words.
    const changed=machine.state==='preview'?machine.arm():machine.pause();
    if(changed){
     hasMoved=false;scrollUntil=0;
     // Consolidate the opening only when the first gesture has ended.
     if(machine.state==='armed'&&!node)render(prepared.original);
     onStateChange(machine.state,machine.state==='ready'&&machine.index===prepared.phases.length-1);
    }
   },pauseMs);
  };
  function onScroll(){
   const top=scroller.scrollTop,delta=Math.abs(top-lastTop);lastTop=top;
   if(!permitted()||delta<0.5||(!contact&&performance.now()>=scrollUntil))return;
   if(!prepared.phases.length||machine.state==='complete')return;
   scrollUntil=performance.now()+1600;
   hasMoved=true;
   const result=machine.moved();
   if(result.changed){
    // One text-node write; same line count and line height, no scroll reset,
    // animation, rebuild or visible change while sitting still.
    render(result.complete?prepared.clean:prepared.phases[result.index]);
    onStateChange(machine.state);
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
  const bindings=[
   [scroller,'scroll',onScroll], [scroller,'touchstart',onTouchStart],
   [scroller,'touchend',onTouchEnd], [scroller,'touchcancel',onTouchEnd],
   [scroller,'wheel',onWheel]
  ];
  bindings.forEach(([el,type,handler])=>el.addEventListener(type,handler,{passive:true}));
  onStateChange(machine.state);
  snooze();
  return {
   get original(){return prepared.original;},
   get state(){return machine.state;},
   dispose(clean=true){
    if(disposed)return;
    disposed=true;stopTimer();
    bindings.forEach(([el,type,handler])=>el.removeEventListener(type,handler));
    if(clean&&target.contains(text)&&machine.state!=='complete')render(prepared.original);
    onStateChange('preview');
   }
  };
 }
 const api={COUNT,PAUSE_MS,MIN_POOL,MAX_POSITION,cleanWords,secretLetters,parseQuantity,matches,draw,display,prepare,sequence,reveal,mount};
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.JoaninhaWords=api;
})(typeof window==='object'?window:null);
