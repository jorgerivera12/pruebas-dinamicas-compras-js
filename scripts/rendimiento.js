// PR-01 (RNF-01): medición exploratoria del tiempo de ejecución de calcularTotal.
// Compara la versión corregida con una copia del código del enunciado, para ver cuánto
// cuestan las validaciones y el redondeo. No es una prueba de carga: mide una función
// síncrona en un solo proceso.
// Uso: node scripts/rendimiento.js

const os = require('os');
const fs = require('fs');
const { calcularTotal } = require('../src/compras');

// Copia del código del enunciado (commit 373d625), solo para comparar.
function calcularTotalInicial(precio, cantidad, descuento) {
  const subtotal = precio * cantidad;
  const valorDescuento = subtotal * descuento / 100;
  return subtotal - valorDescuento;
}

// Variante solo para el análisis: las validaciones y la fórmula de la versión corregida,
// pero sin redondeo. Sirve para separar cuánto cuestan las validaciones y cuánto el redondeo.
function calcularTotalSinRedondeo(precio, cantidad, descuento) {
  for (const valor of [precio, cantidad, descuento]) {
    if (!Number.isFinite(valor)) {
      throw new TypeError('Dato no finito');
    }
  }
  if (precio < 0 || cantidad <= 0 || descuento < 0 || descuento > 100) {
    throw new RangeError('Dato fuera de rango');
  }
  return precio * cantidad * (100 - descuento) / 100;
}

const LLAMADAS_POR_TANDA = 10000; // tamaño de la tanda de la referencia S-01 de la Unidad 1
const TANDAS = 30;
const CALENTAMIENTO = 200000; // llamadas previas para que V8 optimice la función
const UMBRAL_S01_NS = 1e6; // 1 ms: referencia S-01 de la Unidad 1 (no aprobada)

// Datos válidos variados y deterministas (generador congruencial lineal), para que
// V8 no pueda tratar el resultado como una constante y para que la medición se repita igual.
function generarDatos(n) {
  let semilla = 12345;
  const siguiente = () => {
    semilla = (semilla * 1103515245 + 12345) % 2147483648;
    return semilla / 2147483648;
  };
  const datos = [];
  for (let i = 0; i < n; i++) {
    datos.push([
      Math.round(siguiente() * 100000) / 100, // precio de 0,00 a 1000,00
      1 + Math.floor(siguiente() * 20), // cantidad de 1 a 20
      Math.round(siguiente() * 10000) / 100, // descuento de 0,00 a 100,00
    ]);
  }
  return datos;
}

function percentil(ordenados, p) {
  const indice = Math.min(ordenados.length - 1, Math.ceil((p / 100) * ordenados.length) - 1);
  return ordenados[indice];
}

// Costo de dos lecturas consecutivas del reloj: se incluye en cada medición individual.
function medirCostoDelReloj() {
  const muestras = [];
  for (let i = 0; i < 100000; i++) {
    const inicio = process.hrtime.bigint();
    const fin = process.hrtime.bigint();
    muestras.push(Number(fin - inicio));
  }
  muestras.sort((a, b) => a - b);
  return percentil(muestras, 50);
}

let sumidero = 0; // acumula los resultados para que V8 no elimine las llamadas

function medir(nombre, funcion, datos) {
  for (let i = 0; i < CALENTAMIENTO; i++) {
    const [p, c, d] = datos[i % datos.length];
    sumidero += funcion(p, c, d);
  }

  const porLlamada = []; // tiempo de cada llamada individual (incluye el costo del reloj)
  const promedioPorTanda = []; // tiempo total de la tanda dividido por el número de llamadas
  let llamadasSobreUmbral = 0;

  for (let t = 0; t < TANDAS; t++) {
    // a) Llamadas medidas una por una: permite obtener percentiles por llamada (S-01).
    for (let i = 0; i < LLAMADAS_POR_TANDA; i++) {
      const [p, c, d] = datos[i];
      const inicio = process.hrtime.bigint();
      sumidero += funcion(p, c, d);
      const duracion = Number(process.hrtime.bigint() - inicio);
      porLlamada.push(duracion);
      if (duracion > UMBRAL_S01_NS) {
        llamadasSobreUmbral++;
      }
    }
    // b) La misma tanda medida en bloque: evita que el costo del reloj domine.
    const inicioTanda = process.hrtime.bigint();
    for (let i = 0; i < LLAMADAS_POR_TANDA; i++) {
      const [p, c, d] = datos[i];
      sumidero += funcion(p, c, d);
    }
    promedioPorTanda.push(Number(process.hrtime.bigint() - inicioTanda) / LLAMADAS_POR_TANDA);
  }

  porLlamada.sort((a, b) => a - b);
  promedioPorTanda.sort((a, b) => a - b);
  return {
    nombre,
    llamadas: porLlamada.length,
    p50: percentil(porLlamada, 50),
    p95: percentil(porLlamada, 95),
    p99: percentil(porLlamada, 99),
    maximo: porLlamada[porLlamada.length - 1],
    llamadasSobreUmbral,
    bloqueMediana: percentil(promedioPorTanda, 50),
    bloqueMin: promedioPorTanda[0],
    bloqueMax: promedioPorTanda[promedioPorTanda.length - 1],
  };
}

function leerGobernadorCpu() {
  try {
    return fs.readFileSync('/sys/devices/system/cpu/cpu0/cpufreq/scaling_governor', 'utf8').trim();
  } catch {
    return 'no disponible';
  }
}

const formato = (ns) => `${ns.toFixed(0).padStart(7)} ns`;

const datos = generarDatos(LLAMADAS_POR_TANDA);
const costoReloj = medirCostoDelReloj();
const [carga1, carga5] = os.loadavg();

console.log('PR-01: medición exploratoria de rendimiento de calcularTotal');
console.log(`Fecha: ${new Date().toISOString()}`);
console.log('\nEntorno');
console.log(`  Node.js ${process.version} (V8 ${process.versions.v8})`);
console.log(`  Sistema: ${os.type()} ${os.release()} ${os.arch()}`);
console.log(`  CPU: ${os.cpus()[0].model} (${os.cpus().length} hilos), gobernador de frecuencia: ${leerGobernadorCpu()}`);
console.log(`  Memoria: ${(os.totalmem() / 2 ** 30).toFixed(1)} GiB; carga media al iniciar: ${carga1.toFixed(2)} (1 min), ${carga5.toFixed(2)} (5 min)`);
console.log('\nMétodo');
console.log(`  ${CALENTAMIENTO} llamadas de calentamiento y luego ${TANDAS} tandas de ${LLAMADAS_POR_TANDA} llamadas con datos válidos variados.`);
console.log('  a) Cada llamada se mide por separado con process.hrtime.bigint() para obtener percentiles por llamada.');
console.log('  b) Cada tanda se mide también en bloque para estimar el costo real por llamada sin el costo del reloj.');
console.log(`  Costo de leer el reloj dos veces (mediana): ${costoReloj} ns. Está incluido en los tiempos de (a).`);

const resultados = [
  medir('Inicial (enunciado)', calcularTotalInicial, datos),
  medir('Corregida sin redondeo (solo análisis)', calcularTotalSinRedondeo, datos),
  medir('Corregida', calcularTotal, datos),
];

console.log('\nResultados');
for (const r of resultados) {
  console.log(`  ${r.nombre}`);
  console.log(`    (a) por llamada, ${r.llamadas} llamadas: p50 ${formato(r.p50)} | p95 ${formato(r.p95)} | p99 ${formato(r.p99)} | máximo ${formato(r.maximo)}`);
  console.log(`        llamadas por encima de 1 ms: ${r.llamadasSobreUmbral}`);
  console.log(`    (b) en bloque, promedio por llamada: mediana ${formato(r.bloqueMediana)} (mín. ${r.bloqueMin.toFixed(1)} ns, máx. ${r.bloqueMax.toFixed(1)} ns entre tandas)`);
  console.log(`        aproximadamente ${(1e9 / r.bloqueMediana / 1e6).toFixed(1)} millones de llamadas por segundo`);
}

const [inicial, sinRedondeo, corregida] = resultados;
console.log('\nComparación (bloque, mediana)');
console.log(`  Costo adicional de la versión corregida: ${(corregida.bloqueMediana - inicial.bloqueMediana).toFixed(1)} ns por llamada (${(corregida.bloqueMediana / inicial.bloqueMediana).toFixed(1)} veces el tiempo inicial).`);
console.log(`    - validaciones y fórmula: ${(sinRedondeo.bloqueMediana - inicial.bloqueMediana).toFixed(1)} ns`);
console.log(`    - redondeo con toPrecision: ${(corregida.bloqueMediana - sinRedondeo.bloqueMediana).toFixed(1)} ns`);
console.log(`  Referencia S-01 de la Unidad 1 (no aprobada): p95 <= 1 ms. p95 de la versión corregida: ${corregida.p95} ns, ${(UMBRAL_S01_NS / corregida.p95).toFixed(0)} veces por debajo del umbral.`);
console.log(`\n(Valor de control para evitar que se eliminen las llamadas: ${sumidero.toFixed(2)})`);
