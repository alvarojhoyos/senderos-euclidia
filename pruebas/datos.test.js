// Pruebas de los datos de cada nivel: cada dato que el nivel le da al estudiante (campo datos: centro, área, foco,
// excentricidad, lado recto, asíntotas...) coincide con la cónica esperada del nivel. Así, si alguien cambia un número
// de la historia o de la ecuación, la prueba lo detecta. Uso: node datos.test.js [ruta/al/juego.html]
const {chromium,devices}=require('playwright'); const fs=require('fs'); const path=require('path');
const SRC=process.argv[2]||[path.join(__dirname,'..','senderos-euclidia.html'),path.join(__dirname,'..','index.html')].find(f=>fs.existsSync(f));
const TMP=path.join(require('os').tmpdir(),'euclidia-datos.html');
fs.writeFileSync(TMP,'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(SRC,'utf8')+'</body></html>');
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({...devices['Pixel 7'],deviceScaleFactor:1});
 const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.route(/^https?:\/\//,r=>r.abort());
 await p.addInitScript(()=>{ localStorage.setItem('euclidia2-role','"profesor"'); localStorage.setItem('euclidia2-intro','true'); sessionStorage.setItem('euclidia2-tab','1'); });
 await p.goto('file://'+TMP); await p.waitForTimeout(500);
 const out=await p.evaluate(()=>{ const U=window.__euclidia, T=U.t, res=[];
   const near=(u,v)=>Math.abs(u-v)<1e-6, nearP=(u,v)=>near(u[0],v[0])&&near(u[1],v[1]);
   U.LEVELS.forEach(L=>{ if(!L.datos) return;
     const F=T.compileEq(L.targets[0]).F, c=T.classify(F), on=q=>T.dist2(F,q)<0.01;
     // semiejes: x = semieje horizontal, y = vertical; el eje principal es el mayor (elipse) o el transverso (hipérbola)
     const sx=c.a, sy=c.b, horiz=c.type==='elipse'?sx>=sy:c.horiz, sMain=horiz?sx:sy;
     const cf=c.type==='elipse'?Math.sqrt(Math.abs(sx*sx-sy*sy)):Math.hypot(sx,sy);
     const pp=c.type==='parábola'?1/(4*c.p):0;
     const focos=c.type==='parábola'?[c.vert?[c.h,c.k+pp]:[c.h+pp,c.k]]:horiz?[[c.h-cf,c.k],[c.h+cf,c.k]]:[[c.h,c.k-cf],[c.h,c.k+cf]];
     const vertices=c.type==='parábola'?[[c.h,c.k]]:horiz?[[c.h-sMain,c.k],[c.h+sMain,c.k]]:[[c.h,c.k-sMain],[c.h,c.k+sMain]];
     L.datos.forEach(d=>{ let ok=false, det='';
       if(d.t==='centro'){ ok=nearP([c.h,c.k],d.v); det=`centro (${c.h}, ${c.k})`; }
       else if(d.t==='diámetro'){ ok=near(2*c.r,d.v); det=`diámetro ${2*c.r}`; }
       else if(d.t==='perímetro'){ ok=near(2*c.r,d.v); det=`perímetro ${2*c.r}π`; }
       else if(d.t==='tangenteRecta'){ const dd=d.y!=null?Math.abs(c.k-d.y):Math.abs(c.h-d.x); ok=near(c.r,dd); det=`r = ${c.r}, distancia a la recta = ${dd}`; }
       else if(d.t==='centroRecta'){ ok=near(c.k,d.m*c.h+d.b); det=`centro (${c.h}, ${c.k}) en y = ${d.m}x + ${d.b}`; }
       else if(d.t==='ejeMenor'){ ok=c.type==='elipse'&&near(2*Math.min(sx,sy),d.v); det=`eje menor ${2*Math.min(sx,sy)}`; }
       else if(d.t==='ejeConjugado'){ const sc=horiz?sy:sx; ok=c.type==='hipérbola'&&near(2*sc,d.v); det=`eje conjugado ${2*sc}`; }
       else if(d.t==='distFocos'){ ok=near(2*cf,d.v); det=`2c = ${2*cf}`; }
       else if(d.t==='área'){ ok=near(c.r*c.r,d.v); det=`área ${(c.r*c.r)}π`; }
       else if(d.t==='tangente'){ ok=near(c.r,Math.abs(d.eje==='x'?c.k:c.h)); det=`r = ${c.r}, distancia al eje ${d.eje} = ${Math.abs(d.eje==='x'?c.k:c.h)}`; }
       else if(d.t==='centroEje'){ ok=near(d.eje==='x'?c.k:c.h,0); det=`centro (${c.h}, ${c.k})`; }
       else if(d.t==='pasa'){ ok=on(d.v); det=`(${d.v.join(', ')}) sobre la curva`; }
       else if(d.t==='vértice'){ ok=on(d.v)&&vertices.some(v=>nearP(v,d.v)); det='vértices '+vertices.map(v=>`(${v.map(n=>+n.toFixed(3)).join(', ')})`).join(' y '); }
       else if(d.t==='foco'){ ok=focos.some(f=>nearP(f,d.v)); det='focos '+focos.map(f=>`(${f.map(n=>+n.toFixed(3)).join(', ')})`).join(' y '); }
       else if(d.t==='ejeMayor'){ ok=near(2*sMain,d.v)&&(d.dir==='x')===horiz; det=`eje mayor ${2*sMain}, ${horiz?'horizontal':'vertical'}`; }
       else if(d.t==='e'){ ok=near(cf/sMain,d.v); det=`e = c/a = ${(cf/sMain).toFixed(4)}`; }
       else if(d.t==='suma'){ ok=c.type==='elipse'&&near(2*sMain,d.v); det=`2a = ${2*sMain}`; }
       else if(d.t==='diferencia'){ ok=c.type==='hipérbola'&&near(2*sMain,d.v); det=`2a = ${2*sMain}`; }
       else if(d.t==='abre'){ const dir=c.vert?(c.p>0?'arriba':'abajo'):(c.p>0?'derecha':'izquierda'); ok=dir===d.v; det=`abre hacia ${dir}`; }
       else if(d.t==='ladoRecto'){ ok=near(Math.abs(4*pp),d.v); det=`|4p| = ${Math.abs(4*pp)}`; }
       else if(d.t==='directriz'){ const v=c.vert?c.k-pp:c.h-pp; ok=(c.vert?d.y!=null&&near(d.y,v):d.x!=null&&near(d.x,v)); det=`directriz ${c.vert?'y':'x'} = ${v}`; }
       else if(d.t==='asíntota'){ const m=sy/sx; ok=c.type==='hipérbola'&&near(Math.abs(d.m),m)&&near(c.k,d.m*c.h+d.b); det=`pendientes ±${m.toFixed(4)} por el centro (${c.h}, ${c.k})`; }
       else det='tipo de dato desconocido';
       res.push({ok, txt:`${L.id} ${L.title} | ${d.t} ${JSON.stringify(d.v??d.x??d.y??d.eje??[d.m,d.b])} | ${det}`}); });
     // la historia (lo que lee el estudiante) menciona cada número de los datos
     const st=L.story.replace(/−/g,'-').replace(/(\d),(\d)/g,'$1.$2');
     const nums=L.datos.flatMap(d=>[].concat(d.v??[],d.x??[],d.y??[])).filter(v=>typeof v==='number');
     const fr=v=>[String(v),String(Math.abs(v))].concat(Number.isInteger(v)?[]:[2,3,4,5,6].filter(q=>near(Math.abs(v)*q,Math.round(Math.abs(v)*q))).map(q=>Math.round(Math.abs(v)*q)+'/'+q));
     const miss=nums.filter(v=>!fr(v).some(s=>st.includes(s)));
     res.push({ok:!miss.length, txt:`${L.id} ${L.title} | la historia da todos los números de los datos${miss.length?' | faltan '+miss.join(', '):''}`});
   });
   return res; });
 await b.close();
 const pass=out.filter(r=>r.ok).length, fail=out.length-pass;
 console.log(out.map(r=>(r.ok?'PASA ':'FALLA')+' | '+r.txt).join('\n'));
 console.log(`\nTotal: ${pass} pasan, ${fail} fallan.`+(errs.length?' Errores de la página: '+errs.join('; '):''));
 process.exitCode=fail||errs.length||!out.length?1:0;
})();
