/**
 * Senderos de Euclidia: recibe los resultados del juego y los guarda en esta hoja.
 * Crea dos pestañas: "Resumen" (una fila por estudiante y evaluación, con su mejor puntaje) e "Intentos" (cada nivel superado).
 * Si ya tenías una versión anterior, pega este código encima y haz Implementar > Gestionar implementaciones > Editar > Nueva versión.
 * Pasos: Extensiones > Apps Script, pega este código y guarda. Luego Implementar > Nueva implementación >
 * Aplicación web (Ejecutar como: yo; Quién tiene acceso: cualquier persona). Copia la URL que termina en /exec
 * y pégala en el juego, en el panel del profesor.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const libro = SpreadsheetApp.getActiveSpreadsheet();
    const d = JSON.parse(e.postData.contents);
    const intentos = hojaCon(libro, "Intentos", ["Fecha", "Nombre", "Apellido", "Documento", "Nivel",
      "Monedas del nivel", "Monedas totales", "Monedas posibles", "Pistas usadas", "Nota", "Evaluación"]);
    if (d.prueba) {
      intentos.appendRow([new Date(), "Prueba de conexión desde el juego", "", "", "", "", "", "", "", ""]);
      return texto("ok");
    }
    intentos.appendRow([new Date(d.fecha), d.nombre, d.apellido, String(d.documento), d.nivel, d.monedasNivel,
      d.monedasTotales, d.monedasPosibles, d.pistas, d.nota, d.evaluacion || ""]);
    const resumen = hojaCon(libro, "Resumen", ["Nombre", "Apellido", "Documento", "Monedas", "Monedas posibles",
      "Nota", "Última actualización", "Evaluación"]);
    const n = resumen.getLastRow() - 1;
    // cada estudiante tiene una fila por evaluación (documento + evaluación)
    const clave = String(d.documento) + "|" + (d.evaluacion || "");
    const claves = n > 0 ? resumen.getRange(2, 1, n, 8).getValues().map(function (r) { return String(r[2]) + "|" + String(r[7] || ""); }) : [];
    const i = claves.indexOf(clave);
    const fila = [d.nombre, d.apellido, String(d.documento), d.monedasTotales, d.monedasPosibles, d.nota, new Date(), d.evaluacion || ""];
    if (i < 0) resumen.appendRow(fila);
    else if (Number(resumen.getRange(i + 2, 4).getValue()) <= Number(d.monedasTotales))
      resumen.getRange(i + 2, 1, 1, fila.length).setValues([fila]);
    return texto("ok");
  } finally {
    lock.releaseLock();
  }
}
function doGet() {
  return texto("La hoja de Senderos de Euclidia está lista para recibir resultados.");
}
function hojaCon(libro, nombre, encabezado) {
  let h = libro.getSheetByName(nombre);
  if (!h) {
    h = libro.insertSheet(nombre);
    h.appendRow(encabezado);
    h.setFrozenRows(1);
    h.getRange(1, 1, 1, encabezado.length).setFontWeight("bold");
  } else if (h.getLastColumn() < encabezado.length) {
    // Hojas creadas con una versión anterior: agrega las columnas nuevas (por ejemplo "Evaluación")
    h.getRange(1, 1, 1, encabezado.length).setValues([encabezado]).setFontWeight("bold");
  }
  return h;
}
function texto(t) {
  return ContentService.createTextOutput(t);
}
