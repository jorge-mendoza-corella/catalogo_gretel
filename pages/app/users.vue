<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
  layout: 'admin',
})
</script>

<template>
  <div>
    <UsersList />
  </div>
</template>
