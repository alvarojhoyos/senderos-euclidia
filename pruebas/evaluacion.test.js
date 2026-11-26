// Pruebas del modo evaluación: niveles de cada estudiante, nota, tiempo y código QR del profesor.
// Uso: node pruebas/evaluacion.test.js [ruta/al/juego.html]
const {chromium,devices}=require('playwright'); const fs=require('fs'); const path=require('path');
const SRC=process.argv[2]||path.join(__dirname,'..','index.html');
const TMP=path.join(require('os').tmpdir(),'euclidia-evaluacion.html');
fs.writeFileSync(TMP,'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(SRC,'utf8')+'</body></html>');
const out=[]; let pass=0, fail=0; const res=(ok,txt)=>{ ok?pass++:fail++; out.push((ok?'PASA ':'FALLA')+' | '+txt); };
(async()=>{
 const b=await chromium.launch(); const errs=[];
 const page=async(init,query='')=>{ const ctx=await b.newContext({...devices['Pixel 7'],deviceScaleFactor:1}); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
   await p.route(/^https?:\/\//,r=>r.abort()); await p.addInitScript(()=>localStorage.setItem('euclidia2-intro','true')); if(init) await p.addInitScript(init); await p.goto('file://'+TMP+query); await p.waitForTimeout(400); return p; };
 // 1. Reparto de niveles
 const p0=await page(()=>{ localStorage.setItem('euclidia2-role','"profesor"'); sessionStorage.setItem('euclidia2-tab','1'); });
 const r=await p0.evaluate(()=>{ const U=window.__euclidia, T=U.t, L=U.LEVELS, byId=Object.fromEntries(L.map(l=>[l.id,l]));
   const larga=T.parseEv('abc123-C121E121P121H121I011X011-60'), corta=T.parseEv('abc123-C111E111P111H111I011X011-20');
   const s1=T.sessionFor(larga,'1001'), s1b=T.sessionFor(larga,' 1001 '), s2=T.sessionFor(corta,'1001');
   const docs=Array.from({length:40},(_,i)=>String(5000+i)), sets=new Set(docs.map(d=>T.sessionFor(larga,d).join())), coins=docs.map(d=>T.sessionFor(larga,d).reduce((s,id)=>s+byId[id].coins.length,0));
   const D=['fácil','medio','difícil'];
   // cantidades por mundo y dificultad, y orden de fácil a difícil dentro de cada mundo
   const fits=(ev,ss)=>{ const W={C:'Circunferencias',E:'Elipses',P:'Parábolas',H:'Hipérbolas',I:'Identificar',X:'Mixtos'};
     return Object.entries(W).every(([k,w])=>{ const ls=ss.map(id=>byId[id]).filter(l=>l.world===w), q=ev.q[k]||[0,0,0];
       const ord=ls.every((l,i)=>i===0||D.indexOf(l.diff)>=D.indexOf(ls[i-1].diff));
       return ord&&D.every((d,j)=>ls.filter(l=>l.diff===d).length===q[j]); })&&new Set(ss).size===ss.length; };
   const libre=T.parseEv('k3f9a2-C021E200-15'), sl=T.sessionFor(libre,'42');
   const vieja=T.parseEv('abc123-CEPHIX-l-60'), maxi=T.parseEv('zz99zz-C300-10'), fac=new Set(docs.map(d=>T.sessionFor(maxi,d).sort().join()));
   return {n1:s1.length,n2:s2.length,c1:T.evCount(larga),c2:T.evCount(corta),same:s1.join()===s1b.join(),distintos:sets.size,
     fit:fits(larga,s1)&&fits(corta,s2)&&docs.every(d=>fits(larga,T.sessionFor(larga,d))),libre:sl.map(id=>byId[id].world[0]+byId[id].diff[0]).join(','),fitLibre:fits(libre,sl),
     vieja:vieja&&JSON.stringify(vieja.q)===JSON.stringify(larga.q),fac:fac.size,
     coinsMin:Math.min(...coins),coinsMax:Math.max(...coins),mal:T.parseEv('abc-ZZ-l-60'),cero:T.parseEv('abc123-C000-60'),evOk:T.parseEv('k3f9a2-C100H001-0')}; });
 res(r.n1===20&&r.c1===20,`Atajo «Larga» con los 6 mundos: ${r.n1} niveles (el panel anuncia ${r.c1})`);
 res(r.n2===16&&r.c2===16,`Atajo «Corta» con los 6 mundos: ${r.n2} niveles (el panel anuncia ${r.c2})`);
 res(r.same,'El mismo documento recibe siempre los mismos niveles (espacios aparte)');
 res(r.distintos>=30,`40 documentos reciben ${r.distintos} combinaciones distintas de niveles`);
 res(r.fit,'Cada estudiante recibe exactamente las cantidades de cada mundo y dificultad, sin repetir, de fácil a difícil');
 res(r.fitLibre&&r.libre==='Cm,Cm,Cd,Ef,Ef',`Tabla a mano (circunferencias 0·2·1, elipses 2·0·0): ${r.libre}`);
 res(r.fac===1,'Si una casilla está al máximo (los 3 fáciles de circunferencias), todos reciben esos mismos niveles');
 res(r.vieja,'Los códigos QR del formato anterior (corta o larga) siguen funcionando');
 res(r.coinsMin>0,`Monedas posibles por estudiante en la larga: entre ${r.coinsMin} y ${r.coinsMax}; la nota se escala a 5,0 con las de cada uno`);
 res(r.mal===null&&r.cero===null&&r.evOk&&r.evOk.min===0&&Object.keys(r.evOk.q).join()==='C,H','Códigos de evaluación válidos e inválidos (sin niveles no vale)');
 // 2. El profesor arma la evaluación en la tabla y el QR la lleva
 const q=await p0.evaluate(async()=>{ document.getElementById('teacherBtn').click(); await new Promise(r=>setTimeout(r,100));
   const sel=(w,d)=>document.querySelector(`#evQ select[data-w="${w}"][data-d="${d}"]`);
   const maxC=[0,1,2].map(d=>sel('C',d).options.length-1).join(','), noX=!sel('X',0);
   document.querySelector('.evpre [data-p="l"]').click(); const larga=document.getElementById('evSum').textContent;
   document.querySelector('.evpre [data-p="0"]').click(); const vacio=document.getElementById('evSum').textContent, dis=document.getElementById('evMake').disabled;
   [['C',0],['C',1],['C',2],['P',0],['P',1],['P',2]].forEach(([w,d])=>{ sel(w,d).value='1'; }); sel('C',0).dispatchEvent(new Event('change',{bubbles:true}));
   document.getElementById('evMin').value='30'; document.getElementById('evName').value='Quiz 1'; document.getElementById('evMin').dispatchEvent(new Event('input'));
   const sum=document.getElementById('evSum').textContent; document.getElementById('evMake').click(); await new Promise(r=>setTimeout(r,100));
   const u=new URL(document.getElementById('qrUrl').textContent); return {maxC,noX,larga,vacio,dis,sum,ev:u.searchParams.get('ev'),evn:u.searchParams.get('evn'),rol:u.searchParams.get('rol')}; });
 res(q.maxC==='3,5,4'&&q.noX,`La tabla ofrece lo que hay en el banco: circunferencias hasta ${q.maxC} (fácil, medio, difícil); mixtos sin fáciles`);
 res(/20 niveles/.test(q.larga)&&/al menos un nivel/.test(q.vacio)&&q.dis,'Atajos: «Larga» llena 20 niveles y «Vaciar» deja el botón del QR desactivado');
 res(/^[a-z0-9]{6}-C111P111-30$/.test(q.ev)&&q.evn==='Quiz 1'&&q.rol==='estudiante',`Enlace del QR: rol=${q.rol}, ev=${q.ev}, evn=${q.evn}`);
 res(/6 niveles y 30 minutos/.test(q.sum),'Resumen del panel: '+q.sum);
 // 3. Un estudiante entra con el enlace de la evaluación
 const ev=q.ev, qs=`?rol=estudiante&ev=${ev}&evn=Quiz%201`;
 const p1=await page(null,qs);
 const pre=await p1.evaluate(async()=>{ const g=id=>document.getElementById(id); g('rName').value='Ana'; g('rLast').value='Pérez'; g('rDoc').value='777'; g('regForm').requestSubmit(); await new Promise(r=>setTimeout(r,300));
   const U=window.__euclidia, cur=U.LEVELS[U.state().idx], tabs=[...document.querySelectorAll('.wt')].map(t=>t.textContent.replace(/\s+\S+$/,'').trim());
   const t1=g('sTimeV').textContent; await new Promise(r=>setTimeout(r,2200));
   return {tut:!!cur.tutorial,tabs,gate:!g('evGate').hidden,txt:g('evGateTxt').textContent,t1,t2:g('sTimeV').textContent,done:g('doneBtn').hidden,start:Object.keys(localStorage).some(k=>k.startsWith('euclidia2-evstart-'))}; });
 res(pre.tut&&pre.tabs.join()==='Tutorial'&&pre.gate,`Antes de empezar: está en el Tutorial, el menú solo muestra ${pre.tabs.join(', ')} y se ve el aviso «${pre.txt}»`);
 res(pre.t1==='30:00'&&pre.t2==='30:00'&&!pre.start&&pre.done,`El reloj no corre mientras hace el Tutorial (${pre.t1} → ${pre.t2} tras 2 s) y aún no puede terminar`);
 const s=await p1.evaluate(async()=>{ const g=id=>document.getElementById(id); const b=g('evGo'); b.click(); const once=!!(window.__euclidia.LEVELS[window.__euclidia.state().idx].tutorial); b.click(); await new Promise(r=>setTimeout(r,1300));
   if(!once) return {once};
   const U=window.__euclidia, L=U.LEVELS, cur=L[U.state().idx];
   const tabs=[...document.querySelectorAll('.wt')].map(t=>t.textContent.replace(/\s+\S+$/,'').trim()), lv=[...document.querySelectorAll('.lv')].length;
   const ids=U.t.sessionFor(U.t.parseEv(new URLSearchParams(location.search).get('ev')),'777'), poss=ids.reduce((a,id)=>a+L.find(l=>l.id===id).coins.length,0);
   const rows=[...document.querySelectorAll('.chain .cn')].map(x=>x.textContent).join(','), firstDiff=cur.diff;
   return {once,rows,firstDiff,gate:g('evGate').hidden,tabs,cur:cur.id,first:ids[0],coins:g('sCoins').textContent,poss,time:g('sTime').hidden?null:g('sTimeV').textContent}; });
 res(s.once&&s.gate,'«Empezar el quiz» pide un segundo toque y luego el aviso desaparece');
 res(s.tabs.join()==='Tutorial,Circunferencias,Parábolas',`El menú solo muestra el Tutorial y los mundos de la evaluación: ${s.tabs.join(', ')}`);
 res(s.cur===s.first&&s.firstDiff==='fácil',`Empieza en su primer nivel de la evaluación (${s.cur}, ${s.firstDiff})`);
 res(s.rows==='Fácil,Medio,Difícil',`El menú de cada mundo agrupa sus niveles por dificultad: ${s.rows}`);
 res(s.coins==='0 / '+s.poss,`Monedas posibles = las de sus 6 niveles: ${s.coins}`);
 res(/^29:5\d$/.test(s.time),`Al empezar el quiz el reloj corre: ${s.time}`);
 // 4. Al acabarse el tiempo se envía el resultado y ya no se juega
 const t=await p1.evaluate(async()=>{ const U=window.__euclidia, st=U.state(), k=Object.keys(localStorage).find(x=>x.startsWith('euclidia2-evstart-'));
   const best={}; U.LEVELS.forEach(l=>{ if(l.id==='C1'||l.id==='P1') best[l.id]=l.coins.length; }); Object.assign(st.prog.best,best);
   localStorage.setItem(k,JSON.stringify(Date.now()-30*60000+1500)); await new Promise(r=>setTimeout(r,3200));
   const qd=JSON.parse(localStorage.getItem('euclidia2-queue')||'[]'), last=qd[qd.length-1];
   const g=id=>document.getElementById(id); const modal=!g('done').hidden&&g('doneTitle').textContent;
   U.submit(['x^2+y^2=1']); await new Promise(r=>setTimeout(r,100));
   return {modal,last,fb:g('fb').innerText,doneBtn:g('doneBtn').hidden,time:g('sTimeV').textContent}; });
 res(t.modal==='Se acabó el tiempo','Al llegar a 0:00 aparece «'+t.modal+'»');
 res(t.last&&t.last.nivel==='Se acabó el tiempo'&&t.last.evaluacion==='Quiz 1'&&t.last.documento==='777',`Fila final en la cola de envío: ${t.last&&[t.last.nivel,t.last.evaluacion,t.last.monedasTotales+'/'+t.last.monedasPosibles,'nota '+t.last.nota].join(' · ')}`);
 res(/ya terminó/.test(t.fb)&&t.doneBtn,'Después ya no se puede trazar ni volver a enviar');
 // 5. Sin evaluación todo queda como antes (práctica libre con todo el banco)
 const p2=await page(null,'?rol=estudiante');
 const f=await p2.evaluate(async()=>{ const g=id=>document.getElementById(id); g('rName').value='Luis'; g('rLast').value='Gil'; g('rDoc').value='1'; g('regForm').requestSubmit(); await new Promise(r=>setTimeout(r,200));
   return {coins:g('sCoins').textContent,tabs:document.querySelectorAll('.wt').length,time:g('sTime').hidden}; });
 res(f.coins==='0 / 154'&&f.tabs===7&&f.time,`Sin evaluación: ${f.coins} monedas posibles, ${f.tabs} mundos y sin reloj`);
 // 6. En el celular la casilla que se escribe flota debajo del mapa al bajar al teclado, y vuelve a su lugar al subir
 const p3=await page(()=>{ localStorage.setItem('euclidia2-role','"profesor"'); sessionStorage.setItem('euclidia2-tab','1'); });
 const fl=await p3.evaluate(async()=>{ const U=window.__euclidia, i=U.LEVELS.findIndex(l=>l.mixed); U.loadLevel(i); await new Promise(r=>setTimeout(r,300));
   const eq=document.getElementById('eq1'); eq.dispatchEvent(new FocusEvent('focusin',{bubbles:true})); eq.focus(); await new Promise(r=>setTimeout(r,900));
   const pad=document.getElementById('pad'); window.scrollTo(0,pad.getBoundingClientRect().top+scrollY-300); await new Promise(r=>setTimeout(r,300));
   const f=document.querySelector('.floating'), st=document.getElementById('stage').getBoundingClientRect(), fr=f&&f.getBoundingClientRect();
   const res={f:!!f&&f.contains(eq),top:fr&&Math.round(fr.top),stage:Math.round(st.bottom),inView:fr&&fr.bottom<innerHeight};
   window.scrollTo(0,0); await new Promise(r=>setTimeout(r,300)); res.back=!document.querySelector('.floating'); return res; });
 res(fl.f&&fl.top===fl.stage&&fl.inView&&fl.back,`Celular: al bajar al teclado, la casilla del tramo 2 queda flotando justo debajo del mapa (y=${fl.top}) y al subir vuelve a su lugar`);
 await b.close();
 console.log(out.join('\n')); console.log(`\nTotal: ${pass} pasan, ${fail} fallan.`+(errs.length?' Errores de la página: '+errs.join('; '):''));
 process.exitCode=fail||errs.length?1:0;
})();
