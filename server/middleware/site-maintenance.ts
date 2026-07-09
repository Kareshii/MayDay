import {
  defineEventHandler,
  getRequestURL,
  send,
  setHeader,
  setResponseStatus,
} from 'h3'
import { isDatabaseConfigured } from '../database/client'
import { readAdminSiteSettings } from '../utils/adminFeatureStore'

const PUBLIC_ASSET_PATHS = new Set(['/cover.jpg', '/favicon.ico'])

function isAdminPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

function isAdminApiPath(pathname: string) {
  return pathname === '/api/admin' || pathname.startsWith('/api/admin/')
}

function isNuxtAssetPath(pathname: string) {
  return pathname.startsWith('/_nuxt/')
    || pathname.startsWith('/__nuxt/')
    || pathname.startsWith('/__nuxt_content/')
}

function isStaticAssetPath(pathname: string) {
  return isNuxtAssetPath(pathname)
    || PUBLIC_ASSET_PATHS.has(pathname)
    || pathname.startsWith('/uploads/')
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#39;')
}

function renderMaintenanceHtml(input: {
  siteName: string
  message: string
  statusCode: number
}) {
  const siteName = escapeHtml(input.siteName)
  const message = escapeHtml(input.message)

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>${siteName} - 网站维护中</title>
  <style>
    :root {
      color-scheme: light dark;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f7f2ea;
      color: #241f1a;
    }
    body {
      min-height: 100vh;
      margin: 0;
      display: grid;
      place-items: center;
      background: #f7f2ea;
    }
    main {
      width: min(32rem, calc(100vw - 3rem));
      padding: 3rem;
      border: 1px solid rgba(36, 31, 26, 0.12);
      border-radius: 0.5rem;
      background: rgba(255, 252, 247, 0.88);
      box-shadow: 0 24px 80px rgba(42, 35, 25, 0.14);
    }
    p {
      margin: 0;
      line-height: 1.8;
    }
    .code {
      margin-bottom: 1rem;
      color: #8b5e34;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.18em;
    }
    h1 {
      margin: 0 0 1rem;
      font-size: clamp(2rem, 8vw, 3.75rem);
      line-height: 1;
      letter-spacing: 0;
    }
    .message {
      color: #594d42;
      font-size: 1rem;
    }
    .site {
      margin-top: 2rem;
      color: #8a7a68;
      font-size: 0.875rem;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        background: #14110f;
        color: #f5efe7;
      }
      body {
        background: #14110f;
      }
      main {
        border-color: rgba(245, 239, 231, 0.14);
        background: rgba(28, 24, 21, 0.9);
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
      }
      .code {
        color: #d3a06c;
      }
      .message {
        color: #d8cbbd;
      }
      .site {
        color: #aa9c8b;
      }
    }
  </style>
</head>
<body>
  <main>
    <p class="code">HTTP ${input.statusCode}</p>
    <h1>网站维护中</h1>
    <p class="message">${message}</p>
    <p class="site">${siteName}</p>
  </main>
</body>
</html>`
}

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const pathname = url.pathname

  if (
    !isDatabaseConfigured()
    || isAdminPath(pathname)
    || isAdminApiPath(pathname)
    || isStaticAssetPath(pathname)
  ) {
    return
  }

  const site = await readAdminSiteSettings()

  if (site.siteEnabled) {
    return
  }

  const statusCode = site.maintenanceStatusCode
  setResponseStatus(event, statusCode, 'Site Maintenance')
  setHeader(event, 'cache-control', 'no-store')

  if (statusCode === 503) {
    setHeader(event, 'retry-after', 3600)
  }

  if (pathname.startsWith('/api/')) {
    setHeader(event, 'content-type', 'application/json; charset=utf-8')
    return {
      statusCode,
      message: site.closedMessage,
    }
  }

  return send(
    event,
    renderMaintenanceHtml({
      siteName: site.siteName,
      message: site.closedMessage,
      statusCode,
    }),
    'text/html; charset=utf-8',
  )
})
