<script setup lang="ts">
import { getAuth } from '@firebase/auth';
// import firebase utils
import { httpsCallable, httpsCallableFromURL } from 'firebase/functions'

// import validators
import { maxLength, numeric, required } from '@vuelidate/validators'
import { useVuelidate } from '@vuelidate/core'

// import types
import type { ContractDoc } from '~~/types/contracts-docs'

definePageMeta({
  middleware: ['auth'],
  layout: 'admin',
})

// import firebase app composable
const { $db, $functions } = useNuxtApp()
// import notification composable
const notification = useNotification()
const loadingContracts = ref(true)
// create reactive data for contractsDocs
const contractsDocs = ref<ContractDoc[]>([])
const selectedStatus = ref()
const config = useRuntimeConfig()
const route = useRoute()
const router = useRouter();
const auth = getAuth()
const token = await auth.currentUser?.getIdToken()
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
const newCreditDialog = ref(false)
// create reative data for new contract
const newCredit = ref(
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
const v$ = useVuelidate(rules, newCredit)
// function to close new contract dialog and reset form
function closeNewContractDialog() {
  newCreditDialog.value = false
  collectionById.value = null
  newCredit.value = {
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
    const collectionsData = httpsCallable($functions(), 'getCreditData')
    try {
        // Get the token and collectionId from your state or wherever they are stored
      const collectionId = newCredit.value.collection_id
      const result = await collectionsData({ collection_id: Number.parseInt(collectionId as string) }) as any
        let redirectUrl = ''
        if(result?.data?.docId){
      // Build the URL with query parameters
        redirectUrl = `${config.public.templateURL}/credit-bank-request?token=${token}&docId=${result?.data?.docId}&cbUrl=${config.public.plataformaURL}/app/creditos`;
        } else {
      // Build the URL with query parameters
      redirectUrl = `${config.public.templateURL}/credit-bank-request?token=${token}&collectionId=${collectionId}&cbUrl=${config.public.plataformaURL}/app/creditos`;
        }
        console.log("redirectUrl",redirectUrl)
      // Redirect to the other service
      window.location.href = redirectUrl;
    } catch (error) {
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
// create reactive data for submitted
const submitted = ref(false)

// get google docs from google drive api
const loadingCollections = ref(false)
async function checkCollections() {
  loadingCollections.value = true
  const collectionsData = httpsCallable($functions(), 'isValidCollection')
  try {
    const result = await collectionsData({ collection_id:newCredit.value.collection_id as string }) as any
    const isValid = result.data.isValid
    if (isValid) {
      loadingContracts.value = false
      collectionById.value = isValid
    }
    else {
      notification.value = {
        show: true,
        severity: 'error',
        summary: 'Error',
        detail: 'No se encontró la de cobranza.',
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
      detail: 'No se pudieron obtener las de cobranza.',
      life: 5000,
    }
  }
}
function updateNewCreditDialog(value: boolean){
  newCreditDialog.value = value
  loadingContracts.value = value
}

</script>

<template>
  <div>
    <Button label="Formatos" icon="pi pi-plus" class="p-button-success w-full md:w-auto md:ml-2 my-2 md:my-0" @click="updateNewCreditDialog(true)" />
    <Dialog v-model:visible="newCreditDialog" :closable="false" :style="{ width: '450px' }" header="Nuevo contrato" :modal="true">
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
              :class="{ 'p-invalid': v$.collection_id.$invalid && newCredit.collection_id != '' || failedValidation && v$.collection_id.$invalid }"
            />
            <small id="name-help">Ingresa el ID en números de la cuenta de cobranza, luego da clic en Válidar Cuenta.</small>
          </div>
          <div class="field block">
            <Button label="Válidar Cuenta" :loading="loadingCollections" :disabled="collectionById || v$.collection_id.$invalid || newCredit.collection_id === ''" class="p-button-text p-button-info w-full" @click="checkCollections" />
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
            :disabled="loadingContracts"
            @click="saveNewContract(true)"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>
