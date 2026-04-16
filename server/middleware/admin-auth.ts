import { createError, defineEventHandler, getRequestURL, sendRedirect } from 'h3'
import { isAdminAuthConfigured, readAdminSession } from '../utils/adminAuth'
import { isDatabaseConfigured } from '../database/client'

const PUBLIC_ADMIN_PATHS = new Set([
  '/admin/onboarding',
  '/admin/wizard',
  '/admin/configure',
  '/admin/login',
  '/admin/install',
  '/admin/setup',
  '/api/admin/login',
  '/api/admin/logout',
  '/api/admin/session',
  '/api/admin/setup',
])

function isProtectedAdminPage(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

function isProtectedAdminApi(pathname: string) {
  return pathname === '/api/admin' || pathname.startsWith('/api/admin/')
}

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const pathname = url.pathname
  const protectAdminPage = isProtectedAdminPage(pathname)
  const protectAdminApi = isProtectedAdminApi(pathname)
  const isPublicAdminPath = PUBLIC_ADMIN_PATHS.has(pathname)
  const databaseConfigured = isDatabaseConfigured()
  const adminConfigured = isAdminAuthConfigured()

  if (!protectAdminPage && !protectAdminApi) {
    return
  }

  if (pathname === '/admin/setup' || pathname === '/admin/install' || pathname === '/admin/configure' || pathname === '/admin/wizard') {
    return sendRedirect(event, '/admin/onboarding', 302)
  }

  if (pathname === '/admin/onboarding' && databaseConfigured && adminConfigured) {
    if (readAdminSession(event)) {
      return sendRedirect(event, '/admin', 302)
    }

    return sendRedirect(event, '/admin/login', 302)
  }

  if (!databaseConfigured || !adminConfigured) {
    if (protectAdminPage && pathname !== '/admin/onboarding') {
      return sendRedirect(event, '/admin/onboarding', 302)
    }

    if (protectAdminApi && !isPublicAdminPath) {
      throw createError({
        statusCode: 503,
        statusMessage: !databaseConfigured
          ? 'Database is not configured. Complete the first-run setup before using /api/admin.'
          : 'Admin authentication is not configured. Complete the first-run setup before using /api/admin.',
      })
    }
  }

  if (isPublicAdminPath) {
    return
  }

  if (readAdminSession(event)) {
    return
  }

  if (protectAdminApi) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  const redirectTarget = encodeURIComponent(`${pathname}${url.search}`)
  return sendRedirect(event, `/admin/login?redirect=${redirectTarget}`, 302)
})
