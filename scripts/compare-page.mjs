// Пакетная сверка всех секций страницы по .figma/sections.json.
// npm run compare:page -- home            — на 1440 (как макет)
// npm run compare:page -- home --scale    — на 1920: эталон увеличивается в 1920/1440 раз (проверка масштабирования)
// Нужен запущенный npm run dev. Результаты по секциям — в .compare/<страница>-<секция>-*.png
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import sharp from 'sharp';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { scale: { type: 'boolean', default: false } },
});
const pageName = positionals[0];
const config = JSON.parse(readFileSync('.figma/sections.json', 'utf-8'));
const page = config[pageName];
if (!page) {
  console.error(`Страница «${pageName}» не описана в .figma/sections.json. Есть: ${Object.keys(config).filter((k) => !k.startsWith('$')).join(', ')}`);
  process.exit(1);
}

const k = values.scale ? 1920 / 1440 : 1;
let ref = page.ref;
if (values.scale) {
  ref = `.compare/${pageName}-ref-1920.png`;
  if (!existsSync(ref)) {
    const m = await sharp(page.ref).metadata();
    await sharp(page.ref).resize(1920, Math.round((m.height * 1920) / 1440), { kernel: 'lanczos3' }).toFile(ref);
  }
}

for (const s of page.sections) {
  // У секции может быть свой эталон (например, состояние с открытой панелью)
  let sref = ref;
  if (s.ref) {
    sref = s.ref;
    if (values.scale) {
      sref = `.compare/${pageName}-${s.name}-ref-1920.png`;
      if (!existsSync(sref)) {
        const m = await sharp(s.ref).metadata();
        await sharp(s.ref).resize(1920, Math.round((m.height * 1920) / 1440), { kernel: 'lanczos3' }).toFile(sref);
      }
    }
  }
  const args = [
    'scripts/compare.mjs',
    '--ref', sref,
    '--url', page.url,
    '--name', `${pageName}-${s.name}${values.scale ? '-1920' : ''}`,
    '--ref-y', String(Math.round(s.refY * k)),
    '--ref-h', String(Math.round(s.refH * k)),
  ];
  if (s.selector) args.push('--selector', s.selector);
  if (s.refX !== undefined) args.push('--ref-x', String(Math.round(s.refX * k)));
  if (s.refW !== undefined) args.push('--ref-w', String(Math.round(s.refW * k)));
  if (s.open) args.push('--open', s.open);
  if (s.viewportH !== undefined) args.push('--viewport-h', String(Math.round(s.viewportH * k)));
  if (s.url) args[args.indexOf('--url') + 1] = s.url;
  const out = execFileSync('node', args, { encoding: 'utf-8' });
  const [line1, line2] = out.split('\n');
  console.log(`${line1.split(',')[0].padEnd(28)} ${line1.match(/\(([\d.]+%)\)/)?.[1].padStart(7)}   ${line2.trim()}`);
}
