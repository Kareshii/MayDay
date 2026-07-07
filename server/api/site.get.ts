import { isDatabaseConfigured } from '../database/client'
import {
  DEFAULT_SEO_SETTINGS,
  DEFAULT_SITE_SETTINGS,
  readAdminSeoSettings,
  readAdminSiteSettings,
} from '../utils/adminFeatureStore'

export default defineEventHandler(async () => {
  if (!isDatabaseConfigured()) {
    return {
      site: DEFAULT_SITE_SETTINGS,
      seo: DEFAULT_SEO_SETTINGS,
    }
  }

  const [site, seo] = await Promise.all([
    readAdminSiteSettings(),
    readAdminSeoSettings(),
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
    },
    seo,
  }
})
