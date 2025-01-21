<script setup lang="ts">
// import filters from "primevue/utils/filters";
import { FilterMatchMode } from 'primevue/api'

// import firebase utils
import { collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore'

// import firebase app composable
const { $db } = useNuxtApp()
// import notification composable
const notification = useNotification()
const route = useRoute()
// create data table ref
const dt = ref()
// create reactive data for users
const users = ref([])
const selectedRole = ref()
const roles = ref([
  { name: 'Interno', code: 'internal' },
  { name: 'Administrador', code: 'admin' },
  { name: 'Contratos', code: 'contracts' },
  { name: 'Landings', code: 'landings' },
  { name: 'Cliente', code: 'client' },
  { name: 'Notario', code: 'notary' },
  { name: 'Entregas', code: 'deliveries' },
  { name: 'Créditos', code: 'credits' },
])
// computed property for filtered users if selectedRole is not null return filtered users by role in user.claims else return all users
const filteredUsers = computed(() => {
  if (selectedRole.value)
    return users.value.filter((user: { claims: Record<string, boolean> }) => user.claims[selectedRole.value])

  else
    return users.value
})
onBeforeMount(() => {
  if (route.query?.role)
    selectedRole.value = route.query.role
})
// create reactive data for user dialog
const userDialog = ref(false)
// create reactive data for delete user dialog
const deleteUserDialog = ref(false)
// create reactive data for active user
const activeUser = ref()
// create reactive data for temp claims
const tempClaims = ref({
  admin: false,
  internal: false,
  contracts: false,
  landings: false,
  client: false,
  notary: false,
  deliveries: false,
  credits: false,
})
// create reactive data for filters
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})
// create reactive data for loading users
const loadingUsers = ref(true)
// create reactive data for submitted
const submitted = ref(false)
// create editUser function
function editUser(user: any) {
  activeUser.value = user
  tempClaims.value = { ...user.claims }
  userDialog.value = true
}
// create hide dialog for edit user function
function hideDialog() {
  activeUser.value.claims = { ...tempClaims.value }
  userDialog.value = false
  submitted.value = false
}
// create function to update user in db
async function saveUser() {
  submitted.value = true
  // save user to db
  try {
    const userRef = doc($db(), 'users', activeUser.value.uid)
    await updateDoc(userRef, {
      ...activeUser.value,
    })
    submitted.value = false
    userDialog.value = false
    notification.value = {
      show: true,
      severity: 'success',
      summary: 'Éxito',
      detail: 'Usuario actualizado correctamente',
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
      detail: 'No se pudo actualizar el usuario',
      life: 5000,
    }
  }
}
// create function to delete user confirmation
function confirmDeleteUser(user: any) {
  activeUser.value = user
  deleteUserDialog.value = true
}
// create function to delete user in db
async function deleteUser() {
  submitted.value = true
  try {
    await deleteDoc(doc($db(), 'users', activeUser.value.uid))
    // @ts-expect-error: findIndex does not exist on type never[]
    const index = users.value.findIndex(obj => obj.email === activeUser.value.email)
    if (index !== -1)
      users.value.splice(index, 1)

    deleteUserDialog.value = false
    submitted.value = false
    notification.value = {
      show: true,
      severity: 'success',
      summary: 'Éxito',
      detail: 'Usuario eliminado correctamente',
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
      detail: 'No se pudo eliminar el usuario',
      life: 5000,
    }
  }
}
// get users from db before mounting
async function getUsers() {
  const querySnapshot = await getDocs(collection($db(), 'users'))
  // @ts-expect-error: forEach does not exist on type never[]
  querySnapshot.forEach((doc: { id: any; data: () => any }) => users.value.push({ ...doc.data() }))
  loadingUsers.value = false
}
// call getUsers before mounting
onBeforeMount(() => {
  getUsers()
})
</script>

<template>
  <div>
    <div class="card">
      <DataTable
        ref="dt"
        :value="filteredUsers"
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
              Administrar usuarios
            </h5>
            <div class="w-full md:w-auto flex gap-1">
              <Dropdown
                v-model="selectedRole"
                :options="roles"
                show-clear
                option-label="name"
                option-value="code"
                placeholder="Filtrar por rol"
                class="w-6 md:w-auto"
              />
              <span class="p-input-icon-left w-6 md:w-auto">
                <i class="pi pi-search" />
                <InputText v-model="filters.global.value" placeholder="Buscar..." class="w-full md:w-auto" />
              </span>
            </div>
          </div>
          <div v-if="loadingUsers" class="pt-2">
            <ProgressBar mode="indeterminate" style="height: .5em" />
          </div>
        </template>
        <Column field="photo" header="Foto" :sortable="false" style="width:4rem">
          <template #body="slotProps">
            <Avatar
              v-if="slotProps.data.photo"
              :image="slotProps.data.photo as string"
              shape="circle"
              style="background-color: #5FCEBC; color: #ffffff; min-width: 32px; min-height: 32px;"
            />
            <Avatar
              v-else
              icon="pi pi-user"
              shape="circle"
              style="background-color: #5FCEBC; color: #ffffff; min-width: 32px; min-height: 32px;"
            />
          </template>
        </Column>
        <Column field="name" header="Nombre" :sortable="false">
          <template #body="slotProps">
            <div v-tooltip.top="slotProps?.data?.name || '---'" class="c-column-for-users-text">
              {{ slotProps?.data?.name || '---' }}
            </div>
          </template>
        </Column>
        <Column field="email" header="Email" :sortable="false">
          <template #body="slotProps">
            <div v-tooltip.top="slotProps.data.email" class="c-column-for-users-text">
              {{ slotProps.data.email }}
            </div>
          </template>
        </Column>
        <Column field="inventoryStatus" header="Roles" :sortable="false">
          <template #body="slotProps">
            <div>
              <span v-if="slotProps.data.claims.internal" class="rol-badge">Interno</span>
              <span v-if="slotProps.data.claims.admin" class="rol-badge">Admin</span>
              <span v-if="slotProps.data.claims.contracts" class="rol-badge">Contratos</span>
              <span v-if="slotProps.data.claims.landings" class="rol-badge">Landings</span>
              <span v-if="slotProps.data.claims.client" class="rol-badge">Cliente</span>
              <span v-if="slotProps.data.claims.notary" class="rol-badge">Notario</span>
              <span v-if="slotProps.data.claims.deliveries" class="rol-badge">Entregas</span>
              <span v-if="slotProps.data.claims.credits" class="rol-badge">Créditos</span>
            </div>
          </template>
        </Column>
        <Column :exportable="false" header="Acciones">
          <template #body="slotProps">
            <div>
              <Button icon="pi pi-pencil" class="p-button-rounded p-button-success p-button-text mr-2" @click="editUser(slotProps.data)" />
              <Button icon="pi pi-trash" class="p-button-rounded p-button-warning p-button-text" @click="confirmDeleteUser(slotProps.data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="userDialog"
      :closable="false"
      :style="{ width: '450px' }"
      :header="`Detalles de ${activeUser?.name || activeUser?.email}`"
      :modal="true"
      class="p-fluid"
    >
      <div class="field">
        <label class="mb-3">Permisos</label>
        <div class="formgrid grid">
          <div class="field-radiobutton col-6">
            <InputSwitch v-model="activeUser.claims.admin" />
            <label for="category1">Administrador</label>
          </div>
          <div class="field-radiobutton col-6">
            <InputSwitch v-model="activeUser.claims.contracts" />
            <label for="category1">Contratos</label>
          </div>
          <div class="field-radiobutton col-6">
            <InputSwitch v-model="activeUser.claims.landings" />
            <label for="category1">Landings</label>
          </div>
          <div class="field-radiobutton col-6">
            <InputSwitch v-model="activeUser.claims.client" />
            <label for="category1">Cliente</label>
          </div>
          <div class="field-radiobutton col-6">
            <InputSwitch v-model="activeUser.claims.notary" />
            <label for="category1">Notario</label>
          </div>
          <div class="field-radiobutton col-6">
            <InputSwitch v-model="activeUser.claims.deliveries" />
            <label for="category1">Entregas</label>
          </div>
          <div class="field-radiobutton col-6">
            <InputSwitch v-model="activeUser.claims.credits" />
            <label for="category1">Créditos</label>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex w-full justify-content-between">
          <Button label="Cancelar" icon="pi pi-times" class="p-button-text" :loading="submitted" @click="hideDialog" />
          <Button label="Guardar" icon="pi pi-check" class="p-button-text p-button-success" :loading="submitted" @click="saveUser" />
        </div>
      </template>
    </Dialog>

    <Dialog v-model:visible="deleteUserDialog" :closable="false" :style="{ width: '450px' }" header="Confirmación" :modal="true">
      <div class="confirmation-content flex flex-column align-items-center">
        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
        <span v-if="activeUser" class="pt-3">Eliminar a <b>{{ activeUser?.name || activeUser?.email }}</b>?</span>
      </div>
      <template #footer>
        <div class="flex w-full justify-content-between">
          <Button label="Cancelar" icon="pi pi-times" class="p-button-text" :loading="submitted" @click="deleteUserDialog = false" />
          <Button label="Confirmar" icon="pi pi-check" class="p-button-text p-button-danger" :loading="submitted" @click="deleteUser" />
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
  .rol-badge {
    background: #343a40;
    color: #fff;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 700;
    margin-right: 0.5rem;
  }
  .c-column-for-users-text {
    max-width: 70%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  @media screen and (max-width: 960px) {
    .c-column-for-users-text {
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  @media screen and (max-width: 768px) {
    .table-header {
      align-items: start;
    }
  }
</style>
