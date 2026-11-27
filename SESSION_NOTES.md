# Notas de traspaso: modo estudio y banco amplio

Plan aprobado por Alvaro (2026-11-26), un PR por etapa:
1. **Taller de Coni + maestro Apolonio** — hecho, PR #12 (rama `claude/project-thread-offm5n`), esperando revisión de Alvaro.
2. **Práctica sin fin** — hecho y aprobado por Alvaro (2026-11-26 22:43 Bogotá), PR #13 (rama `claude/project-thread-kr0m2u`). También aprobó la entrada sin documento (commit 71aa903 del #13).
3. **Banco de datos variados** — hecho (muestra de 16 niveles), PR #14 apilado sobre el #13 (rama `claude/project-thread-dngk74`), esperando revisión de Alvaro. Doc: https://claude.ai/artifact/BzsuiVXUm2tjJuzcVgyoqX
3b. **Menú principal + modo aventura con candados** (pedido de Alvaro, 2026-11-26 22:43) — hecho, PR apilado sobre el #14 (rama `claude/project-thread-6loujp`, que además trae el commit de entrada sin documento del #13). Adelanta parte de la etapa 4: los desbloqueos ya existen; falta que cada zona enseñe algo con Apolonio.
4. Modo historia en el Gran Mapa: zonas que se desbloquean, cada una enseña algo (Apolonio lo explica) y luego sus niveles; enlace del profesor (`?modo=estudio`) y botón del menú.
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
- Decisiones de Alvaro (2026-11-27, 01:02–01:40 Bogotá): al entrar se presenta LA HISTORIA (viñetas), no la aventura; después el menú para ir a donde quiera. Con enlace de evaluación: la historia y luego solo lo que el profesor puso (quiz), sin menú. El menú lleva «Instrucciones y tutorial». Aprobó: profesor con todos los niveles abiertos.
- Entrada: `beginGame` muestra la historia en cada pestaña nueva (`!seen`) o si nunca se vio; luego `startFlow` (rol, registro u «Hola de nuevo») y `openMenu()`. Con evaluación (`SESSION`) `openMenu` no hace nada y queda la puerta «Empezar el quiz». Recargar en la misma pestaña (`euclidia2-tab`) no repite nada (por eso las pruebas viejas no lo ven; las que abren pestaña nueva cierran la historia con #introSkip). `?modo=taller|practica` abre el Taller y al cerrarlo sigue la entrada normal.
- Menú `#menu` (botón «☰ Menú» en el juego y en el Gran Mapa): Modo aventura (abre el Gran Mapa), Instrucciones y tutorial (`#howto`: cómo se juega en 7 puntos + «Jugar el tutorial»), Taller de Coni (Explorar / Practicar sin fin), Panel del profesor (solo profesor); pie: cambiar de jugador, ir al nivel donde estaba. La historia NO está en el menú (queda «Ver la historia» en el pie del juego). Bloque `/* ============ Menú principal */` antes de `if(!wantTaller) beginGame()`.
- Gran Mapa `#mapa`: «Continuar la aventura» (`advResume`: último nivel abierto sin superar, `euclidia2-ultimo`), valles por mundo (`#advList`), candados en las regiones sin niveles abiertos, medallas.
- Desbloqueo (bloque `/* ============ Modo aventura */` antes de `renderLevels`): `advState()` → {open, why}. Tutorial en orden → primer valle de cada cónica; en un valle cada nivel abre el siguiente; terminar un valle abre el siguiente del mundo; Identificar y Mixtos al terminar el primer valle de las 4 cónicas. Lo superado queda abierto. Profesor y evaluación: todo abierto. `nextIdx` salta cerrados y si no hay más busca con `advNext`.
- Barra de niveles: cerrados con candado; al tocarlos `#lockNote` explica qué terminar. API de pruebas: `window.__euclidia.adv`.
- Pruebas: `pruebas/menu.test.js` (26).
- Visto al probar (ya pasaba antes): en un celular de 320 px de ancho el panel del nivel se sale 13 px por la derecha.

## Para la etapa 4 (modo historia)
- El desbloqueo ya está hecho (etapa 3b). Falta: que Apolonio explique la lección de cada valle antes de su primer nivel, y el enlace del profesor `?modo=estudio` (puede abrir directo el modo aventura).
- Las 4 cadenas nuevas sirven como zonas del modo historia: cada tipo de dato es una lección que Apolonio puede explicar antes de sus niveles.
- El PR #11 sigue abierto; los niveles nuevos ya funcionan con su regla.

## Qué hay en la etapa 3 (index.html)
- 16 niveles nuevos, una cadena de 4 por cónica (fácil, medio, difícil, difícil), insertada después de C12, E12, P12 y H12: El Barrio de las Fuentes (C13–C16, región ciudad), Las Órbitas del Cometa (E13–E16, luna), El Puerto de las Antenas (P13–P16, costa), La Red de Señales (H13–H16, desfiladero). Historias en `LORE`, regiones en `SCENE_OF`.
- Cada nivel da un tipo de dato distinto (área, tangente a un eje, tres puntos, centro sobre un eje, foco+vértice, excentricidad, vértices+punto, suma de distancias, lado recto, cortes con el eje x, directriz, asíntota como ecuación, asíntotas que no pasan por el origen, diferencia de distancias). Campo nuevo `datos` (lista de {t, v...}); lo revisa `pruebas/datos.test.js` contra `classify` y contra el texto `story`.
- Las abiertas llevan la restricción en la salida (regla del PR #11). Verificados con y sin el PR #11. Ninguno usa forma general.
- Monedas totales: 200 (antes 154); `evaluacion.test.js` actualizado.
- Herramientas en archivos del proyecto `senderos-euclidia/banco/`: `datos-variados.js` (fichas; calcula la vista 4:3), `verificar-datos-variados.js` (juega cada ficha en el juego real), `insertar-datos-variados.js`, `doc-datos-variados.js` (tablas del doc). Para crecer el banco: añadir fichas, verificar, insertar.
- Vista del mapa: el lienzo es 4:3 (alto = 0,75·span) y Coni se detiene a ~0,07·span del borde de arriba; por eso la vista sale de `view()` en datos-variados.js.

## Pendiente / preguntas abiertas
- Alvaro debe revisar el doc del banco de datos variados (https://claude.ai/artifact/BzsuiVXUm2tjJuzcVgyoqX) y decir si quita algún tipo de dato o si quiere más cadenas antes de la etapa 4.
- Prometido: Apolonio también dirá las lecciones del tutorial y las pistas (hacerlo en la etapa 4).
- Enlace del Taller en el panel del profesor: aún no (va con el enlace de estudio en la etapa 4).

## Ahorro (pedido de Alvaro, 2026-11-26)
Tests y lecturas largas en subagentes; salida de comandos resumida; no cambiar modelo ni esfuerzo en un hilo; cada etapa puede arrancar en un hilo nuevo desde esta nota.

## Enlace privado de prueba
https://claude.ai/artifact/S7vw43UrnusmURTwi9MY2G (no es el sitio de estudiantes). Se arma desde index.html: cambiar las 6 primeras líneas (doctype…title) por las 2 de cabecera del artefacto («Euclidia en prueba»), quitar `</head>\n<body>` y cerrar con `</body></html>`; mathlive.min.js ya está como archivo aparte y se conserva.
