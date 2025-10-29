<script setup lang="ts">
defineProps<{
    size?: number
}>()
</script>
<template>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 141.96 141.96" :width="size || 150" :height="size || 150">
        <rect class="cls-2" x="0" y="0" width="141.96" height="141.96" rx="70.98" ry="70.98" />
        <circle class="cls-4" cx="59.54" cy="60.46" r="8.93" />
        <circle class="cls-4" cx="76.44" cy="58.23" r="9.11" />
        <ellipse
class="cls-1" cx="71.26" cy="57.07" rx="4.03" ry="4.78"
            transform="translate(-9.78 15.03) rotate(-11.27)" />
        <ellipse
class="cls-1" cx="54.82" cy="58.38" rx="4.02" ry="4.64"
            transform="translate(-10.35 11.84) rotate(-11.27)" />
        <path
class="cls-3"
            d="M54.26,83.52c5.86-1.39,11.72-2.78,17.58-4.17,3.1,1.02,6.21,2.03,9.31,3.05,2.07-2.24,4.14-4.49,6.22-6.73,5.08-1.2,10.15-2.41,15.23-3.61" />
    </svg>
</template>

<style scoped>
.cls-1 {
    fill: #edad3b;
}

.cls-2 {
    fill: #1daa39;
}

.cls-3 {
    fill: none;
    stroke: #231815;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 4.17px;
}

.cls-4 {
    fill: #fff;
}
</style>