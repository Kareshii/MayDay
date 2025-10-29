<template>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 141.96 141.96" class="orange-face">
                <!-- 脸 -->
                <rect class="face" x="0" y="0" width="141.96" height="141.96" rx="70.98" ry="70.98" fill="#dc361e" />

                <!-- 左眼白 -->
                <g class="eye-blink-group">
                        <g>
                                <ellipse
transform="translate(-19.96 103.47) rotate(-79.86)" fill="#fff" cx="51.83"
                                        cy="63.65" rx="13.34" ry="11.8" />
                        </g>
                </g>
                <!-- 右眼白 -->
                <g class="eye-blink-group">
                        <g>
                                <ellipse
transform="translate(8.79 143.14)
                        rotate(-79.86)" fill="#fff" cx="89.9" cy="66.32" rx="13.34" ry="11.8" />
                        </g>
                </g>

                <!-- 左瞳孔 -->
                <g class="eye-blink-group">
                        <g class="pupil">
                                <ellipse
fill="#1daa39" transform="translate(-23.6
                        103.33) rotate(-79.86)" cx="49.93" cy="65.76" rx="8.3" ry="7.22" />
                        </g>
                </g>
                <!-- 右瞳孔 -->

                <g class="eye-blink-group">
                        <g class="pupil">
                                <ellipse
fill="#1daa39" transform="translate(7.51
                        145.08) rotate(-79.86)" cx="90.42" cy="68.05" rx="8.25" ry="6.99" />
                        </g>
                </g>
                <!-- 嘴巴 -->
                <path
class="mouth" d="M59.86,86.16l-4.62,5.12c8.49-.18,16.99-.35,25.48-.53" fill="none"
                        stroke="#231815" stroke-width="4.28" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
</template>
<style scoped>
.container {
        display: flex;
        justify-content: space-between;
        padding: 1rem;
        margin: 0 auto;
        max-width: 42rem;
        position: absolute;
}

.orange-face {
        width: 150px;
        height: 150px;
}

/* 脸部动画 */
.face {
        animation: pulse 3s ease-in-out infinite;
        transform-origin: center;
        transform-box: fill-box;
}

.eye-blink-group {
        animation: blink 3s ease-in-out infinite;
        transform-origin: center;
        transform-box: fill-box;
}


.pupil {
        animation: move-pupil 5s ease-in-out infinite;
        transform-origin: center;
        transform-box: fill-box;
}

@keyframes blink {

        0%,
        90%,
        100% {
                transform: scaleY(1);
        }

        95% {
                transform: scaleY(0.05);
        }
}

@keyframes move-pupil {

        0%,
        100% {
                transform: translateX(0);
        }

        25% {
                transform: translateX(3px);
        }

        50% {
                transform: translateX(0);
        }

        75% {
                transform: translateX(-3px);
        }
}
</style>