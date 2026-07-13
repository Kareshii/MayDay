import { isDatabaseConfigured } from '../database/client'
import {
  DEFAULT_SEO_SETTINGS,
  DEFAULT_SITE_SETTINGS,
  readAdminFeatureSettings,
  readAdminRouteSettings,
  readAdminSeoSettings,
  readAdminSiteSettings,
} from '../utils/adminFeatureStore'
import {
  DEFAULT_MANAGED_ROUTE_GROUPS,
  isPublicRouteEnabled,
  toPublicRouteVisibility,
} from '~~/shared/types/routes'

export default defineEventHandler(async () => {
  if (!isDatabaseConfigured()) {
    const routes = toPublicRouteVisibility(DEFAULT_MANAGED_ROUTE_GROUPS)

    return {
      site: DEFAULT_SITE_SETTINGS,
      seo: DEFAULT_SEO_SETTINGS,
      routes,
      gallery: {
        enabled: false,
        title: '图册',
        subtitle: '',
        items: [],
      },
    }
  }

  const [site, seo, features, routeGroups] = await Promise.all([
    readAdminSiteSettings(),
    readAdminSeoSettings(),
    readAdminFeatureSettings(),
    readAdminRouteSettings(),
  ])
  const routes = toPublicRouteVisibility(routeGroups)

  return {
    site: {
      siteName: site.siteName,
      siteLogo: site.siteLogo,
      homeHeroImage: site.homeHeroImage,
      homeHeroTitleLine1: site.homeHeroTitleLine1,
      homeHeroTitleLine2: site.homeHeroTitleLine2,
      homeHeroSubtitle: site.homeHeroSubtitle,
      icpNumber: site.icpNumber,
      copyright: site.copyright,
      siteEnabled: site.siteEnabled,
      closedMessage: site.closedMessage,
      maintenanceStatusCode: site.maintenanceStatusCode,
    },
    seo,
    routes,
    gallery: {
      enabled: isPublicRouteEnabled(routes, 'home-gallery'),
      title: features.galleryTitle,
      subtitle: features.gallerySubtitle,
      items: features.galleryItems
        .filter(item => item.enabled)
        .sort((left, right) => left.order - right.order),
    },
  }
})
