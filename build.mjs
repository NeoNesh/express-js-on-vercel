import fs from 'node:fs';
import crypto from 'node:crypto';
import AdmZip from 'adm-zip';

const chunks = [
  'payload/00.txt',
  'payload/01.txt',
  'bundle/02.txt',
  'payload/03.txt',
  'payload/04.txt',
  'payload/05.txt',
  'bundle/90-110.txt',
  'bundle/110-130.txt',
  'bundle/130-150.txt',
  'bundle/150-end.txt'
];

const b64 = chunks.map((file) => fs.readFileSync(file, 'utf8').trim()).join('');
if (b64.length !== 158508) {
  throw new Error(`EduQuest bundle length mismatch: ${b64.length}`);
}

const zipBuffer = Buffer.from(b64, 'base64');
const digest = crypto.createHash('sha256').update(zipBuffer).digest('hex');
const expected = '7839031a2519c16484ee02380ffef076d31f5425c161e4c898ca3426dd7a9598';
if (digest !== expected) {
  throw new Error(`EduQuest bundle checksum mismatch: ${digest}`);
}

fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist', { recursive: true });
new AdmZip(zipBuffer).extractAllTo('dist', true);

const required = [
  'dist/index.html',
  'dist/login.html',
  'dist/play.html',
  'dist/assets/js/core.js',
  'dist/assets/js/game.js',
  'dist/assets/css/styles.css'
];
for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing build output: ${file}`);
}

console.log(`EduQuest v7 build ready: ${digest}`);
