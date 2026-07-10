import { isDatabaseConfigured } from '../database/client'
import {
  DEFAULT_SEO_SETTINGS,
  DEFAULT_SITE_SETTINGS,
  readAdminFeatureSettings,
  readAdminSeoSettings,
  readAdminSiteSettings,
} from '../utils/adminFeatureStore'

export default defineEventHandler(async () => {
  if (!isDatabaseConfigured()) {
    return {
      site: DEFAULT_SITE_SETTINGS,
      seo: DEFAULT_SEO_SETTINGS,
      gallery: {
        enabled: false,
        title: '图册',
        subtitle: '',
        items: [],
      },
    }
  }

  const [site, seo, features] = await Promise.all([
    readAdminSiteSettings(),
    readAdminSeoSettings(),
    readAdminFeatureSettings(),
  ])

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
    gallery: {
      enabled: features.galleryEnabled,
      title: features.galleryTitle,
      subtitle: features.gallerySubtitle,
      items: features.galleryItems
        .filter(item => item.enabled)
        .sort((left, right) => left.order - right.order),
    },
  }
})
