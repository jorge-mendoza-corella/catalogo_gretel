export default defineNuxtConfig({
  target: 'static',
  ssr: false,

  nitro: {
    preset: 'vercel',
  },

  app: {
    baseURL: '/',
    head: { /* tu configuración de meta y head */ },
  },

  css: [
    'primevue/resources/themes/lara-light-teal/theme.css',
    'primevue/resources/primevue.css',
    'primeicons/primeicons.css',
    'primeflex/primeflex.css',
  ],

  compatibilityDate: '2025-01-21',
});