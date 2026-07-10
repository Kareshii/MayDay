<script setup lang="ts">
const route = useRoute()

interface SiteSettingsNavItem {
  label: string
  to: string
  icon: string
  exact?: boolean
}

const settingsItems: SiteSettingsNavItem[] = [
  { label: '全局', to: '/admin/features/site', icon: 'lucide:globe-2', exact: true },
  { label: 'SEO', to: '/admin/features/site/seo', icon: 'lucide:search' },
  { label: '导航', to: '/admin/features/site/navigation', icon: 'lucide:menu' },
  { label: '内容', to: '/admin/features/site/content', icon: 'lucide:image' },
  { label: '账号', to: '/admin/features/site/account', icon: 'lucide:shield-user' },
]

function isActive(item: SiteSettingsNavItem) {
  return item.exact
    ? route.path === item.to
    : route.path === item.to || route.path.startsWith(`${item.to}/`)
}
</script>

<template>
  <nav class="overflow-x-auto border-b border-[var(--border-soft)]" aria-label="站点设置">
    <div class="flex min-w-max items-center gap-1 px-1">
      <NuxtLink
        v-for="item in settingsItems"
        :key="item.to"
        :to="item.to"
        class="relative inline-flex h-11 items-center gap-2 px-3 text-sm font-medium text-[var(--text-secondary)] outline-none transition-colors hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)]"
        :class="isActive(item) ? 'text-[var(--primary)]' : ''"
        :aria-current="isActive(item) ? 'page' : undefined"
      >
        <Icon :name="item.icon" class="size-4" />
        <span>{{ item.label }}</span>
        <span
          v-if="isActive(item)"
          class="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[var(--primary)]"
          aria-hidden="true"
        />
      </NuxtLink>
    </div>
  </nav>
</template>
