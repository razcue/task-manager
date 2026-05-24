<template>
  <div class="fixed top-4 right-4 left-4 md:left-auto z-[100] flex flex-col gap-2 pointer-events-none">
    <div
      v-for="n in notifications"
      :key="n.id"
      :class="[
        'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all duration-300',
        n.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white',
      ]"
    >
      <span class="flex-1">{{ n.message }}</span>
      <button
        class="text-white/80 hover:text-white transition-colors shrink-0"
        aria-label="Dismiss"
        @click="dismiss(n.id)"
      >
        <XIcon :size="14" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X as XIcon } from '@lucide/vue'
const { notifications, dismiss } = useNotification()
</script>
