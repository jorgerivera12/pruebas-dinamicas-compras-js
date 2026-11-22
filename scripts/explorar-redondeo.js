// Prueba exploratoria para elegir la técnica de redondeo de DEF-01 (RF-03).
// Compara cuatro técnicas con valores que la aritmética binaria no puede representar
// de forma exacta. El "esperado" usa redondeo al centavo más cercano y, en los empates
// (,xx5), redondea hacia arriba. RF-03 no define este modo (supuesto A-03).
// Uso: node scripts/explorar-redondeo.js

const tecnicas = {
  'A: Math.round(x*100)/100': (x) => Math.round(x * 100) / 100,
  'B: con Number.EPSILON': (x) => Math.round((x + Number.EPSILON) * 100) / 100,
  'C: Number(x.toFixed(2))': (x) => Number(x.toFixed(2)),
  'D: toPrecision(15)': (x) => Math.round(Number((x * 100).toPrecision(15))) / 100,
};

// [valor, esperado, de dónde sale]
const valores = [
  [50.9745, 50.97, 'CP-07: 19,99 × 3 con 15 %'],
  [0.1 * 3, 0.3, 'CP-08: 0,1 × 3'],
  [1.005, 1.01, 'empate ,xx5'],
  [2.675, 2.68, 'empate ,xx5'],
  [2.135, 2.14, 'empate ,xx5'],
  [4.015, 4.02, 'empate ,xx5'],
  [8.345, 8.35, 'empate ,xx5'],
  [1234.005, 1234.01, 'empate ,xx5 con un importe mayor'],
  [19.99 * 3 * 0.75, 44.98, '19,99 × 3 con 25 % = 44,9775'],
  [0, 0, 'descuento 100 %'],
];

console.log(`Node.js ${process.version}\n`);
const aciertos = Object.fromEntries(Object.keys(tecnicas).map((t) => [t, 0]));

for (const [valor, esperado, origen] of valores) {
  console.log(`Valor ${valor} (${origen}); esperado ${esperado}`);
  for (const [nombre, redondear] of Object.entries(tecnicas)) {
    const obtenido = redondear(valor);
    const ok = Object.is(obtenido, esperado);
    if (ok) {
      aciertos[nombre]++;
    }
    console.log(`  ${nombre.padEnd(28)} -> ${String(obtenido).padEnd(10)} ${ok ? 'OK' : 'DIFERENTE'}`);
  }
}

console.log('\nResumen de aciertos:');
for (const [nombre, total] of Object.entries(aciertos)) {
  console.log(`  ${nombre.padEnd(28)} ${total} de ${valores.length}`);
}

// Barrido de todos los empates ,xx5 entre 0,005 y 99 999,995 (10 millones de valores).
// Cada valor se construye desde su texto decimal, como llegaría escrito, y el esperado
// es el centavo siguiente.
const LIMITE = 10000000;
const fallos = Object.fromEntries(Object.keys(tecnicas).map((t) => [t, 0]));
const ejemplos = Object.fromEntries(Object.keys(tecnicas).map((t) => [t, []]));
for (let centavos = 0; centavos < LIMITE; centavos++) {
  const texto = `${Math.floor(centavos / 100)}.${String(centavos % 100).padStart(2, '0')}5`;
  const valor = Number(texto);
  const esperado = Number(((centavos + 1) / 100).toFixed(2));
  for (const [nombre, redondear] of Object.entries(tecnicas)) {
    if (redondear(valor) !== esperado) {
      fallos[nombre]++;
      if (ejemplos[nombre].length < 3) {
        ejemplos[nombre].push(texto);
      }
    }
  }
}

console.log(`\nBarrido de ${LIMITE} empates (0,005 a 99 999,995):`);
for (const [nombre, total] of Object.entries(fallos)) {
  const muestra = ejemplos[nombre].length ? ` (por ejemplo: ${ejemplos[nombre].join(', ')})` : '';
  console.log(`  ${nombre.padEnd(28)} ${total} fallos${muestra}`);
}
