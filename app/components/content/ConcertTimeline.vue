<script setup lang="ts">
const { concerts } = useMaydayData()

const sortedConcerts = computed(() => {
  return [...concerts.value].sort((a, b) => b.year - a.year)
})
</script>

<template>
  <div class="relative max-w-6xl mx-auto">
    <!-- Timeline Line -->
    <div class="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 -translate-x-1/2" />

    <!-- Concert Items -->
    <div class="space-y-16">
      <div 
        v-for="(concert, index) in sortedConcerts" 
        :key="concert.id"
        class="relative"
      >
        <!-- Timeline Dot -->
        <div class="hidden md:block absolute left-1/2 top-8 size-6 bg-white dark:bg-gray-900 border-4 rounded-full -translate-x-1/2 z-10"
          :class="{
            'border-blue-500': index % 3 === 0,
            'border-purple-500': index % 3 === 1,
            'border-pink-500': index % 3 === 2,
          }"
        />

        <!-- Concert Card -->
        <div 
          class="w-full md:w-[calc(50%-2rem)]"
          :class="index % 2 === 0 ? 'md:ml-0' : 'md:ml-auto'"
        >
          <BaseCard :hoverable="true" padding="none" class="group">
            <div class="image-zoom">
              <img 
                :src="concert.image" 
                :alt="concert.name"
                class="w-full h-64 object-cover"
              />
            </div>
            <div class="p-6">
              <!-- Year Badge -->
              <div class="inline-block px-4 py-1 mb-3 rounded-full text-sm font-bold text-white"
                :class="{
                  'bg-blue-500': index % 3 === 0,
                  'bg-purple-500': index % 3 === 1,
                  'bg-pink-500': index % 3 === 2,
                }"
              >
                {{ concert.year }}
              </div>

              <h3 class="text-xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                {{ concert.name }}
              </h3>

              <div class="flex items-center gap-2 mb-3 text-gray-600 dark:text-gray-400">
                <Icon name="lucide:map-pin" class="size-4" />
                <span class="text-sm">{{ concert.location }}, {{ concert.city }}</span>
              </div>

              <p class="text-gray-700 dark:text-gray-300 text-sm">
                {{ concert.description }}
              </p>

              <!-- Action Buttons -->
              <div class="mt-4 flex gap-2">
                <button class="flex-1 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg font-medium transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                  <Icon name="lucide:image" class="size-4" />
                  照片
                </button>
                <button class="flex-1 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg font-medium transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                  <Icon name="lucide:video" class="size-4" />
                  视频
                </button>
              </div>
            </div>
          </BaseCard>
        </div>
      </div>
    </div>
  </div>
</template>
