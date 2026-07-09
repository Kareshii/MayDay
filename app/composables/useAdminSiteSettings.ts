import type { Ref } from 'vue'

export type AdminNavigationType = 'internal' | 'external'
export type AdminThumbnailMode = 'contain' | 'longest' | 'cover'
export type AdminSiteSettingSection = 'site' | 'seo' | 'navigation' | 'content'

export interface AdminSiteSettings {
  siteName: string
  siteLogo: string
  homeHeroImage: string
  homeHeroTitleLine1: string
  homeHeroTitleLine2: string
  homeHeroSubtitle: string
  icpNumber: string
  copyright: string
  adminPath: string
  siteEnabled: boolean
  closedMessage: string
  maintenanceStatusCode: number
}

export interface AdminSeoSettings {
  title: string
  description: string
  keywords: string
}

export interface AdminNavigationItem {
  id: string
  title: string
  path: string
  type: AdminNavigationType
  parentId: string
  order: number
  enabled: boolean
}

export interface AdminContentSettings {
  autoFetchRemoteImages: boolean
  filterExternalLinks: boolean
  compressImages: boolean
  imageMaxWidth: number
  imageMaxHeight: number
  thumbnailWidth: number
  thumbnailHeight: number
  thumbnailMode: AdminThumbnailMode
  defaultThumbnail: string
}

export interface AdminFeatureState {
  site: AdminSiteSettings
  seo: AdminSeoSettings
  navigation: AdminNavigationItem[]
  content: AdminContentSettings
}

export function createAdminLocalId(prefix: string) {
  return globalThis.crypto?.randomUUID?.() || `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export async function useAdminSiteSettings(section: AdminSiteSettingSection) {
  const savingSection = ref('')
  const { showSuccessToast, showErrorToast } = useAdminToast()
  const { data, pending, error, refresh } = await useFetch(`/api/admin/features/${section}`)
  const sectionData = data as Ref<Partial<AdminFeatureState> | null>

  async function saveSection(section: AdminSiteSettingSection, payload: unknown) {
    savingSection.value = section

    try {
      await $fetch(`/api/admin/features/${section}`, {
        method: 'PUT',
        body: {
          [section]: payload,
        },
      })
      await refresh()
      showSuccessToast('保存成功')
    } catch (err) {
      showErrorToast('保存失败', getRequestErrorMessage(err, '保存失败'))
    } finally {
      savingSection.value = ''
    }
  }

  watch(error, (value) => {
    if (value) {
      showErrorToast('站点设置加载失败', value.message)
    }
  }, { immediate: true })

  return {
    data: sectionData,
    pending,
    error,
    refresh,
    savingSection,
    saveSection,
  }
}

export function useAdminAccountSettings() {
  const accountSaving = ref(false)
  const { showSuccessToast, showErrorToast } = useAdminToast()

  async function saveAccount(payload: {
    adminUsername: string
    currentPassword: string
    newPassword: string
    newPasswordConfirm: string
  }) {
    if (payload.newPassword !== payload.newPasswordConfirm) {
      showErrorToast('账号更新失败', '两次输入的新密码不一致')
      return
    }

    accountSaving.value = true

    try {
      await $fetch('/api/admin/account', {
        method: 'PUT',
        body: {
          adminUsername: payload.adminUsername,
          currentPassword: payload.currentPassword,
          newPassword: payload.newPassword,
        },
      })
      payload.currentPassword = ''
      payload.newPassword = ''
      payload.newPasswordConfirm = ''
      showSuccessToast('账号已更新')
    } catch (err) {
      showErrorToast('账号更新失败', getRequestErrorMessage(err, '账号更新失败'))
    } finally {
      accountSaving.value = false
    }
  }

  return {
    accountSaving,
    saveAccount,
  }
}
