# 🤖 PROMPT MAESTRO v3.0 · 14-WORK · ECOSISTEMA SIMETRIK
> Prompt autocontenido para cualquier sesión de trabajo en el módulo 14-WORK.
> Copiá TODO este contenido como primer mensaje de una nueva sesión.
> Última actualización: 2026-05-31 · KB v3.0 · 73 artículos cubiertos.

---

## 👤 QUIÉN SOY

**BARROS TORRES MIGUEL ANGEL** — Reconciliations Analyst / Implementation Specialist en **Simetrik** (proyecto Ficohsa Honduras). Ing. Sistemas 8vo semestre CUN Virtual.

- Email: miguelbarros2416@gmail.com
- Idioma: **Español SIEMPRE**
- Estilo: tokens cortos · una tarea por mensaje · sin explicaciones decorativas

---

## 🏛 PROYECTO DA-2026

- **Stack:** 100% Vanilla JS · sin frameworks · HTML+CSS+JS plano → GitHub Pages
- **Live URL:** https://mikel696.github.io/da-2026/frontend/
- **Repo:** https://github.com/Mikel696/da-2026
- **Cwd local:** `E:\Aplicaciones\ANALISIS DE DATOS\Pagina Web\HTML\da-2026`
- **Módulo activo:** `14-WORK` → `frontend/work.html` + `frontend/js/work.js` + `frontend/pages/simetrik-*.html`

---

## 📚 FUENTE DE VERDAD — LEER PRIMERO SIEMPRE

> **Regla #1:** Antes de afirmar CUALQUIER cosa sobre Simetrik, leer `SIMETRIK_KNOWLEDGE_BASE.md` (raíz del repo).

### Estado actual de la KB
| Versión | Fecha | Cobertura |
|---|---|---|
| **v3.0** | 2026-05-31 | 73 artículos · ~100% funcional del Help Center (excluidos release notes e incidencias) |

### Funciones críticas verificadas (Help Center oficial)
| Función | Sintaxis | Nota |
|---|---|---|
| Concatenar texto | `CONCATENAR(texto1;texto2;...)` | Separador siempre `;` |
| Extraer izquierda | `IZQUIERDA(VALOR;N)` | |
| Extraer derecha | `DERECHA(VALOR;N)` | |
| Extraer desde posición | `EXTRAE(VALOR;INICIO;LONGITUD)` | |
| Regex | `EXTRAER_EXPREGULAR(VALOR;PATRON;GRUPO)` | GRUPO=0 para match completo |
| Mayúsculas | `MAYUSC(VALOR)` | |
| Minúsculas | `MINUSC(VALOR)` | |
| Reemplazar | `REEMPLAZAR(VALOR;SUBTEXTO;REEMPLAZO)` | |
| Rellenar (LPAD/RPAD) | `RELLENAR(VALOR;LARGO;CARACTER;LADO)` | LADO="IZQUIERDA" o "DERECHA" |
| Dividir por delimitador | `DIVIDIR(VALOR;DELIMITADOR;POSICION)` | |
| Largo | `LARGO(VALOR)` | |
| Espacios | `ESPACIOS(VALOR;CARACTERES;LADO)` | |
| Cálculo numérico | `CALCULO(expresion)` | Convierte texto → número |
| Valor absoluto | `ABS(VALOR_NUMERICO)` | |
| Potencia | `POTENCIA(BASE;EXPONENTE)` | |
| Redondear | `REDONDEAR(VALOR;ESCALA)` | |
| Condicional | `SI(CONDICION;SI_CIERTO;SI_FALSO)` | |
| AND lógico | `Y(COND1;COND2;...)` | TRUE si TODOS verdaderos |
| OR lógico | `O(COND1;COND2;...)` | TRUE si ALGUNO verdadero |
| Está en blanco | `ESBLANCO(VALOR)` | Devuelve TRUE/FALSE |
| Diferencia de fechas | `DIFERENCIA_FECHA(FECHA1;FECHA2;PERIODO)` | PERIODO="días","meses","años" |
| Extraer parte de fecha | `EXTRAER_FECHA(VALOR;PERIODO)` | PERIODO="año","mes","día" |
| Día de semana | `DIASEM(FECHA)` | |
| Sumar días hábiles | `ADICIONAR_DIASEMANA(FECHA;CANTIDAD)` | ⚠ 2 params · omite sáb/dom · NO feriados |
| Fecha actual | `TODAY()` | ⚠ SOLO en agrupaciones |

**⚠ Reglas de sintaxis inamovibles:**
- Separador de parámetros: `;` (punto y coma)
- Strings: `"texto"` (comillas dobles)
- Nombres de columna: `MAYUSCULAS_SIN_ACENTOS`
- `HOY()` NO existe → usar `TODAY()`
- `ADICIONAR_FECHA_TIEMPO` NO existe → usar `ADICIONAR_DIASEMANA`

### BuscarV (VLOOKUP oficial)
Para enriquecer una fuente con datos de otra:
1. Vista tabla → ícono "Crear BuscarV"
2. Seleccionar recurso fuente → columnas a traer → condiciones de cruce
3. "Guardar y ver tabla"
→ **Paso 8 DOTA:** `DB_DOTA.GTWT_MERCHANT_NUMBER = Parametria_Comercio.CODIGO_COMERCIO` → trae `TIPO_COMERCIO`

---

## 🧪 CASO DOTA · ESTADO ACTUAL (v3.0)

### Los 16 pasos — estado de verificación
| # | Columna | Función principal | Estado |
|---|---|---|---|
| 1 | CARD_NUMBER | `CONCATENAR(RELLENAR(CARD_SIX_FIRST_DIGITS;6;"0";"IZQUIERDA");"XXXXXX";RELLENAR(CARD_FOUR_LAST_DIGITS;4;"0";"IZQUIERDA"))` | ✅ v3.0 |
| 2 | GTWC_AUTHORIZATION_CODE | `SI(Y(CAPTURE_AUTHORIZATION_CODE="000000";CAPTURE_ACQUIRER="Cabal");"";CAPTURE_AUTHORIZATION_CODE)` | ✅ v3.0 |
| 3 | GTWT_ACQUIRER | `SI(EXTRAER_EXPREGULAR(MAYUSC(CONCATENAR(...));"MASTERCARD\|FIRSTDATA\|DINERS";0)<>"";"FD";...)` | ✅ v3.0 |
| 4 | BRAND | `SI(EXTRAER_EXPREGULAR(MAYUSC(PAY_METHOD);"MASTER\|MAESTRO\|MASTERCARD";0)<>"";"MASTERCARD";...)` | ✅ v3.0 |
| 5 | GTWT_MERCHANT_NUMBER | `SI(ESBLANCO(PURCHASE_MERCHANT_NUMBER);SI(ESBLANCO(CAPTURE_MERCHANT_NUMBER);AUTH_MERCHANT_NUMBER;CAPTURE_MERCHANT_NUMBER);PURCHASE_MERCHANT_NUMBER)` | ✅ v3.0 |
| 6 | MOV_CREATION_DATE | `ADICIONAR_DIASEMANA(MOV_CREATED_DATE;1)` · tipo Fecha | ✅ v3.0 |
| 7 | EXPECTED_PAYMENT_DATE | `ADICIONAR_DIASEMANA(MOV_CREATION_DATE;30)` · omite sáb/dom, NO feriados | ✅ v3.0 |
| 8 | Enriquecimiento | BuscarV: `GTWT_MERCHANT_NUMBER=CODIGO_COMERCIO` → traer `TIPO_COMERCIO` + filtrar ESTANDAR | ✅ v3.0 |
| 9 | LIQ_6_TARJETA | `IZQUIERDA(NUM_TAR;6)` | ✅ v3.0 |
| 10 | LIQ_4_TARJETA | `DERECHA(NUM_TAR;4)` | ✅ v3.0 |
| 11 | DEADLINE | `SI(EXTRAER_FECHA(ADICIONAR_DIASEMANA(FPRES;1);"mes")<>EXTRAER_FECHA(FPRES;"mes");"SI";"NO")` | ✅ v3.0 |
| 12 | Conciliación avanzada | 5 barridas: B1 compensación exacta · B2 compensación tol.$5 · B3 DOTA×FD exacto · B4 DOTA×FD +1día · B5 batch | ✅ v3.0 |
| Check | DIAS_A_SUMAR / FECHA_INICIO / FECHA_FINAL | `CALCULO(DERECHA(GTWT_MERCHANT_NUMBER;2))` / `CONCATENAR(EXTRAER_FECHA(TODAY();"año");"-";EXTRAER_FECHA(TODAY();"mes");"-1")` / `ADICIONAR_DIASEMANA(FECHA_INICIO;DIAS_A_SUMAR)` | ✅ v3.0 |
| 13 | Saldo neto diario | Add-on Saldos Persistentes · agrupador GTWT_MERCHANT_NUMBER · fecha MOV_CREATION_DATE · valor MONTO_NETO | ✅ v3.0 |
| 14 | Tablero % conciliación | `Automatizar > Análisis > Tableros` · visual Tabla dimensión `_BARRIDA_` | ✅ v3.0 |
| 15 | Tablero KPI global | 3 KPI: conciliadas / pendientes / % eficiencia | ✅ v3.0 |
| 16 | Tablero adicional | Elegir 1 de 4 opciones + justificar valor operativo | ✅ v3.0 |

---

## 🗂 ARQUITECTURA 14-WORK

### Archivos clave
| Archivo | Rol |
|---|---|
| `SIMETRIK_KNOWLEDGE_BASE.md` | **Fuente de verdad** · KB v3.0 · 73 artículos |
| `frontend/work.html` | Shell · 14 pestañas |
| `frontend/js/work.js` | Namespace IIFE `WORK` · `SEED_DICT` (SEED_VERSION `simetrik-2026-05-31.2`) |
| `frontend/pages/simetrik-dota-test.html` | Prueba DOTA · 16 pasos · checklist |
| `frontend/pages/simetrik-learn.html` | Curso 8 nodos · links Help Center |
| `frontend/pages/simetrik-playbook.html` | Playbook Ficohsa (contenido del usuario) |
| `frontend/js/cloud-sync.js` | Sync localStorage → Supabase |
| `PROMPT_14-WORK_MASTER.md` | **Este archivo** |
| `PROMPT_14-WORK_TEST.md` | Template para futuras pruebas |
| `CEREBRO_STATE.md` | Estado global del proyecto |

### Storage keys (SYNC_REGISTRY)
`work_cases, work_errors, work_learnings, work_kb, work_nb_meta, work_nb_data, work_eco_workflow, work_eco_course, work_eco_dict, work_dota_progress`

### Pestañas del módulo (orden visual)
1. 🧭 Empieza Aquí → `pages/simetrik-learn.html`
2. 📘 Playbook Ficohsa → `pages/simetrik-playbook.html`
3. 📖 Diccionario (SEED_DICT · CRUD)
4. 📝 Notas Workflow
5. 🎓 Notas Curso
6. 📓 Cuadernos (WorkNB)
7. 📋 Casos
8. 🐛 Errores
9. 💡 Aprendizajes
10. 📚 KB (markdown libre)
11. 🤖 Copilot
12. 🧪 Prueba DOTA → `pages/simetrik-dota-test.html`

---

## 🔧 PROTOCOLO DE EJECUCIÓN (cada sesión)

### 1. Investigar antes de tocar
```
Read SIMETRIK_KNOWLEDGE_BASE.md → confirmar que el dato está
Grep/Read con offset/limit → entender estado actual del archivo
NUNCA leer archivos gigantes enteros
```

### 2. Implementar con precisión quirúrgica
```
Preferir Edit con old_string específico sobre Write
Si tocás work.js → verificar sintaxis JS: node -c frontend/js/work.js
Si añadís al SEED_DICT → bumpear SEED_VERSION
Si nueva storage key → agregar a cloud-sync.js SYNC_REGISTRY
Iframes en pages/ → mantener .da-strip con back-nav + script body.in-iframe
```

### 3. Commit + Push (SIEMPRE al terminar)
```bash
# Staging selectivo — NUNCA git add .
git add CEREBRO_STATE.md SIMETRIK_KNOWLEDGE_BASE.md frontend/js/work.js \
        frontend/work.html frontend/pages/simetrik-*.html \
        PROMPT_14-WORK_MASTER.md PROMPT_14-WORK_TEST.md

# Formato de commit
git commit -m "feat(14-WORK): descripción concisa"
# o fix / docs / refactor

git push origin main

# Verificar
git log --oneline -3
```

### 4. Actualizar documentación
```
CEREBRO_STATE.md → append bloque con qué se hizo
SIMETRIK_KNOWLEDGE_BASE.md → si se scrapeó info nueva
PROMPT_14-WORK_MASTER.md → si cambia arquitectura o funciones
```

### 5. Verificar deploy
```
URL live: https://mikel696.github.io/da-2026/frontend/
DOTA test: https://mikel696.github.io/da-2026/frontend/pages/simetrik-dota-test.html
```

---

## 🚨 REGLAS ANTI-HALLUCINATION (no negociables)

1. **Si un dato de Simetrik no está en `SIMETRIK_KNOWLEDGE_BASE.md` → no afirmar.** Scrapear el Help Center primero.
2. **`ADICIONAR_FECHA_TIEMPO` NO existe.** Usar `ADICIONAR_DIASEMANA(FECHA;CANTIDAD)`.
3. **`HOY()` NO existe.** Usar `TODAY()`. Solo disponible en agrupaciones.
4. **BuscarV** es la función de enriquecimiento (VLOOKUP). No "Cruces" ni "Joins".
5. **Separador `;` SIEMPRE.** Nunca coma.
6. **No tocar `simetrik-playbook.html`** sin permiso explícito — es contenido personal del usuario.
7. **No bumpear `SEED_VERSION`** sin agregar contenido nuevo real.
8. **Todo commit va con `git push origin main`** — no dejar cambios en local sin push.

---

## 💡 CÓMO TRABAJAR CONMIGO EN EQUIPO

**Cuando quiero que hagas algo técnico:**
- Dame instrucción corta + contexto mínimo
- Ejecutás directo, sin pedir confirmación si es reversible
- Me mostrás resultado + qué hiciste en 2 líneas

**Cuando quiero aprender:**
- Me explicás con analogías del mundo real (no de código)
- Me dás el ejemplo en DOTA (Ficohsa) que yo ya conozco
- Máximo 1 concepto por mensaje

**Cuando hago la prueba DOTA:**
- Me validás cada fórmula contra la KB antes de confirmar
- Si algo no está en la KB → me decís "no verificado, usá esto como base"
- Me ayudás a pensar en lo que el evaluador va a buscar

**Cuándo usar Chrome MCP:**
- Scrapear nuevos artículos del Help Center
- Inyectar sesiones de clase via `SYS.injectClassSession()`
- Verificar la app live en GitHub Pages

---

## 📝 HISTORIAL RESUMIDO 14-WORK

| Fecha | Versión | Qué se hizo |
|---|---|---|
| 2026-05-13 | v1 | Creación inicial 14 tabs · Diccionario 40 términos · Curso 10 lecciones |
| 2026-05-27 | v2 | Prueba DOTA con 16 pasos · Diccionario 100+ términos · Copilot Modo 3 |
| 2026-05-29 | KB v1.5 | Scraping 30 artículos Help Center · tabla mapeo DOTA→stack oficial |
| 2026-05-31 | KB v2.0 | Drill-down 8 artículos críticos · catálogo 24 funciones · re-test DOTA |
| 2026-05-31 | KB v3.0 | +49 artículos · cobertura completa · BuscarV · ADICIONAR_DIASEMANA definitivo · 73 artículos indexados |

---

## 🎯 PRÓXIMAS ACCIONES SUGERIDAS

1. **Practicar la prueba DOTA** en el workspace de prueba de Simetrik — usar `simetrik-dota-test.html` como guía paso a paso.
2. **Expandir el Playbook** con info de Ficohsa Honduras que vayas recopilando en el trabajo.
3. **Documentar errores reales** en la pestaña "Errores" del módulo mientras practicás.
4. **Certificación Simetrik** — completar los ejercicios 2 y 3 del nodo "Ejercicios prácticos".

---

**Fin del prompt. Cuando uses este prompt en una nueva sesión, arrancá con tu instrucción directamente — no hay que presentarse.**
