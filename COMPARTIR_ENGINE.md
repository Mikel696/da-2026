# Compartir el English Engine con otras personas

Cómo dar acceso al Engine a unas pocas personas de confianza, poder **invitar y expulsar**
cuando quieras, y que nadie pueda tocar nada tuyo.

Decidido el 8-oct-2026, después de comprobar el terreno:

- El repositorio `Mikel696/da-2026` es **público y clonable sin cuenta** (verificado con una
  descarga anónima: responde 200). Hoy cualquiera con el enlace se lleva el proyecto entero.
- El registro de cuentas está **abierto**: cualquiera que llegue a la página puede crearse una.
- El Cerebro contiene finanzas (12-FIN), trabajo real (14-WORK) y universidad (10-SYS).

De ahí la decisión: **no se comparte el Cerebro. Se comparte una copia del Engine, sola y sin nube.**

---

## Lo que ya está hecho (en este repositorio)

```bash
INVITADOS=1 bash src/english-engine/build.sh ../compartir-engine/index.html
```

Genera la **copia para invitados**: el Engine completo (4231 palabras, 1000 frases, las 11
pestañas) pero:

| | Copia normal | Copia para invitados |
|---|---|---|
| Nube y cuentas | Sí | **No existe** — `09_sync_invitados.js` sustituye al módulo real |
| Clave de tu base de datos dentro del archivo | Sí (clave pública, protegida por RLS) | **No está** — el build falla si aparece |
| Botón ☁️ | Visible | Oculto |
| Aviso del Cuaderno | Habla de la sincronización | Dice que todo se guarda en ese navegador |
| Peticiones a internet | Supabase + tipografías | **Solo tipografías** (comprobado) |

**Por qué sin nube, y no «con cuentas para ellos»:** sin conexión no hay cuentas que administrar,
nadie puede tocar tus datos y tu clave no viaja dentro de un archivo que ellos pueden guardar.
La protección sale del diseño, no de la vigilancia. Sus cuadernos quedan en su navegador, con su
propio ⬇ Exportar.

---

## Lo que tienes que hacer tú · una vez

### 1 · Repositorio privado solo para la copia

1. En GitHub, botón **+** (arriba a la derecha) → **New repository**.
2. Nombre: `engine-compartido`. Marca **Private**. **Create repository**.
3. Sube el archivo: **Add file → Upload files**, arrastra `compartir-engine/index.html`,
   y pulsa **Commit changes**.

Ese repositorio solo tiene la copia. Tu Cerebro no entra ahí.

### 2 · Publicarlo en Cloudflare Pages (gratis)

1. Crea cuenta en [dash.cloudflare.com](https://dash.cloudflare.com) (gratis, con tu correo).
2. Menú izquierdo: **Workers & Pages** → **Create** → pestaña **Pages** →
   **Connect to Git** → autoriza GitHub → elige `engine-compartido`.
3. Framework preset: **None**. Build command: vacío. Output directory: `/`.
4. **Save and Deploy**. Te queda una dirección tipo `engine-compartido.pages.dev`.

### 3 · Ponerle la puerta (Cloudflare Access)

Esto es lo que impide que entre nadie que tú no hayas invitado: sin invitación, **no se descarga
ni un byte** de la página.

1. En el proyecto de Pages: **Settings** → **General** → **Enable access policy**.
   (Eso protege por ahora solo las vistas previas.)
2. Pulsa **Manage** en la política que se creó → en **Public hostname**, en el campo
   **Subdomain**, **borra el asterisco `*`** y **Save**.
   *Sin este paso la dirección principal queda sin proteger: es la trampa documentada por
   Cloudflare.*
3. Vuelve al proyecto → **Settings → General → Enable access policy** otra vez, para que las
   vistas previas vuelvan a quedar cubiertas. Deben quedar **dos** políticas.
4. En la política, **Policies → Add a policy**: Action **Allow**, Include → **Emails** → escribe
   los correos de las personas invitadas, uno por línea. **Save**.

**Comprobación obligatoria** (si no, no sabes si funciona): abre la dirección en una **ventana de
incógnito**. Tiene que pedirte correo y enviarte un código. Si entra directo, el paso 2 no quedó bien.

### 4 · Invitar y expulsar, cada vez

- **Dar acceso:** Zero Trust → **Access → Applications** → tu aplicación → **Policies** → añadir
  el correo → **Save**. La persona entra con un código que le llega a ese correo.
- **Quitar acceso:** borra su correo de la lista → **Save**. Deja de poder entrar.
- **Expulsar a alguien que ya está dentro ahora mismo:** además de borrarlo, Zero Trust →
  **My Team → Users** → la persona → **Revoke sessions**. Así no espera a que caduque la suya.
- **Cuánto dura una sesión:** en la aplicación, **Session Duration** (por defecto 24 h). Si la
  bajas a 8 h, al expulsar a alguien el corte es más rápido.

Gratis hasta 50 personas. Cada persona que entra ocupa una plaza.

---

## Lo que esto NO resuelve (dicho claro)

- **Copiar lo que ven.** Quien puede usar la página puede guardarla. Ninguna web del mundo lo
  impide. Lo que controlas es **a quién le das esa posibilidad** — y eso sí queda cerrado.
- **El repositorio público actual.** Mientras `da-2026` siga público, el Engine original sigue
  descargable por cualquiera. Decisión aparte (ver abajo).

---

## Pendiente, con fecha

- [ ] **Reanudar Supabase** (8-oct: proyecto caído, 522/504). Sin eso no hay login en tu Cerebro.
- [ ] **Verificar RLS** en cuanto vuelva: comprobar que con la clave pública NO se leen datos de
      otro usuario. La clave lleva meses en un repositorio público; si el aislamiento no está
      bien puesto, es el agujero grande.
- [ ] **Cerrar el registro abierto** en Supabase (Authentication → Providers → Email →
      *Allow new users to sign up* en OFF). Hoy cualquiera puede crearse cuenta en tu proyecto.
- [ ] **Decidir qué pasa con `da-2026`**: hacerlo privado obliga a mover el hospedaje (GitHub
      Pages con repositorio privado es de pago; Cloudflare Pages es gratis). Mismo camino que el
      de arriba, aplicado a todo el Cerebro.
