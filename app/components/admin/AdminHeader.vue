<script setup lang="ts">
const route = useRoute()
const loggingOut = ref(false)

const emit = defineEmits<{
  toggle: []
}>()

const pageMeta = computed(() => {
  if (route.path === '/admin') {
    return {
      title: '仪表盘',
      description: '查看 CMS 指标和最近更新的文章。',
    }
  }

  if (route.path === '/admin/articles') {
    return {
      title: '文章管理',
      description: '搜索、筛选和管理数据库中的文章。',
    }
  }

  if (route.path === '/admin/articles/new') {
    return {
      title: '新建文章',
      description: '使用 TinyMCE 编写并发布新文章。',
    }
  }

  if (route.path.startsWith('/admin/articles/')) {
    return {
      title: '编辑文章',
      description: '更新标题、封面、摘要和富文本正文。',
    }
  }

  if (route.path === '/admin/settings') {
    return {
      title: '设置',
      description: '查看当前后台运行时与数据库配置。',
    }
  }

  return {
    title: '后台',
    description: 'CMS 工作区',
  }
})

async function signOut() {
  loggingOut.value = true

  try {
    await $fetch('/api/admin/logout', {
      method: 'POST',
    })

    await navigateTo('/admin/login')
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg-primary)]/88 backdrop-blur-xl">
    <div class="flex h-20 items-center gap-4 px-4 lg:px-8">
      <UiButton variant="ghost" size="icon" class="lg:hidden" @click="emit('toggle')">
        <Icon name="lucide:menu" class="size-5" />
      </UiButton>

      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
          后台
        </p>
        <h1 class="mt-1 text-lg font-semibold text-[var(--text-primary)]">
          {{ pageMeta.title }}
        </h1>
        <p class="text-sm text-[var(--text-secondary)]">
          {{ pageMeta.description }}
        </p>
      </div>

      <div class="ml-auto flex items-center gap-3">
        <NuxtLink to="/" class="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
          查看前台
        </NuxtLink>
        <UiButton variant="outline" size="sm" :disabled="loggingOut" @click="signOut">
          {{ loggingOut ? '退出中...' : '退出登录' }}
        </UiButton>
        <ColorModeSwitch class="text-[var(--text-primary)]" />
      </div>
    </div>
  </header>
</template>
