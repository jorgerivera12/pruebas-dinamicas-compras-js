// Reproduce los casos CP-01 a CP-19 fuera de Jest y muestra el resultado real
// de cada llamada: el valor devuelto o el error lanzado.
// Sirve para registrar el "resultado real" de los defectos y para comparar
// el comportamiento antes y después de cada corrección.
// Uso: node scripts/reproducir-casos.js

const { calcularTotal } = require('../src/compras');

const casos = [
  ['CP-01', [25, 4, 10], '90'],
  ['CP-02', [12.5, 3, 20], '30'],
  ['CP-03', [0, 5, 10], '0'],
  ['CP-04', [49.99, 1, 0], '49.99'],
  ['CP-05', [80, 2, 0], '160'],
  ['CP-06', [19.99, 3, 100], '0'],
  ['CP-07', [19.99, 3, 15], '50.97'],
  ['CP-08', [0.1, 3, 0], '0.3'],
  ['CP-09', [-0.01, 1, 0], 'RangeError'],
  ['CP-10', [10, 0, 0], 'RangeError'],
  ['CP-11', [10, -2, 0], 'RangeError'],
  ['CP-12', [100, 1, -0.01], 'RangeError'],
  ['CP-13', [100, 1, 100.01], 'RangeError'],
  ['CP-14', ['100', 2, 10], 'TypeError'],
  ['CP-15', [100, null, 10], 'TypeError'],
  ['CP-16', [100, 2, undefined], 'TypeError'],
  ['CP-17', [NaN, 2, 10], 'TypeError'],
  ['CP-18', [100, Infinity, 10], 'TypeError'],
  ['CP-19', [100, 2, -Infinity], 'TypeError'],
  ['CP-20', [0.07, 3, 100], '0'],
];

// Muestra los datos de forma legible: los textos entre comillas y el resto tal cual.
function mostrar(valor) {
  return typeof valor === 'string' ? `"${valor}"` : String(valor);
}

console.log(`Node.js ${process.version}`);
console.log('ID    | Datos (precio, cantidad, descuento) | Esperado   | Real                         | Coincide');
console.log('------|-------------------------------------|------------|------------------------------|---------');

let coinciden = 0;
for (const [id, datos, esperado] of casos) {
  let real;
  try {
    const valor = calcularTotal(...datos);
    // String(-0) da "0", así que el -0 se muestra aparte para no ocultarlo.
    real = Object.is(valor, -0) ? '-0' : String(valor);
  } catch (error) {
    real = `${error.name}: ${error.message}`;
  }
  const coincide = real === esperado || real.startsWith(`${esperado}:`);
  if (coincide) {
    coinciden++;
  }
  const textoDatos = `(${datos.map(mostrar).join(', ')})`;
  console.log(
    `${id} | ${textoDatos.padEnd(35)} | ${esperado.padEnd(10)} | ${real.padEnd(28)} | ${coincide ? 'Sí' : 'No'}`
  );
}

console.log(`\nCoinciden ${coinciden} de ${casos.length} casos.`);
