<template>
  <div class="max-w-lg mx-auto">
    <h1 class="text-2xl font-bold mb-8 text-gray-900 dark:text-white">Create Project</h1>
    <form novalidate class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <label for="projectName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >Name <span class="text-red-500">*</span></label
        >
        <input
          id="projectName"
          v-model="form.name"
          type="text"
          maxlength="100"
          :class="[
            'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2',
            getError('name')
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500',
          ]"
        />
        <p v-if="getError('name')" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ getError('name') }}
        </p>
      </div>
      <div>
        <label for="projectDescription" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >Description</label
        >
        <textarea
          id="projectDescription"
          v-model="form.description"
          rows="3"
          maxlength="500"
          :class="[
            'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2',
            getError('description')
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500',
          ]"
        />
        <p v-if="getError('description')" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ getError('description') }}
        </p>
      </div>
      <p v-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
      <div class="flex gap-3">
        <button
          type="submit"
          :disabled="loading"
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
definePageMeta({ title: 'Create Project' })
const { createProject } = useSupabase()
const { notify } = useNotification()
const loading = ref(false)
const error = ref('')
const form = ref({ name: '', description: '' })

const { validate, getError } = useValidation(form, {
  name: [
    { rule: 'required', message: 'Project name is required' },
    { rule: 'maxLength', value: 100, message: 'Project name must be 100 characters or less' },
  ],
  description: [{ rule: 'maxLength', value: 500, message: 'Description must be 500 characters or less' }],
})

const handleSubmit = async () => {
  error.value = ''
  if (!validate()) {
    notify('Please fix the form errors', 'error')
    return
  }
  loading.value = true
  const project = await createProject({ name: form.value.name, description: form.value.description })
  loading.value = false
  if (project) {
    notify('Project created successfully')
    await navigateTo(`/projects/${project.id}`)
  } else {
    error.value = 'Failed to create project'
    notify('Failed to create project', 'error')
  }
}
</script>
