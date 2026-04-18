import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

type RoutePage = {
  path?: string
  children?: RoutePage[]
}

function removeLegacyPostDetailRoute(pages: RoutePage[]) {
  for (let index = pages.length - 1; index >= 0; index -= 1) {
    const page = pages[index]
    if (!page) {
      continue
    }

    if (page.path === '/posts/:slug') {
      pages.splice(index, 1)
      continue
    }

    if (page.children?.length) {
      removeLegacyPostDetailRoute(page.children)
    }
  }
}

export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    '@nuxt/icon',
    '@nuxt/eslint',
    '@nuxtjs/color-mode',
    '@vueuse/motion/nuxt',
  ],

  css: ['assets/css/main.css'],
  colorMode: { classSuffix: '' },

  content: {
    experimental: {
      nativeSqlite: true,
    },
    build: {
      markdown: {
        highlight: {
          // See the available themes on https://github.com/shikijs/shiki/blob/main/docs/themes.md#all-theme
          theme: {
            dark: 'github-dark',
            default: 'github-light',
          },
        },
      },
    },
  },
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2025-02-19',

  routeRules: {
    '/design': { ssr: false },
  },
  alias: {
    '@/language': fileURLToPath(new URL('./app/language', import.meta.url)),
  },
  hooks: {
    'pages:extend': (pages) => {
      removeLegacyPostDetailRoute(pages as RoutePage[])
    },
  },
  vite: { plugins: [tailwindcss()] },
})
