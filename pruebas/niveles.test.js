// Pruebas de los niveles: con la ecuación esperada Vector llega a la meta con todas las monedas,
// y con cada error típico del nivel no gana, no recoge monedas y muestra su mensaje. En los mixtos, un error
// del tramo 2 puede pasar por las monedas del tramo 1, pero no cuentan porque el nivel no se gana. Uso: node niveles.test.js [ruta/al/juego.html]
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
   return E(()=>{ const s=window.__euclidia.state().g2, r=s.result; return {win:!document.getElementById('win').hidden, coins:r?r.coinAt.filter(v=>v>=0).length:0, steps:s.path.length, fb:document.getElementById('fb').innerText.replace(/\n/g,' · ').slice(0,150), fbFull:document.getElementById('fb').innerText}; }); };
 const levels=await E(()=>window.__euclidia.LEVELS.map(l=>({id:l.id,title:l.title,type:l.type,coins:l.coins.length,answer:l.answer,errors:l.errors||[],mixed:!!l.mixed})));
 let pass=0, fail=0; const out=[];
 const res=(ok,txt)=>{ ok?pass++:fail++; out.push((ok?'PASA ':'FALLA')+' | '+txt); };
 for(let i=0;i<levels.length;i++){ const L=levels[i];
   if(!L.answer){ res(false,`${L.title}: el nivel no tiene respuesta esperada`); continue; }
   const r=await play(i,L.answer);
   res(r.win&&r.coins===L.coins,`${L.title} (${L.type}) | esperada ${L.answer.map(a=>a.join(' con ')).join(' y ')} | ${r.win?'gana':'no gana'}, ${r.coins} de ${L.coins} monedas, ${r.steps} pasos | ${r.fb}`);
   for(const e of L.errors){ const r2=await play(i,e.eq); const msgOk=!e.msg||r2.fbFull.includes(e.msg);
     res(!r2.win&&(r2.coins===0||levels[i].mixed)&&msgOk,`${L.title} | error «${e.why}»: ${e.eq.map(a=>a.join(' con ')).join(' y ')} | ${r2.win?'GANA (no debería)':'no gana'}, ${r2.coins} monedas | ${msgOk?'muestra su mensaje':'NO muestra su mensaje'} | ${r2.fb}`); }
 }
 // Rescate: en cada nivel de Rescate la vuelta se cierra (el último paso vuelve a la salida)
 for(let ri=0;ri<levels.length;ri++){ if(levels[ri].type!=='rescate') continue; await play(ri,levels[ri].answer);
   const v=await E(()=>{ const U=window.__euclidia, s=U.state().g2, P=s.path, a=P[0], z=P[P.length-1]; let len=0; for(let k=1;k<P.length;k++) len+=Math.hypot(P[k].x-P[k-1].x,P[k].y-P[k-1].y);
     const c=U.t.classify(U.t.compileEq(U.LEVELS[U.state().idx].targets[0]).F); const a2=c.r||c.a, b2=c.r||c.b; const per=Math.PI*(3*(a2+b2)-Math.sqrt((3*a2+b2)*(a2+3*b2)));
     return {len, per, gap:Math.hypot(a.x-z.x,a.y-z.y)}; });
   res(v.len>v.per*0.95&&v.gap<0.3,`${levels[ri].title}: Vector recorre ${v.len.toFixed(2)} (vuelta completa ≈ ${v.per.toFixed(2)}) y termina a ${v.gap.toFixed(2)} de la salida`); }
 // Lecciones del tutorial: cada parte dibujada en el mapa coincide con la ecuación de la práctica
 // (classify da a y b como las raíces de los denominadores de x y de y)
 const partes=await E(()=>{ const U=window.__euclidia, T=U.t, out=[];
   U.LEVELS.forEach(L=>{ if(!L.parts) return; const F=T.compileEq(L.targets[0]).F, c=T.classify(F), near=(u,v)=>Math.abs(u-v)<0.01, onC=q=>T.dist2(F,q)<0.01;
     const ctr=[c.h,c.k];
     // foco y distancia focal según la cónica
     let focos=[], pp=null;
     if(c.type==='elipse'){ const big=c.a>=c.b, f=Math.sqrt(Math.abs(c.a*c.a-c.b*c.b)); focos=big?[[c.h-f,c.k],[c.h+f,c.k]]:[[c.h,c.k-f],[c.h,c.k+f]]; }
     if(c.type==='hipérbola'){ const f=Math.hypot(c.a,c.b); focos=c.horiz?[[c.h-f,c.k],[c.h+f,c.k]]:[[c.h,c.k-f],[c.h,c.k+f]]; }
     if(c.type==='parábola'){ pp=1/(4*c.p); focos=[c.vert?[c.h,c.k+pp]:[c.h+pp,c.k]]; }
     L.parts.forEach(p=>{ let ok=true, det='';
       const len=p.a&&p.b?Math.hypot(p.b[0]-p.a[0],p.b[1]-p.a[1]):null;
       if(p.r==='centro'){ ok=near(p.at[0],c.h)&&near(p.at[1],c.k); det=`centro (${c.h}, ${c.k})`; }
       else if(p.r==='vértice'){ ok=onC(p.at)&&(c.type!=='parábola'||(near(p.at[0],c.h)&&near(p.at[1],c.k))); det='sobre la curva'; }
       else if(p.r==='foco'){ ok=focos.some(f=>Math.hypot(f[0]-p.at[0],f[1]-p.at[1])<0.01); det='focos '+focos.map(f=>`(${f[0].toFixed(3)}, ${f[1].toFixed(3)})`).join(' y '); }
       else if(p.r==='radio'){ ok=near(p.a[0],c.h)&&near(p.a[1],c.k)&&onC(p.b)&&near(len,c.r); det=`r = ${c.r}, flecha ${len.toFixed(3)}`; }
       else if(p.r==='semieje'){ const vert=Math.abs(p.b[0]-p.a[0])<1e-9; ok=near(p.a[0],c.h)&&near(p.a[1],c.k)&&near(len,vert?c.b:c.a); det=`flecha ${len.toFixed(3)}, a = ${c.a}, b = ${c.b}`; }
       else if(p.r==='p'){ ok=near(len,Math.abs(pp)); det=`p = ${pp}`; }
       else if(p.r==='directriz'){ ok=c.vert?(p.y!=null&&near(p.y,c.k-pp)):(p.x!=null&&near(p.x,c.h-pp)); det=`directriz ${c.vert?'y':'x'} = ${c.vert?c.k-pp:c.h-pp}`; }
       else if(p.r==='asíntota'){ const m=c.b/c.a; ok=near(p.at[0],c.h)&&near(p.at[1],c.k)&&near(Math.abs(p.m),m); det=`pendiente ±${m.toFixed(3)}`; }
       else if(p.r==='rect'){ const dx=c.a, dy=c.b; ok=near(Math.abs(p.b[0]-p.a[0])/2,dx)&&near(Math.abs(p.b[1]-p.a[1])/2,dy)&&near((p.a[0]+p.b[0])/2,c.h)&&near((p.a[1]+p.b[1])/2,c.k); det=`rectángulo ${2*dx} × ${2*dy}`; }
       out.push({ok, txt:`${L.title} | ${p.r}${p.txt?' «'+p.txt+'»':''} | ${det}`}); }); });
   return out; });
 partes.forEach(q=>res(q.ok,'Parte dibujada: '+q.txt));
 // Pistas: 3 gratis y después cuestan 2 monedas (con confirmación)
 const h=await E(async()=>{ const U=window.__euclidia; localStorage.removeItem('euclidia2-prog'); const st=U.state(); const [i1,i2]=U.LEVELS.map((l,i)=>l.tutorial?-1:i).filter(i=>i>=0); st.prog.best={[U.LEVELS[i1].id]:2,[U.LEVELS[i2].id]:3}; st.prog.hintsUsed=0; st.prog.hintsBought=0; st.prog.shown={};
   U.loadLevel(i1); const b=document.getElementById('hintBtn'), sc=()=>document.getElementById('sCoins').textContent, log=[];
   b.click(); b.click(); log.push(b.textContent); U.loadLevel(i2); b.click(); log.push(b.textContent); const before=sc(); b.click(); log.push(b.textContent+' | '+sc()); b.click(); log.push(b.textContent+' | '+sc());
   return {log,before,after:sc(),bought:st.prog.hintsBought,used:st.prog.hintsUsed}; });
 res(h.used===3&&h.bought===1&&h.before.startsWith('5 ')&&h.after.startsWith('3 '),`Pistas: 3 gratis, la cuarta pide confirmar y cuesta 2 monedas | monedas ${h.before} → ${h.after} | ${h.log.join(' / ')}`);
 await b.close();
 console.log(out.join('\n')); console.log(`\nTotal: ${pass} pasan, ${fail} fallan.`+(errs.length?' Errores de la página: '+errs.join('; '):''));
 process.exitCode=fail||errs.length?1:0;
})();
