<script setup lang="ts">
// define component props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  modal: {
    type: Boolean,
    default: false,
  },
  header: {
    type: String,
    default: '',
  },
})
const dialog = ref(true)
</script>

<template>
  <div>
    <Dialog v-model:visible="dialog" modal header="Header" :style="{ width: '50vw' }">
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </p>
    </Dialog>
  </div>
</template>
