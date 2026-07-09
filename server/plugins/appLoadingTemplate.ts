import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getRequestURL } from 'h3'

const loadingHtml = (() => {
  try {
    return readFileSync(resolve(process.cwd(), 'loading.html'), 'utf8')
  } catch {
    return '<span>Loading...</span>'
  }
})()

const appLoadingTemplate = `<div data-app-loading style="position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;width:100vw;height:100vh;background:#ffffffbd;user-select:none;opacity:1;visibility:visible;transition:opacity .5s ease-out,visibility .5s ease-out;">${loadingHtml}</div>`

function isAdminPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    if (!isAdminPath(getRequestURL(event).pathname)) {
      return
    }

    html.bodyPrepend.unshift(appLoadingTemplate)
  })
})
