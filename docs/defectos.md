# Registro de defectos

## Cómo confirmé las fallas

La ejecución inicial con Jest dio 13 casos fallidos (`evidencias/pruebas-iniciales.txt`). Antes de registrar cualquier defecto revisé que la falla estuviera en el código y no en la prueba, en los datos o en el ambiente. Lo hice en cuatro pasos:

1. **Resultado esperado.** Volví a calcular cada resultado esperado a mano a partir del requisito, sin mirar lo que devuelve el código. Por ejemplo, 19,99 × 3 = 59,97 y con 15 % de descuento queda 50,9745, que con dos decimales es 50,97.
2. **Reproducción fuera de Jest.** Ejecuté los mismos datos con `node scripts/reproducir-casos.js`. Obtuve las mismas 13 discrepancias, así que la falla no depende de Jest ni de cómo están escritas las aserciones (`evidencias/resultados-reales-iniciales.txt`).
3. **Valor real.** Con ese script anoté lo que devuelve el código, porque Jest solo informa "did not throw" cuando se esperaba un error.
4. **Agrupación por causa.** Agrupé las 13 fallas según su causa. Cada defecto corresponde a una regla de la especificación que el código no implementa, y por eso se corrige con un solo cambio.

**Datos comunes a todos los defectos:**

- **Versión:** `src/compras.js` del commit `373d625` (código del enunciado, sin cambios).
- **Ambiente:** Ubuntu 24.04.4 LTS, Node.js 18.19.1, Jest 30.5.2.
- **Precondición:** el módulo se carga con `require('./src/compras')`.
- **Detectado por:** Jorge Rivera, en la ejecución inicial.

**Criterio de severidad y prioridad.** Uso la tabla de la Unidad 2. La severidad mide el impacto técnico o funcional; la prioridad mide la urgencia de corregirlo para el proyecto. Las dos no siempre coinciden, como se ve en DEF-01.

## Resumen

| ID | Título | Requisito | Casos que fallan | Severidad | Prioridad | Estado |
|---|---|---|---|---|---|---|
| DEF-01 | El total no se redondea a dos decimales | RF-03 | CP-07, CP-08 | Media | Alta | Abierto |
| DEF-02 | No se rechazan valores fuera de rango y el total puede quedar negativo | RF-04 | CP-09 a CP-13 | Alta | Alta | Corregido y verificado |
| DEF-03 | No se rechazan entradas no numéricas ni no finitas | RF-05 | CP-14 a CP-19 | Alta | Alta | Corregido y verificado |
| DEF-04 | El 100 % de descuento no siempre produce 0 | RF-03 | CP-20 (agregado después) | Media | Media | Abierto |

## DEF-01: el total no se redondea a dos decimales

| Campo | Detalle |
|---|---|
| Requisito | RF-03: total con dos decimales. |
| Casos | CP-07, CP-08 |
| Pasos | 1. Llamar a `calcularTotal(19.99, 3, 15)`.<br>2. Llamar a `calcularTotal(0.1, 3, 0)`. |
| Resultado esperado | `50.97` y `0.3` |
| Resultado real | `50.9745` y `0.30000000000000004` |
| Severidad | **Media.** El cálculo es correcto en esencia, pero el valor devuelto no respeta el formato acordado y puede generar diferencias de centavos entre el total cobrado y el mostrado. Quien llama a la función podría redondear por su cuenta, así que existe una solución temporal. |
| Prioridad | **Alta.** Afecta a cualquier compra con precios decimales, que son la mayoría. Además el requisito es explícito y corregirlo cuesta poco. |
| Causa probable | La función devuelve `subtotal - valorDescuento` tal como lo calcula la aritmética de punto flotante (IEEE 754), sin ningún redondeo. El caso CP-08 muestra que el problema aparece incluso sin descuento: 0,1 no tiene una representación binaria exacta. |
| Evidencia | `evidencias/pruebas-iniciales.txt` (CP-07 y CP-08, Expected/Received) y `evidencias/resultados-reales-iniciales.txt` |
| Estado | Abierto |

**Observación:** CP-06 (descuento 100 %) pasa en el código inicial. RF-03 se cumple solo en parte: el total con 100 % de descuento ya da 0, pero el redondeo no existe.

## DEF-02: no se rechazan valores fuera de rango y el total puede quedar negativo

| Campo | Detalle |
|---|---|
| Requisito | RF-04: `RangeError` para precio negativo, cantidad ≤ 0 o descuento fuera de 0–100. |
| Casos | CP-09, CP-10, CP-11, CP-12, CP-13 |
| Pasos y resultados | Ver la tabla siguiente. |
| Resultado esperado | En todos los casos se lanza `RangeError` y no se devuelve ningún total. |
| Severidad | **Alta.** La función devuelve totales que no tienen sentido como si fueran válidos: totales negativos (la tienda le pagaría al cliente) y totales mayores que el subtotal (al cliente se le cobra de más). No hay una alternativa aceptable dentro del módulo. |
| Prioridad | **Alta.** Bloquea la liberación: es el mismo riesgo económico que en la Unidad 1 identifiqué como el más costoso (R-03, total negativo). |
| Causa probable | La función no valida ningún rango. Aplica la fórmula a cualquier número. |
| Evidencia | `evidencias/pruebas-iniciales.txt` ("Received function did not throw") y `evidencias/resultados-reales-iniciales.txt` |
| Estado | Corregido y verificado (ver "Seguimiento de las correcciones"). |

| Caso | Datos | Resultado real | Problema |
|---|---|---|---|
| CP-09 | (-0.01, 1, 0) | `-0.01` | Total negativo. |
| CP-10 | (10, 0, 0) | `0` | Se acepta una compra de 0 unidades. |
| CP-11 | (10, -2, 0) | `-20` | Total negativo. |
| CP-12 | (100, 1, -0.01) | `100.01` | El descuento negativo **sube** el precio. |
| CP-13 | (100, 1, 100.01) | `-0.010000000000005116` | Total negativo y, además, sin redondear (también aparece DEF-01). |

## DEF-03: no se rechazan entradas no numéricas ni no finitas

| Campo | Detalle |
|---|---|
| Requisito | RF-05: `TypeError` para entradas no numéricas o no finitas. |
| Casos | CP-14, CP-15, CP-16, CP-17, CP-18, CP-19 |
| Pasos y resultados | Ver la tabla siguiente. |
| Resultado esperado | En todos los casos se lanza `TypeError`. |
| Severidad | **Alta.** El caso más peligroso es CP-14: el texto `"100"` se convierte solo en número y la función devuelve `180`, un total que parece correcto. El error pasa desapercibido y nadie se entera de que el dato venía mal. En los demás casos `NaN` o `Infinity` siguen hasta el total y pueden dañar cualquier cálculo que dependa de él. |
| Prioridad | **Alta.** Los datos que llegan desde un formulario o una API suelen venir como texto, así que este escenario es frecuente. |
| Causa probable | La función no comprueba el tipo. El operador `*` de JavaScript convierte los operandos de forma implícita: `"100"` pasa a ser 100, `null` pasa a ser 0 y `undefined` pasa a ser `NaN`. Es el mismo tipo de problema que encontré en la Unidad 1 con `==` (H-07). |
| Evidencia | `evidencias/pruebas-iniciales.txt` ("Received function did not throw") y `evidencias/resultados-reales-iniciales.txt` |
| Estado | Corregido y verificado (ver "Seguimiento de las correcciones"). |

| Caso | Datos | Resultado real | Problema |
|---|---|---|---|
| CP-14 | ("100", 2, 10) | `180` | El texto se convierte solo en número y el resultado parece válido. |
| CP-15 | (100, null, 10) | `0` | `null` se toma como 0 y la compra se da por gratuita. |
| CP-16 | (100, 2, undefined) | `NaN` | El argumento omitido produce `NaN`. |
| CP-17 | (NaN, 2, 10) | `NaN` | `NaN` llega hasta el total. |
| CP-18 | (100, Infinity, 10) | `NaN` | Se calcula `Infinity - Infinity`. |
| CP-19 | (100, 2, -Infinity) | `Infinity` | El total es infinito. |

## DEF-04: el 100 % de descuento no siempre produce 0

Este defecto no salió de la ejecución inicial. Lo encontré después de corregir DEF-03, mientras exploraba las técnicas de redondeo para DEF-01 (ver "Exploración del redondeo" más abajo). Para confirmarlo agregué el caso CP-20 a la matriz y a la suite y lo ejecuté sobre el código del commit `9a57648`, sin tocar `src/compras.js`.

| Campo | Detalle |
|---|---|
| Requisito | RF-03: "100 % produce 0". |
| Casos | CP-20 |
| Versión | `src/compras.js` del commit `9a57648`. El defecto ya existía en el código inicial (`373d625`): ahí `calcularTotal(0.07, 3, 100)` devuelve el mismo valor. |
| Pasos | Llamar a `calcularTotal(0.07, 3, 100)`. |
| Resultado esperado | `0` |
| Resultado real | `-2.7755575615628914e-17` |
| Severidad | **Media.** El valor es casi cero, pero no es cero. Lo comprobé en Node.js: `total === 0` da `false`, `total < 0` da `true`, `total.toFixed(2)` da `"-0.00"` y, formateado como moneda con `Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' })`, se muestra **"$-0,00"**. Cualquier lógica del tipo "si el total es 0, no se cobra" falla, y el cliente vería un total negativo. |
| Prioridad | **Media.** Solo afecta a las compras con 100 % de descuento, que son poco frecuentes, pero el requisito lo menciona de forma explícita. |
| Causa probable | La fórmula `subtotal - subtotal * descuento / 100` hace dos operaciones con redondeo binario. Con descuento 100, `subtotal * 100 / 100` no siempre vuelve a dar exactamente `subtotal` (0,07 × 3 = 0,21000000000000002), y la resta deja un residuo. Revisé subtotales de 0,01 a 99 999,99 con cantidades 1, 3 y 7, y el residuo aparece en 2 899 312 de 29 999 997 combinaciones. |
| Por qué CP-06 no lo detectó | 19,99 × 3 da un subtotal que se representa de forma exacta en binario. El caso de prueba pasaba, pero el requisito no se cumplía para otros datos. |
| Evidencia | `evidencias/pruebas-caso-CP-20.txt` (Expected 0 / Received -2.7755575615628914e-17) y `npm run reproducir` |
| Estado | Abierto |

**Por qué es un defecto aparte de DEF-01.** Las dos causas tienen que ver con el punto flotante, pero redondear no lo resuelve. Lo comprobé: al aplicar a ese residuo el redondeo elegido para DEF-01, el resultado es `-0`, que sigue mostrándose como "$-0,00" y que `toBe(0)` (igualdad `Object.is`) distingue de `0`. Por eso necesita su propia corrección.

## Exploración del redondeo (antes de corregir DEF-01)

RF-03 no dice cómo redondear (A-03). Antes de elegir una técnica quise saber cuál da resultados correctos y cuál no. Para eso escribí `scripts/explorar-redondeo.js` (salida en `evidencias/exploracion-redondeo.txt`), que compara cuatro técnicas usando como esperado el redondeo al centavo más cercano, con los empates (,xx5) hacia arriba:

| Técnica | Valores puntuales correctos | Fallos en el barrido de 10 000 000 empates (0,005 a 99 999,995) | Ejemplo de fallo |
|---|---|---|---|
| A: `Math.round(x * 100) / 100` | 7 de 10 | 587 204 | 1,005 da 1 |
| B: `Math.round((x + Number.EPSILON) * 100) / 100` | 8 de 10 | 587 189 | 2,135 da 2,13 |
| C: `Number(x.toFixed(2))` | 6 de 10 | 4 800 000 | 2,675 da 2,67 |
| D: `Math.round(Number((x * 100).toPrecision(15))) / 100` | 10 de 10 | 0 | - |

Conclusiones:

- Las cuatro técnicas resuelven CP-07 y CP-08. **Si me hubiera quedado solo con los casos de la matriz, cualquiera parecería correcta.**
- La técnica A, la más común, falla en el 5,9 % de los empates, porque números como 1,005 se guardan en binario como 1,00499999…
- La técnica B, que se recomienda mucho, solo corrige los importes menores que 2. `Number.EPSILON` es un margen relativo a 1, y en importes mayores se pierde.
- La técnica D primero limpia el error de representación, quedándose con 15 cifras significativas, y después redondea. No falló en ningún empate del barrido. **Es la que voy a usar.**

Limitación: `toPrecision(15)` deja de ser fiable con importes de más de 15 cifras significativas en centavos (alrededor de 10¹³ USD). Es un valor muy lejano a cualquier compra real, pero lo anoto como riesgo residual.

## Plan de corrección

Corrijo los defectos de a uno, cada uno en su propio commit. Después de cada corrección vuelvo a ejecutar toda la suite, para confirmar que los casos del defecto ahora pasan (confirmación) y que los que ya pasaban siguen pasando (regresión). No modifico ni los requisitos ni las pruebas para que el código pase.

El orden lo decido por severidad: **DEF-02 → DEF-03 → DEF-01**. DEF-04 se agregó después y se corrige al final, porque la corrección de DEF-01 cambia el valor que devuelve CP-20 (de un residuo a `-0`) y conviene ver ese efecto antes de corregirlo.

Antes de corregir dejo anotado qué espero que ocurra en la primera corrección. Si solo agrego la validación de rango, sin la de tipo, algunos casos de DEF-03 deberían seguir fallando, pero por otra razón:

- CP-15: `null <= 0` es `true` en JavaScript, así que lanzaría `RangeError` en lugar de `TypeError`.
- CP-19: `-Infinity < 0` es `true`, así que también lanzaría `RangeError`.

Si eso ocurre, confirma la decisión A-04 del plan: la validación de tipo tiene que hacerse antes que la de rango.

## Seguimiento de las correcciones

### Corrección 1: DEF-02

**Cambio en `src/compras.js`.** Antes del cálculo agregué tres validaciones que lanzan `RangeError`:

- `precio < 0`
- `cantidad <= 0`
- `descuento < 0 || descuento > 100`

Las comparaciones respetan los límites de RF-04 tal como están escritos: el precio 0, la cantidad 1 y los descuentos 0 y 100 siguen siendo válidos. No toqué el cálculo ni las pruebas.

**Resultado de la regresión completa:** pasan 11 y fallan 8 (antes pasaban 6 y fallaban 13). Evidencias: `evidencias/pruebas-correccion-DEF-02.txt` y `npm run reproducir`.

| Tipo de verificación | Casos | Resultado |
|---|---|---|
| Confirmación de DEF-02 | CP-09 a CP-13 | Los 5 pasan: lanzan `RangeError` con un mensaje que indica cuál dato está fuera de rango. |
| Regresión | CP-01 a CP-06 | Los 6 siguen pasando. Los límites válidos (CP-03 con precio 0, CP-04 con cantidad 1, CP-05 con descuento 0 y CP-06 con descuento 100) no se rompieron. |
| Defectos todavía abiertos | CP-07, CP-08 (DEF-01) y CP-14 a CP-19 (DEF-03) | Siguen fallando, como era de esperar. |

**Se cumplió la predicción.** CP-15 y CP-19 cambiaron de comportamiento. Antes devolvían un número; ahora lanzan `RangeError`. Jest lo muestra así: "Expected constructor: TypeError / Received constructor: RangeError". Esto confirma que, con solo la validación de rango, `null` se trata como 0 y `-Infinity` como un número negativo. CP-14 (`"100"`), CP-16 (`undefined`), CP-17 (`NaN`) y CP-18 (`Infinity`) siguen devolviendo un valor, porque las comparaciones con esos datos dan `false` y ninguna validación se activa. La conclusión es que validar el rango no reemplaza a validar el tipo, y que el tipo hay que comprobarlo primero (A-04).

### Corrección 2: DEF-03

**Cambio en `src/compras.js`.** Agregué la función auxiliar `validarNumero(valor, nombre)`, que lanza `TypeError` cuando `Number.isFinite(valor)` es `false`. Se llama para los tres parámetros **antes** de las validaciones de rango.

Elegí `Number.isFinite` en lugar de la función global `isFinite` por una razón concreta. `isFinite("100")` convierte el texto y devuelve `true`, así que volvería a dejar pasar el caso CP-14. `Number.isFinite` no convierte nada: devuelve `false` para cualquier valor que no sea de tipo `number` y también para `NaN`, `Infinity` y `-Infinity`. Así, con una sola comprobación se cubren las dos partes de RF-05 (no numérico y no finito).

**Resultado de la regresión completa:** pasan 17 y fallan 2. Evidencias: `evidencias/pruebas-correccion-DEF-03.txt` y `npm run reproducir`.

| Tipo de verificación | Casos | Resultado |
|---|---|---|
| Confirmación de DEF-03 | CP-14 a CP-19 | Los 6 pasan. Lanzan `TypeError` con un mensaje que indica qué parámetro es inválido. |
| Precedencia del tipo sobre el rango (A-04) | CP-15, CP-19 | Ahora lanzan `TypeError`. En la corrección 1 lanzaban `RangeError`. |
| Regresión | CP-01 a CP-13 | Siguen pasando, incluidas las 5 confirmaciones de DEF-02. |
| Defecto todavía abierto | CP-07, CP-08 (DEF-01) | Siguen fallando, como era de esperar. |
