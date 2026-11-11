// Servidor local para hornear impostores: sirve el frontend del worktree, las descargas y esta carpeta, y guarda lo que le mandan.
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
const [WT, S] = [process.argv[2], process.argv[3]];
const RAIZ = { '/f/': join(WT, 'frontend'), '/dl/': join(S, 'dl'), '/h/': join(S, 'herr') };
const TIPO = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.hdr': 'application/octet-stream', '.css': 'text/css', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
createServer(async (req, res) => {
  try {
    const url = decodeURIComponent(req.url.split('?')[0]);
    if (req.method === 'POST' && url.startsWith('/guardar/')) {
      const nombre = url.slice(9).replace(/[^\w.-]/g, '_'), partes = [];
      for await (const c of req) partes.push(c);
      await mkdir(join(S, 'out'), { recursive: true });
      await writeFile(join(S, 'out', nombre), Buffer.concat(partes));
      res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('ok ' + nombre);
    }
    const pre = Object.keys(RAIZ).find((p) => url.startsWith(p));
    if (!pre) { res.writeHead(404); return res.end(); }
    const ruta = normalize(join(RAIZ[pre], url.slice(pre.length)));
    if (!ruta.startsWith(RAIZ[pre])) { res.writeHead(403); return res.end(); }
    const datos = await readFile(ruta.endsWith('\\') || ruta.endsWith('/') ? join(ruta, 'index.html') : ruta);
    res.writeHead(200, { 'Content-Type': TIPO[extname(ruta)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(datos);
  } catch (e) { res.writeHead(404); res.end(String(e.message)); }
}).listen(3472, () => console.log('hornear listo en http://localhost:3472/h/hornear.html'));
