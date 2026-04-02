<script setup lang="ts">
const { activeCountdowns } = useMaydayData()

const getTimeRemaining = (targetDate: string) => {
  const now = new Date()
  const target = new Date(targetDate)
  const diff = target.getTime() - now.getTime()

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds, expired: false }
}

const countdowns = ref(activeCountdowns.value.map(c => ({
  ...c,
  remaining: getTimeRemaining(c.date)
})))

// Update countdown every second
onMounted(() => {
  const interval = setInterval(() => {
    countdowns.value = activeCountdowns.value.map(c => ({
      ...c,
      remaining: getTimeRemaining(c.date)
    }))
  }, 1000)

  onUnmounted(() => {
    clearInterval(interval)
  })
})

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    anniversary: 'from-yellow-400 to-yellow-600',
    birthday: 'from-pink-400 to-pink-600',
    concert: 'from-blue-400 to-blue-600'
  }
  return colors[type] || 'from-gray-400 to-gray-600'
}

const getTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    anniversary: 'lucide:calendar-heart',
    birthday: 'lucide:cake',
    concert: 'lucide:music'
  }
  return icons[type] || 'lucide:clock'
}
</script>

<template>
  <div class="grid md:grid-cols-2 gap-6 lg:gap-8">
    <BaseCard
      v-for="countdown in countdowns"
      :key="countdown.id"
      :hoverable="true"
      padding="lg"
      class="hover-glow"
    >
      <div class="text-center">
        <!-- Icon -->
        <div 
          class="size-16 mx-auto mb-4 rounded-full bg-gradient-to-br flex items-center justify-center"
          :class="getTypeColor(countdown.type)"
        >
          <Icon :name="getTypeIcon(countdown.type)" class="size-8 text-white" />
        </div>

        <!-- Title -->
        <h3 class="text-xl font-bold mb-2 text-gray-900 dark:text-white">
          {{ countdown.title }}
        </h3>

        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {{ countdown.description }}
        </p>

        <!-- Countdown Display -->
        <div v-if="!countdown.remaining.expired" class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div class="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/50">
            <div class="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
              {{ countdown.remaining.days }}
            </div>
            <div class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">天</div>
          </div>
          <div class="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200/50 dark:border-purple-700/50">
            <div class="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400 tabular-nums">
              {{ countdown.remaining.hours }}
            </div>
            <div class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">时</div>
          </div>
          <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200/50 dark:border-green-700/50">
            <div class="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">
              {{ countdown.remaining.minutes }}
            </div>
            <div class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">分</div>
          </div>
          <div class="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 border border-orange-200/50 dark:border-orange-700/50">
            <div class="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400 tabular-nums">
              {{ countdown.remaining.seconds }}
            </div>
            <div class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">秒</div>
          </div>
        </div>

        <!-- Expired State -->
        <div v-else class="py-4">
          <Icon name="lucide:check-circle" class="size-12 mx-auto text-green-500 mb-2" />
          <p class="text-green-600 dark:text-green-400 font-semibold">已到期</p>
        </div>

        <!-- Date -->
        <div class="mt-4 text-sm text-gray-500 dark:text-gray-400">
          {{ countdown.date }}
        </div>
      </div>
    </BaseCard>

    <!-- Empty State -->
    <div 
      v-if="countdowns.length === 0"
      class="col-span-full text-center py-16"
    >
      <Icon name="lucide:calendar-x" class="size-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
      <p class="text-gray-500 dark:text-gray-400">暂无倒计时事件</p>
    </div>
  </div>
</template>
