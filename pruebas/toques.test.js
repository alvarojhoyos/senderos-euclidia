// Pruebas de los toques finales (etapa 7c): viñetas de la historia, sonidos, Gran Mapa y medallas.
// Uso: node pruebas/toques.test.js [ruta/al/juego.html]
const {chromium,devices}=require('playwright'); const fs=require('fs'); const path=require('path');
const SRC=process.argv[2]||path.join(__dirname,'..','index.html');
const TMP=path.join(require('os').tmpdir(),'euclidia-toques.html');
fs.writeFileSync(TMP,'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(SRC,'utf8')+'</body></html>');
const out=[]; let pass=0, fail=0; const res=(ok,txt)=>{ ok?pass++:fail++; out.push((ok?'PASA ':'FALLA')+' | '+txt); };
const hid=(p,id)=>p.evaluate(id=>document.getElementById(id).hidden,id);
(async()=>{
 const b=await chromium.launch(); const errs=[];
 const ctx=await b.newContext({...devices['iPhone SE'],deviceScaleFactor:1}); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
 await p.route(/^https?:\/\//,r=>r.abort());
 // 1. Viñetas: la primera vez aparecen antes de elegir rol; se pasan con «Siguiente» y luego sigue el juego
 await p.goto('file://'+TMP); await p.waitForTimeout(500);
 const t1=await p.evaluate(()=>document.getElementById('introTitle').textContent);
 res(!(await hid(p,'intro'))&&(await hid(p,'role'))&&t1==='La Niebla del Olvido','La primera vez se abre la historia (4 viñetas) antes de elegir rol');
 const box=await p.locator('#intro .card').boundingBox(), vw=p.viewportSize();
 res(box&&box.y>=0&&box.y+box.height<=vw.height&&box.x+box.width<=vw.width,`Las viñetas caben en un celular pequeño (${vw.width}×${vw.height})`);
 await p.click('#introGo'); await p.click('#introGo'); await p.click('#introGo'); const last=await p.evaluate(()=>document.getElementById('introGo').textContent); await p.click('#introGo');
 res(last==='¡Vamos!'&&(await hid(p,'intro'))&&!(await hid(p,'role')),'Con «Siguiente» se pasan las 4 viñetas y al final («¡Vamos!») se pide el rol');
 await p.reload(); await p.waitForTimeout(400);
 res(await hid(p,'intro'),'Al volver a abrir el juego la historia no se repite');
 // 2. «Saltar la historia» y «Ver la historia»
 await p.evaluate(()=>{ localStorage.clear(); localStorage.setItem('euclidia2-role','"profesor"'); sessionStorage.setItem('euclidia2-tab','1'); }); await p.reload(); await p.waitForTimeout(400);
 await p.click('#introSkip'); res(await hid(p,'intro'),'«Saltar la historia» la cierra de una vez');
 await p.evaluate(()=>document.getElementById('storyBtn').click()); res(!(await hid(p,'intro')),'«Ver la historia» (pie de página) la vuelve a abrir'); await p.click('#introSkip');
 // 3. Sonido: apagado por defecto, se enciende con el botón y se recuerda
 const s0=await p.evaluate(()=>({on:window.__euclidia.sound(),t:document.getElementById('sndBtn').textContent}));
 await p.locator('#sndBtn').click(); const s1=await p.evaluate(()=>({on:window.__euclidia.sound(),t:document.getElementById('sndBtn').textContent,pr:document.getElementById('sndBtn').getAttribute('aria-pressed')}));
 await p.reload(); await p.waitForTimeout(400); const s2=await p.evaluate(()=>window.__euclidia.sound());
 res(!s0.on&&s0.t==='♪ Sin sonido'&&s1.on&&s1.pr==='true'&&s1.t==='♪ Con sonido'&&s2,'El sonido empieza apagado; el botón lo enciende y el dispositivo lo recuerda');
 // con sonido, jugar un nivel no produce errores
 await p.evaluate(()=>{ const U=window.__euclidia; U.loadLevel(U.LEVELS.findIndex(l=>l.id==='C1')); U.submit(['x^2+y^2=16']); });
 await p.waitForFunction(()=>!window.__euclidia.state().g2.anim,null,{timeout:30000});
 res(errs.length===0,'Con sonido se juega un nivel completo sin errores');
 // 4. Medallas: bronce, plata y oro según las monedas del mundo
 const md=await p.evaluate(()=>{ const U=window.__euclidia, P=U.state().prog, ls=U.LEVELS.filter(l=>!l.tutorial&&l.world==='Elipses'), keep={...P.best};
   const set=f=>{ ls.forEach((l,i)=>P.best[l.id]=f(l,i)); }; const r={};
   ls.forEach(l=>delete P.best[l.id]); r.none=U.medalOf('Elipses').m;
   set(l=>l.coins.length); r.oro=U.medalOf('Elipses').m;
   set((l,i)=>i<2?0:l.coins.length); r.plata=U.medalOf('Elipses').m;
   set(()=>0); r.bronce=U.medalOf('Elipses').m;
   P.best=keep; Object.keys(P.best).forEach(k=>{}); return r; });
 res(md.none===null&&md.oro==='oro'&&md.plata==='plata'&&md.bronce==='bronce','Medallas: sin terminar no hay; todas las monedas = oro; 80 % o más = plata; solo terminar = bronce');
 // 5. Gran Mapa: se abre, muestra las 10 regiones y las medallas de los 6 mundos
 await p.evaluate(()=>{ document.getElementById('win').hidden=true; });
 await p.locator('#mapBtn').scrollIntoViewIfNeeded(); await p.locator('#mapBtn').click(); await p.waitForTimeout(150);
 const mp=await p.evaluate(()=>({vis:!document.getElementById('mapa').hidden,reg:document.querySelectorAll('#mapRegions li').length,med:document.querySelectorAll('#mapMedals li').length,sum:document.getElementById('mapSum').textContent}));
 res(mp.vis&&mp.reg===10&&mp.med===6,`El Gran Mapa muestra 10 regiones y 6 mundos con su medalla («${mp.sum.split('.')[0]}»)`);
 await p.click('#mapClose'); res(await hid(p,'mapa'),'«Volver al juego» cierra el mapa');
 // 6. Al completar todos los niveles de una región, el juego avisa que salió de la niebla
 const rg=await p.evaluate(async()=>{ const U=window.__euclidia, P=U.state().prog; ['C1','C2','C3','C4','E2','H2','P6','I1'].forEach(id=>P.best[id]=1); delete P.best.X2;
   const i=U.LEVELS.findIndex(l=>l.id==='X2'); U.loadLevel(i); U.submit(U.LEVELS[i].answer.map(a=>[...a]));
   await new Promise(r=>{ const w=()=>window.__euclidia.state().g2.anim?setTimeout(w,100):r(); w(); });
   return {ok:!!window.__euclidia.state().g2.result.reached,txt:document.getElementById('winText').textContent}; });
 res(rg.ok&&/Lago y río salió de la niebla/.test(rg.txt),`Al terminar el último nivel de una región: «${rg.txt.split('¡').pop()}»`);
 // 7. En un quiz el mapa no aparece (cada estudiante tiene solo sus niveles)
 const qz=await b.newContext({...devices['iPhone SE'],deviceScaleFactor:1}); const q=await qz.newPage(); q.on('pageerror',e=>errs.push(e.message)); await q.route(/^https?:\/\//,r=>r.abort());
 await q.addInitScript(()=>{ localStorage.setItem('euclidia2-intro','true'); localStorage.setItem('euclidia2-role','"estudiante"'); localStorage.setItem('euclidia2-player',JSON.stringify({nombre:'Ana',apellido:'Ruiz',documento:'123'})); sessionStorage.setItem('euclidia2-tab','1'); });
 await q.goto('file://'+TMP+'?ev=quiz1-C111-30&evn=Quiz'); await q.waitForTimeout(500);
 res(await q.evaluate(()=>document.getElementById('mapBtn').hidden),'En un quiz no se muestra el Gran Mapa');
 await b.close();
 console.log(out.join('\n')); console.log(`\nTotal: ${pass} pasan, ${fail} fallan.`+(errs.length?' Errores de la página: '+errs.join('; '):''));
 process.exitCode=fail||errs.length?1:0;
})();
