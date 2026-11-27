// Pruebas de la entrada (la historia y luego el menú), el menú principal, las instrucciones y los niveles que se desbloquean.
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
 const skip=p=>p.evaluate(()=>{ const v=!document.getElementById('intro').hidden; if(v) document.getElementById('introSkip').click(); return v; });
 // 1. Estudiante nuevo: historia → rol → registro → menú
 let p=await page();
 await p.click('#introSkip'); await p.click('#roleStudent'); await p.fill('#rName','Ana'); await p.click('#regForm button[type=submit]'); await p.waitForTimeout(150);
 res(!(await hid(p,'menu'))&&await hid(p,'mapa'),'Estudiante nuevo: historia → rol → nombre → menú');
 res(await p.evaluate(()=>!!document.getElementById('mAdv')&&!!document.getElementById('mHow')&&!document.getElementById('mStory')),'El menú tiene «Modo aventura» e «Instrucciones y tutorial»; la historia no es un apartado (sale al entrar)');
 await p.click('#mAdv'); await p.waitForTimeout(100);
 // 2. Modo aventura: al empezar solo el tutorial está abierto
 const a=await p.evaluate(()=>({open:[...document.querySelectorAll('#advList .vl:not(.lock)')].map(b=>b.textContent),locks:document.querySelectorAll('#advList .vl.lock').length}));
 res(a.open.length===1&&/Primeros pasos/.test(a.open[0])&&a.locks>15,`Aventura: solo el tutorial abierto, ${a.locks} valles con candado`);
 await p.click('#advList .vl.lock',{force:true}); res(/Se abre al terminar el tutorial/.test(await p.textContent('#advWhy')),'Tocar un valle cerrado explica qué hay que terminar para abrirlo');
 // Menú: sin la aventura, con instrucciones y tutorial
 await p.click('#mapMenu'); await p.waitForTimeout(100);
 res(!(await hid(p,'menu'))&&await hid(p,'mapa')&&await hid(p,'mTeach'),'«☰ Menú» del Gran Mapa vuelve al menú (sin panel del profesor para el estudiante)');
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
   const ch=w=>U.adv.chains(w), C=ch('Circunferencias'), done=c=>c.ls.forEach(L=>P.best[L.id]=1);
   r.t1=op('t1'); r.c1=op(C[0].ls[0].id); done(ch('Tutorial')[0]);
   r.c1b=['Circunferencias','Elipses','Parábolas','Hipérbolas'].every(w=>op(ch(w)[0].ls[0].id)); r.c2=op(C[0].ls[1].id); r.i1=op(ch('Identificar')[0].ls[0].id);
   P.best[C[0].ls[0].id]=2; r.c2b=op(C[0].ls[1].id); r.c5=op(C[1].ls[0].id); done(C[0]); r.c5b=op(C[1].ls[0].id)&&!op(C[1].ls[1].id);
   ['Elipses','Parábolas','Hipérbolas'].forEach(w=>done(ch(w)[0])); r.i1b=op(ch('Identificar')[0].ls[0].id)&&op(ch('Mixtos')[0].ls[0].id);
   r.prof=U.adv.state(true).open.size===U.LEVELS.length; return r; });
 res(!u.t1&&!u.c1,'Sin hacer nada, el segundo paso del tutorial y los mundos están cerrados');
 res(u.c1b&&!u.c2&&!u.i1,'Al terminar el tutorial se abre el primer nivel de cada cónica (no el segundo, ni Identificar)');
 res(u.c2b&&!u.c5,'Superar el primer nivel de un valle abre el segundo, pero el valle siguiente sigue cerrado');
 res(u.c5b,'Terminar el primer valle de circunferencias abre el primer nivel del segundo (no más)');
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
 res(await p.evaluate(()=>window.__euclidia.LEVELS[window.__euclidia.state().idx].id==='C1'&&document.getElementById('mapa').hidden&&document.getElementById('menu').hidden),'Con el tutorial hecho, «Continuar la aventura» abre el primer nivel de circunferencias');
 // 6. Profesor: menú con el panel del profesor
 p=await page('',()=>{ localStorage.setItem('euclidia2-intro','true'); });
 res(await skip(p),'Al entrar se presenta la historia (aunque ya se haya visto antes)');
 await p.click('#roleTeacher'); await p.waitForTimeout(100);
 res(!(await hid(p,'menu'))&&await hid(p,'teacher'),'Profesor: después de la historia y el rol se abre el menú');
 res(!(await hid(p,'menu'))&&!(await hid(p,'mTeach')),'Profesor: el menú tiene «Panel del profesor»');
 await p.click('#mTeach'); res(!(await hid(p,'teacher')),'«Panel del profesor» abre el código QR y la evaluación');
 // 7. Regresar en una pestaña nueva: «Hola de nuevo» → menú
 p=await page('',()=>{ localStorage.setItem('euclidia2-intro','true'); localStorage.setItem('euclidia2-role','"estudiante"'); localStorage.setItem('euclidia2-player',JSON.stringify({nombre:'Ana',apellido:'Ruiz',documento:'12'})); });
 await skip(p); await p.click('#backGo'); res(!(await hid(p,'menu')),'Al volver otro día: historia → «Continuar como Ana» → menú');
 await p.click('#mLab'); await p.waitForTimeout(150); res(!(await hid(p,'taller')),'«Explorar» abre el Taller de Coni');
 await p.click('#tClose'); await p.waitForTimeout(100); res(!(await hid(p,'menu')),'Al cerrar el Taller se vuelve al menú');
 await p.reload(); await p.waitForTimeout(400); res(await skip(p)&&!(await hid(p,'menu')),'Al volver a abrir el juego en la misma pestaña: otra vez la historia y luego el menú');
 await p.click('#mWho'); await p.waitForTimeout(100); res(!(await hid(p,'intro')),'«Cambiar de jugador»: el jugador nuevo ve primero la historia');
 await skip(p); await p.click('#roleStudent'); await p.fill('#rName','Luis'); await p.click('#regForm button[type=submit]'); await p.waitForTimeout(150);
 res(!(await hid(p,'menu')),'Después de registrarse, el jugador nuevo llega al menú');
 // 8. Quiz: el estudiante va directo a su evaluación, sin menú
 p=await page('?ev=quiz1-C111-30&evn=Quiz',()=>{ localStorage.setItem('euclidia2-intro','true'); localStorage.setItem('euclidia2-role','"estudiante"'); localStorage.setItem('euclidia2-player',JSON.stringify({nombre:'Ana',apellido:'Ruiz',documento:'12'})); });
 const st=await skip(p); await p.click('#backGo'); await p.waitForTimeout(100);
 res(st&&await hid(p,'menu')&&await hid(p,'mapa')&&!(await hid(p,'evGate'))&&await hid(p,'menuBtn'),'Con el enlace de un quiz: la historia y luego directo a «Empezar el quiz», sin menú');
 // 9. Laptop
 p=await page('',()=>{ localStorage.setItem('euclidia2-intro','true'); localStorage.setItem('euclidia2-role','"profesor"'); },{viewport:{width:1280,height:800}});
 await skip(p); await p.click('#backGo'); const L=await p.evaluate(()=>{ const r=document.querySelector('.menucard').getBoundingClientRect(); return {w:r.width,h:r.height}; });
 res(L.w>500&&L.h<760,`En laptop el menú se ve completo sin bajar (${Math.round(L.w)}×${Math.round(L.h)} px)`);
 await b.close();
 console.log(out.join('\n')); console.log(`\nTotal: ${pass} pasan, ${fail} fallan.`+(errs.length?' Errores de la página: '+errs.join('; '):''));
 process.exitCode=fail||errs.length?1:0;
})();
