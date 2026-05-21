// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxtjs/supabase', '@nuxtjs/tailwindcss', '@nuxtjs/color-mode'],
  supabase: {
    redirect: false,
  },
  colorMode: {
    classSuffix: '',
  },
  tailwindcss: {},
})
