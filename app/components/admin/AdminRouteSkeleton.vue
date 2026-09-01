<template>
  <section
    class="cms-page min-h-[calc(100dvh-3.25rem)] bg-[var(--bg-primary)]"
    role="status"
    aria-live="polite"
    aria-label="正在加载页面内容"
  >
    <span class="sr-only">正在加载页面内容</span>

    <div class="flex items-center justify-between gap-6">
      <div class="min-w-0 flex-1 space-y-2.5">
        <UiSkeleton class="h-7 w-40 max-w-[55vw]" />
        <UiSkeleton class="h-4 w-64 max-w-[70vw]" />
      </div>
      <UiSkeleton class="hidden h-9 w-24 sm:block" />
    </div>

    <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="index in 4"
        :key="`metric-${index}`"
        class="rounded-md border border-[var(--border-soft)] bg-[var(--surface-card)] p-5"
      >
        <div class="flex items-center justify-between gap-4">
          <UiSkeleton class="h-4 w-20" />
          <UiSkeleton class="size-8" />
        </div>
        <UiSkeleton class="mt-5 h-8 w-24" />
        <UiSkeleton class="mt-3 h-3.5 w-32 max-w-full" />
      </div>
    </div>

    <div class="mt-6 overflow-hidden rounded-md border border-[var(--border-soft)] bg-[var(--surface-card)]">
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-soft)] p-4 lg:p-5">
        <div class="flex items-center gap-3">
          <UiSkeleton class="h-9 w-56 max-w-[55vw]" />
          <UiSkeleton class="hidden h-9 w-28 sm:block" />
        </div>
        <UiSkeleton class="h-4 w-20" />
      </div>

      <div class="divide-y divide-[var(--border-soft)]">
        <div
          v-for="index in 6"
          :key="`row-${index}`"
          class="grid min-h-16 grid-cols-[minmax(0,1fr)_5rem] items-center gap-5 px-4 py-3 lg:grid-cols-[minmax(14rem,1.5fr)_minmax(8rem,0.7fr)_7rem_5rem] lg:px-5"
        >
          <div class="flex min-w-0 items-center gap-3">
            <UiSkeleton class="size-10 shrink-0" />
            <div class="min-w-0 flex-1 space-y-2">
              <UiSkeleton class="h-4" :class="index % 2 === 0 ? 'w-2/3' : 'w-4/5'" />
              <UiSkeleton class="h-3 w-1/2" />
            </div>
          </div>
          <UiSkeleton class="hidden h-4 w-24 lg:block" />
          <UiSkeleton class="hidden h-6 w-16 lg:block" />
          <div class="flex justify-end gap-2">
            <UiSkeleton class="size-8" />
            <UiSkeleton class="hidden size-8 sm:block" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
