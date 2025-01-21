<script setup lang="ts">
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const { $auth } = useNuxtApp(); // Obtener la instancia de auth desde el plugin Nuxt
const notification = useNotification(); // Utilidad de notificaciones
const loading = ref(false); // Estado de carga para el botón
const userData = ref(null); // Almacena los datos completos del usuario

// Función para iniciar sesión con Google
async function loginWithGoogle() {
  if (loading.value) return; // Evitar solicitudes repetidas si ya está cargando

  loading.value = true; // Activar estado de carga
  const provider = new GoogleAuthProvider(); // Proveedor de Google para autenticación

  try {
    // 1. Autenticar al usuario con Google
    const result = await signInWithPopup($auth, provider);
    const idToken = await result.user.getIdToken(); // Obtener el token del usuario

    console.log('Enviando idToken al backend...');

    // 2. Llamar al endpoint para guardar/verificar el usuario
    const { data: loginResponse, error: loginError } = await useFetch('/api/login', {
      method: 'POST',
      body: { idToken },
    });

    if (loginError) {
      throw new Error('Error al guardar el usuario en el backend.');
    }

    notification.add({
      severity: 'success',
      summary: 'Inicio de sesión exitoso',
      detail: loginResponse?.message || 'Usuario registrado correctamente.',
      life: 3000,
    });

    console.log('Usuario autenticado:', loginResponse);

    // 3. Obtener datos completos del usuario
    const userId = result.user.uid;
    console.log('Obteniendo datos completos del usuario...');
    const { data: userResponse, error: userError } = await useFetch(`/api/users/${userId}`);

    if (userError) {
      throw new Error('Error al obtener los datos completos del usuario.');
    }

    userData.value = userResponse; // Guardar datos del usuario en el estado local
    console.log('Datos completos del usuario:', userData.value);

  } catch (error: any) {
    console.error('Error durante el proceso de inicio de sesión:', error);

    // Manejo de errores específicos y genéricos
    const isPopupClosed = error?.code === 'auth/popup-closed-by-user';
    notification.add({
      severity: isPopupClosed ? 'warn' : 'error',
      summary: isPopupClosed ? 'Inicio de sesión cancelado' : 'Error al iniciar sesión',
      detail: isPopupClosed ? 'Vuelve a intentarlo.' : error.message || 'No se pudo iniciar sesión.',
      life: 5000,
    });
  } finally {
    loading.value = false; // Desactivar estado de carga
  }
}
</script>

<template>
  <div>
    <div class="flex justify-content-center align-items-center w-full h-screen">
      <div class="card surface-card w-11 md:w-9 xl:w-4 flex flex-column align-items-center p-4 border-round-2xl">
        <img class="pt-2" src="https://public.sozu.com/logo.webp" alt="Logo de Sozu" />
        <h1 class="text-2xl font-bold text-center">Te damos la bienvenida a Admin Sozu</h1>
        <p class="text-center font-regular">Inicia sesión con tu cuenta Sozu</p>
        <div class="py-4">
          <Button
            data-test="login-btn"
            label="Iniciar Sesión"
            :loading="loading"
            @click="loginWithGoogle"
          />
        </div>

        <!-- Mostrar datos del usuario si están disponibles -->
        <div v-if="userData" class="mt-4">
          <h2>Datos del Usuario:</h2>
          <p><strong>Nombre:</strong> {{ userData.nombre }}</p>
          <p><strong>Email:</strong> {{ userData.email }}</p>
          <p><strong>Rol:</strong> {{ userData.rol.nombre }}</p>
          <h3>Permisos:</h3>
          <ul>
            <li v-for="permiso in userData.rol.permisos" :key="permiso.id">
              {{ permiso.nombre }} - {{ permiso.descripcion }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>