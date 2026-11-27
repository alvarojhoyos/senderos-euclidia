// Pruebas de la entrada (se presenta la aventura), el menú principal, las instrucciones y los niveles que se desbloquean.
// Uso: node pruebas/menu.test.js [ruta/al/juego.html]
const {chromium,devices}=require('playwright'); const fs=require('fs'); const path=require('path');
const SRC=process.argv[2]||path.join(__dirname,'..','index.html');
const TMP=path.join(require('os').tmpdir(),'euclidia-menu.html');
fs.writeFileSync(TMP,'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(SRC,'utf8')+'</body></html>');
const out=[]; let pass=0, fail=0; const res=(ok,txt)=>{ ok?pass++:fail++; out.push((ok?'PASA ':'FALLA')+' | '+txt); };
const hid=(p,id)=>p.evaluate(i=>document.getElementById(i).hidden,id);
(async()=>{
 const b=await chromium.launch(); const errs=[];
 const page=async(url,init,dev)=>{ const ctx=await b.newContext(dev||{...devices['iPhone SE'],deviceScaleFactor:1}); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
   await p.route(/^https?:\/\//,r=>r.abort()); if(init) await p.addInitScript(init); await p.goto('file://'+TMP+(url||'')); await p.waitForTimeout(400); return p; };
 // 1. Estudiante nuevo: historia → rol → registro → menú
 let p=await page();
 await p.click('#introSkip'); await p.click('#roleStudent'); await p.fill('#rName','Ana'); await p.click('#regForm button[type=submit]'); await p.waitForTimeout(150);
 res(!(await hid(p,'mapa'))&&await hid(p,'menu'),'Estudiante nuevo: después del registro se presenta la aventura (el Gran Mapa), no el menú');
 // 2. Modo aventura: al empezar solo el tutorial está abierto
 const a=await p.evaluate(()=>({open:[...document.querySelectorAll('#advList .vl:not(.lock)')].map(b=>b.textContent),locks:document.querySelectorAll('#advList .vl.lock').length}));
 res(a.open.length===1&&/Primeros pasos/.test(a.open[0])&&a.locks>15,`Aventura: solo el tutorial abierto, ${a.locks} valles con candado`);
 await p.click('#advList .vl.lock',{force:true}); res(/Se abre al terminar el tutorial/.test(await p.textContent('#advWhy')),'Tocar un valle cerrado explica qué hay que terminar para abrirlo');
 // Menú: sin la aventura, con instrucciones y tutorial
 await p.click('#mapMenu'); await p.waitForTimeout(100);
 res(!(await hid(p,'menu'))&&await hid(p,'mapa')&&await p.evaluate(()=>!document.getElementById('mAdv')&&!!document.getElementById('mHow'))&&await hid(p,'mTeach'),'«☰ Menú» abre el menú: sin apartado de aventura, con «Instrucciones y tutorial», sin panel del profesor');
 const W=await p.evaluate(()=>{ const r=document.querySelector('.menucard').getBoundingClientRect(), t=[...document.querySelectorAll('.menucard .mtile')].map(e=>e.getBoundingClientRect()); return {ok:r.left>=0&&r.right<=document.documentElement.clientWidth&&t.every(q=>q.right<=r.right)}; });
 res(W.ok,'El menú y sus apartados caben en el ancho del celular');
 await p.click('#mHow'); await p.waitForTimeout(100);
 const hw=await p.evaluate(()=>({vis:!document.getElementById('howto').hidden,n:document.querySelectorAll('#howto .howlist li').length,txt:document.getElementById('howto').textContent}));
 res(hw.vis&&hw.n>=6&&/forma canónica/i.test(hw.txt)&&/restricción/.test(hw.txt)&&/2 monedas/.test(hw.txt),`«Instrucciones y tutorial» explica cómo se juega (${hw.n} puntos: canónica, restricción, pistas a 2 monedas)`);
 await p.click('#howTut'); await p.waitForTimeout(100);
 res(await p.evaluate(()=>window.__euclidia.LEVELS[window.__euclidia.state().idx].id==='t0'&&document.getElementById('howto').hidden),'«Jugar el tutorial» abre el primer paso del tutorial');
 await p.click('#loreGo').catch(()=>{}); await p.evaluate(()=>{ document.getElementById('lore').hidden=true; });
 // 3. Reglas de desbloqueo
 const u=await p.evaluate(()=>{ const U=window.__euclidia, P=U.state().prog, op=id=>U.adv.state().open.has(id), r={};
   r.t1=op('t1'); r.c1=op('C1'); ['t0','t1','t2','t3','t4'].forEach(id=>P.best[id]=1);
   r.c1b=op('C1')&&op('E1')&&op('P1')&&op('H1'); r.c2=op('C2'); r.i1=op('I1');
   P.best.C1=2; r.c2b=op('C2'); r.c5=op('C5'); ['C2','C3','C4'].forEach(id=>P.best[id]=1); r.c5b=op('C5');
   ['E1','E2','E3','E4','P1','P2','P3','P4','H1','H2','H3','H4'].forEach(id=>P.best[id]=1); r.i1b=op('I1')&&op('X1');
   r.prof=U.adv.state(true).open.size===U.LEVELS.length; return r; });
 res(!u.t1&&!u.c1,'Sin hacer nada, el segundo paso del tutorial y los mundos están cerrados');
 res(u.c1b&&!u.c2&&!u.i1,'Al terminar el tutorial se abre el primer nivel de cada cónica (no el segundo, ni Identificar)');
 res(u.c2b&&!u.c5,'Superar C1 abre C2, pero el valle siguiente sigue cerrado');
 res(u.c5b,'Terminar el primer valle de circunferencias abre el segundo');
 res(u.i1b,'Terminar el primer valle de las cuatro cónicas abre Identificar y Mixtos');
 res(u.prof,'Sin candados (profesor o evaluación): todos los niveles abiertos');
 // 4. En el juego los niveles cerrados tienen candado y no se abren
 const g=await p.evaluate(()=>{ const U=window.__euclidia, P=U.state().prog; Object.keys(P.best).forEach(k=>delete P.best[k]); U.loadLevel(0); return true; });
 const lk=await p.evaluate(()=>{ const b=document.querySelector('#levels .lv.lock'); const before=window.__euclidia.state().idx; b.click(); return {n:document.querySelectorAll('#levels .lv.lock').length,same:window.__euclidia.state().idx===before,note:document.getElementById('lockNote').textContent}; });
 res(lk.n>0&&lk.same&&/Niebla/.test(lk.note),`En la barra de niveles los cerrados llevan candado; tocarlo explica por qué («${lk.note.trim().slice(0,60)}…»)`);
 res(!(await hid(p,'menuBtn')),'El botón «Menú» está en la pantalla del juego');
 // 5. «Continuar la aventura» lleva al siguiente nivel abierto sin superar
 const c=await p.evaluate(()=>{ const U=window.__euclidia, P=U.state().prog; ['t0','t1','t2','t3','t4'].forEach(id=>P.best[id]=1); localStorage.removeItem('euclidia2-ultimo'); return true; });
 await p.click('#mapBtn'); await p.click('#advGo'); await p.waitForTimeout(100);
 res(await p.evaluate(()=>window.__euclidia.LEVELS[window.__euclidia.state().idx].id==='C1'&&document.getElementById('mapa').hidden&&document.getElementById('menu').hidden),'Con el tutorial hecho, «Continuar la aventura» abre C1');
 // 6. Profesor: menú con el panel del profesor
 p=await page('',()=>{ localStorage.setItem('euclidia2-intro','true'); });
 await p.click('#roleTeacher'); await p.waitForTimeout(100);
 res(!(await hid(p,'mapa'))&&await hid(p,'teacher'),'Profesor: al elegir el rol se presenta la aventura');
 await p.click('#mapMenu'); res(!(await hid(p,'menu'))&&!(await hid(p,'mTeach')),'Profesor: el menú tiene «Panel del profesor»');
 await p.click('#mTeach'); res(!(await hid(p,'teacher')),'«Panel del profesor» abre el código QR y la evaluación');
 // 7. Regresar en una pestaña nueva: «Hola de nuevo» → menú
 p=await page('',()=>{ localStorage.setItem('euclidia2-intro','true'); localStorage.setItem('euclidia2-role','"estudiante"'); localStorage.setItem('euclidia2-player',JSON.stringify({nombre:'Ana',apellido:'Ruiz',documento:'12'})); });
 await p.click('#backGo'); res(!(await hid(p,'mapa')),'Al volver otro día: «Continuar como Ana» presenta la aventura');
 await p.click('#mapMenu');
 await p.click('#mLab'); await p.waitForTimeout(150); res(!(await hid(p,'taller')),'«Explorar» abre el Taller de Coni');
 await p.click('#tClose'); await p.waitForTimeout(100); res(!(await hid(p,'menu')),'Al cerrar el Taller se vuelve al menú');
 // 8. Quiz: el estudiante va directo a su evaluación, sin menú
 p=await page('?ev=quiz1-C111-30&evn=Quiz',()=>{ localStorage.setItem('euclidia2-intro','true'); localStorage.setItem('euclidia2-role','"estudiante"'); localStorage.setItem('euclidia2-player',JSON.stringify({nombre:'Ana',apellido:'Ruiz',documento:'12'})); });
 await p.click('#backGo'); await p.waitForTimeout(100);
 res(await hid(p,'menu')&&await hid(p,'mapa')&&!(await hid(p,'evGate'))&&await hid(p,'menuBtn'),'Con el enlace de un quiz no aparece el menú: va directo a «Empezar el quiz»');
 // 9. Laptop
 p=await page('',()=>{ localStorage.setItem('euclidia2-intro','true'); localStorage.setItem('euclidia2-role','"profesor"'); },{viewport:{width:1280,height:800}});
 await p.click('#backGo'); await p.click('#mapMenu'); const L=await p.evaluate(()=>{ const r=document.querySelector('.menucard').getBoundingClientRect(); return {w:r.width,h:r.height}; });
 res(L.w>500&&L.h<760,`En laptop el menú se ve completo sin bajar (${Math.round(L.w)}×${Math.round(L.h)} px)`);
 await b.close();
 console.log(out.join('\n')); console.log(`\nTotal: ${pass} pasan, ${fail} fallan.`+(errs.length?' Errores de la página: '+errs.join('; '):''));
 process.exitCode=fail||errs.length?1:0;
})();
