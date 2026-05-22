<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <nav v-if="user" class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <div class="flex items-center gap-4">
            <NuxtLink to="/dashboard" class="text-xl font-bold text-gray-900 dark:text-white"> TaskManager </NuxtLink>
            <span v-if="onProjectPage" class="text-gray-300 dark:text-gray-600">/</span>
            <select
              v-if="onProjectPage"
              :value="currentProjectId"
              class="text-sm bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-48"
              @change="handleProjectChange"
            >
              <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
              <option disabled>──────────</option>
              <option value="__new__">+ New Project</option>
            </select>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ displayName }}</span>
            <button
              class="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              @click="handleLogout"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import type { UserProfile, Project } from '~/types'

const router = useRouter()
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const { getProfile, getProjects } = useSupabase()
const route = useRoute()

const profile = ref<UserProfile | null>(null)
const projects = ref<Project[]>([])
const currentProjectId = ref('')

const onProjectPage = computed(() => route.path.startsWith('/projects/') && !!route.params.id)

onMounted(async () => {
  if (user.value) {
    profile.value = await getProfile()
  }
})

watch(
  () => route.params.id,
  async (id) => {
    if (onProjectPage.value && typeof id === 'string') {
      currentProjectId.value = id
      projects.value = await getProjects()
    }
  },
  { immediate: true },
)

const handleProjectChange = (e: Event) => {
  const val = (e.target as HTMLSelectElement).value
  if (val === '__new__') {
    router.push('/projects/create')
  } else {
    router.push(`/projects/${val}`)
  }
}

const displayName = computed(() => profile.value?.username || profile.value?.email || '')

const handleLogout = async () => {
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>
