# Plan de Validación — AlphaGraph

**Tipo de documento:** Plan metodológico de validación (nivel tesis).
**Propósito:** Establecer cómo se valida, de forma objetiva y replicable, que AlphaGraph
(a) reduce ≥ 25 % el tiempo de diagramación respecto al proceso manual, (b) fortalece la
seguridad y confidencialidad de la información arquitectónica en organizaciones, y
(c) mejora la calidad visual del trazado (reducción de cruces y métricas afines).

> **Nota de integridad.** Este plan separa explícitamente dos clases de evidencia:
> 1. **Evidencia objetiva del software** (ya verificable): suites de pruebas, matriz de
>    control de acceso, métricas de trazado calculadas por la herramienta. Se cita su
>    procedencia exacta en el repositorio.
> 2. **Evidencia de campo** (a ejecutar): medición de tiempos y usabilidad con usuarios
>    finales de Lima Metropolitana. El plan define el instrumento y el procedimiento; los
>    valores se registran al ejecutar el estudio. **No se reportan resultados de campo
>    simulados.**

---

## 1. Hipótesis y operacionalización de variables

| # | Hipótesis específica | Variable dependiente | Indicador | Fórmula / criterio | Meta | Instrumento | Evidencia |
|---|----------------------|----------------------|-----------|--------------------|------|-------------|-----------|
| HE1 | El uso de AlphaGraph reduce el tiempo de diagramación frente al método manual. | Tiempo de diagramación | % de reducción del tiempo | `R = (T_manual − T_app) / T_manual × 100` | `R ≥ 25 %` con significancia estadística | Ficha de toma de tiempos + prueba pareada (INSTRUMENTOS §1) | Campo |
| HE2 | AlphaGraph fortalece la seguridad y la confidencialidad de la información arquitectónica. | Nivel de seguridad/confidencialidad | Cobertura de controles verificados | `C = controles aprobados / controles definidos × 100` | `C = 100 %` de controles críticos | Checklist de seguridad/confidencialidad mapeado a ISO/IEC 25010 e ISO/IEC 27001 A.5–A.9 (INSTRUMENTOS §4) | Objetiva (suite de pruebas + matriz RBAC) |
| HE3 | AlphaGraph mejora la calidad visual del trazado generado. | Calidad visual del trazado | Reducción de cruces; densidad; conexiones rectas; niveles; valoración experta | `ΔCruces% = (cruces_AS-IS − cruces_TO-BE)/cruces_AS-IS × 100`; rúbrica 1–5 | `ΔCruces% > 0` en grafos con cruces; rúbrica ≥ 4/5 | Métricas de la herramienta + rúbrica de jueces (INSTRUMENTOS §3) | Objetiva (motor de métricas) + experta |

**Variable independiente (común):** uso de la herramienta AlphaGraph (vs. proceso manual / ausencia de la herramienta).

---

## 2. Marco de calidad de referencia (ISO/IEC 25010:2023)

Se adopta el modelo de calidad de producto **ISO/IEC 25010:2023** (versión vigente; 9
características, "Interaction capability", Safety, y "Resistance" en Seguridad — ver
`../OE3-evidencias/iso-25010-2023.md`) y la medición **ISO/IEC 25023**. Cada
hipótesis se ancla a una característica del modelo, lo que da rigor y trazabilidad a la
defensa:

| Característica ISO/IEC 25010 | Subcaracterística | Hipótesis | Cómo se evidencia en AlphaGraph |
|---|---|---|---|
| Eficiencia de desempeño | Comportamiento temporal | HE1 | Tiempo de tarea (campo) + tiempo de cómputo del layout (métrica `durationMs`) |
| Seguridad | Confidencialidad, Integridad, Responsabilidad (*accountability*), Autenticidad | HE2 | Aislamiento multi-organización, RBAC + permisos por recurso, auditoría inviolable, JWT/bcrypt |
| Usabilidad | Aprendizabilidad, Operabilidad, Satisfacción | Acta de usabilidad | SUS (System Usability Scale) + tasa de éxito de tareas |
| Adecuación funcional | Completitud, Corrección | Acta funcional | 355 pruebas backend + 440 pruebas frontend + E2E |
| Idoneidad / calidad de la salida | (extensión: calidad estética del trazado) | HE3 | Métricas de cruces/densidad + estética de grafos (Purchase) |

Marcos complementarios citados: **ISO/IEC 27001 Anexo A** (controles de seguridad de la
información, para HE2), **SUS** (Brooke, 1996; Sauro & Lewis, 2016) para usabilidad, y los
**criterios estéticos de dibujo de grafos** (Purchase, 1997; 2002) y el **algoritmo en capas
de Sugiyama** (Sugiyama, Tagawa & Toda, 1981) para HE3.

---

## 3. HE1 — Reducción ≥ 25 % del tiempo de diagramación (diseño experimental)

### 3.1 Tipo de estudio
Cuasi-experimento **intra-sujeto (medidas repetidas) con contrabalanceo**: cada participante
realiza tareas equivalentes en **dos condiciones** — (A) manual y (B) AlphaGraph — en orden
contrabalanceado (mitad A→B, mitad B→A) para neutralizar el efecto de aprendizaje y fatiga.
El diseño intra-sujeto maximiza la potencia estadística con muestras pequeñas, habitual en
estudios de usabilidad e ingeniería de software empírica.

> *Alternativa aceptable:* diseño entre-grupos (grupo control manual vs. grupo experimental
> AlphaGraph) si no es viable que el mismo participante haga ambas condiciones. Requiere mayor n.

### 3.2 Población y muestra
- **Población:** profesionales que elaboran diagramas de arquitectura en empresas de
  tecnología y de auditoría de **Lima Metropolitana** (arquitectos de software, líderes
  técnicos, auditores de TI).
- **Muestreo:** no probabilístico por conveniencia/propósito (justificado por accesibilidad y
  perfil especializado), declarado como limitación.
- **Tamaño de muestra:** mínimo **n = 12** participantes para el contraste pareado
  (recomendado n = 15–20). Justificación: con un tamaño de efecto grande esperado
  (d ≥ 0.8, plausible dado el objetivo de 25 %), α = 0.05 y potencia 0.80, una prueba pareada
  requiere ≈ 12–15 sujetos. *(Refinar con análisis de potencia, p. ej. G*Power, una vez fijada
  la desviación estándar del piloto.)*
- **Criterios de inclusión:** experiencia ≥ 6 meses elaborando diagramas; consentimiento
  informado. **Exclusión:** familiaridad previa con AlphaGraph (sesga el aprendizaje).

### 3.3 Materiales y control
- **Tareas:** un conjunto **fijo** de 2–3 casos de diagrama de arquitectura representativos
  (p. ej. “plataforma de pagos”, “portal de clientes con SSO”), con enunciado idéntico, número
  de nodos/relaciones equivalente entre las versiones usadas en A y B (formas paralelas) para
  que las condiciones sean comparables.
- **Condición A (manual):** herramienta de uso habitual del participante (Draw.io, Visio,
  Lucidchart o papel), declarada y registrada.
- **Condición B (AlphaGraph):** misma tarea con catálogo de elementos, conexiones y **layout
  automático** de la herramienta.
- **Ambiente:** mismo equipo/entorno, sin interrupciones, capacitación previa breve y
  equivalente para B (5–10 min) para no penalizar la curva inicial.

### 3.4 Medición
- **Variable de respuesta:** *tiempo en tarea* (segundos), desde “inicio” hasta diagrama
  completo y correcto (criterio de finalización definido y verificado por el observador).
- **Instrumento:** Ficha de toma de tiempos (INSTRUMENTOS §1) + cronómetro/registro;
  AlphaGraph además aporta `durationMs` del cómputo de layout como dato auxiliar.
- **Variables secundarias:** nº de correcciones, errores, y percepción de esfuerzo.

### 3.5 Análisis estadístico y regla de decisión
1. Calcular, por participante, `R_i = (T_manual_i − T_app_i)/T_manual_i × 100`.
2. **Normalidad** de las diferencias: Shapiro–Wilk.
   - Si normal → **t de Student pareada** sobre los tiempos (o sobre `R`).
   - Si no normal → **Wilcoxon de los rangos con signo**.
3. Reportar: media (o mediana) de `R`, **intervalo de confianza al 95 %**, valor *p* y tamaño
   del efecto (d de Cohen / r).
4. **Criterio de aceptación de HE1 (preregistrado):** se da por validada si
   - la reducción media `R̄ ≥ 25 %`, **y**
   - el contraste es significativo (`p < 0.05`), **y** preferentemente
   - el **límite inferior del IC 95 %** de `R` no cae por debajo de un umbral mínimo aceptable.
   Reportar también el % de participantes con `R_i ≥ 25 %`.

### 3.6 Amenazas a la validez y mitigación
- **Aprendizaje/orden:** contrabalanceo (§3.1). **Selección:** criterios + muestreo declarado.
- **Instrumentación:** mismo observador y cronómetro, criterio de finalización objetivo.
- **Validez externa:** muestra de Lima Metropolitana en dos sectores (tecnología y auditoría);
  declarar generalización limitada al perfil. **Constructo:** la tarea representa diagramación
  real (validada por el asesor).

---

## 4. HE2 — Seguridad y confidencialidad de la información arquitectónica

La seguridad es **evidencia objetiva**: no depende de percepción, sino de controles
verificables por pruebas automatizadas y por inspección. Se evalúa con un **checklist de
controles** (INSTRUMENTOS §4) mapeado a ISO/IEC 25010 (Seguridad) e ISO/IEC 27001 Anexo A.

**Controles implementados y su evidencia en el repositorio (verificada):**

| Control | Propiedad | Evidencia (prueba/artefacto) |
|---|---|---|
| Aislamiento multi-organización (un usuario nunca ve recursos de otra organización) | Confidencialidad | `MultiTenancyIsolationIntegrationTest`, `MultiTenancyCrossAccessIntegrationTest` |
| Concurrencia segura entre organizaciones (sin fugas ni 500 en condiciones de carrera) | Confidencialidad/Integridad | `MultiTenancyConcurrencyIntegrationTest` |
| RBAC por rol (ADMIN/ARCHITECT/AUDITOR) + permisos por recurso (VIEW/EDIT/AUDIT, grupos, categorías) | Confidencialidad | `GovernancePermissionIntegrationTest`, `ResourceGrantIntegrationTest` + matriz RBAC en vivo (§7) |
| Segregación del auditor (área `/api/auditor/**`, solo lectura de lo asignado) | Confidencialidad | `AuditorIntegrationTest` |
| Auditoría inviolable y saneada (registro *append-only*; sin IP, metadatos crudos ni id de organización) | Responsabilidad/Confidencialidad | `AuditEventIntegrationTest` + restricción de BD (trigger anti update/delete) |
| Autenticación JWT + expiración absoluta + secreto fuerte | Autenticidad | `AuthIntegrationTest`, `AbsoluteExpiryIntegrationTest`, `JwtSecretValidationTest`, `JwtServiceTest` |
| Credenciales con `bcrypt`, unicidad de correo, recuperación de contraseña con token efímero | Integridad | `IdentitySecurityIntegrationTest`, `EmailUniquenessIntegrationTest`, `PasswordResetIntegrationTest` |
| Endurecimiento (límite de tasa, bloqueo por intentos, deshabilitar organización) | Disponibilidad/Confidencialidad | `HardeningIntegrationTest`, `SecuritySettingsIntegrationTest` |
| Esquema de datos gobernado por migraciones (Flyway), Hibernate sin DDL automático | Integridad | `db/migration/V1..V22`, `ddl-auto: none` |
| Ciclo de vida gobernado (DRAFT→IN_REVIEW→PUBLISHED) con revisor asignado; publicación restringida | Confidencialidad/Responsabilidad | `DiagramGovernanceIntegrationTest`, `GovernanceAdminIntegrationTest` |

**Procedimiento de validación HE2:**
1. Ejecutar la suite con base de datos (`DB_IT=true ./mvnw test`) y adjuntar el resumen
   (355/355) como evidencia reproducible.
2. Ejecutar la **matriz RBAC en vivo** (§7) y registrar el resultado por rol.
3. Completar el **checklist** marcando cada control como *Conforme / No conforme* con su prueba.
4. **Criterio de aceptación:** 100 % de los controles **críticos** (aislamiento, RBAC,
   auditoría, autenticación, confidencialidad del trazado) en estado *Conforme*.

> **Confidencialidad de la información arquitectónica** = combinación de: aislamiento por
> organización + permisos efectivos (rol ∩ concesión de recurso) + auditoría saneada +
> exportaciones auditadas. Estos cuatro controles constituyen el núcleo del *informe de
> confidencialidad* (ver `INFORME_CALIDAD_VISUAL_Y_CONFIDENCIALIDAD.md`).

---

## 5. HE3 — Calidad visual del trazado generado

Combina **medición objetiva** (la herramienta calcula métricas reales por ejecución de layout)
con **valoración experta** (rúbrica), siguiendo la literatura de estética de grafos.

### 5.1 Métricas objetivas (motor de la herramienta)
La herramienta calcula y exporta, por cada ejecución de layout, la comparación **AS-IS vs
TO-BE**:
- **Cruces de aristas** (objetivo principal; el algoritmo en capas de Sugiyama los minimiza).
- **Densidad visual**, **conexiones rectas**, **niveles** y **tiempo de cómputo** (`durationMs`).

Evidencia de corrección del cálculo (pruebas): `LayoutCrossingCounterTest`,
`LayoutGeometryMetricsTest`, `LayoutMetricsChangeTest`, `LayoutExecutionMetricsIntegrationTest`,
y reporte exportable `LayoutMetricsReportPdfTest`. La app entrega además un **PDF de métricas**
por ejecución, que sirve como anexo de evidencia.

**Indicador principal:** `ΔCruces% = (cruces_AS-IS − cruces_TO-BE) / cruces_AS-IS × 100` para
grafos que presentan cruces (cuando `cruces_AS-IS = 0` no aplica y se documenta como tal).

### 5.2 Valoración experta (rúbrica)
Panel de **3 jueces** expertos evalúa el trazado con la rúbrica (INSTRUMENTOS §3) sobre los
criterios estéticos de Purchase: minimización de cruces, longitud/uniformidad de aristas, uso
del espacio, alineación/simetría y legibilidad de etiquetas (escala 1–5). Se reporta el
promedio y la **concordancia inter-jueces** (p. ej. *W* de Kendall o ICC).

### 5.3 Procedimiento y criterio de aceptación
1. Sobre un conjunto de N diagramas de prueba, registrar métricas AS-IS/TO-BE (tabla de
   evidencia en el informe).
2. Los jueces puntúan los trazados TO-BE con la rúbrica.
3. **Aceptación:** `ΔCruces% > 0` en todos los grafos con cruces (no empeora ninguno) y
   promedio de rúbrica ≥ 4/5 con concordancia aceptable.

---

## 6. Cronograma (≤ 13 semanas) y validación del asesor

| Semana | Hito | Entregable |
|---|---|---|
| 1–2 | Aprobación del plan de validación y de los instrumentos por el asesor | Este documento + instrumentos firmados |
| 3 | Estudio **piloto** (2–3 usuarios) para calibrar tareas, tiempos y SUS | Acta de piloto + ajuste de instrumentos |
| 4–8 | Trabajo de campo: medición de tiempos (HE1) y usabilidad (SUS) con usuarios de empresas de tecnología y auditoría de Lima Metropolitana | Fichas de tiempos + cuestionarios SUS completos |
| 7–9 | Evidencia objetiva: ejecución de la suite (HE2) + métricas de trazado y panel de jueces (HE3) | Resumen de pruebas + reportes de métricas + rúbricas |
| 10–11 | Análisis estadístico (HE1) y consolidación (HE2/HE3) | Resultados con IC, *p*, tamaño de efecto |
| 11–12 | Redacción del **Informe de calidad visual y confidencialidad** y del **Acta de certificación** | Ambos documentos completos |
| 13 | **Validación final del asesor** y firma de conformidad | Conformidad del asesor |

---

## 7. Matriz RBAC en vivo (procedimiento reproducible de HE2)

Con el backend en ejecución, autenticando como cada rol, se verifica (resultado esperado):

| Acción | architect | admin | auditor |
|---|---|---|---|
| `GET /api/diagrams/reviewers` | 200 | 200 | **403** |
| `GET /api/diagrams/audit-events` | 200 | 200 | **403** |
| Transición de ciclo de vida (lifecycle) | ✔ propio | ✔ | **403** |
| Publicar sin ser el revisor asignado | **403** | 200 | **403** |
| Eliminar diagrama publicado | **403** | 200 | **403** |
| Acceso a recurso de **otra** organización | **404** | **404** | **404** |

Este resultado, junto con las suites de §4, constituye la evidencia de control de acceso.

---

## 8. Ética y confidencialidad del estudio
- **Consentimiento informado** por escrito de cada participante (propósito, voluntariedad,
  anonimato, uso de datos solo con fines académicos).
- **Anonimización**: los participantes se identifican con código (P01…Pn); no se publican datos
  personales ni información arquitectónica real de las empresas.
- Los diagramas de prueba son **casos ficticios** equivalentes, para no exponer información
  confidencial real de las organizaciones.

## 9. Entregables y trazabilidad
1. `PLAN_DE_VALIDACION.md` (este documento).
2. `INSTRUMENTOS.md` — fichas y cuestionarios.
3. `ACTA_CERTIFICACION_PRUEBAS.md` — plantilla del acta funcional + usabilidad.
4. `INFORME_CALIDAD_VISUAL_Y_CONFIDENCIALIDAD.md` — plantilla del informe (con evidencia
   objetiva pre-cargada).
5. `BENCHMARK_COMPARATIVO.md` — marco del benchmark contra plataformas; y
   `benchmark/INFORME_BENCHMARK.md` — **informe consolidado con datos reales** (proceso +
   cruces/solapamientos/tiempo/escalabilidad de 7 motores sobre 100 grafos + KLM ≥25 % +
   confidencialidad 8/8). Arnés reproducible en `apps/web/scripts/bench/` y
   `apps/web/scripts/crossing-benchmark.mjs`.
6. `README.md` — índice de todo el paquete de validación.

## Referencias (formatear según norma de la universidad, p. ej. APA 7)
- ISO/IEC 25010:2023. *Systems and software engineering — SQuaRE — Product quality model.* (versión vigente)
- ISO/IEC 25023:2016. *Measurement of system and software product quality.*
- ISO/IEC 27001:2022. *Information security management systems — Requirements* (Anexo A).
- OWASP API Security Top 10 (2023); OWASP ASVS 5.0. *Application Security Verification Standard.*
- Di Battista, Eades, Tamassia & Tollis (1997). *An experimental comparison of four graph drawing algorithms.* (Rome/North corpora)
- ISO/IEC 27001. *Information security management systems — Requirements* (Anexo A).
- Brooke, J. (1996). *SUS: A “quick and dirty” usability scale.* En *Usability Evaluation in Industry.*
- Sauro, J., & Lewis, J. R. (2016). *Quantifying the User Experience* (2.ª ed.).
- Purchase, H. C. (1997, 2002). *Metrics for graph drawing aesthetics.*
- Sugiyama, K., Tagawa, S., & Toda, M. (1981). *Methods for visual understanding of hierarchical system structures.* IEEE TSMC.
