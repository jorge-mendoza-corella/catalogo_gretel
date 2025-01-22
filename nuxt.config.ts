export default defineNuxtConfig({
  nitro: {
    preset: 'vercel', // Configura Nitro para Vercel
    vercel: {
      runtime: 'nodejs18.x', // Fuerza el uso de Node.js 18.x
    },
  },

  compatibilityDate: '2025-01-21',
});