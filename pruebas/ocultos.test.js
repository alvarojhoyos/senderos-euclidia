// Pruebas de los niveles de forma general (completar cuadrados): los Trazadores y objetos no se ven
// hasta que Coni pasa por ellos, para que la cónica no se pueda sacar a ojo.
// Uso: node pruebas/ocultos.test.js [ruta/al/juego.html]
const {chromium,devices}=require('playwright'); const fs=require('fs'); const path=require('path');
const SRC=process.argv[2]||path.join(__dirname,'..','index.html');
const TMP=path.join(require('os').tmpdir(),'euclidia-ocultos.html');
fs.writeFileSync(TMP,'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(SRC,'utf8')+'</body></html>');
const out=[]; let pass=0, fail=0; const res=(ok,txt)=>{ ok?pass++:fail++; out.push((ok?'PASA ':'FALLA')+' | '+txt); };
(async()=>{
 const b=await chromium.launch(); const errs=[];
 const ctx=await b.newContext({...devices['iPhone SE'],deviceScaleFactor:1}); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
 await p.route(/^https?:\/\//,r=>r.abort());
 await p.addInitScript(()=>{ localStorage.setItem('euclidia2-intro','true'); localStorage.setItem('euclidia2-pruebas','true'); localStorage.setItem('euclidia2-role','"profesor"'); sessionStorage.setItem('euclidia2-tab','1');
   // anota cada texto que el juego escribe en el mapa
   const ft=CanvasRenderingContext2D.prototype.fillText; window.__txt=new Set();
   CanvasRenderingContext2D.prototype.fillText=function(s,...a){ if(this.canvas&&this.canvas.id==='c2d') window.__txt.add(String(s)); return ft.call(this,s,...a); }; });
 await p.goto('file://'+TMP); await p.waitForTimeout(500);
 const frame=()=>p.evaluate(()=>new Promise(r=>{ window.__txt.clear(); requestAnimationFrame(()=>requestAnimationFrame(()=>r([...window.__txt])))}));
 const list=()=>p.evaluate(()=>[...document.querySelectorAll('#targets li')].map(li=>li.textContent));
 const load=id=>p.evaluate(id=>{ const U=window.__euclidia; U.loadLevel(U.LEVELS.findIndex(l=>l.id===id)); },id);
 const done=()=>p.waitForFunction(()=>!window.__euclidia.state().g2.anim,null,{timeout:40000});
 const info=await p.evaluate(()=>{ const U=window.__euclidia; return U.LEVELS.filter(l=>!l.tutorial).map(l=>({id:l.id,general:!!l.general,hidden:U.hiddenCoins(l),rescue:!!l.rescue,n:l.coins.length,diff:l.diff})); });
 const gen=info.filter(l=>l.general);
 res(gen.length>=18&&gen.every(l=>l.hidden)&&info.filter(l=>!l.general).every(l=>!l.hidden),`Los ${gen.length} niveles con forma general esconden sus monedas; los demás no`);
 // 1. Cada nivel de forma general: la lista no da coordenadas de monedas y el mapa no dibuja sus etiquetas
 for(const l of gen){
   await load(l.id); const li=await list(), tx=await frame();
   // control: el mismo nivel sin forma general muestra las etiquetas de las monedas
   const ctl=await p.evaluate(id=>{ const U=window.__euclidia, L=U.LEVELS.find(x=>x.id===id), g=L.general; delete L.general; U.loadLevel(U.LEVELS.indexOf(L)); window.__g=g;
     return [...document.querySelectorAll('#targets li')].map(li=>li.textContent); },l.id);
   const ctlTx=await frame(); await p.evaluate(id=>{ window.__euclidia.LEVELS.find(x=>x.id===id).general=window.__g; },l.id); await load(l.id);
   const coinLbl=ctlTx.filter(s=>!tx.includes(s)), coinLi=ctl.filter(s=>!li.includes(s));
   const msg=li.find(s=>/escondidos en el camino/.test(s))||'';
   res(coinLi.length===l.n&&msg.startsWith(String(l.n))&&(l.rescue?/Trazadores perdidos/.test(msg):/objetos/.test(msg))&&!li.some(s=>coinLi.includes(s)),
     `${l.id}: la lista dice «${msg}» y no da las coordenadas de las ${l.n} monedas`);
   res(coinLbl.length>=l.n&&!tx.some(s=>coinLbl.includes(s)),`${l.id}: el mapa no muestra las monedas ni sus coordenadas antes de jugar`);
 }
 // 2. Un nivel fácil sigue mostrándolas
 await load('C1'); const c1=await list(); res(c1.filter(s=>/\(/.test(s)&&!/Salida|Meta|Obstáculo/.test(s)).length===2,'C1 (fácil) sigue mostrando sus 2 monedas con coordenadas');
 // 3. Error en un Rescate difícil: Coni falla y las monedas siguen escondidas (no se da la respuesta)
 const pix=()=>p.evaluate(()=>{ const U=window.__euclidia, L=U.LEVELS[U.state().idx], cv=document.getElementById('c2d'), x=cv.getContext('2d'), d=x.getImageData(0,0,cv.width,cv.height).data; let s=0; for(let i=0;i<d.length;i+=97) s=(s*31+d[i])>>>0; return s; });
 await load('C3'); await p.evaluate(()=>window.__euclidia.submit(['(x-1)^2+(y-2)^2=11'])); await done();
 const r1=await p.evaluate(()=>{ const g=window.__euclidia.state().g2; return {reached:g.result.reached,got:g.result.coinAt.filter(v=>v>=0).length,fb:document.getElementById('fb').textContent}; });
 const t1=await frame(), l1=await list();
 res(!r1.reached&&r1.got===0&&!t1.some(s=>/^\((5|1|−3), /.test(s))&&l1.some(s=>/escondidos/.test(s)),`C3 con el radio equivocado: Coni no llega, no recoge nada y los Trazadores siguen escondidos («${r1.fb.slice(0,70)}…»)`);
 // 4. Respuesta correcta: Coni rescata los 3 Trazadores al pasar, y el nivel da 3 de 3
 await load('C3'); await p.evaluate(()=>window.__euclidia.submit(['(x-1)^2+(y-2)^2=16'])); await done();
 const r2=await p.evaluate(()=>{ const g=window.__euclidia.state().g2; return {reached:g.result.reached,got:g.result.coinAt.filter(v=>v>=0).length,fb:document.getElementById('fb').textContent}; });
 res(r2.reached&&r2.got===3,'C3 con la ecuación correcta: Coni da la vuelta y rescata los 3 Trazadores (3 de 3)');
 // 5. Escape difícil (objetos): correcta recoge los 3; error no muestra los objetos
 await load('H3'); await p.evaluate(()=>window.__euclidia.submit(['(x-2)^2/4-(y+1)^2/9=1'])); await done();
 const r3=await p.evaluate(()=>{ const g=window.__euclidia.state().g2; return {reached:g.result.reached,got:g.result.coinAt.filter(v=>v>=0).length}; });
 res(r3.reached&&r3.got===3,'H3 con la ecuación correcta: Coni llega a la meta y recoge los 3 objetos');
 // 6. Captura del antes y el después (para revisar)
 const dir=require('os').tmpdir();
 await load('C3'); await p.waitForTimeout(300); await p.locator('#c2d').screenshot({path:path.join(dir,'ocultos-antes.png')});
 const a=await pix(); await p.evaluate(()=>window.__euclidia.submit(['(x-1)^2+(y-2)^2=16'])); await done(); await p.waitForTimeout(900);
 await p.locator('#c2d').screenshot({path:path.join(dir,'ocultos-despues.png')}); const z=await pix();
 res(a!==z,'Al terminar el Rescate los Trazadores rescatados aparecen en el mapa');
 res(errs.length===0,'Sin errores de JavaScript'+(errs.length?': '+errs.join(' / '):''));
 await b.close();
 out.push(`\n${pass} pasan, ${fail} fallan`); console.log(out.join('\n')); fs.writeFileSync(path.join(__dirname,'salida-ocultos.txt'),out.join('\n')+'\n'); process.exit(fail?1:0);
})();
