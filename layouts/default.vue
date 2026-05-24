<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <nav v-if="user" class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div class="flex justify-between h-14 sm:h-16 items-center gap-2">
          <div class="flex items-center gap-2 sm:gap-4 min-w-0">
            <NuxtLink
              to="/dashboard"
              class="inline-flex items-center gap-2 text-lg sm:text-xl font-bold text-gray-900 dark:text-white shrink-0"
            >
              TaskManager
              <HouseIcon class="block sm:hidden" :size="18" aria-hidden="true" />
            </NuxtLink>
            <span v-if="onProjectPage" class="hidden sm:block text-gray-300 dark:text-gray-600 shrink-0">/</span>
            <div v-if="projects.length === 0" class="hidden sm:block shrink-0">
              <button class="btn btn-primary btn-sm" @click="goToCreateProject">+ Create Project</button>
            </div>
            <template v-else-if="onProjectPage">
              <div ref="projectDropdownRef" class="hidden sm:block relative min-w-0">
                <button
                  class="flex items-center justify-between gap-1 text-sm bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-56"
                  :aria-expanded="showProjectDropdown"
                  aria-haspopup="true"
                  @click="showProjectDropdown = !showProjectDropdown"
                >
                  <span class="truncate">{{ currentProject?.name || 'Project' }}</span>
                  <ChevronDownIcon :size="14" class="shrink-0" aria-hidden="true" />
                </button>
                <div
                  v-if="showProjectDropdown"
                  role="menu"
                  class="absolute top-full left-0 mt-1 w-56 card shadow-lg z-50 py-1"
                >
                  <div
                    v-for="p in projects"
                    :key="p.id"
                    class="flex items-center hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <button
                      class="flex-1 text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 truncate"
                      role="menuitem"
                      @click="goToProjectTasks(p.id)"
                    >
                      {{ p.name }}
                    </button>
                    <button
                      class="px-2 py-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      role="menuitem"
                      :aria-label="'Settings for ' + p.name"
                      @click="goToProjectSettings(p.id)"
                    >
                      <SettingsIcon :size="14" aria-hidden="true" />
                    </button>
                  </div>
                  <div class="border-t border-gray-200 dark:border-gray-800">
                    <button
                      class="w-full inline-flex items-center justify-center gap-1 text-left px-3 py-2 text-sm text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      role="menuitem"
                      @click="goToCreateProject"
                    >
                      <PlusIcon :size="16" class="-translate-y-px" aria-hidden="true" />
                      New Project
                    </button>
                  </div>
                </div>
              </div>
              <NuxtLink
                to="/dashboard"
                class="block sm:hidden inline-flex items-center gap-2 text-sm font-bold text-gray-400 dark:text-white shrink-0 animate-bounce"
              >
                projects
              </NuxtLink>
            </template>
          </div>
          <div class="flex items-center gap-2 sm:gap-4 shrink-0">
            <span class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate max-w-20 sm:max-w-none">{{
              displayName
            }}</span>
            <button class="btn btn-danger-ghost btn-sm" @click="handleLogout">Logout</button>
          </div>
        </div>
      </div>
    </nav>
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>
    <NotificationToast />
  </div>
</template>

<script setup lang="ts">
import {
  House as HouseIcon,
  ChevronDown as ChevronDownIcon,
  Settings as SettingsIcon,
  Plus as PlusIcon,
} from '@lucide/vue'

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
  navigateTo(`/projects/${id}/tasks?view=board`)
}

function goToProjectSettings(id: string) {
  showProjectDropdown.value = false
  navigateTo(`/projects/${id}?view=board`)
}

function goToCreateProject() {
  showProjectDropdown.value = false
  navigateTo('/projects/create')
}

const displayName = computed(() => profile.value?.username || profile.value?.email || '')

const handleLogout = async () => {
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>
