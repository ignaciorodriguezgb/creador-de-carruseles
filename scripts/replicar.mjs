#!/usr/bin/env node
// Replica los slides de un carrusel de inspiracion con la marca del usuario.
//
// Uso:
//   node scripts/replicar.mjs <carpeta-inspiracion> [--slides 1,3] [--model <modelo>] [--res 1K|2K|4K]
//
// La carpeta debe tener original/slide_NN.jpg y guion.json (textos por slide).
// La API key se lee de ~/.config/kie/.env (KIE_API_KEY=...).

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import { join, basename, extname, resolve } from 'node:path';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(import.meta.dirname, '..');
const BASE = 'https://api.kie.ai/api';
const UPLOAD_URL = 'https://kieai.redpandaai.co/api/file-stream-upload';
const CACHE_FILE = join(ROOT, '.cache', 'subidas.json');
const CACHE_TTL_MS = 2.5 * 24 * 3600 * 1000; // KIE borra las subidas a los 3 dias
const IMG = /\.(jpe?g|png|webp)$/i;

function loadKey() {
  if (process.env.KIE_API_KEY) return process.env.KIE_API_KEY.trim();
  try {
    const m = readFileSync(join(homedir(), '.config', 'kie', '.env'), 'utf8').match(/^KIE_API_KEY=(.*)$/m);
    if (m && m[1].trim()) return m[1].trim();
  } catch {}
  console.error('Falta la API key: pegala en ~/.config/kie/.env (KIE_API_KEY=...)');
  process.exit(1);
}

const KEY = loadKey();
const auth = { Authorization: `Bearer ${KEY}` };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(path, options = {}) {
  const res = await fetch(path.startsWith('http') ? path : BASE + path, { ...options, headers: { ...auth, ...options.headers } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || (body.code && body.code !== 200)) {
    throw new Error(`KIE ${res.status}: ${body.msg || JSON.stringify(body)}`);
  }
  return body.data;
}

const credits = () => api('/v1/chat/credit');

function loadCache() {
  try { return JSON.parse(readFileSync(CACHE_FILE, 'utf8')); } catch { return {}; }
}

// Sube un archivo local a KIE y devuelve su URL publica (reutiliza subidas recientes).
async function upload(file, cache) {
  const st = statSync(file);
  const key = `${file}:${st.size}:${st.mtimeMs}`;
  if (cache[key] && Date.now() - cache[key].at < CACHE_TTL_MS) return cache[key].url;
  const form = new FormData();
  form.append('file', new Blob([readFileSync(file)]), basename(file));
  form.append('uploadPath', 'carrusel');
  const data = await api(UPLOAD_URL, { method: 'POST', body: form });
  cache[key] = { url: data.downloadUrl, at: Date.now() };
  mkdirSync(join(ROOT, '.cache'), { recursive: true });
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  return data.downloadUrl;
}

function buildPrompt({ marca, guion, slide, nCaras, hayAvatarRef }) {
  const pares = [...slide.textos, ...guion.footer]
    .map((t) => `   - "${t.original}" → "${t.nuevo.replaceAll('{{instagram}}', marca.instagram)}"`).join('\n');
  const mantener = (slide.mantener || []).map((t) => `"${t}"`).join(', ');
  const caras = nCaras === 1 ? 'La imagen 2 es' : `Las imágenes 2 a ${nCaras + 1} son`;
  const avatarRef = hayAvatarRef
    ? `\nLa última imagen es otro slide ya adaptado de este mismo carrusel. Úsala SOLO para copiar los rasgos del avatar (cara, pelo, ropa, estilo de dibujo). La pose, los objetos, la escena y todo lo demás salen de la imagen 1, no de esta.`
    : '';

  return `Recrea el slide de la imagen 1 con máxima fidelidad visual. ${caras} la foto de referencia del usuario.${avatarRef}

IMPORTANTE:
- Es un slide de un carrusel de Instagram y debe generarse como una imagen INDEPENDIENTE.
- No cambies la composición. No rediseñes. No agregues ni elimines elementos.
- Mantén el mismo layout, posiciones, jerarquía, proporciones, tipografías, fondo y estilo visual del original.
- Cada bloque de texto conserva su tipografía original: lo monoespaciado sigue monoespaciado, lo manuscrito sigue manuscrito, lo condensado en negrita sigue igual.
- Formato vertical ${marca.aspect_ratio}. Alta resolución. Texto nítido y sin errores de ortografía.

TEXTO (reemplaza exactamente, respetando tildes, mayúsculas y el estilo tipográfico de cada bloque):
${pares}
${mantener ? `\nNO traduzcas ni modifiques estos textos técnicos: ${mantener}.` : ''}
No debe quedar ningún otro texto en inglés ni ningún texto del creador original (${guion.autor_original}).

MARCA:
- El color de acento es ${marca.color_acento}${guion.acento_original === marca.color_acento ? ' (igual que el original, mantenlo)' : `: reemplaza el ${guion.acento_original} del original por ${marca.color_acento}`}.
- Reemplaza el personaje que representa al autor por un avatar del usuario en el mismo estilo del original (${guion.estilo_avatar}), en la misma pose, tamaño y posición.
- El avatar debe ser reconocible como el usuario de la foto: ${marca.rasgos}. Ropa: ${marca.ropa}.
- No reemplaces otros personajes ni elementos (robots, mascotas, objetos): se mantienen igual.

OBJETIVO: que quien vea el original y esta versión piense "es el mismo slide, pero en ${marca.idioma} y adaptado a ${marca.instagram}".`;
}

async function generate(model, input) {
  const { taskId } = await api('/v1/jobs/createTask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, input }),
  });
  const started = Date.now();
  while (true) {
    await sleep(5000);
    const data = await api(`/v1/jobs/recordInfo?taskId=${taskId}`);
    if (data.state === 'success') {
      const result = typeof data.resultJson === 'string' ? JSON.parse(data.resultJson) : data.resultJson;
      return result?.resultUrls?.[0];
    }
    if (data.state === 'fail') throw new Error(`Fallo: ${data.failMsg || data.failCode || 'sin detalle'}`);
    if (Date.now() - started > 900_000) throw new Error(`Timeout; consulta luego la tarea ${taskId}`);
  }
}

function parseArgs(argv) {
  const args = { slides: null, model: 'gpt-image-2-image-to-image', res: '2K' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--slides') args.slides = argv[++i].split(',').map(Number);
    else if (argv[i] === '--model') args.model = argv[++i];
    else if (argv[i] === '--res') args.res = argv[++i];
    else args.dir = argv[i];
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
if (!args.dir) {
  console.log('Uso: node scripts/replicar.mjs <carpeta-inspiracion> [--slides 1,3] [--model <modelo>] [--res 1K|2K|4K]');
  process.exit(1);
}

try {
  const dir = resolve(args.dir);
  const marcaFile = join(ROOT, 'marca', 'marca.json');
  let marca;
  try { marca = JSON.parse(readFileSync(marcaFile, 'utf8')); }
  catch { throw new Error('Falta marca/marca.json: copia marca/marca.ejemplo.json y completalo con tu marca'); }
  const guion = JSON.parse(readFileSync(join(dir, 'guion.json'), 'utf8'));
  const caraDir = join(ROOT, 'marca', 'fotos', 'cara');
  const caras = readdirSync(caraDir).filter((f) => IMG.test(f)).sort().map((f) => join(caraDir, f));
  if (!caras.length) throw new Error('No hay fotos en marca/fotos/cara/');

  const outDir = join(ROOT, 'salida', basename(dir));
  const hdDir = join(outDir, 'hd');
  mkdirSync(hdDir, { recursive: true });

  const cache = loadCache();
  const caraUrls = [];
  for (const c of caras) caraUrls.push(await upload(c, cache));

  const slides = guion.slides.filter((s) => !args.slides || args.slides.includes(s.n));
  const antes = await credits();
  console.log(`Creditos: ${antes} | modelo: ${args.model} | ${slides.length} slide(s)`);

  // El primer slide ya generado sirve de referencia para que el avatar sea el mismo en todos.
  const avatarRefFile = readdirSync(hdDir).filter((f) => IMG.test(f)).sort()[0];

  const results = await Promise.allSettled(slides.map(async (slide) => {
    const id = `slide_${String(slide.n).padStart(2, '0')}`;
    const original = readdirSync(join(dir, 'original')).find((f) => f.startsWith(id));
    if (!original) throw new Error(`${id}: no existe en original/`);
    const input_urls = [await upload(join(dir, 'original', original), cache), ...caraUrls];
    const usaRef = avatarRefFile && !avatarRefFile.startsWith(id);
    if (usaRef) input_urls.push(await upload(join(hdDir, avatarRefFile), cache));

    const prompt = buildPrompt({ marca, guion, slide, nCaras: caraUrls.length, hayAvatarRef: usaRef });
    const url = await generate(args.model, {
      prompt, input_urls, aspect_ratio: marca.aspect_ratio, resolution: args.res,
    });
    const hd = join(hdDir, id + (extname(new URL(url).pathname) || '.png'));
    writeFileSync(hd, Buffer.from(await (await fetch(url)).arrayBuffer()));
    const final = join(outDir, `${id}.png`);
    try {
      execFileSync('sips', ['-s', 'format', 'png', '-z', String(marca.alto), String(marca.ancho), hd, '--out', final], { stdio: 'ignore' });
    } catch {
      copyFileSync(hd, final); // sips solo existe en macOS: sin el, queda el tamaño que devuelve el modelo
    }
    console.log(`Listo: ${final}`);
  }));

  for (const r of results) if (r.status === 'rejected') console.error(r.reason.message);
  const despues = await credits();
  console.log(`Creditos: ${despues} (gastados: ${antes - despues})`);
  if (results.some((r) => r.status === 'rejected')) process.exit(1);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
