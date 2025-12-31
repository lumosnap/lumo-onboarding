// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiBaseUrl: 'https://lumo-worker.super-meadow-a0ca.workers.dev/'
    }
  },
  ssr:false,

  devtools: { enabled: true }
})
