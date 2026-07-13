<script setup lang="ts">
import type { TableColumn } from '@/components/ui/table'
import type { HomeGalleryItem } from '~~/shared/types/gallery'
import type { ManagedRouteGroup, ManagedRouteItem } from '~~/shared/types/routes'

interface RouteFeatureSettings {
  robotsText: string
  sitemapEnabled: boolean
  sitemapFormat: 'txt' | 'xml'
  baiduPushToken: string
  bingPushToken: string
  searchPushScript: string
  friendLinks: unknown[]
  galleryEnabled: boolean
  galleryTitle: string
  gallerySubtitle: string
  galleryItems: HomeGalleryItem[]
}

definePageMeta({
  layout: 'admin',
})

useSeoMeta({
  title: '路由管理',
  description: '集中管理前台页面与首页区块的展示状态。',
})

const routeColumns = [
  { prop: 'route', label: '子路由', minWidth: 300 },
  { prop: 'path', label: '路径', minWidth: 220 },
  { prop: 'kind', label: '类型', width: 120 },
  { prop: 'status', label: '展示状态', width: 160, align: 'center' },
] satisfies readonly TableColumn[]

const groups = ref<ManagedRouteGroup[]>([])
const selectedGroupId = ref('')
const selectedRouteId = ref('')
const savingRouteId = ref('')
const savingGallerySettings = ref(false)
const { showSuccessToast, showErrorToast } = useAdminToast()

const { data, pending, error, refresh } = await useFetch<{ routes: ManagedRouteGroup[] }>('/api/admin/features/routes')
const {
  data: featureData,
  pending: featurePending,
  error: featureError,
  refresh: refreshFeatures,
} = await useFetch<{ features: RouteFeatureSettings }>('/api/admin/features/features')

const features = reactive<RouteFeatureSettings>({
  robotsText: '',
  sitemapEnabled: true,
  sitemapFormat: 'txt',
  baiduPushToken: '',
  bingPushToken: '',
  searchPushScript: '',
  friendLinks: [],
  galleryEnabled: true,
  galleryTitle: '图册',
  gallerySubtitle: '',
  galleryItems: [],
})

function applyFeatures(value: RouteFeatureSettings) {
  Object.assign(features, {
    ...value,
    friendLinks: Array.isArray(value.friendLinks) ? [...value.friendLinks] : [],
    galleryItems: Array.isArray(value.galleryItems)
      ? value.galleryItems.map(item => ({
          ...item,
          images: Array.isArray(item.images) ? [...item.images] : [],
        }))
      : [],
  })
}

watch(data, (value) => {
  groups.value = value?.routes?.map(group => ({
    ...group,
    children: group.children.map(route => ({ ...route })),
  })) || []

  if (!groups.value.some(group => group.id === selectedGroupId.value)) {
    selectedGroupId.value = groups.value[0]?.id || ''
  }

  if (selectedRouteId.value && !groups.value.some(group => group.children.some(route => route.id === selectedRouteId.value))) {
    selectedRouteId.value = ''
  }
}, { immediate: true })

watch(featureData, (value) => {
  if (value?.features) {
    applyFeatures(value.features)
  }
}, { immediate: true })

watch(error, (value) => {
  if (value) {
    showErrorToast('路由加载失败', value.message)
  }
}, { immediate: true })

watch(featureError, (value) => {
  if (value) {
    showErrorToast('首页图册设置加载失败', value.message)
  }
}, { immediate: true })

const selectedGroup = computed(() => {
  return groups.value.find(group => group.id === selectedGroupId.value) || groups.value[0]
})
const selectedRoute = computed(() => {
  return selectedGroup.value?.children.find(route => route.id === selectedRouteId.value)
})
const displayedRoutes = computed(() => selectedRoute.value ? [selectedRoute.value] : selectedGroup.value?.children || [])
const routeCount = computed(() => groups.value.reduce((total, group) => total + group.children.length, 0))
const enabledCount = computed(() => groups.value.reduce(
  (total, group) => total + group.children.filter(route => route.enabled).length,
  0,
))
const enabledGalleryItems = computed(() => features.galleryItems.filter(item => item.enabled).length)
const hiddenGalleryItems = computed(() => features.galleryItems.length - enabledGalleryItems.value)

function getRootRoutes(group: ManagedRouteGroup) {
  return group.children.filter(route => !route.parentId)
}

function getChildRoutes(group: ManagedRouteGroup, parentId: string) {
  return group.children.filter(route => route.parentId === parentId)
}

function selectGroup(groupId: string) {
  selectedGroupId.value = groupId
  selectedRouteId.value = ''
}

function selectRoute(groupId: string, routeId: string) {
  selectedGroupId.value = groupId
  selectedRouteId.value = routeId
}

async function updateRouteVisibility(route: ManagedRouteItem, enabled: boolean) {
  if (savingRouteId.value || route.enabled === enabled) {
    return
  }

  const previousValue = route.enabled
  route.enabled = enabled
  savingRouteId.value = route.id

  try {
    const response = await $fetch<{ routes: ManagedRouteGroup[] }>('/api/admin/features/routes', {
      method: 'PUT',
      body: {
        routes: groups.value,
      },
    })

    groups.value = response.routes.map(group => ({
      ...group,
      children: group.children.map(item => ({ ...item })),
    }))
    if (route.id === 'home-gallery') {
      features.galleryEnabled = enabled
    }
    showSuccessToast(enabled ? '路由已显示' : '路由已隐藏', route.title)
  } catch (err) {
    route.enabled = previousValue
    showErrorToast('保存失败', getRequestErrorMessage(err, '路由状态保存失败'))
  } finally {
    savingRouteId.value = ''
  }
}

async function saveGallerySettings() {
  if (savingGallerySettings.value || featurePending.value) {
    return
  }

  savingGallerySettings.value = true

  try {
    const response = await $fetch<{ features: RouteFeatureSettings }>('/api/admin/features/features', {
      method: 'PUT',
      body: {
        features: {
          ...features,
          friendLinks: [...features.friendLinks],
          galleryItems: features.galleryItems.map(item => ({
            ...item,
            images: [...item.images],
          })),
        },
      },
    })

    applyFeatures(response.features)
    showSuccessToast('首页图册设置已保存')
  } catch (err) {
    showErrorToast('保存失败', getRequestErrorMessage(err, '首页图册设置保存失败'))
  } finally {
    savingGallerySettings.value = false
  }
}

async function refreshAll() {
  await Promise.all([refresh(), refreshFeatures()])
}

const headerActions = computed(() => [
  {
    label: '刷新',
    icon: 'lucide:refresh-cw',
    variant: 'outline' as const,
    disabled: pending.value || featurePending.value || Boolean(savingRouteId.value) || savingGallerySettings.value,
    onClick: refreshAll,
  },
])
</script>

<template>
  <div class="cms-page space-y-5">
    <AdminPageHeader title="路由管理" :actions="headerActions" />

    <AdminSiteSettingsNav />

    <section class="overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)]">
      <div class="grid min-h-[34rem] lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside class="border-b border-[var(--border-soft)] bg-[var(--surface-low)]/55 p-3 lg:border-b-0 lg:border-r" aria-label="路由树">
          <div class="flex items-center gap-2 px-2 py-2 text-xs font-semibold text-[var(--text-secondary)]">
            <Icon name="lucide:network" class="size-4" />
            前台路由
          </div>

          <div v-if="pending" class="flex items-center gap-2 px-3 py-6 text-xs text-[var(--text-secondary)]">
            <Icon name="lucide:loader-circle" class="size-4 animate-spin text-[var(--primary)]" />
            正在加载
          </div>

          <nav v-else class="mt-1 space-y-1" role="tree">
            <div v-for="group in groups" :key="group.id" role="treeitem" :aria-expanded="true">
              <UiButton
                type="button"
                :variant="selectedGroup?.id === group.id ? 'secondary' : 'ghost'"
                size="sm"
                class="w-full justify-start gap-2"
                @click="selectGroup(group.id)"
              >
                <Icon :name="group.icon" class="size-4 shrink-0" />
                <span class="min-w-0 truncate">{{ group.title }}</span>
                <span class="ml-auto text-xs font-medium tabular-nums text-[var(--text-muted)]">{{ group.children.length }}</span>
              </UiButton>

              <div class="ml-5 border-l border-[var(--border-soft)] py-1 pl-3" role="group">
                <div v-for="route in getRootRoutes(group)" :key="route.id">
                  <UiButton
                    type="button"
                    :variant="selectedRouteId === route.id ? 'secondary' : 'ghost'"
                    size="sm"
                    class="w-full justify-start gap-2"
                    @click="selectRoute(group.id, route.id)"
                  >
                    <Icon
                      :name="route.enabled ? 'lucide:circle-check' : 'lucide:circle-minus'"
                      :class="['size-3.5 shrink-0', route.enabled ? 'text-[var(--success)]' : 'text-[var(--text-muted)]']"
                    />
                    <span class="min-w-0 truncate">{{ route.title }}</span>
                  </UiButton>

                  <div v-if="getChildRoutes(group, route.id).length" class="ml-5 border-l border-[var(--border-soft)] py-1 pl-3" role="group">
                    <UiButton
                      v-for="child in getChildRoutes(group, route.id)"
                      :key="child.id"
                      type="button"
                      :variant="selectedRouteId === child.id ? 'secondary' : 'ghost'"
                      size="sm"
                      class="w-full justify-start gap-2"
                      @click="selectRoute(group.id, child.id)"
                    >
                      <Icon
                        :name="child.enabled ? 'lucide:circle-check' : 'lucide:circle-minus'"
                        :class="['size-3.5 shrink-0', child.enabled ? 'text-[var(--success)]' : 'text-[var(--text-muted)]']"
                      />
                      <span class="min-w-0 truncate">{{ child.title }}</span>
                    </UiButton>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </aside>

        <div class="min-w-0">
          <header class="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-[var(--border-soft)] px-5 py-3.5">
            <div class="min-w-0">
              <h2 class="truncate text-sm font-semibold text-[var(--text-primary)]">
                {{ selectedRoute?.title || selectedGroup?.title || '路由列表' }}
              </h2>
              <p class="mt-1 text-xs text-[var(--text-secondary)]">
                {{ selectedRoute?.description || `共 ${routeCount} 项，${enabledCount} 项正在展示` }}
              </p>
            </div>
            <span class="inline-flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
              <Icon :name="savingRouteId ? 'lucide:loader-circle' : 'lucide:circle-check'" :class="['size-4', savingRouteId ? 'animate-spin text-[var(--warning)]' : 'text-[var(--success)]']" />
              {{ savingRouteId ? '保存中' : '已同步' }}
            </span>
          </header>

          <div v-if="selectedRoute?.id === 'home-gallery'" class="min-h-[28rem] p-5">
            <div v-if="featurePending" class="max-w-xl space-y-4" aria-label="正在加载首页图册设置">
              <UiSkeleton class="h-10 w-full" />
              <UiSkeleton class="h-10 w-full" />
              <UiSkeleton class="h-20 w-full" />
            </div>

            <UiAlert v-else-if="featureError" variant="destructive" class="max-w-xl">
              <Icon name="lucide:circle-alert" />
              <UiAlertTitle>首页图册设置加载失败</UiAlertTitle>
              <UiAlertDescription>{{ featureError.message }}</UiAlertDescription>
              <UiAlertAction>
                <UiButton variant="outline" size="sm" @click="refreshFeatures">
                  <Icon name="lucide:refresh-cw" class="size-4" />
                  重试
                </UiButton>
              </UiAlertAction>
            </UiAlert>

            <div v-else class="max-w-xl space-y-4">
              <UiLabel class="block space-y-2">
                <span class="text-xs font-medium text-[var(--text-secondary)]">区块标题</span>
                <UiInput
                  v-model="features.galleryTitle"
                  :disabled="savingGallerySettings"
                  placeholder="例如：图册"
                  class="max-w-none"
                  @change="saveGallerySettings"
                />
              </UiLabel>

              <UiLabel class="block space-y-2">
                <span class="text-xs font-medium text-[var(--text-secondary)]">区块副标题</span>
                <UiInput
                  v-model="features.gallerySubtitle"
                  :disabled="savingGallerySettings"
                  placeholder="显示在标题下方"
                  class="max-w-none"
                  @change="saveGallerySettings"
                />
              </UiLabel>

              <UiSeparator />

              <div class="space-y-2">
                <p class="text-xs font-medium text-[var(--text-secondary)]">展示状态</p>
                <UiLabel class="flex cursor-pointer items-center gap-3 py-2">
                  <UiCheckbox
                    :model-value="selectedRoute.enabled"
                    :disabled="Boolean(savingRouteId) || savingGallerySettings"
                    @update:model-value="updateRouteVisibility(selectedRoute, $event)"
                  />
                  <span class="min-w-0">
                    <span class="block text-sm font-medium text-[var(--text-primary)]">
                      {{ selectedRoute.enabled ? '首页图册区块已启用' : '首页图册区块已隐藏' }}
                    </span>
                    <span class="mt-1 block text-xs text-[var(--text-secondary)]">
                      {{ enabledGalleryItems }} 个显示，{{ hiddenGalleryItems }} 个隐藏
                    </span>
                  </span>
                </UiLabel>
              </div>

              <UiSeparator />

              <UiButton as="NuxtLink" to="/admin/gallery" variant="outline">
                <Icon name="lucide:images" class="size-4" />
                管理图册内容
              </UiButton>
            </div>
          </div>

          <UiTable
            v-else
            :columns="routeColumns"
            :items="displayedRoutes"
            row-key="id"
            :loading="pending"
            :error="error?.message"
            empty-text="该分组暂无子路由"
            @retry="refresh"
          >
            <template #cell-route="{ item }">
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-[var(--text-primary)]">{{ item.title }}</p>
                <p class="mt-1 truncate text-xs text-[var(--text-secondary)]">{{ item.description }}</p>
              </div>
            </template>

            <template #cell-path="{ item }">
              <code class="rounded bg-[var(--surface-low)] px-2 py-1 text-xs text-[var(--text-secondary)]">{{ item.path }}</code>
            </template>

            <template #cell-kind="{ item }">
              <UiBadge variant="secondary" class="normal-case tracking-[0]">
                {{ item.kind === 'page' ? '页面' : '区块' }}
              </UiBadge>
            </template>

            <template #cell-status="{ item }">
              <label class="inline-flex cursor-pointer items-center justify-center gap-3">
                <span class="text-xs font-medium" :class="item.enabled ? 'text-[var(--success)]' : 'text-[var(--text-secondary)]'">
                  {{ item.enabled ? '显示' : '隐藏' }}
                </span>
                <UiCheckbox
                  :model-value="item.enabled"
                  :disabled="Boolean(savingRouteId)"
                  :aria-label="`${item.title}展示状态`"
                  @update:model-value="updateRouteVisibility(item, $event)"
                />
              </label>
            </template>
          </UiTable>
        </div>
      </div>
    </section>
  </div>
</template>
