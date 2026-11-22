# Reporte de pruebas del módulo de compras

## 1. Identificación

| Campo | Valor |
|---|---|
| Objeto de prueba | `calcularTotal(precio, cantidad, descuento)` en `src/compras.js` |
| Versión inicial | Commit `373d625` (código del enunciado) |
| Versión final | Commit `4d871d2` (corrección de DEF-04) |
| Base de prueba | RF-01 a RF-05 y RNF-01 del enunciado |
| Documentos relacionados | [Plan de pruebas](plan-pruebas.md), [matriz de casos](matriz-casos.md), [registro de defectos](defectos.md) |
| Responsable | Jorge Rivera |
| Fecha de cierre | 22/11/2026 |

## 2. Resumen

Diseñé 20 casos funcionales (CP-01 a CP-20) y 1 caso de rendimiento (PR-01), y automaticé los 20 funcionales con Jest. En la ejecución inicial pasaron 6 de 19 casos. Registré cuatro defectos: tres salieron de la ejecución inicial y uno de la prueba exploratoria del redondeo. Los corregí de a uno, volviendo a ejecutar toda la suite después de cada corrección. En la regresión final pasaron **20 de 20** casos.

La medición exploratoria de rendimiento dio entre 286 y 306 ns por llamada en la versión corregida (mediana de tres corridas). Eso está muy lejos de la referencia de 1 ms que propuse en la Unidad 1.

**Recomendación:** el módulo cumple RF-01 a RF-05 con los datos probados y no tiene defectos abiertos. Se puede liberar, **siempre que** el negocio acepte los riesgos residuales de la sección 9. Los más importantes son el modo de redondeo de los empates y el tratamiento de las cantidades decimales, que la especificación no define.

## 3. Alcance y ambiente

Se probó lo que indica el plan: la función como unidad aislada, con pruebas funcionales de caja negra (particiones, valores límite, datos inválidos), confirmación, regresión y una exploración de rendimiento. Los niveles de integración, sistema y aceptación quedaron fuera porque el enunciado entrega un único módulo.

**Ambiente:**

- Ubuntu 24.04.4 LTS (Linux 6.14), AMD Ryzen 5 4600H con 12 hilos y 30 GiB de RAM.
- Node.js 18.19.1 (V8 10.2), npm 9.2.0, Jest 30.5.2.
- Visual Studio Code 1.106.2.

**Desviaciones respecto del plan:**

| Desviación | Motivo |
|---|---|
| Se agregó CP-20 después de la ejecución inicial. | La exploración del redondeo mostró que el 100 % de descuento no siempre producía 0. El caso hace la suite más estricta, y en ningún momento se cambió el resultado esperado de otro caso. |
| Se agregaron cuatro scripts de apoyo en `scripts/` que no estaban previstos. | `reproducir-casos.js` muestra el resultado real cuando Jest solo dice "did not throw". `explorar-redondeo.js` y `comparar-formulas.js` respaldan dos decisiones técnicas con datos. `rendimiento.js` implementa PR-01. |
| Se registraron 4 defectos en lugar de los 3 previstos. | DEF-04 apareció durante la corrección de DEF-01. |

## 4. Resultados de la ejecución

| Ejecución | Código | Pasan | Fallan | Evidencia |
|---|---|---|---|---|
| Inicial | Enunciado | 6 de 19 | 13 | `evidencias/pruebas-iniciales.txt` |
| Corrección 1 | + validación de rango (DEF-02) | 11 de 19 | 8 | `evidencias/pruebas-correccion-DEF-02.txt` |
| Corrección 2 | + validación de tipo (DEF-03) | 17 de 19 | 2 | `evidencias/pruebas-correccion-DEF-03.txt` |
| Nuevo caso | Sin cambios en el código, se agrega CP-20 | 17 de 20 | 3 | `evidencias/pruebas-caso-CP-20.txt` |
| Corrección 3 | + redondeo (DEF-01) | 19 de 20 | 1 | `evidencias/pruebas-correccion-DEF-01.txt` |
| **Final** | + fórmula sin resta (DEF-04) | **20 de 20** | **0** | `evidencias/pruebas-finales.txt` |

En cada corrección los casos que ya pasaban siguieron pasando, así que ninguna corrección introdujo una regresión. En dos momentos anoté una predicción antes de ejecutar, y las dos se cumplieron:

1. Con solo la validación de rango, CP-15 (`null`) y CP-19 (`-Infinity`) lanzaron `RangeError` en lugar de `TypeError`. Esto confirmó que el tipo debe validarse antes que el rango.
2. Con solo el redondeo, CP-20 pasó de devolver un residuo a devolver `-0`. Esto confirmó que DEF-04 necesitaba su propia corrección.

Además de la suite hice dos verificaciones exhaustivas fuera de Jest:

- Comparé técnicas de redondeo sobre 10 000 000 de empates (`evidencias/exploracion-redondeo.txt`).
- Comparé la fórmula anterior y la nueva contra una referencia exacta en 4 000 000 de combinaciones. La fórmula final tuvo 0 diferencias (`evidencias/comparacion-formulas.txt`).

## 5. Defectos

| ID | Defecto | Requisito | Detectado en | Severidad | Prioridad | Estado |
|---|---|---|---|---|---|---|
| DEF-01 | El total no se redondea a dos decimales | RF-03 | Ejecución inicial (CP-07, CP-08) | Media | Alta | Corregido y verificado |
| DEF-02 | No se rechazan valores fuera de rango (totales negativos) | RF-04 | Ejecución inicial (CP-09 a CP-13) | Alta | Alta | Corregido y verificado |
| DEF-03 | No se rechazan entradas no numéricas ni no finitas | RF-05 | Ejecución inicial (CP-14 a CP-19) | Alta | Alta | Corregido y verificado |
| DEF-04 | El 100 % de descuento no siempre produce 0 | RF-03 | Exploración del redondeo (CP-20) | Media | Media | Corregido y verificado |

**Defectos abiertos: 0.** El detalle de cada uno (pasos, esperado, real, causa y evidencia) está en [defectos.md](defectos.md).

Observación: los dos defectos de severidad alta tenían la misma causa de fondo, que la función confiaba en sus datos sin validarlos. El caso más peligroso era `("100", 2, 10)`, que devolvía `180`: un resultado que parece correcto y oculta que el dato venía mal.

## 6. Cobertura

### Cobertura por requisito

| Requisito | Casos | Resultado final | Defectos encontrados | Estado |
|---|---|---|---|---|
| RF-01 | CP-01, CP-02, CP-03, CP-04 | 4 de 4 pasan | - | Cumple |
| RF-02 | CP-01, CP-02, CP-05, CP-06 | 4 de 4 pasan | - | Cumple |
| RF-03 | CP-06, CP-07, CP-08, CP-20 | 4 de 4 pasan | DEF-01, DEF-04 | Cumple con los datos probados (ver RR-01) |
| RF-04 | CP-09 a CP-13 | 5 de 5 pasan | DEF-02 | Cumple |
| RF-05 | CP-14 a CP-19 | 6 de 6 pasan | DEF-03 | Cumple para las entradas (ver RR-04) |
| RNF-01 | PR-01 | Medido | - | Explorado. No hay umbral aprobado. |

Todos los requisitos tienen casos ejecutados y en la ejecución final todos sus casos pasan. Las 12 clases de equivalencia de entrada y los 8 valores límite de la matriz tienen al menos un caso.

### Cobertura de código

`npm run test:coverage` da 100 % de sentencias, ramas, funciones y líneas (`evidencias/cobertura.txt`). No uso esta cifra como criterio de calidad. El código del enunciado no tenía ramas, así que CP-01 por sí solo lo habría cubierto al 100 %, y aun así tenía cuatro defectos. DEF-04 estaba en una línea que se ejecutaba en todas las pruebas. La cobertura de código dice qué se ejecutó, no si el resultado era correcto.

## 7. Rendimiento (PR-01, RNF-01)

**Objetivo.** Hacer una exploración limitada, como pide RNF-01, sin umbral aprobado. Como referencia uso el supuesto S-01 de la Unidad 1: 1 ms o menos en el 95 % de 10 000 llamadas.

**Método** (`scripts/rendimiento.js`, que se ejecuta con `npm run rendimiento`):

- 200 000 llamadas de calentamiento, para que V8 compile y optimice la función.
- Después, 30 tandas de 10 000 llamadas con datos válidos variados y deterministas.
- Cada tanda se mide de dos formas:
  - **(a) llamada por llamada**, con `process.hrtime.bigint()`, para obtener percentiles por llamada como pide S-01;
  - **(b) en bloque**, para estimar el costo real sin el costo de leer el reloj, que fue de 70 a 80 ns.
- Se miden tres versiones: la del enunciado, la corregida y una variante sin redondeo que sirve solo para separar costos.
- Hice tres corridas completas (`evidencias/rendimiento.txt`).

**Resultados** (rango de las tres corridas):

| Versión | (a) p50 por llamada | (a) p95 por llamada | (a) p99 por llamada | (b) promedio en bloque (mediana) | Llamadas de más de 1 ms |
|---|---|---|---|---|---|
| Enunciado | 81 a 90 ns | 121 a 141 ns | 151 a 171 ns | 20 a 25 ns | 1 de 900 000 |
| Corregida sin redondeo (análisis) | 121 a 140 ns | 170 a 190 ns | 210 a 261 ns | 56 a 61 ns | 1 de 900 000 |
| **Corregida** | **421 a 451 ns** | **541 a 611 ns** | **721 a 832 ns** | **286 a 306 ns** | **0 de 900 000** |

**Análisis:**

- **Con la referencia S-01:** el p95 de la versión corregida (como máximo 611 ns) está unas 1600 veces por debajo de 1 ms. Para que llegue a ese umbral tendría que ser tres órdenes de magnitud más lenta.
- **Costo de las correcciones:** la versión corregida es entre 12 y 15 veces más lenta que la del enunciado, unos 270 ns más por llamada. De esa diferencia, entre 35 y 41 ns corresponden a las validaciones y entre 230 y 245 ns al redondeo con `toPrecision`, que convierte el número a texto y luego otra vez a número. Es decir, entre el 85 % y el 87 % del costo adicional viene de la decisión de redondeo.
- **Decisión:** mantengo la técnica D. Las técnicas más rápidas (A y B) fallan en cerca de 587 000 de cada 10 000 000 empates. En un módulo de cobro prefiero un total correcto a ahorrar 230 ns. Aun así, la versión corregida procesa unos 3,3 millones de cálculos por segundo.
- **Valores extremos:** en las tres corridas hubo 2 llamadas de más de 1 ms entre 2 700 000 medidas, con un máximo de 3,0 ms. Ninguna fue de la versión corregida. Aparecen de forma aislada y en distintas versiones, lo que apunta a interrupciones del sistema operativo o al recolector de basura y no a la función.

**Limitaciones de la medición:**

1. Es un microbenchmark de una función síncrona. No incluye la red, la base de datos ni la interfaz, que en un sistema real dominarían el tiempo de respuesta.
2. El procesador estaba en modo `powersave`, con frecuencia variable, y había otros procesos activos (carga media de 0,89 a 1,00 al iniciar cada corrida). Los valores absolutos cambian de una corrida a otra; por eso informo rangos.
3. En la medición (a), entre 70 y 80 ns de cada valor son el costo del reloj. En la versión del enunciado eso es la mayor parte del tiempo medido, así que sus percentiles por llamada sobrestiman el costo real.
4. La variante "sin redondeo" es una copia simplificada que existe solo para separar costos. No es el código que se entrega.
5. Hay una sola máquina, una sola versión de Node.js y ninguna prueba de concurrencia ni de carga sostenida.
6. No hay un umbral aprobado. El resultado informa, pero no aprueba RNF-01.

## 8. Evaluación de los criterios de salida

| Criterio del plan | Resultado | ¿Cumple? |
|---|---|---|
| 1. 100 % de los casos ejecutados | 20 de 20 funcionales y PR-01 ejecutados | Sí |
| 2. Ningún defecto de severidad alta abierto | DEF-02 y DEF-03 corregidos y verificados | Sí |
| 3. Cada RF con al menos un caso que pasa en la ejecución final | RF-01 a RF-05: todos sus casos pasan | Sí |
| 4. Regresión completa sin fallos después de la última corrección | 20 de 20 en `pruebas-finales.txt` | Sí |
| 5. Evidencias inicial y final guardadas | `pruebas-iniciales.txt` y `pruebas-finales.txt` | Sí |
| 6. Rendimiento documentado con su ambiente y sus limitaciones | Sección 7 y `rendimiento.txt` | Sí |
| 7. Riesgos residuales documentados | Sección 9 | Sí |

## 9. Riesgos residuales

| ID | Riesgo | Origen | Nivel | Qué recomiendo |
|---|---|---|---|---|
| RR-01 | RF-03 no define cómo redondear los empates (,xx5). Elegí redondear hacia arriba. Si el negocio o la normativa tributaria exigen otro modo, como el redondeo bancario, algunos totales cambiarían en un centavo. | A-03 | Medio | Confirmar el modo de redondeo con el negocio y agregar casos de empate a la suite. |
| RR-02 | La función acepta cantidades decimales: `(2.5, 2.5, 0)` devuelve `6.25`. No sé si eso es válido, porque la especificación no lo dice y no lo probé. | A-02 | Medio | Definir si la cantidad debe ser entera. Si debe serlo, agregar `Number.isInteger` y un caso. |
| RR-03 | El precio 0 se acepta y da un total 0. Me quedé con la lectura literal de RF-04, que solo rechaza los precios negativos. | A-01 | Bajo | Confirmar que los productos gratuitos son válidos. |
| RR-04 | Con entradas finitas pero enormes, el subtotal desborda: `(1e308, 10, 0)` devuelve `Infinity` y `(1e308, 10, 100)` devuelve `NaN`. Además, `toPrecision(15)` pierde precisión por encima de unos 10¹³. | No hay límite superior en la especificación | Bajo | Definir un importe máximo y validarlo, o validar que el resultado sea finito. |
| RR-05 | Las validaciones nuevas cambian el contrato de la función. Si quien la llama (un formulario o una API) envía `"100"` como texto, antes obtenía un total y ahora recibe `TypeError`. | Corrección de DEF-03 | Medio | Probar la integración: quien llama debe convertir y validar los datos antes, y capturar los errores. |
| RR-06 | El rendimiento solo se midió en un microbenchmark local, sin un umbral aprobado. | RNF-01, A-06 | Bajo | Aprobar un umbral y medir dentro del sistema real. |
| RR-07 | `npm audit` reporta advertencias moderadas en `glob`, una dependencia interna de Jest. La solución automática baja Jest a la versión 29, que no es compatible. | Dependencias de desarrollo | Bajo | Afecta solo al ambiente de desarrollo, no al módulo. Actualizar cuando Jest publique una versión corregida. |
| RR-08 | La misma persona escribió el plan, diseñó los casos, ejecutó las pruebas y corrigió el código. Como en la inspección de la Unidad 1, falta independencia. | Organización | Medio | Pedir que otra persona revise la matriz y las correcciones. |

## 10. Lecciones aprendidas

1. **Una prueba que pasa no demuestra que no haya defectos.** CP-06 pasó en todas las ejecuciones y, aun así, RF-03 no se cumplía para otros datos. Su dato, 19,99 × 3, era exacto por casualidad. Encontré DEF-04 explorando, no siguiendo la matriz.
2. **Los datos de la matriz no alcanzan para elegir una solución.** Las cuatro técnicas de redondeo pasaban CP-07 y CP-08. Solo el barrido de 10 millones de empates mostró que tres de ellas fallaban.
3. **El orden de las validaciones también se prueba.** La corrección 1 mostró en la práctica, no solo en teoría, que `null <= 0` es `true` en JavaScript. Sin el caso CP-15 no lo habría visto.
4. **Corregir un defecto puede tener costos que hay que medir.** El redondeo correcto multiplicó por 15 el tiempo de la función. Es aceptable, pero es una decisión que tiene que quedar documentada.
5. **Continuidad con la Unidad 1.** El riesgo de conversión de tipos que encontré en la inspección estática (H-07, con `==`) apareció aquí ejecutando el código (DEF-03, con `*`). La revisión estática lo anticipó y la prueba dinámica lo confirmó y midió su efecto.

## 11. Conclusión

El módulo pasó de cumplir 6 de 19 casos a cumplir 20 de 20, y quedaron corregidos los cuatro defectos encontrados. Cada corrección tiene su commit, su evidencia y su regresión. El riesgo económico principal (totales negativos o calculados sobre datos inválidos) está controlado. Lo que queda depende sobre todo de decisiones de negocio que la especificación no tomó: el redondeo de los empates, la cantidad decimal y el importe máximo. Recomiendo liberar el módulo después de confirmar RR-01 y RR-02 y de probar la integración con quien lo llama (RR-05).
