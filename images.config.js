// Настройки оптимизации изображений (scripts/optimize-images.mjs).
// Исходники: assets-src/images/**/*.png (экспорт из Figma в 2x).
// Результат: src/assets/images/**/ — фото: .webp + .jpg (fallback), с прозрачностью: .webp (lossless) + .png.
export default {
  srcDir: 'assets-src/images',
  outDir: 'src/assets/images',
  maxWidth: 2880, // 2x от ширины макета 1440
  photo: {
    webp: { quality: 88, effort: 6 },
    jpeg: { quality: 90, mozjpeg: true },
  },
  transparent: {
    webp: { lossless: true, effort: 6 },
    png: { compressionLevel: 9, effort: 10 },
  },
};
