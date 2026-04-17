<script setup lang="ts">
import { shallowRef } from 'vue'

import 'tinymce/skins/ui/oxide/skin.css'

import contentUiSkinCss from 'tinymce/skins/ui/oxide/content.css?inline'
import contentCss from 'tinymce/skins/content/default/content.css?inline'

const model = defineModel<string>({ default: '' })
const props = withDefaults(defineProps<{
  disabled?: boolean
}>(), {
  disabled: false,
})

const editorComponent = shallowRef<unknown>(null)
const tinymceInstance = shallowRef<unknown>(null)

const editorConfig = {
  height: 620,
  menubar: 'file edit view insert format table tools help',
  plugins: 'advlist anchor autolink charmap code fullscreen help image link lists media preview searchreplace table visualblocks wordcount',
  toolbar:
    'undo redo | blocks fontsize | bold italic underline strikethrough | ' +
    'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | ' +
    'link image media table | blockquote code fullscreen preview | removeformat help',
  toolbar_mode: 'sliding',
  branding: false,
  promotion: false,
  resize: true,
  image_caption: true,
  automatic_uploads: true,
  paste_data_images: true,
  convert_urls: false,
  skin: false,
  content_css: false,
  content_style: [
    contentUiSkinCss,
    contentCss,
    'body { font-family: "Inter", "Avenir Next", "PingFang SC", "Noto Sans SC", sans-serif; font-size: 16px; line-height: 1.8; padding: 1.2rem; color: #141b2c; }',
    'img { max-width: 100%; height: auto; border-radius: 16px; }',
    'blockquote { border-left: 4px solid #005fb8; margin: 1.5rem 0; padding: 0.5rem 0 0.5rem 1rem; color: #4a5568; background: #f6f8ff; border-radius: 0 10px 10px 0; }',
  ].join('\n'),
}

onMounted(async () => {
  if (!import.meta.client) {
    return
  }

  const [{ default: Editor }, { default: tinymce }] = await Promise.all([
    import('@tinymce/tinymce-vue'),
    import('tinymce/tinymce'),
  ])

  await Promise.all([
    import('tinymce/icons/default'),
    import('tinymce/models/dom'),
    import('tinymce/themes/silver'),
    import('tinymce/plugins/advlist'),
    import('tinymce/plugins/anchor'),
    import('tinymce/plugins/autolink'),
    import('tinymce/plugins/charmap'),
    import('tinymce/plugins/code'),
    import('tinymce/plugins/fullscreen'),
    import('tinymce/plugins/help'),
    import('tinymce/plugins/image'),
    import('tinymce/plugins/link'),
    import('tinymce/plugins/lists'),
    import('tinymce/plugins/media'),
    import('tinymce/plugins/preview'),
    import('tinymce/plugins/searchreplace'),
    import('tinymce/plugins/table'),
    import('tinymce/plugins/visualblocks'),
    import('tinymce/plugins/wordcount'),
  ])

  editorComponent.value = Editor
  tinymceInstance.value = tinymce
})
</script>

<template>
  <ClientOnly fallback-tag="div" fallback="正在加载编辑器...">
    <div class="cms-editor-shell">
      <component
        :is="editorComponent"
        v-if="editorComponent && tinymceInstance"
        v-model="model"
        :tinymce="tinymceInstance"
        license-key="gpl"
        :disabled="props.disabled"
        :init="editorConfig"
      />
      <div v-else class="px-4 py-10 text-sm text-[var(--text-secondary)]">
        正在加载编辑器...
      </div>
    </div>
  </ClientOnly>
</template>

<style scoped>
.cms-editor-shell {
  border: 1px solid var(--border-soft);
  border-radius: 1rem;
  background: var(--surface-card);
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(194, 198, 212, 0.12);
}

.cms-editor-shell :deep(.tox) {
  border: 0;
  font-family: "Inter", "Avenir Next", "PingFang SC", "Noto Sans SC", sans-serif;
}

.cms-editor-shell :deep(.tox-toolbar__primary),
.cms-editor-shell :deep(.tox-editor-header),
.cms-editor-shell :deep(.tox-toolbar-overlord) {
  background: var(--surface-low);
  border-color: var(--border-soft);
}

.cms-editor-shell :deep(.tox-statusbar) {
  border-top: 1px solid var(--border-soft);
  background: color-mix(in oklab, var(--surface-card) 88%, transparent);
}

.cms-editor-shell :deep(.tox-edit-area) {
  border-top: 1px solid var(--border-soft);
}

.cms-editor-shell :deep(.tox .tox-tbtn:hover),
.cms-editor-shell :deep(.tox .tox-tbtn--enabled),
.cms-editor-shell :deep(.tox .tox-tbtn:focus) {
  background: var(--primary-soft);
}
</style>
