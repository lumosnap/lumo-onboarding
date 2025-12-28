// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  runtimeConfig:{
    public:{
      authBaseUrl: 'http://localhost:3001'
    }
  },

  devtools: { enabled: true }
})
