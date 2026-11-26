# Juego de cónicas y sólidos

## Para quién
Estudiantes de Cálculo en varias variables (universidad). Juegan en clase, desde el celular o laptop.

## Reglas matemáticas
- Notación como en clase: x²/a² + y²/b² = 1 para la elipse, con a, b > 0.
- Toda curva que se dibuja debe coincidir con la ecuación ingresada. Cada nueva cónica lleva pruebas que lo verifiquen.
- Los mensajes de error explican la matemática ("tu ecuación es una hipérbola, no una elipse"), nunca solo "incorrecto".
- Elipses e hipérbolas siempre igualadas a 1. Si no lo están, el juego dice que la ecuación es correcta pero que falta pasarla a forma canónica. Las parábolas aceptan sus dos formas canónicas y la circunferencia acepta = r².
- La nota sale de 50 monedas repartidas en 20 niveles calificables, y en sesiones cortas cambia el valor de cada moneda. Cada pista cuesta 2 monedas.
- Si el estudiante se equivoca, solo se muestra la ruta fallida, sin darle la respuesta.

## Técnica
- HTML + JavaScript en el navegador, sin instalación.
- 2D con canvas; 3D (mundos de sólidos) con Three.js.
- Textos del juego en español.
- Primero se termina el mundo 2D de cónicas y el 3D queda para después.

## Antes de dar algo por terminado
- Probarlo en ancho de celular.
- Correr las pruebas de las funciones matemáticas (`node pruebas/curvas.test.js`).
