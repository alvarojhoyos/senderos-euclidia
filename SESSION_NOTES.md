# Notas de traspaso: modo estudio y banco amplio

Plan aprobado por Alvaro (2026-11-26), un PR por etapa:
1. **Taller de Coni + maestro Apolonio** — hecho, PR #12 (rama `claude/project-thread-offm5n`), esperando revisión de Alvaro.
2. **Práctica sin fin** — hecho y aprobado por Alvaro (2026-11-26 22:43 Bogotá), PR #13 (rama `claude/project-thread-kr0m2u`). También aprobó la entrada sin documento (commit 71aa903 del #13).
3. **Banco de datos variados** — hecho (52 niveles nuevos y todo el banco en cadenas por dificultad), PR #14 apilado sobre el #13 (rama `claude/project-thread-dngk74`), aprobado por Alvaro el 2026-11-27. Doc: https://claude.ai/artifact/BzsuiVXUm2tjJuzcVgyoqX
3b. **Menú principal + modo aventura con candados** (pedido de Alvaro, 2026-11-26 22:43) — hecho, PR apilado sobre el #14 (rama `claude/project-thread-6loujp`, que además trae el commit de entrada sin documento del #13). Adelanta parte de la etapa 4: los desbloqueos ya existen; falta que cada zona enseñe algo con Apolonio.
4. **Modo historia** — hecho, PR #16 (rama `claude/project-thread-4ynul0`, apilada sobre el #15), esperando revisión de Alvaro: lección de Apolonio antes de cada valle, repaso en el Gran Mapa, `?modo=estudio` y enlaces del profesor.
5. **Evaluación como una sola saga** — hecho de noche (2026-11-27, encargo de Alvaro mientras dormía), PR #18 apilado sobre el #17 (rama `claude/project-thread-h5xgfs`), esperando su revisión.
6. **Cierre** — hecho de noche (2026-11-27, mismo encargo), PR apilado sobre el #18 (rama `claude/project-thread-77azem`), esperando su revisión. Trae además el PR #11 ya integrado (ver «Estado final y orden de fusión»).

## Qué hay en la etapa 1 (index.html)
- Bloque `/* ============ El Taller de Coni ... */` antes de `window.__euclidia`: `tModel()` calcula ecuación, forma general y partes de la cónica actual (`TS`); `tRender()` arma controles y lista; `tDraw()` dibuja en `#tCanvas`; `tTry()` lee una ecuación con `compileEq`/`classify`.
- `miniApolonio()` (pixel art), `TALK` (frases por cónica), `RETOS` (retos con su condición y felicitación; hechos en `euclidia2-retos`).
- `?modo=taller` abre el Taller antes de la historia/registro (`wantTaller`, `beginGame`). Oculto durante una evaluación.
- Historia del inicio: 4 viñetas (nueva: «El maestro Apolonio»).
- Pruebas: `pruebas/taller.test.js` (11). Todas las demás pasan.

## Qué hay en la etapa 2 (index.html)
- Bloque `/* ============ Práctica sin fin ... */` justo antes de `if(wantTaller)`. Botones «Explorar / Practicar sin fin» (`#tMode`) bajo Apolonio; `tPracSet(on)` cambia de modo. `?modo=practica` abre el Taller ya en la práctica.
- `PR` = generadores por cónica (circ 3, elip 3, para 4, hip 3 bases; cada una con 2–3 preguntas → 29 tipos). Cada ejercicio: `st` (estado del taller), `dan` (texto), `draw` (lo que se dibuja), `halla`, `kind` (num, point, line, eq), `ans`, `pista`, `why(v)` (errores típicos).
- `pracCheck(X, texto)` → ok / warn (ecuación correcta pero no canónica) / bad (mensaje matemático + pista, y la ruta fallida para dibujar). Nunca muestra la respuesta; se ve la curva completa solo al acertar.
- Conteo local `euclidia2-practica` {ok, tries, racha, mejor}; no se envía. «¿Qué fórmula uso?» es gratis (no es una pista con monedas).
- `tDraw` usa `tPM` en la práctica: datos en naranja, ruta fallida en rojo punteado.
- Pruebas: `pruebas/practica.test.js` (11; ~1450 ejercicios al azar).

## Qué hay en el menú principal (etapa 3b, index.html)
- Decisiones de Alvaro (2026-11-27, 01:02–01:40 Bogotá): al entrar se presenta LA HISTORIA (viñetas), no la aventura; después el menú para ir a donde quiera. Con enlace de evaluación: la historia y luego solo lo que el profesor puso (quiz), sin menú. El menú lleva «Instrucciones y tutorial». Aprobó: profesor con todos los niveles abiertos.
- Entrada: `beginGame` muestra la historia CADA VEZ que se abre el juego (también al recargar en la misma pestaña; Alvaro 2026-11-27 02:14: «no sale La historia cuando entra un nuevo jugador»), y también con «Cambiar de jugador» / «No soy X». Luego `startFlow` (rol, registro u «Hola de nuevo») y `openMenu()`. Con evaluación (`SESSION`) `openMenu` no hace nada y queda «Empezar el quiz». Las pruebas automáticas ponen `euclidia2-pruebas` en localStorage para entrar directo al nivel (sin historia ni menú); menu, registro y toques prueban la entrada real. `?modo=taller|practica` abre el Taller y al cerrarlo sigue la entrada normal.
- Menú `#menu` (botón «☰ Menú» en el juego y en el Gran Mapa): Modo aventura (abre el Gran Mapa), Instrucciones y tutorial (`#howto`: cómo se juega en 7 puntos + «Jugar el tutorial»), Taller de Coni (Explorar / Practicar sin fin), Panel del profesor (solo profesor); pie: cambiar de jugador, ir al nivel donde estaba. La historia NO está en el menú (queda «Ver la historia» en el pie del juego). Bloque `/* ============ Menú principal */` antes de `if(!wantTaller) beginGame()`.
- Gran Mapa `#mapa`: «Continuar la aventura» (`advResume`: último nivel abierto sin superar, `euclidia2-ultimo`), valles por mundo (`#advList`), candados en las regiones sin niveles abiertos, medallas.
- Desbloqueo (bloque `/* ============ Modo aventura */` antes de `renderLevels`): `advState()` → {open, why}. Tutorial en orden → primer valle de cada cónica; en un valle cada nivel abre el siguiente; terminar un valle abre el siguiente del mundo; Identificar y Mixtos al terminar el primer valle de las 4 cónicas. Lo superado queda abierto. Profesor y evaluación: todo abierto. `nextIdx` salta cerrados y si no hay más busca con `advNext`.
- Barra de niveles: cerrados con candado; al tocarlos `#lockNote` explica qué terminar. API de pruebas: `window.__euclidia.adv`.
- Pruebas: `pruebas/menu.test.js` (29).
- Visto al probar: en un celular de 320 px de ancho el panel del nivel se salía 13 px por la derecha (arreglado en la etapa 6).

## Qué hay en la etapa 4 (modo historia, PR #16, rama `claude/project-thread-4ynul0`, apilada sobre el #15)
- Bloque `/* ============ Modo historia ... */` justo antes de `window.__euclidia`. `LECCIONES` = una lección por cadena (30), clave = nombre de la cadena: {t, f (fórmula; dos espacios separan alternativas), p (párrafos), ex (estado del Taller, opcional), parts (claves de partes de `tModel`)}. Identificar y Mixtos no traen `ex` (sin dibujo).
- `showLesson(L,then,review)` abre el modal `#leccion` (después de `#lore`): Apolonio, texto, fórmula, dibujo `lecFig` y lista de partes con `tModelOf(ex)`. `needLesson(L)`: primera vez en ese valle y sin evaluación. Vistas en `euclidia2-lecciones`.
- Enganches sin tocar el código del menú: se reasignan `openLevel` (lección antes de la historia), `openMap` (sección «Lecciones de Apolonio» `#lecRepaso` insertada tras `#advWhy`), `renderHints` y `loadLevel` (Apolonio en pistas y lecciones del tutorial) `openMenu` (con `?modo=estudio`, después de la historia y el registro abre el Gran Mapa una vez en vez del menú) y `openTeacher` (enlaces del modo estudio). Ojo: el script es un IIFE, `openLevel` no es global; desde pruebas usar `window.__euclidia.openLevel`.
- `?modo=estudio`: `wantStudy` (antes del bloque del menú) pone rol estudiante si no hay rol; no pide documento (sin `rol=estudiante`).
- Panel del profesor: sección `#estLinks` con enlaces y QR de `?modo=estudio|taller|practica`.
- Pruebas: `pruebas/lecciones.test.js` (19). Revisa que ningún ejemplo sea la respuesta de un nivel: al agregar niveles puede fallar; cambiar el `ex` de la lección (y su texto si lo menciona).
- La rama del #15 no traía los últimos commits del #14 (36 niveles): el hilo del #15 ya los trajo (39c8930) y esta rama está al día con el #15.

## Panel del profesor reorganizado (pedido de Alvaro, 2026-11-27 03:06 Bogotá; PR apilado sobre el #16, rama `claude/project-thread-tkb1kn`)
- El panel (`#teacher`) tiene tres vistas: `#tHome` pregunta «Generar una prueba» (`#tGoEv`) o «Compartir con estudiantes (solo estudio)» (`#tGoEst`); `#tEv` (1. largo, tiempo y nombre; 2. hoja de resultados; 3. crear el QR, que solo aparece después de crear la prueba, `#qrWrap`); `#tEst` (un solo QR y enlace `?modo=estudio`). `openTeacher(v)` con v = "home" | "ev" | "est" (sin argumento conserva la vista; la variable es `pView`, porque `tView` ya es del Taller). `drawQR(box,url,size,fail)` dibuja cualquier QR.
- Largos (`EV_PRESET`, `EV_MIN`, `EV_LEN`): corta 6 niveles (uno medio por mundo, 20 min), media 12 (por cónica fácil + medio; Identificar y Mixtos medio + difícil, 40 min), larga 20 (como antes, 60 min). Por defecto la media. Elegir un largo pone el tiempo sugerido; la tabla queda en «Elegir los niveles a mano» y si se cambia dice «Personalizada». Los QR viejos `id-CEPH-c|l-min` usan `EV_LEGACY` (la corta vieja = 16) para no cambiar de significado.
- `?modo=estudio` = `STUDY` (declarado junto a `EV`): entra como estudiante normal (historia → nombre → menú completo), sin documento (`needDoc`), sin evaluación aunque haya una guardada (`EV=null` solo en esa visita), sin «Terminar y enviar» (`doneUI`) y sin enviar nada (`queueResult` no encola, `flush` avisa «Modo estudio…»). Si el aparato estaba como profesor, en esa visita entra como estudiante sin guardar el cambio. Se quitó el salto directo al Gran Mapa y la lista de tres enlaces (estudio, taller, práctica); `?modo=taller|practica` siguen funcionando si alguien los tiene.
- Pruebas: `pruebas/panel.test.js` (21). Se ajustaron `evaluacion.test.js` (entra por «Generar una prueba», `#evZero`) y `lecciones.test.js` (estudio → menú; un solo enlace).
- Publicado en el enlace privado de prueba (versión 10). La extensión de Chrome no estaba conectada, así que la verificación fue descargando la página publicada y corriendo `panel.test.js` sobre ella (21/21, iPhone SE y laptop).

## Qué hay en la etapa 5 (evaluación como saga, rama `claude/project-thread-h5xgfs`, apilada sobre el #17)
- Reparto (`sessionFor`): por mundo y dificultad, los valles (cadenas) de esa dificultad se barajan, se ponen uno tras otro y se toma un tramo SEGUIDO de N niveles desde un punto al azar (puede acabar un valle y seguir con el comienzo del otro). Así N niveles de una dificultad salen de 1 o 2 valles. Orden: mundo por mundo (C, E, P, H, I, X), de fácil a difícil. La misma prueba y el mismo documento dan siempre lo mismo. Ojo: cambió qué niveles le tocan a cada documento respecto a antes (no importa porque aún no se ha publicado).
- Cambio pedido por Alvaro (2026-11-27 13:18 Bogotá): en la evaluación cada nivel se entiende solo; las referencias a niveles o lugares anteriores pueden quedar en el modo aventura, no en la prueba. Por eso la saga NO usa los nombres de los valles (en las cadenas viejas el nombre del valle no coincide con los escenarios: «El Lago Redondo» tiene Luna, volcán y ciudad): cada tramo se presenta con la región de su escenario (`SCENE_OF` → `REGIONS`).
- Bloque de la saga justo después de `sessionFor`: `sagaOf(order)` (agrupa por mundo), `sagaPos(id)` (k, n, región, tramo anterior), `sagaBridge(P,L)` (puente solo al cambiar de mundo o de región, con `SAGA_REG`/`SAGA_WORLD`), `showSagaIntro` (prólogo), `sagaWin`, `sagaEnd` (epílogo).
- Flujo del estudiante: aviso («una saga de N niveles por W mundos»); «Empezar el quiz» → prólogo en `#lore` («La saga de hoy», ruta `#loreRoute` por mundos con tramos y dificultades) → «¡En marcha!» → historia del tramo 1. Cada historia: «Tramo k de N · región»; si cambia de mundo, «Coni entra en el mundo de las elipses, por el hielo del glaciar.»; si cambia de región, «Coni deja atrás… y sigue hacia…». Al ganar: «Tramo k de N de la saga» y el mundo que sigue; botón «Seguir la saga». Epílogo con tramos superados.
- Barra de niveles en la evaluación: por dificultad (como antes).
- Panel del profesor: `#evSagaBox`, ejemplo de ruta por mundos con los títulos de los niveles.
- Textos corregidos en `LORE` (valen para los dos modos): C2 (ya no dice «laguna vecina»), C8 (ya no «volver del observatorio»), C13 (ya no nombra el Barrio de las Fuentes), H16 (ya no «las dos últimas torres»). `saga.test.js` revisa que ninguna historia nombre otro valle ni dependa del nivel anterior.
- `hideLore` llama a `loreThen` (si hay); `showLore` lo borra, así un nivel normal no hereda el prólogo.
- Pruebas: `pruebas/saga.test.js` (30; celular iPhone SE y laptop).

### Decisiones tomadas de noche (para que Alvaro las revise)
- Sin lecciones de Apolonio en la evaluación: la prueba evalúa, no enseña. Apolonio solo «marca la ruta» en el prólogo.
- Reparto: por mundo y dificultad, tramo seguido de las cadenas desde un punto al azar (variedad: 8 opciones con 1 nivel medio de circunferencias). Como cada nivel ya se entiende solo, empezar a mitad de valle no afecta la historia (Alvaro preguntó, 2026-11-27).

### Pendiente para el modo aventura
- Resuelto en la rama `claude/project-thread-p7kp2y` (ver «Valles alineados con su lugar»).

## Valles alineados con su lugar (pedido de Alvaro, 2026-11-27; rama `claude/project-thread-p7kp2y`, apilada sobre la etapa 6)
- Regla nueva: cada valle (cadena) está en UN solo lugar. Sus niveles se dibujan con el mismo escenario, cuentan en la misma región del Gran Mapa, y el título, el enunciado, la historia (`LORE`), las pistas y los errores nombran cosas de ese lugar. `historia.test.js` lo revisa (un lugar por valle, títulos sin repetir).
- Se conservó lo que importa para la nota y las lecciones: nadie cambió de dificultad ni de mundo, y cada nivel quedó en el valle cuya lección de Apolonio corresponde a lo que practica. Solo se cambiaron de valle 3 pares (dentro de la misma dificultad): C2 ↔ C8 (Torre del Reloj / Observatorio Lunar), E13 ↔ E19 (Órbitas del Cometa / Valle Ovalado), P13 ↔ P18 (Puerto de las Antenas / Valle de los Toboganes). La matemática de ningún nivel cambió.
- Valles renombrados (la lección va con el valle): La Torre del Huevo → El Lago Helado; El Desfiladero → La Boca de la Cueva; La Cueva del Oeste → El Cañón del Eco; El Mirador → El Mirador del Lago; La Puerta Sellada → El Museo de Euclidia; Las Cúpulas → El Camino del Lago; El Valle y el Túnel → La Cueva Honda.
- Lugar de cada valle de los niveles originales: Lago Redondo = lago; Observatorio Lunar = Luna; Torre del Reloj = ciudad; Volcán Dormido = volcán; Valle Ovalado = pradera; Órbitas del Cometa = Luna; Lago Helado = hielo; Cinturón de Satélites = Luna; Glaciar = hielo; Valle de los Toboganes = pradera; Puerto de las Antenas = costa; Río de Costado = río (P2, P4, P6, P8 en `RIVER`); Cumbres Heladas = hielo; Mina Profunda = cueva; Boca de la Cueva = cueva; Géiseres = géiseres; Túneles Profundos = cueva; Mirador del Lago = lago; Museo de Euclidia = ciudad; Camino del Lago = lago; Cueva Honda = cueva.
- 39 niveles cambiaron de escenario y, con él, de título y de historia (p. ej. C5 «La Órbita de la Luna» → «La Isla de las Garzas»; H4 «Faros del Desfiladero» → «Las Dos Fumarolas»; P7 «Faro Lateral» → «La Lámpara del Minero»). En los Escapes la historia nombra el objeto que se recoge en ese lugar (perlas, polvo de estrella, semillas, cristales…). `SCENE_PROPS` quedó vacío: los adornos van en el campo `props` del nivel (muelle en C5, fuente en C2, faroles en E4).
- `SCENE_OF` se reescribió agrupado por lugar. El script que hizo el cambio está en archivos del proyecto: `senderos-euclidia/banco/alinear-valles.js` (tabla de valles, títulos, enunciados e historias).
- Pruebas ajustadas: `toques.test.js` toma los niveles del lago desde `SCENE_OF` (ya no una lista fija); `lecciones.test.js` usa C6 como nivel de «otro valle» (C2 pasó a la Torre del Reloj).
- Después de fusionar: los docs del banco y la guía del profesor todavía usan los nombres y títulos viejos.

## Qué hay en la etapa 6 (cierre, rama `claude/project-thread-77azem`)
- Arreglo de celular: en 320 px el panel del nivel se salía 13 px. La causa era la columna de la grilla de `.panel` (crecía con el teclado y con el botón de pistas, que no partía su texto). Ahora `.panel` tiene `grid-template-columns:minmax(0,1fr)`, `.hints` igual y `.hints .btn{white-space:normal}`.
- Nueva `pruebas/cierre.test.js` (25): recorre la entrada real (historia → nombre → menú), instrucciones, Gran Mapa, lección de Apolonio, nivel, Taller (explorar y práctica), panel del profesor (inicio, prueba, prueba creada, solo estudio), `?modo=estudio` y la prueba como saga (aviso, prólogo, nivel, prueba terminada) en iPhone SE (320 px), 375 px, Pixel 7 y laptop: 18 pantallas por ancho, sin desplazamiento horizontal ni elementos fuera, sin errores de JavaScript. Con el index.html anterior falla en 320 px (así se comprobó que detecta el problema).
- **PR #11 integrado en esta rama** (merge de `restriccion-salida`): chocaba con la reorganización del banco (#14) en la lista de niveles. Se resolvió nivel por nivel y campo por campo (base = main, nuestro = la pila, suyo = #11): de la pila quedan chain/step/diff y lo nuevo; del #11, las respuestas y errores con la restricción en la salida (P1–P12, H1–H12, I2, I3; t3 y t4 entraron sin choque). No hubo ningún campo cambiado por los dos lados.
- Guía del profesor actualizada (https://claude.ai/artifact/CmkjC3Qf3DaoJLz3qyuqT3): pasos del panel nuevo, largos 6/12/20 con tiempos, tabla a mano, la prueba como saga (aviso, prólogo, «Seguir la saga»), QR de solo estudio, modo aventura, lecciones de Apolonio y Taller. Ojo: describe la versión que aún no está publicada en el sitio de estudiantes.
- Enlace privado de prueba republicado (versión 13) y verificado descargando la página publicada y corriendo `cierre.test.js` sobre ella (25/25).

## Estado final y orden de fusión (para Alvaro)
Todo está en ramas apiladas, sin fusionar. Cada PR tiene como base la rama del anterior:
main ← #12 (Taller) ← #13 (práctica) ← #14 (banco) ← #15 (menú) ← #16 (modo historia) ← #17 (panel) ← #18 (saga) ← PR de la etapa 6 (cierre + #11).
- Orden recomendado (decisión tomada de noche, para que Alvaro la revise): fusionar de abajo hacia arriba, #12 → #13 → #14 → #15 → #16 → #17 → #18 → etapa 6, cada uno con «Create a merge commit» (no squash ni rebase, para que la pila no se rompa). Al fusionar uno, GitHub cambia la base del siguiente a main. El #11 queda dentro de la etapa 6, así que GitHub lo marca como fusionado solo al llegar a main; no hay que fusionarlo aparte.
- Por qué no «#11 primero» (lo que estaba anotado): el #11 está hecho sobre el banco viejo de 56 niveles y choca con el #14 en la lista de niveles. Fusionarlo primero obliga a resolver ese choque a mano al fusionar el #14. Si Alvaro prefiere ese orden, el choque se resuelve igual que aquí (campo por campo) en la rama del #14.
- Después de fusionar: actualizar los docs del banco y la skill diseñar-nivel con la regla del #11 (restricción en la salida) y la organización por valles de una sola dificultad; pedirle a Alvaro una captura de uso antes de publicar (comparar gasto con la línea base).
- Decisiones de noche que siguen abiertas para su revisión: las de la etapa 5 (abajo) y este orden de fusión.

## Qué hay en la etapa 3 (index.html)
- Banco: 108 niveles, 294 monedas, en 30 cadenas. Cada cadena tiene UNA dificultad (pedido de Alvaro): por cónica 6 cadenas de 4 (fácil, fácil, medio, medio, difícil, difícil); identificar y mixtos 3 cadenas de 2 (fácil, medio, difícil). El mapa completo de cadenas está en el doc.
- 52 niveles nuevos: C13–C24, E13–E24, P13–P24, H13–H24, I5–I6 (I6 en forma general) y X5–X6 (mixtos fáciles). Historias en `LORE`, regiones en `SCENE_OF`.
- Campo `datos` (lista de {t, v...}) en los nuevos; `pruebas/datos.test.js` lo revisa contra `classify` y contra el texto `story` (193 datos). Tipos: centro, área, diámetro, perímetro, tangente, tangenteRecta, centroRecta, centroEje, pasa, vértice, foco, ejeMayor, ejeMenor, ejeConjugado, e, suma, diferencia, distFocos, abre, ladoRecto, directriz, asíntota. Solo van datos que la historia da (no derivados).
- Adornos en pixel nuevos en `paintProps` (campo `props` del nivel): farola, fuente, antena, torre, boya, planeta. Se pintan una vez en la capa del escenario (sin costo por cuadro). Se ponen solo en puntos que el texto da.
- Las abiertas llevan la restricción en la salida (regla del PR #11).
- Herramientas en archivos del proyecto `senderos-euclidia/banco/`: `datos-variados.js` y `gen2.js` (fichas; `view()` calcula la vista 4:3, `ext` amplía la vista), `verificar-datos-variados.js` (juega cada ficha en el juego real), `insertar-datos-variados.js`, `reorg.js` (mapa de cadenas `CH` y adornos `PROPS`; reescribe chain/step/diff), `doc-datos-variados.js` y `doc2.js` (tablas del doc). Para crecer el banco: añadir fichas, verificar, insertar, agregar la cadena en reorg.js.
- Vista del mapa: el lienzo es 4:3 (alto = 0,75·span) y Coni se detiene a ~0,07·span del borde de arriba; `span = max((w+1,4)/0,94, (h+1,6)/0,66, 10)`.
- Todas las pruebas pasan (2026-11-27): niveles 391, curvas 951, datos 193, ocultos 45 (19 de forma general), evaluación 27, historia 14, toques 13, taller 11, práctica 11, restricciones 9.

## Pendiente / preguntas abiertas
- Etapa 3 aprobada (2026-11-27). Doc del banco v2: https://claude.ai/artifact/BzsuiVXUm2tjJuzcVgyoqX
- Etapa 4 (PR #16) y menú (PR #15): aprobados por Alvaro el 2026-11-27. Panel del profesor reorganizado (PR #17): aprobado por encargo de Alvaro (2026-11-27 3:07 Bogotá). Etapas 5 y 6: falta su revisión.
- Pedido de Alvaro (coordinador): captura de uso para comparar gasto cuando haya unas 3 etapas con la nueva modalidad.

## Ahorro (pedido de Alvaro, 2026-11-26)
Tests y lecturas largas en subagentes; salida de comandos resumida; no cambiar modelo ni esfuerzo en un hilo; cada etapa puede arrancar en un hilo nuevo desde esta nota.

## Enlace privado de prueba
https://claude.ai/artifact/S7vw43UrnusmURTwi9MY2G (no es el sitio de estudiantes). Se arma desde index.html: cambiar las 6 primeras líneas (doctype…title) por las 2 de cabecera del artefacto («Euclidia en prueba»), quitar `</head>\n<body>` y cerrar con `</body></html>`; mathlive.min.js ya está como archivo aparte y se conserva.
