<script setup lang="ts">
interface TrendPoint {
  label: string
  value: number
}

const props = defineProps<{
  data: TrendPoint[]
}>()

const chartData = computed(() => props.data.length ? props.data : [
  { label: '无数据', value: 1 },
])

const totalValue = computed(() => chartData.value.reduce((sum, item) => sum + item.value, 0) || 1)

// Aesthetic color palette for traffic sources
const colors = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
]

const segments = computed(() => {
  let current = 0
  return chartData.value.map((item, index) => {
    const percentage = (item.value / totalValue.value) * 100
    const start = current
    const end = current + percentage
    current = end
    return {
      ...item,
      color: colors[index % colors.length],
      start,
      end,
      percentage
    }
  })
})

const conicGradient = computed(() => {
  if (props.data.length === 0 || totalValue.value === 0) {
    return 'conic-gradient(var(--border) 0% 100%)'
  }
  const stops = segments.value.map(s => `${s.color} ${s.start}% ${s.end}%`)
  return `conic-gradient(${stops.join(', ')})`
})
</script>

<template>
  <div class="flex h-64 items-center justify-center gap-6 px-4 py-2 sm:gap-10">
    <!-- Doughnut Chart -->
    <div 
      class="relative flex size-40 shrink-0 items-center justify-center rounded-full shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] transition-all duration-700"
      :style="{ background: conicGradient }"
    >
      <!-- Inner hole for doughnut effect -->
      <div class="absolute inset-0 m-auto flex size-28 flex-col items-center justify-center rounded-full bg-[var(--surface-card)] shadow-[0_2px_10px_rgba(0,0,0,0.08)]">
        <span class="text-2xl font-black tracking-tight text-[var(--text-primary)]">
          {{ props.data.length === 0 ? 0 : totalValue }}
        </span>
        <span class="text-[10px] font-medium tracking-widest text-[var(--text-secondary)] uppercase mt-0.5">
          总分布
        </span>
      </div>
    </div>

    <!-- Interactive Legend -->
    <div class="flex flex-1 flex-col justify-center gap-3 border-l border-[var(--border-soft)] pl-6 sm:pl-10">
      <div
        v-for="segment in segments"
        :key="segment.label"
        class="group flex cursor-default items-center justify-between gap-4"
      >
        <div class="flex items-center gap-2.5">
          <span 
            class="size-3 rounded-full shadow-sm transition-transform group-hover:scale-125" 
            :style="{ backgroundColor: segment.color }"
          ></span>
          <span class="text-sm font-medium text-[var(--text-secondary)] transition-colors group-hover:text-[var(--text-primary)]">
            {{ segment.label }}
          </span>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-sm font-bold text-[var(--text-primary)]">
            {{ props.data.length === 0 ? 0 : segment.value }}
          </span>
          <span class="w-10 text-right text-xs font-semibold text-[var(--text-secondary)] opacity-80 group-hover:opacity-100">
            {{ props.data.length === 0 ? '0' : segment.percentage.toFixed(0) }}%
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
