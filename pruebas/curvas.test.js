// Pruebas automáticas: ¿lo que el juego dibuja coincide con la ecuación que escribe el jugador?
// Uso: node curvas.test.js [ruta/al/juego.html]   (requiere Playwright con Chromium)
// Para cada ecuación se compara contra la curva exacta calculada aparte (fórmulas paramétricas):
//   1. clasificación: tipo de cónica y parámetros (centro, semiejes, radio, a)
//   2. precisión: cada trazo dibujado está sobre la curva exacta
//   3. cobertura: toda la curva exacta que cae en el mapa quedó dibujada (sin huecos ni ramas perdidas)
//   4. restricción: solo se marca como "camino" la parte que cumple el intervalo
//   5. recorrido: los puntos por donde camina Vector están sobre la curva y dentro de la restricción
const {chromium}=require('playwright'); const fs=require('fs'); const path=require('path');
const SRC=process.argv[2]||[path.join(__dirname,'..','senderos-euclidia.html'),path.join(__dirname,'..','index.html')].find(f=>fs.existsSync(f));
const TMP=path.join(require('os').tmpdir(),'euclidia-pruebas.html');
fs.writeFileSync(TMP,'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(SRC,'utf8')+'</body></html>');

// ---- Casos: ecuación tal como la escribe el jugador + curva exacta esperada ----
// tipos esperados: circ{h,k,r} elip{h,k,a,b} parV{h,k,p} (y=p(x-h)^2+k) parH{h,k,p} (x=p(y-k)^2+h)
// hipH{h,k,a,b} (abre a los lados) hipV{h,k,a,b} (abre arriba/abajo; a en x, b en y), rectas, vacia, punto
const C=[
 // Circunferencias
 {g:'Circunferencia',n:'centro en el origen',eq:'x^2+y^2=9',e:{t:'circ',h:0,k:0,r:3}},
 {g:'Circunferencia',n:'centro fuera del origen',eq:'(x-3)^2+(y+2)^2=4',e:{t:'circ',h:3,k:-2,r:2}},
 {g:'Circunferencia',n:'nivel Isla Circular',eq:'(x+1)^2+(y-2)^2=9',e:{t:'circ',h:-1,k:2,r:3}},
 {g:'Circunferencia',n:'radio decimal',eq:'(x-0.5)^2+(y+1.5)^2=6.25',e:{t:'circ',h:0.5,k:-1.5,r:2.5}},
 {g:'Circunferencia',n:'no normalizada: 2x²+2y²=18',eq:'2x^2+2y^2=18',e:{t:'circ',h:0,k:0,r:3}},
 {g:'Circunferencia',n:'escrita como elipse con a = b',eq:'(x-1)^2/9+(y+2)^2/9=1',e:{t:'circ',h:1,k:-2,r:3}},
 {g:'Circunferencia',n:'lados invertidos: 9 = x²+y²',eq:'9=x^2+y^2',e:{t:'circ',h:0,k:0,r:3}},
 {g:'Circunferencia',n:'coeficientes negativos',eq:'-x^2-y^2=-9',e:{t:'circ',h:0,k:0,r:3}},
 {g:'Circunferencia',n:'radio pequeño (0,5)',eq:'(x-1)^2+(y-1)^2=0.25',e:{t:'circ',h:1,k:1,r:0.5}},
 {g:'Circunferencia',n:'radio muy pequeño (0,1)',eq:'x^2+y^2=0.01',e:{t:'circ',h:0,k:0,r:0.1}},
 {g:'Circunferencia',n:'radio con raíz: r² = 2',eq:'x^2+y^2=2',e:{t:'circ',h:0,k:0,r:Math.SQRT2}},
 {g:'Circunferencia',n:'más grande que el mapa',eq:'x^2+y^2=400',e:{t:'circ',h:0,k:0,r:20}},
 {g:'Circunferencia',n:'se sale del mapa por un lado',eq:'(x-6)^2+y^2=25',e:{t:'circ',h:6,k:0,r:5},view:[0,0,14]},
 {g:'Circunferencia',n:'restringida a 0 ≤ y',eq:'x^2+y^2=9',iv:'0≤y',e:{t:'circ',h:0,k:0,r:3}},
 // Elipses
 {g:'Elipse',n:'centro en el origen',eq:'x^2/9+y^2/4=1',e:{t:'elip',h:0,k:0,a:3,b:2}},
 {g:'Elipse',n:'eje mayor vertical',eq:'x^2/4+y^2/16=1',e:{t:'elip',h:0,k:0,a:2,b:4}},
 {g:'Elipse',n:'nivel Valle Elíptico',eq:'(x-2)^2/9+(y+1)^2/4=1',e:{t:'elip',h:2,k:-1,a:3,b:2}},
 {g:'Elipse',n:'no normalizada: 4x²+9y²=36',eq:'4x^2+9y^2=36',e:{t:'elip',h:0,k:0,a:3,b:2}},
 {g:'Elipse',n:'no normalizada con centro',eq:'4(x-2)^2+9(y+1)^2=36',e:{t:'elip',h:2,k:-1,a:3,b:2}},
 {g:'Elipse',n:'lado derecho distinto de 1',eq:'(x-2)^2/9+(y+1)^2/4=4',e:{t:'elip',h:2,k:-1,a:6,b:4}},
 {g:'Elipse',n:'coeficientes negativos',eq:'-(x-2)^2/9-(y+1)^2/4=-1',e:{t:'elip',h:2,k:-1,a:3,b:2}},
 {g:'Elipse',n:'denominador en decimales',eq:'x^2/6.25+y^2/0.64=1',e:{t:'elip',h:0,k:0,a:2.5,b:0.8}},
 {g:'Elipse',n:'muy aplanada (b = 0,3)',eq:'x^2/25+y^2/0.09=1',e:{t:'elip',h:0,k:0,a:5,b:0.3}},
 {g:'Elipse',n:'muy aplanada (b = 0,1)',eq:'x^2/25+y^2/0.01=1',e:{t:'elip',h:0,k:0,a:5,b:0.1}},
 {g:'Elipse',n:'casi circunferencia (a = 3, b = 2,99)',eq:'x^2/9+y^2/8.9401=1',e:{t:'elip',h:0,k:0,a:3,b:2.99}},
 {g:'Elipse',n:'restringida a y ≤ −1',eq:'(x-2)^2/9+(y+1)^2/4=1',iv:'y≤-1',e:{t:'elip',h:2,k:-1,a:3,b:2}},
 // Parábolas
 {g:'Parábola',n:'y = x²',eq:'y=x^2',e:{t:'parV',h:0,k:0,p:1}},
 {g:'Parábola',n:'nivel Puente Parabólico',eq:'y=(x-1)^2/2-3',e:{t:'parV',h:1,k:-3,p:0.5}},
 {g:'Parábola',n:'abre hacia abajo (a negativo)',eq:'y=-2(x+1)^2+3',e:{t:'parV',h:-1,k:3,p:-2}},
 {g:'Parábola',n:'horizontal, abre a la derecha',eq:'x=(y-2)^2/4+1',e:{t:'parH',h:1,k:2,p:0.25}},
 {g:'Parábola',n:'horizontal, abre a la izquierda',eq:'x=-(y+1)^2/2',e:{t:'parH',h:0,k:-1,p:-0.5}},
 {g:'Parábola',n:'no normalizada: 2y = (x−1)² − 6',eq:'2y=(x-1)^2-6',e:{t:'parV',h:1,k:-3,p:0.5}},
 {g:'Parábola',n:'forma 4p: (x−1)² = 4(y+3)',eq:'(x-1)^2=4(y+3)',e:{t:'parV',h:1,k:-3,p:0.25}},
 {g:'Parábola',n:'forma 4p negativa: (y−2)² = −8(x−1)',eq:'(y-2)^2=-8(x-1)',e:{t:'parH',h:1,k:2,p:-0.125}},
 {g:'Parábola',n:'k a la izquierda: y − 3 = (x+1)²',eq:'y-3=(x+1)^2',e:{t:'parV',h:-1,k:3,p:1}},
 {g:'Parábola',n:'muy cerrada (a = 20)',eq:'y=20x^2',e:{t:'parV',h:0,k:0,p:20}},
 {g:'Parábola',n:'muy abierta (a = 0,02)',eq:'y=0.02x^2-2',e:{t:'parV',h:0,k:-2,p:0.02}},
 {g:'Parábola',n:'restringida a 0 ≤ x ≤ 2',eq:'y=(x-1)^2/2-3',iv:'0≤x≤2',e:{t:'parV',h:1,k:-3,p:0.5}},
 // Hipérbolas
 {g:'Hipérbola',n:'equilátera (a = b): x² − y² = 9',eq:'x^2-y^2=9',e:{t:'hipH',h:0,k:0,a:3,b:3}},
 {g:'Hipérbola',n:'a ≠ b, abre a los lados',eq:'x^2/9-y^2/4=1',e:{t:'hipH',h:0,k:0,a:3,b:2}},
 {g:'Hipérbola',n:'abre arriba y abajo',eq:'y^2/4-x^2/9=1',e:{t:'hipV',h:0,k:0,a:3,b:2}},
 {g:'Hipérbola',n:'centro fuera del origen, vertical',eq:'(y-1)^2/4-(x+2)^2/9=1',e:{t:'hipV',h:-2,k:1,a:3,b:2}},
 {g:'Hipérbola',n:'signo negativo: y² − x² = −9',eq:'y^2-x^2=-9',e:{t:'hipH',h:0,k:0,a:3,b:3}},
 {g:'Hipérbola',n:'no normalizada: 4x² − 9y² = 36',eq:'4x^2-9y^2=36',e:{t:'hipH',h:0,k:0,a:3,b:2}},
 {g:'Hipérbola',n:'término negativo primero',eq:'-(x-1)^2/4+(y+1)^2=1',e:{t:'hipV',h:1,k:-1,a:2,b:1}},
 {g:'Hipérbola',n:'casi sus asíntotas (a = b = 0,3)',eq:'x^2-y^2=0.09',e:{t:'hipH',h:0,k:0,a:0.3,b:0.3}},
 {g:'Hipérbola',n:'restringida a y ≥ 0',eq:'x^2-y^2=9',iv:'y≥0',e:{t:'hipH',h:0,k:0,a:3,b:3}},
 // Casos degenerados
 {g:'Degenerada',n:'sin puntos: x² + y² = −4',eq:'x^2+y^2=-4',e:{t:'vacia'}},
 {g:'Degenerada',n:'un solo punto: x² + y² = 0',eq:'x^2+y^2=0',e:{t:'punto',h:0,k:0}},
 {g:'Degenerada',n:'dos rectas: x² − y² = 0',eq:'x^2-y^2=0',e:{t:'rectas'}},
];
// Ecuaciones como las entrega el editor tipo cuaderno (LaTeX) → mismo dibujo que la versión en texto
const TEX=[
 ['x^{2}+y^{2}=9','x^2+y^2=9'],
 ['\\frac{(x-2)^{2}}{9}+\\frac{(y+1)^{2}}{4}=1','(x-2)^2/9+(y+1)^2/4=1'],
 ['\\frac{\\left(x-2\\right)^2}{9}+\\frac{\\left(y+1\\right)^2}{4}=1','(x-2)^2/9+(y+1)^2/4=1'],
 ['y=\\frac{(x-1)^{2}}{2}-3','y=(x-1)^2/2-3'],
 ['y=\\frac{1}{2}(x-1)^{2}-3','y=(x-1)^2/2-3'],
 ['y=-2(x+1)^{2}+3','y=-2(x+1)^2+3'],
 ['4(x-2)^{2}+9(y+1)^{2}=36','4(x-2)^2+9(y+1)^2=36'],
 ['x^{2}-y^{2}=9','x^2-y^2=9'],
 ['\\frac{x^{2}}{9}-\\frac{y^{2}}{4}=1','x^2/9-y^2/4=1'],
 ['x^{2}+y^{2}=\\sqrt{2}^{2}','x^2+y^2=2'],
 ['(x+1)^{2}+(y-2)^{2}=3^{2}','(x+1)^2+(y-2)^2=9'],
 ['x^2\\cdot 4+9\\cdot y^2=36','4x^2+9y^2=36'],
 ['\\frac{x^2}{4}\\div 2+y^2=1','x^2/8+y^2=1'],
];

(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:412,height:860},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.route(/^https?:\/\//,r=>r.abort());   // sin red: el juego usa sus casillas de texto
 await p.addInitScript(()=>{ localStorage.setItem('euclidia2-role','"profesor"'); sessionStorage.setItem('euclidia2-tab','1'); });
 await p.goto('file://'+TMP); await p.waitForTimeout(500);
 const out=await p.evaluate(({C,TEX})=>{
  const {LEVELS,loadLevel}=window.__euclidia; const {compileEq,canonicalProblem,classify,buildSegs,curveBounds,walk,parseInterval,inI,dist2,tex2plain}=window.__euclidia.t; const W=window.__euclidia.t.W();
  const R=[]; const res=(grupo,caso,prueba,ok,det)=>R.push({grupo,caso,prueba,ok,det});
  // nivel de prueba vacío (sin monedas ni obstáculos) centrado en la cónica
  LEVELS.push({id:'prueba',tutorial:true,title:'Prueba',kind:'Prueba',story:'',targets:['x^2+y^2=1'],start:[0,0],goal:[99,99],coins:[],obstacles:[],view:{cx:0,cy:0,span:14},hints:[]});
  const TI=LEVELS.length-1;
  const setView=(cx,cy,span)=>{ LEVELS[TI].view={cx,cy,span}; loadLevel(TI); };
  const f3=v=>Math.round(v*1000)/1000;
  // puntos densos de la curva exacta
  function exact(e,B){ const P=[], N=20000, X=Math.max(Math.abs(B.x0),Math.abs(B.x1))+50, Y=Math.max(Math.abs(B.y0),Math.abs(B.y1))+50;
    if(e.t==='circ') for(let i=0;i<N;i++){const t=2*Math.PI*i/N; P.push([e.h+e.r*Math.cos(t),e.k+e.r*Math.sin(t)]);}
    if(e.t==='elip') for(let i=0;i<N;i++){const t=2*Math.PI*i/N; P.push([e.h+e.a*Math.cos(t),e.k+e.b*Math.sin(t)]);}
    if(e.t==='parV'){ const span=B.x1-B.x0; for(let i=0;i<=N;i++){const x=B.x0-1+(span+2)*i/N; P.push([x,e.p*(x-e.h)**2+e.k]);}
      const u=Math.sqrt(Math.abs((B.y1-B.y0+Math.abs(e.k))/e.p))+2; for(let i=0;i<=N;i++){ const x=e.h-u+2*u*i/N; P.push([x,e.p*(x-e.h)**2+e.k]); } }
    if(e.t==='parH'){ const span=B.y1-B.y0; for(let i=0;i<=N;i++){const y=B.y0-1+(span+2)*i/N; P.push([e.p*(y-e.k)**2+e.h,y]);}
      const u=Math.sqrt(Math.abs((B.x1-B.x0+Math.abs(e.h))/e.p))+2; for(let i=0;i<=N;i++){ const y=e.k-u+2*u*i/N; P.push([e.p*(y-e.k)**2+e.h,y]); } }
    if(e.t==='hipH'||e.t==='hipV'){ const T=Math.asinh(Math.max(X,Y)/Math.min(e.a,e.b))+1;
      for(let i=0;i<=N;i++){ const t=-T+2*T*i/N, c=Math.cosh(t), s=Math.sinh(t);
        if(e.t==='hipH'){ P.push([e.h+e.a*c,e.k+e.b*s]); P.push([e.h-e.a*c,e.k+e.b*s]); } else { P.push([e.h+e.a*s,e.k+e.b*c]); P.push([e.h+e.a*s,e.k-e.b*c]); } } }
    if(e.t==='rectas'){ for(let i=0;i<=N;i++){ const x=-X+2*X*i/N; P.push([x,x]); P.push([x,-x]); } }
    if(e.t==='punto') P.push([e.h,e.k]);
    return P; }
  // distancia de un punto a una nube densa (rejilla para buscar rápido)
  function index(P,cs){ const m=new Map(); for(const q of P){ const key=Math.floor(q[0]/cs)+','+Math.floor(q[1]/cs); (m.get(key)||m.set(key,[]).get(key)).push(q);} return {m,cs}; }
  function near(I,q){ const i=Math.floor(q[0]/I.cs), j=Math.floor(q[1]/I.cs); let d=Infinity; for(let a=-1;a<=1;a++) for(let c=-1;c<=1;c++){ const L=I.m.get((i+a)+','+(j+c)); if(L) for(const r of L){ const t=Math.hypot(r[0]-q[0],r[1]-q[1]); if(t<d) d=t; } } return d; }
  function segDist(q,s){ const ax=s.a[0],ay=s.a[1],bx=s.b[0],by=s.b[1],dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy; let t=l?((q[0]-ax)*dx+(q[1]-ay)*dy)/l:0; t=Math.max(0,Math.min(1,t)); return Math.hypot(ax+t*dx-q[0],ay+t*dy-q[1]); }
  const center=e=>e.t==='circ'||e.t==='elip'||e.t.startsWith('hip')||e.t==='punto'?[e.h,e.k]:e.t.startsWith('par')?[e.h,e.k]:[0,0];
  const sizeOf=e=>e.t==='circ'?e.r:e.t==='elip'||e.t.startsWith('hip')?Math.max(e.a,e.b):3;

  for(const c of C){
    const e=c.e; let [cx,cy]=center(e), span=Math.min(40,Math.max(10,4.5*sizeOf(e))); if(c.view) [cx,cy,span]=c.view; setView(cx,cy,span);
    let eq; try{ eq=compileEq(c.eq); }catch(err){ res(c.g,c.n,'lectura',false,'no se pudo leer: '+err.message); continue; }
    const pb=canonicalProblem(eq);
    res(c.g,c.n,'aceptada como canónica',true,pb?('el juego la rechaza: «'+pb+'»'):'sí');
    // 1. clasificación
    const s=classify(eq.F); const close=(u,v)=>Math.abs(u-v)<1e-6*(1+Math.abs(v));
    let okc, det='obtuvo '+JSON.stringify(Object.fromEntries(Object.entries(s).map(([k,v])=>[k,typeof v==='number'?f3(v):v])));
    if(e.t==='circ') okc=s.type==='circunferencia'&&close(s.h,e.h)&&close(s.k,e.k)&&close(s.r,e.r);
    else if(e.t==='elip') okc=s.type==='elipse'&&close(s.h,e.h)&&close(s.k,e.k)&&close(s.a,e.a)&&close(s.b,e.b);
    else if(e.t==='parV') okc=s.type==='parábola'&&s.vert&&close(s.h,e.h)&&close(s.k,e.k)&&close(s.p,e.p);
    else if(e.t==='parH') okc=s.type==='parábola'&&!s.vert&&close(s.h,e.h)&&close(s.k,e.k)&&close(s.p,e.p);
    else if(e.t==='hipH') okc=s.type==='hipérbola'&&s.horiz&&close(s.h,e.h)&&close(s.k,e.k)&&close(s.a,e.a)&&close(s.b,e.b);
    else if(e.t==='hipV') okc=s.type==='hipérbola'&&!s.horiz&&close(s.h,e.h)&&close(s.k,e.k)&&close(s.a,e.a)&&close(s.b,e.b);
    else if(e.t==='vacia') okc=s.type==='vacía';
    else okc=s.type==='degenerada';
    res(c.g,c.n,'clasificación',okc,det);
    // 2-4. dibujo
    const I=c.iv?parseInterval(c.iv):null;
    const segs=buildSegs(eq.F,I), B=curveBounds(), cell=Math.max((B.x1-B.x0)/Math.max(220,Math.round(W/1.6)),1e-9);
    const P=exact(e,B), IX=index(P,Math.max(cell,0.05));
    if(e.t==='vacia'||e.t==='punto'){ res(c.g,c.n,'dibujo',segs.length===0,segs.length?`dibuja ${segs.length} trazos donde no hay curva`:'no dibuja nada (correcto)'); continue; }
    const tolP=Math.max(0.02,0.25*cell); let worst=0, bad=0;
    for(const sg of segs) for(const q of [sg.a,sg.b,[(sg.a[0]+sg.b[0])/2,(sg.a[1]+sg.b[1])/2]]){ const d=near(IX,q); if(d>worst) worst=d; if(d>tolP) bad++; }
    res(c.g,c.n,'precisión del trazo',segs.length>0&&bad===0,`${segs.length} trazos; mayor distancia a la curva exacta ${f3(worst)} (tolerancia ${f3(tolP)})`);
    // cobertura: puntos exactos dentro del mapa (con margen de una celda)
    const m=cell*1.5, inside=P.filter(q=>q[0]>B.x0+m&&q[0]<B.x1-m&&q[1]>B.y0+m&&q[1]<B.y1-m);
    const grid=new Map(), gs=cell*2; segs.forEach(sg=>{ for(const q of [sg.a,sg.b]){ const k=Math.floor(q[0]/gs)+','+Math.floor(q[1]/gs); (grid.get(k)||grid.set(k,[]).get(k)).push(sg); } });
    const tolC=Math.max(0.03,0.6*cell); let miss=0, gap=0, firstMiss=null;
    for(let i=0;i<inside.length;i+=4){ const q=inside[i], gi=Math.floor(q[0]/gs), gj=Math.floor(q[1]/gs); let d=Infinity;
      for(let a=-1;a<=1;a++) for(let cc=-1;cc<=1;cc++){ const L=grid.get((gi+a)+','+(gj+cc)); if(L) for(const sg of L) d=Math.min(d,segDist(q,sg)); }
      if(d>tolC){ miss++; if(!firstMiss) firstMiss=q; } if(d>gap&&d<Infinity) gap=d; }
    const n=Math.ceil(inside.length/4);
    res(c.g,c.n,'cobertura (sin huecos)',n>0&&miss===0,n?`${miss} de ${n} puntos de la curva sin dibujar`+(firstMiss?` (ej. cerca de (${f3(firstMiss[0])}, ${f3(firstMiss[1])}))`:''):'la curva no pasa por el mapa');
    // restricción
    if(I){ const v=I.v==='x'?0:1; let wrong=0, missIn=0;
      for(const sg of segs){ const mm=[(sg.a[0]+sg.b[0])/2,(sg.a[1]+sg.b[1])/2]; const inside2=mm[v]>=I.lo-1e-9&&mm[v]<=I.hi+1e-9; if(sg.in&&mm[v]<I.lo-cell||sg.in&&mm[v]>I.hi+cell) wrong++; if(!sg.in&&mm[v]>I.lo+cell&&mm[v]<I.hi-cell) missIn++; }
      res(c.g,c.n,'restricción '+c.iv,wrong===0&&missIn===0,`${wrong} trazos marcados como camino fuera de la restricción; ${missIn} dentro sin marcar`); }
    // 5. recorrido de Vector desde un punto de la curva, en los dos sentidos
    const L0={...LEVELS[TI],obstacles:[],goal:[1e6,1e6]};
    // salida: un punto de la curva visible en el mapa base (Vector no camina fuera de él), lejos de cruces
    const BB=window.__euclidia.t.baseBounds(), mx=(BB.x1-BB.x0)*0.1, my=(BB.y1-BB.y0)*0.15;
    const vis=inside.filter(q=>(!I||inI(I,q,0))&&q[0]>BB.x0+mx&&q[0]<BB.x1-mx&&q[1]>BB.y0+my&&q[1]<BB.y1-my);
    const want=e.t==='rectas'?2:0, st=vis.sort((a,b2)=>Math.abs(Math.hypot(a[0]-cx,a[1]-cy)-want)-Math.abs(Math.hypot(b2[0]-cx,b2[1]-cy)-want))[0];
    if(!st) res(c.g,c.n,'recorrido de Vector',true,'la curva no pasa por la parte visible del mapa');
    if(st){ let wd=0, out=0, pts=0;
      for(const sg of [1,-1]){ const w=walk(eq.F,st,sg,I,L0); pts+=w.pts.length; for(const q of w.pts){ const d=near(IX,q); if(d>wd) wd=d; if(I&&!inI(I,q,1e-6)) out++; } }
      res(c.g,c.n,'recorrido de Vector',pts>10&&wd<0.01&&out===0,`${pts} pasos; mayor distancia a la curva ${f3(wd)}`+(I?`; ${out} pasos fuera de la restricción`:'')); }
  }
  // Editor tipo cuaderno: LaTeX → texto → misma curva
  for(const [tex,plain] of TEX){ let ok=false, det='';
    try{ const a=compileEq(tex2plain(tex)), r=compileEq(plain); let md=0;
      for(let i=0;i<60;i++){ const x=-5+10*Math.random(), y=-5+10*Math.random(); md=Math.max(md,Math.abs(a.F(x,y)-r.F(x,y))/(1+Math.abs(r.F(x,y)))); }
      ok=md<1e-9; det=`«${tex2plain(tex)}»`+(ok?'':` difiere de ${plain} (error ${md})`); }catch(err){ det='error: '+err.message; }
    res('Editor tipo cuaderno',tex,'LaTeX igual a '+plain,ok,det); }
  // Datos de los niveles: monedas sobre la curva, salida y meta sobre la curva, ecuación general = canónica
  for(const Lv of LEVELS.slice(0,TI)){ const Fs=Lv.targets.map(t=>compileEq(t).F);
    const onAny=q=>Math.min(...Fs.map(F=>dist2(F,q)));
    res('Niveles',Lv.title,'salida sobre la curva',dist2(Fs[0],Lv.start)<0.01,'distancia '+f3(dist2(Fs[0],Lv.start)));
    res('Niveles',Lv.title,'meta sobre la curva',dist2(Fs[Fs.length-1],Lv.goal)<0.01,'distancia '+f3(dist2(Fs[Fs.length-1],Lv.goal)));
    Lv.coins.forEach(cn=>res('Niveles',Lv.title,`moneda (${cn}) sobre la curva`,onAny(cn)<0.05,'distancia '+f3(onAny(cn))+' (Vector la recoge a menos de 0,22)'));
    Lv.obstacles.forEach(o=>res('Niveles',Lv.title,`obstáculo (${o}) cerca de la curva (para que el lado equivocado choque)`,true,'distancia '+f3(onAny(o))));
    if(Lv.general){ const G=compileEq(Lv.general).F, T=Fs[0]; let ratio=null, md=0;
      for(let i=0;i<40;i++){ const x=-5+10*Math.random(), y=-5+10*Math.random(), g=G(x,y), t=T(x,y); if(Math.abs(t)<1e-6) continue; const r=g/t; if(ratio==null) ratio=r; md=Math.max(md,Math.abs(r-ratio)/Math.abs(ratio)); }
      res('Niveles',Lv.title,'ecuación general equivale a la canónica',md<1e-9,`general = ${f3(ratio)} × canónica`); }
  }
  return R; },{C,TEX});
 await b.close();
 const groups=[...new Set(out.map(r=>r.grupo))]; let pass=0, fail=0; const lines=[];
 for(const g of groups){ lines.push(`\n## ${g}`); for(const r of out.filter(r=>r.grupo===g)){ r.ok?pass++:fail++; lines.push(`${r.ok?'PASA ':'FALLA'} | ${r.caso} | ${r.prueba} | ${r.det}`); } }
 console.log(lines.join('\n')); console.log(`\nTotal: ${pass} pasan, ${fail} fallan.`+(errs.length?' Errores de la página: '+errs.join('; '):''));
 fs.writeFileSync(path.join(__dirname,'resultados.json'),JSON.stringify(out,null,1));
 process.exitCode=fail?1:0;
})();
