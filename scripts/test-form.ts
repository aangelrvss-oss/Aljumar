/**
 * Prueba de integración del receptor de formularios (public/api/contacto.php)
 * con el servidor embebido de PHP, en modo prueba (no envía correos: el
 * mensaje se escribe en el registro). Requiere `php` y `npm run build`.
 *
 *   node scripts/test-form.ts
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { connect } from 'node:net';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
if (!existsSync(join(dist, 'api/contacto.php'))) {
  console.error('✗ Falta dist/api/contacto.php: ejecuta `npm run build`.');
  process.exit(1);
}

async function startPhp(port: number, env: Record<string, string>): Promise<ChildProcess> {
  const proc = spawn('php', ['-S', `127.0.0.1:${port}`, '-t', dist], { env: { ...process.env, ...env }, stdio: 'ignore' });
  // Espera a que el puerto acepte conexiones (sin hacer peticiones HTTP a medias).
  for (let i = 0; i < 50; i++) {
    const open = await new Promise<boolean>((resolve) => {
      const s = connect(port, '127.0.0.1');
      s.once('connect', () => (s.destroy(), resolve(true)));
      s.once('error', () => resolve(false));
    });
    if (open) return proc;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('No arranca php -S');
}

let failures = 0;
function check(name: string, cond: boolean, detail = '') {
  console.log(`${cond ? '✓' : '✗'} ${name}${cond ? '' : ` — ${detail}`}`);
  if (!cond) failures++;
}

const valid = {
  formulario: 'general',
  nombre: 'Ana Prueba',
  email: 'ana@example.com',
  telefono: '600 11 22 33',
  motivo: 'comprar',
  mensaje: 'Busco piso de 3 dormitorios en Moratalaz.',
  privacidad: '1',
  web: '',
  ts: String(Date.now() - 10_000),
};

interface Res {
  status: number;
  location: string | null;
  body: string;
  json<T = Record<string, unknown>>(): T;
}

/** Hace la petición y lee SIEMPRE el cuerpo completo (evita conexiones a medio leer). */
async function request(url: string, init?: RequestInit): Promise<Res> {
  const r = await fetch(url, { ...init, redirect: 'manual', headers: { Connection: 'close', ...(init?.headers as Record<string, string>) } });
  const body = await r.text();
  return { status: r.status, location: r.headers.get('location'), body, json: <T,>() => JSON.parse(body) as T };
}

function post(port: number, data: Record<string, string>, headers: Record<string, string> = { Accept: 'application/json' }) {
  return request(`http://127.0.0.1:${port}/api/contacto.php`, { method: 'POST', body: new URLSearchParams(data), headers });
}

const tmp = mkdtempSync(join(tmpdir(), 'alj-form-'));
const log = join(tmp, 'aljumar-formularios.log');
const PORT = 8091;
const php = await startPhp(PORT, { ALJ_FORM_DRY_RUN: '1', TMPDIR: tmp, ALJ_ALLOWED_HOSTS: 'aljumar.es' });
const lastMail = () => readLog().filter((e) => e.r === 'prueba').at(-1);
const readLog = () => (existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n').map((l) => JSON.parse(l)) : []);

try {
  let res = await request(`http://127.0.0.1:${PORT}/api/contacto.php`);
  check('GET responde 405', res.status === 405, String(res.status));

  res = await post(PORT, valid);
  let body = res.json<{ ok: boolean; fields?: Record<string, string> }>();
  check('Envío válido (JSON) → 200 ok', res.status === 200 && body.ok, JSON.stringify(body));
  const sent = lastMail();
  check('El correo de prueba contiene los datos y el motivo', sent?.r === 'prueba' && sent.cuerpo.includes('Ana Prueba') && sent.cuerpo.includes('Busca vivienda para comprar'), JSON.stringify(sent));

  res = await post(PORT, { ...valid, email: 'no-es-un-correo', privacidad: '' });
  body = res.json<typeof body>();
  check('Datos no válidos → 422 con errores por campo', res.status === 422 && !!body.fields?.email && !!body.fields?.privacidad, JSON.stringify(body));

  res = await post(PORT, { ...valid, formulario: 'vender', zona: '', telefono: '' });
  body = res.json<typeof body>();
  check('Captación exige zona y teléfono', res.status === 422 && !!body.fields?.zona && !!body.fields?.telefono, JSON.stringify(body));

  const before = readLog().filter((e) => e.r === 'prueba').length;
  res = await post(PORT, { ...valid, web: 'http://spam.example' });
  check('Trampa antispam: responde ok pero no envía', res.status === 200 && readLog().filter((e) => e.r === 'prueba').length === before && readLog().at(-1)?.r === 'trampa');

  res = await post(PORT, { ...valid, ts: String(Date.now()) });
  check('Envío demasiado rápido → 429', res.status === 429, String(res.status));

  res = await post(PORT, valid, { Accept: 'application/json', Origin: 'https://sitio-ajeno.example' });
  check('Origen ajeno → 403', res.status === 403, String(res.status));

  res = await post(PORT, { ...valid, nombre: 'Eva\r\nBcc: victima@example.com', email: 'eva@example.com' });
  const inj = lastMail();
  check('Sin inyección de cabeceras en el nombre', res.status === 200 && inj?.cuerpo.includes('Nombre: Eva Bcc: victima@example.com') && !/\nBcc:/.test(inj.cuerpo), JSON.stringify(inj?.cuerpo?.slice(0, 120)));

  res = await post(PORT, { ...valid, formulario: 'inmueble', inmueble_ref: '29670372', inmueble_titulo: 'Ático en venta en Madrid', inmueble_url: 'https://aljumar.es/inmueble/x/', interes: 'visita' }, {});
  check('Sin JavaScript → 303 a /contacto/enviado/', res.status === 303 && res.location === '/contacto/enviado/', `${res.status} ${res.location}`);
  const prop = lastMail();
  check('La solicitud de un inmueble lleva su referencia en el asunto', prop?.asunto?.includes('ref. 29670372') && prop.asunto.includes('Concertar una visita'), JSON.stringify(prop?.asunto));

  // Límite: 5 envíos por IP y hora (ya se han enviado 3 válidos).
  const codes: number[] = [];
  for (let i = 0; i < 3; i++) codes.push((await post(PORT, valid)).status);
  check('Límite por IP → 429 al superar 5 envíos/hora', codes.at(-1) === 429, codes.join(','));

  check('El registro no guarda la IP en claro', !readFileSync(log, 'utf8').includes('127.0.0.1'));
} finally {
  php.kill();
}

// Sin configuración (y sin modo prueba) no se envía a direcciones supuestas.
const php2 = await startPhp(PORT + 1, { TMPDIR: mkdtempSync(join(tmpdir(), 'alj-form2-')) });
try {
  const res = await post(PORT + 1, valid);
  check('Sin config.php → 503 con vías de contacto alternativas', res.status === 503 && res.json<{ error: string }>().error.includes('91 333 90 83'));
} finally {
  php2.kill();
}

if (failures) {
  console.error(`\n✗ ${failures} comprobaciones del formulario fallidas`);
  process.exit(1);
}
console.log('\n✓ Formulario: todas las comprobaciones superadas');
