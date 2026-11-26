# Senderos de Euclidia

## ▶ [Jugar: alvarojhoyos.github.io/senderos-euclidia](https://alvarojhoyos.github.io/senderos-euclidia/)

Juego para aprender cónicas en Cálculo en varias variables. El estudiante escribe la ecuación canónica y el robot Coni recorre la curva de la salida a la meta.

- `index.html`: el juego completo, con el banco de niveles dentro del arreglo `LEVELS`.
- `mathlive.min.js`: editor de fórmulas tipo cuaderno (MathLive 0.109.2, licencia MIT, ver `LICENSE-mathlive.txt`). Va dentro del repositorio para que el juego no dependa de otro servidor.

Se publica con GitHub Pages desde la rama `main`. El profesor abre el enlace, elige "Soy profesor" y proyecta el código QR; quien entra por el QR queda como estudiante.

## Niveles

El mundo Tutorial no cuenta para la nota: una lección de controles y una lección por cónica (circunferencia, elipse, parábola e hipérbola). Cada lección explica la forma canónica y dibuja en morado las partes de la cónica (centro, radio, semiejes, vértice, focos, directriz, asíntotas), y termina con un nivel de práctica.

El banco tiene 56 niveles en siete mundos: circunferencias, elipses, parábolas e hipérbolas (12 cada uno, en 3 cadenas de 4 que suben de fácil a difícil), identificar (4) y mixtos (4), estos dos en cadenas cortas de 2. Cada nivel trae sus errores típicos con el mensaje que ve el estudiante cuando su curva coincide con uno de ellos. Para agregar niveles basta con sumarlos a `LEVELS` con su `world`, `chain` y `step`: el menú y el total de monedas se calculan solos.

## Evaluaciones

En el panel del profesor, la sección "Evaluación" arma un código QR para una evaluación: se eligen los mundos que entran, la duración (corta: 3 niveles por cónica, el fácil, el medio y el Escape o reto; larga: la cadena completa de 4), el tiempo en minutos y un nombre opcional. Cada estudiante recibe, de cada mundo, una cadena al azar que depende de su documento, así que dos compañeros casi nunca tienen los mismos niveles, pero el mismo estudiante siempre recibe los suyos. Identificar y Mixtos dan siempre 2 niveles. Con todos los mundos la larga tiene 20 niveles y la corta 16.

Durante la evaluación el menú solo muestra el Tutorial y esos niveles, arriba corre el reloj y la nota es monedas obtenidas / monedas posibles × 5,0. Cuando el estudiante pulsa "Terminar" o se acaba el tiempo, el juego envía la fila final a la hoja del profesor y ya no deja trazar. La hoja guarda el nombre de la evaluación en la columna "Evaluación", y el Resumen lleva una fila por estudiante y evaluación. Si la hoja se conectó con una versión anterior del código de Apps Script, hay que pegar el código nuevo y publicar una nueva versión (Implementar > Gestionar implementaciones > Editar > Nueva versión).

## Pruebas automáticas

`pruebas/curvas.test.js` comprueba que lo que el juego dibuja coincide con la ecuación que escribe el jugador: tipo de cónica y parámetros, que cada trazo esté sobre la curva exacta, que no falten partes de la curva, la restricción y el recorrido de Coni. Incluye casos límite (a = b, coeficientes negativos, ecuaciones no normalizadas, elipses muy aplanadas, casos degenerados), las ecuaciones del editor tipo cuaderno y los datos de cada nivel.

`pruebas/niveles.test.js` juega cada nivel en el juego real: la ecuación esperada debe llegar a la meta con todas las monedas, cada error típico debe fallar sin monedas y mostrar su mensaje, en los niveles de Rescate Coni debe dar la vuelta completa, y cada parte dibujada en las lecciones debe coincidir con la ecuación de la práctica.

`pruebas/evaluacion.test.js` comprueba las evaluaciones: cuántos niveles recibe cada estudiante, que sean siempre los mismos para el mismo documento y en orden, el enlace del QR, el menú filtrado, el reloj, el envío al acabarse el tiempo y que sin evaluación todo siga igual.

Requieren Node y Playwright con Chromium: `node pruebas/curvas.test.js`, `node pruebas/niveles.test.js` y `node pruebas/evaluacion.test.js`. Los últimos resultados están en `pruebas/salida.txt`, `pruebas/salida-niveles.txt` y `pruebas/salida-evaluacion.txt`.
