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

const drawBlindBox = () => {
  if (isDrawing.value) return
  
  isDrawing.value = true
  selectedMember.value = null
  
  // Simulate drawing animation
  let count = 0
  const interval = setInterval(() => {
    const randomIndex = Math.floor(Math.random() * members.length)
    selectedMember.value = members[randomIndex]
    count++
    
    if (count > 10) {
      clearInterval(interval)
      isDrawing.value = false
      // Final selection
      const finalIndex = Math.floor(Math.random() * members.length)
      selectedMember.value = members[finalIndex]
    }
  }, 100)
}
</script>

<template>
  <div class="min-h-[80vh] flex flex-col items-center justify-center relative px-4 pt-28 pb-12 md:px-6">
    <h1 class="text-4xl font-bold mb-16 text-center text-gradient-blue drop-shadow-sm">五球盲盒</h1>

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
    <div class="fixed bottom-8 left-8 z-50">
      <button
        :disabled="isDrawing"
        class="group relative px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-bold shadow-[0_0_20px_rgba(8,145,178,0.5)] transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
        @click="drawBlindBox"
      >
        <span class="relative z-10 flex items-center gap-2">
          <Icon name="lucide:box" class="size-5" />
          {{ isDrawing ? '抽取中...' : '抽取盲盒' }}
        </span>
        <div class="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </button>
    </div>
  </div>
</template>
