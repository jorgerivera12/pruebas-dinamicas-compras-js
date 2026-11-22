# Pruebas dinámicas del módulo de compras

En este repositorio están las pruebas dinámicas del módulo que calcula el total de una compra en una tienda digital. Planifiqué las pruebas, diseñé los casos con particiones de equivalencia y valores límite, los automaticé con Jest, registré los defectos que encontré y los corregí de a uno, con una regresión después de cada corrección. Al final hice una medición exploratoria de rendimiento.

Es la continuación de la Unidad 1 ([auditoría estática](https://github.com/jorgerivera12/auditoria-estatica-descuentos-js)), donde revisé un módulo parecido sin ejecutarlo.

Repositorio: https://github.com/jorgerivera12/pruebas-dinamicas-compras-js

## Requisitos del módulo

`calcularTotal(precio, cantidad, descuento)`:

- **RF-01:** subtotal = precio × cantidad para números positivos.
- **RF-02:** descuento de 0 a 100 %.
- **RF-03:** total con dos decimales (100 % produce 0).
- **RF-04:** `RangeError` para precio negativo, cantidad ≤ 0 o descuento fuera de rango.
- **RF-05:** `TypeError` para entradas no numéricas o no finitas.
- **RNF-01:** exploración limitada de rendimiento.

## Contenido

- `src/compras.js`: el módulo, ya corregido. La versión original está en el primer commit (`373d625`).
- `tests/compras.test.js`: 20 pruebas automatizadas (CP-01 a CP-20).
- `docs/plan-pruebas.md`: alcance, ambigüedades de la especificación, riesgos, niveles y tipos de prueba, ambiente y criterios de entrada y salida.
- `docs/matriz-casos.md`: particiones, valores límite, los 21 casos (20 funcionales y 1 de rendimiento), la trazabilidad y el historial de ejecución.
- `docs/defectos.md`: los cuatro defectos, con sus pasos, esperado, real, severidad y evidencia, y el seguimiento de cada corrección.
- `docs/reporte-pruebas.md`: resultados, cobertura por requisito, rendimiento, criterios de salida, riesgos residuales y lecciones aprendidas.
- `evidencias/`: las salidas reales de cada ejecución.
- `scripts/`: herramientas de apoyo (ver más abajo).

## Cómo reproducirlo

Se necesita Node.js 18.14 o superior. Abre la carpeta en Visual Studio Code y ejecuta en la terminal:

```bash
npm install
npm test                # las 20 pruebas con Jest (jest --runInBand)
npm run test:coverage   # las mismas pruebas con reporte de cobertura
npm run reproducir      # los casos fuera de Jest, mostrando el resultado real
npm run rendimiento     # la medición exploratoria PR-01
```

También están estos dos scripts, que tardan unos segundos:

```bash
node scripts/explorar-redondeo.js   # compara cuatro técnicas de redondeo (10 millones de empates)
node scripts/comparar-formulas.js   # compara la fórmula anterior y la nueva contra una referencia exacta
```

Para ver cómo fallaban las pruebas con el código original:

```bash
git checkout 373d625 -- src/compras.js
npm test
git checkout HEAD -- src/compras.js
```

## Resultados

| Ejecución | Pasan | Evidencia |
|---|---|---|
| Código del enunciado | 6 de 19 | `evidencias/pruebas-iniciales.txt` |
| Después de corregir DEF-02 | 11 de 19 | `evidencias/pruebas-correccion-DEF-02.txt` |
| Después de corregir DEF-03 | 17 de 19 | `evidencias/pruebas-correccion-DEF-03.txt` |
| Se agrega CP-20 | 17 de 20 | `evidencias/pruebas-caso-CP-20.txt` |
| Después de corregir DEF-01 | 19 de 20 | `evidencias/pruebas-correccion-DEF-01.txt` |
| **Final, después de corregir DEF-04** | **20 de 20** | `evidencias/pruebas-finales.txt` |

| Defecto | Qué pasaba | Severidad |
|---|---|---|
| DEF-01 | El total no se redondeaba: `(19.99, 3, 15)` daba `50.9745`. | Media |
| DEF-02 | No se validaba el rango: `(10, -2, 0)` daba `-20`. | Alta |
| DEF-03 | No se validaba el tipo: `("100", 2, 10)` daba `180`. | Alta |
| DEF-04 | El 100 % de descuento no siempre daba 0: `(0.07, 3, 100)` daba `-2.78e-17`. | Media |

En la versión corregida, el rendimiento fue de unos 300 ns por llamada, con un p95 de 611 ns como máximo. Está muy por debajo de la referencia de 1 ms que propuse en la Unidad 1.

## Qué se corrigió

1. **DEF-02:** se lanza `RangeError` si el precio es negativo, la cantidad es ≤ 0 o el descuento está fuera de 0–100.
2. **DEF-03:** se lanza `TypeError` si algún dato no es un número finito. Uso `Number.isFinite`, que no convierte textos, y la validación va antes que la de rango.
3. **DEF-01:** el total se redondea al centavo con `Math.round(Number((x * 100).toPrecision(15))) / 100`. Fue la única técnica que no falló en ningún empate ,xx5.
4. **DEF-04:** el total se calcula como `subtotal * (100 - descuento) / 100`, en lugar de restar el descuento, para que con 100 % el resultado sea exactamente 0.

No cambié los requisitos ni los resultados esperados de las pruebas para que el código pasara. Lo que la especificación no define (el redondeo de los empates, las cantidades decimales y el importe máximo) quedó anotado como riesgo residual en el reporte.

## Historial de commits

Cada etapa del trabajo está en su propio commit:

1. Agrega el módulo de compras inicial.
2. Agrega el plan de pruebas y la matriz de casos (Fase A).
3. Configura Jest, automatiza los casos y guarda la ejecución inicial (Fase B).
4. Registra los defectos confirmados en la ejecución inicial (Fase C).
5. Corrige DEF-02.
6. Corrige DEF-03.
7. Agrega CP-20 y registra DEF-04.
8. Corrige DEF-01.
9. Corrige DEF-04 y guarda la regresión final.
10. Mide el rendimiento y agrega el reporte de pruebas y el README (Fase D).
