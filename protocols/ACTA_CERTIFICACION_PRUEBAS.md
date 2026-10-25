# Acta de Certificación de Pruebas Funcionales y de Usabilidad

**Sistema:** AlphaGraph — Plataforma de diagramación y gobernanza de arquitectura.
**Proyecto de tesis:** _______________________________________________
**Tesista:** _____________________  **Asesor:** _____________________
**Lugar y fecha:** Lima Metropolitana, ____ / ____ / ______
**Versión evaluada / commit:** _____________________

> Plantilla. Los campos entre líneas se completan al ejecutar las pruebas. Las pruebas
> funcionales se sustentan en evidencia automatizada reproducible; las de usabilidad, en
> sesiones con usuarios finales de empresas de tecnología y auditoría de Lima Metropolitana.

---

## 1. Objeto del acta
Certificar la ejecución y los resultados de las **pruebas funcionales** y de **usabilidad** de
AlphaGraph, incluyendo la evidencia de **reducción mínima del 25 %** del tiempo de
diagramación respecto al proceso manual, conforme al Plan de Validación.

## 2. Pruebas funcionales (adecuación funcional — ISO/IEC 25010)

Suite automatizada reproducible. Comando y resultado registrados como evidencia:

| Capa | Comando | Resultado (Tests run / Failures) | Estado |
|---|---|---|---|
| Backend (con BD) | `DB_IT=true ./mvnw test` | _____ / _____ | ☐ Conforme |
| Backend empaquetado | `./mvnw package` | BUILD _______ | ☐ Conforme |
| Frontend (unitario/componente) | `npm run test` | _____ / _____ | ☐ Conforme |
| Frontend (lint + tipos + build) | `npm run lint && npm run build` | _______ | ☐ Conforme |
| Frontend E2E | `npm run test:e2e` | _____ / _____ | ☐ Conforme |

> Referencia de ejecución previa del autor (a re-verificar y fechar por el asesor):
> backend 355/355 sin fallos y *package* exitoso; frontend 440/440 en pruebas unitarias,
> *lint*/tipos/*build* en verde. **La suite E2E debe re-ejecutarse y consignarse aquí.**

**Cobertura funcional verificada** (resumen): autenticación y sesión; gestión de usuarios y
roles; aislamiento por organización; permisos por recurso y grupos/categorías; CRUD y
guardado con bloqueo optimista de diagramas; ciclo de vida (borrador → revisión → publicado)
con asignación de revisor; versionado y restauración; exportación PNG/PDF/JSON auditada;
auditoría; recuperación de contraseña; configuración de seguridad.

## 3. Pruebas de usabilidad con usuarios finales

- **Población:** profesionales de empresas de **tecnología** y **auditoría** de Lima
  Metropolitana. **n = ____** participantes (códigos P01…P__).
- **Instrumentos:** cuestionario **SUS** + métricas de tareas (éxito, errores) — INSTRUMENTOS §2.
- **Fechas de sesiones:** ____________________  **Modalidad:** ☐ Presencial ☐ Remota.

| Indicador | Resultado | Meta | Estado |
|---|---|---|---|
| Puntaje **SUS** promedio | _____ /100 | ≥ 68 | ☐ |
| Tasa de éxito de tareas | _____ % | ≥ 90 % | ☐ |
| N.º promedio de errores por tarea | _____ | — | ☐ |

## 4. Evidencia de reducción del tiempo de diagramación (≥ 25 %)

Estudio intra-sujeto contrabalanceado (manual vs. AlphaGraph) — INSTRUMENTOS §1.

| Indicador | Resultado |
|---|---|
| n participantes | _____ |
| Tiempo medio **manual** (s) | _____ |
| Tiempo medio **AlphaGraph** (s) | _____ |
| **Reducción media `R̄`** | _____ % |
| IC 95 % de `R` | [ _____ , _____ ] |
| Prueba (t pareada / Wilcoxon) y *p* | __________ , p = _____ |
| Tamaño del efecto (d / r) | _____ |
| Participantes con `R_i ≥ 25 %` | _____ / _____ |

**Veredicto del indicador (≥ 25 %):** ☐ **CUMPLE** (R̄ ≥ 25 % y p < 0.05) ☐ NO CUMPLE.

## 5. Conclusión de la certificación
Con base en la evidencia funcional automatizada, las sesiones de usabilidad con usuarios
finales y el estudio comparativo de tiempos, se **CERTIFICA** que AlphaGraph:

1. Cumple las pruebas funcionales sin fallos. ☐
2. Alcanza un nivel de usabilidad aceptable (SUS ≥ 68). ☐
3. Evidencia una reducción del tiempo de diagramación **≥ 25 %** respecto al proceso manual. ☐

Observaciones: ______________________________________________________________________

## 6. Firmas

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| Tesista | | | |
| Asesor (validación) | | | |
| Representante usuario(s) final(es) — Tecnología | | | |
| Representante usuario(s) final(es) — Auditoría | | | |

> **Validación del asesor:** dentro de un máximo de **13 semanas** desde el inicio del proyecto
> (ver cronograma en `PLAN_DE_VALIDACION.md` §6).
