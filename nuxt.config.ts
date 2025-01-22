// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  target: 'static',
  buildDir: 'dist',
  generate: {
    dir: 'dist', // Asegúrate de que coincida con el Output Directory en Vercel
  },
  app: {
    baseURL: '/',
    head: {
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      // add universal page title
      title: 'Catalogo de canciones',
      // <link rel="icon" type="shortcut icon" href="/icon-128.png">
      // <link rel="apple-touch-icon" type="image/x-icon" href="/icon-192.png">
      link: [
        {
          rel: 'icon',
          type: 'shortcut icon',
          href: '/icon-128.png',
        },
        {
          rel: 'apple-touch-icon',
          type: 'image/x-icon',
          href: '/icon-192.png',
        },
      ],
    },
  },

  ssr: false,

  // import PrimeVue, PrimeFlex and PrimeIcons css
  css: [
    'primevue/resources/themes/lara-light-teal/theme.css',
    'primevue/resources/primevue.css',
    'primeicons/primeicons.css',
    'primeflex/primeflex.css',
  ],

  // nitro server settings
  nitro: {
    preset: 'vercel',
  },

  compatibilityDate: '2025-01-09',
})