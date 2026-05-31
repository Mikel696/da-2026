# 🧠 SIMETRIK KNOWLEDGE BASE — Catálogo completo Help Center

> **Fuente:** https://simetriksoporte.zendesk.com/hc/es-419
> **Scraped:** 2026-05-29 vía Chrome MCP (sesión autenticada del usuario)
> **Uso:** Base de verdad para todo desarrollo en 14-WORK (Ecosistema Simetrik) — Playbook, Diccionario, Prueba DOTA, futuros casos.
> **Anti-hallucination:** Si un dato no está en este archivo o no fue confirmado por extracción del Help Center, NO se inventa. Se deja placeholder y se vuelve a scrapear.

---

## 🏛 Estructura del Help Center

Cuatro categorías top-level:

```
1. Automatizar    → Automatización de flujo de datos, conciliaciones y contabilidad
2. Gestionar      → Monitoreo y gestión operativa y contable
3. Auditar        → Revisión y trazabilidad
4. Cuenta y Herramientas → Configuración de cuenta, roles, accesos
```

---

## 📂 1. AUTOMATIZAR (section 41007920915859)

Subsecciones:

### 1.1 Soluciones (41640021923603)
Artículos (7):
- Simetrik como plantilla en tu portal
- Ingesta de datos en plantillas
- Vista de detalles en plantillas
- Configuración de plantillas
- Controles en plantillas
- Réplicas
- Catálogo de Plantillas

### 1.2 Integraciones (41640485827987)
Artículos (4):
- Parsers
- Smart Parsers
- Repositorios
- Conexiones

### 1.3 Recursos y conciliaciones (41640102792339) ⭐ CRÍTICO PARA DOTA
Artículos (24):
- Directorio de clientes
- Columnas de duplicados y unicidad
- Gestión de pendientes en plantillas
- Columnas de menú desplegable y de comentarios
- Vista de recursos
- **Columnas de transformación, vencimiento y de fecha hoy** ⭐
- Columnas del sistema
- Intercambio de recursos
- **Tipos de columnas** ⭐
- Fuentes de terceros
- Accesos por recursos
- Hoja de cálculo
- Agrupaciones
- Fuentes aperturadas
- **Configuración de cruce** ⭐
- **Conciliaciones avanzadas** ⭐
- Conciliación estándar vs. avanzada: ¿Cuál deberías usar?
- Conciliaciones estándar
- Optimización de la conciliación: columnas, programación y KPIs
- Uniones de fuentes
- **Fuentes** ⭐
- Eliminar registros
- Conciliacion Encadenada
- Desencadenante de conciliaciones

### 1.4 Contabilidad (41640123426451)
Artículos (5):
- Gestión de cuentas
- Automatizaciones contables
- Estructuras ERP personalizadas
- Configuración de cierre
- Conexiones ERP

### 1.5 Análisis (41640118843923)
Artículos (13):
- **Tableros** ⭐
- Sección de tableros
- **Estado de conciliación estándar** ⭐
- Combinaciones
- **Estado de conciliación avanzada** ⭐
- Detalle de Segmentos en KPI de Conciliaciones Avanzadas
- Monitores
- Tabla Personalizada
- KPI Individual
- Gráficos
- Estado de conciliación encadenada
- Tabla Dinámica
- Consolidaciones

### 1.6 Envío de datos (41640202894739)
Artículos (2):
- Reporte de clientes
- Exportaciones

---

## 📂 2. GESTIONAR (section 41007902679571)

Subsecciones:
- Controles Contables (41640370922515)
- Controles operativos y financieros (41640316737171)
- Hallazgos (41640291894547)

---

## 📂 3. AUDITAR (section 41007937597203)

Subsecciones:
- Fotos (41640430377107)
- Historial de actividad (41640359904659)

---

## 📂 4. CUENTA Y HERRAMIENTAS (section 44448924271763)

Subsecciones:
- Registro e Inicio de Sesión (article 45839393890579)
- Herramientas (45847149693075)
- Administración y soporte (41007886078355)

---

# 📖 SÍNTESIS TÉCNICA POR ARTÍCULO

> Resumen propio (paráfrasis) construido a partir de la documentación oficial. Cada bloque incluye URL fuente para consulta directa.

---

## A. TIPOS DE COLUMNAS
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/44674432937875

Las columnas en Simetrik son herramientas activas (no contenedores pasivos) que estructuran, transforman y enriquecen los datos. La plataforma ofrece estas categorías:

1. **Columnas del sistema** — Se crean automáticamente en cualquier recurso, sin configuración previa.
2. **Columnas de transformación** — Aplican fórmulas para calcular nuevos valores o reestructurar datos.
3. **Columnas de menú desplegable** — Permiten clasificar partidas usando etiquetas pre-creadas.
4. **Columnas de comentarios** — Notas/justificaciones manuales sobre transacciones.
5. **Columna de duplicados numérica** — Detecta repeticiones de valores numéricos.
6. **Columna de unicidad** — Valida integridad de identificadores.
7. **Columna de vencimiento** — Marca si un registro expiró; requiere una columna de fecha previa.
8. **Columna de fecha "Hoy"** — Referencia de la fecha actual; **solo disponible dentro de agrupaciones**.

### Roles requeridos
- **Supervisor / Constructor:** Crear/configurar la mayoría (transformación, duplicados, unicidad, vencimiento).
- **Editor / Administrador / Operador:** Permisos limitados a columnas de interacción manual (comentarios, "Hoy").

### Prerrequisitos estructurales
- Vencimiento → exige columna de fecha existente.
- Menú desplegable → exige etiquetas creadas en la plataforma.
- Fecha "Hoy" → solo dentro de agrupaciones.
- Si se usa columna de transformación para fuente aperturada → formato debe ser entero.

---

## B. COLUMNAS DE TRANSFORMACIÓN, VENCIMIENTO Y FECHA HOY
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/49768158612243

### Casos de uso
- Calcular valores aplicando operaciones matemáticas o reestructurar (unir/dividir columnas).
- Preparar datos para reglas de conciliación complejas.
- Identificar registros expirados (gestión proactiva de pendientes).
- Calcular antigüedad (aging) y controles de previsiones.
- Tener referencia de fecha actual dentro de una agrupación.

### Sub-tipos
- **Columnas de transformación** — fórmulas matemáticas/lógicas (CONCATENAR, SI, CALCULO, EXTRAER_*, etc.).
- **Columnas de vencimiento** — flag de expiración basado en columna fecha.
- **Columna de fecha "Hoy"** — solo en agrupaciones (acumulativas o no).

---

## C. FUENTES
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/44449344929939

Las **Fuentes** son la base de los procesos de conciliación. Funcionan como una base de datos alimentada por múltiples archivos que comparten estructura idéntica (mismas columnas, mismos tipos).

### Formatos soportados
- Excel (de una sola hoja)
- TXT
- CSV

### Operaciones disponibles
- Cargar, administrar, organizar en carpetas.
- Gestión de estado (Listo, en procesamiento, error).

### Anti-pattern
- Excel multi-hoja NO se ingesta directo — debe separarse o usar parser.

---

## D. UNIONES DE FUENTES
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/44449461182995

Recurso que **combina dos o más fuentes en una sola tabla**, con capacidad de cambiar estructura, agregar o desactivar columnas. Si una fuente cambia estructura, se incorpora a la unión sin reimplementar el caso de uso.

### Beneficios
- Unifica medios de pago / transacciones de distintas plataformas.
- Detiene la inserción cuando un registro no se interpreta (evita registros vacíos).
- Da opción de definir nueva interpretación u omitir.
- Mejora la visualización en tableros al consolidar contrapartidas.

### Prerrequisitos
- Permiso "Crear / Editar / Configurar" en rol.
- Fuentes a unir deben estar en estado **"Listo"**.

---

## E. CONFIGURACIÓN DE CRUCE
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/44673314309651

Cuatro componentes clave para configurar un cruce:

### E.1 Barridas y llaves de cruce
Núcleo de la conciliación: define las **reglas y condiciones exactas** que deben cumplir los registros para considerarse coincidencia.

### E.2 Tipos de cruce y tolerancias
- **Cardinalidad:** 1:1, 1:N, N:1, N:N.
- **Tolerancias:** márgenes aceptables en valores numéricos (operador `~=`).
- N:N obliga a barrida única con robustez alta o media.

### E.3 Universal ID (SKT_ID)
Identificador único asignado a cada registro para **trazabilidad completa** a través de múltiples procesos y recursos.

### E.4 Versión con cambios
Permite modificar configuraciones ya confirmadas de manera segura, manteniendo historial detallado de cada ajuste (auditoría).

---

## F. CONCILIACIÓN ESTÁNDAR
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/44586931880979

Funcionalidad para **automatizar comparación entre dos fuentes**, clasificando transacciones como conciliadas o pendientes.

### Casos ideales
- Seguimiento de registros de pasarelas de pago no liquidadas.
- Unificación de métodos de pago en una vista.

### Prerrequisitos
- Al menos dos fuentes de datos.
- Conciliaciones manuales: ambas fuentes deben tener columna numérica o entero.
- Cruce N:N: una sola barrida con robustez alta o media.

### Tipos de barridas en estándar
(Drill-down en sub-artículo "¿Qué tipos de barridas tienes en una conciliación estándar?")

---

## G. CONCILIACIONES AVANZADAS ⭐ (relevante para DOTA)
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/44672397687059

Nueva generación pensada para **procesos complejos de control financiero** con grandes volúmenes y cadenas elaboradas. Integra en una sola interfaz:
- Reglas de **compensación**
- **Barridas agrupadas**
- **Segmentación**

### Prerrequisitos
- Conciliaciones/compensaciones manuales → columnas numéricas o enteras.
- **Columnas de segmentación:** deben ser tipo Texto, Booleano o Entero y **no tener comportamiento dinámico**.

### Capacidades clave
- Mapeo de pendientes simplificado.
- Configuración de cadenas en una sola interfaz (vs. múltiples conciliaciones encadenadas estándar).

---

## H. ESTÁNDAR vs. AVANZADA
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/44587462022419

| Criterio | Estándar | Avanzada |
|---|---|---|
| **Filosofía** | Comparación directa entre 2 fuentes | Orquesta procesos complejos en una sola interfaz |
| **Volumen** | Bajo-medio | Alto |
| **Cadenas** | Múltiples conciliaciones encadenadas | Cadena integrada |
| **Compensación** | Vía Compensación separada | Integrada en la misma interfaz |
| **Barridas agrupadas** | No | Sí |
| **Segmentación** | No | Sí (columnas texto/booleano/entero, no dinámicas) |

### Recomendación
- Procesos directos 2-fuentes → Estándar.
- Procesos con cadena + compensación + segmentación → Avanzada (caso DOTA × FD).

---

## I. OPTIMIZACIÓN: COLUMNAS, PROGRAMACIÓN, KPIs
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/44586517916179

Tres funcionalidades complementarias:
1. **Selección de columnas en conciliaciones** — Define qué columnas viajan al cruce (no toda la fuente).
2. **Programar conciliación** — Automatiza ejecución periódica (cron/scheduler).
3. **KPIs / Resultados** — Visualiza desempeño del proceso (% conciliado, pendientes, tiempos).

---

## J0. CONCILIACIÓN ENCADENADA ⭐
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/44434453864083

Permite vincular conciliaciones en cadena: los registros **no conciliados** de una etapa se convierten en **fuente de entrada** de la siguiente. Garantiza que cada partida se concilie una sola vez en toda la cadena.

### Prerrequisitos
- Rol Constructor o Supervisor.
- Conciliación base debe ser **cruce 1:1**.

### Flujo de creación (3 pasos)
1. Identificar conciliación previa con registros `unreconciled`.
2. Crear nueva conciliación.
3. En la selección de fuentes, elegir como input los pendientes de la conciliación previa.

### Aplicación a DOTA
La cadena `DOTA → FD → Liquidación → Pendientes` se puede implementar tanto vía Encadenada (estándar) como dentro de una sola **Conciliación Avanzada**. La Avanzada se prefiere porque integra compensación y segmentación en la misma interfaz.

---

## J1. AGRUPACIONES
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/44680591190803

Recurso para **organizar y clasificar datos** de otros recursos con trazabilidad avanzada. Único contexto donde existe la **columna de fecha "Hoy"**.

### Casos de uso
- Categorizar partidas pendientes con criterio uniforme.
- Estandarizar análisis de resultados.
- Generar reportes de previsiones para controles operativos/financieros.

### Prerrequisitos
- Roles Constructor / Supervisor (crear, editar, archivar).
- Necesita un recurso fuente existente: Fuente, Unión de fuentes o Conciliación.

### Tipos
- **Acumulativas** — historial preservado.
- **No acumulativas** — snapshot del momento.

---

## J2. ELIMINAR REGISTROS
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/44446540480787

Eliminación **selectiva** de registros vía filtro (alternativa a borrar archivo completo).

### Regla obligatoria
Debe aplicarse al menos un **filtro** sobre la fuente para que se habilite la opción "eliminar registros".

### Flujo
1. Aplicar filtros en la fuente.
2. Click en "eliminar registros" (ya habilitado).
3. Confirmar en el panel de revisión.

---

## J3. HOJA DE CÁLCULO
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/44794712671763

Interfaz tabular estándar presente en todos los recursos (Fuentes, Uniones, Conciliaciones, Agrupaciones). Es la capa de visualización y gestión.

### Acciones disponibles
- Gestión de columnas (ocultar, ordenar, formatear).
- **Columna BuscarV** — equivalente a VLOOKUP de Excel; enriquece la fuente activa con datos de otra fuente.
- Filtros, búsqueda, exportación.

### Aplicación a DOTA
Es la pantalla principal donde se construyen las 16 columnas calculadas (Llave1, PAN, etc.) y se revisan los resultados del cruce.

---

## J4. COLUMNAS DEL SISTEMA
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/49768148086291

Columnas **automáticas** que Simetrik genera en cada recurso sin configuración. Aportan metadata operativa y trazabilidad (id del registro, timestamps, usuario, estado de conciliación, etc.).

### Uso
- Identificar origen y momento de cada registro.
- Auditar acciones manuales (quién marcó conciliado, comentó, etc.).
- Base para Universal ID (SKT_ID).

---

## K. PARSERS · INTEGRACIONES
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/44721497395603

Transforman archivos no-estructurados o de formato complejo a un formato estándar que Simetrik procesa. Sirven para preparar datos crudos antes de cargarlos a una Fuente.

### Casos de uso
- Preparar TXT, CSV, XLS o XLSX para fuentes/conciliaciones.
- Automatizar transformaciones (ej: separar Excel multi-hoja en CSVs).
- Garantizar compatibilidad sin ajustes manuales.

### Prerrequisitos
- Permiso para configurar salida del repositorio.
- Módulo de **Integraciones** activo en el workspace.
- **Repositorio** existente con los archivos crudos.

---

## L. SMART PARSERS · IA
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/44335599648147

Versión asistida por IA del Parser: detecta automáticamente la estructura del archivo y sugiere un parser adecuado.

### Beneficios
- Habilita usuarios no técnicos (auto-sugerencia).
- Acelera setup de repositorios.
- Permite refinar interpretación de archivos complejos vía prompt a la IA.

### Restricciones
- Formatos: TXT, XLSX, XLS, CSV, JSON, XML.
- Tamaño máx: 10 MB.
- Requiere permisos de configuración de salida de repositorio.

---

## M. REPOSITORIOS
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/44435294197267

Capa que **gestiona los archivos** que entran a la plataforma (manual o automático). Centraliza y prepara información antes de llegar a las Fuentes.

### Casos de uso
- Centralizar datos de bancos, proveedores, sistemas internos.
- Automatizar carga vía SFTP / S3.
- Aplicar parsers para normalizar estructura.
- Distribuir copias a otros repositorios.

### Prerrequisitos
- Permisos para visualizar, crear, configurar repositorios.
- Para automatización: conexión SFTP/S3 pre-configurada.

---

## N. CONEXIONES
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/44795159686547

Integraciones de **entrada** que traen datos de sistemas externos hacia Simetrik. Se reutilizan entre múltiples repositorios sin re-configurar credenciales.

### Orígenes soportados
- Amazon S3
- SFTP
- Bases de datos relacionales
- Plataformas de datos analíticos

### Beneficios
- Centraliza control de integraciones.
- Reduce dependencia del equipo de soporte.
- Reutilización entre repositorios.

---

## J. TABLEROS
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/45657122653715

Herramienta de **visualización centralizada**. Da visibilidad completa de la información del workspace.

### Casos de uso
- Controlar procesos (operaciones, gestión).
- Análisis centralizado de todos los tableros del workspace.
- Generar reportes para distintos niveles (operativo a ejecutivo).

### Permisos
- Distintos niveles para visualizar / crear / editar / descargar.
- Roles personalizados recomendados.

### Sub-componentes del catálogo Análisis (síntesis abajo)
- Estado de conciliación estándar (J.1)
- Estado de conciliación avanzada (J.2)
- Monitores (J.3)
- Tabla Personalizada (J.4)
- Tabla Dinámica (J.5)
- KPI Individual (J.6)
- Gráficos (J.7)
- Combinaciones (J.8)

---

## J.1 ESTADO DE CONCILIACIÓN ESTÁNDAR
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/44890465841939

Componente de tablero que muestra los **resultados resumidos** de una sola conciliación estándar (% conciliado, pendientes, montos). Ideal para drill-down operativo en una conciliación específica.

---

## J.2 ESTADO DE CONCILIACIÓN AVANZADA
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/44890320273043

Vista integral del **resultado consolidado** de una conciliación avanzada (incluye toda la cadena + compensaciones + segmentos). Permite monitorear el flujo completo en una sola tarjeta.

### Aplicación DOTA
Es el tablero 14 ("Estado de la conciliación") en la prueba.

---

## J.3 MONITORES
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/44675781844755

Espacio centralizado para **supervisar el desempeño de conciliaciones y fuentes** sin abrir cada una. Detecta irregularidades (discrepancias, demoras, errores) en tiempo casi real.

### Aplicación DOTA
Útil para monitorear la salud del proceso DOTA × FD una vez productivo (pendientes acumulándose, fuente FD sin ingestar, etc.).

---

## J.4 TABLA PERSONALIZADA
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/44671803737235

Permite **seleccionar columnas específicas** de un recurso para mostrarlas como tabla en el tablero, sin modificar la fuente original. Ideal para vistas curadas.

### Aplicación DOTA
Para el tablero 16 ("Detalle de pendientes"): mostrar solo `Llave1`, `PAN`, `Fecha`, `Monto`, `Días vencido`.

---

## J.5 TABLA DINÁMICA
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/[ana_results[6] URL]

Equivalente a la pivot table de Excel: agrupa, agrega y cruza dimensiones dentro de un tablero. Útil para resúmenes por categoría/fecha.

### Aplicación DOTA
Para el tablero 15 ("Saldo neto diario"): filas = fecha, columnas = tipo, valores = SUMA(monto).

---

## J.6 KPI INDIVIDUAL
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/.../KPI-Individual

Tarjetas visuales que muestran un **indicador numérico clave**: cifras resumidas o cálculos puntuales. Vista ejecutiva para cierres mensuales o controles diarios.

### Aplicación DOTA
KPIs tipo: `% conciliado hoy`, `# pendientes > 15 días`, `Monto neto compensado`.

---

## J.7 GRÁFICOS
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/.../Gr%C3%A1ficos

Visualizaciones (barras, líneas, donuts) sobre los recursos. Para identificar patrones, comparar resultados, reconocer tendencias.

### Aplicación DOTA
Gráfico de evolución de pendientes en el tiempo, comparativo DOTA vs FD por día.

---

## O. CONTABILIDAD · MÓDULO COMPLETO

### O.1 Gestión de cuentas
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/.../Gesti%C3%B3n-de-cuentas

Vista unificada y jerárquica del plan de cuentas. Permite asignar procedimientos, responsables y niveles de certificación a cada cuenta. Sirve como fuente de verdad única para el cierre.

### O.2 Automatizaciones contables
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/.../Automatizaciones-contables

Convierten eventos de conciliación (registros conciliados, ajustados, etc.) en **asientos contables** listos para enviar al ERP. Reduce trabajo manual y errores en la fase de registro.

### O.3 Estructuras ERP personalizadas
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/.../Estructuras-ERP-personalizadas

Plantillas **JSON** que definen el formato exacto que el ERP del cliente espera recibir. Simetrik usa esta plantilla para empacar los asientos en el shape correcto antes de enviarlos.

### O.4 Configuración de cierre
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/.../Configuraci%C3%B3n-de-cierre

Bases operativas del cierre contable: períodos, responsables, controles obligatorios, flujo de aprobación. Define el "marco" sobre el que corren las automatizaciones y certificaciones.

### O.5 Conexiones ERP
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/.../Conexiones-ERP

Capa de integración de **salida** que envía los asientos generados al ERP destino. Conexión segura, auto-gestionada, separada de la lógica contable.

### Aplicación al módulo 11-ACC (Accounting Associate) del Cerebro
El stack contable de Simetrik (Gestión cuentas → Automatizaciones → Estructuras ERP → Conexiones ERP) puede inspirar la arquitectura del módulo 11-ACC: separar plan de cuentas, generación de asientos y envío como capas independientes.

---

## J.8 COMBINACIONES
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/44335174944275

Recurso que **unifica múltiples conciliaciones** (estándar + avanzadas) en uno solo, usando **SKT_ID** como llave para relacionar registros. Reduce esfuerzo de análisis al consolidar resultados de varios procesos.

### Aplicación DOTA
Si la prueba evoluciona a múltiples comercios (DOTA + otros), Combinaciones permite ver todos los flujos en un tablero único.

---

# 📂 CATEGORÍA 2: GESTIONAR

## P. CONTROLES CONTABLES

### P.1 Conciliaciones de cuentas
Estructura el cierre contable: prepara y certifica saldos por cuenta, centralizando la formalización del proceso. Equivale a la capa de "account recon" del cierre mensual.

### P.2 Períodos contables
Define los intervalos temporales (mes, trimestre) donde se registran y cierran operaciones. Gobierna el calendario de cierre.

### P.3 Asientos contables
Tablero centralizado para monitorear estado de generación y contabilización de los asientos producidos por las automatizaciones. Vista de control del flujo `evento → asiento → ERP`.

## Q. CONTROLES OPERATIVOS Y FINANCIEROS

### Q.1 Gestiones manuales en conciliaciones
Mecanismo para intervenciones puntuales sobre el flujo automático: marcar manualmente como conciliado, ajustar, comentar. Cubre las excepciones que la automatización no resuelve.

### Q.2 Buscador de registros
Búsqueda transversal sobre una fuente principal + hasta 5 fuentes secundarias en paralelo. Útil para rastrear una transacción específica cross-recurso (ej: encontrar dónde quedó un PAN específico).

## R. HALLAZGOS

### R.1 Alarmas
Monitoreo proactivo con condiciones definidas. Notifica cuando algo se sale de patrón (pendientes > umbral, fuente sin ingestar, etc.).

---

# 📂 CATEGORÍA 3: AUDITAR

### S.1 Fotos
Snapshots del estado de un recurso/conciliación en un momento dado. Útil para evidencia regulatoria o reproducir resultados.

### S.2 Historial de actividad
Trazabilidad completa de acciones de usuarios sobre el sistema (quién, qué, cuándo). Capa de auditoría.

---

# 📂 CATEGORÍA 4: CUENTA Y HERRAMIENTAS

## T. HERRAMIENTAS
- **Consola de Desarrollo** — Sandbox/debug para configuraciones.
- **Solicitudes de colaboración** — Workflow de pedidos entre usuarios.
- **Central de descargas** — Cola de exports asincrónicos.
- **Papelera** — Recuperación de recursos eliminados.
- **Procesos** — Monitor de jobs en ejecución.
- **Mapas** — Visualización geoespacial de información.

## U. ADMINISTRACIÓN Y SOPORTE
- **Doble factor de autenticación** — 2FA para login.
- **Cómo crear un ticket de soporte** — Canal oficial con Simetrik.
- **Accesos Directos** — Shortcuts a recursos frecuentes.
- **Administración de cuentas** — Gestión de usuarios, roles, espacios.

### V. Registro e Inicio de Sesión
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/45839393890579
Flujo de login y onboarding inicial.

---

# 🎯 APLICACIÓN AL CASO DOTA × FIRST DATA

Mapeo de la prueba al stack oficial:

| Componente DOTA | Funcionalidad oficial Simetrik | Sección Help Center |
|---|---|---|
| Cargar archivos DOTA + FD | Fuentes | Recursos y conciliaciones · Fuentes |
| Unir DOTAs si vienen separadas | Uniones de fuentes | Recursos y conciliaciones · Uniones |
| Calcular Llave1 (CONCATENAR) | Columnas de transformación | Recursos y conciliaciones · Columnas de transformación |
| Estandarizar PAN/BIN | Columnas de transformación | Recursos y conciliaciones · Columnas de transformación |
| Día hábil siguiente (ARG) | Columnas de transformación + Calendario | Recursos y conciliaciones · Columnas de transformación |
| Marcar > 15 días | Columnas de vencimiento | Recursos y conciliaciones · Columnas de transformación, vencimiento y fecha hoy |
| Cruce 1:1 con tolerancia | Configuración de cruce + Tolerancias | Recursos y conciliaciones · Configuración de cruce |
| Trazabilidad de partidas | Universal ID (SKT_ID) | Recursos y conciliaciones · Configuración de cruce |
| Cadena DOTA → FD → Liquidación | Conciliaciones Avanzadas (cadena integrada) | Recursos y conciliaciones · Conciliaciones avanzadas |
| Saldos persistentes / pendientes | Conciliación + Vencimiento + Tablero Pendientes | Recursos y conciliaciones + Análisis |
| Tableros del proceso | Tableros + KPI + Monitores | Análisis · Tableros |
| Aprobaciones y auditoría | Versión con cambios + Historial de actividad | Configuración de cruce + Auditar |

---

# 📌 NEXT-STEP SCRAPING (pendiente)

Para completar la KB al 100% restan extraer:

### Recursos y conciliaciones (drill-down faltante)
- Tipos de barridas estándar (sub-artículo)
- Tipos de barridas avanzadas (sub-artículo)
- Conciliación Encadenada (44434453864083)
- Desencadenante de conciliaciones
- Hoja de cálculo (44794712671763)
- Agrupaciones (44680591190803)
- Columnas del sistema (49768148086291)
- Eliminar registros (44446540480787)

### Integraciones
- Parsers, Smart Parsers, Repositorios, Conexiones

### Contabilidad
- Gestión de cuentas, Automatizaciones contables, Estructuras ERP, Configuración de cierre, Conexiones ERP

### Análisis (drill-down)
- Estado de conciliación estándar / avanzada / encadenada
- Monitores, Tabla Personalizada, Tabla Dinámica, KPI Individual, Gráficos, Consolidaciones, Combinaciones

### Gestionar
- Controles Contables, Controles operativos y financieros, Hallazgos

### Auditar
- Fotos, Historial de actividad

### Cuenta y Herramientas
- Registro/Login, Herramientas, Administración y soporte

---

# 🔬 DRILL-DOWN v2.0 · FLUJOS PASO A PASO (8 ARTÍCULOS CRÍTICOS)

> Scraped 2026-05-31 vía Chrome MCP. Paráfrasis propia a partir del Help Center oficial.

---

## E2. CONFIGURACIÓN DE CRUCE — Flujo detallado
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/44673314309651

### E2.1 Barridas y llaves de cruce — Cómo crear
**Prerrequisitos:** Rol Constructor o Supervisor. Al menos dos fuentes seleccionadas en la conciliación.

**En conciliación estándar:**
1. Ve a la configuración de cruce → "Crear barrida".
2. Agrega reglas (llaves de cruce): elige columna de Fuente A y columna de Fuente B para comparar.
3. Al guardar, el sistema muestra **robustez**: verde (alta), amarillo (media), rojo (débil).

**En conciliación avanzada** (tipos especiales además de estándar):
- **Barrida de Compensación:** un único recurso compensa registros dentro de sí mismo.
- **Barrida Agrupada:** realiza cálculos simples o agrupados antes del cruce.

> Tip: Un cruce = una o más barridas. Una barrida = una o más reglas. Las reglas son las comparaciones entre columnas.

### E2.2 Tipos de cruce (cardinalidad)
**Path UI:** Configuración de cruce → ícono de configuración de la barrida → tipo de cruce.

| Tipo | Descripción |
|---|---|
| **1:1** | Un registro de A ↔ un registro de B. Default. |
| **1:N** | Un registro de A ↔ múltiples de B. |
| **N:1** | Múltiples de A ↔ un registro de B. |
| **N:N** | Múltiples de A ↔ múltiples de B. Requiere robustez alta o media, **no admite tolerancias**. |

Pasos: Configuración de cruce → ícono config → seleccionar tipo → Guardar.

### E2.3 Tolerancias
**Aplica solo a cruce 1:1.** No disponible en N:N, N:1, 1:N.

1. Acceder a configuración de cruce.
2. Seleccionar barrida existente o crear nueva.
3. Agregar reglas de cruce.
4. Establecer valor de tolerancia en la regla (margen aceptable para diferencias numéricas).
5. Opcional: activar "validación de valores" para conciliaciones manuales (bloquea cruces que excedan la tolerancia).

**Operador:** `~=` (casi iguales). **Restricción:** columnas deben ser tipo numérico o entero.

### E2.4 Universal ID (SKT_ID)
**Path UI:** Vista de configuración de conciliación → barra de herramientas → "Global ID" → seleccionar columna.

- La columna elegida debe ser `SKT_ID` u `ORIGIN_SKT_ID` heredada desde fuente, unión o apertura.
- El sistema asigna automáticamente un ID único a cada registro para trazabilidad cross-recursos.

### E2.5 Posibilidades y restricciones clave
- ✅ Crear múltiples barridas en orden secuencial.
- ✅ Usar barridas de compensación y agrupadas (solo en avanzada).
- ❌ Tolerancias en N:N, N:1, 1:N → no disponibles.
- ❌ Si robustez baja en N:N → la conciliación no ejecuta.

---

## G2. CONCILIACIONES AVANZADAS — Flujo detallado
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/44672397687059

### G2.1 Cómo crear una conciliación avanzada
1. Menú → **Automatizar > Recursos y conciliaciones > Conciliaciones**.
2. "Crear recurso" → **Conciliación avanzada**.
3. Asignar nombre (+ descripción opcional) → Crear.
4. Seleccionar fuentes para **Lado A** y **Lado B**.
5. Decidir si usar **grupo conciliable** o **segmentar** (Lado A, B o ambos). Las columnas de segmentación deben ser tipo Texto, Booleano o Entero, **sin comportamiento dinámico**.
6. Configurar **desencadenante** (recurso o horario programado). Por defecto: Recurso B. Si B es unión/foto/agrupación → toma Recurso A.
7. Seleccionar columnas a visualizar en el resultado.
8. Ir a **Configurar cruce** → definir barridas.
9. Agregar al menos una regla por barrida; opcionalmente agrupar el recurso para la barrida.
10. Duplicar, editar o eliminar barridas según se necesite → Ejecutar.

> Tip: El cruce 1:1 es el predeterminado.

### G2.2 Tipos de barridas en conciliación avanzada
**Barrida de conciliación (estándar):**
- Paso 1: "Configurar barridas" → "Barridas de Conciliación".
- Paso 2: Seleccionar columna Lado A y columna Lado B.
- Paso 3: Elegir condición: `=`, `≠`, `~=` (casi iguales), `>=`, `>`, `<=`, `<`.
- Paso 4: Aplicar tolerancia si el tipo de dato lo permite.

**Barrida de compensación:** Selecciona un único recurso para compensar registros internamente (débitos vs créditos del mismo recurso).

**Barrida agrupada:** Permite agrupar el recurso antes del cruce para realizar sumas/conteos y luego comparar los totales.

### G2.3 Segmentación
- Las columnas de segmentación dividen los datos antes del cruce.
- Restricción: tipo Texto, Booleano o Entero. **Sin comportamiento dinámico** (no columnas de menú desplegable ni calculadas con funciones dinámicas).

---

## F2. CONCILIACIÓN ESTÁNDAR — Flujo detallado
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/44586931880979

### F2.1 Cómo crear una conciliación estándar
1. Menú → **Automatizar > Recursos y conciliaciones > Conciliaciones**.
2. "Crear recurso" → **Conciliación estándar**.
3. Asignar nombre → Crear.
4. Seleccionar las **dos fuentes** de datos a controlar.
   > Tip: Usar uniones de fuentes como base da más flexibilidad ante cambios futuros de estructura.
5. Elegir el **desencadenante** (por defecto: Recurso B; si es unión/foto/agrupación → Recurso A).
6. "Configurar cruce" → configurar barridas y reglas.
7. Confirmar la conciliación.

### F2.2 Tipos de barridas en conciliación estándar
**Barrida de conciliación:**
- Igual que en avanzada: seleccionar columnas A y B + condición (`=`, `≠`, `~=`, `>=`, `>`, `<=`, `<`).
- Tolerancia disponible si el tipo de dato lo permite.

**Barrida de desconciliación** (requiere Versión con cambios):
- Disponible en conciliaciones **Confirmadas**.
- Tipos: por regla de cruce (campos obligatorios: Recurso, Columna Fecha, Columna ID, Columna Estado).
- Resultados visibles en "Versión con cambios" hasta confirmar.

---

## B2. COLUMNAS DE TRANSFORMACIÓN — Catálogo completo de funciones
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/49768158612243

**Separador de parámetros:** `;` (punto y coma). **Strings:** entre comillas dobles `"…"`. **Nombres de columna:** en MAYÚSCULAS.

### Funciones de Texto
| Función | Descripción | Sintaxis |
|---|---|---|
| `CONCATENAR` | Une varios valores en un texto | `CONCATENAR(texto_1;[texto_2];...)` |
| `DERECHA` | Extrae N caracteres desde la derecha | `DERECHA(VALOR;LIMITE_DE_CARACTERES)` |
| `IZQUIERDA` | Extrae N caracteres desde la izquierda | `IZQUIERDA(VALOR;LIMITE_DE_CARACTERES)` |
| `EXTRAE` | Extrae subcadena desde posición y longitud | `EXTRAE(VALOR;COMIENZO;LONGITUD)` |
| `EXTRAER_EXPREGULAR` | Extrae subcadena que coincide con regex | `EXTRAER_EXPREGULAR(VALOR;PATRÓN;[GRUPO])` |
| `MAYUSC` | Convierte a mayúsculas | `MAYUSC(VALOR)` |
| `MINUSC` | Convierte a minúsculas | `MINUSC(VALOR)` |
| `REEMPLAZAR` | Reemplaza parte de una cadena | `REEMPLAZAR(VALOR;SUBTEXTO;[REEMPLAZO])` |
| `RELLENAR` | Rellena cadena con carácter hasta largo definido | `RELLENAR(VALOR;LARGO;[CARACTER];[LADO])` |
| `DIVIDIR` | Divide por delimitador y devuelve elemento en posición | `DIVIDIR(VALOR;DELIMITADOR;POSICION)` |
| `LARGO` | Devuelve cantidad de caracteres | `LARGO(VALOR)` |
| `ESPACIOS` | Elimina o gestiona espacios | `ESPACIOS(VALOR;[CARACTERES];[LADO])` |
| `ENCONTRAR` | Devuelve posición de subcadena en cadena | `ENCONTRAR(SUBTEXTO;VALOR)` |

### Funciones Numéricas
| Función | Descripción | Sintaxis |
|---|---|---|
| `CALCULO` | Operación matemática entre columnas/constantes | `CALCULO(expresión)` |
| `ABS` | Valor absoluto | `ABS(VALOR_NUMÉRICO)` |
| `POTENCIA` | Eleva base a exponente | `POTENCIA(BASE;EXPONENTE)` |
| `REDONDEAR` | Redondea con N decimales | `REDONDEAR(VALOR;ESCALA)` |
| `MENOS` | Redondea al entero igual o menor (floor) | `MENOS(VALOR)` |

### Funciones Lógicas
| Función | Descripción | Sintaxis |
|---|---|---|
| `SI` | Evalúa condición, devuelve V/F | `SI(CONDICIÓN;[VALOR_SI_CIERTO];[VALOR_SI_FALSO])` |
| `Y` | TRUE si TODOS los argumentos son verdaderos | `Y(CONDICIÓN;CONDICIÓN;...)` |
| `O` | TRUE si ALGUNO de los argumentos es verdadero | `O(CONDICIÓN;CONDICIÓN;...)` |
| `ESBLANCO` | Devuelve TRUE/FALSE si el valor está en blanco | `ESBLANCO(VALOR)` |

### Funciones de Fecha
| Función | Descripción | Sintaxis |
|---|---|---|
| `DIFERENCIA_FECHA` | Diferencia entre dos fechas (entero) | `DIFERENCIA_FECHA(PRIMERA_FECHA;SEGUNDA_FECHA;PERÍODO)` |
| `EXTRAER_FECHA` | Extrae parte de una fecha (año, mes, día, etc.) | `EXTRAER_FECHA(VALOR;PERÍODO)` |
| `DIASEM` | Devuelve el día de la semana de una fecha | `DIASEM(FECHA)` |
| `ADICIONAR_DIASEMANA` | Agrega días hábiles a una fecha | `ADICIONAR_DIASEMANA(FECHA;CANTIDAD)` |
| `TODAY` | Fecha actual (solo en agrupaciones) | `TODAY()` |

> **Nota crítica para DOTA:** Para calcular "Días vencido" usar `DIFERENCIA_FECHA(FECHA_TXN;TODAY();"DÍAS")` dentro de una agrupación. El separador es `;` SIEMPRE. Strings van entre `"` dobles.

---

## C2. FUENTES — Flujo detallado
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/44449344929939

### C2.1 Cómo crear una fuente
1. Vista de Recursos → "Crear recurso" → **Fuentes**.
2. Asignar nombre (1–250 caracteres, sin caracteres especiales) → Crear.
3. Ir al **Gestor de Archivos** → agregar archivos (Excel de una sola hoja, TXT o CSV).
4. Si el archivo se sube vacío → estado "Archivo vacío".

### C2.2 Cómo administrar fuentes
- **Editar:** cambiar nombre.
- **Mover a carpeta:** organizar en carpetas.
- **Crear integración:** automatizar carga de datos.
- **Gestionar archivos:** agregar/eliminar archivos.
- **Ver tabla:** consultar datos.
- **Archivar:** desactivar sin eliminar.

### C2.3 Restricciones
- Excel multi-hoja → NO se ingesta directamente. Usar parser para separar.
- Estado "Listo" requerido antes de usar en uniones o conciliaciones.

---

## D2. UNIONES DE FUENTES — Flujo detallado
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/44449461182995

### D2.1 Cómo crear una unión
1. Vista de Recursos → "Crear recurso" → **Unión de fuentes** → asignar nombre.
2. Elegir la primera fuente; seleccionar columnas a incluir.
3. Verificar tipo de dato y formato de cada columna.
4. Agregar más fuentes/columnas según se necesite.
5. Clic en **"Ejecutar cambios"**.
   > Tip: La primera fuente agregada es el desencadenante por defecto. Se puede cambiar en Configuración de preferencias.

### D2.2 Cómo editar una unión
1. Vista de lista → ubica la unión → Acciones → "Editar configuración".
2. Renombrar, activar/desactivar columnas, cambiar desencadenante.

### D2.3 Gestión de inconsistencias
Si una fuente cambia estructura (nueva columna, tipo diferente), la unión detecta la inconsistencia y ofrece:
- **Definir nueva interpretación** de la columna afectada.
- **Omitir** el registro inconsistente.
El sistema detiene la inserción de registros no interpretables para evitar datos vacíos.

---

## J2b. TABLEROS — Flujo detallado
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/45657122653715

### J2b.1 Cómo crear un tablero
1. Menú → **Automatizar > Análisis > Tableros**.
2. Clic en "Crear" → **Tableros**.
3. Ingresar nombre → seleccionar tipo: **Operativo** o **Contable**.
4. Clic en **"Configuración"** → agregar visuales.

> **Límite:** 21 elementos en total. Cada visual consume un número predefinido de elementos (ej. "Estado de conciliación estándar" = 1 visual con 7 elementos).

### J2b.2 Acciones disponibles en un tablero
- Expandir/colapsar cada visual.
- Aplicar filtros predeterminados (Fuentes A y B).
- Descargar en **PDF** o **CSV**.
- Agregar nuevos visuales o reordenar desde Configuración.

### J2b.3 Restricciones
- ✅ Crear, renombrar, eliminar tableros. Organizar en carpetas. Buscar/filtrar/ordenar.
- ✅ Descargar PDF del tablero completo. Descargar datos de visuales por separado.
- ❌ Límite de 21 elementos → planificar qué visuales incluir.
- ❌ No se pueden combinar visuales de tipo Operativo y Contable en el mismo tablero.

---

## J1b. AGRUPACIONES — Flujo detallado
**Fuente:** https://simetriksoporte.zendesk.com/hc/es-419/articles/44680591190803

### J1b.1 Cómo crear una agrupación
1. Desde la vista de un recurso (Fuente, Unión o Conciliación) → "Crear agrupación".
2. Asignar nombre único (3–100 caracteres).
3. Definir estructura: seleccionar **columnas de agrupación** (criterios de agrupación).
4. Seleccionar **columnas de valores** (sobre las que se aplican SUMA, CONTEO, etc.).

### J1b.2 Cómo agregar columna TODAY (fecha dinámica)
1. Ingresar a la agrupación (acumulativa o no acumulativa).
2. Configuración → agregar nueva columna tipo **Hoy**.
3. Asignar nombre + zona horaria + formato de fecha.
4. Guardar. La columna se actualiza automáticamente cada día.

### J1b.3 Acumulativa vs No Acumulativa
| Tipo | Comportamiento |
|---|---|
| **Acumulativa** | Continúa agrupando aunque el registro se concilie. Ideal para seguimientos post-conciliación. |
| **No acumulativa** | Al conciliarse un registro, se bloquea en la agrupación. Nuevos registros crean nueva entrada separada. |
| **Saldos acumulados** | Cálculo retroactivo: insertar/eliminar datos pasados actualiza saldos hasta la fecha más reciente. |

### J1b.4 Restricciones
- ❌ No se pueden usar dos agrupaciones **acumulativas** en la misma conciliación.
- ❌ No se pueden modificar criterios/valores si la agrupación ya está en conciliación activa.
- ❌ Cambio de formato (casteo) debe hacerse en el recurso original, no en la agrupación.
- ✅ Se pueden agregar columnas de transformación, menú desplegable, comentarios y BuscarV.
- ✅ Filtrar, segmentar, generar alarmas, descargar datos.

---

# 📝 CHANGELOG

| Fecha | Evento |
|---|---|
| 2026-05-29 | v1.0 — Estructura completa + síntesis de 10 artículos críticos (Tipos de columnas, Columnas de transformación, Fuentes, Uniones, Configuración de cruce, Conciliación estándar, Conciliaciones avanzadas, Estándar vs Avanzada, Optimización, Tableros). Mapeo DOTA → stack oficial. |
| 2026-05-29 | v1.1 — +5 artículos secundarios Recursos y conciliaciones (Encadenada, Agrupaciones, Eliminar registros, Hoja de cálculo, Columnas del sistema). |
| 2026-05-29 | v1.2 — +4 artículos Integraciones (Parsers, Smart Parsers, Repositorios, Conexiones). |
| 2026-05-29 | v1.3 — +8 artículos Análisis (Estado est/avz, Monitores, Tabla Personalizada/Dinámica, KPI Individual, Gráficos, Combinaciones). |
| 2026-05-29 | v1.4 — +5 artículos Contabilidad (Gestión cuentas, Automatizaciones, Estructuras ERP, Cierre, Conexiones ERP). Stack contable mapeado a módulo 11-ACC. |
| 2026-05-29 | v1.5 — Cierre Gestionar (Controles Contables, Operativos, Hallazgos), Auditar (Fotos, Historial), Cuenta y Herramientas. KB v1 cierra cobertura completa. |
| 2026-05-31 | v2.0 — Drill-down completo: flujos paso a paso de 8 artículos críticos (Configuración de cruce, Conciliaciones avanzadas, Conciliación estándar, Columnas de transformación, Fuentes, Uniones, Tableros, Agrupaciones). Catálogo completo de 24 funciones de transformación con sintaxis. |

