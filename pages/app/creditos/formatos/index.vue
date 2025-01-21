<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
  layout: 'admin',
})
</script>

<template>
  <div>
    <NuxtLink to="/app/creditos/formatos/santander">
      Santander
    </NuxtLink>
  </div>
</template>
