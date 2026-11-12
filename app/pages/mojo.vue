<script setup lang="ts">
import { mojoItems } from '@/utils/mojoData'
const { isOwned, toggleOwnership, isReady } = useMojoStorage()
const ownedCount = computed(() => mojoItems.filter(item => isOwned(item.id)).length)
useSeoMeta({ title: 'Mojo Family' })
</script>

<template>
  <section class="mojo-page container">
    <header class="collection-header">
      <div><p class="section-kicker">THE COLLECTION / MOJO FAMILY</p><h1>小小的收藏。<br><span>大大的世界。</span></h1></div>
      <div class="collection-intro"><p>Collect them all.<br>点击卡片，标记属于你的 Mojo。</p><span v-if="isReady">{{ String(ownedCount).padStart(2, '0') }} / {{ mojoItems.length }} COLLECTED</span></div>
    </header>
    <div v-if="isReady" class="collection-grid">
      <button v-for="(item, index) in mojoItems" :key="item.id" type="button" class="collection-item" :class="{ owned: isOwned(item.id) }" :aria-pressed="isOwned(item.id)" @click="toggleOwnership(item.id)">
        <div class="collection-image"><img :src="item.image" :alt="item.name" loading="lazy"><span class="collection-index">{{ String(index + 1).padStart(2, '0') }}</span><span v-if="isOwned(item.id)" class="collection-check"><Icon name="lucide:check" /></span></div>
        <div class="collection-caption"><h2>{{ item.name }}</h2><span>{{ isOwned(item.id) ? 'COLLECTED' : 'COLLECT' }} <Icon name="lucide:arrow-up-right" /></span></div><p>{{ item.description }}</p>
      </button>
    </div>
    <p v-else class="collection-loading" role="status">正在整理收藏…</p>
  </section>
</template>

<style scoped>
.mojo-page { padding-top: 100px; padding-bottom: 100px; }
.collection-header { display: flex; align-items: end; justify-content: space-between; gap: 40px; padding-bottom: 64px; border-bottom: 1px solid var(--border); }
h1 { font-size: clamp(42px, 6vw, 88px); line-height: 1.22; font-weight: 500; letter-spacing: -.055em; margin-top: 24px; }
h1 span { color: #777; }
.collection-intro { padding-bottom: 8px; font-size: 12px; color: #999; line-height: 2; }
.collection-intro > span { display: block; margin-top: 25px; letter-spacing: .12em; color: white; }
.collection-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 48px 24px; padding-top: 50px; }
.collection-item { min-width: 0; cursor: pointer; text-align: left; background: transparent; }
.collection-image { position: relative; aspect-ratio: 3/4; overflow: hidden; background: #101010; border: 1px solid #292929; }
.collection-image img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(1); opacity: .65; transition: filter .5s, opacity .5s, transform .6s; }
.collection-item:hover img, .collection-item.owned img { opacity: 1; filter: grayscale(0); }
.collection-item:hover img { transform: scale(1.035); }
.collection-item.owned .collection-image { border-color: white; }
.collection-index { position: absolute; top: 15px; left: 15px; background: #000a; color: #fff; padding: 3px 7px; font-size: 10px; }
.collection-check { display: grid; place-items: center; position: absolute; top: 15px; right: 15px; width: 26px; height: 26px; border-radius: 50%; color: #000; background: #fff; }
.collection-check .iconify { width: 15px; height: 15px; }
.collection-caption { display: flex; gap: 12px; justify-content: space-between; align-items: center; margin-top: 19px; }
.collection-caption h2 { font-size: 18px; font-weight: 500; }
.collection-caption span { display: flex; align-items: center; gap: 8px; font-size: 8px; color: #999; letter-spacing: .08em; }
.collection-item > p { color: #888; font-size: 11px; line-height: 1.9; margin-top: 10px; }
.collection-loading { padding: 80px 0; color: #999; font-size: 12px; }
@media(max-width: 1000px) { .collection-grid { grid-template-columns: repeat(3,minmax(0,1fr)); } }
@media(max-width: 640px) { .mojo-page { padding-top: 60px; padding-bottom: 60px; } .collection-header { flex-direction: column; align-items: start; padding-bottom: 35px; gap: 25px; } .collection-grid { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 35px 16px; padding-top: 30px; } .collection-caption { align-items: start; flex-direction: column; gap: 6px; } .collection-caption h2 { font-size: 16px; } }
</style>
