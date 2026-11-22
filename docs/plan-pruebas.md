# Plan de pruebas del módulo de compras

## 1. Objetivo

El objetivo de este plan es comprobar, ejecutando el código, si la función `calcularTotal(precio, cantidad, descuento)` de `src/compras.js` cumple los requisitos RF-01 a RF-05 y explorar su rendimiento (RNF-01). Las pruebas tienen que dejar evidencia suficiente para decidir si el módulo se puede liberar o no.

En la Unidad 1 trabajé solo con técnicas estáticas y dejé como mejora pendiente "pasar a las pruebas dinámicas". Este plan es ese siguiente paso: ahora el módulo se ejecuta y se compara lo que devuelve con un resultado esperado.

## 2. Requisitos que se prueban

| ID | Requisito | Cómo lo interpreto para probarlo |
|---|---|---|
| RF-01 | Subtotal = precio × cantidad para números positivos. | Con datos válidos, el total parte de `precio × cantidad`. |
| RF-02 | Descuento de 0 a 100 %. | El descuento se aplica como porcentaje del subtotal. 0 y 100 son valores válidos. |
| RF-03 | Total con dos decimales (100 % produce 0). | El valor devuelto tiene como máximo dos decimales. Con descuento 100 el total es exactamente 0. |
| RF-04 | `RangeError` para precio negativo, cantidad ≤ 0 o descuento fuera de rango. | La función lanza `RangeError` y no devuelve un total. |
| RF-05 | `TypeError` para entradas no numéricas o no finitas. | Cualquier valor que no sea de tipo `number`, y también `NaN`, `Infinity` y `-Infinity`, produce `TypeError`. |
| RNF-01 | Exploración limitada de rendimiento. | Medición exploratoria del tiempo por llamada, sin un umbral aprobado. |

### Ambigüedades y supuestos

Al convertir los requisitos en casos encontré huecos en la especificación. No cambié los requisitos. Lo que hice fue anotar cómo los interpreto y dejar esa interpretación a la vista para que se pueda revisar.

| ID | Ambigüedad | Interpretación que uso | Efecto en las pruebas |
|---|---|---|---|
| A-01 | RF-01 habla de "números positivos", pero RF-04 solo rechaza el precio **negativo**. No queda claro qué pasa con un precio 0. | El precio 0 es válido (por ejemplo, un producto gratis) y el total es 0. Me quedo con la lectura literal de RF-04. | CP-03 prueba el límite precio = 0. |
| A-02 | No se dice si la cantidad tiene que ser entera. | Queda fuera del alcance: no pruebo cantidades decimales. | Queda como riesgo residual. |
| A-03 | RF-03 pide dos decimales, pero no dice cómo redondear (al más cercano, hacia abajo, empates). | Redondeo al centavo más cercano. Elijo datos que no caen en un empate exacto (,xx5), para que el resultado esperado no dependa de esa decisión. | CP-07 y CP-08. El modo de redondeo de los empates queda como riesgo residual. |
| A-04 | `-Infinity` está fuera de rango (RF-04) y además no es finito (RF-05). | Prevalece RF-05: primero se valida el tipo y después el rango. | CP-19 comprueba esa precedencia. |
| A-05 | No se dice con cuántos decimales puede venir el descuento. | El descuento puede tener decimales. Para los valores límite uso un paso de 0,01. | CP-12 y CP-13 usan -0,01 y 100,01. |
| A-06 | RNF-01 no define ningún umbral. | Como referencia no aprobada uso el supuesto S-01 de la Unidad 1: 1 ms o menos en el 95 % de 10 000 llamadas. | PR-01 informa los resultados, pero no aprueba ni rechaza el requisito. |

## 3. Alcance

**Incluido:**

- La función `calcularTotal` de `src/compras.js`, probada como unidad aislada.
- Las reglas de cálculo (RF-01 a RF-03), la validación de rangos (RF-04) y la validación de tipos (RF-05).
- Una medición exploratoria del tiempo de ejecución (RNF-01).

**Excluido, y por qué:**

- Pruebas de integración, sistema y aceptación. El enunciado entrega un único módulo, sin interfaz de usuario ni otros componentes con los que integrarse.
- Moneda, impuestos y formato de presentación (por ejemplo, "USD 50,97"). Ningún requisito los menciona.
- Cantidades decimales (A-02).
- Pruebas de carga o concurrencia. La función es síncrona y no usa recursos compartidos, y RNF-01 pide una exploración limitada.

## 4. Riesgos

Para priorizar usé el mismo criterio de severidad que en la Unidad 1: lo más grave es todo lo que pueda terminar en un cobro equivocado.

| ID | Riesgo | Probabilidad | Impacto | Nivel | Qué hago para reducirlo |
|---|---|---|---|---|---|
| RG-01 | Un descuento fuera de 0–100 deja un total negativo o mayor al subtotal. | Alta: el código no valida nada. | Alto: cobro equivocado. | Alto | Valores límite del descuento (CP-12, CP-13). |
| RG-02 | Un precio negativo o una cantidad ≤ 0 producen un total sin sentido en lugar de un error. | Alta | Alto | Alto | Valores límite y particiones inválidas (CP-09 a CP-11). |
| RG-03 | Un dato que llega como texto (por ejemplo, desde un formulario) se convierte solo con el operador `*` y se calcula como si fuera un número. Esto ya lo vi en la Unidad 1, en H-07. | Alta | Alto: el error pasa desapercibido. | Alto | Datos no numéricos (CP-14 a CP-16). |
| RG-04 | `NaN` o `Infinity` se propagan hasta el total. | Media | Alto | Alto | Datos no finitos (CP-17 a CP-19). |
| RG-05 | La aritmética de punto flotante deja totales con más de dos decimales (por ejemplo, 0.30000000000000004). | Alta | Medio: diferencias de centavos y totales que no cuadran. | Medio | Casos de redondeo (CP-07, CP-08). |
| RG-06 | Que el resultado esperado esté mal porque la especificación es ambigua. | Media | Medio | Medio | Supuestos A-01 a A-06 explícitos. |
| RG-07 | Tiempo de respuesta inaceptable. | Baja: es una operación aritmética simple. | Bajo | Bajo | Medición exploratoria PR-01. |

## 5. Niveles y tipos de prueba

**Nivel:** unidad o componente. Es una regla de cálculo crítica, y según la teoría de la unidad este tipo de regla debe recibir pruebas unitarias exhaustivas y casos de borde antes de integrarse con otros módulos. Los demás niveles quedan fuera por lo explicado en el alcance.

**Tipos de prueba:**

| Tipo | Para qué lo uso | Casos |
|---|---|---|
| Funcional de caja negra, casos positivos | Comprobar que con datos válidos el total es correcto. | CP-01, CP-02, CP-04, CP-05 |
| Funcional de caja negra, casos de borde | Revisar los extremos permitidos y los primeros valores no permitidos. | CP-03, CP-04, CP-05, CP-06, CP-09, CP-10, CP-12, CP-13 |
| Funcional, casos negativos | Confirmar que los datos inválidos se rechazan con el error correcto. | CP-09 a CP-19 |
| Confirmación (re-test) | Volver a ejecutar los casos que fallaron, después de cada corrección. | Los asociados a cada defecto |
| Regresión | Volver a ejecutar la suite completa después de cada cambio, para comprobar que lo que ya pasaba sigue pasando. | Todos |
| No funcional: rendimiento (eficiencia de desempeño, ISO/IEC 25010) | Exploración del tiempo por llamada. | PR-01 |
| Complementaria de caja blanca | Medir con `jest --coverage` qué líneas y ramas del código ejecutan las pruebas. Solo como indicador: la cobertura de código no reemplaza la cobertura por requisito. | Toda la suite |

**Técnicas de diseño** (ISO/IEC/IEEE 29119-4):

- **Particiones de equivalencia.** Para cada parámetro separo una clase válida, una inválida por rango y una inválida por tipo. Con un representante de cada clase cubro el comportamiento sin probar todos los valores posibles.
- **Análisis de valores límite.** Pruebo cada frontera con dos valores, el último que se permite y el primero que no: precio -0,01 / 0, cantidad 0 / 1, descuento -0,01 / 0 y 100 / 100,01.
- **Datos inválidos.** Valores de tipo incorrecto (`"100"`, `null`, `undefined`) y valores no finitos (`NaN`, `Infinity`, `-Infinity`).

## 6. Ambiente

| Elemento | Valor |
|---|---|
| Sistema operativo | Ubuntu 24.04.4 LTS (Linux 6.14) |
| Procesador y memoria | AMD Ryzen 5 4600H (12 hilos), 30 GiB de RAM |
| Entorno de ejecución | Node.js 18.19.1, npm 9.2.0 |
| Framework de pruebas | Jest (versión exacta registrada en `package-lock.json` y en el reporte) |
| Editor | Visual Studio Code 1.106.2 |
| Control de versiones | Git y GitHub |
| Datos de prueba | Valores sintéticos definidos en la matriz. No se usan datos reales de clientes. |

Las pruebas se ejecutan con `jest --runInBand`, es decir, en un solo proceso y en orden. Así la ejecución es reproducible y la medición de rendimiento no compite con otros procesos de Jest.

## 7. Criterios de entrada

Empiezo a ejecutar solo si se cumple todo esto:

1. Los requisitos RF-01 a RF-05 y RNF-01 están disponibles y las ambigüedades están anotadas (A-01 a A-06).
2. El código inicial está versionado en el primer commit, para poder volver a él y comparar.
3. La matriz de casos está escrita y cada caso tiene requisito, datos y un resultado esperado que se puede observar.
4. Node.js y Jest están instalados y `npm test` se ejecuta, aunque las pruebas fallen.

## 8. Criterios de salida

Doy por terminadas las pruebas cuando:

1. Se ejecutaron el 100 % de los casos de la matriz.
2. No queda ningún defecto de severidad alta abierto.
3. Cada requisito funcional tiene al menos un caso positivo o negativo que pasa en la ejecución final.
4. La regresión completa, ejecutada después de la última corrección, pasa sin fallos.
5. Están guardadas las evidencias inicial (`evidencias/pruebas-iniciales.txt`) y final (`evidencias/pruebas-finales.txt`).
6. La medición de rendimiento está documentada con su ambiente y sus limitaciones.
7. Los riesgos residuales están anotados en `docs/reporte-pruebas.md`.

**Suspensión:** detengo la ejecución si el ambiente no se puede instalar o si un resultado esperado resulta estar mal. En ese caso corrijo primero la matriz, nunca el requisito.

## 9. Gestión de defectos

Cada falla se confirma antes de registrarla: hay que descartar un error en los datos, en la prueba o en el ambiente. Los defectos se anotan en `docs/defectos.md` con identificador, versión, pasos, datos, resultado esperado, resultado real, severidad, prioridad y evidencia.

Las correcciones se hacen de a una, cada una en su propio commit. Después de cada corrección vuelvo a ejecutar toda la suite. La regla es **corregir el código para que cumpla el requisito, no ajustar la prueba ni el requisito para que el código pase**.

## 10. Entregables

| Entregable | Archivo |
|---|---|
| Plan de pruebas | `docs/plan-pruebas.md` |
| Matriz de casos y trazabilidad | `docs/matriz-casos.md` |
| Pruebas automatizadas | `tests/compras.test.js` |
| Evidencia de la ejecución inicial | `evidencias/pruebas-iniciales.txt` |
| Registro de defectos | `docs/defectos.md` |
| Evidencia de la ejecución final y la regresión | `evidencias/pruebas-finales.txt` |
| Medición de rendimiento | `evidencias/rendimiento.txt` |
| Reporte de pruebas | `docs/reporte-pruebas.md` |

**Responsable:** Jorge Rivera, que asume la planificación, el diseño, la ejecución y el reporte.
