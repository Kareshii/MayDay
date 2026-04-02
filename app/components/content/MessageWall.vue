<script setup lang="ts">
const { messages: initialMessages, getMessagesByMood } = useMaydayData()

const allMessages = ref([...initialMessages.value])
const selectedMood = ref<string>('')
const showForm = ref(false)

const moods = ['励志', '回忆', '治愈', '怀念', '感动']

const filteredMessages = computed(() => {
  return selectedMood.value 
    ? allMessages.value.filter(m => m.mood === selectedMood.value)
    : allMessages.value
})

const addMessage = (message: any) => {
  allMessages.value.unshift(message)
  showForm.value = false
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header Actions -->
    <div class="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
      <!-- Mood Filter -->
      <div class="flex flex-wrap gap-2">
        <button
          @click="selectedMood = ''"
          class="px-4 py-2 rounded-full font-medium transition-all hover:scale-105 active:scale-95"
          :class="selectedMood === '' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
        >
          全部
        </button>
        <button
          v-for="mood in moods"
          :key="mood"
          @click="selectedMood = mood"
          class="px-4 py-2 rounded-full font-medium transition-all hover:scale-105 active:scale-95"
          :class="selectedMood === mood 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
        >
          {{ mood }}
        </button>
      </div>

      <!-- Add Message Button -->
      <button
        @click="showForm = !showForm"
        class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
      >
        <Icon :name="showForm ? 'lucide:x' : 'lucide:plus'" class="size-5" />
        {{ showForm ? '取消' : '写留言' }}
      </button>
    </div>

    <!-- Message Form -->
    <transition
      enter-active-class="transition-all duration-300"
      enter-from-class="opacity-0 -translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-300"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-4"
    >
      <MessageForm v-if="showForm" @submit="addMessage" />
    </transition>

    <!-- Messages Grid -->
    <div class="columns-1 md:columns-2 lg:columns-3 gap-6 lg:gap-8 space-y-6 lg:space-y-8">
      <BaseCard
        v-for="message in filteredMessages"
        :key="message.id"
        :hoverable="true"
        padding="md"
        class="break-inside-avoid group"
      >
        <div class="flex items-start justify-between mb-3">
          <div>
            <span 
              class="inline-block px-3 py-1 text-xs rounded-full font-medium"
              :class="{
                'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300': message.mood === '励志',
                'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300': message.mood === '回忆',
                'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300': message.mood === '治愈',
                'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300': message.mood === '怀念',
                'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300': message.mood === '感动',
              }"
            >
              {{ message.mood }}
            </span>
          </div>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ message.date }}
          </span>
        </div>

        <p class="text-gray-800 dark:text-gray-200 leading-relaxed mb-4">
          {{ message.content }}
        </p>

        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            — {{ message.author }}
          </span>
          <div class="flex items-center gap-1 text-red-500 transition-all group-hover:scale-110">
            <Icon name="lucide:heart" class="size-4" />
            <span class="text-sm font-medium">{{ message.likes }}</span>
          </div>
        </div>

        <div v-if="message.featured" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
            <Icon name="lucide:star" class="size-4" />
            <span class="text-xs font-medium">精选故事</span>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Empty State -->
    <div 
      v-if="filteredMessages.length === 0"
      class="text-center py-16"
    >
      <Icon name="lucide:message-circle" class="size-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
      <p class="text-gray-500 dark:text-gray-400">暂无留言</p>
    </div>
  </div>
</template>
