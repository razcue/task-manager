<template>
  <main class="flex items-center justify-center min-h-[80vh]">
    <div class="w-full max-w-sm">
      <h1 class="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">Login</h1>
      <form novalidate class="space-y-4" @submit.prevent="handleLogin">
        <div>
          <label for="loginInput" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >Username or Email <span class="text-red-500">*</span></label
          >
          <input
            id="loginInput"
            v-model="form.loginInput"
            type="text"
            :class="[
              'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2',
              getError('loginInput')
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-transparent',
            ]"
            placeholder="username or email"
          />
          <p v-if="getError('loginInput')" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ getError('loginInput') }}
          </p>
        </div>
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >Password <span class="text-red-500">*</span></label
          >
          <input
            id="password"
            v-model="form.password"
            type="password"
            :class="[
              'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2',
              getError('password')
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-transparent',
            ]"
            placeholder="••••••"
          />
          <p v-if="getError('password')" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ getError('password') }}
          </p>
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
    <NotificationToast />
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: false, title: 'Login' })

const form = ref({ loginInput: '', password: '' })
const error = ref('')
const loading = ref(false)
const supabase = useSupabaseClient()
const { getEmailByUsername } = useSupabase()
const { notify } = useNotification()

const { validate, getError } = useValidation(form, {
  loginInput: [{ rule: 'required', message: 'Username or email is required' }],
  password: [
    { rule: 'required', message: 'Password is required' },
    { rule: 'minLength', value: 6, message: 'Password must be at least 6 characters' },
  ],
})

const handleLogin = async () => {
  error.value = ''
  if (!validate()) {
    notify('Please fix the form errors', 'error')
    return
  }

  loading.value = true

  let email = form.value.loginInput
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

  const { error: err } = await supabase.auth.signInWithPassword({ email, password: form.value.password })
  loading.value = false
  if (err) {
    error.value = err.message
    notify(err.message, 'error')
  } else {
    await navigateTo('/dashboard')
  }
}
</script>
