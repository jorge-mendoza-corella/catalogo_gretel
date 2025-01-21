<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
  layout: 'admin',
})
</script>

<template>
  <div>
    <TabView>
      <TabPanel header="Contratos">
        <ContractsCollections />
      </TabPanel>
      <TabPanel header="Plantillas">
        <ContractsList />
      </TabPanel>
      <TabPanel header="Etiquetas">
        <ContractsTags />
      </TabPanel>
    </TabView>
  </div>
</template>
