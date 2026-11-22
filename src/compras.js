// RF-05: rechazar entradas no numéricas o no finitas (DEF-03).
// Number.isFinite devuelve false para cualquier valor que no sea de tipo number
// (texto, null, undefined, booleanos) y también para NaN, Infinity y -Infinity.
// A diferencia de isFinite global, no convierte el valor: Number.isFinite('100') es false.
function validarNumero(valor, nombre) {
  if (!Number.isFinite(valor)) {
    throw new TypeError(`${nombre} debe ser un número finito`);
  }
}

function calcularTotal(precio, cantidad, descuento) {
  // El tipo se valida antes que el rango (supuesto A-04 del plan de pruebas).
  validarNumero(precio, 'El precio');
  validarNumero(cantidad, 'La cantidad');
  validarNumero(descuento, 'El descuento');

  // RF-04: rechazar valores fuera de rango (DEF-02).
  if (precio < 0) {
    throw new RangeError('El precio no puede ser negativo');
  }
  if (cantidad <= 0) {
    throw new RangeError('La cantidad debe ser mayor que 0');
  }
  if (descuento < 0 || descuento > 100) {
    throw new RangeError('El descuento debe estar entre 0 y 100');
  }

  const subtotal = precio * cantidad;
  const valorDescuento = subtotal * descuento / 100;
  return subtotal - valorDescuento;
}

module.exports = { calcularTotal };
