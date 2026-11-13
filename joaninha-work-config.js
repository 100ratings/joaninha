/* Joaninha V90: user-selectable Work columns, independent from list content. */
(function(){
 'use strict';
 const KEY='joaninha-work-columns-v1';
 const DEFAULT=['musicas','celebridades','animais'];
 let columns=DEFAULT.slice(), draft=null, opened=false, previewSequence=0, busy=false, editSession=0;
 const pendingForces=new Map();
 const $=id=>document.getElementById(id);
 const catalog=()=>window.JoaninhaLists?.getCatalog()||[];
 const eligible=item=>!!item&&(!Array.isArray(item.items)||item.items.length>=10);
 const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const sorted=()=>catalog().slice().sort((a,b)=>a.label.localeCompare(b.label,'pt-BR',{sensitivity:'base',numeric:true}));
 function reconcile(desired){
  const valid=catalog().filter(eligible).map(x=>x.file);
  const picks=[];
  for(const file of [...(Array.isArray(desired)?desired:[]),...DEFAULT,...valid]){
   if(valid.includes(file)&&!picks.includes(file))picks.push(file);
   if(picks.length===3)break;
  }
  while(picks.length<3)picks.push(null);
  return picks;
 }
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(Array.isArray(saved))columns=saved;}
 catch(error){}
 function getColumns(){return reconcile(columns);}
 function announce(){document.dispatchEvent(new Event('joaninha-work-columns-updated'));}
 function persist(next){
  const normalized=reconcile(next);
  if(equal(normalized,columns))return;
  try{localStorage.setItem(KEY,JSON.stringify(normalized));}
  catch(error){throw Error('Não foi possível salvar as colunas no aparelho');}
  columns=normalized;announce();
 }
 function importColumns(raw){
  if(!Array.isArray(raw)||raw.length!==3)return;
  try{persist(raw);}catch(error){}
 }
 function resetColumns(){try{persist(DEFAULT);}catch(error){}}
 function refreshCatalog(){
  try{persist(columns);}catch(error){}
  if(opened){draft=getColumns();renderSelectors();refreshPreview();}
 }
 function addStyles(){
  if($('jwcStyle'))return;
  const st=document.createElement('style');st.id='jwcStyle';
  st.textContent=[
   '.jwc-overlay{position:fixed;inset:0;z-index:100001;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.65);font:15px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#f6f6f8}',
   '.jwc-overlay[hidden]{display:none!important}',
   '.jwc-panel{display:flex;flex-direction:column;width:100%;max-width:660px;height:min(91dvh,900px);border-radius:23px 23px 0 0;background:#1b1b1e;border:1px solid #3a3a42;overflow:hidden;box-shadow:0 -15px 40px rgba(0,0,0,.4)}',
   '.jwc-header{min-height:59px;height:59px;padding:0 17px;display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid #34343a}',
   '.jwc-header h2{font-size:18px;margin:0;font-weight:650}',
   '.jwc-close{width:36px;height:36px;flex:none;border:0;background:#34343a;color:inherit;border-radius:50%;font-size:24px}',
   '.jwc-scroll{overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;flex:1;padding:16px 18px 10px;min-height:0}',
   '.jwc-intro{font-size:13px;line-height:1.4;color:#aaaab2;margin:0 0 19px}',
   '.jwc-selector{display:block;margin:0 0 17px}.jwc-selector label{display:block;margin:0 0 7px;font-size:13px;font-weight:650}',
   '.jwc-selector select{width:100%;box-sizing:border-box;padding:12px;border:1px solid #47474f;border-radius:13px;color:#f3f3f6;background:#242428;font:15px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-appearance:menulist;appearance:auto}',
   '.jwc-preview-title{margin:22px 0 11px;font-size:14px;font-weight:660}',
   '.jwc-preview{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}',
   '.jwc-preview-col{min-width:0;background:#303035;border-radius:9px;padding:7px 5px}',
   '.jwc-preview-head{font-size:10px;font-weight:670;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0 0 7px}',
   '.jwc-preview-word{appearance:none;display:block;width:100%;box-sizing:border-box;text-align:center;border:1px solid transparent;color:inherit;background:#202023;border-radius:5px;margin:0 0 5px;padding:5px 4px;font-size:10px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;touch-action:manipulation}',
   '.jwc-preview-word.selected{background:#3d69e5;border-color:#4e7cff;color:#fff;font-weight:650}',
   '.jwc-preview-word:disabled{opacity:.65;cursor:default}',
   '.jwc-preview-word:focus-visible{outline:2px solid #83aaff;outline-offset:1px}',
   '.jwc-note{padding:6px 18px;min-height:16px;font-size:12px;color:#b9cbff}.jwc-note.error{color:#ff8d95}',
   '.jwc-footer{display:flex;gap:9px;padding:12px 17px calc(env(safe-area-inset-bottom,0px) + 12px);border-top:1px solid #34343a}',
   '.jwc-button{flex:1;border:1px solid #4a4a52;border-radius:11px;padding:12px 10px;font:600 14px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#35353b;color:#f2f2f5}',
   '.jwc-button.primary{background:#386afa;border-color:#386afa;color:#fff}.jwc-button:disabled{opacity:.5}',
   'html[data-theme="light"] .jwc-overlay{color:#1b1b21;background:rgba(0,0,0,.4)}',
   'html[data-theme="light"] .jwc-panel{background:#fafafb;border-color:#d6d7dd}',
   'html[data-theme="light"] .jwc-header,html[data-theme="light"] .jwc-footer{border-color:#e1e1e8}',
   'html[data-theme="light"] .jwc-close,html[data-theme="light"] .jwc-button{background:#ebebef;color:#22232a;border-color:#d6d6dd}',
   'html[data-theme="light"] .jwc-button.primary{background:#386afa;color:#fff;border-color:#386afa}',
   'html[data-theme="light"] .jwc-selector select{background:white;border-color:#d7d7dd;color:#202027}',
   'html[data-theme="light"] .jwc-intro{color:#696b74}',
   'html[data-theme="light"] .jwc-preview-col{background:#ececf0}',
   'html[data-theme="light"] .jwc-preview-word{background:#fff}',
   'html[data-theme="light"] .jwc-preview-word.selected{background:#3d69e5;border-color:#4e7cff;color:#fff}',
   '@media(min-width:700px){.jwc-overlay{align-items:center}.jwc-panel{height:min(86dvh,850px);border-radius:22px}}'
  ].join('\n');
  document.head.appendChild(st);
 }
 function mount(){
  if($('jwcOverlay'))return;
  addStyles();
  const root=document.createElement('div');root.id='jwcOverlay';
  root.className='jwc-overlay';root.hidden=true;
  root.innerHTML='<section class="jwc-panel" role="dialog" aria-modal="true" aria-label="Configurar Work">'+
   '<header class="jwc-header"><h2>Configurar Work</h2><button type="button" class="jwc-close" id="jwcClose" aria-label="Voltar para o Gerenciador de Listas">×</button></header>'+
   '<div class="jwc-scroll"><p class="jwc-intro">Escolha as três listas e toque em uma opção da prévia para definir sua força, destacada em azul</p>'+
   '<div id="jwcSelectors"></div><div class="jwc-preview-title">Prévia do Work</div><div id="jwcPreview" class="jwc-preview"></div></div>'+
   '<div id="jwcNotice" class="jwc-note" role="status" aria-live="polite"></div>'+
   '<footer class="jwc-footer"><button type="button" id="jwcCancel" class="jwc-button">Cancelar</button>'+
   '<button type="button" id="jwcSave" class="jwc-button primary">Salvar configuração</button></footer></section>';
  document.body.appendChild(root);
  $('jwcClose').addEventListener('click',close);
  $('jwcCancel').addEventListener('click',close);
  $('jwcSave').addEventListener('click',save);
  root.addEventListener('click',e=>{if(e.target===root)close();});
  root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();e.preventDefault();close();}});
 }
 function note(message,error=false){
  const node=$('jwcNotice');node.textContent=message;
  node.classList.toggle('error',error);
 }
 function open(){
  mount();opened=true;editSession++;draft=getColumns();pendingForces.clear();
  $('jwcOverlay').hidden=false;
  note('');renderSelectors();refreshPreview();
 }
 function close(){
  if(!opened)return;
  opened=false;editSession++;previewSequence++;draft=null;pendingForces.clear();$('jwcOverlay').hidden=true;
 }
 function renderSelectors(){
  const area=$('jwcSelectors');area.replaceChildren();
  const items=sorted();
  for(let i=0;i<3;i++){
   const row=document.createElement('div');row.className='jwc-selector';
   const label=document.createElement('label');label.htmlFor='jwcSlot'+i;label.textContent='Coluna '+(i+1);
   const select=document.createElement('select');select.id='jwcSlot'+i;
   select.setAttribute('aria-label','Lista da coluna '+(i+1));
   const empty=document.createElement('option');empty.value='';empty.textContent='Selecione uma lista';
   select.appendChild(empty);
   for(const item of items){
    const option=document.createElement('option');option.value=item.file;
    option.textContent=item.label+(eligible(item)?'':' (mínimo 10 itens)');
    option.disabled=!eligible(item);
    select.appendChild(option);
   }
   select.value=draft[i]||'';
   select.addEventListener('change',()=>{
    draft[i]=select.value||null;
    updateDisabled();refreshPreview();
   });
   row.append(label,select);area.appendChild(row);
  }
  updateDisabled();
 }
 function updateDisabled(){
  for(let i=0;i<3;i++){
   const select=$('jwcSlot'+i);
   if(!select)continue;
   for(const option of select.options){
    if(!option.value)continue;
    const item=catalog().find(x=>x.file===option.value);
    option.disabled=!eligible(item)||draft.some((value,j)=>i!==j&&value===option.value);
   }
  }
 }
 function markSelectedPreview(col,category,items){
  const stored=pendingForces.has(category)?pendingForces.get(category):
   window.JoaninhaWorkForces?.get(category);
  const selected=items.includes(stored)?stored:items[0];
  [...col.querySelectorAll('.jwc-preview-word')].forEach((row,index)=>{
   const active=!!items[index]&&items[index]===selected;
   row.classList.toggle('selected',active);
   row.setAttribute('aria-pressed',String(active));
  });
 }
 async function refreshPreview(){
  const seq=++previewSequence,ids=draft.slice();
  const node=$('jwcPreview');node.replaceChildren();
  const cols=[];
  for(let i=0;i<3;i++){
   const col=document.createElement('div');col.className='jwc-preview-col';
   const head=document.createElement('div');head.className='jwc-preview-head';
   head.textContent=catalog().find(x=>x.file===ids[i])?.label||'Coluna '+(i+1);
   col.appendChild(head);
   for(let j=0;j<10;j++){
    const button=document.createElement('button');
    button.type='button';button.className='jwc-preview-word';button.disabled=true;
    button.textContent=(j+1)+'. …';
    button.setAttribute('aria-pressed','false');
    col.appendChild(button);
   }
   node.appendChild(col);cols.push(col);
  }
  const values=await Promise.all(ids.map(async id=>{
   if(!id)return [];
   try{return (await JoaninhaLists.loadList(id)).slice(0,10);}
   catch(error){return [];}
  }));
  if(!opened||seq!==previewSequence)return;
  values.forEach((items,i)=>{
   const category=ids[i];
   const buttons=[...cols[i].querySelectorAll('.jwc-preview-word')];
   buttons.forEach((button,j)=>{
    const name=items[j];
    if(name===undefined){
     button.textContent='';button.disabled=true;return;
    }
    button.textContent=(j+1)+'. '+name;
    button.title=name;
    button.disabled=false;
    button.setAttribute('aria-label','Selecionar '+name+' como força da lista '+cols[i].firstElementChild.textContent);
    button.addEventListener('click',()=>{
     pendingForces.set(category,name);
     markSelectedPreview(cols[i],category,items);
     note('Força escolhida, toque em Salvar configuração para aplicar');
    });
   });
   markSelectedPreview(cols[i],category,items);
  });
 }
 async function save(){
  if(busy||!opened)return;
  const chosen=draft.slice(),session=editSession;
  if(chosen.length!==3||chosen.some(x=>!x)||new Set(chosen).size!==3){
   note('Escolha três listas diferentes','error');return;
  }
  busy=true;$('jwcSave').disabled=true;
  note('Validando as listas…');
  try{
   const loaded=await Promise.all(chosen.map(file=>JoaninhaLists.loadList(file)));
   if(loaded.some(items=>items.length<10))throw Error('Cada coluna precisa de pelo menos 10 itens');
   if(chosen.some(file=>!catalog().some(x=>x.file===file)))
    throw Error('Uma das listas selecionadas não está mais disponível');
   // Validate every force selected during this editing session, including
   // lists that were temporarily displayed but later swapped out of a column.
   const validForces=[];
   for(const [category,name] of pendingForces){
    if(!catalog().some(item=>item.file===category))continue;
    const items=await JoaninhaLists.loadList(category);
    if(items.slice(0,10).includes(name))validForces.push([category,name]);
   }
   // A cancel or X during an asynchronous load must never save old changes
   if(!opened||session!==editSession)return;
   persist(chosen);
   for(const [category,name] of validForces)
    window.JoaninhaWorkForces?.set(category,name);
   close();
   // Only saving exits both overlays, returning straight to the main app.
   window.JoaninhaLists?.close();
  }catch(error){note(error.message||'Não foi possível salvar a configuração',true);}
  finally{busy=false;$('jwcSave').disabled=false;}
 }
 window.JoaninhaWorkConfig={getColumns,open,refreshCatalog,resetColumns,importColumns};
})();
