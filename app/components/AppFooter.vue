<script setup lang="ts">
import { primaryNavigation } from '@/utils/siteSections'

const currentYear = new Date().getFullYear()
const footerLinks = [
  ...primaryNavigation.filter(link => link.path !== '/quiz').slice(0, 6),
  { title: '内容管理', path: '/admin' },
]
</script>

<template>
  <footer class="border-t border-[var(--border)] bg-[var(--card)]/88 backdrop-blur-xl">
    <div class="site-container py-8">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div class="max-w-xl">
          <p class="section-kicker mb-3">MAYDAY.LIFE</p>
          <p class="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            把那些歌、那些现场、那些一起唱过的夜晚，整理成可以反复回来的地方。
          </p>
          <p class="mt-3 text-sm text-[var(--text-secondary)]">
            Copyright © {{ currentYear }} mayday.life
          </p>
        </div>

        <div class="flex flex-col gap-4 lg:items-end">
          <nav class="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--text-secondary)]">
            <NuxtLink
              v-for="link in footerLinks"
              :key="link.path"
              :to="link.path"
              class="transition-colors hover:text-[var(--text-primary)]"
            >
              {{ link.title }}
            </NuxtLink>
          </nav>

          <div class="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
            <span>切换主题</span>
            <ColorModeSwitch class="text-[var(--text-primary)]" />
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
