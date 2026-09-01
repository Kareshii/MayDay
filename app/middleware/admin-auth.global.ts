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

  if (to.path === '/admin/setup' || to.path === '/admin/install' || to.path === '/admin/configure' || to.path === '/admin/wizard') {
    return navigateTo('/admin/onboarding')
  }

  const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
  const session = await $fetch<{
    authenticated: boolean
    configured: boolean
    databaseConfigured: boolean
    authConfigured: boolean
  }>('/api/admin/session', { headers }).catch(() => ({
    authenticated: false,
    configured: false,
    databaseConfigured: false,
    authConfigured: false,
  }))

  if (!session.databaseConfigured || !session.authConfigured) {
    if (to.path === '/admin/onboarding') {
      return
    }

    return navigateTo('/admin/onboarding')
  }

  if (to.path === '/admin/login' || to.path === '/admin/onboarding') {
    if (session.authenticated) {
      return navigateTo(normalizeAdminRedirect(to.query.redirect))
    }

    if (to.path === '/admin/onboarding') {
      return navigateTo('/admin/login')
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
