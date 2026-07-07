import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const loadingHtml = (() => {
  try {
    return readFileSync(resolve(process.cwd(), 'loading.html'), 'utf8')
  } catch {
    return '<span>Loading...</span>'
  }
})()

const appLoadingTemplate = `<div data-app-loading style="position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;width:100vw;height:100vh;background:#ffffffbd;user-select:none;opacity:1;visibility:visible;transition:opacity .5s ease-out,visibility .5s ease-out;">${loadingHtml}</div>`

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html) => {
    html.bodyPrepend.unshift(appLoadingTemplate)
  })
})
