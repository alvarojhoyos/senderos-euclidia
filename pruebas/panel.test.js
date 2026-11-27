// Pruebas del panel del profesor (pedido de Alvaro, 2026-11-27): primero pregunta qué va a hacer;
// «Generar una prueba» con tres largos (corta 6, media 12, larga 20) y su QR; «Compartir con estudiantes» con un solo QR
// de estudio que entra como estudiante normal (historia → menú), sin evaluación, sin documento y sin enviar nada.
// Uso: node pruebas/panel.test.js [ruta/al/juego.html]
const {chromium,devices}=require('playwright'); const fs=require('fs'); const path=require('path');
const SRC=process.argv[2]||path.join(__dirname,'..','index.html');
const TMP=path.join(require('os').tmpdir(),'euclidia-panel.html');
fs.writeFileSync(TMP,'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(SRC,'utf8')+'</body></html>');
const out=[]; let pass=0, fail=0; const res=(ok,txt)=>{ ok?pass++:fail++; out.push((ok?'PASA ':'FALLA')+' | '+txt); };
const hid=(p,id)=>p.evaluate(i=>document.getElementById(i).hidden,id);
const PROF=()=>{ localStorage.setItem('euclidia2-intro','true'); localStorage.setItem('euclidia2-role','"profesor"'); };
(async()=>{
 const b=await chromium.launch(); const errs=[];
 const page=async(url,init,dev)=>{ const ctx=await b.newContext(dev||{...devices['iPhone SE'],deviceScaleFactor:1}); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
   await p.route(/^https?:\/\//,r=>r.abort()); if(init) await p.addInitScript(init); await p.goto('file://'+TMP+(url||'')); await p.waitForTimeout(400); return p; };
 const skip=p=>p.evaluate(()=>{ const v=!document.getElementById('intro').hidden; if(v) document.getElementById('introSkip').click(); return v; });
 const wide=p=>p.evaluate(()=>{ const W=document.documentElement.clientWidth; return [...document.querySelectorAll('#teacher .card *')].filter(e=>e.offsetParent!==null).some(e=>e.getBoundingClientRect().right>W+1); });
 // 1. El panel primero pregunta qué va a hacer el profesor
 const enter=async p=>{ await skip(p); await p.click('#backGo'); await p.click('#mTeach'); };
 let p=await page('',PROF); await enter(p); await p.waitForTimeout(100);
 const h=await p.evaluate(()=>({home:!document.getElementById('tHome').hidden,ev:document.getElementById('tEv').hidden,est:document.getElementById('tEst').hidden,
   a:document.getElementById('tGoEv').innerText,b:document.getElementById('tGoEst').innerText}));
 res(h.home&&h.ev&&h.est&&/Generar una prueba/.test(h.a)&&/solo estudio/.test(h.b),'Al abrir el panel solo pregunta: «Generar una prueba» o «Compartir con estudiantes (solo estudio)»');
 res(!(await wide(p)),'Celular (iPhone SE): el inicio del panel no se sale de la pantalla');
 // 2. Generar una prueba: tres largos
 await p.click('#tGoEv'); await p.waitForTimeout(100);
 const g=await p.evaluate(async()=>{ const $=id=>document.getElementById(id), r={home:$('tHome').hidden,qr:$('qrWrap').hidden,def:$('evSum').textContent};
   for(const k of ['c','m','l']){ document.querySelector(`.evlen [data-p="${k}"]`).click(); r[k]={sum:$('evSum').textContent,min:$('evMin').value,on:document.querySelector(`.evlen [data-p="${k}"]`).getAttribute('aria-pressed'),txt:$('evLenTxt').textContent}; }
   document.querySelector('#evQ select[data-w="C"][data-d="2"]').value='3'; document.querySelector('#evQ select').dispatchEvent(new Event('change',{bubbles:true}));
   r.custom={txt:$('evLenTxt').textContent,on:[...document.querySelectorAll('.evlen button')].some(b=>b.getAttribute('aria-pressed')==='true')};
   document.querySelector('.evlen [data-p="c"]').click(); $('evMake').click(); await new Promise(z=>setTimeout(z,100));
   const u=new URL($('qrUrl').textContent); r.after={qr:$('qrWrap').hidden,ev:u.searchParams.get('ev'),rol:u.searchParams.get('rol'),state:$('evState').textContent};
   return r; });
 res(g.home&&/12 niveles y 40 minutos/.test(g.def),'«Generar una prueba» abre la configuración; por defecto la media: '+g.def);
 res(/Cada estudiante tendrá 6 niveles y 20 minutos/.test(g.c.sum)&&g.c.on==='true','Corta: '+g.c.sum);
 res(/Cada estudiante tendrá 12 niveles y 40 minutos/.test(g.m.sum)&&g.m.on==='true','Media: '+g.m.sum);
 res(/Cada estudiante tendrá 20 niveles y 60 minutos/.test(g.l.sum)&&g.l.on==='true','Larga: '+g.l.sum);
 res(/Personalizada/.test(g.custom.txt)&&!g.custom.on,'Si cambia la tabla a mano, ningún largo queda marcado y dice «Personalizada»');
 res(g.qr&&!g.after.qr,'El código QR de la prueba solo aparece después de crearla');
 res(/^[a-z0-9]{6}-C010E010P010H010I010X010-20$/.test(g.after.ev)&&g.after.rol==='estudiante','QR de la corta: rol=estudiante, ev='+g.after.ev);
 res(!(await wide(p)),'Celular: la configuración de la prueba no se sale de la pantalla');
 // los tres largos dan esas cantidades a cada estudiante, sin repetir niveles
 const n=await p.evaluate(()=>{ const T=window.__euclidia.t; return ['c','m','l'].map(k=>{ const e=T.parseEv(`abcdef-${k==='c'?'C010E010P010H010I010X010':k==='m'?'C110E110P110H110I011X011':'C121E121P121H121I011X011'}-0`); const ids=T.sessionFor(e,'123'); return ids.length+(new Set(ids).size===ids.length?'':'!'); }).join(); });
 res(n==='6,12,20','Cada estudiante recibe 6, 12 y 20 niveles distintos: '+n);
 const old=await p.evaluate(()=>{ const T=window.__euclidia.t; return [T.parseEv('abcd-CEPHIX-c-30'),T.parseEv('abcd-CEPHIX-l-30')].map(e=>T.sessionFor(e,'1').length).join(); });
 res(old==='16,20','Los QR viejos (formato corta/larga anterior) siguen dando lo mismo que antes: '+old);
 // 3. Volver y compartir para estudiar: un solo QR
 await p.click('#tEv [data-tback]'); await p.click('#tGoEst'); await p.waitForTimeout(100);
 const s=await p.evaluate(()=>{ const $=id=>document.getElementById(id), u=new URL($('estUrl').textContent);
   return {ev:$('tEv').hidden,keys:[...u.searchParams.keys()].join(),modo:u.searchParams.get('modo'),qr:!!$('estQr'),links:document.querySelectorAll('#tEst .url').length,hoja:!!document.querySelector('#tEst #hojaIn')}; });
 res(s.ev&&s.keys==='modo'&&s.modo==='estudio'&&s.links===1&&!s.hoja,'«Compartir con estudiantes» muestra un solo enlace y QR (?modo=estudio), sin hoja ni opciones de prueba');
 res(!(await wide(p)),'Celular: la vista de compartir no se sale de la pantalla');
 // 4. El estudiante entra con el QR de estudio: historia → solo su nombre → menú completo
 p=await page('?modo=estudio');
 const intro=await skip(p); const r0={role:await hid(p,'role'),reg:!(await hid(p,'reg')),doc:await hid(p,'rDocBox')};
 await p.fill('#rName','Luis'); await p.click('#regForm button[type=submit]'); await p.waitForTimeout(150);
 const r1=await p.evaluate(()=>({menu:!document.getElementById('menu').hidden,mapa:document.getElementById('mapa').hidden,teach:document.getElementById('mTeach').hidden,
   tiles:['mAdv','mHow','mLab','mPrac'].every(id=>!document.getElementById(id).hidden),done:document.getElementById('doneBtn').hidden,send:document.getElementById('sendStatus').textContent}));
 res(intro&&r0.role&&r0.reg&&r0.doc,'QR de estudio: sale la historia y luego solo pide el nombre (sin rol ni documento)');
 res(r1.menu&&r1.mapa&&r1.teach&&r1.tiles,'Luego sale el menú de estudiante: aventura, instrucciones y tutorial, Taller y práctica');
 res(r1.done&&/no se envía/.test(r1.send),'No hay botón «Terminar y enviar» y el juego avisa que nada se envía: '+r1.send);
 // 5. Nada se envía aunque el aparato tenga una hoja y una evaluación guardadas de antes
 p=await page('?modo=estudio',()=>{ localStorage.setItem('euclidia2-intro','true'); localStorage.setItem('euclidia2-pruebas','true'); localStorage.setItem('euclidia2-lock','true'); localStorage.setItem('euclidia2-role','"estudiante"');
   localStorage.setItem('euclidia2-player',JSON.stringify({nombre:'Ana',apellido:'Ruiz',documento:'123'})); localStorage.setItem('euclidia2-hoja','"https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxxxxxx/exec"');
   localStorage.setItem('euclidia2-ev',JSON.stringify({id:'quiz01',q:{C:[1,1,1]},min:30,name:'Quiz'})); sessionStorage.setItem('euclidia2-tab','1'); });
 const q=await p.evaluate(async()=>{ document.querySelectorAll('.modal').forEach(m=>m.hidden=true); const U=window.__euclidia, i=U.LEVELS.findIndex(l=>l.id==='C1');
   const gate=!document.getElementById('evGate').hidden, time=!document.getElementById('sTime').hidden;
   U.loadLevel(i); U.submit(U.LEVELS[i].answer.map(a=>[...a]));
   await new Promise(r=>{ const w=()=>window.__euclidia.state().g2.anim?setTimeout(w,100):r(); w(); });
   return {won:!!U.state().g2.result.reached,queue:JSON.parse(localStorage.getItem('euclidia2-queue')||'[]').length,gate,time,ev:JSON.parse(localStorage.getItem('euclidia2-ev')).id}; });
 res(q.won&&q.queue===0,'En el modo estudio, superar un nivel no deja nada en la cola de envío (aunque haya hoja guardada)');
 res(!q.gate&&!q.time&&q.ev==='quiz01','Una evaluación guardada de antes no se activa en el modo estudio (y queda guardada para cuando vuelva con su QR)');
 // 6. Laptop
 p=await page('',PROF,{viewport:{width:1280,height:800}}); await enter(p); await p.click('#tGoEv'); await p.waitForTimeout(100);
 const lp=await p.evaluate(()=>{ const c=document.querySelector('#teacher .card').getBoundingClientRect(); return {w:Math.round(c.width),lens:[...document.querySelectorAll('.evlen button')].map(b=>Math.round(b.getBoundingClientRect().width))}; });
 res(lp.w<=760&&lp.lens.every(x=>x>100)&&!(await wide(p)),`Laptop: panel de ${lp.w} px, botones de largo de ${lp.lens.join('/')} px`);
 res(!errs.length,'Sin errores de JavaScript'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 await b.close();
 const txt=out.join('\n')+`\n\n${pass} pasan, ${fail} fallan`; fs.writeFileSync(path.join(__dirname,'salida-panel.txt'),txt+'\n'); console.log(txt); process.exit(fail?1:0);
})();
