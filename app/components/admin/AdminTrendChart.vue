<script setup lang="ts">
interface TrendPoint {
  label: string
  value: number
}

const props = defineProps<{ data: TrendPoint[] }>()
const chartId = useId().replaceAll(':', '')
const CHART_WIDTH = 835
const CHART_HEIGHT = 230
const CHART_TOP = 35
const CHART_BASELINE = 180

const points = computed(() => {
  const maximum = Math.max(...props.data.map(item => item.value), 1)

  return props.data.map((item, index) => ({
    ...item,
    x: (index + .5) * CHART_WIDTH / props.data.length,
    y: CHART_BASELINE - item.value / maximum * (CHART_BASELINE - CHART_TOP),
  }))
})

const linePath = computed(() => {
  const path = points.value.map((point, index) => {
    if (index === 0) {
      return `M 0,${point.y} L ${point.x},${point.y}`
    }

    const previous = points.value[index - 1]!
    const middle = (previous.x + point.x) / 2
    return `C ${middle},${previous.y} ${middle},${point.y} ${point.x},${point.y}`
  }).join(' ')

  return points.value.length ? `${path} L ${CHART_WIDTH},${points.value[points.value.length - 1]!.y}` : ''
})

const areaPath = computed(() => `${linePath.value} L ${CHART_WIDTH},${CHART_HEIGHT} L 0,${CHART_HEIGHT} Z`)
</script>

<template>
  <div v-if="data.length" class="cms-trend">
    <div class="cms-trend__values" :style="{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }">
      <div v-for="(point, index) in data" :key="point.label" class="cms-trend__value" :style="{ '--point-index': index }">
        <span>{{ point.value }}<small>篇</small></span>
        <AppIcon name="i-file-text" />
      </div>
    </div>
    <svg class="cms-trend__chart" :viewBox="`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`" preserveAspectRatio="none" role="img" aria-label="最近文章创建数量趋势">
      <title>{{ data.map(point => `${point.label}：${point.value} 篇`).join('，') }}</title>
      <defs>
        <linearGradient :id="`${chartId}-fill`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="currentColor" stop-opacity=".3" />
          <stop offset="1" stop-color="currentColor" stop-opacity="0" />
        </linearGradient>
        <linearGradient :id="`${chartId}-stroke`">
          <stop offset="0" stop-color="currentColor" stop-opacity=".35" />
          <stop offset=".25" stop-color="currentColor" />
          <stop offset=".75" stop-color="currentColor" />
          <stop offset="1" stop-color="currentColor" stop-opacity=".5" />
        </linearGradient>
        <clipPath :id="`${chartId}-clip`">
          <rect class="cms-trend__wipe" :width="CHART_WIDTH" :height="CHART_HEIGHT" />
        </clipPath>
      </defs>
      <path v-if="data.length > 1" :d="areaPath" :fill="`url(#${chartId}-fill)`" :clip-path="`url(#${chartId}-clip)`" />
      <path v-if="data.length > 1" class="cms-trend__line" :d="linePath" fill="none" stroke="currentColor" stroke-width="6.2" stroke-opacity=".17" pathLength="1" />
      <path v-if="data.length > 1" class="cms-trend__line" :d="linePath" fill="none" stroke="currentColor" stroke-width="4.6" stroke-opacity=".26" pathLength="1" />
      <path v-if="data.length > 1" class="cms-trend__line" :d="linePath" fill="none" :stroke="`url(#${chartId}-stroke)`" stroke-width="3.4" stroke-linecap="round" pathLength="1" />
      <circle v-if="points.length === 1" :cx="points[0]!.x" :cy="points[0]!.y" r="5" fill="currentColor" />
    </svg>
    <div class="cms-trend__months" :style="{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }">
      <span v-for="(point, index) in data" :key="point.label" :style="{ '--point-index': index }">{{ point.label }}</span>
    </div>
  </div>
  <div v-else class="cms-trend-empty">
    <AppIcon name="i-chart-no-axes-column" />
    <p>还没有文章创建记录</p>
    <NuxtLink to="/admin/articles/new">从第一篇文章开始 <span aria-hidden="true">↗</span></NuxtLink>
  </div>
</template>
