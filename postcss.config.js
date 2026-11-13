// px → rem при сборке: в исходниках пишем px как в Figma (макет 1440, 1rem = 16px).
// Размер корневого шрифта масштабируется от 1440 до 1920 (src/styles/base/typography.css),
// поэтому вся вёрстка пропорционально растёт вместе с экраном.
import pxtorem from 'postcss-pxtorem';

export default {
  plugins: [
    pxtorem({
      rootValue: 16,
      propList: ['*'],
      minPixelValue: 2, // 1px (рамки, линии) оставляем в px — чтобы не размывались
      selectorBlackList: [/^html$/], // корневой размер шрифта задаётся в px
      mediaQuery: false,
    }),
  ],
};
