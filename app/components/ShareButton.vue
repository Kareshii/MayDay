<script setup lang="ts">
interface Props {
  title: string
  url?: string
  text?: string
}

const props = defineProps<Props>()

const share = async () => {
  if (!import.meta.client) {
    return
  }

  const shareData = {
    title: props.title,
    text: props.text || props.title,
    url: props.url || window.location.href,
  }

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(shareData)
    } catch (err) {
      console.log('分享失败', err)
    }
  } else {
    // 降级处理：复制到剪贴板
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareData.url)
        alert('链接已复制到剪贴板')
        return
      }

      alert('当前环境不支持系统分享和剪贴板复制')
    } catch (err) {
      console.log('复制失败', err)
    }
  }
}
</script>

<template>
  <button
    @click="share"
    class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 active:scale-95"
  >
    <Icon name="lucide:share-2" class="size-4" />
    <span>分享</span>
  </button>
</template>
