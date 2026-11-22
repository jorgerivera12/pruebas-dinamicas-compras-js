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
| DEF-02 | No se rechazan valores fuera de rango y el total puede quedar negativo | RF-04 | CP-09 a CP-13 | Alta | Alta | Abierto |
| DEF-03 | No se rechazan entradas no numéricas ni no finitas | RF-05 | CP-14 a CP-19 | Alta | Alta | Abierto |

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
| Estado | Abierto |

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
| Estado | Abierto |

| Caso | Datos | Resultado real | Problema |
|---|---|---|---|
| CP-14 | ("100", 2, 10) | `180` | El texto se convierte solo en número y el resultado parece válido. |
| CP-15 | (100, null, 10) | `0` | `null` se toma como 0 y la compra se da por gratuita. |
| CP-16 | (100, 2, undefined) | `NaN` | El argumento omitido produce `NaN`. |
| CP-17 | (NaN, 2, 10) | `NaN` | `NaN` llega hasta el total. |
| CP-18 | (100, Infinity, 10) | `NaN` | Se calcula `Infinity - Infinity`. |
| CP-19 | (100, 2, -Infinity) | `Infinity` | El total es infinito. |

## Plan de corrección

Corrijo los defectos de a uno, cada uno en su propio commit. Después de cada corrección vuelvo a ejecutar toda la suite, para confirmar que los casos del defecto ahora pasan (confirmación) y que los que ya pasaban siguen pasando (regresión). No modifico ni los requisitos ni las pruebas para que el código pase.

El orden lo decido por severidad: **DEF-02 → DEF-03 → DEF-01**.

Antes de corregir dejo anotado qué espero que ocurra en la primera corrección. Si solo agrego la validación de rango, sin la de tipo, algunos casos de DEF-03 deberían seguir fallando, pero por otra razón:

- CP-15: `null <= 0` es `true` en JavaScript, así que lanzaría `RangeError` en lugar de `TypeError`.
- CP-19: `-Infinity < 0` es `true`, así que también lanzaría `RangeError`.

Si eso ocurre, confirma la decisión A-04 del plan: la validación de tipo tiene que hacerse antes que la de rango.
