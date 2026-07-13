<script setup lang="ts">
import { isPublicRouteEnabled } from '~~/shared/types/routes'
import { primaryNavigation, siteSections } from '@/utils/siteSections'

const currentYear = new Date().getFullYear()
const { data: siteConfig } = await usePublicSiteConfig()
const footerLinks = computed(() => [
  ...primaryNavigation.filter((item) => {
    const section = siteSections.find(section => section.path === item.path)
    return !section || isPublicRouteEnabled(siteConfig.value.routes, section.routeId)
  }),
  { title: '内容管理', path: '/admin' },
])

const footerCopyright = computed(() => siteConfig.value.site.copyright || `Copyright © ${currentYear} mayday.life`)
const icpNumber = computed(() => siteConfig.value.site.icpNumber)
</script>

<template>
  <footer class="border-t border-[var(--border)] bg-[var(--card)]/88 backdrop-blur-xl">
    <div class="container py-2 lg:py-3">
      <div class="flex min-h-18 flex-col justify-center gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div class="max-w-xl">
          <p class="section-kicker mb-1 text-[10px] leading-none">MAYDAY.LIFE</p>
          <p class="hidden text-sm font-medium tracking-tight text-[var(--text-primary)]">
            把还保留的互动、收藏和文章入口，整理成可以反复回来的地方。
          </p>
          <p class="text-xs text-[var(--text-secondary)] lg:text-[13px]">
            {{ footerCopyright }}
          </p>
          <a
            v-if="icpNumber"
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noreferrer"
            class="mt-1 inline-block text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            {{ icpNumber }}
          </a>
        </div>

        <div class="flex flex-col gap-2 lg:items-end">
          <nav class="hidden flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)] lg:flex">
            <NuxtLink
              v-for="link in footerLinks"
              :key="link.path"
              :to="link.path"
              class="transition-colors hover:text-[var(--text-primary)]"
            >
              {{ link.title }}
            </NuxtLink>
          </nav>

        </div>
      </div>
    </div>
  </footer>
</template>
