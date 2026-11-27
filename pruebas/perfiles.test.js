// Pruebas de los perfiles de jugador: varias personas comparten un aparato y cada una tiene su propio avance.
// Sin cuentas ni servidor: todo queda en el aparato. Revisa la migración del avance que ya había, crear, elegir,
// renombrar y borrar jugadores, que el avance no se mezcle, y la entrada con el enlace de una evaluación.
// Uso: node pruebas/perfiles.test.js [ruta/al/juego.html]
const {chromium,devices}=require('playwright'); const fs=require('fs'); const path=require('path');
const SRC=process.argv[2]||path.join(__dirname,'..','index.html');
const TMP=path.join(require('os').tmpdir(),'euclidia-perfiles.html');
fs.writeFileSync(TMP,'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(SRC,'utf8')+'</body></html>');
const out=[]; let pass=0, fail=0; const res=(ok,txt)=>{ ok?pass++:fail++; out.push((ok?'PASA ':'FALLA')+' | '+txt); };
const hid=(p,id)=>p.evaluate(i=>document.getElementById(i).hidden,id);
const LS=(p,k)=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)||'null'),k);
(async()=>{
 const b=await chromium.launch(); const errs=[];
 try{
 const DEV={phone:{...devices['iPhone SE'],deviceScaleFactor:1},laptop:{viewport:{width:1280,height:800}}};
 const newCtx=async dev=>{ const ctx=await b.newContext(DEV[dev]); await ctx.route(/^https?:\/\//,r=>r.abort()); return ctx; };
 const open=async(ctx,url)=>{ const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message)); await p.goto('file://'+TMP+(url||'')); await p.waitForTimeout(400); return p; };
 const skip=p=>p.evaluate(()=>{ const v=!document.getElementById('intro').hidden; if(v) document.getElementById('introSkip').click(); return v; });
 const names=p=>p.evaluate(()=>[...document.querySelectorAll('#pfList .pftxt b')].map(e=>e.textContent));
 const pick=(p,name)=>p.evaluate(n=>{ const b=[...document.querySelectorAll('#pfList .pfpick')].find(x=>x.querySelector('b').textContent===n); if(b) b.click(); return !!b; },name);
 const fits=p=>p.evaluate(()=>{ const W=document.documentElement.clientWidth, bad=[...document.querySelectorAll('#perfiles *')].filter(e=>{ const r=e.getBoundingClientRect(); return r.width&&(r.right>W+0.5||r.left<-0.5); }); return {ok:document.documentElement.scrollWidth<=W&&!bad.length,n:bad.length}; });

 for(const dev of ['phone','laptop']){
  const tag=dev==='phone'?'[celular 320 px]':'[laptop]';
  // 1. Aparato que ya tenía avance (antes de los perfiles): queda como el primer perfil, sin perder nada
  let ctx=await newCtx(dev); let p=await open(ctx);
  await p.evaluate(()=>{ localStorage.clear(); localStorage.setItem('euclidia2-intro','true'); localStorage.setItem('euclidia2-role','"estudiante"');
    localStorage.setItem('euclidia2-player',JSON.stringify({nombre:'Ana',apellido:'',documento:''}));
    localStorage.setItem('euclidia2-prog',JSON.stringify({best:{t0:1,t1:1,C1:2},hintsUsed:1,hintsBought:0,shown:{}}));
    localStorage.setItem('euclidia2-lecciones',JSON.stringify({'El Lago Redondo':1})); localStorage.setItem('euclidia2-practica',JSON.stringify({ok:5,tries:7,racha:2,mejor:3}));
    localStorage.setItem('euclidia2-ultimo','"C1"'); localStorage.setItem('euclidia2-sheet-C1',JSON.stringify({v:2,strokes:[{p:[[1,1],[5,5]],c:'--ink'}],view:{k:1,x:0,y:0}})); sessionStorage.clear(); });
  await p.reload(); await p.waitForTimeout(400);
  let reg=await LS(p,'euclidia2-perfiles');
  res(reg&&reg.list.length===1&&reg.list[0].nombre==='Ana'&&reg.act===reg.list[0].id,`${tag} migración: el jugador que ya estaba queda como primer perfil (${JSON.stringify(reg)})`);
  res(await p.evaluate(()=>{ const s=window.__euclidia.state(); return s.prog.best.C1===2&&s.player.nombre==='Ana'; }),`${tag} migración: conserva sus niveles superados`);
  await skip(p); res(!(await hid(p,'back'))&&/Ana/.test(await p.textContent('#backTitle')),`${tag} con un solo jugador sigue saliendo «Hola de nuevo, Ana»`);
  await p.click('#backGo'); res(!(await hid(p,'menu')),`${tag} «Continuar como Ana» → menú`);
  // 2. Segundo jugador en el mismo aparato
  await p.click('#mWho'); await p.waitForTimeout(100);
  res(!(await hid(p,'perfiles'))&&JSON.stringify(await names(p))==='["Ana"]',`${tag} «Cambiar de jugador» abre la lista: ${JSON.stringify(await names(p))}`);
  res((await fits(p)).ok,`${tag} la lista de jugadores cabe en la pantalla, sin desplazamiento horizontal`);
  await p.click('#pfNew'); await p.waitForTimeout(100); res(!(await hid(p,'intro')),`${tag} el jugador nuevo ve primero la historia`);
  await skip(p); res(!(await hid(p,'reg'))&&await p.inputValue('#rName')==='',`${tag} después pide el nombre (casilla vacía)`);
  await p.fill('#rName','ana'); await p.click('#regForm button[type=submit]'); await p.waitForTimeout(150);
  res(!(await hid(p,'reg'))&&!(await hid(p,'rErr'))&&/Ya hay un jugador llamado Ana/.test(await p.textContent('#rErr')),`${tag} no deja crear otro jugador con el mismo nombre (avisa que ya existe)`);
  await p.fill('#rName','Luis'); await p.click('#regForm button[type=submit]'); await p.waitForTimeout(150);
  res(!(await hid(p,'menu'))&&/Luis/.test(await p.textContent('#menuHello')),`${tag} Luis llega al menú`);
  let st=await p.evaluate(()=>{ const s=window.__euclidia.state(); return {n:Object.keys(s.prog.best).length,pl:s.player.nombre,lec:localStorage.getItem('euclidia2-lecciones'),pr:localStorage.getItem('euclidia2-practica'),sh:localStorage.getItem('euclidia2-sheet-C1'),st:document.getElementById('mAdvSt').textContent}; });
  res(st.pl==='Luis'&&st.n===0&&!st.lec&&!st.pr&&!st.sh,`${tag} Luis empieza de cero: sin niveles, lecciones, práctica ni hojas de Ana (${st.st})`);
  // Luis juega: supera el tutorial 0 y ve una lección
  await p.evaluate(()=>{ const s=window.__euclidia.state(); s.prog.best.t0=1; localStorage.setItem('euclidia2-prog',JSON.stringify(s.prog)); localStorage.setItem('euclidia2-lecciones',JSON.stringify({'El Glaciar':1})); });
  await ctx.close();
 }
 // 3. Otro día en el mismo aparato (mismo contexto, pestaña nueva)
 {
  const ctx=await newCtx('phone'); let p=await open(ctx);
  await p.evaluate(()=>{ localStorage.clear(); localStorage.setItem('euclidia2-intro','true'); localStorage.setItem('euclidia2-role','"estudiante"');
    localStorage.setItem('euclidia2-player',JSON.stringify({nombre:'Ana',apellido:'',documento:''}));
    localStorage.setItem('euclidia2-prog',JSON.stringify({best:{t0:1,t1:1,C1:2},hintsUsed:1,hintsBought:0,shown:{}}));
    localStorage.setItem('euclidia2-practica',JSON.stringify({ok:5,tries:7,racha:2,mejor:3})); sessionStorage.clear(); });
  await p.reload(); await p.waitForTimeout(400); await skip(p); await p.click('#backNew'); await p.waitForTimeout(100);
  res(!(await hid(p,'perfiles')),'«No soy Ana» abre la lista de jugadores');
  await p.click('#pfNew'); await p.waitForTimeout(100);
  res(await hid(p,'intro')&&!(await hid(p,'reg')),'si acaba de ver la historia al abrir, el jugador nuevo no la ve dos veces');
  await p.fill('#rName','Luis'); await p.click('#regForm button[type=submit]'); await p.waitForTimeout(150);
  await p.evaluate(()=>{ const s=window.__euclidia.state(); s.prog.best.t0=1; localStorage.setItem('euclidia2-prog',JSON.stringify(s.prog)); });
  await p.close();
  p=await open(ctx); // pestaña nueva: sessionStorage vacío
  res(await skip(p),'Otro día: primero la historia');
  res(!(await hid(p,'perfiles'))&&await hid(p,'back'),'con dos jugadores, después de la historia pregunta «¿Quién va a jugar?»');
  const txt=await p.evaluate(()=>[...document.querySelectorAll('#pfList .pfpick')].map(e=>e.textContent));
  res(txt.length===2&&/Ana.*3 niveles/.test(txt[0])&&/Luis.*1 nivel superado/.test(txt[1]),'cada jugador muestra su propio avance: '+JSON.stringify(txt));
  await pick(p,'Ana'); await p.waitForTimeout(150);
  let st=await p.evaluate(()=>{ const s=window.__euclidia.state(); return {pl:s.player.nombre,c1:s.prog.best.C1,pr:JSON.parse(localStorage.getItem('euclidia2-practica')||'null'),menu:!document.getElementById('menu').hidden,ps:document.getElementById('mPracSt').textContent}; });
  res(st.pl==='Ana'&&st.c1===2&&st.pr&&st.pr.ok===5&&st.menu,'al elegir a Ana vuelve todo lo suyo (niveles y práctica) y llega al menú: '+st.ps);
  // Taller y práctica guardan en el perfil activo
  await p.evaluate(()=>{ const S=JSON.parse(localStorage.getItem('euclidia2-practica')); S.ok=6; localStorage.setItem('euclidia2-practica',JSON.stringify(S)); });
  await p.click('#mWho'); await p.waitForTimeout(100); await pick(p,'Luis'); await p.waitForTimeout(150);
  st=await p.evaluate(()=>{ const s=window.__euclidia.state(); return {pl:s.player.nombre,n:Object.keys(s.prog.best),pr:localStorage.getItem('euclidia2-practica'),hello:document.getElementById('hello').textContent}; });
  res(st.pl==='Luis'&&JSON.stringify(st.n)==='["t0"]'&&!st.pr&&/Luis/.test(st.hello),'al cambiar a Luis: su nivel, sin la práctica de Ana, y el juego lo saluda: '+JSON.stringify(st));
  await p.click('#mWho'); await p.waitForTimeout(100); await pick(p,'Ana'); await p.waitForTimeout(150);
  res(await p.evaluate(()=>JSON.parse(localStorage.getItem('euclidia2-practica')).ok===6),'lo que Ana hizo antes de cambiar quedó guardado en su perfil');
  // Volver sin cambiar
  await p.click('#mWho'); await p.waitForTimeout(100); res(/Ana/.test(await p.textContent('#pfBack'))&&!(await hid(p,'pfBack')),'la lista tiene «Volver: sigo siendo Ana»');
  await p.click('#pfBack'); await p.waitForTimeout(100); res(!(await hid(p,'menu'))&&await hid(p,'perfiles'),'«Volver» regresa al menú sin cambiar de jugador');
  // 4. Renombrar y borrar (sin ventanas del navegador)
  await p.click('#mWho'); await p.waitForTimeout(100);
  await p.evaluate(()=>[...document.querySelectorAll('#pfList .pfrow')][1].querySelector('.pfed').click());
  await p.fill('#pfName','Lucho'); await p.evaluate(()=>[...document.querySelectorAll('#pfList .btn')].find(b=>b.textContent==='Guardar').click()); await p.waitForTimeout(100);
  res(JSON.stringify(await names(p))==='["Ana","Lucho"]','renombrar: Luis ahora se llama Lucho');
  await pick(p,'Lucho'); await p.waitForTimeout(150);
  res(await p.evaluate(()=>window.__euclidia.state().player.nombre==='Lucho'&&Object.keys(window.__euclidia.state().prog.best).length===1),'el nombre nuevo llega también a sus datos y conserva su avance');
  await p.click('#mWho'); await p.waitForTimeout(100);
  await p.evaluate(()=>[...document.querySelectorAll('#pfList .pfrow')][0].querySelector('.pfed').click());
  await p.evaluate(()=>[...document.querySelectorAll('#pfList .btn')].find(b=>b.textContent==='Borrar jugador').click()); await p.waitForTimeout(50);
  res(/¿Borrar a Ana/.test(await p.textContent('#pfList')),'borrar pide confirmación dentro del juego');
  await p.evaluate(()=>[...document.querySelectorAll('#pfList .btn')].find(b=>b.textContent==='No, dejarlo').click()); await p.waitForTimeout(50);
  res(JSON.stringify(await names(p))==='["Ana","Lucho"]','«No, dejarlo» no borra nada');
  await p.evaluate(()=>[...document.querySelectorAll('#pfList .pfrow')][0].querySelector('.pfed').click());
  await p.evaluate(()=>[...document.querySelectorAll('#pfList .btn')].find(b=>b.textContent==='Borrar jugador').click());
  await p.evaluate(()=>[...document.querySelectorAll('#pfList .btn')].find(b=>b.textContent==='Sí, borrar').click()); await p.waitForTimeout(100);
  const left=await p.evaluate(()=>({n:[...document.querySelectorAll('#pfList .pftxt b')].map(e=>e.textContent),packs:Object.keys(localStorage).filter(k=>k.startsWith('euclidia2-perfil-')),pl:window.__euclidia.state().player.nombre}));
  res(JSON.stringify(left.n)==='["Lucho"]'&&left.packs.length===0&&left.pl==='Lucho','al borrar a Ana se borra su avance y Lucho sigue igual: '+JSON.stringify(left));
  await ctx.close();
 }
 // 5. Evaluación en un aparato compartido: cada uno con su documento y su propia prueba; la aventura no se pierde
 {
  const ctx=await newCtx('phone'); let p=await open(ctx);
  await p.evaluate(()=>{ localStorage.clear(); localStorage.setItem('euclidia2-intro','true'); localStorage.setItem('euclidia2-role','"estudiante"'); sessionStorage.clear(); });
  await p.reload(); await p.waitForTimeout(300); await skip(p);
  await p.fill('#rName','Ana'); await p.click('#regForm button[type=submit]'); await p.waitForTimeout(100);
  await p.evaluate(()=>{ const s=window.__euclidia.state(); s.prog.best.C1=2; s.prog.best.C2=2; localStorage.setItem('euclidia2-prog',JSON.stringify(s.prog)); });
  await p.click('#mWho'); await p.click('#pfNew'); await skip(p); await p.fill('#rName','Luis'); await p.click('#regForm button[type=submit]'); await p.waitForTimeout(100);
  await p.close();
  p=await open(ctx,'?ev=quiz9-C111-30&evn=Quiz');
  await skip(p);
  res(!(await hid(p,'perfiles'))&&/presentar la prueba/.test(await p.textContent('#pfTitle')),'con el enlace de una prueba: historia → «¿Quién va a presentar la prueba?»');
  await pick(p,'Ana'); await p.waitForTimeout(150);
  res(!(await hid(p,'reg'))&&await p.inputValue('#rName')==='Ana'&&!(await hid(p,'rDocBox')),'el nombre del perfil se usa para la prueba: solo falta apellido y documento');
  await p.fill('#rLast','Ruiz'); await p.fill('#rDoc','111'); await p.click('#regForm button[type=submit]'); await p.waitForTimeout(150);
  let st=await p.evaluate(()=>{ const s=window.__euclidia.state(); return {gate:!document.getElementById('evGate').hidden,menu:!document.getElementById('menu').hidden,best:Object.keys(s.prog.best).length,doc:s.player.documento}; });
  res(st.gate&&!st.menu&&st.best===0&&st.doc==='111','Ana entra a su prueba (sin menú) y la prueba empieza de cero: '+JSON.stringify(st));
  res(await p.evaluate(()=>{ const a=JSON.parse(localStorage.getItem('euclidia2-prog')); return a&&a.best.C1===2&&a.best.C2===2; }),'presentar la prueba no borra lo que Ana llevaba en la aventura');
  const ordA=await p.evaluate(()=>window.__euclidia.state().idx);
  await p.evaluate(()=>{ const s=window.__euclidia.state(); s.prog.best['x-prueba']=1; localStorage.setItem('euclidia2-prog-ev',JSON.stringify(s.prog)); });
  // Luis presenta en el mismo celular
  await p.click('#whoBtn'); await p.waitForTimeout(100); await pick(p,'Luis'); await p.waitForTimeout(150);
  res(!(await hid(p,'reg'))&&await p.inputValue('#rName')==='Luis','Luis elige su nombre y completa sus datos');
  await p.fill('#rLast','Mora'); await p.fill('#rDoc','222'); await p.click('#regForm button[type=submit]'); await p.waitForTimeout(150);
  st=await p.evaluate(()=>{ const s=window.__euclidia.state(); return {gate:!document.getElementById('evGate').hidden,best:Object.keys(s.prog.best).length,doc:s.player.documento}; });
  res(st.gate&&st.best===0&&st.doc==='222','Luis tiene su propia prueba (sin lo que hizo Ana): '+JSON.stringify(st));
  await p.click('#whoBtn'); await p.waitForTimeout(100); await pick(p,'Ana Ruiz'); await p.waitForTimeout(150);
  st=await p.evaluate(()=>{ const s=window.__euclidia.state(); return {reg:!document.getElementById('reg').hidden,b:s.prog.best['x-prueba'],doc:s.player.documento}; });
  res(!st.reg&&st.b===1&&st.doc==='111','al volver a Ana sigue su prueba donde iba, sin volver a pedir datos: '+JSON.stringify(st));
  // Jugador nuevo con el mismo documento: es la misma persona, no se duplica
  await p.click('#whoBtn'); await p.waitForTimeout(100); await p.click('#pfNew'); await skip(p);
  await p.fill('#rName','Ana María'); await p.fill('#rLast','Ruiz'); await p.fill('#rDoc','111'); await p.click('#regForm button[type=submit]'); await p.waitForTimeout(150);
  const reg=await LS(p,'euclidia2-perfiles');
  res(reg.list.length===2&&await p.evaluate(()=>window.__euclidia.state().prog.best['x-prueba']===1),'«jugador nuevo» con el documento de Ana vuelve a su perfil (no crea otro)');
  // Ana termina la prueba: vuelve al juego normal; Luis sigue con su prueba
  await p.evaluate(()=>{ const b=document.getElementById('evGo'); b.click(); b.click(); }); await p.waitForTimeout(150);
  await p.evaluate(()=>{ ['lore','leccion'].forEach(id=>{ const e=document.getElementById(id); if(e&&!e.hidden) e.hidden=true; }); });
  await p.evaluate(()=>document.getElementById('doneBtn').click()); await p.waitForTimeout(100); await p.click('#doneGo'); await p.waitForTimeout(300);
  res(!(await hid(p,'done'))&&/Prueba terminada/.test(await p.textContent('#doneTitle')),'Ana termina y envía su prueba');
  const qn=await p.evaluate(()=>JSON.parse(localStorage.getItem('euclidia2-queue')||'[]').length);
  await p.click('#doneBack'); await p.waitForTimeout(200);
  st=await p.evaluate(()=>{ const s=window.__euclidia.state(); return {menu:!document.getElementById('menu').hidden,mb:!document.getElementById('menuBtn').hidden,gate:!document.getElementById('evGate').hidden,c1:s.prog.best.C1,done:!document.getElementById('doneBtn').hidden}; });
  res(st.menu&&st.mb&&!st.gate&&st.c1===2&&!st.done,'al cerrar «Prueba terminada» Ana vuelve al menú y a su aventura (sin «Terminar y enviar»): '+JSON.stringify(st));
  await p.evaluate(()=>{ document.getElementById('menu').hidden=true; const U=window.__euclidia, i=U.LEVELS.findIndex(l=>l.id==='C3'); U.loadLevel(i); U.submit(U.LEVELS[i].answer); });
  await p.waitForTimeout(50); await p.waitForFunction(()=>!window.__euclidia.state().g2.anim,null,{timeout:30000});
  const won=await p.evaluate(()=>window.__euclidia.state().prog.best.C3!=null);
  res(won&&await p.evaluate(()=>{ const q=JSON.parse(localStorage.getItem('euclidia2-queue')||'[]').length; return q; })===qn,'después de la prueba, lo que juega en la aventura no se envía a la hoja del profesor');
  await p.close(); p=await open(ctx,'?ev=quiz9-C111-30&evn=Quiz'); await skip(p); await pick(p,'Ana María Ruiz'); await p.waitForTimeout(150);
  res(!(await hid(p,'menu'))&&await hid(p,'evGate'),'al abrir otra vez el enlace de la prueba, Ana (que ya la presentó) llega al menú');
  await p.click('#mWho'); await p.waitForTimeout(100); await pick(p,'Luis Mora'); await p.waitForTimeout(150);
  res(await hid(p,'menu')&&!(await hid(p,'evGate')),'Luis, que no la ha presentado, sigue con su prueba en el mismo celular');
  // ?modo=estudio en el mismo aparato: muestra la aventura de Ana, no la prueba
  await p.close(); p=await open(ctx,'?modo=estudio'); await skip(p);
  if(!(await hid(p,'perfiles'))) await pick(p,'Ana María Ruiz'); await p.waitForTimeout(150);
  res(await p.evaluate(()=>{ const s=window.__euclidia.state(); return s.prog.best.C1===2&&!s.prog.best['x-prueba']; }),'con el QR de solo estudio se ve la aventura de Ana, no su prueba');
  await ctx.close();
 }
 }catch(e){ res(false,'la prueba se detuvo: '+e.message.split('\n')[0]); }
 res(errs.length===0,'sin errores de JavaScript'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 await b.close();
 const txt=out.join('\n')+`\n\n${pass} pasan, ${fail} fallan`; fs.writeFileSync(path.join(__dirname,'salida-perfiles.txt'),txt+'\n'); console.log(txt); process.exit(fail?1:0);
})();
