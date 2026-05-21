<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <nav v-if="user" class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <NuxtLink to="/dashboard" class="text-xl font-bold text-gray-900 dark:text-white"> TaskManager </NuxtLink>
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ displayName }}</span>
            <button
              class="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              @click="handleLogout"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import type { UserProfile } from '~/types'

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const { getProfile } = useSupabase()

const profile = ref<UserProfile | null>(null)

onMounted(async () => {
  if (user.value) {
    profile.value = await getProfile()
  }
})

const displayName = computed(() => profile.value?.username || profile.value?.email || '')

const handleLogout = async () => {
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>
