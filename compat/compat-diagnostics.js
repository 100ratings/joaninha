/* Joaninha LAB: on-device diagnostics; opt-in with ?diagnostico=1 */
(function(){
 'use strict';
 const active=new URLSearchParams(location.search).has('diagnostico')||
  new URLSearchParams(location.search).has('qa');
 const tag=document.createElement('div');
 tag.textContent='JOANINHA LAB';
 tag.setAttribute('aria-hidden','true');
 tag.style.cssText='position:fixed;right:8px;bottom:calc(env(safe-area-inset-bottom,0px) + 2px);z-index:90000;color:#aaa;font:600 9px system-ui;letter-spacing:.4px;opacity:.75;pointer-events:none';
 document.body.appendChild(tag);
 if(!active)return;
 const btn=document.createElement('button');btn.type='button';btn.textContent='QA';
 btn.setAttribute('aria-label','Abrir diagnóstico de compatibilidade');
 btn.style.cssText='position:fixed;z-index:90005;left:12px;top:calc(env(safe-area-inset-top,0px) + 5px);font:700 12px system-ui;background:#1e60d5;color:white;border:0;border-radius:9px;padding:8px 10px';
 const panel=document.createElement('section');panel.hidden=true;panel.setAttribute('role','dialog');
 panel.setAttribute('aria-label','Diagnóstico de compatibilidade da Joaninha LAB');
 panel.style.cssText='position:fixed;inset:0;z-index:90010;background:rgba(0,0,0,.90);padding:calc(env(safe-area-inset-top,0px) + 18px) 14px calc(env(safe-area-inset-bottom,0px) + 14px);color:#f4f4f6;font:14px system-ui;overflow:auto;overscroll-behavior:contain';
 panel.innerHTML='<div style="display:flex;align-items:center;gap:8px;justify-content:space-between"><strong style="font-size:17px">Joaninha LAB · Diagnóstico</strong><button type="button" id="compatClose" style="border:0;background:#404046;color:white;border-radius:30px;width:38px;height:38px;font-size:21px">×</button></div>'+
  '<p style="color:#bbb;font-size:12px">Os dados permanecem no aparelho até você copiar ou exportar, nenhuma informação é enviada automaticamente</p>'+
  '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0"><button id="compatRefresh" type="button">Atualizar</button><button id="compatCopy" type="button">Copiar relatório</button><button id="compatExport" type="button">Exportar JSON</button></div>'+
  '<pre id="compatReport" style="white-space:pre-wrap;overflow-wrap:anywhere;background:#222226;padding:12px;border-radius:12px;font-size:11px;line-height:1.55"></pre>'+
  '<p id="compatNotice" style="font-size:12px;color:#a9ceff"></p>';
 for(const b of panel.querySelectorAll('button:not(#compatClose)')){
  b.style.cssText='border:1px solid #555;background:#34343d;color:white;border-radius:9px;padding:9px 11px;font:600 12px system-ui';
 }
 const $=id=>panel.querySelector('#'+id);
 let report=null;
 function box(id){
  const node=document.getElementById(id);
  if(!node)return null;
  const r=node.getBoundingClientRect(),style=getComputedStyle(node);
  return {visible:style.display!=='none'&&style.visibility!=='hidden',
   x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),
   height:Math.round(r.height),right:Math.round(r.right),
   bottom:Math.round(r.bottom)};
 }
 function read(){
  const vv=window.visualViewport;
  const app=document.getElementById('app'),roots=['app','header','home-tabs',
   'tabChat','tabWork','composer','nativeInput','workForcePicker','peekPanel'];
  const objects=Object.fromEntries(roots.map(id=>[id,box(id)]));
  const width=window.innerWidth,height=window.innerHeight;
  const problems=[];
  for(const id of ['app','header','home-tabs','composer']){
   const v=objects[id];if(!v||!v.visible)continue;
   if(v.x < -2||v.right>width+2)problems.push(id+': transborda horizontalmente');
   if(v.y < -2||v.bottom>Math.max(height,objects.app?.height||0)+2)
    problems.push(id+': fora da altura visível');
  }
  const isIos=/iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid=/Android/i.test(navigator.userAgent);
  return {
   ambiente:'Joaninha LAB, cópia isolada da V90',versao:901,
   coletadoEm:new Date().toISOString(),sistema:isIos?'iOS':isAndroid?'Android':'outro',
   navegador:navigator.userAgent,
   viewport:{largura:width,altura:height,devicePixelRatio:devicePixelRatio,
    visualWidth:Math.round(vv?.width||width),visualHeight:Math.round(vv?.height||height),
    visualOffsetTop:Math.round(vv?.offsetTop||0),orientacao:screen.orientation?.type||null,
    standalone:matchMedia('(display-mode: standalone)').matches||navigator.standalone===true},
   teclado:{foco:document.activeElement?.id||null,aberto:app?.classList.contains('keyboard-on')||false,
    alturaCSS:getComputedStyle(document.documentElement).getPropertyValue('--kbd-h').trim()},
   elementos:objects,alertasDeGeometria:problems
  };
 }
 function refresh(){report=read();$('compatReport').textContent=JSON.stringify(report,null,2);}
 function close(){panel.hidden=true;}
 btn.addEventListener('click',()=>{panel.hidden=false;refresh();});
 $('compatClose').addEventListener('click',close);
 $('compatRefresh').addEventListener('click',refresh);
 $('compatCopy').addEventListener('click',async()=>{
  refresh();
  try{await navigator.clipboard.writeText(JSON.stringify(report,null,2));
   $('compatNotice').textContent='Relatório copiado';
  }catch(error){$('compatNotice').textContent='Cópia bloqueada, use Exportar JSON';}
 });
 $('compatExport').addEventListener('click',()=>{
  refresh();
  const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='joaninha-lab-diagnostico.json';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),10000);
 });
 document.body.append(btn,panel);
})();
