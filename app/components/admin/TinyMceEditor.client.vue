<script setup lang="ts">
import Editor from '@tinymce/tinymce-vue'
import tinymce from 'tinymce/tinymce'

import 'tinymce/icons/default'
import 'tinymce/models/dom'
import 'tinymce/themes/silver'
import 'tinymce/plugins/advlist'
import 'tinymce/plugins/anchor'
import 'tinymce/plugins/autolink'
import 'tinymce/plugins/charmap'
import 'tinymce/plugins/code'
import 'tinymce/plugins/fullscreen'
import 'tinymce/plugins/help'
import 'tinymce/plugins/image'
import 'tinymce/plugins/link'
import 'tinymce/plugins/lists'
import 'tinymce/plugins/media'
import 'tinymce/plugins/preview'
import 'tinymce/plugins/searchreplace'
import 'tinymce/plugins/table'
import 'tinymce/plugins/visualblocks'
import 'tinymce/plugins/wordcount'
import 'tinymce/skins/ui/oxide/skin.css'

import contentUiSkinCss from 'tinymce/skins/ui/oxide/content.css?inline'
import contentCss from 'tinymce/skins/content/default/content.css?inline'

const model = defineModel<string>({ default: '' })
const props = withDefaults(defineProps<{
  disabled?: boolean
}>(), {
  disabled: false,
})

const editorConfig = {
  height: 560,
  menubar: 'file edit view insert format table tools help',
  plugins: 'advlist anchor autolink charmap code fullscreen help image link lists media preview searchreplace table visualblocks wordcount',
  toolbar:
    'undo redo | blocks fontsize | bold italic underline strikethrough | ' +
    'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | ' +
    'link image media table | blockquote code fullscreen preview | removeformat help',
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
    'body { font-family: "Avenir Next", "PingFang SC", "Noto Sans SC", sans-serif; font-size: 16px; line-height: 1.75; padding: 1rem; }',
    'img { max-width: 100%; height: auto; border-radius: 16px; }',
    'blockquote { border-left: 4px solid #0891b2; margin: 1.5rem 0; padding: 0.5rem 0 0.5rem 1rem; color: #475569; }',
  ].join('\n'),
}
</script>

<template>
  <ClientOnly fallback-tag="div" fallback="正在加载编辑器...">
    <Editor
      v-model="model"
      :tinymce="tinymce"
      license-key="gpl"
      :disabled="props.disabled"
      :init="editorConfig"
    />
  </ClientOnly>
</template>
