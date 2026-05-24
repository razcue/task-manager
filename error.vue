<template>
  <main class="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
    <div class="text-center px-4">
      <h1 class="text-6xl font-bold text-gray-300 dark:text-gray-700 mb-4">{{ error?.statusCode || 'Error' }}</h1>
      <p class="text-lg text-gray-500 dark:text-gray-400 mb-8">{{ error?.statusMessage || 'Something went wrong' }}</p>
      <NuxtLink to="/dashboard" class="btn btn-primary"> Go to Dashboard </NuxtLink>
    </div>
  </main>
</template>

<script setup lang="ts">
defineProps<{
  error: {
    statusCode?: number
    statusMessage?: string
  }
}>()
</script>
