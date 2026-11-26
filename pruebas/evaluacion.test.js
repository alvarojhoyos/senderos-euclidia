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
   await p.route(/^https?:\/\//,r=>r.abort()); if(init) await p.addInitScript(init); await p.goto('file://'+TMP+query); await p.waitForTimeout(400); return p; };
 // 1. Reparto de niveles
 const p0=await page(()=>{ localStorage.setItem('euclidia2-role','"profesor"'); sessionStorage.setItem('euclidia2-tab','1'); });
 const r=await p0.evaluate(()=>{ const U=window.__euclidia, T=U.t, L=U.LEVELS, byId=Object.fromEntries(L.map(l=>[l.id,l]));
   const larga=T.parseEv('abc123-CEPHIX-l-60'), corta=T.parseEv('abc123-CEPHIX-c-20');
   const s1=T.sessionFor(larga,'1001'), s1b=T.sessionFor(larga,' 1001 '), s2=T.sessionFor(corta,'1001');
   const docs=Array.from({length:40},(_,i)=>String(5000+i)), sets=new Set(docs.map(d=>T.sessionFor(larga,d).join())), coins=docs.map(d=>T.sessionFor(larga,d).reduce((s,id)=>s+byId[id].coins.length,0));
   const ordered=ss=>{ const g={}; ss.forEach(id=>{ const l=byId[id]; (g[l.chain]=g[l.chain]||[]).push(l.step); }); return Object.values(g).every(st=>st.every((v,i)=>i===0||v>st[i-1])); };
   const oneChain=ss=>{ const w={}; ss.forEach(id=>{ const l=byId[id]; (w[l.world]=w[l.world]||new Set()).add(l.chain); }); return Object.values(w).every(c=>c.size===1)&&Object.keys(w).length; };
   const shortSteps=s2.map(id=>byId[id]).filter(l=>!['Identificar','Mixtos'].includes(l.world)).map(l=>l.step);
   return {n1:s1.length,n2:s2.length,c1:T.evCount(larga),c2:T.evCount(corta),same:s1.join()===s1b.join(),distintos:sets.size,ord:ordered(s1)&&ordered(s2),mundos:oneChain(s1),
     corta:shortSteps.join(','),coinsMin:Math.min(...coins),coinsMax:Math.max(...coins),mal:T.parseEv('abc-ZZ-l-60'),evOk:T.parseEv('k3f9a2-CH-c-0')}; });
 res(r.n1===20&&r.c1===20,`Larga con los 6 mundos: ${r.n1} niveles (el panel anuncia ${r.c1})`);
 res(r.n2===16&&r.c2===16,`Corta con los 6 mundos: ${r.n2} niveles (el panel anuncia ${r.c2})`);
 res(r.same,'El mismo documento recibe siempre los mismos niveles (espacios aparte)');
 res(r.distintos>=20,`40 documentos reciben ${r.distintos} combinaciones distintas de cadenas`);
 res(r.ord&&r.mundos===6,'Una sola cadena por mundo y sus niveles en orden');
 res(r.corta==='1,2,4,1,2,4,1,2,4,1,2,4',`Corta: pasos ${r.corta} de cada cónica (fácil, medio y el Escape o reto)`);
 res(r.coinsMin>0,`Monedas posibles por estudiante en la larga: entre ${r.coinsMin} y ${r.coinsMax}; la nota se escala a 5,0 con las de cada uno`);
 res(r.mal===null&&r.evOk&&r.evOk.min===0&&r.evOk.worlds.join()==='C,H','Códigos de evaluación válidos e inválidos');
 // 2. El profesor crea la evaluación y el QR la lleva
 const q=await p0.evaluate(async()=>{ document.getElementById('teacherBtn').click(); await new Promise(r=>setTimeout(r,100));
   document.querySelectorAll('#evWorlds input').forEach(i=>i.checked=['C','P'].includes(i.value)); document.querySelector('#evLen [data-l="c"]').click();
   document.getElementById('evMin').value='30'; document.getElementById('evName').value='Quiz 1'; document.getElementById('evWorlds').dispatchEvent(new Event('change'));
   const sum=document.getElementById('evSum').textContent; document.getElementById('evMake').click(); await new Promise(r=>setTimeout(r,100));
   const u=new URL(document.getElementById('qrUrl').textContent); return {sum,ev:u.searchParams.get('ev'),evn:u.searchParams.get('evn'),rol:u.searchParams.get('rol'),state:document.getElementById('evState').textContent}; });
 res(/^[a-z0-9]{6}-CP-c-30$/.test(q.ev)&&q.evn==='Quiz 1'&&q.rol==='estudiante',`Enlace del QR: rol=${q.rol}, ev=${q.ev}, evn=${q.evn}`);
 res(/6 niveles y 30 minutos/.test(q.sum),'Resumen del panel: '+q.sum);
 // 3. Un estudiante entra con el enlace de la evaluación
 const ev=q.ev, qs=`?rol=estudiante&ev=${ev}&evn=Quiz%201`;
 const p1=await page(null,qs);
 const s=await p1.evaluate(async()=>{ const g=id=>document.getElementById(id); g('rName').value='Ana'; g('rLast').value='Pérez'; g('rDoc').value='777'; g('regForm').requestSubmit(); await new Promise(r=>setTimeout(r,300));
   const U=window.__euclidia, L=U.LEVELS, cur=L[U.state().idx];
   const tabs=[...document.querySelectorAll('.wt')].map(t=>t.textContent.replace(/\s+\S+$/,'').trim()), lv=[...document.querySelectorAll('.lv')].length;
   const ids=U.t.sessionFor(U.t.parseEv(new URLSearchParams(location.search).get('ev')),'777'), poss=ids.reduce((a,id)=>a+L.find(l=>l.id===id).coins.length,0);
   return {tabs,cur:cur.id,first:ids[0],coins:g('sCoins').textContent,poss,time:g('sTime').hidden?null:g('sTimeV').textContent}; });
 res(s.tabs.join()==='Tutorial,Circunferencias,Parábolas',`El menú solo muestra el Tutorial y los mundos de la evaluación: ${s.tabs.join(', ')}`);
 res(s.cur===s.first,`Empieza en su primer nivel de la evaluación (${s.cur})`);
 res(s.coins==='0 / '+s.poss,`Monedas posibles = las de sus 6 niveles: ${s.coins}`);
 res(/^(30:00|29:5\d)$/.test(s.time),`Reloj en marcha: ${s.time}`);
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
 await b.close();
 console.log(out.join('\n')); console.log(`\nTotal: ${pass} pasan, ${fail} fallan.`+(errs.length?' Errores de la página: '+errs.join('; '):''));
 process.exitCode=fail||errs.length?1:0;
})();
