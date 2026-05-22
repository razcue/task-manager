<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <nav v-if="user" class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <div class="flex items-center gap-4">
            <NuxtLink to="/dashboard" class="text-xl font-bold text-gray-900 dark:text-white"> TaskManager </NuxtLink>
            <span v-if="onProjectPage" class="text-gray-300 dark:text-gray-600">/</span>
            <div v-if="projects.length === 0" class="flex items-center gap-2">
              <button
                class="text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 font-medium"
                @click="router.push('/projects/create')"
              >
                + Create Project
              </button>
            </div>
            <div v-else-if="onProjectPage" ref="projectDropdownRef" class="relative">
              <button
                class="flex items-center gap-1 text-sm bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                @click="showProjectDropdown = !showProjectDropdown"
              >
                <span class="max-w-36 truncate">{{ currentProject?.name || 'Project' }}</span>
                <ChevronDownIcon :size="14" class="shrink-0" />
              </button>
              <div
                v-if="showProjectDropdown"
                class="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-50 py-1"
              >
                <div
                  v-for="p in projects"
                  :key="p.id"
                  class="flex items-center hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <button
                    class="flex-1 text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 truncate"
                    @click="goToProjectTasks(p.id)"
                  >
                    {{ p.name }}
                  </button>
                  <button
                    class="px-2 py-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    @click="goToProjectSettings(p.id)"
                  >
                    <SettingsIcon :size="14" />
                  </button>
                </div>
                <div class="border-t border-gray-200 dark:border-gray-800">
                  <button
                    class="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    @click="goToCreateProject"
                  >
                    + New Project
                  </button>
                </div>
              </div>
            </div>
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
import type { Project } from '~/types'
import { ChevronDown as ChevronDownIcon, Settings as SettingsIcon } from '@lucide/vue'

const router = useRouter()
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const { getProfile, getProjects } = useSupabase()
const route = useRoute()

const profile = ref<{ username?: string; email?: string } | null>(null)
const projects = ref<Project[]>([])
const currentProjectId = ref('')
const showProjectDropdown = ref(false)
const projectDropdownRef = ref<HTMLElement | null>(null)

const onProjectPage = computed(() => route.path.startsWith('/projects/') && !!route.params.id)

const currentProject = computed(() => projects.value.find((p) => p.id === currentProjectId.value))

onMounted(async () => {
  if (user.value) {
    profile.value = await getProfile()
    projects.value = await getProjects()
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

function handleClickOutside(e: MouseEvent) {
  if (projectDropdownRef.value && !projectDropdownRef.value.contains(e.target as Node)) {
    showProjectDropdown.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

function goToProjectTasks(id: string) {
  showProjectDropdown.value = false
  router.push(`/projects/${id}/tasks?view=board`)
}

function goToProjectSettings(id: string) {
  showProjectDropdown.value = false
  router.push(`/projects/${id}?view=board`)
}

function goToCreateProject() {
  showProjectDropdown.value = false
  router.push('/projects/create')
}

const displayName = computed(() => profile.value?.username || profile.value?.email || '')

const handleLogout = async () => {
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>
