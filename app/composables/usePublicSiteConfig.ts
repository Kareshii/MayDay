import type { HomeGallerySettings } from '~~/shared/types/gallery'
import {
  DEFAULT_MANAGED_ROUTE_GROUPS,
  toPublicRouteVisibility,
  type PublicRouteVisibility,
} from '~~/shared/types/routes'

export interface PublicSiteConfig {
  site: {
    siteName: string
    siteLogo: string
    homeHeroImage: string
    homeHeroTitleLine1: string
    homeHeroTitleLine2: string
    homeHeroSubtitle: string
    icpNumber: string
    copyright: string
    siteEnabled: boolean
    closedMessage: string
    maintenanceStatusCode: number
  }
  seo: {
    title: string
    description: string
    keywords: string
  }
  routes: PublicRouteVisibility[]
  gallery: HomeGallerySettings
}

export function usePublicSiteConfig() {
  return useFetch<PublicSiteConfig>('/api/site', {
    key: 'public-site-config',
    default: () => ({
      site: {
        siteName: 'mayday.life',
        siteLogo: '',
        homeHeroImage: '/cover.jpg',
        homeHeroTitleLine1: 'Hi，Kareshi',
        homeHeroTitleLine2: '继续唱。',
        homeHeroSubtitle: '星星在闪烁，你会怎么说。',
        icpNumber: '',
        copyright: 'Copyright © mayday.life',
        siteEnabled: true,
        closedMessage: '网站维护中，请稍后再访问。',
        maintenanceStatusCode: 503,
      },
      seo: {
        title: 'mayday.life',
        description: '五月天档案、文章和互动页面。',
        keywords: 'mayday, 五月天, blog',
      },
      routes: toPublicRouteVisibility(DEFAULT_MANAGED_ROUTE_GROUPS),
      gallery: {
        enabled: false,
        title: '图册',
        subtitle: '',
        items: [],
      },
    }),
  })
}
