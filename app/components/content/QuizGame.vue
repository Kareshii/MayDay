<script setup lang="ts">
const { quizQuestions } = useMaydayData()

const gameState = ref<'start' | 'playing' | 'result'>('start')
const currentQuestionIndex = ref(0)
const selectedAnswer = ref<number | null>(null)
const answers = ref<boolean[]>([])
const showFeedback = ref(false)

const currentQuestion = computed(() => {
  return quizQuestions.value[currentQuestionIndex.value]
})

const progress = computed(() => {
  return ((currentQuestionIndex.value + 1) / quizQuestions.value.length) * 100
})

const score = computed(() => {
  return answers.value.filter(a => a).length
})

const startQuiz = () => {
  gameState.value = 'playing'
  currentQuestionIndex.value = 0
  selectedAnswer.value = null
  answers.value = []
  showFeedback.value = false
}

const selectAnswer = (index: number) => {
  if (showFeedback.value) return
  selectedAnswer.value = index
}

const submitAnswer = () => {
  if (selectedAnswer.value === null) return
  
  const isCorrect = selectedAnswer.value === currentQuestion.value.answer
  answers.value.push(isCorrect)
  showFeedback.value = true

  setTimeout(() => {
    if (currentQuestionIndex.value < quizQuestions.value.length - 1) {
      currentQuestionIndex.value++
      selectedAnswer.value = null
      showFeedback.value = false
    } else {
      gameState.value = 'result'
    }
  }, 1500)
}

const getFanLevel = (score: number, total: number) => {
  const percentage = (score / total) * 100
  if (percentage >= 90) return { level: '骨灰级五迷', color: 'from-yellow-400 to-yellow-600', icon: 'lucide:trophy' }
  if (percentage >= 70) return { level: '资深粉丝', color: 'from-blue-500 to-blue-700', icon: 'lucide:star' }
  if (percentage >= 50) return { level: '普通粉丝', color: 'from-green-500 to-green-700', icon: 'lucide:heart' }
  return { level: '新手粉丝', color: 'from-gray-400 to-gray-600', icon: 'lucide:music' }
}

const fanLevel = computed(() => getFanLevel(score.value, quizQuestions.value.length))
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Start Screen -->
    <BaseCard v-if="gameState === 'start'" padding="lg" class="text-center">
      <Icon name="lucide:brain" class="size-24 mx-auto mb-6 text-blue-500 animate-float" />
      <h2 class="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
        五月天知识测验
      </h2>
      <p class="text-gray-600 dark:text-gray-400 mb-8">
        测试你对五月天的了解程度，看看你是不是真正的铁粉！
      </p>
      <div class="space-y-3 mb-8">
        <div class="flex items-center justify-center gap-3 text-gray-700 dark:text-gray-300">
          <Icon name="lucide:check-circle" class="size-5 text-green-500" />
          <span>共 {{ quizQuestions.length }} 道题目</span>
        </div>
        <div class="flex items-center justify-center gap-3 text-gray-700 dark:text-gray-300">
          <Icon name="lucide:clock" class="size-5 text-blue-500" />
          <span>不限时间</span>
        </div>
      </div>
      <button
        @click="startQuiz"
        class="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
      >
        开始测验
      </button>
    </BaseCard>

    <!-- Playing Screen -->
    <div v-else-if="gameState === 'playing'" class="space-y-6">
      <!-- Progress Bar -->
      <div class="bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
        <div 
          class="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
          :style="{ width: `${progress}%` }"
        />
      </div>

      <!-- Question Card -->
      <BaseCard padding="lg">
        <div class="mb-6">
          <span class="text-sm font-semibold text-gray-500 dark:text-gray-400">
            问题 {{ currentQuestionIndex + 1 }} / {{ quizQuestions.length }}
          </span>
          <h3 class="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
            {{ currentQuestion.question }}
          </h3>
        </div>

        <!-- Options -->
        <div class="space-y-3 mb-6">
          <button
            v-for="(option, index) in currentQuestion.options"
            :key="index"
            @click="selectAnswer(index)"
            class="w-full p-4 rounded-xl font-medium text-left transition-all"
            :class="{
              'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 text-blue-900 dark:text-blue-100': selectedAnswer === index && !showFeedback,
              'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 text-green-900 dark:text-green-100': showFeedback && index === currentQuestion.answer,
              'bg-red-100 dark:bg-red-900/30 border-2 border-red-500 text-red-900 dark:text-red-100': showFeedback && selectedAnswer === index && index !== currentQuestion.answer,
              'bg-gray-100 dark:bg-gray-800 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600': selectedAnswer !== index && (!showFeedback || index !== currentQuestion.answer),
              'cursor-not-allowed': showFeedback
            }"
          >
            <div class="flex items-center gap-3">
              <div class="size-6 rounded-full border-2 flex items-center justify-center"
                :class="{
                  'border-blue-500 bg-blue-500': selectedAnswer === index && !showFeedback,
                  'border-green-500 bg-green-500': showFeedback && index === currentQuestion.answer,
                  'border-red-500 bg-red-500': showFeedback && selectedAnswer === index && index !== currentQuestion.answer,
                  'border-gray-400': selectedAnswer !== index && (!showFeedback || index !== currentQuestion.answer)
                }"
              >
                <Icon 
                  v-if="showFeedback && index === currentQuestion.answer" 
                  name="lucide:check" 
                  class="size-4 text-white" 
                />
                <Icon 
                  v-else-if="showFeedback && selectedAnswer === index && index !== currentQuestion.answer" 
                  name="lucide:x" 
                  class="size-4 text-white" 
                />
              </div>
              <span>{{ option }}</span>
            </div>
          </button>
        </div>

        <!-- Submit Button -->
        <button
          v-if="!showFeedback"
          @click="submitAnswer"
          :disabled="selectedAnswer === null"
          class="w-full py-3 rounded-xl font-bold text-white transition-all"
          :class="selectedAnswer !== null 
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 active:scale-95' 
            : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'"
        >
          提交答案
        </button>

        <!-- Feedback -->
        <div v-else class="text-center py-4">
          <Icon 
            :name="selectedAnswer === currentQuestion.answer ? 'lucide:check-circle' : 'lucide:x-circle'" 
            class="size-16 mx-auto mb-3"
            :class="selectedAnswer === currentQuestion.answer ? 'text-green-500' : 'text-red-500'"
          />
          <p class="text-lg font-semibold"
            :class="selectedAnswer === currentQuestion.answer ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
          >
            {{ selectedAnswer === currentQuestion.answer ? '回答正确！' : '回答错误！' }}
          </p>
        </div>
      </BaseCard>
    </div>

    <!-- Result Screen -->
    <BaseCard v-else padding="lg" class="text-center">
      <div class="mb-8">
        <div 
          class="size-32 mx-auto mb-6 rounded-full bg-gradient-to-br flex items-center justify-center"
          :class="fanLevel.color"
        >
          <Icon :name="fanLevel.icon" class="size-16 text-white" />
        </div>
        <h2 class="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
          {{ fanLevel.level }}
        </h2>
        <p class="text-6xl font-bold mb-4 text-gradient">
          {{ score }} / {{ quizQuestions.length }}
        </p>
        <p class="text-gray-600 dark:text-gray-400">
          正确率: {{ ((score / quizQuestions.length) * 100).toFixed(0) }}%
        </p>
      </div>

      <div class="flex gap-4 justify-center">
        <button
          @click="startQuiz"
          class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95"
        >
          再测一次
        </button>
        <ShareButton 
          :title="`我在五月天测验中获得了${fanLevel.level}称号！`"
          :text="`正确率${((score / quizQuestions.length) * 100).toFixed(0)}%`"
        />
      </div>
    </BaseCard>
  </div>
</template>
