<script setup lang="ts">
interface TrendPoint {
  label: string
  value: number
}

const props = defineProps<{
  data: TrendPoint[]
}>()

const chartData = computed(() => props.data.length ? props.data : [
  { label: 'M1', value: 0 },
  { label: 'M2', value: 0 },
  { label: 'M3', value: 0 },
  { label: 'M4', value: 0 },
  { label: 'M5', value: 0 },
  { label: 'M6', value: 0 },
])

const maxValue = computed(() => Math.max(...chartData.value.map(item => item.value), 1))

const points = computed(() => {
  const width = 100
  const height = 56
  const count = chartData.value.length || 1

  return chartData.value.map((item, index) => {
    // 居中对齐到对应的 Grid 列: (index + 0.5) / count
    const x = ((index + 0.5) / count) * width
    const y = height - (item.value / maxValue.value) * 44 - 6

    return {
      ...item,
      x,
      y,
      barHeight: Math.max((item.value / maxValue.value) * 42, 4),
    }
  })
})

const linePath = computed(() => {
  return points.value
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ')
})

const areaPath = computed(() => {
  const line = linePath.value
  const last = points.value.at(-1)
  const first = points.value[0]

  if (!last || !first) {
    return ''
  }

  return `${line} L ${last.x.toFixed(2)} 58 L ${first.x.toFixed(2)} 58 Z`
})
</script>

<template>
  <div class="relative h-64 overflow-visible pb-4 pt-5">
    <svg
      class="h-full w-full overflow-visible"
      viewBox="0 0 100 72"
      preserveAspectRatio="none"
      role="img"
      aria-label="最近 6 个月发布趋势"
    >
      <defs>
        <linearGradient id="admin-trend-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.28" />
          <stop offset="100%" stop-color="var(--primary)" stop-opacity="0.02" />
        </linearGradient>
      </defs>

      <g class="text-[var(--border-soft)]">
        <line
          v-for="y in [14, 28, 42, 56]"
          :key="y"
          x1="0"
          x2="100"
          :y1="y"
          :y2="y"
          stroke="currentColor"
          stroke-width="0.25"
          vector-effect="non-scaling-stroke"
        />
      </g>

      <g>
        <rect
          v-for="point in points"
          :key="`bar-${point.label}`"
          :x="point.x - 3.1"
          :y="58 - point.barHeight"
          width="6.2"
          :height="point.barHeight"
          rx="1.6"
          fill="var(--primary)"
          opacity="0.18"
        />
      </g>

      <path
        :d="areaPath"
        fill="url(#admin-trend-area)"
      />
      <path
        :d="linePath"
        fill="none"
        stroke="var(--primary)"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
      <circle
        v-for="point in points"
        :key="`dot-${point.label}`"
        :cx="point.x"
        :cy="point.y"
        r="1.8"
        fill="var(--surface-card)"
        stroke="var(--primary)"
        stroke-width="1"
        vector-effect="non-scaling-stroke"
      />
    </svg>

    <div class="pointer-events-none absolute inset-x-0 bottom-3 grid" :style="{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }">
      <div
        v-for="point in points"
        :key="point.label"
        class="min-w-0 text-center"
      >
        <p class="truncate text-[11px] font-medium text-[var(--text-secondary)]">
          {{ point.label }}
        </p>
        <p class="mt-1 text-xs font-bold text-[var(--text-primary)]">
          {{ point.value }}
        </p>
      </div>
    </div>
  </div>
</template>
