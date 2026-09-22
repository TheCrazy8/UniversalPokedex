import footnote from 'markdown-it-footnote'
import taskLists from '@hackmd/markdown-it-task-lists'
import sub from 'markdown-it-sub'
import sup from 'markdown-it-sup'
import mark from 'markdown-it-mark'
import abbr from 'markdown-it-abbr'
import ins from 'markdown-it-ins'
import deflist from 'markdown-it-deflist'
import spoiler from '@traptitech/markdown-it-spoiler'
import timeline from 'vitepress-markdown-timeline'
import { defineConfig } from 'vitepress'
import { VitePWA } from 'vite-plugin-pwa'
import { MCPPlugin } from 'vitepress-plugin-mcp'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'
import { groupIconMdPlugin, groupIconVitePlugin } from 'vitepress-plugin-group-icons'
import {
  GitChangelog,
  GitChangelogMarkdownSection,
} from '@nolebase/vitepress-plugin-git-changelog/vite'
import { InlineLinkPreviewElementTransform } from '@nolebase/vitepress-plugin-inline-link-preview/markdown-it'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(defineConfig({
  markdown: {
    lineNumbers: true,
    config(md) {
      md.use(footnote)
      md.use(tabsMarkdownPlugin)
      md.use(groupIconMdPlugin)
      md.use(taskLists)
      md.use(sub)
      md.use(sup)
      md.use(mark)
      md.use(abbr)
      md.use(ins)
      md.use(spoiler)
      md.use(deflist)
      md.use(timeline)
      md.use(InlineLinkPreviewElementTransform)
    }
  },
  title: "SplatoonDimensions",
  description: "The SplatoonDimensions site.",
  base: "/SplatoonDimensions/",
  themeConfig: {
    editLink: {
      pattern: 'https://github.com/TheCrazy8/SplatoonDimensions/edit/main/docs/:path',
      text: '✏️ Edit this page'
    },

    docFooter: {
      prev:  '← Previous',
      next: 'Next →'
    },

    externalLinkIcon: false,
    siteTitle: "SplatoonDimensions",
    footer: {
      message: "Released under the CC BY-NC-ND 4.0 License.",
      copyright: "Copyright © 2025-present TheCrazy8",
    },
    
    outline: {
      level: [2, 3],
      label: 'On this page'
    },
    
    lastUpdated: {
      text: 'Updated',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'medium',
        forceLocale: true,
      }
    },
    
    // Local search configuration (no external dependencies required)
    // To upgrade to Algolia DocSearch:
    // 1. Apply at https://docsearch.algolia.com/
    // 2. Replace with: search: { provider: 'algolia', options: { appId: 'XXX', apiKey: 'XXX', indexName: 'XXX' } }
    search: { 
      provider: 'local',
      options: {
        detailedView: true,
        miniSearch: {
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: { 
              title: 4, 
              text: 2, 
              titles: 1 
            }
          }
        }
      }
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/TheCrazy8/SplatoonDimensions' }
    ],
  },
  
  head: [
    ['link', { rel: 'icon', type: 'image/x-icon', href: '/SplatoonDimensions/favicon.ico' }],
    ['link', { rel: 'apple-touch-icon', href: '/SplatoonDimensions/icon-192x192.png' }],
    ['meta', { name: 'theme-color', content: '#ff4500' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name:  'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'SplatoonDimensions' }],
    ['meta', { property: 'og:image', content: '/SplatoonDimensions/og-image.png' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],
  
  
  vite: {
    plugins: [
      GitChangelog({
        repoURL: () => 'https://github.com/TheCrazy8/SplatoonDimensions',
      }),
      GitChangelogMarkdownSection(),
      groupIconVitePlugin(),
      MCPPlugin({ port: 4000 }),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', '*.png'],
        manifest: {
          name: 'SplatoonDimensions',
          short_name: 'SplatoonDimensions',
          description: 'SplatoonDimensions - Official documentation and resources',
          theme_color:  '#ff4500',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/SplatoonDimensions/',
          start_url:  '/SplatoonDimensions/',
          icons: [
            {
              src: '/SplatoonDimensions/icon-48x48.png',
              sizes: '48x48',
              type: 'image/png'
            },
            {
              src: '/SplatoonDimensions/icon-72x72.png',
              sizes: '72x72',
              type: 'image/png'
            },
            {
              src: '/SplatoonDimensions/icon-96x96.png',
              sizes: '96x96',
              type: 'image/png'
            },
            {
              src: '/SplatoonDimensions/icon-128x128.png',
              sizes: '128x128',
              type: 'image/png'
            },
            {
              src: '/SplatoonDimensions/icon-144x144.png',
              sizes: '144x144',
              type: 'image/png'
            },
            {
              src: '/SplatoonDimensions/icon-152x152.png',
              sizes: '152x152',
              type: 'image/png'
            },
            {
              src: '/SplatoonDimensions/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/SplatoonDimensions/icon-256x256.png',
              sizes: '256x256',
              type: 'image/png'
            },
            {
              src: '/SplatoonDimensions/icon-384x384.png',
              sizes: '384x384',
              type: 'image/png'
            },
            {
              src: '/SplatoonDimensions/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/SplatoonDimensions/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ],
          shortcuts: [
            {
              name: 'BrightOS Web',
              short_name: 'Web Interface',
              url: '/SplatoonDimensions/brightos-web',
              description: 'Run BrightOS in browser',
              icons: [{ src: '/SplatoonDimensions/icon-192x192.png', sizes: '192x192' }]
            },
            {
              name: 'Tutorials',
              short_name: 'Tutorials',
              url: '/SplatoonDimensions/tutorials',
              description: 'Step-by-step guides',
              icons: [{ src: '/SplatoonDimensions/icon-192x192.png', sizes: '192x192' }]
            },
            {
              name: 'Examples',
              short_name: 'Examples',
              url: '/SplatoonDimensions/examples',
              description:  'View example scripts',
              icons: [{ src: '/SplatoonDimensions/icon-192x192.png', sizes: '192x192' }]
            },
            {
              name: 'Downloads',
              short_name: 'Downloads',
              url: '/SplatoonDimensions/downloads',
              description: 'Download plugins and scripts',
              icons: [{ src: '/SplatoonDimensions/icon-192x192.png', sizes: '192x192' }]
            },
            {
              name: 'Blog',
              short_name: 'Blog',
              url: '/SplatoonDimensions/blog/',
              description: 'Read latest updates',
              icons: [{ src:  '/SplatoonDimensions/icon-192x192.png', sizes: '192x192' }]
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{css,js,html,svg,png,ico,txt,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses:  [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/api\.github\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'github-api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60
                },
                cacheableResponse: {
                  statuses:  [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/rshigflhanzjrqeoynpa\.supabase\.co\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 // 1 hour
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: 'module'
        }
      })
    ],
    optimizeDeps: { 
      exclude: [ 
        '@nolebase/vitepress-plugin-enhanced-readabilities/client', 
        '@nolebase/vitepress-plugin-git-changelog/client',
        '@nolebase/vitepress-plugin-highlight-targeted-heading/client',
        '@nolebase/vitepress-plugin-inline-link-preview/client',
        'vitepress', 
        '@nolebase/ui',
      ]
    },
    ssr: {
      noExternal: [
        '@lando/vitepress-theme-default-plus',
        '@nolebase/vitepress-plugin-enhanced-readabilities', 
        '@nolebase/vitepress-plugin-git-changelog',
        '@nolebase/vitepress-plugin-highlight-targeted-heading',
        '@nolebase/vitepress-plugin-inline-link-preview',
        '@nolebase/ui',
        'vitepress-plugin-nprogress',
        'vitepress-plugin-codeblocks-fold',
        'vitepress-plugin-comment-with-giscus',
      ]
    },
    css: {
      preprocessorOptions:  {
        scss: {}
      }
    }
  },
  mermaid: {
    // Mermaid config: https://mermaid.js.org/config/schema-docs/config.html
  },
  mermaidPlugin: {
    class: 'mermaid',
  },
}))
