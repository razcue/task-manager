<template>
  <div class="max-w-lg mx-auto">
    <h1 class="text-2xl font-bold mb-8 text-gray-900 dark:text-white">Create Project</h1>
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
        <input
          v-model="form.name"
          type="text"
          required
          maxlength="100"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
        <textarea
          v-model="form.description"
          rows="3"
          maxlength="500"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <p v-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
      <div class="flex gap-3">
        <button
          type="submit"
          :disabled="loading || !form.name.trim()"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm disabled:opacity-50"
        >
          {{ loading ? 'Creating...' : 'Create' }}
        </button>
        <NuxtLink to="/dashboard" class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">Cancel</NuxtLink>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
const { createProject } = useSupabase()
const router = useRouter()
const loading = ref(false)
const error = ref('')
const form = ref({ name: '', description: '' })

const handleSubmit = async () => {
  error.value = ''
  loading.value = true
  const project = await createProject({ name: form.value.name, description: form.value.description })
  loading.value = false
  if (project) {
    await router.push(`/projects/${project.id}`)
  } else {
    error.value = 'Failed to create project'
  }
}
</script>
