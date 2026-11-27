// Pruebas de la etapa 6 (cierre): recorre todo el juego en cuatro anchos (iPhone SE de 320 px, celular de 375 px, Pixel 7 y laptop)
// y revisa que cada pantalla quepa a lo ancho (sin desplazamiento horizontal ni nada que se salga) y que no haya errores.
// Recorrido: historia de entrada → nombre → menú → instrucciones → Gran Mapa → lección de Apolonio → nivel → Taller
// (explorar y práctica) → panel del profesor (inicio, prueba, solo estudio) → modo estudio → prueba como saga
// (aviso, prólogo, nivel, prueba terminada).
// Uso: node pruebas/cierre.test.js [ruta/al/juego.html]
const {chromium,devices}=require('playwright'); const fs=require('fs'); const path=require('path');
const SRC=process.argv[2]||path.join(__dirname,'..','index.html');
const TMP=path.join(require('os').tmpdir(),'euclidia-cierre.html');
fs.writeFileSync(TMP,'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(SRC,'utf8')+'</body></html>');
const out=[]; let pass=0, fail=0; const res=(ok,txt)=>{ ok?pass++:fail++; out.push((ok?'PASA ':'FALLA')+' | '+txt); };
const DEVS=[['iPhone SE (320 px)',devices['iPhone SE']],['celular de 375 px',{viewport:{width:375,height:667},isMobile:true,hasTouch:true}],['Pixel 7',devices['Pixel 7']],['laptop',{viewport:{width:1280,height:800}}]];
// Lo que se sale a lo ancho: elementos visibles fuera de la pantalla que no estén dentro de una caja con desplazamiento propio
const ANCHO=()=>{ const W=innerWidth, bad=[];
  document.querySelectorAll('body *').forEach(el=>{ const r=el.getBoundingClientRect(); if(!r.width||!r.height) return;
    const cs=getComputedStyle(el); if(cs.visibility==='hidden') return; if(el.closest('[hidden]')) return;
    let a=el.parentElement; while(a&&a!==document.body){ if(getComputedStyle(a).overflowX!=='visible') return; a=a.parentElement; }
    if(r.right>W+1||r.left<-1) bad.push((el.id?'#'+el.id:el.tagName.toLowerCase()+(el.className&&typeof el.className==='string'?'.'+el.className.split(' ')[0]:''))+` (${Math.round(r.left)}…${Math.round(r.right)})`); });
  return {sw:document.documentElement.scrollWidth,W,bad}; };
(async()=>{
 const b=await chromium.launch(); const errs=[];
 const page=async(dev,{init,query='',real=false}={})=>{ const ctx=await b.newContext({...dev,deviceScaleFactor:1}); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
   await p.route(/^https?:\/\//,r=>r.abort());
   if(!real) await p.addInitScript(()=>{ localStorage.setItem('euclidia2-intro','true'); localStorage.setItem('euclidia2-pruebas','true'); });
   if(init) await p.addInitScript(init);
   await p.goto('file://'+TMP+query); await p.waitForTimeout(700); return p; };
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 for(const [nom,dev] of DEVS){
   const vistas=[]; const mira=async(p,qué,dev0)=>{ await p.waitForTimeout(250); const r=await p.evaluate(ANCHO); vistas.push({qué,ok:r.sw<=r.W&&r.W===dev0&&!r.bad.length,det:(r.W!==dev0?`ancho ${r.W} en vez de ${dev0}; `:'')+(r.sw>r.W?`desplaza ${r.sw-r.W} px; `:'')+r.bad.slice(0,3).join(', ')}); };
   const W0=dev.viewport.width;
   // 1. Entrada real de un estudiante nuevo: historia, nombre y menú
   const p=await page(dev,{real:true,init:()=>{ if(!sessionStorage.getItem('cierre')){ localStorage.clear(); sessionStorage.setItem('cierre','1'); } }});
   const vio=await p.evaluate(()=>!document.getElementById('intro').hidden); await mira(p,'historia de entrada',W0);
   await p.evaluate(async()=>{ const g=id=>document.getElementById(id); for(let i=0;i<8&&!g('intro').hidden;i++){ const bt=[...g('intro').querySelectorAll('button')].filter(x=>x.offsetParent).pop(); if(!bt) break; bt.click(); await new Promise(r=>setTimeout(r,120)); } });
   await mira(p,'elegir rol / nombre',W0);
   const ent=await p.evaluate(async()=>{ const g=id=>document.getElementById(id), w=ms=>new Promise(r=>setTimeout(r,ms));
     if(!g('role').hidden){ const s=[...g('role').querySelectorAll('button')].find(x=>/estudiante/i.test(x.textContent)); if(s) s.click(); await w(200); }
     if(!g('reg').hidden){ g('rName').value='Lía'; if(g('rLast')) g('rLast').value='Mora'; g('regForm').requestSubmit(); await w(300); }
     return {menu:!g('menu').hidden}; });
   res(vio&&ent.menu,`${nom}: un estudiante nuevo ve la historia, escribe su nombre y llega al menú`);
   await mira(p,'menú',W0);
   // 2. Instrucciones, Gran Mapa, lección de Apolonio y un nivel
   await p.evaluate(()=>{ [...document.querySelectorAll('#menu button')].find(x=>/Instrucciones/.test(x.textContent)).click(); }); await mira(p,'instrucciones',W0);
   await p.evaluate(()=>{ document.getElementById('howto').hidden=true; window.__euclidia.adv.menu(); [...document.querySelectorAll('#menu button')].find(x=>/aventura/i.test(x.textContent)).click(); });
   const mapa=await p.evaluate(()=>!document.getElementById('mapa').hidden); await mira(p,'Gran Mapa',W0);
   const lec=await p.evaluate(async()=>{ const U=window.__euclidia, g=id=>document.getElementById(id); g('mapa').hidden=true; const i=U.LEVELS.findIndex(l=>l.id==='C1'); U.openLevel(i); await new Promise(r=>setTimeout(r,250)); return !g('leccion').hidden; });
   await mira(p,'lección de Apolonio',W0);
   await p.evaluate(async()=>{ const g=id=>document.getElementById(id); for(let i=0;i<6;i++){ const m=['leccion','lore'].map(g).find(x=>!x.hidden); if(!m) break; const bt=[...m.querySelectorAll('button')].filter(x=>x.offsetParent).pop(); bt.click(); await new Promise(r=>setTimeout(r,150)); } });
   res(mapa&&lec,`${nom}: el menú abre el Gran Mapa y el primer valle empieza con la lección de Apolonio`);
   await mira(p,'nivel (lienzo, teclado y pistas)',W0);
   // 3. Taller: explorar y práctica sin fin
   await p.evaluate(()=>window.__euclidia.taller.open()); await mira(p,'Taller: explorar',W0);
   await p.evaluate(()=>window.__euclidia.practica.set(true)); await mira(p,'Taller: práctica sin fin',W0);
   await p.evaluate(()=>window.__euclidia.taller.close());
   await p.context().close();
   // 4. Panel del profesor
   const q=await page(dev,{init:()=>{ localStorage.setItem('euclidia2-role','"profesor"'); sessionStorage.setItem('euclidia2-tab','1'); }});
   await q.evaluate(()=>{ window.__euclidia.adv.menu(); [...document.querySelectorAll('#menu button')].find(x=>/Panel del profesor/.test(x.textContent)).click(); }); await mira(q,'panel: inicio',W0);
   await q.evaluate(()=>document.getElementById('tGoEv').click()); await mira(q,'panel: generar una prueba',W0);
   const qr=await q.evaluate(async()=>{ const b=[...document.querySelectorAll('#teacher button')].find(x=>/Crear la prueba|Crear/.test(x.textContent)&&x.offsetParent); if(b) b.click(); await new Promise(r=>setTimeout(r,300)); return !!b; });
   await mira(q,'panel: prueba creada',W0);
   await q.evaluate(()=>{ document.getElementById('teacher').hidden=true; window.__euclidia.adv.menu(); [...document.querySelectorAll('#menu button')].find(x=>/Panel del profesor/.test(x.textContent)).click(); const h=[...document.querySelectorAll('#teacher button')].find(x=>x.offsetParent&&/Volver|inicio|←/.test(x.textContent)); if(h) h.click(); document.getElementById('tGoEst').click(); }); await mira(q,'panel: compartir para estudiar',W0);
   res(qr,`${nom}: el panel del profesor deja crear una prueba y compartir el modo estudio`);
   await q.context().close();
   // 5. Modo estudio (?modo=estudio): menú completo, sin enviar nada
   const s=await page(dev,{query:'?modo=estudio'});
   const est=await s.evaluate(()=>({menu:!document.getElementById('menu').hidden||!!window.__euclidia.adv.menu()})); await mira(s,'modo estudio: menú',W0);
   res(est.menu,`${nom}: el enlace de solo estudio entra al menú`);
   await s.context().close();
   // 6. Prueba como saga: aviso, prólogo, nivel y prueba terminada
   const e=await page(dev,{query:'?rol=estudiante&ev=cr6k2m-C110E110P010-30&evn=Quiz%20de%20cierre'});
   await e.evaluate(async()=>{ const g=id=>document.getElementById(id); g('rName').value='Ana'; g('rLast').value='Ruiz'; g('rDoc').value='5150'; g('regForm').requestSubmit(); await new Promise(r=>setTimeout(r,300)); });
   await mira(e,'prueba: aviso antes de empezar',W0);
   const sg=await e.evaluate(async()=>{ const g=id=>document.getElementById(id); g('evGo').click(); g('evGo').click(); await new Promise(r=>setTimeout(r,400)); return {pr:!g('lore').hidden&&g('loreRegion').textContent==='La saga de hoy'}; });
   await mira(e,'prueba: prólogo de la saga',W0);
   await e.evaluate(async()=>{ const g=id=>document.getElementById(id); g('loreGo').click(); await new Promise(r=>setTimeout(r,150)); g('loreGo').click(); });
   await mira(e,'prueba: nivel',W0);
   const fin=await e.evaluate(async()=>{ const g=id=>document.getElementById(id); g('doneBtn').click(); await new Promise(r=>setTimeout(r,150)); g('doneGo').click(); await new Promise(r=>setTimeout(r,300)); return !g('done').hidden; });
   await mira(e,'prueba terminada',W0);
   res(sg.pr&&fin,`${nom}: la prueba arranca con el prólogo de la saga y termina con «Prueba terminada»`);
   await e.context().close();
   const malas=vistas.filter(v=>!v.ok);
   res(!malas.length,`${nom}: las ${vistas.length} pantallas caben a lo ancho${malas.length?' — se salen: '+malas.map(v=>v.qué+' ('+v.det+')').join('; '):''}`);
 }
 res(errs.length===0,'Sin errores de JavaScript'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 await b.close();
 const txt=out.join('\n')+`\n\n${pass} pasan, ${fail} fallan`; fs.writeFileSync(path.join(__dirname,'salida-cierre.txt'),txt+'\n'); console.log(txt); process.exit(fail?1:0);
})();
