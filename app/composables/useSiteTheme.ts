export type SiteThemePreference = 'default' | 'phantom'

const SITE_THEME_COOKIE = 'mayday_site_theme'

function normalizeSiteTheme(value: unknown): SiteThemePreference {
  return value === 'phantom' ? 'phantom' : 'default'
}

export function useSiteTheme() {
  const storedTheme = useCookie<SiteThemePreference>(SITE_THEME_COOKIE, {
    default: () => 'default',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  const siteTheme = useState<SiteThemePreference>('site-theme', () => normalizeSiteTheme(storedTheme.value))
  const themeSwitching = useState<boolean>('site-theme-switching', () => false)
  const isPhantomTheme = computed(() => siteTheme.value === 'phantom')

  function setSiteTheme(value: SiteThemePreference) {
    const nextTheme = normalizeSiteTheme(value)
    siteTheme.value = nextTheme
    storedTheme.value = nextTheme
  }

  function toggleSiteTheme() {
    setSiteTheme(isPhantomTheme.value ? 'default' : 'phantom')
  }

  return {
    siteTheme,
    themeSwitching,
    isPhantomTheme,
    setSiteTheme,
    toggleSiteTheme,
  }
}
