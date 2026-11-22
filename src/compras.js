function calcularTotal(precio, cantidad, descuento) {
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
