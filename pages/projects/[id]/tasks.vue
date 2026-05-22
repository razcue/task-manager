<template>
  <div>
    <div v-if="loading" class="text-gray-500 dark:text-gray-400">Loading...</div>

    <template v-else-if="project">
      <div class="mb-6">
        <NuxtLink
          :to="`/projects/${project.id}?view=${route.query.view || 'board'}`"
          class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
        >
          <ArrowLeftIcon :size="16" />
          <span>Back</span>
        </NuxtLink>
      </div>

      <TaskList
        :project-id="project.id"
        :members="members"
        :current-user-id="user?.id"
        :is-owner="isOwner"
        :project-archived="project.archived"
        :owner-id="project.owner_id"
        :owner-name="ownerName"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Project, ProjectMember } from '~/types'
import { ArrowLeft as ArrowLeftIcon } from '@lucide/vue'

definePageMeta({ layout: 'default' })

const route = useRoute()
const user = useSupabaseUser()

const { getProject, getProjectMembers, getProfile } = useSupabase()

const project = ref<Project | null>(null)
const members = ref<ProjectMember[]>([])
const ownerName = ref('')
const loading = ref(true)

const isOwner = computed(() => project.value?.owner_id === user.value?.id)

onMounted(async () => {
  const id = route.params.id as string
  const [p, mbrs] = await Promise.all([getProject(id), getProjectMembers(id)])
  if (!p) {
    await navigateTo('/dashboard')
    return
  }
  const profile = await getProfile(p.owner_id)
  ownerName.value = profile?.username || profile?.email || ''
  project.value = p
  members.value = mbrs
  loading.value = false
})
</script>
