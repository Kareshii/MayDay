<script setup lang="ts">
const props = withDefaults(defineProps<{
  open: boolean
  title?: string
  description?: string
}>(), {
  title: '放弃未保存的更改？',
  description: '当前修改尚未保存，关闭后将无法恢复。',
})

const emit = defineEmits<{
  'update:open': [open: boolean]
  confirm: []
}>()
</script>

<template>
  <UiAlertDialog :open="props.open" @update:open="emit('update:open', $event)">
    <UiAlertDialogContent>
      <UiAlertDialogHeader>
        <UiAlertDialogTitle>{{ props.title }}</UiAlertDialogTitle>
        <UiAlertDialogDescription>{{ props.description }}</UiAlertDialogDescription>
      </UiAlertDialogHeader>
      <UiAlertDialogFooter>
        <UiAlertDialogCancel>继续编辑</UiAlertDialogCancel>
        <UiAlertDialogAction variant="destructive" @click="emit('confirm')">
          放弃更改
        </UiAlertDialogAction>
      </UiAlertDialogFooter>
    </UiAlertDialogContent>
  </UiAlertDialog>
</template>
