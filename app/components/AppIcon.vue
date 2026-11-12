<script lang="ts">
const ICON_NAMES = new Set([
  'i-align-left',
  'i-arrow-down-to-line',
  'i-arrow-left',
  'i-arrow-up-to-line',
  'i-badge',
  'i-badge-check',
  'i-chart-no-axes-column',
  'i-check',
  'i-check-circle-2',
  'i-chevron-down',
  'i-chevron-left',
  'i-chevron-right',
  'i-circle',
  'i-circle-alert',
  'i-circle-check',
  'i-circle-dot',
  'i-circle-minus',
  'i-clipboard-check',
  'i-clock-3',
  'i-cloud-download',
  'i-construction',
  'i-copy',
  'i-corner-down-right',
  'i-database',
  'i-database-check',
  'i-database-zap',
  'i-ellipsis',
  'i-external-link',
  'i-eye',
  'i-eye-off',
  'i-file-pen-line',
  'i-file-plus-2',
  'i-file-search',
  'i-file-text',
  'i-folder',
  'i-folder-open',
  'i-folder-tree',
  'i-globe-2',
  'i-image',
  'i-image-off',
  'i-image-plus',
  'i-images',
  'i-info',
  'i-key-round',
  'i-layout-dashboard',
  'i-layout-grid',
  'i-list-checks',
  'i-loader-circle',
  'i-log-out',
  'i-maximize-2',
  'i-menu',
  'i-message-square',
  'i-minimize-2',
  'i-monitor',
  'i-monitor-play',
  'i-moon',
  'i-mouse-pointer-click',
  'i-network',
  'i-panel-bottom',
  'i-panel-left',
  'i-panel-left-close',
  'i-panel-left-open',
  'i-panel-right',
  'i-panel-top',
  'i-panels-top-left',
  'i-panorama',
  'i-pencil',
  'i-pin',
  'i-plus',
  'i-power',
  'i-radio-tower',
  'i-refresh-cw',
  'i-ruler',
  'i-save',
  'i-scan-search',
  'i-search',
  'i-search-check',
  'i-send',
  'i-server-cog',
  'i-settings',
  'i-settings-2',
  'i-shield-alert',
  'i-shield-check',
  'i-shield-user',
  'i-sliders-horizontal',
  'i-sun',
  'i-tag',
  'i-tags',
  'i-trash-2',
  'i-triangle-alert',
  'i-type',
  'i-undo-2',
  'i-upload',
  'i-user-round',
  'i-wand-sparkles',
  'i-workflow',
  'i-x',
])
</script>

<script setup lang="ts">
interface Props {
  name: string
}

const props = defineProps<Props>()

const symbolId = computed(() => {
  const name = props.name.startsWith('lucide:') ? `i-${props.name.slice(7)}` : props.name

  if (!ICON_NAMES.has(name)) {
    throw new Error(`Unregistered icon: ${props.name}`)
  }

  return `#${name}`
})
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    class="inline-block shrink-0 align-middle"
  >
    <use :href="symbolId" />
  </svg>
</template>
