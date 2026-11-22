/* Joaninha V89: personal list manager, local-first, no external services. */
(function(){
 'use strict';
 const KEY='joaninha-list-manager-v1';
 const MAX_LISTS=100,MAX_ITEMS=5000;
 const state={defaults:[],lists:[],load:null,onChange:null,open:false,editing:null,counts:new Map(),busy:false};
 const $=id=>document.getElementById(id);
 const clone=list=>list.map(x=>({file:x.file,label:x.label,terms:x.terms.slice(),items:Array.isArray(x.items)?x.items.slice():null}));
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
 const words=text=>String(text||'').replace(/^\uFEFF/,'').split(/\r?\n/).map(x=>x.trim().replace(/^\d{1,4}[.)]\s+/,'')).filter(Boolean);
 const terms=text=>Array.from(new Map(String(text||'').split(',').map(s=>s.trim()).filter(Boolean).map(s=>[norm(s),s])).values());
 const validId=id=>typeof id==='string'&&/^[a-z0-9]{1,50}$/.test(id);
 function clean(raw,allowUnloaded){
  if(!raw||typeof raw!=='object')throw Error('Lista inválida no arquivo');
  const file=raw.file||raw.id;
  const label=raw.label||raw.nome;
  const sourceTerms=raw.terms??raw.palavrasChave;
  const sourceItems=Object.prototype.hasOwnProperty.call(raw,'items')?raw.items:raw.itens;
  if(!validId(file))throw Error('Identificador de lista inválido');
  if(typeof label!=='string'||!label.trim()||label.trim().length>90)throw Error('Nome de lista inválido');
  const ts=Array.isArray(sourceTerms)?sourceTerms:typeof sourceTerms==='string'?sourceTerms.split(','):null;
  if(!ts||!ts.length||ts.length>60||ts.some(t=>typeof t!=='string'||!t.trim()||t.length>90))
   throw Error('Cada lista precisa de palavras-chave válidas');
  const cleanedTerms=terms(ts.join(','));
  if(!cleanedTerms.length)throw Error('Informe pelo menos uma palavra-chave');
  if(sourceItems===null&&allowUnloaded){
   return {file,label:label.trim(),terms:cleanedTerms,items:null};
  }
  const it=Array.isArray(sourceItems)?sourceItems:typeof sourceItems==='string'?words(sourceItems):null;
  if(!it||!it.length||it.length>MAX_ITEMS||it.some(v=>typeof v!=='string'||!v.trim()||v.length>300))
   throw Error('Cada lista precisa ter de 1 a '+MAX_ITEMS+' itens válidos');
  return {file,label:label.trim(),terms:cleanedTerms,items:it.map(s=>s.trim())};
 }
 function validateAll(value,allowUnloaded){
  if(!Array.isArray(value)||value.length>MAX_LISTS)throw Error('Quantidade de listas inválida');
  const ids=new Set(),kw=new Map();
  const cleaned=value.map(entry=>clean(entry,allowUnloaded));
  for(const entry of cleaned){
   if(ids.has(entry.file))throw Error('Há identificadores de lista duplicados');
   ids.add(entry.file);
   if(entry.items===null&&!state.defaults.some(x=>x.file===entry.file))
    throw Error('A lista "'+entry.label+'" precisa incluir seus itens');
   for(const t of entry.terms){
    const key=norm(t);
    if(kw.has(key)&&kw.get(key)!==entry.file)
     throw Error('A palavra-chave "'+t+'" já pertence à lista "'+cleaned.find(x=>x.file===kw.get(key)).label+'"');
    kw.set(key,entry.file);
   }
  }
  return cleaned;
 }
 function connect(defaults,load,onChange){
  state.defaults=clone(defaults);
  state.load=load;state.onChange=onChange;
  let saved=null;
  try{saved=JSON.parse(localStorage.getItem(KEY)||'null');}catch(error){}
  try{state.lists= saved&&saved.schema===1?validateAll(saved.lists,true):clone(defaults);}
  catch(error){state.lists=clone(defaults);}
  // Add only these newly shipped standard lists to existing saved catalogs.
  // Preserve prior edits, custom lists, force choices and intentionally removed lists.
  const introduced=new Set(['nomesfemininosbebes','nomesmasculinosbebes','animaisaleatorios','celebridadesaleatorias']);
  const existing=new Set(state.lists.map(entry=>entry.file));
  const usedTerms=new Set(state.lists.flatMap(entry=>entry.terms.map(norm)));
  for(const entry of state.defaults){
   if(!introduced.has(entry.file)||existing.has(entry.file)||state.lists.length>=MAX_LISTS)continue;
   const available=entry.terms.filter(term=>!usedTerms.has(norm(term)));
   if(!available.length)continue;
   state.lists.push({file:entry.file,label:entry.label,terms:available,items:null});
   existing.add(entry.file);
   available.forEach(term=>usedTerms.add(norm(term)));
  }
  return state.lists;
 }
 function getItems(file){
  const entry=state.lists.find(x=>x.file===file);
  return entry&&Array.isArray(entry.items)?entry.items.slice():null;
 }
 function hasCustomItems(file){return !!state.lists.find(x=>x.file===file&&Array.isArray(x.items));}
 function write(next){
  const cleanNext=validateAll(next,true);
  try{localStorage.setItem(KEY,JSON.stringify({schema:1,lists:cleanNext}));}
  catch(error){throw Error('Não foi possível salvar no aparelho, verifique o armazenamento disponível');}
  state.lists.splice(0,state.lists.length,...cleanNext);
  state.counts.clear();
  window.JoaninhaWorkConfig?.refreshCatalog();
  if(typeof state.onChange==='function')state.onChange();
 }
 function style(){
  if($('jlmStyle'))return;
  const st=document.createElement('style');st.id='jlmStyle';
  st.textContent=[
   '.jlm-overlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.66);font:15px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#f5f5f7}',
   '.jlm-overlay[hidden],.jlm-view[hidden]{display:none!important}',
   '.jlm-panel{width:100%;max-width:660px;height:min(91dvh,900px);display:flex;flex-direction:column;background:#1b1b1e;border:1px solid #38383e;border-radius:23px 23px 0 0;overflow:hidden;box-shadow:0 -12px 38px rgba(0,0,0,.3)}',
   '.jlm-head{height:59px;min-height:59px;padding:0 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #35353a;gap:12px}',
   '.jlm-head h2{font-size:18px;margin:0;font-weight:650;letter-spacing:-.4px}',
   '.jlm-close{border:0;border-radius:30px;width:36px;height:36px;background:#333339;color:inherit;font-size:24px;line-height:30px;flex:none}',
   '.jlm-view{flex:1;min-height:0;display:flex;flex-direction:column}',
   '.jlm-scroll{overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;flex:1;padding:15px 16px 12px}',
   '.jlm-row{display:flex;gap:10px;align-items:center;padding:14px 12px;border:1px solid #3a3a40;border-radius:13px;margin-bottom:9px;background:#252529}',
   '.jlm-row-info{min-width:0;flex:1}.jlm-row-title{font-weight:630;font-size:15px;margin-bottom:5px;overflow-wrap:anywhere}',
   '.jlm-detail{color:#a5a5ad;font-size:12px;line-height:1.45;overflow-wrap:anywhere}',
   '.jlm-row-actions{display:flex;flex-direction:column;gap:7px}',
   '.jlm-row-actions button{font-size:12px;padding:7px 9px;min-width:63px}',
   '.jlm-btn{appearance:none;border:1px solid #494950;border-radius:11px;padding:11px 13px;font:600 14px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer;color:#f0f0f2;background:#34343a}',
   '.jlm-btn.primary{background:#386afa;border-color:#386afa;color:#fff}.jlm-btn.danger{color:#ff777e}.jlm-btn:disabled{opacity:.5;cursor:default}',
   '.jlm-actions{display:flex;gap:8px;flex-wrap:wrap;padding:12px 15px calc(env(safe-area-inset-bottom,0px) + 13px);border-top:1px solid #333339}',
   '.jlm-actions .jlm-btn{flex:1;min-width:110px}',
   '.jlm-field{display:block;margin:0 0 14px}.jlm-field label{display:block;font-weight:600;margin-bottom:7px;font-size:14px}',
   '.jlm-input{width:100%;box-sizing:border-box;background:#28282d;border:1px solid #505059;border-radius:11px;color:#f5f5f7;padding:12px;font:15px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;outline:none}',
   '.jlm-input:focus{border-color:#5584ff}.jlm-input::placeholder{color:#888891}',
   'textarea.jlm-input{resize:vertical;min-height:68px;line-height:1.45}#jlmItems{min-height:210px}',
   '.jlm-help{margin-top:6px;color:#a4a4ac;font-size:12px;line-height:1.35}',
   '.jlm-inline{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0 16px}',
   '.jlm-inline .jlm-btn{padding:9px 11px;font-size:12px}',
   '.jlm-notice{color:#c6d5ff;font-size:12px;line-height:1.4;min-height:15px;padding:0 16px 6px}',
   '.jlm-notice.error{color:#ff8f96}.jlm-count{margin-left:auto;font-size:12px;color:#a5a5ad}',
   '.jlm-empty{color:#aaaab2;text-align:center;padding:40px 10px}',
   'html[data-theme="light"] .jlm-overlay{color:#1b1b20;background:rgba(10,10,20,.4)}',
   'html[data-theme="light"] .jlm-panel{background:#fafafb;border-color:#d6d6dc}',
   'html[data-theme="light"] .jlm-head,html[data-theme="light"] .jlm-actions{border-color:#e3e3e9}',
   'html[data-theme="light"] .jlm-close,html[data-theme="light"] .jlm-btn{background:#e9e9ee;color:#25262b;border-color:#d5d6dc}',
   'html[data-theme="light"] .jlm-btn.primary{background:#386afa;color:white;border-color:#386afa}',
   'html[data-theme="light"] .jlm-row{background:white;border-color:#e0e1e7}',
   'html[data-theme="light"] .jlm-detail,html[data-theme="light"] .jlm-help,html[data-theme="light"] .jlm-count{color:#757581}',
   'html[data-theme="light"] .jlm-input{color:#151519;background:white;border-color:#d2d3d8}',
   'html[data-theme="light"] .jlm-btn.danger{color:#c62940}',
   '@media(min-width:700px){.jlm-overlay{align-items:center}.jlm-panel{height:min(86dvh,850px);border-radius:22px}}',
   '@media(max-width:375px){.jlm-row-actions button{min-width:58px}.jlm-actions .jlm-btn{min-width:92px;font-size:12px}}'
  ].join('\n');
  document.head.appendChild(st);
 }
 function mount(){
  if($('jlmOverlay'))return;
  style();
  const root=document.createElement('div');
  root.id='jlmOverlay';root.className='jlm-overlay';root.hidden=true;
  root.innerHTML=
   '<section class="jlm-panel" role="dialog" aria-modal="true" aria-label="Gerenciador de Listas">'+
   '<header class="jlm-head"><h2 id="jlmTitle">Gerenciador de Listas</h2><button type="button" id="jlmClose" class="jlm-close" aria-label="Fechar">×</button></header>'+
   '<div id="jlmListView" class="jlm-view"><div id="jlmRows" class="jlm-scroll"></div>'+
   '<div id="jlmListNotice" class="jlm-notice" role="status" aria-live="polite"></div>'+
   '<footer class="jlm-actions"><button type="button" id="jlmNew" class="jlm-btn primary">+ Adicionar lista</button>'+
   '<button type="button" id="jlmImportJson" class="jlm-btn">Importar JSON</button>'+
   '<button type="button" id="jlmExportJson" class="jlm-btn">Exportar JSON</button>'+
   '<button type="button" id="jlmRestore" class="jlm-btn">Restaurar padrões</button></footer></div>'+
   '<div id="jlmEditView" class="jlm-view" hidden><div class="jlm-scroll">'+
   '<div class="jlm-field"><label for="jlmName">Nome da lista</label><input class="jlm-input" id="jlmName" maxlength="90" autocapitalize="none" placeholder="Ex: cidades"></div>'+
   '<div class="jlm-field"><label for="jlmTerms">Palavras-chave</label><textarea class="jlm-input" id="jlmTerms" rows="2" autocapitalize="none" placeholder="cidade, cidades, lugar"></textarea>'+
   '<div class="jlm-help">Separe os gatilhos por vírgulas</div></div>'+
   '<div class="jlm-field"><label for="jlmItems">Conteúdo da lista</label><textarea class="jlm-input" id="jlmItems" rows="9" placeholder="Uma palavra por linha"></textarea>'+
   '<div class="jlm-help">Digite ou cole uma lista inteira, um item por linha, na ordem desejada</div></div>'+
   '<div class="jlm-inline"><button type="button" class="jlm-btn" id="jlmImportTxt">Importar TXT</button>'+
   '<button type="button" class="jlm-btn" id="jlmCopyTxt">Copiar TXT</button>'+
   '<button type="button" class="jlm-btn" id="jlmDownloadTxt">Baixar TXT</button>'+
   '<button type="button" class="jlm-btn" id="jlmCopyJson">Copiar JSON</button>'+
   '<span class="jlm-count" id="jlmItemCount">0 itens</span></div></div>'+
   '<div id="jlmEditNotice" class="jlm-notice" role="status" aria-live="polite"></div>'+
   '<footer class="jlm-actions"><button type="button" id="jlmCancel" class="jlm-btn">Cancelar</button><button type="button" id="jlmSave" class="jlm-btn primary">Salvar lista</button></footer></div>'+
   '</section><input id="jlmTxtFile" type="file" accept=".txt,text/plain" hidden>'+
   '<input id="jlmJsonFile" type="file" accept=".json,application/json" hidden>';
  document.body.appendChild(root);
  $('jlmClose').addEventListener('click',close);
  root.addEventListener('click',e=>{if(e.target===root)close();});
  document.addEventListener('keydown',e=>{if(state.open&&e.key==='Escape'){e.preventDefault();close();}});
  $('jlmNew').addEventListener('click',()=>edit(null));
  $('jlmCancel').addEventListener('click',()=>showList());
  $('jlmSave').addEventListener('click',save);
  $('jlmRestore').addEventListener('click',restore);
  $('jlmImportTxt').addEventListener('click',()=>$('jlmTxtFile').click());
  $('jlmImportJson').addEventListener('click',()=>$('jlmJsonFile').click());
  $('jlmExportJson').addEventListener('click',exportAll);
  $('jlmCopyTxt').addEventListener('click',()=>copy($('jlmItems').value,'jlmEditNotice'));
  $('jlmDownloadTxt').addEventListener('click',()=>download($('jlmName').value||'lista','.txt',$('jlmItems').value));
  $('jlmCopyJson').addEventListener('click',()=>copy(JSON.stringify({
   nome:$('jlmName').value.trim(),palavrasChave:terms($('jlmTerms').value),itens:words($('jlmItems').value)
  },null,2),'jlmEditNotice'));
  $('jlmItems').addEventListener('input',refreshCount);
  $('jlmTxtFile').addEventListener('change',async e=>{
   const f=e.target.files?.[0];e.target.value='';if(!f)return;
   if(f.size>1500000){notice('TXT muito grande','jlmEditNotice',true);return;}
   try{$('jlmItems').value=(await f.text()).replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');refreshCount();notice('TXT carregado, revise e toque em Salvar lista','jlmEditNotice');}
   catch(error){notice('Não foi possível ler o arquivo TXT','jlmEditNotice',true);}
  });
  $('jlmJsonFile').addEventListener('change',async e=>{
   const f=e.target.files?.[0];e.target.value='';if(!f)return;
   if(f.size>3000000){notice('JSON muito grande','jlmListNotice',true);return;}
   try{await importAll(JSON.parse((await f.text()).replace(/^\uFEFF/,'')));}
   catch(error){notice(error.message||'JSON inválido','jlmListNotice',true);}
  });
 }
 function notice(s,id='jlmListNotice',error=false){
  const el=$(id);if(!el)return;el.textContent=s;el.classList.toggle('error',error);
 }
 function open(){
  mount();state.open=true;state.editing=null;
  $('jlmOverlay').hidden=false;document.body.classList.add('jlm-open');
  showList();
 }
 function close(){
  if(!state.open)return;
  // In the list editor, X behaves exactly like Cancelar, returning to the manager.
  if(!$('jlmEditView').hidden){showList();return;}
  state.open=false;state.editing=null;$('jlmOverlay').hidden=true;
  document.body.classList.remove('jlm-open');
 }
 function showList(){
  $('jlmTitle').textContent='Gerenciador de Listas';
  $('jlmListView').hidden=false;$('jlmEditView').hidden=true;
  state.editing=null;notice('');
  renderRows();
 }
 function renderRows(){
  const area=$('jlmRows');area.replaceChildren();
  const workButton=document.createElement('button');
  workButton.type='button';workButton.className='jlm-btn';
  workButton.style.cssText='display:block;width:100%;text-align:left;margin-bottom:14px;font-size:15px';
  workButton.textContent='Configurar Work  ›';
  workButton.addEventListener('click',()=>window.JoaninhaWorkConfig?.open());
  area.appendChild(workButton);
  if(!state.lists.length){const div=document.createElement('div');div.className='jlm-empty';div.textContent='Nenhuma lista cadastrada';area.append(div);return;}
  // Sort the visible list names only, never the items inside a magic list.
  const alphabetical=[...state.lists].sort((a,b)=>
   a.label.localeCompare(b.label,'pt-BR',{sensitivity:'base',numeric:true}));
  alphabetical.forEach(item=>{
   const row=document.createElement('div');row.className='jlm-row';
   const info=document.createElement('div');info.className='jlm-row-info';
   const h=document.createElement('div');h.className='jlm-row-title';h.textContent=item.label;
   const count=document.createElement('div');count.className='jlm-detail';
   count.textContent=(state.counts.get(item.file)??(item.items?.length??'…'))+' palavras';
   const ts=document.createElement('div');ts.className='jlm-detail';
   ts.textContent='Gatilhos: '+item.terms.join(', ');
   info.append(h,count,ts);
   const buttons=document.createElement('div');buttons.className='jlm-row-actions';
   const editBtn=document.createElement('button');editBtn.className='jlm-btn';editBtn.textContent='Editar';
   editBtn.setAttribute('aria-label','Editar '+item.label);editBtn.addEventListener('click',()=>edit(item.file));
   const delBtn=document.createElement('button');delBtn.className='jlm-btn danger';delBtn.textContent='Excluir';
   delBtn.setAttribute('aria-label','Excluir '+item.label);delBtn.addEventListener('click',()=>remove(item.file));
   buttons.append(editBtn,delBtn);row.append(info,buttons);area.appendChild(row);
   if(!Array.isArray(item.items)&&!state.counts.has(item.file)){
    state.load(item.file).then(items=>{
     if(!state.open||!state.lists.some(x=>x.file===item.file))return;
     state.counts.set(item.file,items.length);
     count.textContent=items.length+' palavras';
    }).catch(()=>{count.textContent='Conteúdo indisponível';});
   }
  });
 }
 async function edit(file){
  const found=file?state.lists.find(x=>x.file===file):null;
  if(file&&!found)return;
  state.editing={file:file||null,original:null};
  $('jlmListView').hidden=true;$('jlmEditView').hidden=false;
  $('jlmTitle').textContent=file?'Editar lista':'Adicionar lista';
  $('jlmName').value=found?.label||'';
  $('jlmTerms').value=found?.terms.join(', ')||'';
  $('jlmItems').value='';
  notice('', 'jlmEditNotice');
  $('jlmSave').disabled=!!file;
  if(found){
   notice('Carregando conteúdo da lista…','jlmEditNotice');
   try{
    const items=await state.load(file);
    if(!state.open||state.editing?.file!==file)return;
    $('jlmItems').value=items.join('\n');notice('','jlmEditNotice');
   }catch(error){notice('Não foi possível carregar a lista original','jlmEditNotice',true);return;}
  }
  $('jlmSave').disabled=false;refreshCount();
  state.editing.original=JSON.stringify(editorData());
  if(!file)$('jlmName').focus();
 }
 function editorData(){return {name:$('jlmName').value,terms:$('jlmTerms').value,items:$('jlmItems').value};}
 function dirtyEditor(){return !!state.editing&&state.editing.original!==null&&JSON.stringify(editorData())!==state.editing.original;}
 function refreshCount(){$('jlmItemCount').textContent=words($('jlmItems').value).length+' itens';}
 function nextId(){
  let n=1;while(state.lists.some(x=>x.file==='personalizada'+n)||state.defaults.some(x=>x.file==='personalizada'+n))n++;
  return 'personalizada'+n;
 }
 function save(){
  if(!state.editing||state.busy)return;
  try{
   const file=state.editing.file||nextId();
   const entry=clean({file,label:$('jlmName').value,terms:terms($('jlmTerms').value),items:words($('jlmItems').value)},false);
   const next=clone(state.lists);
   const index=next.findIndex(x=>x.file===file);
   if(index<0)next.push(entry);else next[index]=entry;
   write(next);showList();notice('Lista salva com sucesso');
  }catch(error){notice(error.message||'Erro ao salvar lista','jlmEditNotice',true);}
 }
 function remove(file){
  const found=state.lists.find(x=>x.file===file);if(!found)return;
  if(!confirm('Excluir a lista "'+found.label+'"? Ela deixará de responder aos seus gatilhos'))return;
  try{write(state.lists.filter(x=>x.file!==file));renderRows();notice('Lista excluída');}
  catch(error){notice(error.message,'jlmListNotice',true);}
 }
 function restore(){
  if(!confirm('Restaurar todas as 13 listas originais? Isso substitui listas e palavras-chave personalizadas deste aparelho'))return;
  try{write(clone(state.defaults));window.JoaninhaWorkConfig?.resetColumns();renderRows();notice('Listas originais restauradas');}
  catch(error){notice(error.message,'jlmListNotice',true);}
 }
 async function exportAll(){
  if(state.busy)return;state.busy=true;$('jlmExportJson').disabled=true;
  notice('Preparando backup completo…');
  try{
   const content=await Promise.all(state.lists.map(async x=>({
    file:x.file,label:x.label,terms:x.terms.slice(),
    items:Array.isArray(x.items)?x.items.slice():await state.load(x.file)
   })));
   download('joaninha-listas','.json',JSON.stringify({schema:1,lists:content,workColumns:window.JoaninhaWorkConfig?.getColumns()},null,2),'application/json');
   notice('JSON completo exportado');
  }catch(error){notice('Não foi possível preparar o JSON, verifique as listas originais','jlmListNotice',true);}
  finally{state.busy=false;$('jlmExportJson').disabled=false;}
 }
 async function importAll(data){
  let next,singleImport=false;
  if(data&&data.schema===1&&Array.isArray(data.lists))next=data.lists;
  else if(Array.isArray(data))next=data;
  else if(data&&data.nome&&data.itens){
   singleImport=true;next=clone(state.lists);const entry=clean({
    file:nextId(),label:data.nome,terms:data.palavrasChave,items:data.itens
   },false);next.push(entry);
  }else throw Error('Formato JSON não reconhecido');
  const cleaned=validateAll(next,singleImport);
  if(!confirm('Importar '+cleaned.length+' lista(s)? O arquivo completo substituirá as listas atuais, o JSON de uma lista acrescentará uma nova'))return;
  write(cleaned);
  if(!singleImport&&Array.isArray(data?.workColumns))
   window.JoaninhaWorkConfig?.importColumns(data.workColumns);
  showList();notice('JSON importado com sucesso');
 }
 function download(name,ext,content,mime='text/plain'){
  const slug=norm(name).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'lista';
  const blob=new Blob([content],{type:mime+';charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=slug+ext;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),10000);
 }
 async function copy(str,id){
  try{
   if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(str);
   else{
    const temp=document.createElement('textarea');temp.value=str;
    temp.style.position='fixed';temp.style.opacity='0';document.body.append(temp);temp.select();
    const ok=document.execCommand('copy');temp.remove();if(!ok)throw Error('Falha');
   }
   notice('Copiado para a área de transferência',id);
  }catch(error){notice('Não foi possível copiar neste navegador',id,true);}
 }
 window.JoaninhaLists={connect,getItems,hasCustomItems,getCatalog:()=>clone(state.lists),loadList:file=>state.load(file),open,close};
})();
