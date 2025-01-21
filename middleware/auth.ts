import { useUser } from '~~/composables/use-user'

export default defineNuxtRouteMiddleware((to) => {
  const user = useUser()
  // redirect the user to the login page
  if (!user.value.uid) {
    return navigateTo({
      path: '/',
      query: {
        redirect: to.fullPath,
      },
    })
  }
  if (to.fullPath === '/app/users' && !user.value.admin) {
    return navigateTo({
      path: '/app',
      query: {
        redirect: to.fullPath,
      },
    })
  }
  if (to.fullPath === '/app/contracts' && !user.value.admin && !user.value.contracts) {
    return navigateTo({
      path: '/app',
      query: {
        redirect: to.fullPath,
      },
    })
  }
  if (to.fullPath === '/app/creditos' && !user.value.admin && !user.value.credits) {
    return navigateTo({
      path: '/app',
      query: {
        redirect: to.fullPath,
      },
    })
  }
  if (to.fullPath === '/app/creditos/formatos' && !user.value.admin && !user.value.credits) {
    return navigateTo({
      path: '/app',
      query: {
        redirect: to.fullPath,
      },
    })
  }
  if (to.fullPath === '/app/creditos/formatos/santander' && !user.value.admin && !user.value.credits) {
    return navigateTo({
      path: '/app',
      query: {
        redirect: to.fullPath,
      },
    })
  }
  if (to.fullPath === '/app/landings' && !user.value.admin && !user.value.landings) {
    return navigateTo({
      path: '/app',
      query: {
        redirect: to.fullPath,
      },
    })
  }
})
