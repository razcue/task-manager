<template>
  <div class="flex items-center justify-center min-h-[80vh]">
    <div class="w-full max-w-sm">
      <h1 class="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">Login</h1>
      <form class="space-y-4" @submit.prevent="handleLogin">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username or Email</label>
          <input
            v-model="loginInput"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="username or email"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
          <input
            v-model="password"
            type="password"
            required
            minlength="6"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="••••••"
          />
        </div>
        <p v-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50"
        >
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>
      <p class="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Don't have an account?
        <NuxtLink to="/register" class="text-blue-600 hover:text-blue-700 dark:text-blue-400">Register</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const loginInput = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const supabase = useSupabaseClient()
const { getEmailByUsername } = useSupabase()

const handleLogin = async () => {
  error.value = ''
  loading.value = true

  let email = loginInput.value
  if (!email.includes('@')) {
    const resolved = await getEmailByUsername(email)
    if (resolved) {
      email = resolved
    } else {
      error.value = 'User not found'
      loading.value = false
      return
    }
  }

  const { error: err } = await supabase.auth.signInWithPassword({ email, password: password.value })
  loading.value = false
  if (err) {
    error.value = err.message
  } else {
    await navigateTo('/dashboard')
  }
}
</script>
