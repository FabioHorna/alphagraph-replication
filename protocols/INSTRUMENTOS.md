# Instrumentos de validación — AlphaGraph

Instrumentos de recolección y análisis para el Plan de Validación. Cada participante se
identifica con un **código anónimo** (P01, P02, …). Imprimir/duplicar por participante.

---

## §1. Ficha de toma de tiempos (HE1 — reducción ≥ 25 %)

**Diseño:** intra-sujeto contrabalanceado (la mitad inicia en Manual, la mitad en AlphaGraph).
**Criterio de finalización:** el diagrama reproduce el enunciado (nodos, tipos y relaciones
requeridos) y el observador lo da por **correcto**. El cronómetro se detiene en ese instante.

### Ficha por participante

| Campo | Valor |
|---|---|
| Código de participante | P__ |
| Sector | ☐ Tecnología ☐ Auditoría |
| Cargo / experiencia (años) | |
| Herramienta manual usada | ☐ Draw.io ☐ Visio ☐ Lucidchart ☐ Papel ☐ Otra: ___ |
| Orden de condiciones | ☐ Manual → AlphaGraph ☐ AlphaGraph → Manual |
| Caso/tarea aplicada | ___ (mismo nº de nodos/relaciones en ambas formas) |
| **T_manual** (s) | |
| **T_app** (s) | |
| Nº correcciones (manual / app) | ___ / ___ |
| Observaciones | |

`R = (T_manual − T_app) / T_manual × 100 = _____ %`

### Tabla maestra (consolidado para el análisis)

| Pi | Sector | Orden | T_manual (s) | T_app (s) | R (%) | R ≥ 25 % |
|----|--------|-------|--------------|-----------|-------|----------|
| P01 | | | | | | ☐ |
| P02 | | | | | | ☐ |
| … | | | | | | |
| **Resumen** | | | media= | media= | **media=** | **n(≥25%)=** |

### Análisis (a completar)
- Normalidad de las diferencias (Shapiro–Wilk): W = ___, p = ___.
- Prueba aplicada: ☐ t pareada ☐ Wilcoxon. Estadístico = ___, **p = ___**.
- Reducción media `R̄` = ___ %, **IC 95 % = [___ , ___]**, tamaño de efecto (d/r) = ___.
- **Decisión HE1:** ☐ Validada (R̄ ≥ 25 % y p < 0.05) ☐ No validada. Comentario: ___.

---

## §2. Cuestionario SUS — Escala de Usabilidad del Sistema (usabilidad)

Tras usar AlphaGraph, marcar de 1 (*Totalmente en desacuerdo*) a 5 (*Totalmente de acuerdo*).

| # | Ítem | 1 | 2 | 3 | 4 | 5 |
|---|------|---|---|---|---|---|
| 1 | Creo que me gustaría usar AlphaGraph con frecuencia. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 2 | Encuentro AlphaGraph innecesariamente complejo. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 3 | Creo que AlphaGraph es fácil de usar. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 4 | Creo que necesitaría apoyo técnico para poder usar AlphaGraph. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 5 | Las funciones de AlphaGraph están bien integradas. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 6 | Creo que AlphaGraph es demasiado inconsistente. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 7 | Imagino que la mayoría aprendería a usar AlphaGraph muy rápido. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 8 | Encuentro AlphaGraph muy incómodo de usar. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 9 | Me sentí muy seguro/a usando AlphaGraph. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 10 | Necesité aprender muchas cosas antes de poder usar AlphaGraph. | ☐ | ☐ | ☐ | ☐ | ☐ |

**Cálculo del puntaje SUS (0–100):**
- Ítems impares (1,3,5,7,9): `puntaje = respuesta − 1`.
- Ítems pares (2,4,6,8,10): `puntaje = 5 − respuesta`.
- `SUS = (Σ de los 10 puntajes) × 2.5`.

**Interpretación (Sauro & Lewis):** SUS ≈ 68 = promedio de la industria; ≥ 80.3 ≈ excelente
(grado A); < 51 = pobre. **Meta del estudio:** SUS promedio **≥ 68** (aceptable), aspiracional ≥ 80.

| Pi | SUS | Tasa de éxito de tareas (%) | Nº errores |
|----|-----|------------------------------|-----------|
| P01 | | | |
| … | | | |
| **Promedio** | | | |

**Métricas de usabilidad complementarias (por tarea):** tasa de éxito (tareas completadas /
intentadas), nº de errores, y tiempo (reutiliza §1). Reportar promedio y desviación.

---

## §3. Rúbrica de calidad visual del trazado (HE3)

Tres jueces expertos puntúan cada trazado **TO-BE** (1 = muy deficiente, 5 = excelente).

| Criterio (estética de grafos) | Descriptor de nivel 5 | J1 | J2 | J3 |
|---|---|---|---|---|
| Minimización de cruces de aristas | Sin cruces evitables; lectura clara de relaciones | | | |
| Longitud y uniformidad de aristas | Aristas cortas y consistentes; sin recorridos confusos | | | |
| Uso del espacio / distribución | Distribución equilibrada; sin solapamientos ni vacíos | | | |
| Alineación y simetría (jerarquía por niveles) | Niveles alineados; jerarquía evidente | | | |
| Legibilidad de nodos y etiquetas | Texto e iconografía legibles; tipos distinguibles | | | |
| **Promedio por juez** | | | | |

- **Promedio global de la rúbrica:** ___ / 5  (meta ≥ 4).
- **Concordancia inter-jueces:** *W* de Kendall / ICC = ___ (reportar).

### Tabla de métricas objetivas (exportadas por la herramienta)
Por cada diagrama, registrar la comparación AS-IS vs TO-BE (del reporte PDF de métricas):

| Diagrama | Cruces AS-IS | Cruces TO-BE | **ΔCruces %** | Densidad AS-IS→TO-BE | Conexiones rectas AS-IS→TO-BE | Niveles TO-BE | Tiempo (ms) |
|---|---|---|---|---|---|---|---|
| D1 | | | | | | | |
| D2 | | | | | | | |
| … | | | | | | | |

> `ΔCruces % = (AS-IS − TO-BE)/AS-IS × 100`. Si AS-IS = 0, anotar “N/A (sin cruces previos)”.

---

## §4. Checklist de seguridad y confidencialidad (HE2)

Marcar **Conforme/No conforme** con su evidencia. *Crítico* = obligatorio para aprobar HE2.

| # | Control | Crítico | Conforme | Evidencia |
|---|---|---|---|---|
| S1 | Aislamiento entre organizaciones (sin acceso cruzado) | ✔ | ☐ | `MultiTenancyIsolationIntegrationTest`, `MultiTenancyCrossAccessIntegrationTest` |
| S2 | Concurrencia entre organizaciones sin fugas ni error 500 | ✔ | ☐ | `MultiTenancyConcurrencyIntegrationTest` |
| S3 | RBAC por rol + permisos por recurso (VIEW/EDIT/AUDIT) | ✔ | ☐ | `GovernancePermissionIntegrationTest`, `ResourceGrantIntegrationTest`, matriz RBAC |
| S4 | Segregación del auditor (solo lectura de lo asignado) | ✔ | ☐ | `AuditorIntegrationTest` |
| S5 | Auditoría *append-only* y saneada (sin IP/metadatos/org) | ✔ | ☐ | `AuditEventIntegrationTest` + trigger de BD |
| S6 | Autenticación JWT + expiración + secreto fuerte | ✔ | ☐ | `AuthIntegrationTest`, `AbsoluteExpiryIntegrationTest`, `JwtSecretValidationTest` |
| S7 | Contraseñas con bcrypt; unicidad de correo | ✔ | ☐ | `IdentitySecurityIntegrationTest`, `EmailUniquenessIntegrationTest` |
| S8 | Recuperación de contraseña con token efímero | | ☐ | `PasswordResetIntegrationTest` |
| S9 | Límite de tasa / bloqueo por intentos / deshabilitar organización | | ☐ | `HardeningIntegrationTest`, `SecuritySettingsIntegrationTest` |
| S10 | Esquema gobernado por migraciones; Hibernate sin DDL | | ☐ | `db/migration`, `ddl-auto: none` |
| S11 | Exportaciones auditadas (PNG/PDF/JSON) | | ☐ | `ExportIntegrationTest` |
| S12 | Ciclo de vida y publicación gobernados (revisor asignado) | ✔ | ☐ | `DiagramGovernanceIntegrationTest` |

**Resultado:** controles críticos conformes = ___/8. **Decisión HE2:** ☐ Validada (8/8) ☐ No.
**Reproducibilidad:** adjuntar la salida de `DB_IT=true ./mvnw test` (resumen *Tests run: N,
Failures: 0*) y de `npm run test` (frontend) como anexos.
