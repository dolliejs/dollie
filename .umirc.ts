import { defineConfig } from 'dumi';

export default defineConfig({
  title: 'Dollie',
  outputPath: 'docs/dist',
  mode: 'site',
  publicPath: '/',
  base: 'docs',
  hash: true,
  locales: [
    ['en', 'English'],
    ['zh', '中文'],
  ],
  copy: [
    {
      from: 'docs/public',
      to: 'public'
    },
  ],
  theme: {
    '@c-primary': '#844d28',
  },
  styles: [
    'img { max-width: 680px !important; }',
    '.__dumi-default-locale-select, .__dumi-default-search-input { border-radius: 2px !important; }',
    '.__dumi-default-locale-select, .__dumi-default-search-input:focus { border: 1px solid rgba(255, 255, 255, .4) !important; }',
    '.__dumi-default-search-input { border: 1px solid transparent !important; }',
    '.__dumi-default-menu-doc-locale { display: none !important; }',
    '.__dumi-default-navbar { background-color: #0b0f13 !important; box-shadow: 0 0 0.2rem rgb(0 0 0 / 10%), 0 0.2rem 0.4rem rgb(0 0 0 / 20%) !important; }',
    '.__dumi-default-search-input { background-color: rgba(255, 255, 255, .1) !important; color: rgba(255, 255, 255, .8) !important; }',
    '.__dumi-default-navbar-logo { font-size: 22px !important; color: white !important; }',
    '.__dumi-default-navbar nav > span > a:not(.active) { color: rgba(255, 255, 255, .6) !important; }',
    '.__dumi-default-navbar nav > span > a:not(.active):hover { color: rgba(255, 255, 255, .8) !important; }',
    '.__dumi-default-navbar nav > span > a.active::after { display: none !important; }',
    '.__dumi-default-locale-select:hover { background-color: transparent !important; }',
    '.__dumi-default-menu[data-mode=\'site\'] .__dumi-default-menu-list > li > a::after { display: none !important; }',
    '.__dumi-default-menu[data-mode=\'site\'] .__dumi-default-menu-list > li > a.active { background: rgba(69, 123, 157, .3) !important; }',
    '.__dumi-default-menu-inner ul li a::before, .__dumi-default-menu-inner ul li > span::before { display: none !important; }',
    '.__dumi-default-layout-hero button { border-radius: 4px !important; }',
    '.__dumi-default-menu[data-mode=\'site\'] { background: white !important; }',
    'code, pre { color: #844d28 !important; font-family: Menlo, Consolas, Courier, monospace !important; font-size: 14px; background: transparent !important; }',
    'pre { color: #333 !important; }',
    'h1 code, h2 code, h3 code, h4 code, h5 code, h6 code { font-size: inherit; }',
    'https://cdn.jsdelivr.net/npm/prism-themes@1.5.0/themes/prism-vs.css',
  ],
  favicon: '/public/images/favicon.ico',
  resolve: {
    includes: ['docs'],
    previewLangs: [],
  },
  navs: {
    en: [
      null,
      {
        title: 'GitHub',
        path: 'https://github.com/dolliejs/dollie-core',
      },
    ],
    zh: [
      null,
      {
        title: 'GitHub',
        path: 'https://github.com/dolliejs/dollie-core',
      },
    ],
  },
  logo: '/public/images/dollie.svg',
  exportStatic: {},
});
