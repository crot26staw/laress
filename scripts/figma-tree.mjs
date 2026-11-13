// Дерево узла из кэша Figma (выгрузка Framelink get_figma_data) с подставленными стилями.
// npm run figma:tree -- <nodeId> [--file .figma/pages_966-41552.yaml]
// Без --file узел ищется во всех выгрузках .figma/*.yaml (страницы, UI Kit, информационные страницы…).
// Пример: npm run figma:tree -- 966:41582
// Для каждого узла печатает: тип, имя, id, раскладку (row/column, padding, gap, размеры),
// заливки/обводки, текстовый стиль и текст. Шаблоны EL-*, layout_*, fill_*, style_* раскрываются.
// В тексте [nbsp] = неразрывный пробел (&nbsp;), [br] = принудительный перенос (<br />).
// Стоки (strokes) в Figma не влияют на размеры — в CSS для таких линий используйте box-shadow inset.
import { readFileSync, readdirSync } from 'node:fs';
import { parseArgs } from 'node:util';
import YAML from 'yaml';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { file: { type: 'string' } },
});
const target = positionals[0];
if (!target) {
  console.error('Укажите nodeId, например: npm run figma:tree -- 966:41582');
  process.exit(1);
}

const files = values.file
  ? [values.file]
  : readdirSync('.figma').filter((f) => f.endsWith('.yaml')).map((f) => `.figma/${f}`);
const file = files.find((f) => readFileSync(f, 'utf-8').includes(`#${target} `));
if (!file) {
  console.error(`Узел ${target} не найден в кэше (${files.join(', ')}). Выгрузите его через get_figma_data в .figma/.`);
  process.exit(1);
}
const src = readFileSync(file, 'utf-8');
const [head, nodes] = src.split('\nNODES:\n');
const gvText = head.split('GLOBAL_VARS:\n')[1].split('\nELEMENTS:')[0];
const elText = head.split('\nELEMENTS:\n')[1]?.split(/\n(?:COMPONENTS|COMPONENT_SETS):/)[0] ?? '';
const GV = YAML.parse(gvText) ?? {};
const EL = YAML.parse(elText) ?? {};

const r2 = (n) => Math.round(Number(n) * 100) / 100;

function layout(v) {
  if (typeof v === 'string') v = GV[v] ?? v;
  if (!v || typeof v !== 'object') return String(v);
  const { sizing = {}, dimensions, locationRelativeToParent: loc, mode, ...rest } = v;
  const parts = [];
  if (mode && mode !== 'none') parts.push(mode);
  for (const [k, val] of Object.entries(rest)) parts.push(`${k}=${val}`);
  if (sizing.horizontal || sizing.vertical) parts.push(`size=${sizing.horizontal ?? '-'},${sizing.vertical ?? '-'}`);
  if (dimensions) parts.push(`dim=${Object.values(dimensions).map(r2).join('x')}`);
  if (loc) parts.push(`@${r2(loc.x)},${r2(loc.y)}`);
  return parts.join(' ');
}

function style(v) {
  let name = '';
  if (typeof v === 'string') {
    name = v;
    v = GV[v] ?? v;
    if (typeof v !== 'object') return name;
  }
  const out = [`${v.fontFamily ?? ''} ${v.fontWeight ?? ''} ${v.fontSize ?? ''}/${v.lineHeight ?? ''}`];
  if (v.letterSpacing) out.push(`ls${v.letterSpacing}`);
  if (v.textCase) out.push(v.textCase);
  if (v.textAlignHorizontal && v.textAlignHorizontal !== 'LEFT') out.push(`align=${v.textAlignHorizontal}`);
  if (v.textDecoration) out.push(v.textDecoration);
  return (name && !name.startsWith('style_') ? `${name}:` : '') + out.join(' ');
}

function paint(v) {
  if (typeof v === 'string' && v in GV) v = GV[v];
  if (Array.isArray(v) && v.length === 1 && typeof v[0] === 'string') return JSON.stringify(v[0]);
  if (Array.isArray(v)) {
    v = v.map((x) => {
      if (x && typeof x === 'object') {
        const { imageDownloadArguments, isBackground, ...rest } = x;
        if (rest.imageRef) rest.imageRef = rest.imageRef.slice(0, 8);
        return rest;
      }
      return x;
    });
  }
  return JSON.stringify(v);
}

// Атрибуты строки узла: key=value, где value — "строка", {json}, [json] или слово
function parseAttrs(rest) {
  const attrs = {};
  const re = /(\w+)=("(?:[^"\\]|\\.)*"|\{.*?\}(?=\s\w+=|$)|\[.*?\](?=\s\w+=|$)|\S+)/g;
  for (const [, k, raw] of rest.matchAll(re)) {
    let v = raw;
    if (v.startsWith('"')) v = v.slice(1, -1);
    else if (v.startsWith('{') || v.startsWith('[')) {
      try {
        v = JSON.parse(v);
      } catch {
        /* оставить строкой */
      }
    }
    attrs[k] = v;
  }
  return attrs;
}

// \u2028 (принудительный перенос в тексте Figma) JS-регулярки считают концом строки — заменяем меткой
const BR = '\uE000';
const lines = nodes.replace(/\u2028/g, BR).split('\n');
const escaped = target.replace(/[.*+?^${}()|[\]\;]/g, '\\$&');
const start = lines.findIndex((l) => new RegExp(`#${escaped} `).test(l));
if (start < 0) {
  console.error(`Узел ${target} не найден в ${values.file}`);
  process.exit(1);
}
const indentOf = (l) => l.length - l.trimStart().length;
const base = indentOf(lines[start]);

for (let i = start; i < lines.length; i++) {
  const line = lines[i];
  if (i > start && line.trim() && indentOf(line) <= base) break;
  const m = line.match(/^(\s*)\[([\w-]+)\]\s*(?:"([^"]*)")?\s*#(\S+)\s*(.*)$/);
  if (!m) continue;
  const [, , type, name, id, rest] = m;
  const attrs = parseAttrs(rest);
  if (attrs.template && EL[attrs.template]) {
    const { type: _t, ...tpl } = EL[attrs.template];
    Object.assign(attrs, { ...tpl, ...attrs });
  }
  delete attrs.template;
  const out = [`${' '.repeat(indentOf(line) - base)}${type} ${name ? `«${name}» ` : ''}#${id}`];
  if (attrs.layout) out.push(`[${layout(attrs.layout)}]`);
  for (const k of ['fills', 'strokes']) if (attrs[k] !== undefined) out.push(`${k}=${paint(attrs[k])}`);
  for (const k of ['strokeWeight', 'borderRadius', 'effects', 'opacity', 'strokeDashes']) {
    if (attrs[k] !== undefined) out.push(`${k}=${JSON.stringify(GV[attrs[k]] ?? attrs[k])}`);
  }
  if (attrs.textStyle) out.push(`{${style(attrs.textStyle)}}`);
  // Неразрывные пробелы и принудительные переносы — видимыми метками: в HTML это &nbsp; и <br />
  if (attrs.text !== undefined) {
    const text = String(attrs.text).replace(/\u00a0/g, '[nbsp]').replace(/\uE000|\u2028|\\L/g, '[br]');
    out.push(JSON.stringify(text));
  }
  console.log(out.join(' '));
}
