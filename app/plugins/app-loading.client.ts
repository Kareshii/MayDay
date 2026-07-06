import { loadingFadeOut } from 'virtual:app-loading'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => {
    loadingFadeOut()
  })
})
