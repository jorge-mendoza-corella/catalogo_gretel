<script setup lang="ts">
import { collection, getCountFromServer, query, where } from 'firebase/firestore'

definePageMeta({
  middleware: ['auth'],
  layout: 'admin',
})
// import user state
const currentUser = useUser()
const { $db } = useNuxtApp()
// function to return buenos dias, buenas tardes, buenas noches
function getGreeting() {
  const date = new Date()
  const hours = date.getHours()
  if (hours < 12)
    return 'Buenos días'

  else if (hours < 18)
    return 'Buenas tardes'

  else
    return 'Buenas noches'
}
const contracts = ref()
const draftContracts = ref()
async function getTags() {
  const coll = collection($db(), 'contracts')
  const q = query(coll, where('status', '==', 'ready'))
  const q2 = query(coll, where('status', '==', 'draft'))

  const [snapshot, snapshot2] = await Promise.all([
    getCountFromServer(q),
    getCountFromServer(q2),
  ])

  contracts.value = snapshot.data().count
  draftContracts.value = snapshot2.data().count
}

const landings = ref()
const draftLandings = ref()
async function getLandings() {
  const coll = collection($db(), 'landings')
  const q = query(coll, where('published', '==', true))
  const q2 = query(coll, where('published', '==', false))

  const [snapshot, snapshot2] = await Promise.all([
    getCountFromServer(q),
    getCountFromServer(q2),
  ])

  landings.value = snapshot.data().count
  draftLandings.value = snapshot2.data().count
}

const users = ref()
const clientUsers = ref()
async function getUsers() {
  const coll = collection($db(), 'users')
  const q = query(coll, where('claims.internal', '==', true))
  const q2 = query(coll, where('claims.client', '==', true))

  const [snapshot, snapshot2] = await Promise.all([
    getCountFromServer(q),
    getCountFromServer(q2),
  ])

  users.value = snapshot.data().count
  clientUsers.value = snapshot2.data().count
}

onMounted(() => {
  if (currentUser.value.admin || currentUser.value.contracts)
    getTags()
  if (currentUser.value.admin || currentUser.value.landings)
    getLandings()
  if (currentUser.value.admin)
    getUsers()
})
</script>

<template>
  <div class="h-full">
    <div class="surface-ground">
      <div class="mb-3">
        <h2 class="text-2xl font-normal m-0">
          {{ getGreeting() }}, {{ currentUser.name }}
        </h2>
        <p>
          Te damos la bienvenida a tu panel de administración.
        </p>
      </div>
      <div class="grid">
        <div v-if="currentUser.admin || currentUser.contracts" class="col-12 md:col-6">
          <NuxtLink class="no-underline" to="/app/contracts?status=ready">
            <div class="surface-card shadow-2 p-3 border-round">
              <div class="flex justify-content-between mb-3">
                <div>
                  <span class="block text-500 font-medium mb-3">Tienes</span>
                  <div class="text-900 font-medium text-xl">
                    {{ contracts ?? 0 }} contratos
                  </div>
                </div>
                <div class="flex align-items-center justify-content-center bg-indigo-100 border-round" style="width:2.5rem;height:2.5rem">
                  <i class="pi pi-file text-indigo-500 text-xl" />
                </div>
              </div>
              <span class="text-indigo-500 font-medium">generados</span>
            </div>
          </NuxtLink>
        </div>
        <div v-if="currentUser.admin || currentUser.contracts" class="col-12 md:col-6">
          <NuxtLink class="no-underline" to="/app/contracts?status=draft">
            <div class="surface-card shadow-2 p-3 border-round">
              <div class="flex justify-content-between mb-3">
                <div>
                  <span class="block text-500 font-medium mb-3">Tienes</span>
                  <div class="text-900 font-medium text-xl">
                    {{ draftContracts ?? 0 }} contratos
                  </div>
                </div>
                <div class="flex align-items-center justify-content-center bg-red-100 border-round" style="width:2.5rem;height:2.5rem">
                  <i class="pi pi-file text-red-500 text-xl" />
                </div>
              </div>
              <span class="text-red-500 font-medium">en borrador</span>
            </div>
          </NuxtLink>
        </div>
        <div v-if="currentUser.admin || currentUser.landings" class="col-12 md:col-6">
          <NuxtLink class="no-underline" to="/app/landings?published=true">
            <div class="surface-card shadow-2 p-3 border-round">
              <div class="flex justify-content-between mb-3">
                <div>
                  <span class="block text-500 font-medium mb-3">Tienes</span>
                  <div class="text-900 font-medium text-xl">
                    {{ landings ?? 0 }} páginas
                  </div>
                </div>
                <div class="flex align-items-center justify-content-center bg-cyan-100 border-round" style="width:2.5rem;height:2.5rem">
                  <i class="pi pi-globe text-cyan-500 text-xl" />
                </div>
              </div>
              <span class="text-cyan-500 font-medium">publicadas</span>
            </div>
          </NuxtLink>
        </div>
        <div v-if="currentUser.admin || currentUser.landings" class="col-12 md:col-6">
          <NuxtLink class="no-underline" to="/app/landings?published=false">
            <div class="surface-card shadow-2 p-3 border-round">
              <div class="flex justify-content-between mb-3">
                <div>
                  <span class="block text-500 font-medium mb-3">Tienes</span>
                  <div class="text-900 font-medium text-xl">
                    {{ draftLandings ?? 0 }} páginas
                  </div>
                </div>
                <div class="flex align-items-center justify-content-center bg-orange-100 border-round" style="width:2.5rem;height:2.5rem">
                  <i class="pi pi-globe text-orange-500 text-xl" />
                </div>
              </div>
              <span class="text-orange-500 font-medium">en borrador</span>
            </div>
          </NuxtLink>
        </div>
        <div v-if="currentUser.admin" class="col-12 md:col-6">
          <NuxtLink class="no-underline" to="/app/users?role=internal">
            <div class="surface-card shadow-2 p-3 border-round">
              <div class="flex justify-content-between mb-3">
                <div>
                  <span class="block text-500 font-medium mb-3">Hay</span>
                  <div class="text-900 font-medium text-xl">
                    {{ users ?? 0 }} usuarios
                  </div>
                </div>
                <div class="flex align-items-center justify-content-center bg-blue-100 border-round" style="width:2.5rem;height:2.5rem">
                  <i class="pi pi-user text-blue-500 text-xl" />
                </div>
              </div>
              <span class="text-blue-500 font-medium">internos</span>
            </div>
          </NuxtLink>
        </div>
        <div v-if="currentUser.admin" class="col-12 md:col-6">
          <NuxtLink class="no-underline" to="/app/users?role=client">
            <div class="surface-card shadow-2 p-3 border-round">
              <div class="flex justify-content-between mb-3">
                <div>
                  <span class="block text-500 font-medium mb-3">Hay</span>
                  <div class="text-900 font-medium text-xl">
                    {{ clientUsers ?? 0 }} usuarios
                  </div>
                </div>
                <div class="flex align-items-center justify-content-center bg-green-100 border-round" style="width:2.5rem;height:2.5rem">
                  <i class="pi pi-user text-green-500 text-xl" />
                </div>
              </div>
              <span class="text-green-500 font-medium">clientes</span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
