<script setup lang="ts">
// import filters from "primevue/utils/filters";
import { FilterMatchMode } from 'primevue/api'

// import firebase utils
import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore'

// import firebase app composable
const { $db } = useNuxtApp()
// import notification composable
const notification = useNotification()
// import router
const router = useRouter()
// create data table ref
const dt = ref()
// create reactive data for users
const landings = ref([])
const selectedStatus = ref()
const status = ref([
  { name: 'Borrador', code: false },
  { name: 'Publicada', code: true },
])
const filteredLandings = computed(() => {
  if (selectedStatus.value !== null && selectedStatus.value !== undefined)
    return landings.value.filter((landing: { published: boolean }) => landing.published === selectedStatus.value)

  else
    return landings.value
})
const route = useRoute()
onBeforeMount(() => {
  if (route.query?.published)
    selectedStatus.value = route.query.published === 'true'
})

// create reactive data for delete landing dialog
const deleteLandingDialog = ref(false)
// create reactive data for active landing
const activeLanding = ref()
// create reactive data for filters
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})
// create reactive data for loading users
const loadingLandings = ref(true)
// create reactive data for submitted
const submitted = ref(false)
function confirmDeleteLanding(landing: any) {
  activeLanding.value = landing
  deleteLandingDialog.value = true
}

async function deleteLanding() {
  submitted.value = true
  try {
    await deleteDoc(doc($db(), 'landings', activeLanding.value.uid))
    // @ts-expect-error
    const index = landings.value.findIndex(obj => obj.slug === activeLanding.value.slug)
    if (index !== -1)
      landings.value.splice(index, 1)

    deleteLandingDialog.value = false
    submitted.value = false
    notification.value = {
      show: true,
      severity: 'success',
      summary: 'Éxito',
      detail: 'Landing eliminada correctamente',
      life: 5000,
    }
  }
  catch (error) {
    // error
    submitted.value = false
    notification.value = {
      show: true,
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo eliminar la landing',
      life: 5000,
    }
  }
}
// get users from db before mounting
async function getLandings() {
  const querySnapshot = await getDocs(collection($db(), 'landings'))
  // @ts-expect-error
  querySnapshot.forEach((doc: { id: any; data: () => any }) => landings.value.push({ uid: doc.id, ...doc.data() }))
  loadingLandings.value = false
}
// call getLandings before mounting
onBeforeMount(() => {
  getLandings()
})
</script>

<template>
  <div>
    <div class="card">
      <DataTable
        ref="dt"
        :value="filteredLandings"
        data-key="uid"
        :paginator="true"
        :rows="10"
        :filters="filters"
        paginator-template="PrevPageLink PageLinks NextPageLink"
        :rows-per-page-options="[5, 10, 25]"
        current-page-report-template="{first} a {last} de {totalRecords}"
        breakpoint="960px"
        responsive-layout="stack"
        striped-rows
      >
        <template #header>
          <div class="table-header flex flex-column md:flex-row md:justiify-content-between">
            <h5 class="mb-2 m-0 p-as-md-center text-xl">
              Administrar páginas
            </h5>
            <div>
              <div class="w-full md:w-auto flex gap-1 flex-wrap">
                <Dropdown
                  v-model="selectedStatus"
                  :options="status"
                  show-clear
                  option-label="name"
                  option-value="code"
                  placeholder="Filtrar por estado"
                  class="w-full md:w-auto"
                />
                <span class="p-input-icon-left w-full md:w-auto">
                  <i class="pi pi-search" />
                  <InputText v-model="filters.global.value" placeholder="Buscar..." class="w-full md:w-auto" />
                </span>
                <Button label="Nueva" icon="pi pi-plus" class="p-button-success w-full md:w-auto md:ml-2 my-2 md:my-0" @click="router.push('/app/landings/new')" />
              </div>
            </div>
          </div>
          <div v-if="loadingLandings" class="pt-2">
            <ProgressBar mode="indeterminate" style="height: .5em" />
          </div>
        </template>
        <Column field="title" header="Título" :sortable="true">
          <template #body="slotProps">
            <div v-tooltip.top="slotProps.data.title" class="c-column-for-text">
              {{ slotProps.data.title }}
            </div>
          </template>
        </Column>
        <Column field="slug" header="Enlace" :sortable="true">
          <template #body="slotProps">
            <div v-tooltip.top="slotProps.data.slug" class="c-column-for-text">
              {{ slotProps.data.slug }}
            </div>
          </template>
        </Column>
        <Column field="inventoryStatus" header="Estatus" :sortable="false">
          <template #body="slotProps">
            <div :class="slotProps.data.published ? 'status-badge' : 'draft-status-badge'">
              {{ slotProps.data.published ? 'Publicada' : 'Borrador' }}<div />
            </div>
          </template>
        </Column>
        <Column :exportable="false" header="Acciones">
          <template #body="slotProps">
            <div>
              <Button icon="pi pi-pencil" class="p-button-rounded p-button-success p-button-text" aria-controls="overlay_menu" :loading="submitted" @click="router.push(`/app/landings/${slotProps.data.uid}`)" />
              <Button icon="pi pi-trash" class="p-button-rounded p-button-warning p-button-text" aria-controls="overlay_menu" :loading="submitted" @click="confirmDeleteLanding(slotProps.data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
    <Dialog v-model:visible="deleteLandingDialog" :closable="false" :style="{ width: '450px' }" header="Confirmación" :modal="true">
      <div class="confirmation-content flex flex-column align-items-center">
        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
        <span v-if="activeLanding" class="pt-3">Eliminar a <b>{{ activeLanding.title }}</b>?</span>
      </div>
      <template #footer>
        <div class="flex w-full justify-content-between">
          <Button label="Cancelar" icon="pi pi-times" class="p-button-text" :loading="submitted" @click="deleteLandingDialog = false" />
          <Button label="Confirmar" icon="pi pi-check" class="p-button-text p-button-danger" :loading="submitted" @click="deleteLanding" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style>
  .p-datatable .p-datatable-header {
    background: #f8f9fa;
    color: #343a40;
    border: 1px solid #dee2e6;
    border-width: 0px 0 1px 0 !important;
    padding: 1rem 1rem;
    font-weight: 700;
    border-radius: .5rem .5rem 0 0 !important;
  }
  .table-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .status-badge {
    background: #14b8a6 ;
    color: #fff;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 700;
    width: 100px;
    text-align: center;
  }
  .draft-status-badge {
    background: #F59E0B ;
    color: #fff;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 700;
    width: 100px;
    text-align: center;
  }
  .c-column-for-text {
    max-width: 70%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  @media screen and (max-width: 768px) {
    .table-header {
      align-items: start;
    }
  }
  @media screen and (max-width: 960px) {
    .c-column-for-text {
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
</style>
