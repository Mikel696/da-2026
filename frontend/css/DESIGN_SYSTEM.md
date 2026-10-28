# 🎨 DA-2026 · Design System

> v1.0 · 2026-05-15 · creado en Fase 1 del Master UX Sprint.
> Live showcase: [`/pages/design-system.html`](../pages/design-system.html).

Sistema de diseño centralizado para los 16 módulos del Cerebro. Dos archivos canónicos:

| Archivo | Propósito | Cómo se usa |
|---|---|---|
| [`design-tokens.css`](./design-tokens.css) | Variables CSS (colores, tipografía, espaciado, radios, sombras, transiciones, z-index) | `<link>` ANTES de cualquier otro CSS del módulo. Compatible con CSS legacy vía aliases. |
| [`components.css`](./components.css) | Componentes con clases prefijo `.ds-*` (button, card, input, badge, toast, modal, skeleton, tooltip, nav, typography, utils) | `<link>` después de `design-tokens.css`. Migración progresiva sin romper CSS viejo. |

---

## 🚀 Quick start

```html
<head>
  <!-- design system primero -->
  <link rel="stylesheet" href="css/design-tokens.css">
  <link rel="stylesheet" href="css/components.css">
  <!-- después el CSS específico del módulo -->
  <link rel="stylesheet" href="css/mi-modulo.css">
</head>
<body>
  <nav class="ds-nav">
    <div class="ds-nav-left">
      <a href="index.html">← Cerebro</a>
      <span class="ds-nav-sep"></span>
      <span class="ds-nav-logo">DA-2026</span>
    </div>
  </nav>

  <main class="ds-stack-4" style="padding:24px;max-width:1100px;margin:0 auto">
    <h1 class="ds-h1">Mi módulo</h1>
    <p class="ds-text">Descripción del módulo.</p>

    <div class="ds-grid-auto">
      <div class="ds-card is-interactive">
        <div class="ds-card-header">
          <h3 class="ds-card-title">Card normal</h3>
          <span class="ds-badge is-info">12</span>
        </div>
        <p class="ds-card-body">Contenido de la card.</p>
        <div class="ds-card-footer">
          <button class="ds-btn is-primary">Acción</button>
          <button class="ds-btn is-ghost">Cancelar</button>
        </div>
      </div>
    </div>
  </main>
</body>
```

---

## 🎨 Paleta canónica

| Token | Hex | Uso |
|---|---|---|
| `--color-accent` | `#8b5cf6` | **Accent canónico · violeta** (4/5 módulos lo usan) |
| `--color-cyan` | `#06b6d4` | Variante 14-WORK (Simetrik) |
| `--color-green` | `#22c55e` | Success, ok, certificado |
| `--color-amber` | `#eab308` | Warning, pendiente |
| `--color-red` | `#ef4444` | Error, peligro, eliminar |
| `--color-orange` | `#f97316` | En progreso, atención |
| `--color-pink` | `#ec4899` | Highlight, novedad |
| `--color-emerald` | `#10b981` | Variante de éxito |

### Neutros (dark theme)

| Token | Hex | Uso |
|---|---|---|
| `--color-bg` | `#09090b` | Fondo de la página |
| `--color-bg-2` | `#16161a` | Cards, paneles elevados |
| `--color-bg-3` | `#1c1c21` | Inputs, botones secundarios |
| `--color-bg-4` | `#222228` | Hover de bg-3 |
| `--color-border` | `#27272a` | Bordes |
| `--color-border-2` | `#3f3f46` | Bordes hover/focus |
| `--color-text` | `#fafafa` | Texto principal |
| `--color-text-2` | `#a1a1aa` | Texto secundario, labels |
| `--color-text-3` | `#52525b` | Texto disabled, terciario |

### Aliases legacy (compatibilidad)

`--bg, --c1, --bd, --tx, --t2, --t3, --ac, --gn, --rd, --or, --am, --cy, --pk, --em, --ag, --gg, --rg, --og, --amg, --cg, --pkg, --eg, --emg, --acg, --gng` → todos apuntan a los nuevos tokens. CSS viejo sigue funcionando.

---

## ✍️ Tipografía

| Token | Familia | Uso |
|---|---|---|
| `--font-sans` | IBM Plex Sans (fallback Inter) | Body · UI general |
| `--font-mono` | IBM Plex Mono (fallback JetBrains Mono) | Code · datos · etiquetas |
| `--font-display` | Newsreader (fallback IBM Plex Serif) | Headers grandes (h1, h2, kicker) |

### Escala tipográfica (8 niveles)

```
--text-xs     11px    · captions, badges
--text-sm    12.5px   · body small, helper text
--text-base   14px    · body default
--text-md     16px    · body grande, intro
--text-lg     20px    · h3
--text-xl     28px    · h2
--text-2xl    36px    · h1
--text-3xl    48px    · hero
```

Helpers: `.ds-h1`, `.ds-h2`, `.ds-h3`, `.ds-text`, `.ds-text-sm`, `.ds-text-xs`, `.ds-text-mono`, `.ds-text-strong`, `.ds-kicker`.

---

## 📐 Espaciado (sistema 4px)

```
--space-1   4px    --space-5   24px
--space-2   8px    --space-6   32px
--space-3   12px   --space-7   48px
--space-4   16px   --space-8   64px
                   --space-9   96px
```

Usar siempre múltiplos de 4 para alineación pixel-perfect.

Stack helpers: `.ds-stack-2/3/4` (vertical) · `.ds-row-2/3/4` (horizontal).
Grid helpers: `.ds-grid-2/3/auto`.

---

## 🔘 Radios

```
--radius-sm     6px    · inputs pequeños
--radius-md    10px    · botones, inputs (default)
--radius-lg    14px    · cards (default)
--radius-xl    20px    · modales, hero
--radius-2xl   28px    · cards grandes
--radius-full  9999px  · pills, avatars
```

---

## 🌑 Sombras (dark theme)

```
--shadow-sm    sombra suave bajo botones
--shadow-md    cards elevadas
--shadow-lg    modales, dropdowns
--shadow-xl    overlays grandes
--shadow-glow  focus ring violeta (--color-accent-bg)
```

---

## ⚡ Transiciones

```
--transition-fast   120ms  · hover, focus
--transition-base   180ms  · default
--transition-slow   280ms  · entrada de paneles, modales

--easing-default    cubic-bezier(0.4, 0, 0.2, 1)
--easing-spring     cubic-bezier(0.34, 1.56, 0.64, 1) · bouncy
```

Animación canónica de mount: `.ds-fade-up` (opacity + translateY).

---

## 🧱 Componentes (`.ds-*`)

### Button

```html
<button class="ds-btn">Default</button>
<button class="ds-btn is-primary">Primary</button>
<button class="ds-btn is-ghost">Ghost</button>
<button class="ds-btn is-danger">Danger</button>
<button class="ds-btn is-success">Success</button>
<button class="ds-btn is-icon">×</button>
<button class="ds-btn is-sm">Small</button>
<button class="ds-btn is-lg">Large</button>
```

Estados automáticos: `:hover` (lift + shadow), `:focus-visible` (glow ring), `:active`, `:disabled`.

### Card

```html
<div class="ds-card">                  <!-- default -->
<div class="ds-card is-elev">          <!-- con sombra -->
<div class="ds-card is-flat">          <!-- transparente -->
<div class="ds-card is-interactive">   <!-- hover lift + accent border -->

  <div class="ds-card-header">
    <h3 class="ds-card-title">Título</h3>
    <span class="ds-badge is-info">tag</span>
  </div>
  <div class="ds-card-body">Contenido</div>
  <div class="ds-card-footer">
    <button class="ds-btn is-primary">Acción</button>
  </div>
</div>
```

### Input

```html
<label class="ds-label">Email</label>
<input class="ds-input" type="email" placeholder="tu@email.com">
<textarea class="ds-textarea" placeholder="Tu mensaje..."></textarea>
<select class="ds-select">...</select>
```

Tamaños: `.ds-input.is-sm`, `.ds-input.is-lg`. Focus ring violeta automático.

### Badge

```html
<span class="ds-badge">Default</span>
<span class="ds-badge is-success">OK</span>
<span class="ds-badge is-warn">Pending</span>
<span class="ds-badge is-danger">Failed</span>
<span class="ds-badge is-info">Info</span>
<span class="ds-badge is-cyan">Cyan</span>
```

### Toast

```html
<!-- Crear desde JS -->
<div class="ds-toast is-success">✓ Guardado</div>
<div class="ds-toast is-danger">✗ Error de red</div>
<div class="ds-toast is-warn">⚠ Atención</div>
<div class="ds-toast is-hidden">...</div>  <!-- ocultar -->
```

Posición fija bottom-right. Para mobile: full-width arriba abajo.

### Modal

```html
<div class="ds-modal-backdrop is-open"></div>
<div class="ds-modal is-open">
  <div class="ds-modal-header">
    <h2 class="ds-h2">Título del modal</h2>
    <button class="ds-modal-close">×</button>
  </div>
  <p class="ds-text">Contenido</p>
</div>
```

### Skeleton (loading)

```html
<div class="ds-skeleton" style="width:200px"></div>
<div class="ds-skeleton is-text-sm" style="width:140px"></div>
<div class="ds-skeleton is-circle" style="width:40px"></div>
```

Shimmer animation 1.4s loop. Usar mientras se carga data.

### Tooltip

```html
<button class="ds-btn ds-tooltip" data-tooltip="Información extra">
  Hover me
</button>
```

Delay 400ms · aparece arriba del trigger.

### Nav (header platform-wide)

```html
<nav class="ds-nav">
  <div class="ds-nav-left">
    <a href="index.html">← Cerebro</a>
    <span class="ds-nav-sep"></span>
    <span class="ds-nav-logo">10-SYS · Systems</span>
  </div>
  <div class="ds-nav-right">
    <!-- auth widget etc -->
  </div>
</nav>
```

---

## 🛠️ Utilidades

| Clase | Hace |
|---|---|
| `.ds-stack` | Flex column · gap 0 |
| `.ds-stack-2/3/4` | Flex column · gap 8/12/16 |
| `.ds-row-2/3/4` | Flex row · gap 8/12/16 · align center |
| `.ds-flex-1` | flex: 1 · min-width: 0 (evita overflow) |
| `.ds-grid-2/3` | Grid 2 o 3 columnas iguales |
| `.ds-grid-auto` | Grid auto-fit minmax(240px, 1fr) · responsive automático |
| `.ds-divider` | Línea horizontal de 1px |
| `.ds-spacer-2/4/6` | Spacer vertical de 8/16/32px |
| `.ds-fade-up` | Animación de entrada (opacity + translateY) |

---

## 📱 Responsive

Breakpoint canónico: **768px**.
Bajo 768px:
- `.ds-grid-2` y `.ds-grid-3` colapsan a 1 columna.
- `.ds-modal` ocupa 96vw.
- `.ds-toast` se vuelve full-width arriba abajo.

Otros breakpoints útiles (no obligatorios): 480px (móvil chico), 1024px (tablet/laptop), 1440px (desktop ancho).

---

## ♿ Accesibilidad

- **Focus visible:** todos los componentes interactivos tienen `:focus-visible` con glow ring violeta. Nunca usar `outline:none` sin reemplazo.
- **Contraste:** la paleta cumple WCAG AA (4.5:1 body, 3:1 large text) sobre `--color-bg`.
- **Touch targets:** botones y inputs ≥36px (los `is-icon` son 36×36).
- **Selección:** `::selection` usa accent-bg para evitar invisibilidad.

---

## 🗺️ Plan de migración

Migración progresiva, módulo por módulo:

1. **Fase 1 (este sprint):** archivos canónicos + showcase. Sin tocar módulos. ✅
2. **Fase 2 — Módulos P0:** 1-IND · 14-WORK · 13-NOT · 10-SYS · 12-FIN.
3. **Fase 2 — Módulos P1:** 3-ENG · 5-JOB · 9-GOA · 8-PRO.
4. **Fase 2 — Módulos P2:** 2-APP · 4-RUT · 11-ACC · 6-TOO · 7-NEW · 15-MM · 16-APA.

Patrón de migración por módulo:
1. Añadir `<link>` a `design-tokens.css` y `components.css` en el `<head>`.
2. Reemplazar `<button class="btn">` por `<button class="ds-btn">`.
3. Reemplazar inputs custom por `.ds-input`.
4. Reemplazar cards custom por `.ds-card`.
5. Eliminar las definiciones redundantes en el `:root` local del módulo.
6. Mantener el CSS específico que aporte valor único.

---

## 🎯 Decisiones cerradas

- **Accent canónico: violeta `#8b5cf6`.** 14-WORK seguirá usando cyan localmente hasta su migración.
- **Tema: dark por default.** Light theme requeriría un override de tokens (no incluido en v1.0).
- **Iconografía: pendiente decisión.** Recomendado migrar a Lucide SVG inline (~6KB). Hoy se mezclan emojis + algún SVG.
- **Prefijo `.ds-*` obligatorio.** Evita colisiones con CSS legacy.

---

## 📋 Changelog

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 2026-05-15 | Versión inicial · 12 tokens · 10 componentes · showcase en `pages/design-system.html` |
