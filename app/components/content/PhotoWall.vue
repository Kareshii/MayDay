<script setup lang="ts">
const { concerts } = useMaydayData()

const allPhotos = computed(() => {
  return concerts.value.flatMap(concert => ({
    image: concert.image,
    title: concert.name,
    year: concert.year,
    location: concert.location
  }))
})
</script>

<template>
  <div class="columns-1 md:columns-2 lg:columns-3 gap-6 lg:gap-8 space-y-6 lg:space-y-8">
    <div
      v-for="(photo, index) in allPhotos"
      :key="index"
      class="break-inside-avoid"
    >
      <BaseCard :hoverable="true" padding="none" class="overflow-hidden group">
        <div class="image-zoom">
          <img 
            :src="photo.image" 
            :alt="photo.title"
            class="w-full h-auto"
          />
        </div>
        <div class="p-4">
          <div class="flex items-center justify-between">
            <h4 class="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
              {{ photo.title }}
            </h4>
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ photo.year }}
            </span>
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {{ photo.location }}
          </p>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
