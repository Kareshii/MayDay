export type TableAlign = 'left' | 'center' | 'right'
export type TableSize = 'small' | 'default' | 'large'
export type TableFormatter = (item: object, column: TableColumn, value: unknown, rowIndex: number) => unknown

export interface TableColumn {
  prop: string
  label: string
  width?: number | string
  minWidth?: number | string
  align?: TableAlign
  headerAlign?: TableAlign
  formatter?: TableFormatter
  showOverflowTooltip?: boolean
  class?: string
  headerClass?: string
  cellClass?: string
}
