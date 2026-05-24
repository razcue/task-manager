<template>
  <div class="max-w-lg mx-auto">
    <h1 class="text-2xl font-bold mb-8 text-gray-900 dark:text-white">Create Project</h1>
    <form novalidate class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <label for="projectName" class="label">Name <span class="text-red-500">*</span></label>
        <input
          id="projectName"
          v-model="form.name"
          type="text"
          maxlength="100"
          :class="['input', getError('name') ? 'input-error' : '']"
        />
        <p v-if="getError('name')" class="error-text">
          {{ getError('name') }}
        </p>
      </div>
      <div>
        <label for="projectDescription" class="label">Description</label>
        <textarea
          id="projectDescription"
          v-model="form.description"
          rows="3"
          maxlength="500"
          :class="['textarea', getError('description') ? 'input-error' : '']"
        />
        <p v-if="getError('description')" class="error-text">
          {{ getError('description') }}
        </p>
      </div>
      <p v-if="error" class="error-text">{{ error }}</p>
      <div class="flex gap-3">
        <button type="submit" :disabled="loading" class="btn btn-primary btn-sm">
          {{ loading ? 'Creating...' : 'Create' }}
        </button>
        <NuxtLink to="/dashboard" class="btn btn-ghost btn-sm">Cancel</NuxtLink>
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
