export default defineNuxtConfig({
  app: {
    baseURL: '/',
  },
  generate: {
    dir: 'dist',
  },
  nitro: {
    preset: 'vercel', // Cambia esto si tienes algo personalizado
  },
});
