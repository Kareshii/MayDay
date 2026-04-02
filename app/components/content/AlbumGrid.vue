<script setup lang="ts">
const { albums } = useMaydayData()

const selectedAlbum = ref<number | null>(null)

const selectAlbum = (id: number) => {
  selectedAlbum.value = selectedAlbum.value === id ? null : id
}
</script>

<template>
  <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
    <BaseCard
      v-for="album in albums"
      :key="album.id"
      :hoverable="true"
      :clickable="true"
      padding="none"
      class="cursor-pointer group"
      @click="selectAlbum(album.id)"
    >
      <div class="image-zoom">
        <img 
          :src="album.cover" 
          :alt="album.title"
          class="w-full aspect-square object-cover"
        />
      </div>
      <div class="p-6">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
            {{ album.title }}
          </h3>
          <span class="text-sm font-semibold text-blue-600 dark:text-blue-400 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full transition-all group-hover:scale-110">
            {{ album.year }}
          </span>
        </div>
        <p class="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
          {{ album.description }}
        </p>
        
        <!-- Expanded Details -->
        <transition
          enter-active-class="transition-all duration-300"
          enter-from-class="opacity-0 max-h-0"
          enter-to-class="opacity-100 max-h-96"
          leave-active-class="transition-all duration-300"
          leave-from-class="opacity-100 max-h-96"
          leave-to-class="opacity-0 max-h-0"
        >
          <div v-if="selectedAlbum === album.id" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">
              收录曲目
            </h4>
            <ul class="space-y-1 text-sm">
              <li 
                v-for="(track, index) in album.tracks"
                :key="index"
                class="flex items-center gap-2 text-gray-700 dark:text-gray-300"
              >
                <Icon name="lucide:disc-3" class="size-4 text-blue-500" />
                <span>{{ track }}</span>
              </li>
            </ul>
            <p class="mt-3 text-sm text-gray-600 dark:text-gray-400 italic">
              {{ album.background }}
            </p>
          </div>
        </transition>
      </div>
    </BaseCard>
  </div>
</template>
