import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

const root = process.cwd();

// Базовый путь сайта. Локально — '/', на GitHub Pages — '/laress/' (задаётся в .github/workflows/pages.yml).
const base = process.env.BASE_PATH || '/';

// Все *.html в корне — отдельные страницы (Vite multi-page).
const pages = Object.fromEntries(
  readdirSync(root)
    .filter((file) => file.endsWith('.html'))
    .map((file) => [path.basename(file, '.html'), path.resolve(root, file)]),
);

// Подключение партиалов: <!-- @include src/partials/header.html -->
// Пути — от корня проекта. Вложенные include поддерживаются.
// Параметры — JSON после пути: <!-- @include src/partials/product-card.html {"title": "…", "tag": "Бестселлер"} -->
// В партиале: {{name}} — значение (нет параметра — пустая строка), {{#if name}}…{{/if}} — блок, если параметр задан.
// Аналог get_template_part( …, $args ) в WordPress.
const INCLUDE_RE = /<!--\s*@include\s+(\S+)(?:\s+(\{[\s\S]*?\}))?\s*-->/g;

function applyParams(html, params) {
  return html
    .replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, name, block) => (params[name] ? block : ''))
    .replace(/\{\{(\w+)\}\}/g, (_, name) => params[name] ?? '')
    // Пустой модификатор не должен оставлять лишних пробелов в class
    .replace(/class="([^"]*)"/g, (_, cls) => `class="${cls.trim().replace(/\s+/g, ' ')}"`);
}

function resolveIncludes(html, depth = 0) {
  if (depth > 10) throw new Error('@include: слишком глубокая вложенность');
  return html.replace(INCLUDE_RE, (_, file, json) => {
    const params = json ? JSON.parse(json) : {};
    const source = readFileSync(path.resolve(root, file), 'utf-8')
      // Описание партиала в первом комментарии — для разработчика, в страницу не попадает
      .replace(/^\s*<!--(?!\s*@include)[\s\S]*?-->\s*/, '');
    const partial = applyParams(source, params);
    return resolveIncludes(partial, depth + 1);
  });
}

function htmlPartials() {
  return {
    name: 'html-partials',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => resolveIncludes(html),
    },
    handleHotUpdate({ file, server }) {
      if (file.includes(`${path.sep}src${path.sep}partials${path.sep}`)) {
        server.ws.send({ type: 'full-reload' });
        return [];
      }
    },
  };
}

// Ссылки между страницами (href="/catalog.html", action="/") Vite не трогает — при base ≠ '/'
// дописываем к ним base. Картинки, шрифты и скрипты Vite переписывает сам.
function basePageLinks() {
  return {
    name: 'base-page-links',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: (html) =>
        base === '/'
          ? html
          : html.replace(/\b(href|action)="\/(?!\/)([^"]*)"/g, (match, attr, rest) =>
              `/${rest}`.startsWith(base) ? match : `${attr}="${base}${rest}"`,
            ),
    },
  };
}

export default defineConfig({
  base,
  plugins: [
    htmlPartials(),
    basePageLinks(),
    // Растровые картинки уже оптимизированы скриптом (npm run images), здесь — только SVG.
    ViteImageOptimizer({
      test: /\.svg$/i,
      svg: {
        multipass: true,
        plugins: [
          {
            name: 'preset-default',
            params: { overrides: { removeViewBox: false } },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: { input: pages },
  },
});
