import { matchesManagedRoutePath } from '~~/shared/types/routes'

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith('/admin')) {
    return
  }

  const { data: siteConfig } = await usePublicSiteConfig()
  const matchedRoute = siteConfig.value.routes.find((route) => {
    return route.kind === 'page' && matchesManagedRoutePath(route.path, to.path)
  })

  if (matchedRoute && !matchedRoute.enabled) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Page not found',
    })
  }
})
