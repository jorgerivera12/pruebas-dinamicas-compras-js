// Regresión ampliada para la corrección de DEF-04.
// Compara la fórmula anterior y la nueva del total (las dos con el mismo redondeo)
// contra un resultado de referencia calculado con enteros (BigInt), sin punto flotante.
//   Anterior: subtotal - subtotal * descuento / 100
//   Nueva:    subtotal * (100 - descuento) / 100
// Uso: node scripts/comparar-formulas.js

function redondearCentavos(valor) {
  return Math.round(Number((valor * 100).toPrecision(15))) / 100;
}

const formulas = {
  anterior: (p, c, d) => {
    const subtotal = p * c;
    return redondearCentavos(subtotal - subtotal * d / 100);
  },
  nueva: (p, c, d) => redondearCentavos(p * c * (100 - d) / 100),
};

// Referencia exacta. El precio va en centavos y el descuento en centésimas de punto
// porcentual, así que el total exacto en centavos es
// centavos * cantidad * (10000 - descuento * 100) / 10000.
// Se redondea al centavo más cercano y, en los empates, hacia arriba.
function referencia(centavos, cantidad, descuentoCentesimas) {
  const numerador = BigInt(centavos) * BigInt(cantidad) * BigInt(10000 - descuentoCentesimas);
  const redondeado = (2n * numerador + 10000n) / 20000n;
  return Number(redondeado) / 100;
}

const cantidades = [1, 2, 3, 7, 12];
const descuentos = [0, 5, 12.5, 15, 33.33, 50, 99.99, 100];
const MAX_CENTAVOS = 100000; // precios de 0,00 a 999,99

const resultado = {
  anterior: { fallos: 0, menosCero: 0, ejemplos: [] },
  nueva: { fallos: 0, menosCero: 0, ejemplos: [] },
};
let combinaciones = 0;

for (let centavos = 0; centavos < MAX_CENTAVOS; centavos++) {
  const precio = centavos / 100;
  for (const cantidad of cantidades) {
    for (const descuento of descuentos) {
      combinaciones++;
      const esperado = referencia(centavos, cantidad, Math.round(descuento * 100));
      for (const [nombre, formula] of Object.entries(formulas)) {
        const obtenido = formula(precio, cantidad, descuento);
        if (!Object.is(obtenido, esperado)) {
          const r = resultado[nombre];
          r.fallos++;
          const esMenosCero = Object.is(obtenido, -0);
          if (esMenosCero) {
            r.menosCero++;
          }
          // Guarda hasta 2 ejemplos de -0 y hasta 3 de otro tipo de diferencia.
          const delMismoTipo = r.ejemplos.filter((e) => e.menosCero === esMenosCero).length;
          if (delMismoTipo < (esMenosCero ? 2 : 3)) {
            const texto = esMenosCero ? '-0' : String(obtenido);
            r.ejemplos.push({
              menosCero: esMenosCero,
              texto: `(${precio}, ${cantidad}, ${descuento}) -> ${texto}, esperado ${esperado}`,
            });
          }
        }
      }
    }
  }
}

console.log(`Node.js ${process.version}`);
console.log(`Combinaciones: ${combinaciones} (precios de 0,00 a 999,99; cantidades ${cantidades.join(', ')}; descuentos ${descuentos.join(', ')})\n`);
for (const [nombre, r] of Object.entries(resultado)) {
  console.log(`Fórmula ${nombre}: ${r.fallos} diferencias con la referencia exacta (${r.menosCero} de ellas son -0)`);
  for (const ejemplo of r.ejemplos) {
    console.log(`  ${ejemplo.texto}`);
  }
}
