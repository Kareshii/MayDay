<script setup lang="ts">
const { members } = useMaydayData()

const selectedMember = ref<number | null>(null)

const selectMember = (id: number) => {
  selectedMember.value = id
}

const currentMember = computed(() => {
  if (!selectedMember.value) return null
  return members.value.find(m => m.id === selectedMember.value)
})
</script>

<template>
  <div>
    <!-- Member Cards Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6 mb-12">
      <BaseCard
        v-for="member in members"
        :key="member.id"
        :hoverable="true"
        :clickable="true"
        padding="none"
        class="cursor-pointer group"
        :class="selectedMember === member.id ? 'ring-4 ring-blue-500' : ''"
        @click="selectMember(member.id)"
      >
        <div class="image-zoom">
          <img 
            :src="member.avatar" 
            :alt="member.name"
            class="w-full aspect-square object-cover"
          />
        </div>
        <div class="p-4 text-center">
          <h3 class="font-bold text-lg text-white group-hover:text-cyan-400 transition-colors">
            {{ member.name }}
          </h3>
          <p class="text-sm text-gray-400 group-hover:text-cyan-300 transition-colors">
            {{ member.role }}
          </p>
        </div>
      </BaseCard>
    </div>

    <!-- Selected Member Details -->
    <transition
      enter-active-class="transition-all duration-500"
      enter-from-class="opacity-0 translate-y-8"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-300"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-8"
      mode="out-in"
    >
      <BaseCard v-if="currentMember" :key="currentMember.id" padding="lg">
        <div class="flex flex-col md:flex-row gap-8">
          <!-- Profile Image -->
          <div class="md:w-1/3">
            <img 
              :src="currentMember.avatar" 
              :alt="currentMember.name"
              class="w-full rounded-xl shadow-lg border border-white/10"
            />
          </div>

          <!-- Member Info -->
          <div class="md:w-2/3">
            <div class="flex items-start justify-between mb-4">
              <div>
                <h2 class="text-3xl font-bold mb-2 text-white">
                  {{ currentMember.name }}
                </h2>
                <p class="text-xl text-gray-400 mb-1">
                  {{ currentMember.realName }}
                </p>
                <p class="text-lg text-cyan-400">
                  {{ currentMember.role }}
                </p>
              </div>
            </div>

            <p class="text-gray-300 leading-relaxed mb-6">
              {{ currentMember.bio }}
            </p>

            <div class="space-y-3 mb-6">
              <div class="flex items-center gap-3">
                <Icon name="lucide:calendar" class="size-5 text-cyan-500" />
                <span class="text-gray-300">
                  出生年份: <span class="font-semibold text-white">{{ currentMember.birthYear }}</span>
                </span>
              </div>
              <div class="flex items-center gap-3">
                <Icon name="lucide:heart" class="size-5 text-cyan-500" />
                <span class="text-gray-300">
                  兴趣爱好: <span class="font-semibold text-white">{{ currentMember.hobby }}</span>
                </span>
              </div>
            </div>

            <blockquote class="border-l-4 border-cyan-500 pl-4 py-2 italic text-gray-400 bg-white/5 rounded-r-lg">
              "{{ currentMember.quote }}"
            </blockquote>

            <!-- Gallery -->
            <div class="mt-8">
              <h3 class="text-xl font-bold mb-4 text-white">
                精彩瞬间
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <div 
                  v-for="(photo, index) in currentMember.gallery"
                  :key="index"
                  class="image-zoom rounded-lg overflow-hidden border border-white/10"
                >
                  <img 
                    :src="photo" 
                    :alt="`${currentMember.name} ${index + 1}`"
                    class="w-full h-48 object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Placeholder -->
      <div v-else class="text-center py-16">
        <Icon name="lucide:user-circle" class="size-24 mx-auto mb-4 text-gray-600" />
        <p class="text-gray-500 text-lg">
          点击上方成员卡片查看详细介绍
        </p>
      </div>
    </transition>
  </div>
</template>
