// Pruebas automatizadas de calcularTotal(precio, cantidad, descuento).
// Cada prueba lleva el ID del caso de docs/matriz-casos.md para mantener la trazabilidad.
// Los datos siempre van en el orden (precio, cantidad, descuento).

const { calcularTotal } = require('../src/compras');

describe('RF-01 y RF-02: cálculo del total con datos válidos', () => {
  test.each([
    { id: 'CP-01', datos: [25, 4, 10], esperado: 90, detalle: 'caso nominal' },
    { id: 'CP-02', datos: [12.5, 3, 20], esperado: 30, detalle: 'precio con decimales' },
    { id: 'CP-03', datos: [0, 5, 10], esperado: 0, detalle: 'límite precio = 0 (A-01)' },
    { id: 'CP-04', datos: [49.99, 1, 0], esperado: 49.99, detalle: 'límite cantidad = 1' },
    { id: 'CP-05', datos: [80, 2, 0], esperado: 160, detalle: 'límite descuento = 0' },
  ])('$id: $detalle -> $esperado', ({ datos, esperado }) => {
    expect(calcularTotal(...datos)).toBe(esperado);
  });
});

describe('RF-03: total con dos decimales', () => {
  // Uso toBe y no toBeCloseTo a propósito: RF-03 exige que el valor devuelto
  // tenga dos decimales, así que 0.30000000000000004 no es un resultado aceptable.
  test.each([
    { id: 'CP-06', datos: [19.99, 3, 100], esperado: 0, detalle: 'descuento 100 % produce 0' },
    { id: 'CP-07', datos: [19.99, 3, 15], esperado: 50.97, detalle: 'redondeo de 50,9745' },
    { id: 'CP-08', datos: [0.1, 3, 0], esperado: 0.3, detalle: 'error de punto flotante' },
    // CP-20 se agregó después de la ejecución inicial: salió de la exploración del redondeo (DEF-04).
    // toBe usa Object.is, así que también detecta si se devuelve -0 en lugar de 0.
    { id: 'CP-20', datos: [0.07, 3, 100], esperado: 0, detalle: 'descuento 100 % con subtotal inexacto produce 0' },
  ])('$id: $detalle -> $esperado', ({ datos, esperado }) => {
    expect(calcularTotal(...datos)).toBe(esperado);
  });
});

describe('RF-04: RangeError para valores fuera de rango', () => {
  test.each([
    { id: 'CP-09', datos: [-0.01, 1, 0], detalle: 'precio = -0,01' },
    { id: 'CP-10', datos: [10, 0, 0], detalle: 'cantidad = 0' },
    { id: 'CP-11', datos: [10, -2, 0], detalle: 'cantidad negativa' },
    { id: 'CP-12', datos: [100, 1, -0.01], detalle: 'descuento = -0,01' },
    { id: 'CP-13', datos: [100, 1, 100.01], detalle: 'descuento = 100,01' },
  ])('$id: $detalle -> RangeError', ({ datos }) => {
    expect(() => calcularTotal(...datos)).toThrow(RangeError);
  });
});

describe('RF-05: TypeError para entradas no numéricas o no finitas', () => {
  test.each([
    { id: 'CP-14', datos: ['100', 2, 10], detalle: 'precio como texto' },
    { id: 'CP-15', datos: [100, null, 10], detalle: 'cantidad null' },
    { id: 'CP-16', datos: [100, 2, undefined], detalle: 'descuento undefined' },
    { id: 'CP-17', datos: [NaN, 2, 10], detalle: 'precio NaN' },
    { id: 'CP-18', datos: [100, Infinity, 10], detalle: 'cantidad Infinity' },
    { id: 'CP-19', datos: [100, 2, -Infinity], detalle: 'descuento -Infinity (tipo antes que rango, A-04)' },
  ])('$id: $detalle -> TypeError', ({ datos }) => {
    expect(() => calcularTotal(...datos)).toThrow(TypeError);
  });
});
