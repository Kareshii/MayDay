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

const colors = [
  'var(--primary)',
  'var(--success)',
  'var(--warning)',
  'var(--info)',
  'var(--danger)',
  'var(--text-secondary)',
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
      percentage,
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
  <div class="flex min-h-64 flex-col items-center justify-center gap-6 px-2 py-4 sm:flex-row sm:px-4">
    <div
      class="relative flex size-36 shrink-0 items-center justify-center rounded-full sm:size-40"
      :style="{ background: conicGradient }"
    >
      <div class="absolute inset-0 m-auto flex size-24 flex-col items-center justify-center rounded-full bg-[var(--surface-card)] sm:size-28">
        <span class="text-2xl font-black text-[var(--text-primary)]">
          {{ props.data.length === 0 ? 0 : totalValue }}
        </span>
        <span class="mt-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
          总分布
        </span>
      </div>
    </div>

    <div class="flex w-full flex-col justify-center gap-3 border-t border-[var(--border-soft)] pt-4 sm:w-auto sm:flex-1 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
      <div
        v-for="segment in segments"
        :key="segment.label"
        class="flex cursor-default items-center justify-between gap-4"
      >
        <div class="flex items-center gap-2.5">
          <span
            class="size-3 rounded-full"
            :style="{ backgroundColor: segment.color }"
          />
          <span class="text-sm font-medium text-[var(--text-secondary)]">
            {{ segment.label }}
          </span>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-sm font-bold text-[var(--text-primary)]">
            {{ props.data.length === 0 ? 0 : segment.value }}
          </span>
          <span class="w-10 text-right text-xs font-semibold text-[var(--text-secondary)]">
            {{ props.data.length === 0 ? '0' : segment.percentage.toFixed(0) }}%
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
