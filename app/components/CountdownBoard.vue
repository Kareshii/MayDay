<script setup lang="ts">
const { activeCountdowns } = useMaydayData()
const now = useState('countdown-time', () => Date.now())

const getTimeRemaining = (targetDate: string) => {
  const target = new Date(targetDate)
  const diff = target.getTime() - now.value

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds, expired: false }
}

const countdowns = computed(() => activeCountdowns.value.map(c => ({
  ...c,
  remaining: getTimeRemaining(c.date)
})))

// Update countdown every second
onMounted(() => {
  now.value = Date.now()
  const interval = setInterval(() => {
    now.value = Date.now()
  }, 1000)

  onUnmounted(() => {
    clearInterval(interval)
  })
})

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
  <div class="design-countdowns">
    <article v-for="countdown in countdowns" :key="countdown.id" class="countdown-event">
      <header><Icon :name="getTypeIcon(countdown.type)" /><div><h3>{{ countdown.title }}</h3><p>{{ countdown.description }}</p></div><time>{{ countdown.date }}</time></header>
      <div v-if="!countdown.remaining.expired" class="countdown-digits">
        <div><strong>{{ String(countdown.remaining.days).padStart(2, '0') }}</strong><span>天 / DAYS</span></div>
        <div><strong>{{ String(countdown.remaining.hours).padStart(2, '0') }}</strong><span>时 / HOURS</span></div>
        <div><strong>{{ String(countdown.remaining.minutes).padStart(2, '0') }}</strong><span>分 / MINUTES</span></div>
        <div><strong>{{ String(countdown.remaining.seconds).padStart(2, '0') }}</strong><span>秒 / SECONDS</span></div>
      </div>
      <p v-else class="countdown-expired"><Icon name="lucide:check" />已到期</p>
    </article>
    <p v-if="countdowns.length === 0" class="countdown-empty">暂无倒计时事件</p>
  </div>
</template>

<style scoped>
.countdown-event { padding: 32px 0; border-top: 1px solid var(--border); }
.countdown-event header { display: flex; align-items: center; gap: 20px; }
.countdown-event header > .iconify { width: 23px; height: 23px; }
.countdown-event h3 { font-size: 18px; font-weight: 400; }
.countdown-event header p { color: var(--text-secondary); font-size: 12px; margin-top: 8px; }
.countdown-event time { margin-left: auto; color: var(--text-secondary); font-size: 11px; }
.countdown-digits { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 20px; margin-top: 35px; }
.countdown-digits > div { display: flex; flex-direction: column; border-left: 1px solid var(--border); padding-left: 25px; }
.countdown-digits > div:first-child { border: 0; padding: 0; }
.countdown-digits strong { font-size: clamp(38px, 7vw, 100px); font-weight: 300; letter-spacing: -.06em; line-height: 1.1; font-variant-numeric: tabular-nums; }
.countdown-digits span { margin-top: 14px; font-size: 9px; letter-spacing: .1em; color: var(--text-secondary); }
.countdown-empty, .countdown-expired { color: var(--text-secondary); padding: 25px 0; font-size: 13px; }
.countdown-expired { display: flex; align-items: center; gap: 12px; }
@media(max-width:640px) { .countdown-event header { flex-wrap: wrap; gap: 15px; } .countdown-event time { width: 100%; margin-left: 38px; } .countdown-digits { gap: 12px; } .countdown-digits > div { padding-left: 12px; } .countdown-digits span { font-size: 7px; letter-spacing: 0; } }
</style>
