// Конвертирует PNG-исходники из Figma в WebP + JPG/PNG по настройкам images.config.js.
// Запуск: npm run images (пропускает файлы, которые уже свежее исходника).
import { readdir, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import config from '../images.config.js';

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.png$/i.test(entry.name)) yield full;
  }
}

async function isFresh(src, out) {
  try {
    return (await stat(out)).mtimeMs >= (await stat(src)).mtimeMs;
  } catch {
    return false;
  }
}

async function hasTransparency(file) {
  const img = sharp(file);
  const { hasAlpha } = await img.metadata();
  if (!hasAlpha) return false;
  const { channels } = await img.stats();
  return channels[3].min < 255;
}

let done = 0;
let skipped = 0;
for await (const src of walk(config.srcDir)) {
  const rel = path.relative(config.srcDir, src);
  const base = path.join(config.outDir, rel).replace(/\.png$/i, '');
  await mkdir(path.dirname(base), { recursive: true });

  const transparent = await hasTransparency(src);
  const fallbackExt = transparent ? 'png' : 'jpg';
  const outputs = [`${base}.webp`, `${base}.${fallbackExt}`];
  if ((await Promise.all(outputs.map((o) => isFresh(src, o)))).every(Boolean)) {
    skipped++;
    continue;
  }

  const pipeline = () => sharp(src).resize({ width: config.maxWidth, withoutEnlargement: true });
  if (transparent) {
    await pipeline().webp(config.transparent.webp).toFile(`${base}.webp`);
    await pipeline().png(config.transparent.png).toFile(`${base}.png`);
  } else {
    await pipeline().flatten({ background: '#ffffff' }).webp(config.photo.webp).toFile(`${base}.webp`);
    await pipeline().flatten({ background: '#ffffff' }).jpeg(config.photo.jpeg).toFile(`${base}.jpg`);
  }
  done++;
  console.log(`${transparent ? 'alpha' : 'photo'}  ${rel}`);
}
console.log(`Готово: ${done}, пропущено (уже свежие): ${skipped}`);
