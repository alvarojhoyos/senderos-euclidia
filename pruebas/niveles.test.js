// Pruebas de los niveles: con la ecuación esperada Vector llega a la meta con todas las monedas,
// y con cada error típico del nivel no gana. Uso: node niveles.test.js [ruta/al/juego.html]
const {chromium,devices}=require('playwright'); const fs=require('fs'); const path=require('path');
const SRC=process.argv[2]||[path.join(__dirname,'..','senderos-euclidia.html'),path.join(__dirname,'..','index.html')].find(f=>fs.existsSync(f));
const TMP=path.join(require('os').tmpdir(),'euclidia-niveles.html');
fs.writeFileSync(TMP,'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(SRC,'utf8')+'</body></html>');
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({...devices['Pixel 7'],deviceScaleFactor:1});
 const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.route(/^https?:\/\//,r=>r.abort());
 await p.addInitScript(()=>{ localStorage.setItem('euclidia2-role','"profesor"'); sessionStorage.setItem('euclidia2-tab','1'); });
 await p.goto('file://'+TMP); await p.waitForTimeout(500);
 const E=(f,a)=>p.evaluate(f,a);
 const play=async(i,sol)=>{ await E(i=>window.__euclidia.loadLevel(i),i); await E(a=>window.__euclidia.submit(a),sol); await p.waitForTimeout(30);
   await p.waitForFunction(()=>!window.__euclidia.state().g2.anim,null,{timeout:30000});
   return E(()=>{ const s=window.__euclidia.state().g2, r=s.result; return {win:!document.getElementById('win').hidden, coins:r?r.coinAt.filter(v=>v>=0).length:0, steps:s.path.length, fb:document.getElementById('fb').innerText.replace(/\n/g,' · ').slice(0,150)}; }); };
 const levels=await E(()=>window.__euclidia.LEVELS.map(l=>({id:l.id,title:l.title,type:l.type,coins:l.coins.length,answer:l.answer,errors:l.errors||[]})));
 let pass=0, fail=0; const out=[];
 const res=(ok,txt)=>{ ok?pass++:fail++; out.push((ok?'PASA ':'FALLA')+' | '+txt); };
 for(let i=0;i<levels.length;i++){ const L=levels[i];
   if(!L.answer){ res(false,`${L.title}: el nivel no tiene respuesta esperada`); continue; }
   const r=await play(i,L.answer);
   res(r.win&&r.coins===L.coins,`${L.title} (${L.type}) | esperada ${L.answer.map(a=>a.join(' con ')).join(' y ')} | ${r.win?'gana':'no gana'}, ${r.coins} de ${L.coins} monedas, ${r.steps} pasos | ${r.fb}`);
   for(const e of L.errors){ const r2=await play(i,e.eq); res(!r2.win,`${L.title} | error «${e.why}»: ${e.eq.map(a=>a.join(' con ')).join(' y ')} | ${r2.win?'GANA (no debería)':'no gana'} | ${r2.fb}`); }
 }
 // Rescate: la vuelta debe cerrarse (el último paso vuelve a la salida)
 const ri=levels.findIndex(l=>l.type==='rescate');
 if(ri>=0){ await play(ri,levels[ri].answer); const v=await E(()=>{ const s=window.__euclidia.state().g2, L=window.__euclidia.LEVELS[window.__euclidia.state().idx??0]; const P=s.path, a=P[0], z=P[P.length-1]; let len=0; for(let k=1;k<P.length;k++) len+=Math.hypot(P[k].x-P[k-1].x,P[k].y-P[k-1].y); return {len, gap:Math.hypot(a.x-z.x,a.y-z.y)}; });
   res(v.len>2*Math.PI*3*0.9&&v.gap<0.3,`Rescate: Vector recorre ${v.len.toFixed(2)} (circunferencia completa ≈ ${(2*Math.PI*3).toFixed(2)}) y termina a ${v.gap.toFixed(2)} de la salida`); }
 // Pistas: 3 gratis y después cuestan 2 monedas (con confirmación)
 const h=await E(async()=>{ const U=window.__euclidia; localStorage.removeItem('euclidia2-prog'); const st=U.state(); st.prog.best={c1:2,c2:3}; st.prog.hintsUsed=0; st.prog.hintsBought=0; st.prog.shown={};
   U.loadLevel(1); const b=document.getElementById('hintBtn'), sc=()=>document.getElementById('sCoins').textContent, log=[];
   b.click(); b.click(); log.push(b.textContent); U.loadLevel(2); b.click(); log.push(b.textContent); const before=sc(); b.click(); log.push(b.textContent+' | '+sc()); b.click(); log.push(b.textContent+' | '+sc());
   return {log,before,after:sc(),bought:st.prog.hintsBought,used:st.prog.hintsUsed}; });
 res(h.used===3&&h.bought===1&&h.before.startsWith('5 ')&&h.after.startsWith('3 '),`Pistas: 3 gratis, la cuarta pide confirmar y cuesta 2 monedas | monedas ${h.before} → ${h.after} | ${h.log.join(' / ')}`);
 await b.close();
 console.log(out.join('\n')); console.log(`\nTotal: ${pass} pasan, ${fail} fallan.`+(errs.length?' Errores de la página: '+errs.join('; '):''));
 process.exitCode=fail||errs.length?1:0;
})();
