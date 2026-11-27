# Notas de traspaso: modo estudio y banco amplio

Plan aprobado por Alvaro (2026-11-26), un PR por etapa:
1. **Taller de Coni + maestro Apolonio** — hecho, PR #12 (rama `claude/project-thread-offm5n`), esperando revisión de Alvaro.
2. Práctica sin fin («te dan esto, halla lo que falta»), dentro del Taller, con conteo de aciertos solo local (no se envía).
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

## Pendiente / preguntas abiertas
- Alvaro no ha confirmado el nombre «Apolonio».
- Prometido: Apolonio también dirá las lecciones del tutorial y las pistas (hacerlo en la etapa 4).
- Enlace del Taller en el panel del profesor: aún no (va con el enlace de estudio en la etapa 4).

## Ahorro (pedido de Alvaro, 2026-11-26)
Tests y lecturas largas en subagentes; salida de comandos resumida; no cambiar modelo ni esfuerzo en un hilo; cada etapa puede arrancar en un hilo nuevo desde esta nota.
