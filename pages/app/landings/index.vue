<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
  layout: 'admin',
})
</script>

<template>
  <div>
    <TabView>
      <TabPanel header="Residenciales">
        <LandingsList />
      </TabPanel>
      <TabPanel header="Industriales">
        <!-- <ContractsList /> -->
      </TabPanel>
    </TabView>
  </div>
</template>
