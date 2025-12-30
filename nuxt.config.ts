// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      authBaseUrl: 'https://lumo-worker.super-meadow-a0ca.workers.dev/api/auth'
    }
  },

  devtools: { enabled: true }
})
