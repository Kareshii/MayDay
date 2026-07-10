import type { InjectionKey, Ref } from 'vue'

export interface AppleCarouselContext {
  currentIndex: Ref<number>
  onCardClose: (index: number) => void
}

export const AppleCarouselKey = Symbol('AppleCarousel') as InjectionKey<AppleCarouselContext>
