import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'
import type { Configuration as WebpackConfiguration } from 'webpack'

const config: Config = {
  title: 'Flixer Docs',
  tagline: 'Install, run, and understand Flixer',
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

  plugins: [
    () => ({
      name: 'development-asset-cache-control',
      configureWebpack(): WebpackConfiguration & {
        devServer: { headers: Record<string, string> }
      } {
        return {
          devServer: {
            headers: {
              'Cache-Control': 'no-store',
            },
          },
        }
      },
    }),
  ],

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
        { to: '/getting-started/quick-start', label: 'Get started', position: 'left' },
        { to: '/operations/deployment', label: 'Operations', position: 'left' },
        { to: '/ecosystem', label: 'Ecosystem', position: 'left' },
        {
          type: 'dropdown',
          label: 'Components',
          position: 'left',
          items: [
            { to: '/architecture/overview', label: 'Architecture' },
            { to: '/flixer/overview', label: 'Backend' },
            { to: '/flixer-web/overview', label: 'Web app' },
            { to: '/flixer-streamer/overview', label: 'Streamer' },
            { to: '/flixer-indexer/overview', label: 'Indexer' },
            { to: '/flixer-ai/overview', label: 'AI' },
            { to: '/flixer-logger/overview', label: 'Logger' },
            { to: '/flixer-plugins/overview', label: 'Plugins' },
          ],
        },
        { to: '/reference/glossary', label: 'Reference', position: 'left' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Services',
          items: [
            { label: 'Architecture', to: '/architecture/overview' },
            { label: 'Flixer ecosystem', to: '/ecosystem' },
            { label: 'Backend', to: '/flixer/overview' },
            { label: 'Web app', to: '/flixer-web/overview' },
            { label: 'Streamer', to: '/flixer-streamer/overview' },
            { label: 'Indexer', to: '/flixer-indexer/overview' },
            { label: 'AI', to: '/flixer-ai/overview' },
            { label: 'Logger', to: '/flixer-logger/overview' },
            { label: 'Plugins', to: '/flixer-plugins/overview' },
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
