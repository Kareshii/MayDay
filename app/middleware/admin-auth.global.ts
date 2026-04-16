function normalizeAdminRedirect(value: unknown) {
  if (typeof value !== 'string') {
    return '/admin'
  }

  if (!value.startsWith('/admin') || value === '/admin/login' || value.startsWith('/admin/login?')) {
    return '/admin'
  }

  return value
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin')) {
    return
  }

  const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
  const session = await $fetch<{
    authenticated: boolean
    configured: boolean
  }>('/api/admin/session', { headers }).catch(() => ({
    authenticated: false,
    configured: false,
  }))

  if (to.path === '/admin/login') {
    if (session.authenticated) {
      return navigateTo(normalizeAdminRedirect(to.query.redirect))
    }

    return
  }

  if (session.authenticated) {
    return
  }

  return navigateTo({
    path: '/admin/login',
    query: {
      redirect: to.fullPath,
    },
  })
})
