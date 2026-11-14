import { build } from 'esbuild';
import { copyFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const source = path.join(root, 'node_modules', '@spotify', 'basic-pitch', 'model');
const destination = path.join(root, 'public', 'models', 'basic-pitch');
await mkdir(destination, { recursive: true });

for (const name of ['model.json', 'group1-shard1of1.bin']) {
  const input = path.join(source, name);
  const size = (await stat(input)).size;
  if (size < 1000) throw new Error('Basic Pitch model is incomplete: ' + name);
  await copyFile(input, path.join(destination, name));
}

await build({
  entryPoints: [path.join(root, 'src', 'basic-pitch-client.js')],
  outfile: path.join(root, 'public', 'basic-pitch.bundle.js'),
  bundle: true,
  format: 'iife',
  globalName: 'ChordroomBasicPitch',
  platform: 'browser',
  target: ['es2020'],
  minify: true,
  legalComments: 'eof',
  logLevel: 'info',
});

console.log('Basic Pitch assets generated for Piano Studio.');
