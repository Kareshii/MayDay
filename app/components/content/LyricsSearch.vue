<script setup lang="ts">
const { searchLyrics } = useMaydayData()

const searchQuery = ref('')
const results = computed(() => searchLyrics(searchQuery.value))
const selectedLyric = ref<any>(null)

const highlightText = (text: string, query: string) => {
  if (!query) return text
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-300 dark:bg-yellow-600">$1</mark>')
}

const openModal = (lyric: any) => {
  selectedLyric.value = lyric
  document.body.style.overflow = 'hidden'
}

const closeModal = () => {
  selectedLyric.value = null
  document.body.style.overflow = ''
}

const shareLyric = async () => {
  if (!selectedLyric.value) return
  
  const shareData = {
    title: `Mayday - ${selectedLyric.value.song}`,
    text: `${selectedLyric.value.content}\n\n—— ${selectedLyric.value.song} #MaydayLife`,
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
  <div class="w-full max-w-4xl mx-auto">
    <!-- Search Input -->
    <div class="relative mb-8">
      <Icon 
        name="lucide:search" 
        class="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400"
      />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索歌词或歌名..."
        class="w-full pl-12 pr-4 py-4 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-colors text-lg"
      />
    </div>

    <!-- Results -->
    <div v-if="searchQuery" class="mb-4 text-sm text-gray-600 dark:text-gray-400">
      找到 <span class="font-bold text-blue-600 dark:text-blue-400">{{ results.length }}</span> 条结果
    </div>

    <div class="grid md:grid-cols-2 gap-6 lg:gap-8">
      <BaseCard 
        v-for="lyric in results" 
        :key="lyric.id"
        :hoverable="true"
        :clickable="true"
        padding="md"
        class="cursor-pointer group"
        @click="openModal(lyric)"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <h3 class="text-xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
              {{ lyric.song }}
            </h3>
            <p 
              class="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed line-clamp-3"
              v-html="highlightText(lyric.content, searchQuery)"
            />
            <div class="mt-3 flex items-center justify-between">
              <span 
                class="inline-block px-3 py-1 text-xs rounded-full"
                :class="{
                  'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300': lyric.mood === '励志',
                  'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300': lyric.mood === '温暖',
                  'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300': lyric.mood === '思念',
                  'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300': lyric.mood === '治愈',
                  'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300': lyric.mood === '深沉',
                  'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300': lyric.mood === '哲思',
                  'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300': lyric.mood === '怀旧',
                  'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300': lyric.mood === '甜蜜',
                }"
              >
                {{ lyric.mood }}
              </span>
              <Icon name="lucide:text-quote" class="size-5 text-gray-400 dark:text-gray-500 group-hover:text-cyan-500 transition-colors" />
            </div>
          </div>
        </div>
      </BaseCard>

      <div 
        v-if="results.length === 0 && searchQuery"
        class="text-center py-16 col-span-2"
      >
        <Icon name="lucide:music-off" class="size-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <p class="text-gray-500 dark:text-gray-400">没有找到相关歌词</p>
      </div>
    </div>

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
        <div v-if="selectedLyric" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" @click="closeModal">
          <div 
            class="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            @click.stop
          >
            <!-- Modal Header -->
            <div class="p-6 border-b border-white/10 flex justify-between items-start bg-gradient-to-r from-cyan-900/20 to-blue-900/20">
              <div>
                <h2 class="text-2xl font-bold text-white mb-2">{{ selectedLyric.song }}</h2>
                <span 
                  class="inline-block px-3 py-1 text-xs rounded-full"
                  :class="{
                    'bg-blue-500/20 text-blue-300': selectedLyric.mood === '励志',
                    'bg-pink-500/20 text-pink-300': selectedLyric.mood === '温暖',
                    'bg-purple-500/20 text-purple-300': selectedLyric.mood === '思念',
                    'bg-green-500/20 text-green-300': selectedLyric.mood === '治愈',
                    'bg-gray-500/20 text-gray-300': selectedLyric.mood === '深沉',
                    'bg-orange-500/20 text-orange-300': selectedLyric.mood === '哲思',
                    'bg-yellow-500/20 text-yellow-300': selectedLyric.mood === '怀旧',
                    'bg-red-500/20 text-red-300': selectedLyric.mood === '甜蜜',
                  }"
                >
                  {{ selectedLyric.mood }}
                </span>
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
                  {{ selectedLyric.content }}
                </p>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="p-4 border-t border-white/10 bg-[#020617]/50 flex justify-center gap-4">
              <button 
                @click="shareLyric"
                class="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full text-sm font-bold transition-colors"
              >
                <Icon name="lucide:share-2" class="size-4" />
                分享歌词
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

