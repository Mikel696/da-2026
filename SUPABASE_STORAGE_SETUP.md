# Setup · Supabase Storage para attachments cross-device

Para que los archivos adjuntos sincronicen entre tus PCs, necesitás crear **una sola vez** el bucket en Supabase. Después de esto, cualquier archivo que adjuntes en Cases / Errors / Learnings / KB / Cuadernos viaja a la nube y se descarga desde cualquier device.

## Paso 1 · Crear el bucket

1. Dashboard Supabase → tu project (`mbuhlxypuvlxxylryjzi`)
2. Menú lateral → **Storage**
3. Botón **New bucket**
4. Configurar:
   - **Name:** `attachments`
   - **Public bucket:** **OFF** (privado · RLS controla acceso)
   - **File size limit:** 52428800 (50 MB) — opcional, lo enforza igual el cliente
5. Crear.

## Paso 2 · Configurar las políticas RLS

Esto restringe que cada usuario vea/escriba solo sus propios archivos (bajo la carpeta `<auth.uid>/`).

Dashboard Supabase → **SQL Editor** → **New query** → pegar y ejecutar:

```sql
-- Select: ver mis archivos
CREATE POLICY "user_attachments_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Insert: subir archivos a mi carpeta
CREATE POLICY "user_attachments_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Update: re-subir (upsert)
CREATE POLICY "user_attachments_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Delete: eliminar mis archivos
CREATE POLICY "user_attachments_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## Paso 3 · Verificar

1. En tu PC de trabajo:
   - Abrí 14-WORK → cualquier tab con adjuntos
   - Adjuntá un archivo nuevo
   - Junto al chip debería aparecer un **badge ☁ verde** = sincronizado a la nube
2. Para los archivos que ya tenías guardados ANTES de este setup (con badge ☁↑ amarillo = local-only):
   - Click en cada ☁↑ → sube ese archivo a la nube
   - O click en el botón **☁ Sincronizar todos los archivos** del tab KB → bulk upload de TODO lo local

3. En tu PC personal:
   - Login a la misma cuenta
   - Abrí 14-WORK → vas a ver los chips de los archivos
   - Click en ⬇ → descarga desde la nube + cachea local

## Diagnóstico de errores

| Error | Causa | Solución |
|---|---|---|
| "Bucket not found" | El bucket no existe | Paso 1 |
| "new row violates row-level security policy" | Las políticas RLS faltan o están mal | Paso 2 — re-ejecutar el SQL |
| "Not authenticated" | No hay sesión activa | Iniciá sesión en este device |
| Click ⬇ y dice "Archivo no encontrado" | El blob nunca subió a la nube | Volvé al device de origen y click ☁↑ |

## Detalles técnicos

- **Path en Storage:** `<auth.uid>/<attachment_id>` (sin extensión).
- **Tamaño máx:** 50 MB por archivo (enforzado en cliente).
- **Tipos soportados:** PDF, Office (Word/Excel/PowerPoint), TXT/CSV/MD/JSON/XML/LOG, ZIP, imágenes (PNG/JPG/JPEG/GIF/WEBP/SVG/HEIC).
- **Cache local:** después de descargar un archivo desde la nube, queda cacheado en IndexedDB para próximas descargas instantáneas.
- **Eliminación:** borrar un attachment desde la UI elimina tanto el IDB local como el blob en Storage.
- **Privacidad:** Storage es privado + RLS · solo vos podés ver/descargar tus archivos.

## Paso 4 · Habilitar Realtime (para que un PC vea cambios del otro al instante)

Esto hace que cuando eliminás algo en PC trabajo, **el PC personal lo refleje al toque** sin necesidad de refrescar ni clickear "Bajar del cloud".

Dashboard Supabase → **SQL Editor** → New query → pegar y ejecutar:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_state;
```

Si dice "relation 'app_state' is already member of publication 'supabase_realtime'", está perfecto — significa que ya estaba activado.

**Cómo verificar que funciona:**
- En PC trabajo: abrí DevTools (F12) → Console.
- Después del login deberías ver: `[CLOUD] realtime ✓ suscrito a app_state · uid= xxxxx`.
- Eliminá un attachment.
- En PC personal (otra pestaña/PC con la misma cuenta), DevTools console muestra: `[CLOUD] realtime ← UPDATE work_learnings`.
- El chip desaparece automáticamente sin tener que hacer nada.

Si en la consola ves `[CLOUD] realtime status: CHANNEL_ERROR` — es que el realtime no está habilitado en la tabla. Re-ejecutá el SQL de arriba.

## Costos

Supabase Storage incluye:
- **Plan Free:** 1 GB storage + 2 GB egress/mes — suficiente para uso personal de notas/conciliaciones.
- Si pasás del free tier, el dashboard te avisa antes de cobrarte.
