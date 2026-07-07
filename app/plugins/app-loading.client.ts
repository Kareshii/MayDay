export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => {
    document.querySelectorAll<HTMLElement>('[data-app-loading]').forEach((loadingEl) => {
      loadingEl.style.pointerEvents = 'none'
      loadingEl.style.opacity = '0'
      loadingEl.style.visibility = 'hidden'
      loadingEl.addEventListener('transitionend', () => loadingEl.remove(), { once: true })

      window.setTimeout(() => {
        loadingEl.remove()
      }, 700)
    })
  })
})
