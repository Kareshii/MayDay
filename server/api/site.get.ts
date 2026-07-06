import { isDatabaseConfigured } from '../database/client'
import {
  DEFAULT_SEO_SETTINGS,
  DEFAULT_SITE_SETTINGS,
  readAdminFeatureState,
} from '../utils/adminFeatureStore'

export default defineEventHandler(async () => {
  if (!isDatabaseConfigured()) {
    return {
      site: DEFAULT_SITE_SETTINGS,
      seo: DEFAULT_SEO_SETTINGS,
    }
  }

  const state = await readAdminFeatureState()

  return {
    site: {
      siteName: state.site.siteName,
      siteLogo: state.site.siteLogo,
      homeHeroTitleLine1: state.site.homeHeroTitleLine1,
      homeHeroTitleLine2: state.site.homeHeroTitleLine2,
      homeHeroSubtitle: state.site.homeHeroSubtitle,
      siteEnabled: state.site.siteEnabled,
      closedMessage: state.site.closedMessage,
    },
    seo: state.seo,
  }
})
