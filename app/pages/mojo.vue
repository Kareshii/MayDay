<script setup lang="ts">
import { mojoItems } from '@/utils/mojoData'

const { isOwned, toggleOwnership, isReady } = useMojoStorage()
</script>

<template>
  <div class="min-h-screen py-12">
    <!-- Header -->
    <div class="text-center mb-16">
      <h1 class="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500 drop-shadow-sm">
        Mojo Family
      </h1>
      <p class="text-gray-500 dark:text-gray-400 text-lg">
        Collect them all! Click to mark as owned.
      </p>
    </div>

    <!-- Grid -->
    <div v-if="isReady" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        <div
          v-for="item in mojoItems"
          :key="item.id"
          @click="toggleOwnership(item.id)"
          class="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer transition-all duration-500"
          :class="[
            isOwned(item.id) 
              ? 'shadow-[0_0_30px_rgba(249,115,22,0.3)] scale-105' 
              : 'grayscale opacity-60 hover:opacity-100 hover:grayscale-0 hover:scale-105'
          ]"
        >
          <!-- Background Image -->
          <img 
            :src="item.image" 
            :alt="item.name"
            class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />

          <!-- Overlay Gradient -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>

          <!-- Active Border (Inner) -->
          <div 
            class="absolute inset-0 border-4 border-orange-500/0 transition-all duration-300 rounded-2xl z-20"
            :class="{ 'border-orange-500/80': isOwned(item.id) }"
          ></div>

          <!-- Content -->
          <div class="absolute bottom-0 left-0 right-0 p-6 transform transition-transform duration-300 translate-y-2 group-hover:translate-y-0 z-30">
            <div class="flex justify-between items-end mb-1">
              <h3 class="text-xl font-bold text-white">
                {{ item.name }}
              </h3>
              <!-- Small Collected Label -->
              <span v-if="isOwned(item.id)" class="text-[10px] font-black tracking-widest text-orange-400 uppercase">
                Collected
              </span>
            </div>
            <p class="text-xs text-gray-300 line-clamp-2 group-hover:line-clamp-none transition-all">
              {{ item.description }}
            </p>
          </div>
          
          <!-- Sleek Check Badge -->
          <transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 scale-50 rotate-45"
            enter-to-class="opacity-100 scale-100 rotate-0"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-50"
          >
            <div v-if="isOwned(item.id)" class="absolute top-4 right-4 z-30">
              <div class="size-9 bg-gradient-to-br from-orange-400 to-red-500 rounded-full shadow-lg shadow-orange-500/30 flex items-center justify-center">
                <Icon name="lucide:check" class="size-5 text-white stroke-[3]" />
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-else class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
    </div>
  </div>
</template>
