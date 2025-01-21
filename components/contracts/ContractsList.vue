<!-- eslint-disable no-unused-vars -->
<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script setup lang="ts">
// import filters from "primevue/utils/filters";
import { FilterMatchMode } from 'primevue/api'

// import firebase utils
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'

// import validators
import { maxLength, required } from '@vuelidate/validators'
import { useVuelidate } from '@vuelidate/core'

// import types
import type { Project } from '~~/types/contract-projects'
import type { Tag } from '~~/types/use-tag'

// import firebase app composable
const { $db, $functions } = useNuxtApp()
// import notification composable
const notification = useNotification()
// create data table ref
const dt = ref()
// create table menu ref
const menu = ref()
// create temp menu data ref
const tempMenuData = ref()
// create table menu toggle function
function toggle(event: any, contract: any) {
  tempMenuData.value = contract
  menu.value.toggle(event)
}
// create reactive data for contracts
const contracts = useContracts()
const selectedStatus = ref()
const status = ref([
  { name: 'Publicada', code: 'published' },
  { name: 'Borrador', code: 'draft' },
])
const filteredContracts = computed(() => {
  if (selectedStatus.value !== null && selectedStatus.value !== undefined)
    return contracts.value.filter((contract: { status: string }) => contract.status === selectedStatus.value)

  else
    return contracts.value
})
// new contract dialog ref
const newContractDialog = ref(false)
// create reative data for new contract
const newContract = ref({
  name: '',
  type: '',
  status: 'draft',
  template_id: '',
  project: {
    name: '',
    id: '',
  },
  seller: {
    name: '',
    id: '',
  },
  texts: [],
  lists: [],
  images: [],
})
// create editProjectChange function to replace activeProject.value.project.name with project name from projects list find using e.value on project_id
function newProjectChange(e: any) {
  const project = projects.value?.data.find(p => p.project_id as unknown as string === e.value)
  newContract.value.project.name = project?.project_name || ''
  newContract.value.seller = {
    name: '',
    id: '',
  }
}
// create editSellerChange function to get activeContract.seller.id and search for seller name in the project.sellers list in seller.seller_name search by seller.id using e.value
function newSellerChange(e: any) {
  const project = projects.value?.data.find(p => p.project_id as unknown as string === newContract.value.project.id)
  const seller = project?.sellers.find(s => s.seller_id as unknown as string === e.value)
  newContract.value.seller.name = seller?.seller_name || ''
}
// computed property for returning project.sellers array from projects list filtered by newContract.project.id
const sellers = computed(() => {
  const project = projects.value?.data.find(p => p.project_id as unknown as string === newContract.value.project.id)
  return project?.sellers || []
})
// computed property for returning project.sellers array from projects list filtered by newContract.project.id
const sellersForEdit = computed(() => {
  const project = projects.value?.data.find(p => p.project_id as unknown as string === activeContract.value.project.id)
  return project?.sellers || []
})
// new contract type options
const newContractTypeOptions = ref([
  { label: 'Persona física', value: 'pf' },
  { label: 'Persona moral', value: 'pm' },
  { label: 'Extranjeros', value: 'ex' },
])
// if form isn't valid, show error message
const failedValidation = ref(false)
// create form rules
const rules = {
  name: { required, maxLength: maxLength(30) },
  type: { required },
  template_id: { required },
  project: {
    name: { required },
    id: { required },
  },
  seller: {
    name: { required },
    id: { required },
  },
}
// create reactive data for vuelidate
const v$ = useVuelidate(rules, newContract)
// function to close new contract dialog and reset form
function closeNewContractDialog() {
  newContractDialog.value = false
  newContract.value = {
    name: '',
    type: '',
    status: 'draft',
    template_id: '',
    project: {
      name: '',
      id: '',
    },
    seller: {
      name: '',
      id: '',
    },
    texts: [],
    lists: [],
    images: [],
  }
}
// function to save new contract
async function saveNewContract(isFormValid: any) {
  submitted.value = true
  // if form is valid
  if (!isFormValid) {
    // show error message only for 0.5 seconds
    failedValidation.value = true
    // hide loading
    submitted.value = false
    setTimeout(() => {
      // reset error message
      failedValidation.value = false
    }, 500)
  }
  else {
    // save new contract to db
    try {
      const docRef = await addDoc(collection($db(), 'contract_templates'), {
        ...newContract.value,
        project: {
          name: newContract.value.project.name,
          id: newContract.value.project.id.toString(),
        },
        seller: {
          name: newContract.value.seller.name,
          id: newContract.value.seller.id.toString(),
        },
      })
      contracts.value.unshift({
        ...newContract.value,
        uid: docRef.id,
      })
      closeNewContractDialog()
      // hide loading
      submitted.value = false
      notification.value = {
        show: true,
        severity: 'success',
        summary: 'Éxito',
        detail: 'Contrato guardado con éxito',
        life: 3000,
      }
    }
    catch (error) {
      notification.value = {
        show: true,
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar el contrato',
        life: 3000,
      }
      submitted.value = false
    }
  }
}
// create reactive data for contract dialog
const editContractDialog = ref(false)
// create reactive data for delete contract dialog
const deleteContractDialog = ref(false)
// create reactive data for active contract
const activeContract = ref({
  uid: '',
  name: '',
  type: '',
  status: '',
  template_id: '',
  project: {
    name: '',
    id: '',
  },
  seller: {
    name: '',
    id: '',
  },
  texts: [],
  lists: [],
  images: [],
})
// create reactive data for vuelidate
const v1$ = useVuelidate(rules, activeContract)
// create reactive data for temp claims
const tempContract = ref()
// create reactive data for filters
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})
// create reactive data for loading contracts
const loadingContracts = ref(true)
// create reactive data for submitted
const submitted = ref(false)
// create editContract function
function editContract(contract: any) {
  activeContract.value = JSON.parse(JSON.stringify(contract))
  tempContract.value = JSON.parse(JSON.stringify(contract))
  editContractDialog.value = true
}
// create hide dialog for edit contract function
function hideEditDialog() {
  activeContract.value = JSON.parse(JSON.stringify(tempContract.value))
  editContractDialog.value = false
  submitted.value = false
}
// create editProjectChange function to replace activeProject.value.project.name with project name from projects list find using e.value on project_id
function editProjectChange(e: any) {
  const project = projects.value?.data.find(p => p.project_id as unknown as string === e.value)
  activeContract.value.project.name = project?.project_name || ''
}
// create editSellerChange function to get activeContract.seller.id and search for seller name in the project.sellers list in seller.seller_name search by seller.id using e.value
function editSellerChange(e: any) {
  const project = projects.value?.data.find(p => p.project_id as unknown as string === activeContract.value.project.id)
  const seller = project?.sellers.find(s => s.seller_id as unknown as string === e.value)
  activeContract.value.seller.name = seller?.seller_name || ''
}
// create function to update contract in db
async function saveContract(isFormValid: any) {
  submitted.value = true
  // if form is valid
  if (!isFormValid) {
    // show error message only for 0.5 seconds
    failedValidation.value = true
    // hide loading
    submitted.value = false
    setTimeout(() => {
      // reset error message
      failedValidation.value = false
    }, 500)
  }
  else {
    // save contract to db
    try {
      const userRef = doc($db(), 'contract_templates', activeContract.value.uid)
      // Find index of activeContract in contracts array
      const index = contracts.value.findIndex(contract => contract.uid === activeContract.value.uid)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { uid, ...contractWithoutUid } = activeContract.value
      const newActiveContract = {
        ...contractWithoutUid,
        status: 'draft',
        project: {
          name: activeContract.value.project.name,
          id: activeContract.value.project.id,
        },
        seller: {
          name: activeContract.value.seller.name,
          id: activeContract.value.seller.id,
        },
        texts: [],
        lists: [],
        images: [],
      }
      await updateDoc(userRef, newActiveContract)
      // Update contracts array with new contract
      contracts.value[index] = {
        uid: activeContract.value.uid,
        ...newActiveContract,
        status: 'draft',
        project: {
          name: activeContract.value.project.name,
          id: activeContract.value.project.id,
        },
        seller: {
          name: activeContract.value.seller.name,
          id: activeContract.value.seller.id,
        },
        texts: [],
        lists: [],
        images: [],
      }
      submitted.value = false
      editContractDialog.value = false
      notification.value = {
        show: true,
        severity: 'success',
        summary: 'Éxito',
        detail: 'Contrato actualizado correctamente',
        life: 5000,
      }
      tempContract.value = null
    }
    catch (error) {
      // error
      submitted.value = false
      notification.value = {
        show: true,
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo actualizar el contrato',
        life: 5000,
      }
    }
  }
}
// create function to delete contract confirmation
function confirmDeleteContract(contract: any) {
  activeContract.value = contract
  deleteContractDialog.value = true
}
// create function to delete contract in db
async function deleteContract() {
  submitted.value = true
  try {
    await deleteDoc(doc($db(), 'contract_templates', activeContract.value.uid))
    const index = contracts.value.findIndex(obj => obj.uid === activeContract.value.uid)
    if (index !== -1)
      contracts.value.splice(index, 1)

    deleteContractDialog.value = false
    submitted.value = false
    notification.value = {
      show: true,
      severity: 'success',
      summary: 'Éxito',
      detail: 'Contrato eliminado correctamente',
      life: 5000,
    }
    tempContract.value = null
  }
  catch (error) {
    // error
    submitted.value = false
    notification.value = {
      show: true,
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo eliminar el contrato',
      life: 5000,
    }
  }
}
// get contracts from db before mounting
async function getContracts() {
  const querySnapshot = await getDocs(collection($db(), 'contract_templates'))
  querySnapshot.forEach((doc: { id: any; data: () => any }) => contracts.value.push({
    uid: doc.id,
    ...doc.data(),
    project: {
      name: doc.data().project.name,
      id: Number.parseInt(doc.data().project.id),
    },
    seller: {
      name: doc.data().seller.name,
      id: Number.parseInt(doc.data().seller.id),
    },
  }))
  loadingContracts.value = false
}
// get google docs from google drive api
const googleDocsTemplates = ref()
async function getGoogleDocs() {
  const googleDocs = httpsCallable($functions(), 'readContractsTemplates')
  try {
    const result = await googleDocs({ folder: "1N-HEDt8n6S3__4BPG1csDoml4qTrPczr" });
    const data = result.data;
    googleDocsTemplates.value = data;
  } catch (error) {
    notification.value = {
      show: true,
      severity: 'error',
      summary: 'Error',
      detail: 'No se puedieron obtener los contratos de Google Drive',
      life: 5000,
    }
  }
}
// get projects from db
const projects = ref<Project>()
interface TempProject {
  proyecto: {
    [key: string]: string
  }
  sellers: {
    [key: string]: string
  }
}
// get projects from mysql db
async function getProjects() {
  projects.value = { data: [] }
  const projectsFromDb = httpsCallable($functions(), 'getProjects')
  try {
    const result = await projectsFromDb() as any
    const data = result.data.projects as TempProject[]
    const formattedData = data.map((tempProject) => {
      const projectId = Number.parseInt(Object.keys(tempProject.proyecto)[0])
      const projectName = Object.values(tempProject.proyecto)[0]
      const sellers = Object.keys(tempProject.sellers).map(sellerId => ({
        seller_id: Number.parseInt(sellerId),
        seller_name: tempProject.sellers[sellerId],
      }))
      return {
        project_id: projectId,
        project_name: projectName,
        sellers,
      }
    })
    projects.value = { data: formattedData }
  }
  catch (error) {
    notification.value = {
      show: true,
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo obtener los proyectos',
      life: 5000,
    }
  }
}

// validate contracts code
const loadingValidation = ref(false)
const validateDialog = ref(false)
const savingValidation = ref(false)
// create reactive data for tags
const tags = useTags()
const googleDocString = ref()
async function getGoogleDocString(contract: { template_id: any }) {
  googleDocString.value = ''
  const googleDocs = httpsCallable($functions(), 'exportDocument')
  try {
    const result = await googleDocs({ file_id: contract.template_id })
    const data = JSON.stringify(result)
    googleDocString.value = data.toString()
    filterTags()
  }
  catch (error) {
    loadingValidation.value = false
    notification.value = {
      show: true,
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo obtener el documento de Google Drive',
      life: 5000,
    }
  }
}

// crate function for filter tags
const texts = ref<Tag[]>([])
const images = ref<Tag[]>([])
const lists = ref<Tag[]>([])
const unknowns = ref<string[]>([])
function filterTags() {
  texts.value = []
  images.value = []
  lists.value = []
  unknowns.value = []
  const regex = /{{(.*?)}}/g
  const tagsFound = googleDocString.value.match(regex)
  tagsFound.forEach((tag: string) => {
    const tagInfo = tags.value.find(t => t.tag === tag)
    if (tagInfo) {
      switch (tagInfo.type) {
        case 'text':
          texts.value.push(tagInfo)
          break
        case 'image':
          images.value.push(tagInfo)
          break
        case 'list':
          lists.value.push(tagInfo)
          break
      }
    }
    else {
      unknowns.value.push(tag)
    }
  })
  validateDialog.value = true
  loadingValidation.value = false
}
// create function to validate contract
function validateContract(data: any) {
  activeContract.value = data
  loadingValidation.value = true
  getGoogleDocString(data)
}
// create function to save validated contract
async function saveValidateContract() {
  try {
    savingValidation.value = true
    const index = contracts.value.findIndex(contract => contract.uid === activeContract.value.uid)
    const { uid, ...contractWithoutUid } = activeContract.value
    const newValidateContract = {
      ...contractWithoutUid,
      status: 'published',
      project: { ...activeContract.value.project, id: activeContract.value.project.id },
      seller: { ...activeContract.value.seller, id: activeContract.value.seller.id },
      texts: texts.value.map(({ uid, ...textWithoutUid }) => textWithoutUid),
      images: images.value.map(({ uid, ...imageWithoutUid }) => imageWithoutUid),
      lists: lists.value.map(({ uid, ...listWithoutUid }) => listWithoutUid),
    }
    await updateDoc(doc($db(), 'contract_templates', activeContract.value.uid), newValidateContract)
    contracts.value[index] = { uid: activeContract.value.uid, ...newValidateContract }
    savingValidation.value = false
    validateDialog.value = false
    notification.value = { show: true, severity: 'success', summary: 'Éxito', detail: 'Contrato actualizado correctamente', life: 5000 }
    tempContract.value = null
  }
  catch {
    savingValidation.value = false
    notification.value = { show: true, severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el contrato', life: 5000 }
  }
}
// call getContracts before mounting
onBeforeMount(() => {
  contracts.value = []
  getContracts()
  getGoogleDocs()
  getProjects()
})
</script>

<template>
  <div>
    <div class="card">
      <DataTable
        ref="dt"
        :value="filteredContracts"
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
              Administrar plantillas
            </h5>
            <div>
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
                  <Button label="Nueva" icon="pi pi-plus" class="p-button-success w-full md:w-auto md:ml-2 my-2 md:my-0" @click="newContractDialog = true" />
                </div>
              </div>
            </div>
          </div>
          <div v-if="loadingContracts" class="pt-2">
            <ProgressBar mode="indeterminate" style="height: .5em" />
          </div>
        </template>
        <Column field="name" header="Nombre" :sortable="false">
          <template #body="slotProps">
            <div v-tooltip.top="slotProps.data.name" class="templates-texts-column">
              {{ slotProps.data.name }}
            </div>
          </template>
        </Column>
        <Column field="project.name" header="Proyecto" :sortable="false">
          <template #body="slotProps">
            <div v-tooltip.top="slotProps.data.project.name" class="templates-texts-column">
              {{ slotProps.data.project.name }}
            </div>
          </template>
        </Column>
        <Column field="seller.name" header="Vendedor" :sortable="false">
          <template #body="slotProps">
            <div v-tooltip.top="slotProps.data.seller.name" class="templates-texts-column">
              {{ slotProps.data.seller.name }}
            </div>
          </template>
        </Column>
        <Column field="type" header="Tipo" :sortable="false">
          <template #body="slotProps">
            <div v-if="slotProps.data.type === 'pf'">
              Persona física
            </div>
            <div v-if="slotProps.data.type === 'pm'">
              Persona moral
            </div>
            <div v-if="slotProps.data.type === 'ex'">
              Persona extranjera
            </div>
          </template>
        </Column>
        <Column field="status" header="Estado" :sortable="false">
          <template #body="slotProps">
            <div v-if="slotProps.data.status === 'draft'" class="draft-templates-badge">
              Borrador
            </div>
            <div v-if="slotProps.data.status === 'published'" class="templates-badge">
              Publicada
            </div>
          </template>
        </Column>
        <Column :exportable="false" header="Acciones">
          <template #body="slotProps">
            <div>
              <Button icon="pi pi-pencil" class="p-button-rounded p-button-success p-button-text" aria-controls="overlay_menu" :loading="loadingValidation" @click="editContract(slotProps.data)" />
              <Button
                v-if="slotProps.data.status === 'draft'"
                icon="pi pi-check-circle"
                class="p-button-rounded p-button-secondary p-button-text"
                aria-controls="overlay_menu"
                :loading="loadingValidation"
                @click="validateContract(slotProps.data)"
              />
              <Button icon="pi pi-trash" class="p-button-rounded p-button-warning p-button-text" aria-controls="overlay_menu" :loading="loadingValidation" @click="confirmDeleteContract(slotProps.data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="editContractDialog"
      :closable="false"
      :style="{ width: '450px' }"
      :header="`${activeContract?.name || 'Plantilla'}`"
      :modal="true"
      class="p-fluid"
    >
      <div class="edit-contract-content">
        <div class="text-center text-xs pb-4">
          Al editar una plantilla pasará a borrador. Para publicarla nuevamente, deberás hacer el proceso de validación de nuevo.
        </div>
        <form ref="editContractForm">
          <div class="field block">
            <label for="name">Nombre</label>
            <InputText
              id="name"
              v-model="v1$.name.$model"
              class="block w-full"
              type="name"
              aria-describedby="name-help"
              :class="{ 'p-invalid': v1$.name.$invalid && activeContract.name != '' || failedValidation && v1$.name.$invalid }"
            />
            <small id="name-help">El nombre para identificar la plantilla.</small>
          </div>
          <div class="field block">
            <label for="project">Proyecto</label>
            <Dropdown
              id="project"
              v-model="v1$.project.$model.id"
              class="w-full"
              :options="projects?.data"
              option-label="project_name"
              option-value="project_id"
              placeholder="Selecciona el proyecto"
              filter
              :class="{ 'p-invalid': v1$.project.$invalid && activeContract.project.id != '' || failedValidation && v1$.project.$invalid }"
              @change="editProjectChange"
            />
            <small id="name-help">Proyecto en el que se usará la plantilla.</small>
          </div>
          <div class="field block">
            <label for="seller">Vendedor</label>
            <Dropdown
              id="seller"
              v-model="v1$.seller.$model.id"
              class="w-full"
              :options="sellersForEdit"
              option-label="seller_name"
              option-value="seller_id"
              placeholder="Selecciona el vendedor"
              filter
              :disabled="!activeContract.project.id"
              :class="{ 'p-invalid': v1$.seller.$invalid && activeContract.seller.id != '' || failedValidation && v1$.seller.$invalid }"
              @change="editSellerChange"
            />
            <small id="name-help">Vendedor en el que se usará la plantilla.</small>
          </div>
          <div class="field block">
            <label for="type">Tipo</label>
            <Dropdown
              id="type"
              v-model="v1$.type.$model"
              class="w-full"
              :options="newContractTypeOptions"
              option-label="label"
              option-value="value"
              placeholder="Selecciona el tipo"
              filter
              :class="{ 'p-invalid': v1$.type.$invalid && activeContract.type != '' || failedValidation && v1$.type.$invalid }"
            />
            <small id="name-help">Tipo del contrato de esta plantilla.</small>
          </div>
          <div class="field block">
            <label for="document">Documento</label>
            <Dropdown
              id="document"
              v-model="v1$.template_id.$model"
              class="w-full"
              :options="googleDocsTemplates.files"
              option-label="name"
              option-value="id"
              placeholder="Selecciona una plantilla"
              filter
              :class="{ 'p-invalid': v1$.template_id.$invalid && activeContract.template_id != '' || failedValidation && v1$.template_id.$invalid }"
            />
            <small id="name-help">Documento de Google para esta plantilla.</small>
          </div>
        </form>
      </div>
      <template #footer>
        <div class="flex w-full justify-content-between">
          <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="hideEditDialog" />
          <Button
            label="Guardar"
            icon="pi pi-check"
            class="p-button-text p-button-success"
            :loading="submitted"
            :disabled="v1$.$invalid"
            @click="saveContract(!v1$.$invalid)"
          />
        </div>
      </template>
    </Dialog>

    <Dialog v-model:visible="deleteContractDialog" :closable="false" :style="{ width: '450px' }" :modal="true">
      <div class="confirmation-content flex flex-column align-items-center">
        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
        <span v-if="activeContract" class="pt-3">¿Eliminar a <b>{{ activeContract.name }}</b>?</span>
      </div>
      <template #footer>
        <div class="flex w-full justify-content-between">
          <Button label="Cancelar" icon="pi pi-times" class="p-button-text" :loading="submitted" @click="deleteContractDialog = false" />
          <Button label="Confirmar" icon="pi pi-check" class="p-button-text p-button-danger" :loading="submitted" @click="deleteContract" />
        </div>
      </template>
    </Dialog>
    <Dialog v-model:visible="newContractDialog" :closable="false" :style="{ width: '450px' }" header="Nueva plantilla" :modal="true">
      <div class="new-contract-content">
        <form ref="newContractForm">
          <div class="field block">
            <label for="name">Nombre</label>
            <InputText
              id="name"
              v-model="v$.name.$model"
              class="block w-full"
              type="name"
              aria-describedby="name-help"
              :class="{ 'p-invalid': v$.name.$invalid && newContract.name != '' || failedValidation && v$.name.$invalid }"
            />
            <small id="name-help">El nombre para identificar la plantilla.</small>
          </div>
          <div class="field block">
            <label for="project">Proyecto</label>
            <Dropdown
              id="project"
              v-model="v$.project.$model.id"
              class="w-full"
              :options="projects?.data"
              option-label="project_name"
              option-value="project_id"
              placeholder="Selecciona el proyecto"
              filter
              :class="{ 'p-invalid': v$.project.$invalid && newContract.project.id != '' || failedValidation && v$.project.$invalid }"
              @change="newProjectChange"
            />
            <small id="name-help">Proyecto en el que se usará la plantilla.</small>
          </div>
          <div class="field block">
            <label for="seller">Vendedor</label>
            <Dropdown
              id="seller"
              v-model="v$.seller.$model.id"
              class="w-full"
              :options="sellers"
              option-label="seller_name"
              option-value="seller_id"
              placeholder="Selecciona el vendedor"
              filter
              :disabled="!newContract.project.id"
              :class="{ 'p-invalid': v$.seller.$invalid && newContract.seller.id != '' || failedValidation && v$.seller.$invalid }"
              @change="newSellerChange"
            />
            <small id="name-help">Vendedor en el que se usará la plantilla.</small>
          </div>
          <div class="field block">
            <label for="type">Tipo</label>
            <Dropdown
              id="type"
              v-model="v$.type.$model"
              class="w-full"
              :options="newContractTypeOptions"
              option-label="label"
              option-value="value"
              placeholder="Selecciona el tipo"
              filter
              :class="{ 'p-invalid': v$.type.$invalid && newContract.type != '' || failedValidation && v$.type.$invalid }"
            />
            <small id="name-help">Tipo del contrato de esta plantilla.</small>
          </div>
          <div class="field block">
            <label for="document">Documento</label>
            <Dropdown
              id="document"
              v-model="v$.template_id.$model"
              class="w-full"
              :options="googleDocsTemplates.files"
              option-label="name"
              option-value="id"
              placeholder="Selecciona una plantilla"
              filter
              :class="{ 'p-invalid': v$.template_id.$invalid && newContract.template_id != '' || failedValidation && v$.template_id.$invalid }"
            />
            <small id="name-help">Documento de Google para esta plantilla.</small>
          </div>
        </form>
      </div>
      <template #footer>
        <div class="flex w-full justify-content-between">
          <Button label="Cancelar" icon="pi pi-times" class="p-button-text" :loading="submitted" @click="closeNewContractDialog" />
          <Button
            label="Guardar"
            icon="pi pi-check"
            class="p-button-text p-button-success"
            :loading="submitted"
            :disabled="v$.$invalid"
            @click="saveNewContract(!v$.$invalid)"
          />
        </div>
      </template>
    </Dialog>

    <Dialog v-model:visible="validateDialog" :closable="false" :style="{ width: '600px', maxHeight: '600px' }" :header="`${activeContract.name}`" :modal="true">
      <div class="confirmation-content">
        <div class="flex flex-column align-items-center text-base font-medium uppercase">
          Etiquetas tipo texto
        </div>
        <div v-if="!texts.length" class="flex flex-column align-items-center text-xs pb-4">
          No tienes etiquetas tipo texto.
        </div>
        <div>
          <div>
            <div v-for="tag in texts" :key="tag.tag">
              <div class="flex justify-content-between text-sm border-solid border-bottom-1 border-x-none border-top-none surface-border py-1">
                <div>{{ tag.label }}</div>
                <div>{{ tag.tag }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-column align-items-center text-base font-medium uppercase py-4">
          Etiquetas tipo imagen
        </div>
        <div v-if="!images.length" class="flex flex-column align-items-center text-xs pb-4">
          No tienes etiquetas tipo imagen.
        </div>
        <div>
          <div>
            <div v-for="tag in images" :key="tag.tag">
              <div class="flex justify-content-between text-sm border-solid border-bottom-1 border-x-none border-top-none surface-border py-1">
                <div>{{ tag.label }}</div>
                <div>{{ tag.tag }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-column align-items-center text-base font-medium uppercase py-4">
          Etiquetas tipo lista
        </div>
        <div v-if="!lists.length" class="flex flex-column align-items-center text-xs pb-4">
          No tienes etiquetas tipo lista.
        </div>
        <div>
          <div>
            <div v-for="tag in lists" :key="tag.tag">
              <div class="flex justify-content-between text-sm border-solid border-bottom-1 border-x-none border-top-none surface-border py-1">
                <div>{{ tag.label }}</div>
                <div>{{ tag.tag }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-column align-items-center text-base font-medium uppercase py-4" :class="{ 'invalid-contract': unknowns.length > 0 }">
          Etiquetas no válidas
        </div>
        <div v-if="unknowns.length > 0" class="flex flex-column align-items-center text-xs pb-4">
          Tienes etiquetas que no son válidas, por favor, revisa el documento del contrato.
        </div>
        <div v-else class="flex flex-column align-items-center text-xs pb-4">
          No tienes etiquetas no válidas.
        </div>
        <div>
          <div>
            <div v-for="tag, i in unknowns" :key="i">
              <div class="flex justify-content-between text-sm border-solid border-bottom-1 border-x-none border-top-none surface-border py-1">
                <div>Etiqueta</div>
                <div>{{ tag }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex w-full justify-content-between">
          <Button label="Cancelar" icon="pi pi-times" class="p-button-text" :loading="savingValidation" @click="validateDialog = false" />
          <Button
            label="Confirmar"
            icon="pi pi-check"
            class="p-button-text p-button-info"
            :loading="savingValidation"
            :disabled="unknowns.length > 0"
            @click="saveValidateContract"
          />
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
  .type-badge {
    background: #343a40;
    color: #fff;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 700;
    margin-right: 0.5rem;
    width: 60px;
    text-align: center;
  }
  .templates-badge {
    background: #14b8a6;
    color: #fff;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-align: center;
  }
  .draft-templates-badge {
    background: #F59E0B ;
    color: #fff;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-align: center;
  }
  .invalid-contract {
    color: #dc3545;
  }
  .templates-texts-column {
    width: 70%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  @media screen and (max-width: 960px) {
    .templates-badge{
      margin-right: 0rem;
    }
    .type-badge {
      margin-right: 0rem;
    }
    .templates-texts-column {
      text-align: right;
      width: 150px;
    }
  }
  @media screen and (max-width: 768px) {
    .table-header {
      align-items: start;
    }
  }
</style>
