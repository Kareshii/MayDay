import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    '@nuxt/icon',
    '@nuxt/eslint',
    '@nuxtjs/color-mode',
  ],

  css: ['assets/css/main.css'],
  colorMode: { classSuffix: '' },

  content: {
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
  vite: { plugins: [tailwindcss()] },
})
