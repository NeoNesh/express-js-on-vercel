import fs from 'node:fs';
import crypto from 'node:crypto';
import express from 'express';
import AdmZip from 'adm-zip';

const expectedLength = 158508;
const expectedSha256 = '7839031a2519c16484ee02380ffef076d31f5425c161e4c898ca3426dd7a9598';
const encoded = [
  fs.readFileSync(new URL('./payload/00.txt', import.meta.url), 'utf8').trim(),
  fs.readFileSync(new URL('./payload/01.txt', import.meta.url), 'utf8').trim(),
  fs.readFileSync(new URL('./bundle/02.txt', import.meta.url), 'utf8').trim(),
  fs.readFileSync(new URL('./payload/03.txt', import.meta.url), 'utf8').trim(),
  fs.readFileSync(new URL('./payload/04.txt', import.meta.url), 'utf8').trim(),
  fs.readFileSync(new URL('./payload/05.txt', import.meta.url), 'utf8').trim(),
  fs.readFileSync(new URL('./bundle/90-110.txt', import.meta.url), 'utf8').trim(),
  fs.readFileSync(new URL('./bundle/110-130.txt', import.meta.url), 'utf8').trim(),
  fs.readFileSync(new URL('./bundle/130-150.txt', import.meta.url), 'utf8').trim(),
  fs.readFileSync(new URL('./bundle/150-end.txt', import.meta.url), 'utf8').trim()
].join('');
if (encoded.length !== expectedLength) throw new Error(`EduQuest bundle length mismatch: ${encoded.length}`);

const archive = Buffer.from(encoded, 'base64');
const digest = crypto.createHash('sha256').update(archive).digest('hex');
if (digest !== expectedSha256) throw new Error(`EduQuest bundle checksum mismatch: ${digest}`);

const zip = new AdmZip(archive);
const files = new Map();
for (const entry of zip.getEntries()) {
  if (!entry.isDirectory) files.set(entry.entryName.replace(/^\/+/, ''), entry.getData());
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function extname(name) {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i).toLowerCase() : '';
}

function resolvePath(urlPath) {
  let p;
  try { p = decodeURIComponent(urlPath); } catch { return null; }
  p = p.split('?')[0].replace(/^\/+/, '');
  if (!p) return 'index.html';
  if (p.includes('..') || p.includes('\\')) return null;
  if (files.has(p)) return p;
  if (!p.includes('.') && files.has(`${p}.html`)) return `${p}.html`;
  return null;
}

const app = express();
app.disable('x-powered-by');

app.get('/healthz', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, app: 'EduQuest', version: '7.0.0', files: files.size, sha256: digest });
});

app.use((req, res) => {
  const key = resolvePath(req.path);
  if (!key) {
    res.status(404).type('text/plain').send('Not found');
    return;
  }
  const body = files.get(key);
  const type = types[extname(key)] || 'application/octet-stream';
  res.set('Content-Type', type);
  if (key.startsWith('assets/')) res.set('Cache-Control', 'public, max-age=31536000, immutable');
  else res.set('Cache-Control', 'no-cache');
  res.send(body);
});

export default app;
