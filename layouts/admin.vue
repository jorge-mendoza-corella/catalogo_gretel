<script setup lang="ts">
import { getAuth, signOut } from 'firebase/auth'
import { useBreakpoints } from '@vueuse/core'

const breakpoints = useBreakpoints({
  mobile: 576,
  tablet: 768,
  laptop: 992,
  desktop: 1200,
})

const isSmall = breakpoints.smallerOrEqual('desktop')
// import user state
const user = useUser()
// get auth instance
const auth = getAuth()
console.log("auth",auth)
const token = await auth.currentUser?.getIdToken()
console.log("token",token)

// import notification state
const notification = useNotification()
// import user state
const currentUser = useUser() 
// create signOut function
function signOutUser() {
  signOut(auth)
    .then(() => {
      // Sign-out successful.
      notification.value = {
        show: true,
        severity: 'success',
        summary: 'Sesion cerrada',
        detail: 'Sesion cerrada correctamente',
        life: 3000,
      }
      currentUser.value.uid = null
      currentUser.value.email = null
      currentUser.value.name = null
      currentUser.value.photo = null
    })
    .catch(() => {
      // An error happened.
      notification.value = {
        show: true,
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo cerrar la sesion',
        life: 3000,
      }
    })
}
</script>

<template>
  <div>
    <div class="min-h-screen flex relative lg:static surface-ground">
      <div id="app-sidebar" :class="{ hidden: isSmall }" class="bg-bluegray-800 h-screen flex-shrink-0 absolute lg:static left-0 top-0 z-1 select-none" style="width:280px">
        <div class="flex flex-column h-full">
          <div class="flex align-items-center justify-content-center px-5 bg-bluegray-900 flex-shrink-0" style="height:60px">
            <img src="https://public.sozu.com/logo-ft.webp" alt="Image" height="30">
          </div>
          <div class="overflow-y-auto mt-3">
            <ul class="list-none p-3 m-0">
              <li>
                <nuxt-link
                  v-ripple
                  to="/app"
                  class="flex align-items-center cursor-pointer p-3 hover:bg-bluegray-900 border-round text-bluegray-100 hover:text-bluegray-50
                            transition-duration-150 transition-colors p-ripple no-underline"
                >
                  <i class="pi pi-home mr-2" />
                  <span class="font-medium">Inicio</span>
                </nuxt-link>
              </li>
              <li v-if="user.admin || user.contracts">
                <nuxt-link
                  v-ripple
                  to="/app/contracts"
                  class="flex align-items-center cursor-pointer p-3 hover:bg-bluegray-900 border-round text-bluegray-100 hover:text-bluegray-50
                            transition-duration-150 transition-colors p-ripple no-underline"
                >
                  <i class="pi pi-file mr-2" />
                  <span class="font-medium">Contratos</span>
                </nuxt-link>
              </li>
              <li v-if="user.admin || user.landings">
                <nuxt-link
                  v-ripple
                  to="/app/landings"
                  class="flex align-items-center cursor-pointer p-3 hover:bg-bluegray-900 border-round text-bluegray-100 hover:text-bluegray-50
                            transition-duration-150 transition-colors p-ripple no-underline"
                >
                  <i class="pi pi-globe mr-2" />
                  <span class="font-medium">Landings</span>
                </nuxt-link>
              </li>
              <li v-if="user.admin || user.deliveries">
                <nuxt-link
                  v-ripple
                  to="/app/entregas"
                  class="flex align-items-center cursor-pointer p-3 hover:bg-bluegray-900 border-round text-bluegray-100 hover:text-bluegray-50
                            transition-duration-150 transition-colors p-ripple no-underline"
                >
                  <i class="pi pi-flag mr-2" />
                  <span class="font-medium">Entregas</span>
                </nuxt-link>
              </li>
              <li v-if="user.admin || user.credits">
                <nuxt-link
                  v-ripple
                  to="/app/creditos"
                  class="flex align-items-center cursor-pointer p-3 hover:bg-bluegray-900 border-round text-bluegray-100 hover:text-bluegray-50
                            transition-duration-150 transition-colors p-ripple no-underline"
                >
                  <i class="pi pi-money-bill mr-2" />
                  <span class="font-medium">Créditos</span>
                </nuxt-link>
              </li>
              <li v-if="user.admin">
                <nuxt-link
                  v-ripple
                  class="flex align-items-center cursor-pointer p-3 hover:bg-bluegray-900 border-round text-bluegray-100 hover:text-bluegray-50
                            transition-duration-150 transition-colors p-ripple no-underline"
                  to="/app/users"
                >
                  <i class="pi pi-users mr-2" />
                  <span class="font-medium">Usuarios</span>
                </nuxt-link>
              </li>
            </ul>
          </div>
          <div class="mt-auto">
            <hr class="mb-3 mx-3 border-top-1 border-none border-bluegray-600">
            <ul class="list-none p-2 m-0 hidden origin-bottom animation-duration-150 overflow-hidden animation-ease-in-out">
              <li>
                <a
                  v-ripple
                  class="flex align-items-center cursor-pointer py-3 px-5 hover:bg-bluegray-900 border-round text-bluegray-100 hover:text-bluegray-50
                        transition-duration-150 transition-colors p-ripple"
                  @click="signOutUser"
                >
                  <i class="pi pi-sign-out mr-2" />
                  <span class="font-medium">Cerrar sesión</span>
                </a>
              </li>
            </ul>
            <a
              v-ripple
              v-styleclass="{ selector: '@prev', enterClass: 'hidden', enterActiveClass: 'slidedown', leaveToClass: 'hidden', leaveActiveClass: 'slideup' }"
              class="m-3 px-3 py-2 flex align-items-center hover:bg-bluegray-900 border-round cursor-pointer text-bluegray-100 hover:text-bluegray-50
                    transition-duration-150 transition-colors p-ripple"
            >
              <Avatar
                v-if="user?.photo"
                :image="user?.photo as string"
                shape="circle"
                style="background-color: #5FCEBC; color: #ffffff; min-width: 32px; min-height: 32px;"
              />
              <Avatar
                v-else
                icon="pi pi-user"
                shape="circle"
                style="background-color: #5FCEBC; color: #ffffff; min-width: 32px; min-height: 32px;"
              />
              <span class="font-medium c-user-email ml-2">{{ user?.name || user?.email }}</span>
              <i class="pi pi-chevron-up ml-auto" />
            </a>
          </div>
        </div>
      </div>
      <div class="min-h-screen flex flex-column relative flex-auto">
        <div class="flex justify-content-between align-items-center px-5 surface-section shadow-2 relative lg:static border-bottom-1 surface-border" style="height:60px">
          <div class="flex">
            <a
              v-ripple
              v-styleclass="{ selector: '#app-sidebar', enterClass: 'hidden', enterActiveClass: 'fadeinleft', leaveToClass: 'hidden', leaveActiveClass: 'fadeoutleft', hideOnOutsideClick: true }"
              class="cursor-pointer block text-700 mr-3 mt-1 p-ripple"
            >
              <i class="pi pi-bars text-4xl" />
            </a>
          </div>
          <a
            v-ripple
            v-styleclass="{ selector: '@next', enterClass: 'hidden', enterActiveClass: 'fadein', leaveToClass: 'hidden', leaveActiveClass: 'fadeout', hideOnOutsideClick: true }"
            class="cursor-pointer block lg:hidden text-700 p-ripple"
          >
            <i class="pi pi-ellipsis-v text-2xl" />
          </a>
          <ul
            class="list-none p-0 m-0 hidden lg:flex lg:align-items-center select-none lg:flex-row
                surface-section border-1 lg:border-none surface-border right-0 top-100 z-1 shadow-2 lg:shadow-none absolute lg:static"
          >
            <li>
              <a
                v-ripple
                class="flex p-3 lg:px-3 lg:py-2 align-items-center text-600 hover:text-900 hover:surface-100 font-medium border-round cursor-pointer
                        transition-duration-150 transition-colors p-ripple"
              >
                <i v-badge.danger class="pi pi-bell text-base lg:text-2xl mr-2 lg:mr-0" />
                <span class="block lg:hidden font-medium">Notificaciones</span>
              </a>
            </li>
          </ul>
        </div>
        <div class="p-5 flex flex-column flex-auto router-content">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<style>
  .router-link-active {
    background-color: #3c4858;
    text-decoration: none;
  }
  .router-content {
    overflow-y: auto;
    max-height: calc(100vh - 60px);
  }
  .c-user-email {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 90%;
  }
</style>
