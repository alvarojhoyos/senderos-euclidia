# Senderos de Euclidia

## ▶ [Jugar: alvarojhoyos.github.io/senderos-euclidia](https://alvarojhoyos.github.io/senderos-euclidia/)

Juego para aprender cónicas en Cálculo en varias variables. El estudiante escribe la ecuación canónica y el robot Vector recorre la curva de la salida a la meta.

- `index.html`: el juego completo, con el banco de niveles dentro del arreglo `LEVELS`.
- `mathlive.min.js`: editor de fórmulas tipo cuaderno (MathLive 0.109.2, licencia MIT, ver `LICENSE-mathlive.txt`). Va dentro del repositorio para que el juego no dependa de otro servidor.

Se publica con GitHub Pages desde la rama `main`. El profesor abre el enlace, elige "Soy profesor" y proyecta el código QR; quien entra por el QR queda como estudiante.

## Niveles

El banco tiene 56 niveles en siete mundos: circunferencias, elipses, parábolas e hipérbolas (12 cada uno, en 3 cadenas de 4 que suben de fácil a difícil), identificar (4) y mixtos (4), estos dos en cadenas cortas de 2. Cada nivel trae sus errores típicos con el mensaje que ve el estudiante cuando su curva coincide con uno de ellos. Para agregar niveles basta con sumarlos a `LEVELS` con su `world`, `chain` y `step`: el menú y el total de monedas se calculan solos.

## Pruebas automáticas

`pruebas/curvas.test.js` comprueba que lo que el juego dibuja coincide con la ecuación que escribe el jugador: tipo de cónica y parámetros, que cada trazo esté sobre la curva exacta, que no falten partes de la curva, la restricción y el recorrido de Vector. Incluye casos límite (a = b, coeficientes negativos, ecuaciones no normalizadas, elipses muy aplanadas, casos degenerados), las ecuaciones del editor tipo cuaderno y los datos de cada nivel.

`pruebas/niveles.test.js` juega cada nivel en el juego real: la ecuación esperada debe llegar a la meta con todas las monedas, cada error típico debe fallar sin monedas y mostrar su mensaje, y en los niveles de Rescate Vector debe dar la vuelta completa.

Requieren Node y Playwright con Chromium: `node pruebas/curvas.test.js` y `node pruebas/niveles.test.js`. Los últimos resultados están en `pruebas/salida.txt` y `pruebas/salida-niveles.txt`.
