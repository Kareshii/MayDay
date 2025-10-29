<script setup lang="ts">
defineProps<{
    size?: number
}>()
</script>
<template>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 141.96 141.96" :width="size || 150" :height="size || 150">
        <rect class="cls-3" x="0" y="0" width="141.96" height="141.96" rx="70.98" ry="70.98" />
        <g class="move-nod">
            <g class="eye-blink-group">
                <ellipse
cx="52.78" cy="63.6" rx="16.54" ry="12.23" transform="translate(-13.68 112.74) rotate(-86.79)"
                    fill="#fff" />
            </g>
       
            <g class="eye-blink-group">
                <ellipse
cx="93.36" cy="65.21" rx="12.23" ry="16.54" transform="translate(-5.75 9.13) rotate(-5.43)"
                    fill="#fff" />
            </g>
       
            <g class="eye-blink-group">
                <ellipse
cx="54.14" cy="65.38" rx="11.89" ry="9.03" fill="#00a0e9"
                    transform="translate(-16.84 111.93) rotate(-83.63)" />
            </g>
      
            <g class="eye-blink-group">
                <ellipse
fill="#00a0e9" cx="92" cy="66.66" rx="9.3" ry="11.72"
                    transform="translate(-4.81 7.21) rotate(-4.37)" />
            </g>
    
            <path
class="cls-4"
                d="M60.92,90.89c.25.5,1.36,2.57,3.56,3.09,2.12.5,4.27-.67,5.44-1.89,1.63-1.68,1.62-3.7,3.29-4.11.49-.12.88-.04,1.31.05,2.02.4,2.3,1.96,4.19,3.11,2.22,1.36,4.73.98,5.41.88.65-.1,1.79-.28,2.99-1.06,1.84-1.19,2.57-2.95,2.81-3.64" />
        </g>
    </svg>
</template>

<style scoped>
.cls-3 {
    fill: #e86ca5;
}

.cls-4 {
    fill: none;
    stroke: #231815;
    stroke-linecap: round;
    stroke-miterlimit: 10;
    stroke-width: 3.5px;
}


.move-nod {
    animation: nod-smooth 2.5s cubic-bezier(0.45, 0, 0.55, 1) infinite;
    transform-origin: center;
    transform-box: fill-box;
}

.eye-blink-group {
    /* 假设这是你包裹眼白和瞳孔的组 */
    /* animation: cheerful-squint 2.5s cubic-bezier(0.65, 0, 0.35, 1) infinite; */
    transform-origin: center;
    transform-box: fill-box;
}

@keyframes nod-smooth {
    0%, 100% {
        transform: translateY(0);
    }
    25% {
        transform: translateY(10px); /* 到达最低点 */
    }
    50% {
        transform: translateY(0); /* 回到中心 */
    }
    75% {
        transform: translateY(10px); /* 到达最高点 */
    }
}

@keyframes cheerful-squint {

    0%,
    100% {
        transform: scaleY(1);
        /* 正常大小 */
    }

    20% {
        transform: scaleY(0.85);
        /* 配合点头，眼睛眯起来 */
    }

    30% {
        transform: scaleY(0.85);
        /* 保持眯眼状态 */
    }

    50% {
        transform: scaleY(1);
        /* 随抬头恢复正常 */
    }
}
</style>