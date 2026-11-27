// Pruebas de la práctica sin fin del Taller (etapa 2 del modo estudio): cada ejercicio al azar es coherente
// (los datos que se dan son de la misma cónica que la respuesta), la respuesta esperada se acepta, los errores típicos
// se rechazan con una explicación matemática que no da la respuesta, y el conteo queda solo en el aparato.
// Uso: node pruebas/practica.test.js [ruta/al/juego.html]
const {chromium,devices}=require('playwright'); const fs=require('fs'); const path=require('path');
const SRC=process.argv[2]||path.join(__dirname,'..','index.html');
const TMP=path.join(require('os').tmpdir(),'euclidia-practica.html');
fs.writeFileSync(TMP,'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(SRC,'utf8')+'</body></html>');
const out=[]; let pass=0, fail=0; const clk=async(p,sel)=>{ await p.evaluate(s=>document.querySelector(s).scrollIntoView({block:'center'}),sel); await p.waitForTimeout(80); await p.$eval(sel,e=>e.click()); };
const res=(ok,txt)=>{ ok?pass++:fail++; out.push((ok?'PASA ':'FALLA')+' | '+txt); };
(async()=>{
 const b=await chromium.launch(); const errs=[], net=[];
 const ctx=await b.newContext({...devices['iPhone SE'],deviceScaleFactor:1}); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
 await p.route(/^https?:\/\//,r=>{ net.push(r.request().url()); r.abort(); });
 await p.goto('file://'+TMP+'?modo=practica'); await p.waitForTimeout(700);
 res(await p.evaluate(()=>!document.getElementById('taller').hidden&&!document.getElementById('tPrac').hidden&&document.getElementById('tSide').hidden),'?modo=practica abre el Taller en la práctica');
 // 1. Matemática de los ejercicios
 const m=await p.evaluate(()=>{ const P=window.__euclidia.practica, T=window.__euclidia.t, bad=[], seen={}; let n=0;
   const plain=s=>s.replace(/−/g,'-').replace(/²/g,'^2').replace(/·/g,'*').replace(/(\d)([xy(])/g,'$1*$2');
   const near=(u,v)=>Math.abs(u-v)<1e-6*Math.max(1,Math.abs(v));
   const ansTxt=X=>X.kind==='num'?String(X.ans):X.kind==='point'?`(${X.ans[0]}, ${X.ans[1]})`:X.kind==='line'?(X.ans.x!=null?`x = ${X.ans.x}`:`y = ${X.ans.y}`):plain(P.model(X.st).eq);
   const fmt=v=>String(Math.round(v*1000)/1000).replace('-','−');
   const sameConic=(s,t)=>s.type===t.type&&near(s.h,t.h)&&near(s.k,t.k)&&(t.type==='circunferencia'?near(s.r,t.r):t.type==='parábola'?s.vert===t.vert&&near(s.p,t.p):near(s.a,t.a)&&near(s.b,t.b)&&(t.type!=='hipérbola'||s.horiz===t.horiz));
   for(const c of ['circ','elip','para','hip']) for(let bi=0;bi<4;bi++) for(let ai=0;ai<3;ai++){ let X0; try{ X0=P.gen(c,Math.random,bi,ai); }catch(e){ continue; } if(!X0.halla) continue;
     for(let i=0;i<50;i++){ const X=P.gen(c,Math.random,bi,ai), tag=X.tipo+' '+JSON.stringify(X.st); seen[X.tipo]=1; n++;
       const M=P.model(X.st), t=P.target(X.st), E=T.compileEq(plain(M.eq));
       if(!sameConic(T.classify(E.F),t)) { bad.push(tag+' la ecuación del modelo no es la cónica pedida'); continue; }
       // los datos dados pertenecen a la cónica
       const pts=[]; M.parts.forEach(q=>q.draw.forEach(d=>{ if(d.at) pts.push(d.at); if(d.a) pts.push(d.a); if(d.b) pts.push(d.b); }));
       for(const d of X.draw){ if(d.at&&d.r!=='asintota'){ const onCurve=Math.abs(E.F(...d.at))<1e-6*(1+d.at[0]**2+d.at[1]**2), isPart=pts.some(q=>near(q[0],d.at[0])&&near(q[1],d.at[1]));
           if(!onCurve&&!isPart) bad.push(tag+' el dato '+d.tag+' '+d.at+' no es parte de la cónica'); }
         if(d.r==='linea'){ const dir=M.parts.find(q=>q.key==='directriz').draw[0]; if(!(d.y!=null?near(d.y,dir.y):near(d.x,dir.x))) bad.push(tag+' la directriz dada no es la del modelo'); }
         if(d.r==='asintota'){ const as=M.parts.find(q=>q.key==='asintotas').draw.map(q=>q.m); if(!as.some(v=>near(v,d.m))) bad.push(tag+' la asíntota dada no es la del modelo'); } }
       for(const txt of X.dan){ const mm=txt.match(/^La ecuación (general )?(.*)$/); if(mm){ const G=T.compileEq(plain(mm[2])); if(!sameConic(T.classify(G.F),t)) bad.push(tag+' la ecuación dada no es la del ejercicio: '+mm[2]); } }
       // el texto de los datos coincide con lo que se dibuja
       X.draw.filter(d=>d.at&&d.tag).forEach(d=>{ const s='('+fmt(d.at[0])+', '+fmt(d.at[1])+')'; if(!X.dan.some(t=>t.includes(s))) bad.push(tag+' el punto '+s+' se dibuja pero no se dice'); });
       // la respuesta esperada se acepta
       const ok=P.check(X,ansTxt(X)); if(ok.res!=='ok') { bad.push(tag+' rechaza la respuesta correcta '+ansTxt(X)+': '+ok.msg); continue; }
       if(X.kind==='num'&&!Number.isInteger(X.ans)&&P.check(X,X.ans.toFixed(2)).res!=='ok') bad.push(tag+' no acepta la respuesta redondeada a 2 decimales');
       // errores típicos: se rechazan, explican y no dan la respuesta
       const wrong=[]; if(X.kind==='num') wrong.push(String(X.ans+1),String(X.ans*2),String(-X.ans));
       if(X.kind==='point') wrong.push(`(${X.ans[0]+1}, ${X.ans[1]})`,`(${X.ans[0]}, ${X.ans[1]-2})`,`(${X.st.h}, ${X.st.k})`);
       if(X.kind==='line') wrong.push(X.ans.x!=null?`x = ${X.ans.x+1}`:`y = ${X.ans.y+1}`, X.ans.x!=null?`y = ${X.ans.x}`:`x = ${X.ans.y}`);
       if(X.kind==='eq') wrong.push(plain(P.model({...X.st,h:X.st.h+1}).eq), plain(P.model({...X.st,k:X.st.k-1}).eq));
       if(X.kind==='eq'&&c==='elip') wrong.push(plain(P.model({...X.st,a:X.st.b,b:X.st.a}).eq));
       const showAns=X.kind==='point'?'('+fmt(X.ans[0])+', '+fmt(X.ans[1])+')':X.kind==='eq'?M.eq:X.kind==='line'?(X.ans.x!=null?'x = '+fmt(X.ans.x):'y = '+fmt(X.ans.y)):(Math.abs(X.ans)>4||!Number.isInteger(X.ans)?fmt(X.ans):null);
       for(const w of wrong){ const r=P.check(X,w); if(w===ansTxt(X)) continue;
         if(r.res!=='bad') { bad.push(tag+' acepta la respuesta equivocada '+w); continue; }
         if(!r.msg||r.msg.length<40||/^incorrecto/i.test(r.msg)) bad.push(tag+' mensaje pobre para '+w+': '+r.msg);
         if(showAns&&r.msg.includes(showAns)) bad.push(tag+' el mensaje da la respuesta ('+showAns+'): '+r.msg);
         if(X.kind==='eq'&&!(r.bad&&r.bad.curve.length)) bad.push(tag+' no dibuja la ruta fallida de '+w); }
       // forma no canónica (elipse, hipérbola, circunferencia): correcta pero falta pasarla a forma canónica
       if(X.kind==='eq'&&c!=='para'){ const w=M.eq.replace(/= (.*)$/,(_,r)=>'= '+r); const L=plain(M.eq).split('='); const r=P.check(X,'2*('+L[0]+') = 2*('+L[1]+')');
         if(r.res!=='warn'||!/forma canónica/.test(r.msg)) bad.push(tag+' la forma no canónica no avisa: '+r.res+' '+r.msg); } } }
   // casos concretos
   const H={c:'hip',h:0,k:0,a:3,b:4,hz:true}, XH={...P.gen('hip',Math.random,0,0),st:H};
   const r1=P.check(XH,'x^2/9 + y^2/16 = 1'); if(!(r1.res==='bad'&&/es una elipse, no una hipérbola/.test(r1.msg))) bad.push('hipérbola escrita como elipse: '+r1.msg);
   const XE={...P.gen('elip',Math.random,0,0),st:{c:'elip',h:0,k:0,a:5,b:4}}, r2=P.check(XE,'x^2/16 + y^2/25 = 1'); if(!(r2.res==='bad'&&/al revés/.test(r2.msg))) bad.push('denominadores al revés: '+r2.msg);
   const r3=P.check(XE,'16x^2 + 25y^2 = 400'); if(r3.res!=='warn'&&r3.res!=='bad') bad.push('16x²+25y²=400 debe pedir forma canónica: '+r3.res);
   const XP={...P.gen('para',Math.random,0,0),st:{c:'para',h:0,k:0,p:2,dir:'arriba'}}; ['x^2 = 8y','y = x^2/8'].forEach(s=>{ if(P.check(XP,s).res!=='ok') bad.push('la parábola no acepta '+s); });
   return {n,bad:[...new Set(bad.map(x=>x.slice(0,200)))].slice(0,12),nbad:bad.length,tipos:Object.keys(seen).length}; });
 res(m.nbad===0,`${m.n} ejercicios al azar de ${m.tipos} tipos: datos coherentes, respuesta aceptada, errores rechazados con explicación y sin dar la respuesta`+(m.nbad?'\n   '+m.bad.join('\n   '):''));
 res(m.tipos>=24,`hay al menos 24 tipos de ejercicio (${m.tipos})`);
 // 2. La pantalla: equivocarse, acertar, conteo local
 await p.evaluate(()=>localStorage.removeItem('euclidia2-practica'));
 await p.evaluate(()=>{ const P=window.__euclidia.practica; P.force(P.gen('elip',Math.random,0,1)); });
 const ans=await p.evaluate(()=>window.__euclidia.practica.ex().ans);
 await p.fill('#tAnsTx',String(ans+1)); await clk(p,'#tCheck'); await p.waitForTimeout(150);
 const w=await p.evaluate(()=>({cls:document.getElementById('tPMsg').className,msg:document.getElementById('tPMsg').textContent,st:window.__euclidia.practica.stats()}));
 res(/bad/.test(w.cls)&&w.msg.length>40&&w.st.tries===1&&w.st.ok===0,'una respuesta equivocada explica la matemática y cuenta un intento: '+w.msg.slice(0,90)+'…');
 await p.fill('#tAnsTx',String(ans)); await clk(p,'#tCheck'); await p.waitForTimeout(150);
 const o=await p.evaluate(()=>({cls:document.getElementById('tPMsg').className,score:document.getElementById('tScore').textContent,st:JSON.parse(localStorage.getItem('euclidia2-practica')),hid:document.getElementById('tCheck').hidden}));
 res(/ok/.test(o.cls)&&o.st.ok===1&&o.st.racha===0&&o.hid,'al acertar se cuenta un resuelto (sin racha, porque falló antes) y se guarda en el aparato: '+o.score);
 await clk(p,'#tNext'); await p.evaluate(()=>{ const P=window.__euclidia.practica; P.force(P.gen('circ',Math.random,2,1)); });
 const r=await p.evaluate(()=>window.__euclidia.practica.ex().ans); await p.fill('#tAnsTx',String(r)); await clk(p,'#tCheck');
 const o2=await p.evaluate(()=>window.__euclidia.practica.stats()); res(o2.ok===2&&o2.racha===1&&o2.mejor===1,'a la primera suma racha: '+JSON.stringify(o2));
 // ecuación con ruta fallida dibujada
 await p.evaluate(()=>{ const P=window.__euclidia.practica; P.force(P.gen('hip',Math.random,0,0)); });
 const eqVisible=await p.evaluate(()=>!document.getElementById('tAnsEq').hidden&&document.getElementById('tAnsTx').hidden);
 await p.fill('#tAnsEq','x^2/4 + y^2/9 = 1'); await clk(p,'#tCheck'); await p.waitForTimeout(200);
 res(eqVisible&&await p.evaluate(()=>/hipérbola/.test(document.getElementById('tPMsg').textContent)),'en los ejercicios de ecuación se escribe la ecuación y el error dice qué cónica es');
 const net2=net.filter(u=>!/fonts\.(googleapis|gstatic)\.com/.test(u)); res(net2.length===0,'la práctica no envía nada por la red (solo se piden las fuentes de letra) '+net2.join(' '));
 // 3. Celular
 const lay=await p.evaluate(()=>{ const W=document.documentElement.clientWidth, tl=document.getElementById('taller'); const over=[...document.querySelectorAll('#taller *')].filter(e=>e.offsetParent&&e.getBoundingClientRect().right>W+1).map(e=>e.id||e.tagName);
   return {W,sw:tl.scrollWidth,cw:tl.clientWidth,over:over.slice(0,5),btn:['tCheck','tHint','tNext'].every(id=>{ const e=document.getElementById(id); e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return r.height>=36&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===e; })}; });
 res(lay.sw<=lay.cw+1&&!lay.over.length&&lay.btn,`en un celular (${lay.W}px) la práctica cabe sin desplazarse de lado `+JSON.stringify(lay.over));
 // volver a explorar deja el taller como estaba
 await clk(p,'#tMode button[data-m="0"]'); res(await p.evaluate(()=>!document.getElementById('tSide').hidden&&document.getElementById('tPrac').hidden&&!document.getElementById('tTabs').hidden),'el botón Explorar vuelve al taller normal');
 res(errs.length===0,'sin errores de JavaScript'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 await b.close();
 const txt=out.join('\n')+`\n\n${pass} pasan, ${fail} fallan`; fs.writeFileSync(path.join(__dirname,'salida-practica.txt'),txt+'\n'); console.log(txt); process.exit(fail?1:0);
})();
