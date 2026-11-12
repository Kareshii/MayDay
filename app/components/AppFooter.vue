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

const siteName = computed(() => siteConfig.value.site.siteName || 'mayday.life')
const footerCopyright = computed(() => siteConfig.value.site.copyright || `Copyright © ${currentYear} mayday.life`)
const icpNumber = computed(() => siteConfig.value.site.icpNumber)
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer__frame">
      <div class="site-footer__main">
        <NuxtLink to="/" class="site-footer__wordmark">{{ siteName }}</NuxtLink>
        <nav class="site-footer__links" aria-label="页脚导航">
          <NuxtLink v-for="link in footerLinks" :key="link.path" :to="link.path">
            {{ link.title }}
            <Icon name="lucide:arrow-up-right" class="size-4" />
          </NuxtLink>
        </nav>
      </div>
      <div class="site-footer__colophon">
        <p>{{ footerCopyright }}</p>
        <a
          v-if="icpNumber"
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noreferrer"
        >
          {{ icpNumber }}
        </a>
      </div>
    </div>
  </footer>
</template>
