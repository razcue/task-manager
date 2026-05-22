<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">My Projects</h1>
      <NuxtLink
        to="/projects/create"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm"
      >
        + New Project
      </NuxtLink>
    </div>

    <p v-if="loading" class="text-gray-500 dark:text-gray-400">Loading...</p>

    <div v-else-if="projects.length === 0" class="text-center py-16">
      <p class="text-gray-500 dark:text-gray-400 text-lg mb-4">No projects yet</p>
      <NuxtLink to="/projects/create" class="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
        Create your first project
      </NuxtLink>
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="project in projects"
        :key="project.id"
        :to="`/projects/${project.id}`"
        class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition-shadow block"
      >
        <div class="flex items-start justify-between gap-2">
          <h3 class="font-semibold text-gray-900 dark:text-white truncate">{{ project.name }}</h3>
          <span
            v-if="project.archived"
            class="shrink-0 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full"
          >
            Archived
          </span>
        </div>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
          {{ project.description || 'No description' }}
        </p>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '~/types'

const { getProjects } = useSupabase()
const projects = ref<Project[]>([])
const loading = ref(true)

onMounted(async () => {
  projects.value = await getProjects()
  loading.value = false
})
</script>
