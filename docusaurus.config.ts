import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'

const config: Config = {
  title: 'Flixer Docs',
  tagline: 'Self-hosted media streaming for movies, TV and music',
  favicon: 'img/favicon.png',

  url: process.env.DOCS_URL ?? 'https://docs.flixer.dev',
  baseUrl: process.env.DOCS_BASE_URL ?? '/',
  organizationName: 'flixermedia',
  projectName: 'flixer-docs',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          path: 'docs',
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/flixer.png',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'Flixer',
      logo: { alt: 'Flixer', src: 'img/logo.svg' },
      items: [
        { to: '/getting-started/introduction', label: 'Getting started', position: 'left' },
        { to: '/architecture/overview', label: 'Architecture', position: 'left' },
        { to: '/flixer/overview', label: 'Backend', position: 'left' },
        { to: '/flixer-web/overview', label: 'Web', position: 'left' },
        { to: '/flixer-streamer/overview', label: 'Streamer', position: 'left' },
        { to: '/flixer-indexer/overview', label: 'Indexer', position: 'left' },
        { to: '/operations/deployment', label: 'Operations', position: 'left' },
        { to: '/reference/glossary', label: 'Reference', position: 'left' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Services',
          items: [
            { label: 'flixer', to: '/flixer/overview' },
            { label: 'flixer-web', to: '/flixer-web/overview' },
            { label: 'flixer-streamer', to: '/flixer-streamer/overview' },
            { label: 'flixer-indexer', to: '/flixer-indexer/overview' },
          ],
        },
        {
          title: 'Guides',
          items: [
            { label: 'Quick start', to: '/getting-started/quick-start' },
            { label: 'Configuration', to: '/operations/environment-variables' },
            { label: 'Troubleshooting', to: '/operations/troubleshooting' },
          ],
        },
      ],
      copyright: `Flixer documentation, built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'powershell', 'json', 'yaml', 'go', 'docker', 'nginx', 'sql', 'toml'],
    },
    mermaid: {
      theme: { light: 'neutral', dark: 'dark' },
    },
    docs: {
      sidebar: { hideable: true, autoCollapseCategories: true },
    },
    tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 4 },
  } satisfies Preset.ThemeConfig,
}

export default config
