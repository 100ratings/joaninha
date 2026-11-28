/* Joaninha V142: independent local word-list routine. No network integrations here. */
(function(root){
 'use strict';
 const COUNT=10000, PAUSE_MS=3000, INDICATOR_FADE_MS=2000, MIN_POOL=40, MAX_POSITION=9, MAX_SECRET=32;
 const normalize=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const wordPattern=/^[a-zàáâãéêíóôõúüç]{3,16}$/u;
 // Optional V151 pool/family metadata is packaged with the same vocabulary.
 // Old plain corpora remain valid; old app versions ignore metadata rows.
 const curated=new WeakMap();
 function cleanWords(raw){
  const rows=String(raw).split(/\r?\n/);
  const words=Array.from(new Map(rows
   .map(s=>s.trim().normalize('NFC').toLowerCase()).filter(s=>wordPattern.test(s))
   .map(s=>[normalize(s),s])).values());
  const pools=new Map(),families=new Map();
  function decode(encoded){
   if(!encoded||encoded.length%3||!/^[0-9a-z]+$/.test(encoded))return null;
   const found=[];
   for(let i=0;i<encoded.length;i+=3){
    const word=words[parseInt(encoded.slice(i,i+3),36)];
    if(word===undefined)return null;
    found.push(word);
   }
   return new Set(found).size===found.length?found:null;
  }
  for(const row of rows){
   if(row.startsWith('#pool ')){
    const match=row.match(/^#pool (g[0-9]|[1-9][a-z]) ([0-9a-z]+)$/);
    if(!match)continue;
    const key=match[1],pool=decode(match[2]);
    const ordinary=key[0]==='g',position=Number(key[ordinary?1:0]);
    const minLength=Math.max(3,position);
    if(!pool||pool.length<MIN_POOL||!pool.every(w=>w.length>=minLength&&(ordinary||w[position-1]===key[1])))continue;
    pools.set(key,pool);
   }else if(row.startsWith('#family ')){
    const group=decode(row.slice(8));
    if(group&&group.length>1)for(const word of group)families.set(word,group[0]);
   }
  }
  if(pools.size)curated.set(words,{pools,families});
  return words;
 }
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
 function draw(pool,count,random=Math.random,families=null){
  if(pool.length<MIN_POOL)throw Error('Vocabulário insuficiente para esta posição');
  const out=[],lastSeen=new Map(),lastFamily=new Map(),gap=Math.min(32,Math.floor(pool.length/2));
  const familyOf=w=>families?.get(w)??w;
  let bag=[];
  while(out.length<count){
   if(!bag.length)bag=shuffle(pool,random);
   let at=bag.length-1;
   const safeWord=w=>out.length-(lastSeen.get(w)??-Infinity)>gap;
   const safeFamily=w=>!families||out.length-(lastFamily.get(familyOf(w))??-Infinity)>3;
   if(!safeWord(bag[at])||!safeFamily(bag[at])){
    const safe=bag.findIndex(w=>safeWord(w)&&safeFamily(w));
    if(safe>=0)at=safe;
    else if(!safeWord(bag[at])){
     const exact=bag.findIndex(safeWord);
     if(exact>=0)at=exact;
    }
   }
   const word=bag[at];
   bag[at]=bag[bag.length-1];bag.pop();
   lastSeen.set(word,out.length);
   if(families)lastFamily.set(familyOf(word),out.length);
   out.push(word);
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
 // Prefer familiar short words; add longer ones in length order only
 // when necessary to maintain a sufficiently varied pool.
 function preferredPool(words,minLength,desired,limit){
  const shortMax=Math.max(6,minLength);
  const short=words.filter(w=>w.length>=minLength&&w.length<=shortMax).slice(0,limit);
  if(short.length>=desired)return short;
  const longer=words.filter(w=>w.length>shortMax).sort((a,b)=>a.length-b.length);
  return short.concat(longer.slice(0,desired-short.length));
 }
 function prepare(words,quantity,secret=null,position=null,random=Math.random){
  if(!Number.isInteger(quantity)||quantity<1||quantity>COUNT)throw Error('Quantidade de palavras inválida');
  if(secret!==null&&(!Number.isInteger(position)||position<1||position>MAX_POSITION))
   throw Error('Posição de letra inválida');
  const minLength=secret===null?3:Math.max(3,position);
  // Keep the preview and restoration naturally suited to the chosen position.
  const metadata=curated.get(words);
  const general=metadata?.pools.get('g'+(secret===null?0:position))??preferredPool(words,minLength,120,4000);
  const original=display(draw(general,quantity,random,metadata?.families));
  if(secret===null)return {original,phases:[],clean:original,quantity};
  const letters=secretLetters(secret);
  const pools=new Map();
  for(const letter of new Set(letters)){
   // Use unaccented target letters so the revealed spelling is unambiguous.
   // Accents elsewhere in each displayed word are preserved.
   const all=words.filter(w=>w[position-1]===letter);
   const pool=metadata?.pools.get(String(position)+letter)??preferredPool(all,minLength,120,480);
   if(pool.length<MIN_POOL)throw Error('Vocabulário insuficiente para esta posição');
   pools.set(letter,pool);
  }
  const phases=letters.map(letter=>display(draw(pools.get(letter),quantity,random,metadata?.families)));
  return {original,phases,clean:display(draw(general,quantity,random,metadata?.families)),quantity};
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
 function mount({prepared,scroller,target,initialGesture={},openingText=null,allowed=()=>true,pauseMs=PAUSE_MS,onComplete=()=>{},onStateChange=()=>{},onPauseProgress=()=>{}}){
  const reuse=!!(initialGesture.gesture&&openingText&&target.contains(openingText));
  let text=reuse?openingText:document.createElement('div');
  text.className='words-content';
  let node=null,standby=null,standbyNode=null,standbyValue=null;
  function render(value){
   if(node)node.data=value;
   else{node=document.createTextNode(value);text.replaceChildren(node);}
  }
  if(!reuse){render(prepared.original);target.replaceChildren(text);}
  const machine=sequence(prepared.phases.length);
  let disposed=false,timer=null,stageTimer=null,cleanupTimer=null,motionFrame=null,lastTop=scroller.scrollTop;
  let contact=!!initialGesture.contact,scrollUntil=initialGesture.gesture?performance.now()+1600:0,
   hasMoved=!!initialGesture.moved;
  let indicatorTimer=null,indicatorStarted=false;
  const stopIndicator=(restore=true)=>{
   if(indicatorTimer!==null)clearTimeout(indicatorTimer);
   indicatorTimer=null;
   if(indicatorStarted&&restore)onPauseProgress('running',false);
   indicatorStarted=false;
  };
  const stopTimer=(restore=true)=>{
   if(timer!==null)clearTimeout(timer);
   timer=null;stopIndicator(restore);
  };
  const stopStage=()=>{if(stageTimer!==null)clearTimeout(stageTimer);stageTimer=null;};
  const stopCleanup=()=>{if(cleanupTimer!==null)clearTimeout(cleanupTimer);cleanupTimer=null;};
  const stopMotionFrame=()=>{
   if(motionFrame!==null&&typeof cancelAnimationFrame==='function')cancelAnimationFrame(motionFrame);
   motionFrame=null;
  };
  const permitted=()=>!disposed&&allowed()&&target.contains(text);
  const nextValue=()=>prepared.phases[machine.index+1]??prepared.clean;
  function removeStandby(){
   if(standby&&target.contains(standby))target.removeChild(standby);
   standby=null;standbyNode=null;standbyValue=null;
   target.classList?.remove('words-double-buffer');
  }
  function stage(value){
   if(!permitted()||contact||standbyValue===value||!target.classList||
      typeof text.getBoundingClientRect!=='function')return;
   // The only expensive text/layout update happens while stopped, not during
   // the swipe. The two layers occupy exactly the same grid cell.
   if(!node)render(prepared.original);
   try{
    if(!standby){
     standby=document.createElement('div');
     standby.className='words-buffer';
     standby.setAttribute('aria-hidden','true');
     standbyNode=document.createTextNode(value);
     standby.appendChild(standbyNode);
     target.classList.add('words-double-buffer');
     target.appendChild(standby);
    }else standbyNode.data=value;
    // Flush layout for both layers now, keeping the existing scroll offset.
    const height=text.getBoundingClientRect().height;
    const nextHeight=standby.getBoundingClientRect().height;
    if(height<=0||Math.abs(height-nextHeight)>1){removeStandby();return;}
    standbyValue=value;
   }catch(error){removeStandby();}
  }
  function promote(value){
   if(standby&&standbyValue===value&&target.contains(standby)){
    // No text mutation, reparenting, animation, or scroll-position write on
    // the switching frame. Keep the former layer attached for touchend.
    text.className='words-buffer';text.setAttribute('aria-hidden','true');
    standby.className='words-content';standby.removeAttribute('aria-hidden');
    const priorText=text,priorNode=node;
    text=standby;node=standbyNode;
    standby=priorText;standbyNode=priorNode;standbyValue=null;
   }else{
    // If layout could not be prepared, retain the proven V151 behavior.
    render(value);
   }
  }
  function cleanupWhenQuiet(){
   stopCleanup();
   if(contact||machine.state!=='complete'||!standby)return;
   cleanupTimer=setTimeout(()=>{
    cleanupTimer=null;
    if(!disposed&&!contact&&machine.state==='complete')removeStandby();
   },180);
  }
  const snooze=()=>{
   stopTimer();stopStage();
   if(!prepared.phases.length||!['preview','running'].includes(machine.state)||contact||!hasMoved)return;
   // Build the next layer early in the existing three-second pause.
   if(standbyValue!==nextValue())stageTimer=setTimeout(()=>{
    stageTimer=null;
    if(permitted()&&!contact&&['preview','running'].includes(machine.state))stage(nextValue());
   },Math.min(160,Math.max(0,pauseMs-1)));
   // While a forced letter is displayed, start the visual fade early enough
   // to finish at the existing pause deadline. Only the indicator changes;
   // actual readiness and the following word switch still use the old timer.
   if(machine.state==='running')indicatorTimer=setTimeout(()=>{
    indicatorTimer=null;
    if(!permitted()||contact||machine.state!=='running')return;
    indicatorStarted=true;
    onPauseProgress('ready',machine.index===prepared.phases.length-1);
   },Math.max(0,pauseMs-INDICATOR_FADE_MS));
   timer=setTimeout(()=>{
    timer=null;
    if(!permitted()||contact){stopIndicator();return;}
    stopIndicator(false);
    // The first qualified pause arms the effect without changing any words.
    const changed=machine.state==='preview'?machine.arm():machine.pause();
    if(changed){
     hasMoved=false;scrollUntil=0;stopStage();
     // Consolidate the opening only when the first gesture has ended.
     if(machine.state==='armed'&&!node)render(prepared.original);
     if(standbyValue!==nextValue())stage(nextValue());
     onStateChange(machine.state,machine.state==='ready'&&machine.index===prepared.phases.length-1);
    }
   },pauseMs);
  };
  function onScroll(){
   const top=scroller.scrollTop,delta=Math.abs(top-lastTop);lastTop=top;
   if(!permitted()||delta<0.5||(!contact&&performance.now()>=scrollUntil))return;
   if(!prepared.phases.length)return;
   if(machine.state==='complete'){cleanupWhenQuiet();return;}
   scrollUntil=performance.now()+1600;
   hasMoved=true;
   const result=machine.moved();
   if(result.changed){
    promote(result.complete?prepared.clean:prepared.phases[result.index]);
    onStateChange(machine.state);
   }
   if(result.complete){stopTimer();stopStage();cleanupWhenQuiet();onComplete();return;}
   snooze();
  }
  function onTouchStart(e){
   if(!permitted()||e.touches.length!==1)return;
   contact=true;scrollUntil=performance.now()+1600;stopTimer();stopStage();stopCleanup();
  }
  function onTouchMove(e){
   if(!permitted()||!contact||e.touches.length!==1||
      !['armed','ready'].includes(machine.state))return;
   // On iOS the native scroll may already have advanced before its scroll
   // event is dispatched. Observe real displacement, never predict a swipe.
   onScroll();
   if(['armed','ready'].includes(machine.state)&&motionFrame===null&&typeof requestAnimationFrame==='function'){
    motionFrame=requestAnimationFrame(()=>{
     motionFrame=null;
     if(contact&&permitted()&&['armed','ready'].includes(machine.state))onScroll();
    });
   }
  }
  function onTouchEnd(e){
   if(e.touches.length)return;
   stopMotionFrame();
   if(contact&&['armed','ready'].includes(machine.state))onScroll();
   contact=false;scrollUntil=performance.now()+1600;snooze();cleanupWhenQuiet();
  }
  function onWheel(){
   if(permitted()){scrollUntil=performance.now()+1600;stopCleanup();}
  }
  const bindings=[
   [scroller,'scroll',onScroll], [scroller,'touchstart',onTouchStart],
   [scroller,'touchmove',onTouchMove], [scroller,'touchend',onTouchEnd],
   [scroller,'touchcancel',onTouchEnd], [scroller,'wheel',onWheel]
  ];
  bindings.forEach(([el,type,handler])=>el.addEventListener(type,handler,{passive:true}));
  onStateChange(machine.state);
  snooze();
  return {
   get original(){return prepared.original;},
   get state(){return machine.state;},
   dispose(clean=true){
    if(disposed)return;
    disposed=true;stopTimer(false);stopStage();stopCleanup();stopMotionFrame();
    bindings.forEach(([el,type,handler])=>el.removeEventListener(type,handler));
    if(clean&&target.contains(text)&&machine.state!=='complete')render(prepared.original);
    removeStandby();
    onStateChange('preview');
   }
  };
 }
 const api={COUNT,PAUSE_MS,MIN_POOL,MAX_POSITION,cleanWords,secretLetters,parseQuantity,matches,draw,display,prepare,sequence,reveal,mount};
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.JoaninhaWords=api;
})(typeof window==='object'?window:null);
