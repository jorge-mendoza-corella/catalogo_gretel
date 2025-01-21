<!-- eslint-disable no-unused-vars -->
<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script setup lang="ts">
// import filters from "primevue/utils/filters";
import { FilterMatchMode } from 'primevue/api'

// import firebase utils
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'

// import validators
import { maxLength, numeric, required } from '@vuelidate/validators'
import { useVuelidate } from '@vuelidate/core'

// import types
import type { ContractDoc } from '~~/types/contracts-docs'

// import firebase app composable
const { $db, $functions } = useNuxtApp()
// import notification composable
const notification = useNotification()
// create data table ref
const dt = ref()
// open contract document
function openContract(contract: any) {
  window.open(`https://docs.google.com/document/d/${contract.doc_id}/edit`, '_blank')
}
// create reactive data for contractsDocs
const contractsDocs = ref<ContractDoc[]>([])
const selectedStatus = ref()
const status = ref([
  { name: 'Generado', code: 'ready' },
  { name: 'Borrador', code: 'draft' },
])
const filteredContractsDocs = computed(() => {
  if (selectedStatus.value !== null && selectedStatus.value !== undefined)
    return contractsDocs.value.filter((contractDoc: { status: string | null }) => contractDoc.status === selectedStatus.value)

  else
    return contractsDocs.value
})
const route = useRoute()
onBeforeMount(() => {
  if (route.query?.status)
    selectedStatus.value = route.query.status
})
// get contracts templates from templates view
const contracts = useContracts()
// create reference for collection by id data
const collectionById = ref()
// create reactive data for valid templates
const validTemplates = ref()
// set valid templates for project type and seller
function updateValidTemplates() {
  if (collectionById.value) {
    validTemplates.value = contracts.value.filter(
      contract =>
        contract.project.id === collectionById.value.PROYECTO_ID
        && contract.seller.id === collectionById.value.SELLER_ID
        && contract.type === collectionById.value.TIPO
        && contract.status === 'published',
    )
  }
  else {
    validTemplates.value = []
  }
}
// watch for collection by id data for update valid templates
watch(collectionById, updateValidTemplates, { immediate: true })
// new contract dialog ref
const newContractDialog = ref(false)
// create reative data for new contract
const newContract = ref(
  {
    buyer_name: '',
    collection_id: '',
    doc_id: '',
    template_id: '',
    project_name: '',
    seller_name: '',
    status: '',
    property_number: '',
    type: '',
  },
)
// if form isn't valid, show error message
const failedValidation = ref(false)
// create form rules
const rules = {
  collection_id: { required, maxLength: maxLength(10), numeric },
  template_id: { required },
}
// create reactive data for vuelidate
const v$ = useVuelidate(rules, newContract)
// function to close new contract dialog and reset form
function closeNewContractDialog() {
  newContractDialog.value = false
  collectionById.value = null
  newContract.value = {
    buyer_name: '',
    collection_id: '',
    doc_id: '',
    template_id: '',
    project_name: '',
    seller_name: '',
    status: '',
    property_number: '',
    type: '',
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
      const docRef = await addDoc(collection($db(), 'contracts'), {
        ...newContract.value,
        status: 'draft',
      })
      contractsDocs.value.unshift({
        ...newContract.value,
        uid: docRef.id,
        status: 'draft',
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
// create reactive data for delete contract dialog
const deleteContractDialog = ref(false)
// create reactive data for active contract
const activeContract = ref<ContractDoc>(
  {
    uid: '',
    buyer_name: '',
    collection_id: '',
    doc_id: '',
    template_id: '',
    project_name: '',
    seller_name: '',
    status: '',
    property_number: '',
    type: '',
  },
)
// create reactive data for filters
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})
// create reactive data for loading contractsDocs
const loadingContracts = ref(true)
// create reactive data for submitted
const submitted = ref(false)
// create editContract function
// create function to delete contract confirmation
function confirmDeleteContract(contract: any) {
  activeContract.value = contract
  deleteContractDialog.value = true
}
// create function to delete contract in db
async function deleteContract() {
  submitted.value = true
  try {
    await deleteDoc(doc($db(), 'contracts', activeContract.value.uid))
    const index = contractsDocs.value.findIndex(obj => obj.uid === activeContract?.value?.uid)
    if (index !== -1)
      contractsDocs.value.splice(index, 1)

    deleteContractDialog.value = false
    submitted.value = false
    notification.value = {
      show: true,
      severity: 'success',
      summary: 'Éxito',
      detail: 'Contrato eliminado correctamente',
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
      detail: 'No se pudo eliminar el contrato',
      life: 5000,
    }
  }
}
// get contractsDocs from db before mounting
async function getContractsDocs() {
  const querySnapshot = await getDocs(collection($db(), 'contracts'))
  querySnapshot.forEach((doc: { id: any; data: () => any }) => contractsDocs.value.push({
    uid: doc.id,
    ...doc.data(),
  }))
  loadingContracts.value = false
}

// get google docs from google drive api
const loadingCollections = ref(false)
async function getCollections() {
  loadingCollections.value = true
  const collectionsData = httpsCallable($functions(), 'getCollectionsAccounts')
  try {
    const result = await collectionsData({ collection_id: Number.parseInt(newContract.value.collection_id as string) }) as any
    const data = result.data.collections[0]
    if (data) {
      collectionById.value = data
      newContract.value.buyer_name = data.COMPRADOR
      newContract.value.seller_name = data.SELLER
      newContract.value.project_name = data.PROYECTO
      newContract.value.property_number = data.DEPARTAMENTO
      newContract.value.type = data.TIPO
    }
    else {
      notification.value = {
        show: true,
        severity: 'error',
        summary: 'Error',
        detail: 'No se encontró la cuenta de cobranza.',
        life: 5000,
      }
    }
    loadingCollections.value = false
  }
  catch (error) {
    notification.value = {
      show: true,
      severity: 'error',
      summary: 'Error',
      detail: 'No se puedieron obtener las cuentas de cobraza.',
      life: 5000,
    }
  }
}
// validate contractsDocs code
// get colelction data form mysql db
const collectionData = ref()
const loadingCollectionData = ref(false)
async function getCollectionData(contractsData: any) {
  activeContract.value = contractsData
  loadingCollectionData.value = true
  const collectionsData = httpsCallable($functions(), 'getPfCollectionData')
  try {
    const result = await collectionsData({ collection_id: Number.parseInt(contractsData.collection_id as string) }) as any
    const data = result.data.collections[0]
    if (data) {
      collectionData.value = data
      templateDoc(contractsData.template_id)
    }
    else {
      notification.value = {
        show: true,
        severity: 'error',
        summary: 'Error',
        detail: 'No se encontró la cuenta de cobranza.',
        life: 5000,
      }
    }
    loadingCollectionData.value = false
  }
  catch (error) {
    notification.value = {
      show: true,
      severity: 'error',
      summary: 'Error',
      detail: 'No se puedieron obtener las cuentas de cobraza.',
      life: 5000,
    }
  }
}
// read contract template from firestore
const contractTemplate = ref()
async function templateDoc(templateId: string) {
  const docRef = doc($db(), 'contract_templates', templateId)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    contractTemplate.value = docSnap.data()
    replaceTags(docSnap.data())
  }
  else {
    notification.value = {
      show: true,
      severity: 'error',
      summary: 'Error',
      detail: 'No se encontró el template.',
      life: 5000,
    }
  }
}
// replace tags in template
const textsWhitData = ref([])
function replaceTextsPromise(texts: any[]) {
  textsWhitData.value = []
  return new Promise((resolve, reject) => {
    try {
      for (let i = 0; i < texts.length; i++) {
        const prop = texts[i].tag.replace(/{{|}}/g, '')
        if (Object.prototype.hasOwnProperty.call(collectionData.value, prop)) {
          if (collectionData.value[prop] && collectionData.value[prop] !== '0' && collectionData.value[prop] !== 0 && collectionData.value[prop] !== '') {
            const obj = {
              tag: texts[i].tag,
              value: collectionData.value[prop].toString(),
            }
            textsWhitData.value.push(obj as never)
          }
          else {
            const obj = {
              tag: texts[i].tag,
              value: 'TAG SIN DATOS',
            }
            textsWhitData.value.push(obj as never)
          }
        }
        else {
          const obj = {
            tag: texts[i].tag as string,
            value: 'TAG NUEVO',
          }
          textsWhitData.value.push(obj as never)
        }
      }
      resolve(textsWhitData.value)
    }
    catch (error) {
      reject(error)
    }
  })
}
// replace images in template
const imagesWhitData = ref([])
function replaceImagesPromise(images: any[]) {
  imagesWhitData.value = []
  return new Promise((resolve, reject) => {
    try {
      for (let i = 0; i < images.length; i++) {
        const prop = images[i].tag.replace(/{{|}}/g, '')
        if (Object.prototype.hasOwnProperty.call(collectionData.value, prop)) {
          if (collectionData.value[prop] && collectionData.value[prop] !== '0' && collectionData.value[prop] !== 0 && collectionData.value[prop] !== '') {
            const obj = {
              tag: images[i].tag,
              value: collectionData.value[prop].toString(),
            }
            imagesWhitData.value.push(obj as never)
          }
          else {
            const obj = {
              tag: images[i].tag,
              value: 'https://public.sozu.com/placeholder.png',
            }
            imagesWhitData.value.push(obj as never)
          }
        }
        else {
          const obj = {
            tag: images[i].tag,
            value: 'https://public.sozu.com/placeholder.png',
          }
          imagesWhitData.value.push(obj as never)
        }
      }
      resolve(imagesWhitData.value)
    }
    catch (error) {
      reject(error)
    }
  })
}
// replace tags in template for lists
const listsWhitData = ref([])
function replaceListsPromise(lists: any[]) {
  listsWhitData.value = []
  return new Promise((resolve, reject) => {
    try {
      for (let i = 0; i < lists.length; i++) {
        const prop = lists[i].tag.replace(/{{|}}/g, '')
        if (Object.prototype.hasOwnProperty.call(collectionData.value, prop)) {
          if (collectionData.value[prop] && collectionData.value[prop].length > 0) {
            const obj = {
              tag: lists[i].tag,
              value: JSON.parse(collectionData.value[prop]),
            }
            listsWhitData.value.push(obj as never)
          }
          else {
            const obj = {
              tag: lists[i].tag,
              value: ['TAG SIN DATOS'],
            }
            listsWhitData.value.push(obj as never)
          }
        }
        else {
          const obj = {
            tag: lists[i].tag,
            value: ['TAG NUEVO'],
          }
          listsWhitData.value.push(obj as never)
        }
      }
      resolve(listsWhitData.value)
    }
    catch (error) {
      reject(error)
    }
  })
}
const textsToReplace = ref()
const imagesToReplace = ref()
const listsToReplace = ref()
async function replaceTags(contractData: any) {
  textsToReplace.value = []
  imagesToReplace.value = []
  listsToReplace.value = []
  try {
    textsToReplace.value = await replaceTextsPromise(contractData.texts)
    imagesToReplace.value = await replaceImagesPromise(contractData.images)
    listsToReplace.value = await replaceListsPromise(contractData.lists)
    validateDialog.value = true
  }
  catch (error) {
    notification.value = {
      show: true,
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron mapear los tags.',
      life: 5000,
    }
  }
}
const validateDialog = ref(false)
const loadingCreatingContract = ref(false)
async function creatingContract() {
  loadingCreatingContract.value = true
  const collectionsData = httpsCallable($functions(), 'createContract')
  try {
    const result = await collectionsData({
      contract: activeContract.value.template_id,
      client: activeContract.value.buyer_name,
      texts: textsWhitData.value,
      images: imagesWhitData.value,
      lists: listsWhitData.value,
    }) as any
    const data = result.data
    activeContract.value.doc_id = data.document_id
    saveContract()
  }
  catch (error) {
    loadingCreatingContract.value = false
    notification.value = {
      show: true,
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo crear el contrato.',
      life: 5000,
    }
  }
}
// create function to update contract in db
async function saveContract() {
  // save contract to db
  try {
    const userRef = doc($db(), 'contracts', activeContract.value.uid)
    // Find index of activeContract in contracts array
    const index = contractsDocs.value.findIndex(contract => contract.uid === activeContract.value.uid)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { uid, ...contractWithoutUid } = activeContract.value
    const newActiveContract = {
      ...contractWithoutUid,
      status: 'ready',
    }
    await updateDoc(userRef, newActiveContract)
    // Update contracts array with new contract
    contractsDocs.value[index] = {
      uid: activeContract.value.uid,
      ...newActiveContract,
      status: 'ready',
    }
    loadingCreatingContract.value = false
    validateDialog.value = false
    notification.value = {
      show: true,
      severity: 'success',
      summary: 'Éxito',
      detail: 'Contrato actualizado correctamente',
      life: 5000,
    }
  }
  catch (error) {
    // error
    loadingCreatingContract.value = false
    notification.value = {
      show: true,
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo actualizar el contrato',
      life: 5000,
    }
  }
}
// call getContractsDocs before mounting
onBeforeMount(() => {
  contractsDocs.value = []
  getContractsDocs()
})
</script>

<template>
  <div>
    <div class="card">
      <DataTable
        ref="dt"
        :value="filteredContractsDocs"
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
              Administrar contratos
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
                  <Button label="Nuevo" icon="pi pi-plus" class="p-button-success w-full md:w-auto md:ml-2 my-2 md:my-0" @click="newContractDialog = true" />
                </div>
              </div>
            </div>
          </div>
          <div v-if="loadingContracts" class="pt-2">
            <ProgressBar mode="indeterminate" style="height: .5em" />
          </div>
        </template>
        <Column field="collection_id" header="Cuenta" :sortable="false">
          <template #body="slotProps">
            <div v-tooltip.top="slotProps.data.collection_id" class="contracts-texts-column">
              {{ slotProps.data.collection_id }}
            </div>
          </template>
        </Column>
        <Column field="project_name" header="Proyecto" :sortable="false">
          <template #body="slotProps">
            <div v-tooltip.top="slotProps.data.project_name" class="contracts-texts-column">
              {{ slotProps.data.project_name }}
            </div>
          </template>
        </Column>
        <Column field="seller_name" header="Vendedor" :sortable="false">
          <template #body="slotProps">
            <div v-tooltip.top="slotProps.data.seller_name" class="contracts-texts-column">
              {{ slotProps.data.seller_name }}
            </div>
          </template>
        </Column>
        <Column field="buyer_name" header="Comprador" :sortable="false">
          <template #body="slotProps">
            <div v-tooltip.top="slotProps.data.buyer_name" class="contracts-texts-column">
              {{ slotProps.data.buyer_name }}
            </div>
          </template>
        </Column>
        <Column field="property_number" header="Propiedad" :sortable="false">
          <template #body="slotProps">
            <div v-tooltip.top="slotProps.data.property_number" class="contracts-texts-column">
              {{ slotProps.data.property_number }}
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
            <div v-if="slotProps.data.status === 'draft'" class="draft-contracts-badge">
              Borrador
            </div>
            <div v-if="slotProps.data.status === 'ready'" class="contracts-badge">
              Generado
            </div>
          </template>
        </Column>
        <Column :exportable="false" header="Acciones">
          <template #body="slotProps">
            <div>
              <Button
                v-if="slotProps.data.status === 'draft'"
                icon="pi pi-check-circle"
                class="p-button-rounded p-button-success p-button-text"
                aria-controls="overlay_menu"
                :loading="loadingCollectionData"
                @click="getCollectionData(slotProps.data)"
              />
              <Button
                v-if="slotProps.data.status === 'ready' && slotProps.data.doc_id !== ''"
                icon="pi pi-eye"
                class="p-button-rounded p-button-secondary p-button-text"
                aria-controls="overlay_menu"
                :loading="loadingCollectionData"
                @click="openContract(slotProps.data)"
              />
              <Button
                icon="pi pi-trash"
                class="p-button-rounded p-button-warning p-button-text"
                aria-controls="overlay_menu"
                :loading="loadingCollectionData"
                @click="confirmDeleteContract(slotProps.data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
    <Dialog v-model:visible="deleteContractDialog" :closable="false" :style="{ width: '450px' }" :modal="true">
      <div class="confirmation-content flex flex-column align-items-center text-center">
        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
        <span v-if="activeContract" class="pt-3">¿Eliminar contrato de <b>{{ activeContract.buyer_name }}</b> relacionado a la cuenta de cobranza <b>{{ activeContract.collection_id }}</b>?</span>
      </div>
      <template #footer>
        <div class="flex w-full justify-content-between">
          <Button label="Cancelar" icon="pi pi-times" class="p-button-text" :loading="submitted" @click="deleteContractDialog = false" />
          <Button label="Confirmar" icon="pi pi-check" class="p-button-text p-button-danger" :loading="submitted" @click="deleteContract" />
        </div>
      </template>
    </Dialog>
    <Dialog v-model:visible="newContractDialog" :closable="false" :style="{ width: '450px' }" header="Nuevo contrato" :modal="true">
      <div class="new-contract-content">
        <form ref="newContractForm">
          <div class="field block">
            <label for="name">Cuenta de cobranza</label>
            <InputText
              id="name"
              v-model="v$.collection_id.$model"
              class="block w-full"
              type="name"
              aria-describedby="name-help"
              :disabled="loadingCollections || collectionById"
              :class="{ 'p-invalid': v$.collection_id.$invalid && newContract.collection_id != '' || failedValidation && v$.collection_id.$invalid }"
            />
            <small id="name-help">Ingresa el ID en números de la cuenta de cobranza, luego da clic en Válidar Cuenta.</small>
          </div>
          <div class="field block">
            <Button label="Válidar Cuenta" :loading="loadingCollections" :disabled="collectionById || v$.collection_id.$invalid || newContract.collection_id === ''" class="p-button-text p-button-info w-full" @click="getCollections" />
          </div>
          <div class="field block">
            <label for="type">Plantilla</label>
            <Dropdown
              id="type"
              v-model="v$.template_id.$model"
              class="w-full"
              :options="validTemplates"
              option-label="name"
              option-value="uid"
              placeholder="Selecciona la plantilla"
              filter
              :disabled="loadingContracts || !collectionById"
              :class="{ 'p-invalid': v$.template_id.$invalid && newContract.type != '' || failedValidation && v$.template_id.$invalid }"
            />
            <small id="name-help">Plantilla previamente creada para generar el contrato.</small>
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

    <Dialog v-model:visible="validateDialog" :closable="false" :style="{ width: '600px', maxHeight: '600px' }" :header="`${activeContract?.buyer_name} - ${activeContract?.collection_id}`" :modal="true">
      <div class="confirmation-content">
        <div class="flex flex-column align-items-center text-base font-medium uppercase">
          Etiquetas tipo texto
        </div>
        <div v-if="!textsToReplace.length" class="flex flex-column align-items-center text-xs pb-4">
          No tienes etiquetas tipo texto.
        </div>
        <div>
          <div>
            <div v-for="tag in textsToReplace" :key="tag.tag">
              <div class="flex justify-content-between align-items-center text-sm border-solid border-bottom-1 border-x-none border-top-none surface-border py-1">
                <div class="tag-text">
                  {{ tag.tag }}
                </div>
                <div class="tag-text text-right">
                  {{ tag.value }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-column align-items-center text-base font-medium uppercase py-4">
          Etiquetas tipo imagen
        </div>
        <div v-if="!imagesToReplace.length" class="flex flex-column align-items-center text-xs pb-4">
          No tienes etiquetas tipo imagen.
        </div>
        <div>
          <div>
            <div v-for="tag in imagesToReplace" :key="tag.tag">
              <div class="flex justify-content-between align-items-center text-sm border-solid border-bottom-1 border-x-none border-top-none surface-border py-1">
                <div class="tag-text">
                  {{ tag.tag }}
                </div>
                <div class="tag-text text-right">
                  <a v-if="tag.value !== ''" :href="tag.value" class="no-underline" target="_blank" rel="noopener noreferrer">
                    <Button class="p-button-link" label="Ver imagen" text />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-column align-items-center align-items-center text-base font-medium uppercase py-4">
          Etiquetas tipo lista
        </div>
        <div v-if="!listsToReplace.length" class="flex flex-column align-items-center text-xs pb-4">
          No tienes etiquetas tipo lista.
        </div>
        <div>
          <div>
            <div v-for="tag in listsToReplace" :key="tag.tag">
              <div class="flex justify-content-between align-items-center text-sm border-solid border-bottom-1 border-x-none border-top-none surface-border py-1">
                <div class="tag-text">
                  {{ tag.tag }}
                </div>
                <div class="tag-text text-right">
                  <div v-for="element in tag.value" :key="element" class="py-2">
                    {{ element }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex w-full justify-content-between">
          <Button label="Cancelar" icon="pi pi-times" class="p-button-text" :loading="loadingCreatingContract" @click="validateDialog = false" />
          <Button
            label="Generar"
            icon="pi pi-check"
            class="p-button-text p-button-info"
            :loading="loadingCreatingContract"
            @click="creatingContract"
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
  .contracts-badge {
    background: #14b8a6;
    color: #fff;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-align: center;
  }
  .draft-contracts-badge {
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
  .contracts-texts-column {
    width: 70%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tag-text {
    width: 50%;
  }
  @media screen and (max-width: 960px) {
    .contract-badge {
      margin-right: 0rem;
    }
    .type-badge {
      margin-right: 0rem;
    }
    .contracts-texts-column {
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
