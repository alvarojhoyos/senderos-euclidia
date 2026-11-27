// Pruebas del modo historia (etapa 4 del modo estudio): lecciones del maestro Apolonio antes de cada valle,
// repaso desde el Gran Mapa, enlace ?modo=estudio, enlaces del panel del profesor y Apolonio en pistas y tutorial.
// Uso: node pruebas/lecciones.test.js [ruta/al/juego.html]
const {chromium,devices}=require('playwright'); const fs=require('fs'); const path=require('path');
const SRC=process.argv[2]||path.join(__dirname,'..','index.html');
const TMP=path.join(require('os').tmpdir(),'euclidia-lecciones.html');
fs.writeFileSync(TMP,'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(SRC,'utf8')+'</body></html>');
const out=[]; let pass=0, fail=0; const res=(ok,txt)=>{ ok?pass++:fail++; out.push((ok?'PASA ':'FALLA')+' | '+txt); };
const hid=(p,id)=>p.evaluate(i=>document.getElementById(i).hidden,id);
// Ejemplos de forma general escritos en las lecciones: deben dar exactamente la cónica del ejemplo dibujado
const GENERAL={"El Volcán Dormido":"x^2+y^2+4x-6y-3=0","El Glaciar":"9x^2+4y^2+36x-8y+4=0","La Mina Profunda":"x^2+6x-4y+1=0","Los Túneles Profundos":"9x^2-4y^2-18x-16y-43=0"};
const STUDENT=()=>{ localStorage.setItem('euclidia2-intro','true'); localStorage.setItem('euclidia2-role','"estudiante"'); localStorage.setItem('euclidia2-player',JSON.stringify({nombre:'Ana',apellido:'Ruiz'})); };
(async()=>{
 const b=await chromium.launch(); const errs=[];
 const page=async(url,init,dev)=>{ const ctx=await b.newContext(dev||{...devices['iPhone SE'],deviceScaleFactor:1}); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
   await p.route(/^https?:\/\//,r=>r.abort()); if(init) await p.addInitScript(init); await p.goto('file://'+TMP+(url||'')); await p.waitForTimeout(400); return p; };
 let p=await page('',STUDENT);
 // 1. Una lección por valle, con su texto; ninguna sobra
 const A=await p.evaluate(G=>{ const U=window.__euclidia, LC=U.lecciones.all, chains=[...new Set(U.LEVELS.filter(l=>!l.tutorial).map(l=>l.chain))];
   const miss=chains.filter(c=>!LC[c]||!LC[c].t||!(LC[c].p||[]).length), extra=Object.keys(LC).filter(k=>!chains.includes(k));
   // 2. Cada ejemplo: la ecuación que se muestra es la del dibujo (sus puntos la cumplen) y no es la respuesta de ningún nivel
   const near=(a,b)=>Math.abs(a-b)<1e-6, same=(A,B)=>A.type===B.type&&["h","k","r","a","b","p"].every(k=>A[k]==null||B[k]==null||near(A[k],B[k]))&&(A.vert==null||A.vert===B.vert)&&(A.horiz==null||A.horiz===B.horiz);
   const plain=s=>s.replace(/−/g,"-").replace(/²/g,"^2").replace(/\s/g,"");
   const bad=[], clash=[], gen=[], parts=[]; let nEx=0;
   Object.entries(LC).forEach(([k,L])=>{ if(!L.ex) return; nEx++; const M=U.practica.model(L.ex), C=U.classify(plain(M.eq));
     const tp={circ:"circunferencia",elip:"elipse",para:"parábola",hip:"hipérbola"}[L.ex.c];
     if(C.type!==tp){ bad.push(`${k}: ${M.eq} es ${C.type}`); return; }
     // los puntos dibujados cumplen la ecuación escrita
     const F=(x,y)=>C.type==="circunferencia"?(x-C.h)**2+(y-C.k)**2-C.r**2:C.type==="elipse"?(x-C.h)**2/C.a**2+(y-C.k)**2/C.b**2-1:
       C.type==="hipérbola"?(C.horiz?1:-1)*((x-C.h)**2/C.a**2-(y-C.k)**2/C.b**2)-1:C.vert?y-(C.p*(x-C.h)**2+C.k):x-(C.p*(y-C.k)**2+C.h);
     const off=M.curve.flat().filter(q=>isFinite(q[0])&&isFinite(q[1])).some(([x,y])=>Math.abs(F(x,y))>1e-6*(1+Math.abs(x)+Math.abs(y))**2);
     if(off) bad.push(`${k}: el dibujo no cumple ${M.eq}`);
     if(!L.parts.every(key=>M.parts.some(q=>q.key===key))) parts.push(k);
     U.LEVELS.forEach(lv=>(lv.answer||[]).forEach(br=>{ const D=U.classify(br[0]); if(same(C,D)) clash.push(`${k} = ${lv.id}`); }));
     if(G[k]){ const D=U.classify(G[k]); if(!same(C,D)) gen.push(`${k}: ${G[k]} da ${JSON.stringify(D)}`); } });
   return {n:Object.keys(LC).length,chains:chains.length,miss,extra,nEx,bad,clash,gen,parts}; },GENERAL);
 res(!A.miss.length&&!A.extra.length&&A.n===A.chains,`Hay una lección para cada uno de los ${A.chains} valles${A.miss.length?'; faltan: '+A.miss.join(', '):''}${A.extra.length?'; sobran: '+A.extra.join(', '):''}`);
 res(!A.bad.length,`Los ${A.nEx} ejemplos dibujados coinciden con la ecuación que se muestra${A.bad.length?': '+A.bad.join('; '):''}`);
 res(!A.clash.length,`Ningún ejemplo es la respuesta de un nivel (no se regala la respuesta)${A.clash.length?': '+A.clash.join(', '):''}`);
 res(!A.gen.length,`Los ejemplos de forma general de las lecciones dan la cónica del ejemplo${A.gen.length?': '+A.gen.join('; '):''}`);
 res(!A.parts.length,`Las partes que nombra cada lección existen en el modelo del Taller${A.parts.length?': '+A.parts.join(', '):''}`);
 // 3. Flujo: la primera vez que se entra a un valle sale la lección, después la historia del nivel; la segunda vez no
 const f=await p.evaluate(()=>{ const U=window.__euclidia, P=U.state().prog; document.querySelectorAll('.modal').forEach(m=>m.hidden=true);
   ['t0','t1','t2','t3','t4'].forEach(id=>P.best[id]=1); const go=id=>U.openLevel(U.LEVELS.findIndex(l=>l.id===id)), vis=id=>!document.getElementById(id).hidden, r={};
   go('C1'); r.lec=vis('leccion'); r.lore=vis('lore'); r.title=document.getElementById('lecTitle').textContent; r.fig=vis('lecFig'); r.go=document.getElementById('lecGo').textContent;
   document.getElementById('lecGo').click(); r.lore2=vis('lore'); r.lec2=vis('leccion'); document.getElementById('lore').hidden=true;
   go('C5'); r.again=vis('leccion'); go('C2'); r.other=vis('leccion'); document.getElementById('lecGo').click(); document.getElementById('lore').hidden=true;
   r.seen=JSON.parse(localStorage.getItem('euclidia2-lecciones')||'{}'); return r; });
 res(f.lec&&!f.lore&&f.fig&&/Centro en el origen/.test(f.title)&&f.go==='¡A jugar!','Al entrar por primera vez a un valle, Apolonio da su lección (con dibujo) antes del nivel');
 res(f.lore2&&!f.lec2,'Al pulsar «¡A jugar!» sigue la historia del nivel');
 res(!f.again&&f.other&&f.seen['El Lago Redondo']&&f.seen['El Observatorio Lunar'],'En el mismo valle no se repite; en un valle nuevo sí sale la suya, y quedan guardadas');
 // 4. «Verlo en el Taller» abre el Taller con el ejemplo y al cerrarlo vuelve a la lección
 const t=await p.evaluate(async()=>{ const U=window.__euclidia; U.lecciones.show(U.LEVELS.find(l=>l.id==='E2'),null,true); document.getElementById('lecLab').click(); await new Promise(r=>setTimeout(r,150));
   const r={taller:!document.getElementById('taller').hidden,lec:!document.getElementById('leccion').hidden,st:{...U.taller.state()}}; document.getElementById('tClose').click(); await new Promise(r=>setTimeout(r,100));
   r.back=!document.getElementById('leccion').hidden; r.btn=document.getElementById('lecGo').textContent; document.getElementById('lecGo').click(); return r; });
 res(t.taller&&!t.lec&&t.st.c==='elip'&&t.st.h===2&&t.st.k===-1&&t.back&&t.btn==='Cerrar','«Verlo en el Taller» abre el ejemplo en el Taller y al cerrarlo vuelve a la lección');
 // 5. Repaso en el Gran Mapa: solo las lecciones de los valles abiertos
 await p.evaluate(()=>{ const P=window.__euclidia.state().prog; Object.keys(P.best).forEach(k=>delete P.best[k]); });
 await p.click('#menuBtn').catch(()=>{}); await p.evaluate(()=>window.__euclidia.adv.menu()); await p.click('#mAdv'); await p.waitForTimeout(150);
 const m0=await p.evaluate(()=>document.querySelectorAll('#lecList button').length);
 await p.evaluate(()=>{ document.getElementById('mapClose').click(); const P=window.__euclidia.state().prog; ['t0','t1','t2','t3','t4'].forEach(id=>P.best[id]=1); });
 await p.click('#mAdv'); await p.waitForTimeout(150);
 const m1=await p.evaluate(()=>[...document.querySelectorAll('#lecList button')].map(b=>b.textContent));
 res(m0===0&&m1.length===4,`El Gran Mapa lista las lecciones de los valles abiertos (sin tutorial: ${m0}; con tutorial: ${m1.length})`);
 await p.click('#lecList button'); res(!(await hid(p,'leccion'))&&(await p.textContent('#lecGo'))==='Cerrar','Tocar una lección del mapa la muestra para repasar');
 const W=await p.evaluate(()=>{ const c=document.querySelector('.leccard').getBoundingClientRect(), g=document.getElementById('lecGo').getBoundingClientRect(); return {ok:c.left>=0&&c.right<=document.documentElement.clientWidth,btn:g.bottom<=innerHeight&&g.top>=0,sw:document.documentElement.scrollWidth<=document.documentElement.clientWidth}; });
 res(W.ok&&W.btn&&W.sw,'En el celular la lección cabe a lo ancho y el botón queda a la vista sin bajar');
 await p.click('#lecGo');
 // 6. En una evaluación no hay lecciones
 p=await page('?ev=abcd-C111-0&evn=Quiz',STUDENT);
 const ev=await p.evaluate(()=>{ const U=window.__euclidia; return U.LEVELS.filter(l=>!l.tutorial).some(l=>U.lecciones.need(l)); });
 res(!ev,'En una evaluación no aparece ninguna lección');
 // 7. ?modo=estudio: estudiante nuevo, sin elegir rol ni dar documento, llega al Gran Mapa; «Volver al menú» lleva al menú
 p=await page('?modo=estudio',()=>localStorage.setItem('euclidia2-intro','true'));
 const s0={role:await hid(p,'role'),reg:!(await hid(p,'reg')),doc:await p.evaluate(()=>{ const d=document.getElementById('rDoc'); return !d||d.offsetParent===null||!d.required; })};
 await p.fill('#rName','Luis'); await p.click('#regForm button[type=submit]'); await p.waitForTimeout(150);
 const s1={map:!(await hid(p,'mapa')),menu:await hid(p,'menu'),back:await p.textContent('#mapClose')};
 await p.click('#mapClose'); const s2=!(await hid(p,'menu'));
 res(s0.role&&s0.reg&&s0.doc,'Con el enlace del modo estudio no se pregunta el rol ni el documento: solo el nombre');
 res(s1.map&&s1.menu&&s1.back==='Volver al menú'&&s2,'Después del registro se abre el Gran Mapa (modo aventura) y de ahí se puede ir al menú');
 // 8. Panel del profesor: enlaces del modo estudio
 p=await page('',()=>{ localStorage.setItem('euclidia2-intro','true'); localStorage.setItem('euclidia2-role','"profesor"'); });
 await p.click('#backGo'); await p.click('#mTeach'); await p.waitForTimeout(100);
 const T=await p.evaluate(()=>[...document.querySelectorAll('#estLinks .url')].map(e=>new URL(e.textContent).searchParams.get('modo')));
 res(T.join()==='estudio,taller,practica','El panel del profesor trae los enlaces del modo estudio: aventura con lecciones, Taller y práctica');
 // 9. Apolonio dice las pistas y las lecciones del tutorial
 p=await page('',STUDENT);
 const ap=await p.evaluate(()=>{ document.querySelectorAll('.modal').forEach(m=>m.hidden=true); const U=window.__euclidia; U.loadLevel(U.LEVELS.findIndex(l=>l.lesson));
   const tut=!!document.querySelector('#lesson .apo-say'); U.loadLevel(U.LEVELS.findIndex(l=>l.id==='C1')); const before=document.getElementById('hintApo').hidden;
   document.getElementById('hintBtn').click(); return {tut,before,after:!document.getElementById('hintApo').hidden}; });
 res(ap.tut,'En el tutorial, la lección la presenta el maestro Apolonio');
 res(ap.before&&ap.after,'Al pedir una pista aparece Apolonio dándola');
 // 10. Laptop
 p=await page('',STUDENT,{viewport:{width:1280,height:800}});
 const L=await p.evaluate(()=>{ document.querySelectorAll('.modal').forEach(m=>m.hidden=true); const U=window.__euclidia; U.lecciones.show(U.LEVELS.find(l=>l.id==='H2'),null,true); const r=document.querySelector('.leccard').getBoundingClientRect(); return {w:r.width,h:r.height}; });
 res(L.w>=440&&L.h<=780,`En laptop la lección se ve en una tarjeta (${Math.round(L.w)}×${Math.round(L.h)} px)`);
 await b.close();
 console.log(out.join('\n')); console.log(`\nTotal: ${pass} pasan, ${fail} fallan.`+(errs.length?' Errores de la página: '+errs.join('; '):''));
 process.exitCode=fail||errs.length?1:0;
})();
