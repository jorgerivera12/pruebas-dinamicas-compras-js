# Matriz de casos de prueba

En esta matriz están los casos que diseñé a partir de RF-01 a RF-05 y RNF-01, siguiendo el [plan de pruebas](plan-pruebas.md). Cada caso tiene un solo objetivo, datos concretos y un resultado esperado que se puede observar. Antes de ejecutarlos revisé que todos cumplieran esas tres condiciones y que estuvieran relacionados con un requisito.

**Precondición común:** el módulo `src/compras.js` se carga con `require` en un ambiente con Node.js 18.

**Pasos comunes:**

1. Llamar a `calcularTotal(precio, cantidad, descuento)` con los datos del caso.
2. Comparar el valor devuelto, o el error lanzado, con el resultado esperado.

En la columna de datos el orden siempre es **(precio, cantidad, descuento)**.

## 1. Particiones de equivalencia

Para cada parámetro separé las clases de valores que el módulo debería tratar igual. Los casos de la matriz eligen un representante de cada clase.

| Parámetro | Clase válida | Clases inválidas por rango (RF-04) | Clases inválidas por tipo (RF-05) |
|---|---|---|---|
| precio | **P-V1:** número finito ≥ 0 | **P-I1:** número < 0 | **P-I2:** no es `number` (texto, `null`, `undefined`)<br>**P-I3:** `NaN` o ±`Infinity` |
| cantidad | **C-V1:** número finito > 0 | **C-I1:** número ≤ 0 | **C-I2:** no es `number`<br>**C-I3:** `NaN` o ±`Infinity` |
| descuento | **D-V1:** número finito entre 0 y 100 | **D-I1:** número < 0<br>**D-I2:** número > 100 | **D-I3:** no es `number`<br>**D-I4:** `NaN` o ±`Infinity` |

Para el resultado también separé dos clases: **T-1**, un total exacto que no necesita redondeo, y **T-2**, un total con más de dos decimales que sí necesita redondeo (RF-03).

Después de la ejecución inicial agregué una tercera clase de salida: **T-3**, descuento del 100 % sobre un subtotal que no se representa de forma exacta en binario. Esta clase la encontré en la prueba exploratoria del redondeo (DEF-04). CP-06 pertenece a T-1, porque 19,99 × 3 sí da un resultado exacto, así que no la cubría.

## 2. Valores límite

| Parámetro | Último valor inválido | Primer valor válido | Último valor válido | Primer valor inválido |
|---|---|---|---|---|
| precio | -0,01 (CP-09) | 0 (CP-03) | sin límite superior | - |
| cantidad | 0 (CP-10) | 1 (CP-04) | sin límite superior | - |
| descuento | -0,01 (CP-12) | 0 (CP-05) | 100 (CP-06) | 100,01 (CP-13) |

Para el descuento uso un paso de 0,01 (supuesto A-05). La cantidad la pruebo con números enteros (A-02).

## 3. Casos de prueba

**Prioridad:**

- Alta: si falla, puede terminar en un cobro equivocado o en un error que pasa desapercibido.
- Media: es un borde menos frecuente o un caso que confirma una regla ya cubierta por otro caso.
- Baja: es informativo.

| ID | Requisito | Técnica | Tipo | Datos | Resultado esperado | Prioridad | Estado |
|---|---|---|---|---|---|---|---|
| CP-01 | RF-01, RF-02 | Partición (P-V1, C-V1, D-V1, T-1) | Positivo | (25, 4, 10) | `90` | Alta | Pasa |
| CP-02 | RF-01, RF-02 | Partición (P-V1 con decimales, T-1) | Positivo alterno | (12.5, 3, 20) | `30` | Alta | Pasa |
| CP-03 | RF-01 | Valor límite: precio = 0 (A-01) | Borde | (0, 5, 10) | `0` | Media | Pasa |
| CP-04 | RF-01 | Valor límite: cantidad = 1 | Borde | (49.99, 1, 0) | `49.99` | Media | Pasa |
| CP-05 | RF-02 | Valor límite: descuento = 0 | Borde | (80, 2, 0) | `160` | Alta | Pasa |
| CP-06 | RF-02, RF-03 | Valor límite: descuento = 100 | Borde | (19.99, 3, 100) | `0` | Alta | Pasa |
| CP-07 | RF-03 | Partición de salida T-2 (redondeo) | Positivo | (19.99, 3, 15) | `50.97` (el valor exacto es 50,9745) | Alta | Pasa (DEF-01 corregido) |
| CP-08 | RF-03 | Partición de salida T-2 (error de punto flotante) | Positivo | (0.1, 3, 0) | `0.3` | Media | Pasa (DEF-01 corregido) |
| CP-09 | RF-04 | Valor límite: precio = -0,01 (P-I1) | Negativo / borde | (-0.01, 1, 0) | Lanza `RangeError` | Alta | Pasa (DEF-02 corregido) |
| CP-10 | RF-04 | Valor límite: cantidad = 0 (C-I1) | Negativo / borde | (10, 0, 0) | Lanza `RangeError` | Alta | Pasa (DEF-02 corregido) |
| CP-11 | RF-04 | Partición C-I1: cantidad negativa | Negativo | (10, -2, 0) | Lanza `RangeError` | Alta | Pasa (DEF-02 corregido) |
| CP-12 | RF-04 | Valor límite: descuento = -0,01 (D-I1) | Negativo / borde | (100, 1, -0.01) | Lanza `RangeError` | Alta | Pasa (DEF-02 corregido) |
| CP-13 | RF-04 | Valor límite: descuento = 100,01 (D-I2) | Negativo / borde | (100, 1, 100.01) | Lanza `RangeError` | Alta | Pasa (DEF-02 corregido) |
| CP-14 | RF-05 | Partición P-I2: precio como texto | Negativo | ("100", 2, 10) | Lanza `TypeError` | Alta | Pasa (DEF-03 corregido) |
| CP-15 | RF-05 | Partición C-I2: cantidad `null` | Negativo | (100, null, 10) | Lanza `TypeError` | Alta | Pasa (DEF-03 corregido) |
| CP-16 | RF-05 | Partición D-I3: descuento `undefined` (argumento omitido) | Negativo | (100, 2, undefined) | Lanza `TypeError` | Media | Pasa (DEF-03 corregido) |
| CP-17 | RF-05 | Partición P-I3: precio `NaN` | Negativo | (NaN, 2, 10) | Lanza `TypeError` | Alta | Pasa (DEF-03 corregido) |
| CP-18 | RF-05 | Partición C-I3: cantidad `Infinity` | Negativo | (100, Infinity, 10) | Lanza `TypeError` | Media | Pasa (DEF-03 corregido) |
| CP-19 | RF-05 (frente a RF-04) | Partición D-I4: descuento `-Infinity`, precedencia del tipo sobre el rango (A-04) | Negativo | (100, 2, -Infinity) | Lanza `TypeError`, no `RangeError` | Media | Pasa (DEF-03 corregido) |
| CP-20 | RF-03 | Partición de salida T-3 (agregado tras la exploración del redondeo) | Borde | (0.07, 3, 100) | `0`, ni un residuo ni `-0` | Alta | Pasa (DEF-04 corregido) |
| PR-01 | RNF-01 | Medición exploratoria del tiempo de ejecución | No funcional | 10 000 llamadas con datos válidos, repetidas varias veces después de un calentamiento | Informar la mediana y el percentil 95 del tiempo por llamada y compararlos con la referencia S-01 de la Unidad 1 (≤ 1 ms en el 95 %), que no está aprobada | Baja | Ejecutado: p95 de 541 a 611 ns, informativo (ver [reporte](reporte-pruebas.md)) |

Los casos CP-01 a CP-20 se automatizan con Jest en `tests/compras.test.js`. CP-20 no estaba en el diseño original: lo agregué después de la ejecución inicial, cuando la prueba exploratoria del redondeo mostró que el 100 % de descuento no siempre produce 0. PR-01 se ejecuta con un script aparte, porque una medición de tiempo dentro de la suite haría que el resultado de las pruebas dependiera de la carga de la máquina.

## 4. Trazabilidad requisito-caso

| Requisito | Casos positivos o de borde | Casos negativos | Total |
|---|---|---|---|
| RF-01 | CP-01, CP-02, CP-03, CP-04 | - | 4 |
| RF-02 | CP-01, CP-02, CP-05, CP-06 | - | 4 |
| RF-03 | CP-06, CP-07, CP-08, CP-20 | - | 4 |
| RF-04 | - | CP-09, CP-10, CP-11, CP-12, CP-13 | 5 |
| RF-05 | - | CP-14, CP-15, CP-16, CP-17, CP-18, CP-19 | 6 |
| RNF-01 | PR-01 | - | 1 |

Todos los requisitos tienen al menos un caso. Las clases inválidas (P-I1 a D-I4) tienen todas un representante. Los rangos de RF-04 y RF-05 los cubren solo casos negativos, porque su comportamiento esperado es justamente rechazar los datos.

## 5. Historial de ejecución

| Ejecución | Versión del código | Pasan | Fallan | Evidencia |
|---|---|---|---|---|
| Inicial | Código del enunciado, sin cambios (`373d625`) | 6 (CP-01 a CP-06) | 13 (CP-07 a CP-19) | `evidencias/pruebas-iniciales.txt` y `evidencias/resultados-reales-iniciales.txt` |
| Corrección 1 | Validación de rango (DEF-02) | 11 (CP-01 a CP-06, CP-09 a CP-13) | 8 (CP-07, CP-08, CP-14 a CP-19) | `evidencias/pruebas-correccion-DEF-02.txt` |
| Corrección 2 | Validación de tipo antes del rango (DEF-03) | 17 (CP-01 a CP-06, CP-09 a CP-19) | 2 (CP-07, CP-08) | `evidencias/pruebas-correccion-DEF-03.txt` |
| Nuevo caso CP-20 | Igual que en la corrección 2: solo se agregó el caso | 17 de 20 | 3 (CP-07, CP-08, CP-20) | `evidencias/pruebas-caso-CP-20.txt` |
| Corrección 3 | Redondeo a centavos (DEF-01) | 19 de 20 | 1 (CP-20) | `evidencias/pruebas-correccion-DEF-01.txt` |
| Corrección 4 (final) | Fórmula sin resta (DEF-04) | **20 de 20** | **0** | `evidencias/pruebas-finales.txt`, `evidencias/resultados-reales-finales.txt` y `evidencias/cobertura.txt` |

La columna "Estado" de la sección 3 muestra el resultado de la última ejecución. Los casos que pasan en la ejecución inicial son todos los que usan datos válidos y no necesitan redondeo. Fallan todos los de redondeo y todos los de datos inválidos. Confirmé las 13 fallas reproduciéndolas fuera de Jest y las agrupé en tres defectos según su causa: DEF-01, DEF-02 y DEF-03, en [defectos.md](defectos.md). El cuarto defecto, DEF-04, apareció después, con CP-20.

CP-06 pasó en todas las ejecuciones y aun así el requisito que verifica tenía un defecto. Su dato (19,99 × 3) resultó exacto por casualidad. Es un ejemplo concreto de que una prueba que pasa no demuestra que no haya defectos: solo informa sobre los datos que se usaron.
