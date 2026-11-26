// Pruebas de la historia de cada nivel y del panel que la muestra al abrir un nivel.
// Uso: node pruebas/historia.test.js [ruta/al/juego.html]
const {chromium,devices}=require('playwright'); const fs=require('fs'); const path=require('path');
const SRC=process.argv[2]||path.join(__dirname,'..','index.html');
const TMP=path.join(require('os').tmpdir(),'euclidia-historia.html');
fs.writeFileSync(TMP,'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(SRC,'utf8')+'</body></html>');
const out=[]; let pass=0, fail=0; const res=(ok,txt)=>{ ok?pass++:fail++; out.push((ok?'PASA ':'FALLA')+' | '+txt); };
(async()=>{
 const b=await chromium.launch(); const errs=[]; const ctx=await b.newContext({...devices['iPhone SE'],deviceScaleFactor:1}); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
 await p.route(/^https?:\/\//,r=>r.abort()); await p.addInitScript(()=>{ localStorage.setItem('euclidia2-role','"profesor"'); localStorage.setItem('euclidia2-intro','true'); sessionStorage.setItem('euclidia2-tab','1'); });
 await p.goto('file://'+TMP); await p.waitForTimeout(500);
 // 1. Datos: cada nivel tiene historia y región; la historia no da datos para resolver
 const d=await p.evaluate(()=>{ const U=window.__euclidia; return U.LEVELS.map(L=>({id:L.id,lore:U.LORE[L.id]||'',reg:U.REGIONS[U.SCENE_OF[L.id]]||''})); });
 const sin=d.filter(x=>!x.lore||!x.reg).map(x=>x.id);
 res(sin.length===0,`Los ${d.length} niveles tienen historia y región`+(sin.length?`; faltan: ${sin.join(', ')}`:''));
 const datos=d.filter(x=>/[0-9=²^]/.test(x.lore)).map(x=>x.id);
 res(datos.length===0,'Ninguna historia trae números ni ecuaciones (los datos para resolver van en el panel del nivel)'+(datos.length?`; revisar: ${datos.join(', ')}`:''));
 const largas=d.filter(x=>x.lore.split(/\s+/).length>70).map(x=>x.id);
 res(largas.length===0,'Todas las historias son cortas (70 palabras o menos)'+(largas.length?`; largas: ${largas.join(', ')}`:''));
 const el=d.filter(x=>/Coni (está )?(listo|solo|pequeño|perdido)\b|\bél\b/.test(x.lore)).map(x=>x.id);
 res(el.length===0,'Coni es «ella» en todas las historias'+(el.length?`; revisar: ${el.join(', ')}`:''));
 // 1b. Etapa 7b: en los Rescates las monedas son Trazadores perdidos; en los Escapes, un objeto del lugar
 const it=await p.evaluate(()=>{ const U=window.__euclidia, Ls=U.LEVELS.filter(L=>!L.tutorial);
   return {sinObj:Ls.filter(L=>!L.rescue&&!U.itemOf(L)).map(L=>L.id), resc:Ls.filter(L=>L.rescue).map(L=>U.coinName(L)), names:[...new Set(Ls.filter(L=>!L.rescue).map(L=>U.coinName(L)))]}; });
 res(it.sinObj.length===0&&it.names.length===10,`Cada Escape tiene un objeto del lugar (${it.names.join(', ')})`+(it.sinObj.length?`; faltan: ${it.sinObj.join(', ')}`:''));
 res(it.resc.length>0&&it.resc.every(n=>n==='Trazador perdido'),`En los ${it.resc.length} Rescates cada moneda es un Trazador perdido`);
 await p.evaluate(()=>{ const U=window.__euclidia; U.loadLevel(U.LEVELS.findIndex(l=>l.id==='C1')); });
 const li=await p.evaluate(()=>[...document.querySelectorAll('#targets li.c')].map(l=>l.textContent));
 res(li.length===2&&li.every(t=>/^Trazador perdido \(/.test(t)),`En la lista del nivel aparecen como «${li[0]}»`);
 await p.evaluate(()=>{ const U=window.__euclidia; U.loadLevel(U.LEVELS.findIndex(l=>l.id==='t0')); });
 // 2. Al abrir el juego no aparece el panel encima de todo
 res(await p.locator('#lore').isHidden(),'Al cargar el juego no se abre el panel de historia');
 // 3. Desde el menú se abre el panel con el título y la historia; «Siguiente» lleva al nivel
 await p.locator('.wt',{hasText:/Circunf/}).click();
 const btn=p.locator('.lv',{hasText:'El Faro del Lago'}); await btn.scrollIntoViewIfNeeded(); await btn.click(); await p.waitForTimeout(150);
 const pn=await p.evaluate(()=>({vis:!document.getElementById('lore').hidden,t:document.getElementById('loreTitle').textContent,r:document.getElementById('loreRegion').textContent,x:document.getElementById('loreText').textContent,lv:document.getElementById('lvTitle').textContent,f:document.activeElement&&document.activeElement.id}));
 res(pn.vis&&pn.t==='El Faro del Lago'&&pn.r==='Lago y río'&&/Coni/.test(pn.x)&&pn.lv==='El Faro del Lago'&&pn.f==='loreGo','Al tocar un nivel en el menú se abre su historia (región, título y texto) y el botón «Siguiente» queda listo');
 const box=await p.locator('#lore .card').boundingBox(), vw=p.viewportSize();
 res(box&&box.x>=0&&box.x+box.width<=vw.width&&box.y>=0&&box.y+box.height<=vw.height,`En un celular pequeño (${vw.width}×${vw.height}) el panel cabe completo en la pantalla`);
 await p.screenshot({path:path.join(require('os').tmpdir(),'euclidia-historia-panel.png')});
 await p.locator('#loreGo').click(); await p.waitForTimeout(100);
 res(await p.locator('#lore').isHidden(),'«Siguiente» cierra el panel y deja el nivel listo para jugar');
 // 4. Tocar el mismo nivel otra vez no repite la historia
 await btn.click(); await p.waitForTimeout(100);
 res(await p.locator('#lore').isHidden(),'Tocar en el menú el nivel que ya está abierto no repite la historia');
 // 5. «Siguiente nivel» abre la historia del nivel que sigue
 await p.evaluate(()=>window.__euclidia.submit(['x^2+y^2=16'])); await p.waitForFunction(()=>!window.__euclidia.state().g2.anim,null,{timeout:30000});
 await p.locator('#nextBtn').click(); await p.waitForTimeout(150);
 const nx=await p.evaluate(()=>({vis:!document.getElementById('lore').hidden,t:document.getElementById('loreTitle').textContent,lv:document.getElementById('lvTitle').textContent}));
 res(nx.vis&&nx.t===nx.lv&&nx.t!=='El Faro del Lago',`«Siguiente nivel» abre la historia del nivel que sigue (${nx.t})`);
 await p.keyboard.press('Escape'); await p.waitForTimeout(80);
 res(await p.locator('#lore').isHidden(),'La tecla Esc también cierra el panel');
 await b.close();
 console.log(out.join('\n')); console.log(`\nTotal: ${pass} pasan, ${fail} fallan.`+(errs.length?' Errores de la página: '+errs.join('; '):''));
 process.exitCode=fail||errs.length?1:0;
})();
