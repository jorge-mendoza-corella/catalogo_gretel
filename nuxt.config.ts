// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  target: 'static',
  buildDir: 'dist',
  app: {
    head: {
      meta: [
        // <meta name="viewport" content="width=device-width, initial-scale=1">
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      // add universal page title
      title: 'Sozu - Administrador',
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

  // build settings
  build: {
    transpile: ['primevue'],
  },

  modules: [
    // ... other modules
    '@vueuse/nuxt',
    'nuxt-icon',
  ],

  // nitro server settings
  nitro: {
    compatibilityDate: process.env.COMPATIBILITY_DATE || '2025-01-09',
    preset: 'firebase',
    firebase: {
      gen: 2, // Asegúrate de que estés usando Firebase Functions Gen 2
      serverFunctionName: 'adminssr',
    },
  },

  runtimeConfig: {
    // Private config that is only available on the server
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,

    public: {
      // Public config that is available on both server and client
/*       SUMA_PUBLIC_KEY: 'pk_test_Fu6TC3Q6bGnlP7KzZUZE+gUo/Q60J3q7ZAqCZnLBtQE=',
      GOOGLE_MAPS_API: 'AIzaSyBrGiC6e6GtDDxERSChJZaDUa9V4yLvTqg',
      FUNCTIONS_URL: 'https://us-central1-sozu-dev.cloudfunctions.net',
      templateURL: 'https://sozu-templates-dev.web.app',
      plataformaURL:"https://dev.plataforma.sozu.com", */

      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
    },
  },

  vite: {
    resolve: {
      alias: {
        //'#app-manifest': './.nuxt/dist/app.manifest.json',
      },
    },
    optimizeDeps: {
      include: ['primevue'],
      exclude: ['primeicons','primeflex'],
    },
  },

  plugins: [
    '~/plugins/firebase.client.ts',
  ],

  compatibilityDate: '2025-01-09',
})