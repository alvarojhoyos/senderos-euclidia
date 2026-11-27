// Pruebas del registro: el documento solo se pide cuando se entra con el enlace o el QR del profesor.
// Quien juega por su cuenta (historia, Taller, práctica) solo escribe su nombre.
// Uso: node pruebas/registro.test.js [ruta/al/juego.html]
const {chromium,devices}=require('playwright'); const fs=require('fs'); const path=require('path');
const SRC=process.argv[2]||path.join(__dirname,'..','index.html');
const TMP=path.join(require('os').tmpdir(),'euclidia-registro.html');
fs.writeFileSync(TMP,'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(SRC,'utf8')+'</body></html>');
const out=[]; let pass=0, fail=0; const res=(ok,txt)=>{ ok?pass++:fail++; out.push((ok?'PASA ':'FALLA')+' | '+txt); };
(async()=>{
 const b=await chromium.launch(); const errs=[];
 const fresh=async(q)=>{ const ctx=await b.newContext({...devices['iPhone SE'],deviceScaleFactor:1}); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
   await p.route(/^https?:\/\//,r=>r.abort()); await p.addInitScript(()=>{ try{ if(!localStorage.getItem('euclidia2-intro')) localStorage.setItem('euclidia2-intro','true'); }catch(e){} });
   await p.goto('file://'+TMP+(q||'')); await p.waitForTimeout(500); await p.evaluate(()=>{ if(!document.getElementById('intro').hidden) document.getElementById('introSkip').click(); }); return {ctx,p}; };
 const vis=(p,id)=>p.evaluate(id=>{ const e=document.getElementById(id); return !!(e&&e.offsetParent); },id);
 // 1. Por su cuenta: solo el nombre
 let {ctx,p}=await fresh('');
 if(await vis(p,'roleStudent')) await p.click('#roleStudent');
 res(await vis(p,'rName')&&!(await vis(p,'rDoc'))&&!(await vis(p,'rLast')),'al entrar por su cuenta como estudiante solo se pide el nombre');
 await p.fill('#rName','Ana'); await p.click('#regForm button[type=submit]'); await p.waitForTimeout(200);
 const st=await p.evaluate(()=>({reg:document.getElementById('reg').hidden,pl:JSON.parse(localStorage.getItem('euclidia2-player')),q:JSON.parse(localStorage.getItem('euclidia2-queue')||'[]')}));
 res(st.reg&&st.pl&&st.pl.nombre==='Ana'&&!st.pl.documento,'entra al juego solo con el nombre, sin documento: '+JSON.stringify(st.pl));
 res(await p.evaluate(()=>/Ana/.test(document.getElementById('hello').textContent)),'el juego la saluda por su nombre');
 // 2. Si luego entra con el QR del profesor, ahí sí se pide el documento y no pierde su avance
 await p.evaluate(()=>{ const pr=JSON.parse(localStorage.getItem('euclidia2-prog'))||{best:{},hintsUsed:0,hintsBought:0,shown:{}}; pr.best[Object.keys(pr.best)[0]||'x']=2; localStorage.setItem('euclidia2-prog',JSON.stringify(pr)); try{ sessionStorage.clear(); }catch(e){} });
 await p.goto('file://'+TMP+'?rol=estudiante'); await p.waitForTimeout(500); await p.evaluate(()=>{ if(!document.getElementById('intro').hidden) document.getElementById('introSkip').click(); });
 res(await vis(p,'rDoc')&&await vis(p,'rLast'),'con el enlace del profesor (?rol=estudiante) se piden apellido y documento');
 await p.fill('#rName','Ana'); await p.click('#regForm button[type=submit]'); await p.waitForTimeout(150);
 res(await p.evaluate(()=>!document.getElementById('reg').hidden&&!document.getElementById('rErr').hidden),'con el enlace del profesor no deja entrar sin documento');
 await p.fill('#rLast','Pérez'); await p.fill('#rDoc','123'); await p.click('#regForm button[type=submit]'); await p.waitForTimeout(150);
 const st2=await p.evaluate(()=>({reg:document.getElementById('reg').hidden,pl:JSON.parse(localStorage.getItem('euclidia2-player')),prog:JSON.parse(localStorage.getItem('euclidia2-prog'))}));
 res(st2.reg&&st2.pl.documento==='123'&&Object.values(st2.prog.best).some(v=>v===2),'al dar el documento entra y conserva lo que había jugado por su cuenta');
 await ctx.close();
 // 3. Con una evaluación también se pide el documento
 ({ctx,p}=await fresh('?ev=abc123-C111P111-30&evn=Prueba'));
 if(await vis(p,'roleStudent')) await p.click('#roleStudent');
 res(await vis(p,'rDoc'),'con el enlace de una evaluación se pide el documento');
 await ctx.close();
 res(errs.length===0,'sin errores de JavaScript'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 await b.close();
 const txt=out.join('\n')+`\n\n${pass} pasan, ${fail} fallan`; fs.writeFileSync(path.join(__dirname,'salida-registro.txt'),txt+'\n'); console.log(txt); process.exit(fail?1:0);
})();
