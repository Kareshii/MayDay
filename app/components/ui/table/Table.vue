<script setup lang="ts">
import { Primitive } from 'reka-ui'
import type { CSSProperties } from 'vue'
import type { TableAlign, TableColumn, TableSize } from './types'
import TableBody from './TableBody.vue'
import TableCell from './TableCell.vue'
import TableHead from './TableHead.vue'
import TableHeader from './TableHeader.vue'
import TableRow from './TableRow.vue'
import Pagination from '../pagination/Pagination.vue'
import PaginationEllipsis from '../pagination/PaginationEllipsis.vue'
import PaginationList from '../pagination/PaginationList.vue'
import PaginationListItem from '../pagination/PaginationListItem.vue'
import PaginationNext from '../pagination/PaginationNext.vue'
import PaginationPrev from '../pagination/PaginationPrev.vue'
import Button from '../button/Button.vue'
import Skeleton from '../skeleton/Skeleton.vue'
import { cn } from '@/utils/cn'

interface Props {
  class?: string
  columns?: readonly TableColumn[]
  items?: readonly object[]
  rowKey?: string | ((item: object, index: number) => string | number)
  rowClass?: string | ((item: object, index: number) => string | undefined)
  headerRowClass?: string
  stripe?: boolean
  border?: boolean
  hover?: boolean
  size?: TableSize
  loading?: boolean
  loadingText?: string
  error?: string
  retryLabel?: string
  emptyText?: string
  showHeader?: boolean
  height?: number | string
  maxHeight?: number | string
  pagination?: boolean
  page?: number
  itemsPerPage?: number
  total?: number
  siblingCount?: number
  showEdges?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
  columns: () => [],
  items: () => [],
  rowKey: 'id',
  rowClass: '',
  headerRowClass: '',
  stripe: false,
  border: false,
  hover: true,
  size: 'default',
  loading: false,
  loadingText: '正在加载...',
  error: '',
  retryLabel: '重试',
  emptyText: '暂无数据',
  showHeader: true,
  height: undefined,
  maxHeight: undefined,
  pagination: false,
  page: 1,
  itemsPerPage: 20,
  total: 0,
  siblingCount: 1,
  showEdges: true,
})

const emit = defineEmits<{
  'update:page': [page: number]
  retry: []
}>()

const managed = computed(() => props.columns.length > 0)
const constrainedHeight = computed(() => props.height !== undefined || props.maxHeight !== undefined)
const scrollStyle = computed<CSSProperties>(() => ({
  height: toCssSize(props.height),
  maxHeight: toCssSize(props.maxHeight),
}))
const pageStart = computed(() => {
  if (!props.total || !props.items.length) {
    return 0
  }

  return (props.page - 1) * props.itemsPerPage + 1
})
const pageEnd = computed(() => {
  if (!pageStart.value) {
    return 0
  }

  return Math.min(pageStart.value + props.items.length - 1, props.total)
})

function toCssSize(value?: number | string) {
  return typeof value === 'number' ? `${value}px` : value
}

function getItemValue(item: object, prop: string) {
  return (item as Record<string, unknown>)[prop]
}

function getItemKey(item: object, index: number) {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(item, index)
  }

  const value = getItemValue(item, props.rowKey)
  return typeof value === 'string' || typeof value === 'number' ? value : index
}

function getRowClass(item: object, index: number) {
  const customClass = typeof props.rowClass === 'function'
    ? props.rowClass(item, index)
    : props.rowClass

  return cn(
    props.stripe && index % 2 === 1 ? 'bg-[var(--surface-low)]/60' : '',
    !props.hover ? 'hover:bg-transparent' : '',
    customClass,
  )
}

function getColumnStyle(column: TableColumn): CSSProperties {
  return {
    width: toCssSize(column.width),
    minWidth: toCssSize(column.minWidth),
  }
}

function getFormattedValue(item: object, column: TableColumn, rowIndex: number) {
  const value = getItemValue(item, column.prop)
  return column.formatter ? column.formatter(item, column, value, rowIndex) : value
}

function getCellTitle(item: object, column: TableColumn, rowIndex: number) {
  if (!column.showOverflowTooltip) {
    return undefined
  }

  const value = getFormattedValue(item, column, rowIndex)
  return value === undefined || value === null ? '' : String(value)
}

function getAlignClass(align?: TableAlign) {
  return align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
}

function getHeaderClass(column: TableColumn) {
  return cn(
    getAlignClass(column.headerAlign || column.align),
    props.border ? 'border-r border-[var(--border-soft)] last:border-r-0' : '',
    column.showOverflowTooltip ? 'max-w-0 truncate' : '',
    column.class,
    column.headerClass,
  )
}

function getCellClass(column: TableColumn) {
  const sizeClass = props.size === 'small'
    ? 'px-3 py-2'
    : props.size === 'large'
      ? 'px-5 py-4'
      : 'px-4 py-3'

  return cn(
    sizeClass,
    getAlignClass(column.align),
    props.border ? 'border-r border-[var(--border-soft)] last:border-r-0' : '',
    column.class,
    column.cellClass,
  )
}
</script>

<template>
  <div class="w-full">
    <div class="w-full overflow-auto" :style="scrollStyle">
      <Primitive
        as="table"
        :class="cn('w-full caption-bottom text-left text-sm', props.class)"
      >
        <template v-if="managed">
          <TableHeader v-if="props.showHeader" :class="constrainedHeight ? 'sticky top-0 z-10' : ''">
            <TableRow :class="cn('hover:bg-transparent', props.headerRowClass)">
              <TableHead
                v-for="column in props.columns"
                :key="column.prop"
                :class="getHeaderClass(column)"
                :style="getColumnStyle(column)"
              >
                <slot :name="`header-${column.prop}`" :column="column">
                  {{ column.label }}
                </slot>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <TableRow v-if="props.loading" class="hover:bg-transparent">
              <TableCell :colspan="props.columns.length" class="h-32">
                <div class="space-y-3" role="status" :aria-label="props.loadingText">
                  <Skeleton class="h-4 w-full" />
                  <Skeleton class="h-4 w-11/12" />
                  <Skeleton class="h-4 w-4/5" />
                  <span class="sr-only">{{ props.loadingText }}</span>
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-else-if="props.error" class="hover:bg-transparent">
              <TableCell :colspan="props.columns.length" class="h-32 text-center">
                <div class="flex flex-col items-center justify-center gap-3 text-[var(--text-secondary)]" role="alert">
                  <span class="inline-flex items-center gap-2">
                    <Icon name="lucide:circle-alert" class="size-4 text-[var(--danger)]" />
                    {{ props.error }}
                  </span>
                  <Button size="sm" variant="outline" @click="emit('retry')">
                    <Icon name="lucide:refresh-cw" class="size-4" />
                    {{ props.retryLabel }}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-else-if="!props.items.length" class="hover:bg-transparent">
              <TableCell :colspan="props.columns.length" class="h-32 text-center text-[var(--text-secondary)]">
                {{ props.emptyText }}
              </TableCell>
            </TableRow>
            <TableRow
              v-for="(item, rowIndex) in props.loading || props.error ? [] : props.items"
              :key="getItemKey(item, rowIndex)"
              :class="getRowClass(item, rowIndex)"
            >
              <TableCell
                v-for="column in props.columns"
                :key="column.prop"
                :class="getCellClass(column)"
                :style="getColumnStyle(column)"
                :title="getCellTitle(item, column, rowIndex)"
              >
                <slot
                  :name="`cell-${column.prop}`"
                  :item="item"
                  :column="column"
                  :value="getFormattedValue(item, column, rowIndex)"
                  :row-index="rowIndex"
                >
                  <slot
                    name="cell"
                    :item="item"
                    :column="column"
                    :value="getFormattedValue(item, column, rowIndex)"
                    :row-index="rowIndex"
                  >
                    {{ getFormattedValue(item, column, rowIndex) ?? '—' }}
                  </slot>
                </slot>
              </TableCell>
            </TableRow>
          </TableBody>
        </template>

        <slot v-else />
      </Primitive>
    </div>

    <div
      v-if="props.pagination && !props.error"
      class="flex flex-col gap-3 border-t border-[var(--border-soft)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p class="text-xs text-[var(--text-secondary)]">
        显示 <span class="font-medium tabular-nums text-[var(--text-primary)]">{{ pageStart }} - {{ pageEnd }}</span> / {{ props.total }}
      </p>
      <Pagination
        :page="props.page"
        :items-per-page="props.itemsPerPage"
        :total="props.total"
        :sibling-count="props.siblingCount"
        :show-edges="props.showEdges"
        @update:page="emit('update:page', $event)"
      >
        <PaginationPrev>
          <Icon name="lucide:chevron-left" class="size-4" />
          上一页
        </PaginationPrev>
        <PaginationList v-slot="{ items: paginationItems }">
          <template
            v-for="(item, index) in paginationItems"
            :key="item.type === 'page' ? item.value : `ellipsis-${index}`"
          >
            <PaginationListItem
              v-if="item.type === 'page'"
              :value="item.value"
            >
              {{ item.value }}
            </PaginationListItem>
            <PaginationEllipsis v-else />
          </template>
        </PaginationList>
        <PaginationNext>
          下一页
          <Icon name="lucide:chevron-right" class="size-4" />
        </PaginationNext>
      </Pagination>
    </div>
  </div>
</template>
