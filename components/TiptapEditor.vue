<script setup lang="ts">
import { BubbleMenu, EditorContent, useEditor } from '@tiptap/vue-3'

import CharacterCount from '@tiptap/extension-character-count'

import StarterKit from '@tiptap/starter-kit'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  id: {
    type: String,
    default: '',
  },
  validation: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['update:modelValue'])
const editor = useEditor({
  content: '<p></p>',
  extensions: [
    StarterKit,
    CharacterCount.configure({
      limit: 5000,
    }),
  ],
  onUpdate: () => {
    emit('update:modelValue', editor?.value?.getHTML())
  },
})
watch(
  () => props.modelValue,
  (newValue) => {
    const isSame = editor?.value?.getHTML() === newValue
    if (isSame)
      return

    const value = newValue
    editor?.value?.commands.setContent(value, false)
  },
)

const count = computed(() => {
  return editor?.value?.storage.characterCount.characters()
})
</script>

<template>
  <div class="surface-ground px-3 py-1 border-round-md border-1 border-solid" :class="{ 'border-red-500': props.validation, 'surface-border': !props.validation }">
    <BubbleMenu
      v-if="editor"
      :editor="editor"
      :tippy-options="{ duration: 100 }"
    >
      <Button rounded :severity="editor.isActive('bold') ? 'primary' : 'secondary'" class="mr-2" @click="editor.chain().focus().toggleBold().run()">
        <Icon name="ic:baseline-format-bold" color="white" />
      </Button>
      <Button rounded :severity="editor.isActive('italic') ? 'primary' : 'secondary'" class="mr-2" @click="editor.chain().focus().toggleItalic().run()">
        <Icon name="ic:baseline-format-italic" color="white" />
      </Button>
      <Button rounded :severity="editor.isActive('strike') ? 'primary' : 'secondary'" class="mr-2" @click="editor.chain().focus().toggleStrike().run()">
        <Icon name="ic:baseline-strikethrough-s" color="white" />
      </Button>
    </BubbleMenu>
    <EditorContent :id="props.id" :key="props.id" :editor="editor" />
    <div class="flex justify-content-end">
      {{ count }}
    </div>
  </div>
</template>

<style>
  .ProseMirror {
    min-height: 150px;
  }
  .ProseMirror:focus {
    outline: none;
  }
</style>
