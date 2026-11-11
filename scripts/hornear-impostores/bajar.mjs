// Baja assets de Poly Haven (CC0). Uso: node bajar.mjs <destino_ph> <id:tipo:res> ...   tipo = tex | mod | cielo
// Escribe en <destino_ph>/{tex,mod,cielo}/... y devuelve en stdout el JSON de créditos de cada asset.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
const [dest, ...pedidos] = process.argv.slice(2);
const H = { headers: { 'User-Agent': 'da2026-juegos' } };
const api = async (p) => (await fetch('https://api.polyhaven.com/' + p, H)).json();
async function bajar(url, ruta) {
  const abs = join(dest, ruta);
  let buf;
  if (existsSync(abs)) buf = readFileSync(abs);
  else { const r = await fetch(url, H); if (!r.ok) throw new Error(url + ' ' + r.status); buf = Buffer.from(await r.arrayBuffer()); mkdirSync(dirname(abs), { recursive: true }); writeFileSync(abs, buf); }
  return { ruta,bytes: buf.length, sha256: createHash('sha256').update(buf).digest('hex') };
}
const salida = [];
for (const p of pedidos) {
  const [id, tipo, res] = p.split(':');
  const [f, info] = await Promise.all([api('files/' + id), api('info/' + id)]);
  const archivos = [];
  if (tipo === 'tex') {
    for (const [k, nom] of [['Diffuse', 'diff'], ['nor_gl', 'nor'], ['arm', 'arm']]) { const u = f[k][res].jpg; archivos.push(await bajar(u.url, `tex/${id}/${nom}_${res}.jpg`)); }
  } else if (tipo === 'mod') {
    const g = f.gltf[res].gltf;
    archivos.push(await bajar(g.url, `mod/${id}/${id}.gltf`));
    for (const [rel, v] of Object.entries(g.include)) archivos.push(await bajar(v.url, `mod/${id}/${rel}`));
  } else if (tipo === 'cielo') {
    archivos.push(await bajar(f.hdri[res].hdr.url, `cielo/${id}_${res}.hdr`));
  }
  salida.push({ id, nombre: info.name, tipo, autores: Object.keys(info.authors || {}), licencia: 'CC0 1.0', fuente: `https://polyhaven.com/a/${id}`, archivos });
  console.error('ok', id, archivos.reduce((a, b) => a + b.bytes, 0));
}
console.log(JSON.stringify(salida, null, 1));
