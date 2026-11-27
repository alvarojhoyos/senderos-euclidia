// Pruebas del Taller de Coni (modo estudio): la curva dibujada, la ecuación mostrada, la forma general y las
// partes (focos, vértices, directriz, asíntotas) coinciden entre sí. También se revisa la pantalla en un celular.
// Uso: node pruebas/taller.test.js [ruta/al/juego.html]
const {chromium,devices}=require('playwright'); const fs=require('fs'); const path=require('path');
const SRC=process.argv[2]||path.join(__dirname,'..','index.html');
const TMP=path.join(require('os').tmpdir(),'euclidia-taller.html');
fs.writeFileSync(TMP,'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(SRC,'utf8')+'</body></html>');
const out=[]; let pass=0, fail=0; const res=(ok,txt)=>{ ok?pass++:fail++; out.push((ok?'PASA ':'FALLA')+' | '+txt); };
(async()=>{
 const b=await chromium.launch(); const errs=[];
 const ctx=await b.newContext({...devices['iPhone SE'],deviceScaleFactor:1}); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
 await p.route(/^https?:\/\//,r=>r.abort());
 await p.goto('file://'+TMP+'?modo=taller'); await p.waitForTimeout(600);
 res(await p.evaluate(()=>!document.getElementById('taller').hidden&&document.getElementById('intro').hidden),'?modo=taller abre el Taller de una vez (sin la historia ni el registro encima)');
 // 1. Matemática: para muchos casos al azar, todo lo que muestra el taller es la misma cónica
 const m=await p.evaluate(()=>{ const T=window.__euclidia.taller, t=window.__euclidia.t, bad=[]; let n=0;
   const R=(a,b,st)=>a+st*Math.floor(Math.random()*((b-a)/st+1)), plain=s=>s.replace(/−/g,'-').replace(/²/g,'^2').replace(/·/g,'*');
   const dirs=['arriba','abajo','derecha','izquierda'];
   for(let i=0;i<400;i++){ const c=['circ','elip','para','hip'][i%4], st={c,h:R(-6,6,0.5),k:R(-6,6,0.5)};
     if(c==='circ') st.r=R(0.5,7,0.5); if(c==='elip'||c==='hip'){ st.a=R(0.5,6,0.5); st.b=R(0.5,6,0.5); } if(c==='para'){ st.p=R(0.25,4,0.25); st.dir=dirs[i%16>>2]; } if(c==='hip') st.hz=i%8<4;
     T.set(st); const M=T.model(), tag=JSON.stringify(st);
     const E=t.compileEq(plain(M.eq)), G=t.compileEq(plain(T.general(M.gen)).replace(/(\d)([xy])/g,'$1*$2'));
     const F=(x,y)=>E.F(x,y), sc=Math.max(1,...M.gen.map(Math.abs));
     // la curva dibujada cumple la ecuación canónica y la general
     for(const br of M.curve) for(const [x,y] of br.filter((_,j)=>j%7===0)){ n++; const f=F(x,y), g=G.F(x,y);
       if(Math.abs(f)>1e-6*(1+Math.abs(x*x)+Math.abs(y*y))) { bad.push(tag+' curva fuera de la ecuación en '+x+','+y+' F='+f); break; }
       if(Math.abs(g)>1e-6*sc*(1+x*x+y*y)*400) { bad.push(tag+' forma general distinta'); break; } }
     if(M.eq2){ const E2=t.compileEq(plain(M.eq2)); const [x,y]=M.curve[0][40]; if(Math.abs(E2.F(x,y))>1e-6*(1+x*x+y*y)) bad.push(tag+' segunda forma distinta'); }
     // la ecuación canónica no tiene problemas de forma
     if(t.canonicalProblem(E)||t.formProblem(E)) bad.push(tag+' la ecuación del taller no está en forma canónica: '+M.eq);
     // propiedades de los focos
     const pt=M.parts.reduce((o,q)=>(o[q.key]=q,o),{}), D=(u,v)=>Math.hypot(u[0]-v[0],u[1]-v[1]);
     if(c==='elip'&&Math.abs(st.a-st.b)>1e-9){ const Fs=pt.focos.draw.map(d=>d.at), M2=2*Math.max(st.a,st.b);
       for(const q of M.curve[0].filter((_,j)=>j%10===0)){ if(Math.abs(D(q,Fs[0])+D(q,Fs[1])-M2)>1e-6){ bad.push(tag+' suma a los focos ≠ eje mayor'); break; } } }
     if(c==='hip'){ const Fs=pt.focos.draw.map(d=>d.at); for(const br of M.curve) for(const q of br.filter((_,j)=>j%10===0)){ if(Math.abs(Math.abs(D(q,Fs[0])-D(q,Fs[1]))-2*st.a)>1e-6){ bad.push(tag+' diferencia a los focos ≠ 2a'); break; } }
       const s=classify=t.classify(E.F); if(s.type!=='hipérbola'||s.horiz!==st.hz) bad.push(tag+' orientación de la hipérbola'); }
     if(c==='para'){ const Fc=pt.foco.draw[0].at, d=pt.directriz.draw[0];
       for(const q of M.curve[0].filter((_,j)=>j%10===0)){ const dd=d.y!=null?Math.abs(q[1]-d.y):Math.abs(q[0]-d.x); if(Math.abs(D(q,Fc)-dd)>1e-6){ bad.push(tag+' foco y directriz no equidistan'); break; } }
       const s=t.classify(E.F), up=st.dir==='arriba'||st.dir==='derecha'; if(s.type!=='parábola'||s.vert!==(st.dir==='arriba'||st.dir==='abajo')||(s.p>0)!==up) bad.push(tag+' orientación de la parábola'); }
     if(c==='elip'){ const s=t.classify(E.F); if(s.type!==(st.a===st.b?'circunferencia':'elipse')) bad.push(tag+' tipo de elipse'); }
   } return {n,bad:bad.slice(0,8),nb:bad.length}; });
 res(m.nb===0,`400 cónicas al azar: la curva dibujada (${m.n} puntos), la ecuación canónica, la forma general y los focos/directriz coinciden`+(m.nb?' → '+m.bad.join(' | '):''));
 // 2. Escribir una ecuación pone el taller en esa cónica
 const w=await p.evaluate(()=>{ const T=window.__euclidia.taller, r={}, tin=document.getElementById('tIn');
   const put=v=>{ if(tin.tagName==='MATH-FIELD') tin.value=v; else tin.value=v; document.getElementById('tTry').click(); return {s:{...T.state()},msg:document.getElementById('tMsg').textContent}; };
   r.h=put('(y+1)^2/4-(x-2)^2/9=1'); r.e=put('4x^2+9y^2-16x+18y-11=0'); r.p=put('(y-2)^2=-8(x+1)'); r.x=put('x*y=1'); return r; });
 res(w.h.s.c==='hip'&&!w.h.s.hz&&w.h.s.a===2&&w.h.s.b===3&&w.h.s.h===2&&w.h.s.k===-1,'Una hipérbola vertical escrita por el estudiante queda con a = 2 (bajo y), b = 3 y centro (2, −1)');
 res(w.e.s.c==='elip'&&w.e.s.a===3&&w.e.s.b===2&&/forma canónica/.test(w.e.msg),'Una elipse en forma general se reconoce y el taller avisa que falta la forma canónica');
 res(w.p.s.c==='para'&&w.p.s.dir==='izquierda'&&w.p.s.p===2&&w.p.s.h===-1&&w.p.s.k===2,'(y − 2)² = −8(x + 1) abre a la izquierda con p = 2 y vértice (−1, 2)');
 res(/girada|término x·y/.test(w.x.msg),'x·y = 1 se rechaza explicando que la cónica está girada');
 // 3. Retos de Apolonio: se cumplen con los controles
 const rt=await p.evaluate(()=>{ const T=window.__euclidia.taller; T.set({c:'elip',h:0,k:0,a:4,b:2}); Math.random=()=>0; document.getElementById('tReto').click(); const a=document.getElementById('tSay').textContent;
   T.set({c:'elip',h:0,k:0,a:3,b:3}); return [a,document.getElementById('tSay').textContent]; });
 res(/^Reto:/.test(rt[0])&&/circunferencia/.test(rt[1]),'Apolonio da un reto y lo celebra cuando se cumple (a = b → circunferencia)');
 // 4. Celular: nada se sale de la pantalla, botones cómodos para el dedo
 const lay=await p.evaluate(()=>{ const tl=document.getElementById('taller'); const small=[...tl.querySelectorAll('button')].filter(x=>x.offsetParent&&x.getBoundingClientRect().height<36&&!x.classList.contains('linkbtn')).length;
   return {sw:tl.scrollWidth,vw:innerWidth,small,stage:document.querySelector('.t-stage').getBoundingClientRect().height}; });
 res(lay.sw<=lay.vw&&lay.small===0&&lay.stage>150,`En un celular (${lay.vw} px) no hay desplazamiento lateral, los botones miden 36 px o más y el mapa se ve (${Math.round(lay.stage)} px de alto)`);
 // 5. Cerrar el taller deja seguir al juego; en una evaluación el taller no se puede abrir
 await p.click('#tClose'); res(await p.evaluate(()=>document.getElementById('taller').hidden&&!document.getElementById('intro').hidden),'Al cerrar el taller sigue el juego (aparece la historia la primera vez)');
 await p.evaluate(()=>{ localStorage.clear(); localStorage.setItem('euclidia2-intro','true'); localStorage.setItem('euclidia2-role','"estudiante"'); localStorage.setItem('euclidia2-player',JSON.stringify({nombre:'Ana',apellido:'Ruiz',documento:'123'})); sessionStorage.setItem('euclidia2-tab','1'); });
 await p.goto('file://'+TMP+'?modo=taller&ev=prueba1-C111-30&evn=Quiz'); await p.waitForTimeout(600);
 const q=await p.evaluate(()=>({open:!document.getElementById('taller').hidden,btn:document.getElementById('tallerBtn').hidden}));
 res(!q.open&&q.btn,'Durante una evaluación el taller no se abre y su botón no aparece');
 res(errs.length===0,'Sin errores en la página'+(errs.length?': '+errs.join(' | '):''));
 await b.close(); out.push(`\n${pass} pasan, ${fail} fallan`); console.log(out.join('\n')); fs.writeFileSync(path.join(__dirname,'salida-taller.txt'),out.join('\n')+'\n'); process.exit(fail?1:0);
})();
