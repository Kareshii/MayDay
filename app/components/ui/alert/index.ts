import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Alert } from "./Alert.vue"
export { default as AlertAction } from "./AlertAction.vue"
export { default as AlertDescription } from "./AlertDescription.vue"
export { default as AlertTitle } from "./AlertTitle.vue"

export const alertVariants = cva('grid gap-0.5 rounded-lg border px-4 py-3 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*=size-])]:size-4 group/alert relative w-full', {
  variants: {
    variant: {
      default: 'bg-card text-card-foreground',
      info: 'border-[var(--info-border)] bg-[var(--info-soft)] text-[var(--info)] *:data-[slot=alert-description]:text-current',
      success: 'border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success)] *:data-[slot=alert-description]:text-current',
      warning: 'border-[var(--warning-border)] bg-[var(--warning-soft)] text-[var(--warning)] *:data-[slot=alert-description]:text-current',
      destructive: 'text-destructive bg-card *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current',
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export type AlertVariants = VariantProps<typeof alertVariants>
