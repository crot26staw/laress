import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

const root = process.cwd();

// Все *.html в корне — отдельные страницы (Vite multi-page).
const pages = Object.fromEntries(
  readdirSync(root)
    .filter((file) => file.endsWith('.html'))
    .map((file) => [path.basename(file, '.html'), path.resolve(root, file)]),
);

// Подключение партиалов: <!-- @include src/partials/header.html -->
// Пути — от корня проекта. Вложенные include поддерживаются.
const INCLUDE_RE = /<!--\s*@include\s+([^\s]+)\s*-->/g;

function resolveIncludes(html, depth = 0) {
  if (depth > 10) throw new Error('@include: слишком глубокая вложенность');
  return html.replace(INCLUDE_RE, (_, file) =>
    resolveIncludes(readFileSync(path.resolve(root, file), 'utf-8'), depth + 1),
  );
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

export default defineConfig({
  plugins: [
    htmlPartials(),
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
