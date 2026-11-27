# Notas de traspaso: modo estudio y banco amplio

Plan aprobado por Alvaro (2026-11-26), un PR por etapa:
1. **Taller de Coni + maestro Apolonio** — hecho, PR #12 (rama `claude/project-thread-offm5n`), esperando revisión de Alvaro.
2. **Práctica sin fin** — hecho, PR apilado sobre el #12 (rama `claude/project-thread-kr0m2u`), esperando revisión de Alvaro.
3. Generador + verificador de un banco muy amplio (cónica × tipo de dato × orientación × dificultad); mostrar una muestra a Alvaro antes de meterlos todos. Usar la skill diseñar-nivel. Respetar la regla del PR #11 (restricción en la salida), que conviene fusionar antes.
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

- Registro (pedido de Alvaro, 2026-11-26): el documento y el apellido solo se piden con el enlace o QR del profesor (`needDoc()`: `?rol=estudiante`, evaluación o hoja). Por su cuenta solo se pide el nombre y no se encola nada para enviar. Pruebas: `pruebas/registro.test.js` (8).
- Enlace privado de prueba (no es el sitio de estudiantes): https://claude.ai/artifact/S7vw43UrnusmURTwi9MY2G. Se genera de index.html quitando doctype/html/head/body y metas, con mathlive.min.js como archivo aparte.

## Para la etapa 3 (banco amplio)
- `pracGen` ya produce datos coherentes y verificados; puede servir de semilla para el generador de niveles (cónica × tipo de dato × orientación).
- El PR #11 (restricción obligatoria en parábola e hipérbola) sigue abierto: fusionarlo antes de generar niveles nuevos.

## Pendiente / preguntas abiertas
- Alvaro no ha confirmado el nombre «Apolonio».
- Prometido: Apolonio también dirá las lecciones del tutorial y las pistas (hacerlo en la etapa 4).
- Enlace del Taller en el panel del profesor: aún no (va con el enlace de estudio en la etapa 4).

## Ahorro (pedido de Alvaro, 2026-11-26)
Tests y lecturas largas en subagentes; salida de comandos resumida; no cambiar modelo ni esfuerzo en un hilo; cada etapa puede arrancar en un hilo nuevo desde esta nota.
