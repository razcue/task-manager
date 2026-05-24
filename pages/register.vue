<template>
  <main class="flex items-center justify-center min-h-dvh px-4">
    <div class="w-full max-w-sm">
      <h1 class="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">Register</h1>
      <form novalidate class="space-y-4" @submit.prevent="handleRegister">
        <div>
          <label for="username" class="label">Username <span class="text-red-500">*</span></label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            :class="['input', getError('username') ? 'input-error' : '']"
          />
          <p v-if="getError('username')" class="error-text">
            {{ getError('username') }}
          </p>
        </div>
        <div>
          <label for="email" class="label">Email <span class="text-red-500">*</span></label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            :class="['input', getError('email') ? 'input-error' : '']"
          />
          <p v-if="getError('email')" class="error-text">
            {{ getError('email') }}
          </p>
        </div>
        <div>
          <label for="password" class="label">Password <span class="text-red-500">*</span></label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            :class="['input', getError('password') ? 'input-error' : '']"
          />
          <p v-if="getError('password')" class="error-text">
            {{ getError('password') }}
          </p>
        </div>
        <p v-if="error" class="error-text">{{ error }}</p>
        <button type="submit" :disabled="loading" class="btn btn-primary w-full">
          {{ loading ? 'Creating account...' : 'Create account' }}
        </button>
      </form>
      <p class="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?
        <NuxtLink to="/login" class="text-blue-600 hover:text-blue-700 dark:text-blue-400">Sign in</NuxtLink>
      </p>
    </div>
    <NotificationToast />
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: false, title: 'Register' })

const form = ref({ username: '', email: '', password: '' })
const error = ref('')
const loading = ref(false)
const supabase = useSupabaseClient()
const { notify } = useNotification()

const { validate, getError } = useValidation(form, {
  username: [
    { rule: 'required', message: 'Username is required' },
    { rule: 'minLength', value: 3, message: 'Username must be at least 3 characters' },
    { rule: 'maxLength', value: 30, message: 'Username must be 30 characters or less' },
    { rule: 'pattern', value: '^[a-zA-Z0-9_]+$', message: 'Only letters, numbers, and underscores allowed' },
  ],
  email: [
    { rule: 'required', message: 'Email is required' },
    { rule: 'email', message: 'Enter a valid email address' },
  ],
  password: [
    { rule: 'required', message: 'Password is required' },
    { rule: 'minLength', value: 6, message: 'Password must be at least 6 characters' },
  ],
})

const handleRegister = async () => {
  error.value = ''
  if (!validate()) {
    notify('Please fix the form errors', 'error')
    return
  }

  loading.value = true

  const { data: exists } = await supabase.rpc('check_profile_exists', {
    p_email: form.value.email,
    p_username: form.value.username,
  } as never)

  if (exists === 'email') {
    error.value = 'An account with this email already exists'
    loading.value = false
    return
  }

  if (exists === 'username') {
    error.value = 'This username is already taken'
    loading.value = false
    return
  }

  const { error: err } = await supabase.auth.signUp({
    email: form.value.email,
    password: form.value.password,
    options: {
      data: { username: form.value.username },
    },
  })
  loading.value = false
  if (err) {
    error.value = err.message
    notify(err.message, 'error')
  } else {
    notify('Account created! Check your email to confirm')
    await navigateTo('/login')
  }
}
</script>
