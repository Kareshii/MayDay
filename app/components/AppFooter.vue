<script setup lang="ts">
import { primaryNavigation } from '@/utils/siteSections'

const currentYear = new Date().getFullYear()
const footerLinks = [
  ...primaryNavigation,
  { title: '内容管理', path: '/admin' },
]
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
            Copyright © {{ currentYear }} mayday.life
          </p>
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

          <div class="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span>切换主题</span>
            <ColorModeSwitch class="text-[var(--text-primary)]" />
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
