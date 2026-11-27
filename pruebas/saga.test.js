// Pruebas de la etapa 5: la evaluación es una sola saga de Coni.
// Revisa el reparto (niveles seguidos de los mismos valles), el prólogo con la ruta, el puente entre valles,
// el aviso al ganar, el epílogo, la barra de niveles y la vista previa del panel, en celular y laptop.
// Uso: node pruebas/saga.test.js [ruta/al/juego.html]
const {chromium,devices}=require('playwright'); const fs=require('fs'); const path=require('path');
const SRC=process.argv[2]||path.join(__dirname,'..','index.html');
const TMP=path.join(require('os').tmpdir(),'euclidia-saga.html');
fs.writeFileSync(TMP,'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(SRC,'utf8')+'</body></html>');
const out=[]; let pass=0, fail=0; const res=(ok,txt)=>{ ok?pass++:fail++; out.push((ok?'PASA ':'FALLA')+' | '+txt); };
(async()=>{
 const b=await chromium.launch(); const errs=[];
 const page=async(dev,init,query='')=>{ const ctx=await b.newContext({...dev,deviceScaleFactor:1}); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
   await p.route(/^https?:\/\//,r=>r.abort()); await p.addInitScript(()=>{ localStorage.setItem('euclidia2-intro','true'); localStorage.setItem('euclidia2-pruebas','true'); }); if(init) await p.addInitScript(init);
   await p.goto('file://'+TMP+query); await p.waitForTimeout(700); return p; };
 const prof=()=>{ localStorage.setItem('euclidia2-role','"profesor"'); sessionStorage.setItem('euclidia2-tab','1'); };
 // 1. Reparto: niveles seguidos de los valles, cantidades exactas, sin repetir
 const p0=await page(devices['Pixel 7'],prof);
 const r=await p0.evaluate(()=>{ const U=window.__euclidia, T=U.t, L=U.LEVELS, by=Object.fromEntries(L.map(l=>[l.id,l])), D=['fácil','medio','difícil'];
   const W={C:'Circunferencias',E:'Elipses',P:'Parábolas',H:'Hipérbolas',I:'Identificar',X:'Mixtos'};
   const len=ch=>L.filter(l=>l.chain===ch).length;
   // dos niveles seguidos de la misma dificultad: mismo valle y paso siguiente, o fin de un valle y comienzo de otro
   const seguidos=(a,b)=>(a.chain===b.chain&&b.step===a.step+1)||(a.chain!==b.chain&&a.step===len(a.chain)&&b.step===1);
   const codes=['abc123-C010E010P010H010I010X010-20','abc123-C110E110P110H110I011X011-40','abc123-C121E121P121H121I011X011-60','q1w2e3-C050-30','q1w2e3-C800-30','q1w2e3-P004H040-30','q1w2e3-X022I202-30','q1w2e3-C333E333P333H333I222X222-90'];
   const bad=[]; let chapMax=0, total=0;
   codes.forEach(code=>{ const ev=T.parseEv(code); for(let d=0;d<60;d++){ const ids=T.sessionFor(ev,String(1000+d)), ls=ids.map(i=>by[i]); total++;
     if(new Set(ids).size!==ids.length) bad.push(code+' repetidos');
     Object.entries(W).forEach(([k,w])=>{ const q=ev.q[k]||[0,0,0], wl=ls.filter(l=>l.world===w);
       if(!wl.every((l,i)=>i===0||D.indexOf(l.diff)>=D.indexOf(wl[i-1].diff))) bad.push(code+' orden '+k);
       D.forEach((dn,j)=>{ const g=wl.filter(l=>l.diff===dn); if(g.length!==q[j]) bad.push(code+' cantidad '+k+dn);
         for(let i=1;i<g.length;i++) if(!seguidos(g[i-1],g[i])) bad.push(code+' salto '+g[i-1].id+'→'+g[i].id);
         chapMax=Math.max(chapMax,new Set(g.map(l=>l.chain)).size); }); }); } });
   // variedad entre estudiantes
   const media=T.parseEv(codes[1]), sets=new Set(Array.from({length:40},(_,i)=>T.sessionFor(media,String(5000+i)).join()));
   const uno=T.parseEv('q1w2e3-C010-30'), unos=new Set(Array.from({length:200},(_,i)=>T.sessionFor(uno,String(i))[0]));
   const s1=T.sessionFor(media,'777').join(), s1b=T.sessionFor(media,' 777 ').join();
   return {bad:bad.slice(0,5),nbad:bad.length,total,chapMax,var:sets.size,unos:unos.size,same:s1===s1b}; });
 res(r.nbad===0,`Reparto en ${r.total} pruebas de 8 tipos: cantidades exactas, de fácil a difícil, sin repetir y siempre niveles seguidos de un valle${r.nbad?' — '+r.bad.join('; '):''}`);
 res(r.chapMax<=2,`Con N niveles de una dificultad en un mundo salen a lo sumo 2 valles (el banco tiene 2 por dificultad): máximo ${r.chapMax}`);
 res(r.var>=30&&r.unos===8&&r.same,`Variedad: ${r.var} de 40 estudiantes con saga distinta en la media; con 1 nivel medio de circunferencias salen los 8 posibles (${r.unos}); el mismo documento da la misma saga`);
 // 2. Vista previa en el panel del profesor
 const tp=await p0.evaluate(async()=>{ const g=id=>document.getElementById(id); const btn=[...document.querySelectorAll('button')].find(x=>/Panel del profesor/.test(x.textContent));
   if(btn) btn.click(); await new Promise(r=>setTimeout(r,200)); if(g('tGoEv')) g('tGoEv').click(); await new Promise(r=>setTimeout(r,200));
   const out={};
   for(const k of ['c','m','l']){ document.querySelector(`.evlen [data-p="${k}"]`).click(); await new Promise(r=>setTimeout(r,50)); out[k]=[...g('evSaga').children].map(li=>li.textContent); }
   out.vis=!g('evSagaBox').hidden; g('evZero').click(); await new Promise(r=>setTimeout(r,50)); out.vacio=g('evSagaBox').hidden; return out; });
 res(tp.vis&&tp.c.length===6&&tp.m.length===6&&tp.l.length===6&&/^Circunferencias: .+ → .+/.test(tp.m[0])&&!/ → /.test(tp.c[0]),`El panel muestra un ejemplo de la ruta por mundos con los títulos de los niveles («${(tp.m[0]||'').trim()}»)`);
 res(tp.vacio,'Con la tabla vacía no se muestra la ruta de ejemplo');
 // 3. Estudiante en celular y en laptop: prólogo, puente, aviso al ganar, barra de niveles y epílogo
 for(const [nom,dev] of [['celular (iPhone SE)',devices['iPhone SE']],['laptop',{viewport:{width:1280,height:800}}]]){
   const p=await page(dev,null,'?rol=estudiante&ev=sg7k2m-C110E110P010-30&evn=Quiz%20saga');
   await p.evaluate(async()=>{ const g=id=>document.getElementById(id); g('rName').value='Ana'; g('rLast').value='Ruiz'; g('rDoc').value='4242'; g('regForm').requestSubmit(); await new Promise(r=>setTimeout(r,300)); });
   const gate=await p.evaluate(()=>document.getElementById('evGateTxt').textContent);
   res(/una saga de 5 niveles por 3 mundos en 30 minutos/.test(gate),`${nom}: el aviso antes de empezar anuncia la saga («${gate.split('.')[0]}»)`);
   const pr=await p.evaluate(async()=>{ const g=id=>document.getElementById(id); g('evGo').click(); g('evGo').click(); await new Promise(r=>setTimeout(r,400));
     const U=window.__euclidia, ids=U.t.sessionFor(U.t.parseEv('sg7k2m-C110E110P010-30'),'4242');
     const card=document.querySelector('#lore .card').getBoundingClientRect();
     return {vis:!g('lore').hidden,reg:g('loreRegion').textContent,tit:g('loreTitle').textContent,txt:g('loreText').textContent,route:[...g('loreRoute').children].map(li=>li.querySelector('b').textContent),
       go:g('loreGo').textContent,ids,over:document.documentElement.scrollWidth>innerWidth,fits:card.left>=0&&card.right<=innerWidth+1}; });
   res(pr.vis&&pr.reg==='La saga de hoy'&&pr.tit==='Quiz saga'&&/5 tramos seguidos/.test(pr.txt)&&pr.go==='¡En marcha!',`${nom}: al empezar sale el prólogo «${pr.tit}»: ${pr.txt.split('.')[0]}.`);
   res(pr.route.join()==='Circunferencias,Elipses,Parábolas'&&/en 3 mundos/.test(pr.txt),`${nom}: la ruta del prólogo va por mundos: ${pr.route.join(' → ')}`);
   res(!pr.over&&pr.fits,`${nom}: el prólogo cabe a lo ancho sin desplazamiento horizontal`);
   const l1=await p.evaluate(async()=>{ const g=id=>document.getElementById(id); g('loreGo').click(); await new Promise(r=>setTimeout(r,200));
     const U=window.__euclidia; return {vis:!g('lore').hidden,reg:g('loreRegion').textContent,tit:g('loreTitle').textContent,route:g('loreRoute').hidden,go:g('loreGo').textContent,cur:U.LEVELS[U.state().idx].id}; });
   res(l1.vis&&l1.reg.startsWith('Tramo 1 de 5 · ')&&l1.route&&l1.go==='Siguiente'&&l1.cur===pr.ids[0],`${nom}: después del prólogo sigue la historia del primer tramo («${l1.reg}», ${l1.tit})`);
   // cada tramo dice su lugar; al cambiar de mundo o de región empieza con un puente que solo nombra lugares
   const br=await p.evaluate(async(ids)=>{ const g=id=>document.getElementById(id); g('loreGo').click(); const U=window.__euclidia, L=U.LEVELS, lv=id=>L.find(l=>l.id===id), out=[];
     for(let k=1;k<ids.length;k++){ U.openLevel(L.findIndex(l=>l.id===ids[k])); await new Promise(r=>setTimeout(r,120));
       const a=lv(ids[k-1]), b=lv(ids[k]), ra=U.SCENE_OF[a.id], rb=U.SCENE_OF[b.id], txt=g('loreText').textContent, lore=U.LORE[b.id], pre=txt.slice(0,txt.length-lore.length).trim();
       const want=a.world!==b.world?/^Coni entra en el mundo de las \S+, por .+\.$/:ra!==rb?/^Coni deja atrás .+ y sigue hacia .+\.$/:/^$/;
       out.push({k,ok:txt.endsWith(lore)&&want.test(pre)&&g('loreRegion').textContent===`Tramo ${k+1} de 5 · ${U.REGIONS[rb]}`,pre,chainName:!!b.chain&&g('loreRegion').textContent.includes(b.chain)});
       g('loreGo').click(); }
     return out; },pr.ids);
   res(br.every(x=>x.ok&&!x.chainName),`${nom}: cada tramo dice su lugar (no el valle) y el puente solo aparece al cambiar de mundo o región: ${br.map(x=>x.pre||'—').join(' | ')}`);
   // ganar el primer tramo: aviso de la saga
   const w=await p.evaluate(async(ids)=>{ const U=window.__euclidia, L=U.LEVELS, i=L.findIndex(l=>l.id===ids[0]); U.openLevel(i); document.getElementById('loreGo').click();
     U.submit(L[i].answer.map(a=>Array.isArray(a)?[...a]:a)); await new Promise(r=>{ const f=()=>U.state().g2.anim?setTimeout(f,100):setTimeout(r,200); setTimeout(f,100); });
     const g=id=>document.getElementById(id); return {win:!g('win').hidden,txt:g('winText').textContent,btn:g('nextBtn').textContent,nh:g('nextBtn').hidden}; },pr.ids);
   res(w.win&&w.btn==='Seguir la saga'&&!w.nh&&/Tramo 1 de 5 de la saga\./.test(w.txt),`${nom}: al superar un tramo: «${w.txt.replace(/^.*?\. /,'')}» y el botón «${w.btn}»`);
   const nx=await p.evaluate(async(ids)=>{ document.getElementById('nextBtn').click(); await new Promise(r=>setTimeout(r,200)); const U=window.__euclidia; const t=document.getElementById('loreRegion').textContent; document.getElementById('loreGo').click(); return {cur:U.LEVELS[U.state().idx].id,t}; },pr.ids);
   res(nx.cur===pr.ids[1]&&nx.t.startsWith('Tramo 2 de 5'),`${nom}: «Seguir la saga» lleva al tramo 2 (${nx.cur}, «${nx.t}»)`);
   // barra de niveles por valle
   const rows=await p.evaluate(()=>[...document.querySelectorAll('.chain .cn')].map(x=>x.textContent));
   res(rows.length>=1&&rows.every(t=>/^(Fácil|Medio|Difícil)$/.test(t)),`${nom}: la barra agrupa por dificultad, sin nombres de valle: ${rows.join(' | ')}`);
   // último tramo con todo superado y epílogo
   const ep=await p.evaluate(async(ids)=>{ const U=window.__euclidia, L=U.LEVELS, P=U.state().prog; ids.slice(0,-1).forEach(id=>P.best[id]=L.find(l=>l.id===id).coins.length);
     const i=L.findIndex(l=>l.id===ids[ids.length-1]); U.openLevel(i); document.getElementById('loreGo').click();
     U.submit(L[i].answer.map(a=>Array.isArray(a)?[...a]:a)); await new Promise(r=>{ const f=()=>U.state().g2.anim?setTimeout(f,100):setTimeout(r,200); setTimeout(f,100); });
     const g=id=>document.getElementById(id); const win=g('winText').textContent, nh=g('nextBtn').hidden;
     g('win').hidden=true; g('doneBtn').click(); await new Promise(r=>setTimeout(r,100)); g('doneGo').click(); await new Promise(r=>setTimeout(r,300));
     return {win,nh,done:g('doneText').textContent}; },pr.ids);
   res(ep.nh&&/recorrió toda la saga/.test(ep.win),`${nom}: en el último tramo con todo superado: «${ep.win.replace(/^.*?\. /,'')}»`);
   res(/Coni recorrió los 5 tramos/.test(ep.done),`${nom}: el epílogo al terminar: «${ep.done}»`);
   await p.context().close();
 }
 // 4. Sin evaluación la historia de cada nivel sigue igual (sin tramo ni puente)
 const p2=await page(devices['Pixel 7'],prof);
 const sl=await p2.evaluate(async()=>{ const U=window.__euclidia, L=U.LEVELS, i=L.findIndex(l=>l.id==='E2'); U.openLevel(i); await new Promise(r=>setTimeout(r,150));
   const g=id=>document.getElementById(id); return {reg:g('loreRegion').textContent,txt:g('loreText').textContent===U.LORE.E2,route:g('loreRoute').hidden,go:g('loreGo').textContent}; });
 res(!/Tramo/.test(sl.reg)&&sl.txt&&sl.route&&sl.go==='Siguiente',`Sin evaluación la historia del nivel no cambia (región «${sl.reg}»)`);
 // 5. Historias autocontenidas: ningún texto nombra otro valle ni depende del nivel anterior
 const au=await p2.evaluate(()=>{ const U=window.__euclidia, L=U.LEVELS.filter(l=>!l.tutorial), gen=/^(Desfiladero|Glaciar|Mirador|Géiseres)$/;
   const names=[...new Set(L.map(l=>l.chain))].map(c=>[c,c.replace(/^(El|La|Los|Las) /,'')]).filter(([c,n])=>!gen.test(n));
   const bad=[]; L.forEach(l=>{ const t=U.LORE[l.id]||''; names.forEach(([c,n])=>{ if(c!==l.chain&&t.toLowerCase().includes(n.toLowerCase())) bad.push(l.id+' nombra '+c); });
     if(/vecin|últimas torres|volver del observatorio/i.test(t)) bad.push(l.id+' depende de otro nivel'); });
   return bad; });
 res(au.length===0,'Ninguna historia nombra otro valle ni depende del nivel anterior'+(au.length?': '+au.join('; '):' (C2, C8, C13 y H16 corregidos)'));
 res(errs.length===0,'Sin errores de JavaScript'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 await b.close();
 const txt=out.join('\n')+`\n\n${pass} pasan, ${fail} fallan`; fs.writeFileSync(path.join(__dirname,'salida-saga.txt'),txt+'\n'); console.log(txt); process.exit(fail?1:0);
})();
