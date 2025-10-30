<script setup lang="ts">
defineProps<{
    size?: number
}>()
</script>

<template>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 141.96 141.96" :width="size || 150" :height="size || 150">
        <rect class="cls-2" x="0" y="0" width="141.96" height="141.96" rx="70.98" ry="70.98" />
        <g> 
            <circle cx="59.54" cy="60.46" r="8.93" fill="#fff" />
            <circle cx="76.44" cy="58.23" r="9.11" fill="#fff" />

            <ellipse
                class="cls-1" cx="71.26" cy="57.07" rx="4.03" ry="4.78"
                transform="translate(-9.78 15.03) rotate(-11.27)" />

            <ellipse
                class="cls-1" cx="54.82" cy="58.38" rx="4.02" ry="4.64"
                transform="translate(-10.35 11.84) rotate(-11.27)" />

            <path
                class="cls-3"
                d="M54.26,83.52c5.86-1.39,11.72-2.78,17.58-4.17,3.1,1.02,6.21,2.03,9.31,3.05,2.07-2.24,4.14-4.49,6.22-6.73,5.08-1.2,10.15-2.41,15.23-3.61" />
        </g>
    </svg>
</template>

<style scoped>
/* 瞳孔样式 */
.cls-1 {
    fill: #edad3b;
    /* 应用眼睛左右看的动画 */
    animation: look-around 5s infinite ease-in-out;
}

/* 背景样式 */
.cls-2 {
    fill: #1daa39;
}

/* 嘴巴样式 */
.cls-3 {
    fill: none;
    stroke: #231815;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 4.17px;
    /* 应用嘴巴动的动画 */
    animation: mouth-move 2.5s infinite ease-in-out;
    /* 设置变换的原点为中心，让缩放效果更自然 */
    transform-origin: center;
}

/* 眼睛左右看的动画 */
@keyframes look-around {
    0% {
        /* 初始位置 (看向左边) */
        transform: translateX(0);
    }
    40% {
        /* 保持在左边 */
        transform: translateX(0);
    }
    50% {
        /* 移动到右边 */
        transform: translateX(8px);
    }
    90% {
        /* 保持在右边 */
        transform: translateX(8px);
    }
    100% {
        /* 回到初始位置，形成循环 */
        transform: translateX(0);
    }
}

/* 嘴巴动的动画 */
@keyframes mouth-move {
    0% {
        /* 初始状态 */
        transform: translateY(0) scaleY(1);
    }
    50% {
        /* 嘴巴向下移动一点，并垂直拉伸一点，像在说话 */
        transform: translateY(2px) scaleY(1.1);
    }
    100% {
        /* 回到初始状态 */
        transform: translateY(0) scaleY(1);
    }
}

/* 你原来的 .cls-4 样式，如果不需要可以删除 */
.cls-4 {
    fill: #fff;
}
</style>