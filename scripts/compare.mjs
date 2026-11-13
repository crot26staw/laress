// Сверка вёрстки с эталоном из Figma.
// npm run compare -- --ref .figma/screenshots/home-01-hero_966-41554.png --name hero [--url http://localhost:5173/] [--y 0] [--selector .hero]
//   [--ref-y 1900 --ref-h 860]  — вырезать полосу из полного эталона страницы
//   [--ref-x 0 --ref-w 440]     — сравнивать только полосу по горизонтали (например, панель поверх затемнённой страницы)
//   [--open .button]            — кликнуть перед снимком (модалки, панели); снимается окно высотой --viewport-h (по умолчанию = высоте полосы)
// Печатает % отличий и лучший вертикальный сдвиг эталона (±4px). Норма: ≤ ~2% при сдвиге 0–2px
// (остаток — сглаживание текста). Больше — смотреть <name>-diff.png и <name>-side.png.
// Снимает страницу при ширине эталона, вырезает область той же высоты и кладёт в .compare/:
//   <name>-site.png, <name>-side.png (бок о бок), <name>-overlay.png (макет 50% поверх), <name>-diff.png (отличия красным).
import { mkdir } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';
import sharp from 'sharp';

const { values: args } = parseArgs({
  options: {
    ref: { type: 'string' },
    name: { type: 'string' },
    url: { type: 'string', default: 'http://localhost:5173/' },
    y: { type: 'string', default: '0' }, // отступ области сверху страницы, px
    selector: { type: 'string' }, // или взять Y верхнего края элемента
    threshold: { type: 'string', default: '40' }, // порог отличия канала 0–255
    'ref-y': { type: 'string', default: '0' }, // вырезать из эталона полосу с этого Y (для полного скриншота страницы)
    'ref-h': { type: 'string' }, // высота полосы эталона (по умолчанию — до конца)
    'ref-x': { type: 'string', default: '0' },
    'ref-w': { type: 'string' },
    open: { type: 'string' },
    'viewport-h': { type: 'string' },
    bg: { type: 'string', default: '#fafaf9' }, // подложка под прозрачные места эталона (фон страницы)
  },
});
if (!args.ref || !args.name) {
  console.error('Нужны --ref и --name');
  process.exit(1);
}

const OUT = '.compare';
await mkdir(OUT, { recursive: true });

// Эталон: подложка цвета страницы (секции в Figma часто прозрачные) + вырезка полосы
const meta = await sharp(args.ref).metadata();
const refY = Number(args['ref-y']);
const fullWidth = meta.width;
const left = Number(args['ref-x']);
const width = args['ref-w'] ? Number(args['ref-w']) : fullWidth - left;
const height = args['ref-h'] ? Number(args['ref-h']) : meta.height - refY;
const refPng = await sharp(args.ref)
  .extract({ left, top: refY, width, height })
  .flatten({ background: args.bg })
  .png()
  .toBuffer();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: fullWidth, height: args.open ? Number(args['viewport-h'] ?? height) : 900 }, deviceScaleFactor: 1 });
await page.goto(args.url, { waitUntil: 'networkidle' });
// Ленивые картинки: прокрутить страницу, чтобы всё загрузилось
await page.evaluate(async () => {
  document.querySelectorAll('img[loading="lazy"]').forEach((img) => (img.loading = 'eager'));
  await Promise.all([...document.images].map((img) => (img.complete ? null : new Promise((r) => (img.onload = img.onerror = r)))));
  await document.fonts.ready;
});

let top = Number(args.y);
if (args.selector) {
  top = await page.$eval(args.selector, (el) => el.getBoundingClientRect().top + window.scrollY);
}
const sitePath = `${OUT}/${args.name}-site.png`;
if (args.open) {
  await page.click(args.open);
  await page.waitForTimeout(500); // анимация появления
  await page.screenshot({ path: sitePath, clip: { x: left, y: top, width, height } });
} else {
  await page.screenshot({ path: sitePath, fullPage: true, clip: { x: left, y: top, width, height } });
}
await browser.close();

const refRaw = await sharp(refPng).removeAlpha().raw().toBuffer();
const siteRaw = await sharp(sitePath).resize(width, height, { fit: 'contain', position: 'top' }).removeAlpha().raw().toBuffer();

// Карта отличий
const threshold = Number(args.threshold);
const diff = Buffer.alloc(width * height * 3);
let changed = 0;
for (let i = 0; i < width * height; i++) {
  const o = i * 3;
  const d = Math.max(
    Math.abs(refRaw[o] - siteRaw[o]),
    Math.abs(refRaw[o + 1] - siteRaw[o + 1]),
    Math.abs(refRaw[o + 2] - siteRaw[o + 2]),
  );
  const gray = Math.round((refRaw[o] + refRaw[o + 1] + refRaw[o + 2]) / 3 / 3 + 170);
  if (d > threshold) {
    changed++;
    diff[o] = 255;
    diff[o + 1] = 0;
    diff[o + 2] = 0;
  } else {
    diff[o] = diff[o + 1] = diff[o + 2] = gray;
  }
}
const raw = { raw: { width, height, channels: 3 } };
await sharp(diff, raw).png().toFile(`${OUT}/${args.name}-diff.png`);

// Наложение: сайт + макет с прозрачностью 50%
const refHalf = await sharp(refPng).ensureAlpha(0.5).png().toBuffer();
await sharp(siteRaw, raw).composite([{ input: refHalf }]).png().toFile(`${OUT}/${args.name}-overlay.png`);

// Бок о бок: макет | сайт
await sharp({ create: { width: width * 2 + 20, height, channels: 3, background: '#ff00ff' } })
  .composite([
    { input: refPng, left: 0, top: 0 },
    { input: await sharp(siteRaw, raw).png().toBuffer(), left: width + 20, top: 0 },
  ])
  .png()
  .toFile(`${OUT}/${args.name}-side.png`);

const pct = ((changed / (width * height)) * 100).toFixed(2);
console.log(`${args.name}: ${width}×${height}, отличается ${changed} px (${pct}%) при пороге ${threshold}`);

// Лучший вертикальный сдвиг эталона (±4px): отметки секций в полном скриншоте Figma округлены,
// поэтому смотреть надо на % при лучшем сдвиге, а сам сдвиг до 1–2px — норма.
const PAD = 4;
const extTop = Math.max(0, refY - PAD);
const extBottom = Math.min(meta.height, refY + height + PAD);
const ext = await sharp(args.ref)
  .extract({ left, top: extTop, width, height: extBottom - extTop })
  .flatten({ background: args.bg })
  .removeAlpha()
  .raw()
  .toBuffer();
const results = [];
for (let dy = -PAD; dy <= PAD; dy++) {
  let diffCount = 0;
  let total = 0;
  for (let y = PAD + 1; y < height - PAD - 1; y++) {
    const ry = refY + y + dy - extTop;
    if (ry < 0 || ry >= extBottom - extTop) continue;
    for (let x = 0; x < width; x++) {
      const s = (y * width + x) * 3;
      const r = (ry * width + x) * 3;
      const d = Math.max(Math.abs(ext[r] - siteRaw[s]), Math.abs(ext[r + 1] - siteRaw[s + 1]), Math.abs(ext[r + 2] - siteRaw[s + 2]));
      if (d > threshold) diffCount++;
      total++;
    }
  }
  if (total) results.push({ dy, pct: (diffCount / total) * 100 });
}
results.sort((a, b) => a.pct - b.pct);
const best = results[0];
console.log(`  лучший сдвиг эталона: ${best.dy > 0 ? '+' : ''}${best.dy}px → ${best.pct.toFixed(2)}%`);
console.log(`Файлы: ${OUT}/${args.name}-{site,side,overlay,diff}.png`);
