<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
  layout: 'admin',
})
</script>

<template>
  <div>
    <LandingsViewCreateEdit :new="false" />
  </div>
</template>
