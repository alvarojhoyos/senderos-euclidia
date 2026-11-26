# Senderos de Euclidia

## ▶ [Jugar: alvarojhoyos.github.io/senderos-euclidia](https://alvarojhoyos.github.io/senderos-euclidia/)

Juego para aprender cónicas en Cálculo en varias variables. El estudiante escribe la ecuación canónica y el robot Coni recorre la curva de la salida a la meta.

- `index.html`: el juego completo, con el banco de niveles dentro del arreglo `LEVELS`.
- `mathlive.min.js`: editor de fórmulas tipo cuaderno (MathLive 0.109.2, licencia MIT, ver `LICENSE-mathlive.txt`). Va dentro del repositorio para que el juego no dependa de otro servidor.

Se publica con GitHub Pages desde la rama `main`. El profesor abre el enlace, elige "Soy profesor" y proyecta el código QR; quien entra por el QR queda como estudiante.

## Niveles

El mundo Tutorial no cuenta para la nota: una lección de controles y una lección por cónica (circunferencia, elipse, parábola e hipérbola). Cada lección explica la forma canónica y dibuja en morado las partes de la cónica (centro, radio, semiejes, vértice, focos, directriz, asíntotas), y termina con un nivel de práctica.

El banco tiene 56 niveles en siete mundos: circunferencias, elipses, parábolas e hipérbolas (12 cada uno, en 3 cadenas de 4 que suben de fácil a difícil), identificar (4) y mixtos (4), estos dos en cadenas cortas de 2. Cada nivel trae sus errores típicos con el mensaje que ve el estudiante cuando su curva coincide con uno de ellos. Para agregar niveles basta con sumarlos a `LEVELS` con su `world`, `chain` y `step`: el menú y el total de monedas se calculan solos.

## Restricciones

Debajo de cada ecuación (o de cada tramo en los niveles mixtos) está el botón "+ Añadir una restricción". El estudiante decide si la necesita y puede poner hasta dos, una en x y otra en y; Coni solo camina por la parte de la curva que cumple todas. El juego no exige una cónica concreta: cualquier camino que lleve a Coni de la salida a la meta recogiendo las monedas gana el nivel.

## Evaluaciones

En el panel del profesor, la sección "Evaluación" arma un código QR para una evaluación. Una tabla dice cuántos niveles fáciles, medios y difíciles entran de cada mundo (el máximo de cada casilla es lo que hay en el banco), y los botones "Corta" (1 fácil, 1 medio y 1 difícil por cónica) y "Larga" (1, 2 y 1) la llenan de un toque. También se eligen el tiempo en minutos y un nombre opcional. A cada estudiante le tocan niveles al azar con esas cantidades, ordenados de fácil a difícil, y la elección depende de su documento: el mismo estudiante siempre recibe los suyos. Si una casilla está al máximo, todos reciben esos mismos niveles.

Al entrar, el estudiante ve solo el Tutorial y un aviso con el botón "Empezar el quiz": puede hacer el Tutorial sin que corra el tiempo, y el reloj arranca cuando pulsa el botón (con un segundo toque para confirmar). Durante la evaluación el menú solo muestra el Tutorial y esos niveles, arriba corre el reloj y la nota es monedas obtenidas / monedas posibles × 5,0. Cuando el estudiante pulsa "Terminar" o se acaba el tiempo, el juego envía la fila final a la hoja del profesor y ya no deja trazar. La hoja guarda el nombre de la evaluación en la columna "Evaluación", y el Resumen lleva una fila por estudiante y evaluación. Si la hoja se conectó con una versión anterior del código de Apps Script, hay que pegar el código nuevo y publicar una nueva versión (Implementar > Gestionar implementaciones > Editar > Nueva versión).

## Historia y escenarios

En Euclidia los caminos están hechos de ecuaciones. La Niebla del Olvido borró el Gran Mapa y los Trazadores, robots que cuidan los caminos, quedaron perdidos. Coni, la Trazadora más joven y la más pequeña, camina exactamente por la curva que escribe su navegante: el estudiante. Cada moneda es un fragmento del Gran Mapa.

Al abrir un nivel desde el menú, con «Siguiente nivel» o al empezar el quiz, un panel cuenta en dos o tres frases qué pasa ahí, y «Siguiente» lleva al nivel. La historia nunca trae números ni ecuaciones: los datos para resolver siguen en el panel del nivel. Los textos están en `LORE` y la región de cada nivel en `SCENE_OF` (dentro de `index.html`).

Cada nivel tiene un escenario en pixel art según su lugar (lago y río, luna, volcán, pradera, glaciar, costa, desfiladero, géiseres, cueva y ciudad). Se dibuja con código en una capa aparte una sola vez y en cada cuadro solo se copia, así que no pesa ni hace más lento el juego. Las animaciones (brillos, brasas, vapor) se apagan si el sistema pide reducir movimiento o si el celular va lento. El escenario evoca el lugar sin copiar la cónica, para no dar la respuesta.

## Pruebas automáticas

`pruebas/curvas.test.js` comprueba que lo que el juego dibuja coincide con la ecuación que escribe el jugador: tipo de cónica y parámetros, que cada trazo esté sobre la curva exacta, que no falten partes de la curva, la restricción y el recorrido de Coni. Incluye casos límite (a = b, coeficientes negativos, ecuaciones no normalizadas, elipses muy aplanadas, casos degenerados), las ecuaciones del editor tipo cuaderno y los datos de cada nivel.

`pruebas/niveles.test.js` juega cada nivel en el juego real: la ecuación esperada debe llegar a la meta con todas las monedas, cada error típico debe fallar sin monedas y mostrar su mensaje, en los niveles de Rescate Coni debe dar la vuelta completa, y cada parte dibujada en las lecciones debe coincidir con la ecuación de la práctica.

`pruebas/evaluacion.test.js` comprueba las evaluaciones: que cada estudiante reciba las cantidades de la tabla por mundo y dificultad, siempre los mismos para el mismo documento y de fácil a difícil, que el reloj no corra durante el Tutorial, el enlace del QR, el menú filtrado, el reloj, el envío al acabarse el tiempo y que sin evaluación todo siga igual.

`pruebas/restricciones.test.js` comprueba las restricciones opcionales: que no aparezcan solas, que se puedan añadir hasta dos por tramo (una en x y otra en y) y quitar, y que en el juego valgan las dos a la vez.

`pruebas/historia.test.js` comprueba que los 61 niveles tengan historia sin números ni ecuaciones, que el panel se abra al elegir un nivel o con «Siguiente nivel», que quepa en un celular pequeño y que «Siguiente» lo cierre.

Requieren Node y Playwright con Chromium: `node pruebas/curvas.test.js`, `node pruebas/niveles.test.js`, `node pruebas/evaluacion.test.js`, `node pruebas/restricciones.test.js` y `node pruebas/historia.test.js`. Los últimos resultados están en `pruebas/salida.txt`, `pruebas/salida-niveles.txt`, `pruebas/salida-evaluacion.txt`, `pruebas/salida-restricciones.txt` y `pruebas/salida-historia.txt`.
