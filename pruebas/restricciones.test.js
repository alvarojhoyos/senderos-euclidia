// Pruebas de las restricciones opcionales: el estudiante las añade con un botón (hasta dos por tramo, una en x y otra en y).
// Uso: node pruebas/restricciones.test.js [ruta/al/juego.html]
const {chromium,devices}=require('playwright'); const fs=require('fs'); const path=require('path');
const SRC=process.argv[2]||path.join(__dirname,'..','index.html');
const TMP=path.join(require('os').tmpdir(),'euclidia-restricciones.html');
fs.writeFileSync(TMP,'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(SRC,'utf8')+'</body></html>');
const out=[]; let pass=0, fail=0; const res=(ok,txt)=>{ ok?pass++:fail++; out.push((ok?'PASA ':'FALLA')+' | '+txt); };
(async()=>{
 const b=await chromium.launch(); const errs=[]; const ctx=await b.newContext({...devices['Pixel 7'],deviceScaleFactor:1}); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
 await p.route(/^https?:\/\//,r=>r.abort()); await p.addInitScript(()=>{ localStorage.setItem('euclidia2-role','"profesor"'); sessionStorage.setItem('euclidia2-tab','1'); });
 await p.goto('file://'+TMP); await p.waitForTimeout(500);
 // 1. Matemática: una lista de restricciones exige todas a la vez
 const m=await p.evaluate(()=>{ const T=window.__euclidia.t, I=[{v:'x',lo:-Infinity,hi:5},{v:'y',lo:0,hi:Infinity}];
   return {a:T.inI(I,[3,1]),b:T.inI(I,[6,1]),c:T.inI(I,[3,-1]),d:T.inI(null,[9,9]),e:T.inI({v:'x',lo:0,hi:1},[0.5,7])}; });
 res(m.a&&!m.b&&!m.c&&m.d&&m.e,'Con dos restricciones (x ≤ 5 y y ≥ 0) solo vale la parte que cumple las dos; sin restricción vale toda la curva');
 // 2. La casilla de restricción no aparece sola: se añade con el botón, hasta dos, y se quita con ✕
 const ui=await p.evaluate(async()=>{ const U=window.__euclidia; U.loadLevel(U.LEVELS.findIndex(l=>!l.tutorial&&!l.mixed)); await new Promise(r=>setTimeout(r,150));
   const add=()=>document.querySelector('#ivbox0 .ivadd'), rows=()=>document.querySelectorAll('#ivbox0 .ivrow').length, vars=()=>[...document.querySelectorAll('#ivbox0 .ivt.var')].map(b=>b.textContent).join(',');
   const r0=rows(), t0=add().textContent, mode0=document.querySelector('#fields .ivmode').hidden; add().click(); const t1=add().textContent; add().click();
   const r2=rows(), v2=vars(), mode2=document.querySelector('#fields .ivmode').hidden, none=!add();
   document.querySelector('#ivrow0_0 .ivdel').click(); const v1=vars(), back=!!add();
   return {r0,t0,mode0,t1,r2,v2,mode2,none,v1,back}; });
 res(ui.r0===0&&ui.mode0&&ui.t0==='+ Añadir una restricción','Al empezar no hay restricción: solo el botón «+ Añadir una restricción»');
 res(ui.r2===2&&ui.v2==='x,y'&&!ui.mode2&&ui.none&&ui.t1==='+ Añadir otra restricción',`Se pueden añadir dos (${ui.v2}); la segunda empieza en la otra variable y ya no se ofrece una tercera`);
 res(ui.v1==='y'&&ui.back,'Con ✕ se quita una restricción y vuelve el botón para añadir');
 // 3. En el juego real
 const run=async(id,sub)=>{ await p.evaluate(([id,sub])=>{ const U=window.__euclidia; U.loadLevel(U.LEVELS.findIndex(l=>l.id===id)); U.submit(sub); },[id,sub]);
   await p.waitForFunction(()=>!window.__euclidia.state().g2.anim,null,{timeout:30000}).catch(()=>{});
   return p.evaluate(()=>{ const r=window.__euclidia.state().g2.result||{}; return {reached:!!r.reached,coins:(r.coinAt||[]).filter(c=>c>=0).length,of:(r.coinAt||[]).length,fb:document.getElementById('fb').innerText.replace(/\n/g,' · ')}; }); };
 const a=await run('X3',[['x^2/9+y^2/4=1','y≤0'],['x=y^2/2+3',['y≥0','x≤7.5']]]);
 res(a.reached&&a.coins===a.of,`Mixto con dos restricciones en el tramo 2 (y ≥ 0 y x ≤ 7,5): llega con ${a.coins}/${a.of} monedas`);
 const n=await run('X3',[['x^2/9+y^2/4=1'],['x=y^2/2+3','y≥0']]);
 res(!n.reached&&/restricción/.test(n.fb),'Mixto sin restricción en el tramo 1: Coni no sabe por dónde ir y el juego sugiere añadir una restricción');
 const e=await run('X3',[['x^2/9+y^2/4=1','y≤0'],['(x-7.5)^2/20.25+y^2/9=1','y≥0']]);
 res(e.reached,`Otro camino válido (una elipse en el tramo 2, con y ≥ 0) también llega a la meta: ${e.fb.split(' · ')[0]}`);
 // Una restricción añadida pero vacía no limita nada: el juego traza y explica que Coni no sabe por dónde ir
 const v=await p.evaluate(async()=>{ const U=window.__euclidia; U.loadLevel(U.LEVELS.findIndex(l=>l.id==='X1')); await new Promise(r=>setTimeout(r,150));
   document.querySelector('#ivbox0 .ivadd').click(); const rows=document.querySelectorAll('#ivbox0 .ivrow').length; document.getElementById('eq0').value='x^2+y^2=4'; document.getElementById('eq1').value='y=x^2'; document.getElementById('go').click(); await new Promise(r=>setTimeout(r,300));
   return {rows,fb:document.getElementById('fb').innerText.replace(/\n/g,' · '),drawn:window.__euclidia.state().g2.curves.length,choose:!!window.__euclidia.state().g2.choose}; });
 res(v.rows===1&&!/al menos un extremo/.test(v.fb)&&v.drawn===2&&v.choose&&/no sabe cuál tomar/.test(v.fb),`Mixto con la circunferencia completa en el tramo 1 y una restricción vacía: dibuja las curvas y dice «${v.fb.split(' · ')[0]}»`);
 const t=await run('t0',[['x^2+y^2=9','0≤y']]);
 res(t.reached&&t.coins===t.of,'Tutorial: la práctica de la restricción se resuelve añadiendo 0 ≤ y');
 await b.close();
 console.log(out.join('\n')); console.log(`\nTotal: ${pass} pasan, ${fail} fallan.`+(errs.length?' Errores de la página: '+errs.join('; '):''));
 process.exitCode=fail||errs.length?1:0;
})();
