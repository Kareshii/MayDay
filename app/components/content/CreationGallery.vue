<script setup lang="ts">
const { fanCreations, getCreationsByType } = useMaydayData()

const selectedType = ref<string>('')
const types = [
  { value: 'cover', label: '翻唱', icon: 'lucide:mic' },
  { value: 'art', label: '画作', icon: 'lucide:palette' },
  { value: 'video', label: '视频', icon: 'lucide:video' }
]

const filteredCreations = computed(() => {
  return selectedType.value 
    ? getCreationsByType(selectedType.value)
    : fanCreations.value
})
</script>

<template>
  <div class="space-y-8">
    <!-- Type Filter -->
    <div class="flex flex-wrap gap-3">
      <button
        @click="selectedType = ''"
        class="px-5 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2"
        :class="selectedType === '' 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
      >
        <Icon name="lucide:grid" class="size-4" />
        全部
      </button>
      <button
        v-for="type in types"
        :key="type.value"
        @click="selectedType = type.value"
        class="px-5 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2"
        :class="selectedType === type.value 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
      >
        <Icon :name="type.icon" class="size-4" />
        {{ type.label }}
      </button>
    </div>

    <!-- Creations Grid -->
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
      <BaseCard
        v-for="creation in filteredCreations"
        :key="creation.id"
        :hoverable="true"
        padding="none"
        class="group"
      >
        <div class="relative">
          <div class="image-zoom">
            <img 
              :src="creation.thumbnail" 
              :alt="creation.title"
              class="w-full aspect-video object-cover"
            />
          </div>
          
          <!-- Type Badge -->
          <div class="absolute top-3 right-3 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-full text-white text-xs font-medium flex items-center gap-1.5">
            <Icon 
              :name="types.find(t => t.value === creation.type)?.icon || 'lucide:star'" 
              class="size-3" 
            />
            {{ types.find(t => t.value === creation.type)?.label }}
          </div>
        </div>

        <div class="p-5">
          <h3 class="text-lg font-bold mb-2 text-gray-900 dark:text-white line-clamp-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
            {{ creation.title }}
          </h3>
          
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Icon name="lucide:user" class="size-4" />
              <span>{{ creation.author }}</span>
            </div>
            <div class="flex items-center gap-1 text-red-500 transition-all group-hover:scale-110">
              <Icon name="lucide:heart" class="size-4" />
              <span class="font-medium">{{ creation.likes }}</span>
            </div>
          </div>

          <div class="mt-3 text-xs text-gray-500 dark:text-gray-400">
            {{ creation.date }}
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Empty State -->
    <div 
      v-if="filteredCreations.length === 0"
      class="text-center py-16"
    >
      <Icon name="lucide:folder-open" class="size-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
      <p class="text-gray-500 dark:text-gray-400">暂无作品</p>
    </div>
  </div>
</template>
