# Notas de traspaso: modo estudio y banco amplio

Plan aprobado por Alvaro (2026-11-26), un PR por etapa:
1. **Taller de Coni + maestro Apolonio** — hecho, PR #12 (rama `claude/project-thread-offm5n`), esperando revisión de Alvaro.
2. **Práctica sin fin** — hecho, PR apilado sobre el #12 (rama `claude/project-thread-kr0m2u`), esperando revisión de Alvaro.
3. **Banco de datos variados** — hecho (52 niveles nuevos y todo el banco en cadenas por dificultad), PR #14 apilado sobre el #13 (rama `claude/project-thread-dngk74`), esperando revisión de Alvaro. Doc: https://claude.ai/artifact/BzsuiVXUm2tjJuzcVgyoqX
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

## Para la etapa 4 (modo historia)
- Las cadenas ya son de una sola dificultad: cada una puede ser una zona del modo historia, y sus tipos de dato son la lección que Apolonio explica antes de sus niveles.
- El PR #11 sigue abierto; los niveles nuevos ya funcionan con su regla (verificados con y sin ella).

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
- Alvaro revisa la versión 2 del doc del banco (https://claude.ai/artifact/BzsuiVXUm2tjJuzcVgyoqX): cadenas por dificultad y segunda tanda de 36 niveles.
- Prometido: Apolonio también dirá las lecciones del tutorial y las pistas (hacerlo en la etapa 4).
- Enlace del Taller en el panel del profesor: aún no (va con el enlace de estudio en la etapa 4).

## Ahorro (pedido de Alvaro, 2026-11-26)
Tests y lecturas largas en subagentes; salida de comandos resumida; no cambiar modelo ni esfuerzo en un hilo; cada etapa puede arrancar en un hilo nuevo desde esta nota.
