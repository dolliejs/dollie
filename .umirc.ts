import {
  defineConfig,
} from 'dumi';

export default defineConfig({
  title: 'Dollie.js',
  outputPath: 'docs-dist',
  mode: 'site',
  publicPath: '/',
  hash: true,
  locales: [
    ['en-US', 'English'],
    ['zh-CN', '中文'],
  ],
  copy: [
    {
      from: 'docs/public',
      to: 'public',
    },
  ],
  theme: {
    '@c-primary': '#844d28',
  },
  styles: [
    'https://unpkg.zhimg.com/antd@4.16.6/dist/antd.min.css',
    'img { max-width: 86% !important; display: block; margin: 0 auto; }',
    '.__dumi-default-menu-doc-locale { display: none !important; }',
    '.__dumi-default-locale-select:hover { background-color: transparent !important; }',
    '.__dumi-default-menu[data-mode=\'site\'] .__dumi-default-menu-list > li > a::after { display: none !important; }',
    '.__dumi-default-menu-inner ul li a::before, .__dumi-default-menu-inner ul li > span::before { display: none !important; }',
    '.__dumi-default-layout-hero button { border-radius: 4px !important; }',
    '.__dumi-default-menu[data-mode=\'site\'] { background: white !important; }',
    'code, pre { font-family: Menlo, Consolas, Courier, monospace !important; font-size: 14px; background: transparent !important; }',
    'h1 code, h2 code, h3 code, h4 code, h5 code, h6 code { font-size: inherit; }',
    'https://cdn.jsdelivr.net/npm/prism-themes@1.5.0/themes/prism-vs.css',
    '[data-prefers-color=dark] .__dumi-default-menu-inner ul li a:hover, [data-prefers-color=dark] .__dumi-default-menu-inner ul li > span:hover, [data-prefers-color=dark] .__dumi-default-menu-inner ul li a.active, [data-prefers-color=dark] .__dumi-default-menu-inner ul li > span.active { color: #844d28 !important; }',
    '[data-prefers-color=dark] code[class*="language-"], [data-prefers-color=dark] pre[class*="language-"] { color: white !important; }',
    '[data-prefers-color=dark] .markdown *:not(pre) code { color: #844d28 !important; }',
    '.__dumi-default-menu[data-mode=\'site\'] { padding-top: 0 !important; }',
    '.__dumi-default-menu[data-mode=\'site\'] .__dumi-default-menu-list { margin-top: 50px; }',
    '@media (min-width: 960px) { div[data-show-sidemenu="true"] .__dumi-default-layout-content { padding-left: 10%; padding-right: 10%; } }',
    '@media (min-width: 1680px) { div[data-show-sidemenu="true"] .__dumi-default-layout-content { padding-left: 26%; padding-right: 26%; } }',
    '.markdown blockquote { border-left-color: #844d28 !important; }',
    '.markdown *:not(pre) code { color: #844d28 !important; }',
  ],
  favicon: '/public/images/favicon.ico',
  resolve: {
    includes: ['docs'],
    previewLangs: [],
  },
  navs: {
    'en-US': [
      null,
      {
        title: 'GitHub',
        path: 'https://github.com/dolliejs/dollie',
      },
    ],
    'zh-CN': [
      null,
      {
        title: 'GitHub',
        path: 'https://github.com/dolliejs/dollie',
      },
    ],
  },
  logo: '/public/images/dollie.svg',
  exportStatic: {},
});
