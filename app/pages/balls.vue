<script setup lang="ts">
import type { Component } from 'vue'
import Monster from '@/components/Faces/Monster.vue'
import Stone from '@/components/Faces/Stone.vue'
import Ashin from '@/components/Faces/Ashin.vue'
import Masa from '@/components/Faces/Masa.vue'
import Ming from '@/components/Faces/Ming.vue'

definePageMeta({
  layout: 'full-width',
})

const members = [
  { id: 'ming', name: '冠佑', component: Ming },
  { id: 'masa', name: '玛莎', component: Masa },
  { id: 'ashin', name: '阿信', component: Ashin },
  { id: 'monster', name: '怪兽', component: Monster },
  { id: 'stone', name: '石头', component: Stone },
]

type MemberCard = {
  id: string
  name: string
  component: Component
}

const selectedMember = ref<MemberCard | null>(null)
const isDrawing = ref(false)

function pickRandomMember() {
  const randomIndex = Math.floor(Math.random() * members.length)
  return members[randomIndex] ?? members[0]!
}

const drawBlindBox = () => {
  if (isDrawing.value) return
  
  isDrawing.value = true
  selectedMember.value = null
  
  // Simulate drawing animation
  let count = 0
  const interval = setInterval(() => {
    selectedMember.value = pickRandomMember()
    count++
    
    if (count > 10) {
      clearInterval(interval)
      isDrawing.value = false
      // Final selection
      selectedMember.value = pickRandomMember()
    }
  }, 100)
}
</script>

<template>
  <div class="blind-box-page min-h-[100svh] flex flex-col items-center justify-center relative px-4 pt-36 pb-16 md:px-6">
    <header class="blind-box-heading"><p>THE UNEXPECTED / BLIND BOX</p><h1>五球盲盒<span>下一位，会是谁？</span></h1></header>

    <!-- Display Area -->
    <div class="w-full max-w-4xl mb-12 min-h-[300px] flex items-center justify-center">
      <transition
        enter-active-class="transition-all duration-500 ease-out"
        enter-from-class="opacity-0 scale-50 rotate-12"
        enter-to-class="opacity-100 scale-100 rotate-0"
        leave-active-class="transition-all duration-300 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-50 -rotate-12"
        mode="out-in"
      >
        <div v-if="selectedMember" :key="selectedMember.id" class="text-center flex flex-col items-center">
          <div class="transform scale-150 mb-8">
            <component :is="selectedMember.component" />
          </div>
          <h2 class="text-3xl font-bold text-[var(--text-primary)] mt-4 animate-pulse">
            {{ isDrawing ? '抽取中...' : `恭喜获得：${selectedMember.name}！` }}
          </h2>
        </div>
        
        <!-- Default State: Show all small -->
        <div v-else class="flex flex-wrap justify-center gap-8 opacity-50">
          <div v-for="m in members" :key="m.id" class="transform scale-75 grayscale hover:grayscale-0 transition-all duration-300">
            <component :is="m.component" />
          </div>
        </div>
      </transition>
    </div>

    <!-- Draw Button (Bottom Left Fixed) -->
    <div class="blind-box-action">
      <button
        :disabled="isDrawing"
        class="blind-box-button group relative px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        @click="drawBlindBox"
      >
        <span class="relative z-10 flex items-center gap-2">
          <Icon name="lucide:box" class="size-5" />
          {{ isDrawing ? '抽取中...' : '抽取盲盒' }}
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.blind-box-page { padding-inline: var(--site-pad); }
.blind-box-heading { width: 100%; border-top: 1px solid #333; padding-top: 25px; margin-bottom: 60px; }
.blind-box-heading p { font-size: 10px; letter-spacing: .16em; color: #888; }
.blind-box-heading h1 { font-size: clamp(40px, 6vw, 86px); letter-spacing: -.05em; font-weight: 500; line-height: 1.2; margin-top: 30px; }
.blind-box-heading h1 span { display: block; font-size: 13px; font-weight: 300; letter-spacing: 0; color: #999; margin-top: 25px; }
.blind-box-action { margin-top: 30px; border-top: 1px solid #333; width: 100%; padding-top: 30px; display: flex; justify-content: center; }
.blind-box-button { border: 1px solid #aaa; border-radius: 6px; color: #fff; background: transparent; font-size: 13px; font-weight: 400; cursor: pointer; transition: background .25s, color .25s; }
.blind-box-button:hover:not(:disabled) { background: #fff; color: #000; }
@media(max-width:640px) { .blind-box-heading { margin-bottom: 40px; } }
</style>
