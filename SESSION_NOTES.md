# Notas de traspaso: modo estudio y banco amplio

Plan aprobado por Alvaro (2026-11-26), un PR por etapa:
1. **Taller de Coni + maestro Apolonio** — hecho, PR #12 (rama `claude/project-thread-offm5n`), esperando revisión de Alvaro.
2. **Práctica sin fin** — hecho y aprobado por Alvaro (2026-11-26 22:43 Bogotá), PR #13 (rama `claude/project-thread-kr0m2u`). También aprobó la entrada sin documento (commit 71aa903 del #13).
3. **Banco de datos variados** — hecho (52 niveles nuevos y todo el banco en cadenas por dificultad), PR #14 apilado sobre el #13 (rama `claude/project-thread-dngk74`), aprobado por Alvaro el 2026-11-27. Doc: https://claude.ai/artifact/BzsuiVXUm2tjJuzcVgyoqX
3b. **Menú principal + modo aventura con candados** (pedido de Alvaro, 2026-11-26 22:43) — hecho, PR apilado sobre el #14 (rama `claude/project-thread-6loujp`, que además trae el commit de entrada sin documento del #13). Adelanta parte de la etapa 4: los desbloqueos ya existen; falta que cada zona enseñe algo con Apolonio.
4. **Modo historia** — hecho, PR #16 (rama `claude/project-thread-4ynul0`, apilada sobre el #15), esperando revisión de Alvaro: lección de Apolonio antes de cada valle, repaso en el Gran Mapa, `?modo=estudio` y enlaces del profesor.
5. Evaluación como una sola saga: el profesor elige cuántos niveles por dificultad y el juego arma una historia seguida de Coni.
6. Cierre: celular, todas las pruebas, publicación, guía del profesor.

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
- Cambio pedido por Alvaro (2026-11-27 01:02 Bogotá): la aventura NO es un apartado del menú; se presenta al entrar. Al menú le faltaba «Instrucciones y tutorial». Aprobó: quiz/QR de evaluación va directo al quiz sin menú, y el profesor ve todos los niveles abiertos.
- Entrada: `enterAdventure()` abre el Gran Mapa (modo aventura) después del registro, al elegir «Soy profesor» y tras «Hola de nuevo → Continuar». No pasa si hay evaluación (`SESSION`). Recargar en la misma pestaña (`euclidia2-tab`) sigue donde estaba (por eso las pruebas viejas no lo ven). `?modo=taller|practica` abre el Taller y al cerrarlo sigue la entrada normal.
- Menú `#menu` (botón «☰ Menú» en el juego y en el Gran Mapa): Instrucciones y tutorial (`#howto`: cómo se juega en 7 puntos + «Jugar el tutorial», que abre el primer paso sin terminar), Taller de Coni (Explorar / Practicar sin fin), La historia, Panel del profesor (solo profesor); pie: cambiar de jugador, «Volver a la aventura». Bloque `/* ============ Menú principal */` antes de `if(!wantTaller) beginGame()`.
- Gran Mapa `#mapa`: «Continuar la aventura» (`advResume`: último nivel abierto sin superar, `euclidia2-ultimo`), valles por mundo (`#advList`), candados en las regiones sin niveles abiertos, medallas.
- Desbloqueo (bloque `/* ============ Modo aventura */` antes de `renderLevels`): `advState()` → {open, why}. Tutorial en orden → primer valle de cada cónica; en un valle cada nivel abre el siguiente; terminar un valle abre el siguiente del mundo; Identificar y Mixtos al terminar el primer valle de las 4 cónicas. Lo superado queda abierto. Profesor y evaluación: todo abierto. `nextIdx` salta cerrados y si no hay más busca con `advNext`.
- Barra de niveles: cerrados con candado; al tocarlos `#lockNote` explica qué terminar. API de pruebas: `window.__euclidia.adv`.
- Pruebas: `pruebas/menu.test.js` (24).
- Visto al probar (ya pasaba antes): en un celular de 320 px de ancho el panel del nivel se sale 13 px por la derecha.

## Qué hay en la etapa 4 (modo historia, PR #16, rama `claude/project-thread-4ynul0`, apilada sobre el #15)
- Bloque `/* ============ Modo historia ... */` justo antes de `window.__euclidia`. `LECCIONES` = una lección por cadena (30), clave = nombre de la cadena: {t, f (fórmula; dos espacios separan alternativas), p (párrafos), ex (estado del Taller, opcional), parts (claves de partes de `tModel`)}. Identificar y Mixtos no traen `ex` (sin dibujo).
- `showLesson(L,then,review)` abre el modal `#leccion` (después de `#lore`): Apolonio, texto, fórmula, dibujo `lecFig` y lista de partes con `tModelOf(ex)`. `needLesson(L)`: primera vez en ese valle y sin evaluación. Vistas en `euclidia2-lecciones`.
- Enganches sin tocar el código del menú: se reasignan `openLevel` (lección antes de la historia), `openMap` (sección «Lecciones de Apolonio» `#lecRepaso` insertada tras `#advWhy`), `renderHints` y `loadLevel` (Apolonio en pistas y lecciones del tutorial) y `openTeacher` (enlaces del modo estudio). Desde el #15 toda entrada llega al Gran Mapa (`enterAdventure`), también la de `?modo=estudio`. Ojo: el script es un IIFE, `openLevel` no es global; desde pruebas usar `window.__euclidia.openLevel`.
- `?modo=estudio`: `wantStudy` (antes del bloque del menú) pone rol estudiante si no hay rol; no pide documento (sin `rol=estudiante`).
- Panel del profesor: sección `#estLinks` con enlaces y QR de `?modo=estudio|taller|practica`.
- Pruebas: `pruebas/lecciones.test.js` (19). Revisa que ningún ejemplo sea la respuesta de un nivel: al agregar niveles puede fallar; cambiar el `ex` de la lección (y su texto si lo menciona).
- `pruebas/menu.test.js` actualizado a los valles reorganizados (primer valle de circunferencias: C1, C5, C9, C13; de mixtos: X5).
- La rama del #15 no traía los últimos commits del #14 (36 niveles): se mezclaron en esta rama, junto con el commit ab0aefb del #15 (instrucciones y entrada por la aventura). Al fusionar en orden (#14, #15, #16) se resuelve solo.

## Para la etapa 5 (evaluación como una sola saga)
- El profesor ya elige cuántos niveles por dificultad (tabla del panel). Falta que el quiz se presente como una historia seguida de Coni: orden de valles con narración entre niveles (`LORE`) y quizá una lección corta de Apolonio desactivada (en evaluación no hay lecciones a propósito).
- Con N niveles de una dificultad debe salir una sola saga: revisar que el banco alcance (por cónica hay 2 cadenas por dificultad = 8 niveles).
- El PR #11 sigue abierto; los niveles nuevos ya funcionan con su regla.

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
- Etapa 4 (PR #16): falta la revisión de Alvaro en el enlace privado de prueba.
- Pedido de Alvaro (coordinador): captura de uso para comparar gasto cuando haya unas 3 etapas con la nueva modalidad.

## Ahorro (pedido de Alvaro, 2026-11-26)
Tests y lecturas largas en subagentes; salida de comandos resumida; no cambiar modelo ni esfuerzo en un hilo; cada etapa puede arrancar en un hilo nuevo desde esta nota.

## Enlace privado de prueba
https://claude.ai/artifact/S7vw43UrnusmURTwi9MY2G (no es el sitio de estudiantes). Se arma desde index.html: cambiar las 6 primeras líneas (doctype…title) por las 2 de cabecera del artefacto («Euclidia en prueba»), quitar `</head>\n<body>` y cerrar con `</body></html>`; mathlive.min.js ya está como archivo aparte y se conserva.
