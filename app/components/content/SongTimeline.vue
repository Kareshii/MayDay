<script setup lang="ts">
const { songsByYear, topSongs } = useMaydayData()

const viewMode = ref<'timeline' | 'popular'>('timeline')
const votes = ref<Record<number, number>>({})

// Initialize votes from localStorage
onMounted(() => {
  const savedVotes = localStorage.getItem('mayday-song-votes')
  if (savedVotes) {
    votes.value = JSON.parse(savedVotes)
  }
})

const vote = (songId: number) => {
  if (!votes.value[songId]) {
    votes.value[songId] = 0
  }
  votes.value[songId]++
  localStorage.setItem('mayday-song-votes', JSON.stringify(votes.value))
}

const hasVoted = (songId: number) => {
  return votes.value[songId] && votes.value[songId] > 0
}

const getTotalVotes = (song: any) => {
  return song.votes + (votes.value[song.id] || 0)
}

const years = computed(() => Object.keys(songsByYear.value).sort((a, b) => Number(b) - Number(a)))

// Search Logic
const searchQuery = ref('')
const searchResults = computed(() => {
  if (!searchQuery.value) return []
  
  const query = searchQuery.value.toLowerCase()
  const allSongs = Object.values(songsByYear.value).flat()
  
  return allSongs.filter(song => 
    song.title.toLowerCase().includes(query) || 
    song.lyrics.toLowerCase().includes(query)
  )
})

// Lyrics Modal
const selectedSong = ref<any>(null)

const openLyrics = (song: any) => {
  selectedSong.value = song
  document.body.style.overflow = 'hidden' // Prevent background scrolling
}

const closeLyrics = () => {
  selectedSong.value = null
  document.body.style.overflow = ''
}
</script>

<template>
  <div class="w-full">
    <!-- Header Controls -->
    <div class="flex flex-col md:flex-row gap-6 mb-8 justify-between items-center">
      <!-- View Mode Switcher -->
      <div class="flex gap-4 p-1 bg-gray-200 dark:bg-gray-800 rounded-xl w-fit">
        <button
          @click="viewMode = 'timeline'"
          class="px-6 py-2 rounded-lg font-medium transition-all"
          :class="viewMode === 'timeline' 
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md' 
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'"
        >
          时光机
        </button>
        <button
          @click="viewMode = 'popular'"
          class="px-6 py-2 rounded-lg font-medium transition-all"
          :class="viewMode === 'popular' 
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md' 
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'"
        >
          热门榜单
        </button>
      </div>

      <!-- Search Bar -->
      <div class="relative w-full md:w-96 group">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon name="lucide:search" class="size-5 text-gray-400 group-focus-within:text-cyan-500 transition-colors" />
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索歌名或歌词..."
          class="block w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all shadow-sm group-hover:shadow-md text-gray-900 dark:text-gray-100 placeholder-gray-400"
        />
        <div v-if="searchQuery" class="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" @click="searchQuery = ''">
          <Icon name="lucide:x" class="size-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
        </div>
      </div>
    </div>

    <!-- Search Results View -->
    <div v-if="searchQuery" class="space-y-8">
      <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400 px-1">
        <Icon name="lucide:search" class="size-4" />
        <span>Found {{ searchResults.length }} results for "{{ searchQuery }}"</span>
      </div>

      <div v-if="searchResults.length > 0" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        <BaseCard
          v-for="song in searchResults"
          :key="song.id"
          :hoverable="true"
          :clickable="true"
          padding="none"
          @click="openLyrics(song)"
          class="group"
        >
          <div class="image-zoom">
            <img 
              :src="song.cover" 
              :alt="song.title"
              class="w-full aspect-square object-cover"
            />
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
              <div class="bg-white/20 p-3 rounded-full backdrop-blur-md border border-white/30">
                <Icon name="lucide:text-quote" class="size-6 text-white" />
              </div>
            </div>
          </div>
          <div class="p-5">
            <h3 class="text-lg font-bold mb-1 text-white group-hover:text-cyan-400 transition-colors">
              {{ song.title }}
            </h3>
            <p class="text-sm text-gray-400 mb-3">
              {{ song.album }} · {{ song.year }}
            </p>
            <!-- <p class="text-xs text-gray-500 mb-4 italic line-clamp-2">
              "{{ song.lyrics.substring(0, 50) }}..."
            </p> -->
            <div class="flex items-center justify-between" @click.stop>
              <button
                @click="vote(song.id)"
                class="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                :class="hasVoted(song.id)
                  ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(8,145,178,0.5)]'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'"
              >
                <Icon :name="hasVoted(song.id) ? 'lucide:heart' : 'lucide:heart-off'" class="size-4" />
                <span class="text-sm font-medium">{{ getTotalVotes(song) }}</span>
              </button>
            </div>
          </div>
        </BaseCard>
      </div>
      
      <div v-else class="text-center py-20 text-gray-500 dark:text-gray-400">
        <Icon name="lucide:music" class="size-12 mx-auto mb-4 opacity-50" />
        <p class="text-lg">No songs found matching your search.</p>
      </div>
    </div>

    <!-- Timeline View -->
    <div v-else-if="viewMode === 'timeline'" class="space-y-12">
      <div v-for="year in years" :key="year" class="relative">
        <!-- Year Badge -->
        <div class="sticky top-20 z-10 mb-6">
          <div class="inline-block px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-2xl rounded-full shadow-[0_0_20px_rgba(8,145,178,0.4)] backdrop-blur-md border border-white/10">
            {{ year }}
          </div>
        </div>

        <!-- Songs Grid -->
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          <BaseCard
            v-for="song in songsByYear[Number(year)]"
            :key="song.id"
            :hoverable="true"
            :clickable="true"
            padding="none"
            @click="openLyrics(song)"
            class="group"
          >
            <div class="image-zoom">
              <img 
                :src="song.cover" 
                :alt="song.title"
                class="w-full aspect-square object-cover"
              />
              <!-- Hover Overlay with Icon -->
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                <div class="bg-white/20 p-3 rounded-full backdrop-blur-md border border-white/30">
                  <Icon name="lucide:text-quote" class="size-6 text-white" />
                </div>
              </div>
            </div>
            <div class="p-5">
              <h3 class="text-lg font-bold mb-1 text-white group-hover:text-cyan-400 transition-colors">
                {{ song.title }}
              </h3>
              <p class="text-sm text-gray-400 mb-3">
                {{ song.album }}
              </p>
              <!-- <p class="text-xs text-gray-500 mb-4 italic line-clamp-2">
                "{{ song.lyrics.substring(0, 50) }}..."
              </p> -->

              <!-- Platform Links (Stop Propagation) -->
              <div class="flex items-center gap-2 mb-3" @click.stop>
                <a 
                  :href="song.platforms.youtube" 
                  target="_blank"
                  class="p-2 bg-red-900/30 hover:bg-red-900/50 rounded-lg transition-colors border border-red-500/20"
                  title="YouTube"
                >
                  <Icon name="lucide:youtube" class="size-4 text-red-400" />
                </a>
                <a 
                  :href="song.platforms.spotify" 
                  target="_blank"
                  class="p-2 bg-green-900/30 hover:bg-green-900/50 rounded-lg transition-colors border border-green-500/20"
                  title="Spotify"
                >
                  <Icon name="lucide:music" class="size-4 text-green-400" />
                </a>
              </div>

              <!-- Vote Button (Stop Propagation) -->
              <div class="flex items-center justify-between" @click.stop>
                <button
                  @click="vote(song.id)"
                  class="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                  :class="hasVoted(song.id)
                    ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(8,145,178,0.5)]'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'"
                >
                  <Icon :name="hasVoted(song.id) ? 'lucide:heart' : 'lucide:heart-off'" class="size-4" />
                  <span class="text-sm font-medium">{{ getTotalVotes(song) }}</span>
                </button>
              </div>
            </div>
          </BaseCard>
        </div>
      </div>
    </div>

    <!-- Popular View -->
    <div v-else-if="viewMode === 'popular'" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
      <BaseCard
        v-for="(song, index) in topSongs"
        :key="song.id"
        :hoverable="true"
        :clickable="true"
        padding="none"
        class="relative group"
        @click="openLyrics(song)"
      >
        <!-- Rank Badge -->
        <div class="absolute top-4 left-4 z-10 size-12 flex items-center justify-center rounded-full text-white font-bold text-lg shadow-lg border border-white/20"
          :class="{
            'bg-gradient-to-br from-yellow-400 to-yellow-600': index === 0,
            'bg-gradient-to-br from-gray-300 to-gray-500': index === 1,
            'bg-gradient-to-br from-orange-400 to-orange-600': index === 2,
            'bg-gradient-to-br from-cyan-500 to-blue-700': index > 2,
          }"
        >
          {{ index + 1 }}
        </div>

        <div class="image-zoom">
          <img 
            :src="song.cover" 
            :alt="song.title"
            class="w-full aspect-square object-cover"
          />
          <!-- Hover Overlay -->
          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
            <div class="bg-white/20 p-3 rounded-full backdrop-blur-md border border-white/30">
              <Icon name="lucide:text-quote" class="size-6 text-white" />
            </div>
          </div>
        </div>
        <div class="p-5">
          <h3 class="text-lg font-bold mb-1 text-white group-hover:text-cyan-400 transition-colors">
            {{ song.title }}
          </h3>
          <p class="text-sm text-gray-400 mb-2">
            {{ song.album }} · {{ song.year }}
          </p>
          <!-- <p class="text-xs text-gray-500 mb-4 italic line-clamp-2">
            "{{ song.lyrics.substring(0, 50) }}..."
          </p> -->
          
          <div class="flex items-center gap-2 text-cyan-400">
            <Icon name="lucide:heart" class="size-5" />
            <span class="font-bold">{{ getTotalVotes(song) }} 票</span>
          </div>
        </div>
      </BaseCard>
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
        <div v-if="selectedSong" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" @click="closeLyrics">
          <div 
            class="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            @click.stop
          >
            <!-- Modal Header -->
            <div class="p-6 border-b border-white/10 flex justify-between items-start bg-gradient-to-r from-cyan-900/20 to-blue-900/20">
              <div>
                <h2 class="text-2xl font-bold text-white mb-1">{{ selectedSong.title }}</h2>
                <p class="text-cyan-400 text-sm">{{ selectedSong.album }} · {{ selectedSong.year }}</p>
              </div>
              <button 
                @click="closeLyrics"
                class="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
              >
                <Icon name="lucide:x" class="size-6" />
              </button>
            </div>

            <!-- Modal Content (Scrollable) -->
            <div class="p-8 overflow-y-auto custom-scrollbar">
              <div class="prose prose-invert max-w-none text-center">
                <p class="whitespace-pre-line text-lg leading-relaxed text-gray-200 font-medium">
                  {{ selectedSong.lyrics }}
                </p>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="p-4 border-t border-white/10 bg-[#020617]/50 flex justify-center gap-4">
               <a 
                  :href="selectedSong.platforms.youtube" 
                  target="_blank"
                  class="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-bold transition-colors"
                >
                  <Icon name="lucide:youtube" class="size-4" />
                  Watch MV
                </a>
                <a 
                  :href="selectedSong.platforms.spotify" 
                  target="_blank"
                  class="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full text-sm font-bold transition-colors"
                >
                  <Icon name="lucide:music" class="size-4" />
                  Listen
                </a>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
