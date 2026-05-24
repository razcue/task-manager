// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxtjs/supabase', '@nuxtjs/tailwindcss', '@nuxtjs/color-mode'],
  vue: {
    compilerOptions: {
      isCustomElement: (tag: string) => tag === 'selectedcontent',
    },
  },
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },
  supabase: {
    redirect: false,
  },
  colorMode: {
    classSuffix: '',
  },
  imports: {
    presets: [
      {
        from: '~/types',
        imports: [
          { name: 'UserProfile', type: true },
          { name: 'Project', type: true },
          { name: 'ProjectMember', type: true },
          { name: 'TaskStatus', type: true },
          { name: 'TaskPriority', type: true },
          { name: 'Task', type: true },
          { name: 'ToastNotification', type: true },
        ],
      },
    ],
  },
})
