<script setup lang="ts">
interface Props {
  song: string
  content: string
  mood: string
}

const props = defineProps<Props>()

const cardRef = ref<HTMLElement>()
const showModal = ref(false)

const openModal = () => {
  showModal.value = true
  document.body.style.overflow = 'hidden'
}

const closeModal = () => {
  showModal.value = false
  document.body.style.overflow = ''
}

const shareCard = async () => {
  const shareData = {
    title: `Mayday - ${props.song}`,
    text: `${props.content}\n\n—— ${props.song} #MaydayLife`,
    url: window.location.href
  }

  try {
    // 首先尝试使用 Web Share API
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share(shareData)
    } 
    // 其次尝试使用 Clipboard API
    else if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareData.text)
      alert('歌词已复制到剪贴板！')
    } 
    // 兜底方案：创建临时文本框
    else {
      const textArea = document.createElement('textarea')
      textArea.value = shareData.text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        alert('歌词已复制到剪贴板！')
      } catch (e) {
        alert('复制失败，请手动复制歌词')
      }
      document.body.removeChild(textArea)
    }
  } catch (err) {
    console.error('Error sharing:', err)
    alert('分享失败，请稍后再试')
  }
}
</script>

<template>
  <BaseCard 
    :hoverable="true"
    :clickable="true"
    padding="none"
    class="overflow-hidden cursor-pointer"
    @click="openModal"
  >
    <div 
      ref="cardRef"
      class="relative p-8 min-h-[300px] flex flex-col justify-between gradient-blue-purple"
    >
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16" />
        <div class="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-20 translate-y-20" />
      </div>

      <!-- Content -->
      <div class="relative z-10">
        <div class="mb-6">
          <Icon name="lucide:music" class="size-8 text-white/80 mb-4" />
          <h3 class="text-2xl font-bold text-white mb-4">
            {{ song }}
          </h3>
          <p class="text-white/90 text-lg leading-relaxed whitespace-pre-line line-clamp-4">
            {{ content }}
          </p>
        </div>

        <div class="flex items-center justify-between">
          <span class="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm">
            {{ mood }}
          </span>
          <button
            @click.stop="shareCard"
            class="p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full transition-colors"
            title="分享歌词"
          >
            <Icon name="lucide:share-2" class="size-5 text-white" />
          </button>
        </div>
      </div>

      <!-- Watermark -->
      <div class="absolute bottom-4 right-4 text-white/40 text-xs">
        mayday.life
      </div>

      <!-- Click to view hint -->
      <div class="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
        点击查看完整歌词
      </div>
    </div>
  </BaseCard>

  <!-- Lyrics Modal -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" @click="closeModal">
        <div 
          class="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
          @click.stop
        >
          <!-- Modal Header -->
          <div class="p-6 border-b border-white/10 flex justify-between items-start bg-gradient-to-r from-purple-900/20 to-blue-900/20">
            <div>
              <h2 class="text-2xl font-bold text-white mb-1">{{ song }}</h2>
              <span class="inline-block px-3 py-1 text-xs rounded-full bg-white/10 text-white">{{ mood }}</span>
            </div>
            <button 
              @click="closeModal"
              class="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
            >
              <Icon name="lucide:x" class="size-6" />
            </button>
          </div>

          <!-- Modal Content (Scrollable) -->
          <div class="p-8 overflow-y-auto custom-scrollbar">
            <div class="prose prose-invert max-w-none text-center">
              <p class="whitespace-pre-line text-lg leading-relaxed text-gray-200 font-medium">
                {{ content }}
              </p>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="p-4 border-t border-white/10 bg-[#020617]/50 flex justify-center gap-4">
            <button 
              @click="shareCard"
              class="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-sm font-bold transition-colors"
            >
              <Icon name="lucide:share-2" class="size-4" />
              分享歌词
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

