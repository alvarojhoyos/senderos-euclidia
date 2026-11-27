# Senderos de Euclidia

## ▶ [Jugar: alvarojhoyos.github.io/senderos-euclidia](https://alvarojhoyos.github.io/senderos-euclidia/)

Juego para aprender cónicas en Cálculo en varias variables. El estudiante escribe la ecuación canónica y el robot Coni recorre la curva de la salida a la meta.

- `index.html`: el juego completo, con el banco de niveles dentro del arreglo `LEVELS`.
- `mathlive.min.js`: editor de fórmulas tipo cuaderno (MathLive 0.109.2, licencia MIT, ver `LICENSE-mathlive.txt`). Va dentro del repositorio para que el juego no dependa de otro servidor.

Se publica con GitHub Pages desde la rama `main`. El profesor abre el enlace, elige "Soy profesor" y proyecta el código QR; quien entra por el QR queda como estudiante.

## Niveles

El mundo Tutorial no cuenta para la nota: una lección de controles y una lección por cónica (circunferencia, elipse, parábola e hipérbola). Cada lección explica la forma canónica y dibuja en morado las partes de la cónica (centro, radio, semiejes, vértice, focos, directriz, asíntotas), y termina con un nivel de práctica.

El banco tiene 108 niveles en seis mundos: circunferencias, elipses, parábolas e hipérbolas (24 cada uno) e identificar y mixtos (6 cada uno). Cada cadena tiene una sola dificultad: cada cónica tiene 6 cadenas de 4 niveles (2 fáciles, 2 medias y 2 difíciles) e identificar y mixtos tienen 3 cadenas de 2, una por dificultad. Los niveles nuevos dan datos distintos en cada nivel: área, perímetro, diámetro, punto de tangencia, puntos de la curva, excentricidad, lado recto, directriz, asíntotas, eje conjugado, distancia entre focos, suma o diferencia de distancias a los focos. Esos niveles guardan sus datos en el campo `datos`, que revisa `pruebas/lecciones.test.js` comprueba el modo historia: una lección por valle; que cada ejemplo dibujado cumpla la ecuación que se muestra y no sea la respuesta de ningún nivel; que los ejemplos de forma general den la cónica del ejemplo; que la lección salga antes del primer nivel de cada valle y no en una evaluación; el enlace `?modo=estudio`, los enlaces del profesor y el ancho de celular.

`pruebas/datos.test.js`, y algunos traen adornos en pixel (`props`: fuentes, farolas, antenas, torres, boyas, planetas) que se pintan una sola vez con el escenario. Cada nivel trae sus errores típicos con el mensaje que ve el estudiante cuando su curva coincide con uno de ellos. Para agregar niveles basta con sumarlos a `LEVELS` con su `world`, `chain` y `step`: el menú y el total de monedas se calculan solos.

En los niveles de forma general (los que piden completar cuadrados) los Trazadores y objetos no se ven ni se dan sus coordenadas hasta que Coni pasa por ellos. Así la cónica no se puede sacar a ojo uniendo los puntos: hay que llegar a ella con la ecuación.

## Restricciones

Debajo de cada ecuación (o de cada tramo en los niveles mixtos) está el botón "+ Añadir una restricción". El estudiante decide si la necesita y puede poner hasta dos, una en x y otra en y; Coni solo camina por la parte de la curva que cumple todas. El juego no exige una cónica concreta: cualquier camino que lleve a Coni de la salida a la meta recogiendo las monedas gana el nivel.

## Evaluaciones

En el panel del profesor, la sección "Evaluación" arma un código QR para una evaluación. Una tabla dice cuántos niveles fáciles, medios y difíciles entran de cada mundo (el máximo de cada casilla es lo que hay en el banco), y los botones "Corta" (1 fácil, 1 medio y 1 difícil por cónica) y "Larga" (1, 2 y 1) la llenan de un toque. También se eligen el tiempo en minutos y un nombre opcional. A cada estudiante le tocan niveles al azar con esas cantidades, ordenados de fácil a difícil, y la elección depende de su documento: el mismo estudiante siempre recibe los suyos. Si una casilla está al máximo, todos reciben esos mismos niveles.

Al entrar, el estudiante ve solo el Tutorial y un aviso con el botón "Empezar el quiz": puede hacer el Tutorial sin que corra el tiempo, y el reloj arranca cuando pulsa el botón (con un segundo toque para confirmar). Durante la evaluación el menú solo muestra el Tutorial y esos niveles, arriba corre el reloj y la nota es monedas obtenidas / monedas posibles × 5,0. Cuando el estudiante pulsa "Terminar" o se acaba el tiempo, el juego envía la fila final a la hoja del profesor y ya no deja trazar. La hoja guarda el nombre de la evaluación en la columna "Evaluación", y el Resumen lleva una fila por estudiante y evaluación. Si la hoja se conectó con una versión anterior del código de Apps Script, hay que pegar el código nuevo y publicar una nueva versión (Implementar > Gestionar implementaciones > Editar > Nueva versión).

## Historia y escenarios

En Euclidia los caminos están hechos de ecuaciones. La Niebla del Olvido borró el Gran Mapa y los Trazadores, robots que cuidan los caminos, quedaron perdidos. Coni, la Trazadora más joven y la más pequeña, camina exactamente por la curva que escribe su navegante: el estudiante. Cada moneda es un fragmento del Gran Mapa.

Al abrir un nivel desde el menú, con «Siguiente nivel» o al empezar el quiz, un panel cuenta en dos o tres frases qué pasa ahí, y «Siguiente» lleva al nivel. La historia nunca trae números ni ecuaciones: los datos para resolver siguen en el panel del nivel. Los textos están en `LORE` y la región de cada nivel en `SCENE_OF` (dentro de `index.html`).

Cada nivel tiene un escenario en pixel art según su lugar (lago y río, luna, volcán, pradera, glaciar, costa, desfiladero, géiseres, cueva y ciudad). Se dibuja con código en una capa aparte una sola vez y en cada cuadro solo se copia, así que no pesa ni hace más lento el juego. Las animaciones (brillos, brasas, vapor) se apagan si el sistema pide reducir movimiento o si el celular va lento. El escenario evoca el lugar sin copiar la cónica, para no dar la respuesta.

En los Rescates, cada moneda es un Trazador perdido (más grande que Coni, que es la más pequeña): cuando Coni pasa, salta de alegría y le entrega su fragmento del Gran Mapa (+1). En los Escapes la moneda toma la forma del lugar: perla, polvo de estrella, gema de lava, semilla dorada, cristal de hielo, concha, piedra rojiza, gota de vapor, cristal de cueva o moneda de Euclidia. Se recogen y se cuentan igual que antes. Al llegar a la meta, Coni celebra con confeti (salvo si el sistema pide reducir movimiento).

## El Taller de Coni (modo estudio)

Un laboratorio que no cuenta para la nota. Se abre con el botón «El Taller de Coni» (junto al Gran Mapa) o con el enlace `?modo=taller`. Ahí vive el maestro Apolonio, el viejo Trazador que le enseña a Coni y al navegante.

- Por cada cónica el estudiante mueve h, k y r, a, b o p (con + y − o con el deslizador) y ve al instante la curva, su forma canónica, su forma general y todas sus partes. Al tocar una parte de la lista se resalta en el mapa y se explica qué es y cómo se saca de la ecuación, con las cuentas hechas (por ejemplo c² = b² − a² = 16 − 4 = 12).
- Horizontal y vertical: un recuadro explica qué cambia en la ecuación, los vértices, los focos y las asíntotas, y un botón muestra el otro caso. Elipse con la notación de clase: a bajo x y b bajo y; la hipérbola lleva a bajo el término positivo.
- «Prueba tu propia ecuación»: reconoce cualquier cónica sin giro, también en forma general, la muestra con sus partes y avisa si todavía no está en forma canónica.
- Apolonio habla en un globo de diálogo y da retos cortos («haz a = b y mira qué pasa») que celebra cuando se cumplen.
- Durante una evaluación el taller no aparece, para que no sirva de calculadora de partes.

## Modo historia: las lecciones de Apolonio

En el Gran Mapa (modo aventura) cada valle empieza con una lección del maestro Apolonio la primera vez que se entra a él: qué se aprende en ese valle, la fórmula clave y un ejemplo dibujado con sus partes (centro, radio, focos, directriz, asíntotas…), calculadas con el mismo modelo del Taller. El botón «Verlo en el Taller» abre ese ejemplo en el Taller para moverlo. Hay una lección por cada uno de los 30 valles; los ejemplos nunca son la respuesta de un nivel. Las lecciones de los valles abiertos se pueden repasar desde el Gran Mapa. En una evaluación no aparecen.

Apolonio también presenta las lecciones del tutorial y las pistas.

El panel del profesor tiene la sección «Modo estudio (sin nota)» con tres enlaces y su código QR: `?modo=estudio` (entra como estudiante, pide solo el nombre y abre el Gran Mapa), `?modo=taller` y `?modo=practica`. Nada de esto se envía a la hoja de resultados.

## Toques finales

- **Historia al empezar:** la primera vez que se abre el juego en un dispositivo aparecen 4 viñetas (la Niebla del Olvido, Coni en el taller con su maestro, el maestro Apolonio que ya no puede salir a explorar y «tú eres su navegante»), con un botón para saltarlas. Se pueden volver a ver con «Ver la historia», al pie de la página.
- **Sonidos:** cortos y hechos en el momento (sin archivos): al recoger una moneda, al rescatar a un Trazador, al llegar, al chocar y al caer. Empiezan apagados; cada estudiante los activa con el botón «♪ Sin sonido» y el dispositivo lo recuerda.
- **El Gran Mapa:** muestra las 10 regiones de Euclidia. Cada nivel terminado le quita niebla a su región, y al completarla el juego avisa que salió de la niebla.
- **Medallas por mundo:** bronce al completar todos sus niveles, plata con el 80 % de sus monedas o más, oro con todas. En un quiz el mapa y las medallas no aparecen, porque cada estudiante tiene solo sus niveles.

## Pruebas automáticas

`pruebas/curvas.test.js` comprueba que lo que el juego dibuja coincide con la ecuación que escribe el jugador: tipo de cónica y parámetros, que cada trazo esté sobre la curva exacta, que no falten partes de la curva, la restricción y el recorrido de Coni. Incluye casos límite (a = b, coeficientes negativos, ecuaciones no normalizadas, elipses muy aplanadas, casos degenerados), las ecuaciones del editor tipo cuaderno y los datos de cada nivel.

`pruebas/niveles.test.js` juega cada nivel en el juego real: la ecuación esperada debe llegar a la meta con todas las monedas, cada error típico debe fallar sin monedas y mostrar su mensaje, en los niveles de Rescate Coni debe dar la vuelta completa, y cada parte dibujada en las lecciones debe coincidir con la ecuación de la práctica.

`pruebas/evaluacion.test.js` comprueba las evaluaciones: que cada estudiante reciba las cantidades de la tabla por mundo y dificultad, siempre los mismos para el mismo documento y de fácil a difícil, que el reloj no corra durante el Tutorial, el enlace del QR, el menú filtrado, el reloj, el envío al acabarse el tiempo y que sin evaluación todo siga igual.

`pruebas/restricciones.test.js` comprueba las restricciones opcionales: que no aparezcan solas, que se puedan añadir hasta dos por tramo (una en x y otra en y) y quitar, y que en el juego valgan las dos a la vez.

`pruebas/historia.test.js` comprueba que los 113 niveles (con el tutorial) tengan historia sin números ni ecuaciones, que el panel se abra al elegir un nivel o con «Siguiente nivel», que quepa en un celular pequeño y que «Siguiente» lo cierre. También que cada Escape tenga su objeto del lugar y que en los Rescates las monedas sean Trazadores perdidos.

`pruebas/toques.test.js` comprueba las viñetas de la historia (primera vez, saltar, volver a ver), el sonido apagado por defecto, las medallas, el Gran Mapa y el aviso al recuperar una región.

`pruebas/taller.test.js` comprueba el Taller de Coni: en 400 cónicas al azar la curva dibujada, la ecuación canónica, la forma general, los focos (suma o diferencia de distancias) y la directriz coinciden; que una ecuación escrita por el estudiante ponga el taller en esa cónica; los retos de Apolonio; que quepa en un celular y que no se abra durante una evaluación.

`pruebas/datos.test.js` comprueba que cada dato que un nivel le da al estudiante (campo `datos`: centro, área, focos, vértices, excentricidad, lado recto, directriz, asíntotas, suma o diferencia de distancias) coincide con la cónica esperada, y que el texto del nivel dice esos números.

`pruebas/ocultos.test.js` comprueba que en los 19 niveles de forma general las monedas no se dibujan ni se listan con coordenadas antes de jugar, que un error no las revela y que la ecuación correcta las recoge todas.

Requieren Node y Playwright con Chromium: `node pruebas/curvas.test.js`, `node pruebas/lecciones.test.js`, `node pruebas/niveles.test.js`, `node pruebas/evaluacion.test.js`, `node pruebas/restricciones.test.js`, `node pruebas/historia.test.js`, `node pruebas/toques.test.js` `node pruebas/ocultos.test.js`, `node pruebas/taller.test.js`, `node pruebas/practica.test.js` y `node pruebas/datos.test.js`. Los últimos resultados están en `pruebas/salida.txt`, `pruebas/salida-niveles.txt`, `pruebas/salida-evaluacion.txt`, `pruebas/salida-restricciones.txt`, `pruebas/salida-historia.txt`, `pruebas/salida-toques.txt` `pruebas/salida-ocultos.txt`, `pruebas/salida-taller.txt`, `pruebas/salida-practica.txt`, `pruebas/salida-datos.txt` y `pruebas/salida-lecciones.txt`.
