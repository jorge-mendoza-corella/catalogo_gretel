<script setup lang="ts">
// import filters from "primevue/utils/filters";
import { FilterMatchMode } from 'primevue/api'

// import firebase utils
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore'

// import validators
import { maxLength, required } from '@vuelidate/validators'
import { useVuelidate } from '@vuelidate/core'

// import firebase app composable
const { $db } = useNuxtApp()
// import notification composable
const notification = useNotification()
// create data table ref
const dt = ref()
// create reactive data for tags
const tags = useTags()
const selectedType = ref()
const status = ref([
  { name: 'Texto', code: 'text' },
  { name: 'Imagen', code: 'image' },
  { name: 'Lista', code: 'list' },
])
const filteredTags = computed(() => {
  if (selectedType.value !== null && selectedType.value !== undefined)
    return tags.value.filter((tag: { type: string | null }) => tag.type === selectedType.value)

  else
    return tags.value
})
// new tag dialog ref
const newTagDialog = ref(false)
// create reative data for new tag
const newTag = ref({
  label: '',
  tag: '',
  type: '',
})
// new tag type options
const newTagTypeOptions = ref([
  { label: 'Texto', value: 'text' },
  { label: 'Imagen', value: 'image' },
  { label: 'Lista', value: 'list' },
])
// if form isn't valid, show error message
const failedValidation = ref(false)
// delare tag regex validation
const tagRegex = /^[a-z0-9_]+$/
// test if tag is valid
const isTagValid = (tag: string) => tagRegex.test(tag)
// is tag unique validation
function isTagUnique(tag: string) {
  const tagWithoutBrackets = tag.replace(/{{|}}/g, '')
  const isUnique = tags.value.every(
    t => t.tag.replace(/{{|}}/g, '') !== tagWithoutBrackets || tempTag.value.tag === t.tag,
  )
  return isUnique
}

// create form rules
const rules = {
  label: { required, maxLength: maxLength(100) },
  tag: { isTagValid, required, maxLength: maxLength(100), isTagUnique },
  type: { required },
}
// create reactive data for vuelidate
const v$ = useVuelidate(rules, newTag)
// function to close new tag dialog and reset form
function closeNewTagDialog() {
  newTagDialog.value = false
  newTag.value = {
    label: '',
    tag: '',
    type: '',
  }
}
// function to save new tag
async function saveNewTag(isFormValid: any) {
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
    // save new tag to db
    try {
      const docRef = await addDoc(collection($db(), 'tags'), {
        ...newTag.value,
        tag: `{{${newTag.value.tag}}}`,
      })
      tags.value.unshift({
        ...newTag.value,
        tag: `{{${newTag.value.tag}}}`,
        uid: docRef.id,
      })
      closeNewTagDialog()
      // hide loading
      submitted.value = false
      notification.value = {
        show: true,
        severity: 'success',
        summary: 'Éxito',
        detail: 'Etiqueta guardada con éxito',
        life: 3000,
      }
    }
    catch (error) {
      notification.value = {
        show: true,
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar etiqueta',
        life: 3000,
      }
      submitted.value = false
    }
  }
}
// create reactive data for tag dialog
const editTagDialog = ref(false)
// create reactive data for delete tag dialog
const deleteTagDialog = ref(false)
// create reactive data for active tag
const activeTag = ref()
// create reactive data for vuelidate
const v1$ = useVuelidate(rules, activeTag)
// create reactive data for temp claims
const tempTag = ref()
// create reactive data for filters
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})
// create reactive data for loading tags
const loadingTags = ref(true)
// create reactive data for submitted
const submitted = ref(false)
// create editTag function
function editTag(tag: any) {
  const tagWithoutBrackets = tag.tag.replace(/{{|}}/g, '')
  activeTag.value = { ...tag, tag: tagWithoutBrackets }
  tempTag.value = { ...tag }
  editTagDialog.value = true
}
// create hide dialog for edit tag function
function hideEditDialog() {
  const tagWithoutBrackets = tempTag.value.tag.replace(/{{|}}/g, '')
  activeTag.value = { ...tempTag.value, tag: tagWithoutBrackets }
  editTagDialog.value = false
  submitted.value = false
  tempTag.value = null
}
// create function to update tag in db
async function saveTag(isFormValid: any) {
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
    // save tag to db
    try {
      const userRef = doc($db(), 'tags', activeTag.value.uid)
      // Find index of activeTag in tags array
      const index = tags.value.findIndex(tag => tag.uid === activeTag.value.uid)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { uid, ...tagWithoutUid } = activeTag.value
      const newActiveTag = {
        ...tagWithoutUid,
        tag: `{{${activeTag.value.tag}}}`,
      }
      await updateDoc(userRef, newActiveTag)
      // Update tags array with new tag
      tags.value[index] = { uid: activeTag.value.uid, ...newActiveTag }
      submitted.value = false
      editTagDialog.value = false
      notification.value = {
        show: true,
        severity: 'success',
        summary: 'Éxito',
        detail: 'Etiqueta actualizada correctamente',
        life: 5000,
      }
      tempTag.value = null
    }
    catch (error) {
      // error
      submitted.value = false
      notification.value = {
        show: true,
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo actualizar la etiqueta',
        life: 5000,
      }
    }
  }
}
// create function to delete tag confirmation
function confirmDeleteTag(tag: any) {
  activeTag.value = tag
  deleteTagDialog.value = true
}
// create function to delete tag in db
async function deleteTag() {
  submitted.value = true
  try {
    await deleteDoc(doc($db(), 'tags', activeTag.value.uid))
    const index = tags.value.findIndex(obj => obj.tag === activeTag.value.tag)
    if (index !== -1)
      tags.value.splice(index, 1)

    deleteTagDialog.value = false
    submitted.value = false
    notification.value = {
      show: true,
      severity: 'success',
      summary: 'Éxito',
      detail: 'Etiqueta eliminada correctamente',
      life: 5000,
    }
    tempTag.value = null
  }
  catch (error) {
    // error
    submitted.value = false
    notification.value = {
      show: true,
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo eliminar la etiqueta',
      life: 5000,
    }
  }
}
// get tags from db before mounting
async function getTags() {
  const querySnapshot = await getDocs(collection($db(), 'tags'))
  querySnapshot.forEach((doc: { id: any; data: () => any }) => tags.value.push({ uid: doc.id, ...doc.data() }))
  loadingTags.value = false
}
// call getTags before mounting
onBeforeMount(() => {
  tags.value = []
  getTags()
})
// copy tag to clipboard
function copyTag(tag: any) {
  navigator.clipboard.writeText(tag)
  notification.value = {
    show: true,
    severity: 'success',
    summary: 'Éxito',
    detail: 'Etiqueta copiada al portapapeles',
    life: 2000,
  }
}
</script>

<template>
  <div>
    <div class="card">
      <DataTable
        ref="dt"
        :value="filteredTags"
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
              Administrar etiquetas
            </h5>
            <div>
              <div class="w-full md:w-auto flex gap-1 flex-wrap">
                <Dropdown
                  v-model="selectedType"
                  :options="status"
                  show-clear
                  option-label="name"
                  option-value="code"
                  placeholder="Filtrar por tipo"
                  class="w-full md:w-auto"
                />
                <span class="p-input-icon-left w-full md:w-auto">
                  <i class="pi pi-search" />
                  <InputText v-model="filters.global.value" placeholder="Buscar..." class="w-full md:w-auto" />
                </span>
                <Button label="Nueva" icon="pi pi-plus" class="p-button-success w-full md:w-auto md:ml-2 my-2 md:my-0" @click="newTagDialog = true" />
              </div>
            </div>
          </div>
          <div v-if="loadingTags" class="pt-2">
            <ProgressBar mode="indeterminate" style="height: .5em" />
          </div>
        </template>
        <Column class="tag-name" field="label" header="Nombre" :sortable="false">
          <template #body="slotProps">
            <div v-tooltip.top="slotProps.data.label" class="tags-text-column">
              {{ slotProps.data.label }}
            </div>
          </template>
        </Column>
        <Column field="tag" header="Etiqueta" :sortable="false">
          <template #body="slotProps">
            <div class="cursor-pointer tag-badge" @click="copyTag(slotProps.data.tag)">
              {{ slotProps.data.tag }}
            </div>
          </template>
        </Column>
        <Column field="tagType" header="Tipo" :sortable="false">
          <template #body="slotProps">
            <div>
              <div v-if="slotProps.data.type === 'text'" class="type-badge">
                Texto
              </div>
              <div v-if="slotProps.data.type === 'image'" class="type-badge">
                Imagen
              </div>
              <div v-if="slotProps.data.type === 'list'" class="type-badge">
                Lista
              </div>
            </div>
          </template>
        </Column>
        <Column :exportable="false" header="Acciones">
          <template #body="slotProps">
            <div>
              <Button icon="pi pi-pencil" class="p-button-rounded p-button-success p-button-text" @click="editTag(slotProps.data)" />
              <Button icon="pi pi-trash" class="p-button-rounded p-button-warning p-button-text" @click="confirmDeleteTag(slotProps.data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="editTagDialog"
      :closable="false"
      :style="{ width: '450px' }"
      :header="`${activeTag?.label || 'Etiqueta'}`"
      :modal="true"
      class="p-fluid"
    >
      <div class="edit-tag-content">
        <form ref="newTagForm">
          <div class="field block">
            <label for="label">Nombre</label>
            <InputText
              id="label"
              v-model="v1$.label.$model"
              class="block w-full"
              type="label"
              aria-describedby="label-help"
              :class="{ 'p-invalid': v1$.label.$invalid && activeTag.label != '' || failedValidation && v1$.label.$invalid }"
            />
            <small id="label-help">El nombre para identificar la etiqueta.</small>
          </div>
          <div class="field block">
            <label for="tag">Etiqueta</label>
            <InputText
              id="tag"
              v-model="v1$.tag.$model"
              class="block w-full"
              type="tag"
              aria-describedby="tag-help"
              :class="{ 'p-invalid': v1$.tag.$invalid && activeTag.tag != '' || failedValidation && v1$.tag.$invalid }"
            />
            <small id="tag-help">En minúsculas, sin espacios y sin paréntesis.</small>
          </div>
          <div class="field block">
            <label for="type">Tipo</label>
            <Dropdown
              id="type"
              v-model="v1$.type.$model"
              class="w-full"
              :options="newTagTypeOptions"
              option-label="label"
              option-value="value"
              placeholder="Selecciona el tipo"
              :class="{ 'p-invalid': v1$.type.$invalid && activeTag.type != '' || failedValidation && v1$.type.$invalid }"
            />
            <small id="label-help">Tipo de etiqueta para utilizar en el contrato.</small>
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
            @click="saveTag(!v1$.$invalid)"
          />
        </div>
      </template>
    </Dialog>

    <Dialog v-model:visible="deleteTagDialog" :closable="false" :style="{ width: '450px' }" :modal="true">
      <div class="confirmation-content flex flex-column align-items-center">
        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
        <span v-if="activeTag" class="pt-3">¿Eliminar a <b>{{ activeTag.label }}</b>?</span>
      </div>
      <template #footer>
        <div class="flex w-full justify-content-between">
          <Button label="Cancelar" icon="pi pi-times" class="p-button-text" :loading="submitted" @click="deleteTagDialog = false" />
          <Button label="Confirmar" icon="pi pi-check" class="p-button-text p-button-danger" :loading="submitted" @click="deleteTag" />
        </div>
      </template>
    </Dialog>
    <Dialog v-model:visible="newTagDialog" :closable="false" :style="{ width: '450px' }" header="Nueva etiqueta" :modal="true">
      <div class="new-tag-content">
        <form ref="newTagForm">
          <div class="field block">
            <label for="label">Nombre</label>
            <InputText
              id="label"
              v-model="v$.label.$model"
              class="block w-full"
              type="label"
              aria-describedby="label-help"
              :class="{ 'p-invalid': v$.label.$invalid && newTag.label != '' || failedValidation && v$.label.$invalid }"
            />
            <small id="label-help">El nombre para identificar la etiqueta.</small>
          </div>
          <div class="field block">
            <label for="tag">Etiqueta</label>
            <InputText
              id="tag"
              v-model="v$.tag.$model"
              class="block w-full"
              type="tag"
              aria-describedby="tag-help"
              :class="{ 'p-invalid': v$.tag.$invalid && newTag.tag != '' || failedValidation && v$.tag.$invalid }"
            />
            <small id="tag-help">En minúsculas, sin espacios y sin paréntesis.</small>
          </div>
          <div class="field block">
            <label for="type">Tipo</label>
            <Dropdown
              id="type"
              v-model="v$.type.$model"
              class="w-full"
              :options="newTagTypeOptions"
              option-label="label"
              option-value="value"
              placeholder="Selecciona el tipo"
              :class="{ 'p-invalid': v$.type.$invalid && newTag.type != '' || failedValidation && v$.type.$invalid }"
            />
            <small id="label-help">Tipo de etiqueta para utilizar en el contrato.</small>
          </div>
        </form>
      </div>
      <template #footer>
        <div class="flex w-full justify-content-between">
          <Button label="Cancelar" icon="pi pi-times" class="p-button-text" :loading="submitted" @click="closeNewTagDialog" />
          <Button
            label="Guardar"
            icon="pi pi-check"
            class="p-button-text p-button-success"
            :loading="submitted"
            :disabled="v$.$invalid"
            @click="saveNewTag(!v$.$invalid)"
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
  .tag-badge {
    background: #14b8a6;
    color: #fff;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 700;
    margin-right: 0.5rem;
    width: 70%;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tags-text-column {
    width: 70%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  @media screen and (max-width: 960px) {
    .tag-badge {
      margin-right: 0rem;
    }
    .type-badge {
      margin-right: 0rem;
    }
    .tags-text-column {
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
