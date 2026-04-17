<script setup lang="ts">
import type { MaydayMessage } from '@/composables/useMaydayData'

const emit = defineEmits<{
  submit: [message: MaydayMessage]
}>()

const formData = ref({
  content: '',
  author: '',
  mood: '励志'
})

const moods = ['励志', '回忆', '治愈', '怀念', '感动']

const submitMessage = () => {
  if (!formData.value.content || !formData.value.author) {
    alert('请填写完整信息')
    return
  }

  const newMessage: MaydayMessage = {
    id: Date.now(),
    content: formData.value.content,
    author: formData.value.author,
    mood: formData.value.mood,
    date: new Date().toISOString().slice(0, 10),
    likes: 0,
    featured: false,
  }

  emit('submit', newMessage)

  // Reset form
  formData.value = {
    content: '',
    author: '',
    mood: '励志'
  }
}
</script>

<template>
  <BaseCard padding="lg">
    <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">
      分享你的故事
    </h3>

    <div class="space-y-4">
      <!-- Mood Selection -->
      <div>
        <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          选择心情
        </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="mood in moods"
            :key="mood"
            type="button"
            @click="formData.mood = mood"
            class="px-4 py-2 rounded-lg font-medium transition-all"
            :class="formData.mood === mood 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
          >
            {{ mood }}
          </button>
        </div>
      </div>

      <!-- Content Input -->
      <div>
        <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          留言内容
        </label>
        <textarea
          v-model="formData.content"
          rows="4"
          placeholder="分享你和五月天的故事..."
          class="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-colors resize-none"
        />
      </div>

      <!-- Author Input -->
      <div>
        <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          署名
        </label>
        <input
          v-model="formData.author"
          type="text"
          placeholder="你的昵称或匿名"
          class="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-colors"
        />
      </div>

      <!-- Submit Button -->
      <button
        @click="submitMessage"
        class="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95"
      >
        提交留言
      </button>
    </div>
  </BaseCard>
</template>
