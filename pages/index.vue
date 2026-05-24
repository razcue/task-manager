<template>
  <main class="flex items-center justify-center min-h-[80vh]">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">Task Manager</h1>
      <p class="text-gray-500 dark:text-gray-500 mb-8">Manage your projects and tasks</p>
      <NuxtLink to="/login" class="btn btn-primary"> Get Started </NuxtLink>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ title: 'Home' })
</script>
