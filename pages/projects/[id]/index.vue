<template>
  <div>
    <div v-if="loading" class="text-gray-500 dark:text-gray-400">Loading...</div>

    <template v-else-if="project">
      <!-- Project info -->
      <div class="flex items-start justify-between mb-8">
        <div class="flex-1 min-w-0">
          <template v-if="!editing">
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white truncate">{{ project.name }}</h1>
              <span
                v-if="project.archived"
                class="shrink-0 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full"
              >
                Archived
              </span>
            </div>
            <p class="mt-1 text-gray-500 dark:text-gray-400">{{ project.description || 'No description' }}</p>
          </template>
          <template v-else>
            <div class="space-y-3 max-w-lg">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  v-model="editForm.name"
                  type="text"
                  required
                  maxlength="100"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  v-model="editForm.description"
                  rows="3"
                  maxlength="500"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model="editForm.archived"
                  type="checkbox"
                  class="rounded border-gray-300 dark:border-gray-700"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Archived</span>
              </label>
              <p v-if="editError" class="text-sm text-red-600 dark:text-red-400">{{ editError }}</p>
            </div>
          </template>
          <p class="mt-2 text-xs text-gray-400 dark:text-gray-500">Owner: {{ ownerName }}</p>
        </div>

        <div class="flex flex-col items-end gap-1 shrink-0 ml-4">
          <!-- View mode buttons -->
          <div v-if="isOwner && !editing && !confirmDelete" class="flex gap-2">
            <button
              :disabled="actionInProgress"
              class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
              @click="startEditing"
            >
              Edit
            </button>
            <button
              :disabled="actionInProgress"
              class="px-3 py-1.5 text-sm border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-40 disabled:cursor-not-allowed"
              @click="confirmDelete = true"
            >
              Delete
            </button>
          </div>
          <!-- Edit mode buttons -->
          <div v-if="isOwner && editing" class="flex gap-2">
            <button
              :disabled="saving || !editForm.name.trim()"
              class="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              @click="handleEditSubmit"
            >
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
            <button
              class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
              @click="cancelEditing"
            >
              Cancel
            </button>
          </div>
          <!-- Delete confirm buttons -->
          <div v-if="isOwner && confirmDelete" class="flex gap-2">
            <button class="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg" @click="handleDelete">
              Delete
            </button>
            <button
              class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
              @click="confirmDelete = false"
            >
              Cancel
            </button>
          </div>
          <span v-if="confirmDelete" class="text-xs text-gray-500 dark:text-gray-400">Are you sure?</span>
          <span v-if="editSuccess" class="text-xs text-green-600 dark:text-green-400">Saved</span>
        </div>
      </div>

      <!-- Members -->
      <div class="border-t border-gray-200 dark:border-gray-800 pt-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Members ({{ members.length }})</h2>
          <button
            v-if="isOwner && !managingMembers"
            :disabled="actionInProgress"
            class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 disabled:opacity-40 disabled:cursor-not-allowed"
            @click="managingMembers = true"
          >
            Manage
          </button>
          <button
            v-if="isOwner && managingMembers"
            class="text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400"
            @click="closeManage"
          >
            Close
          </button>
        </div>

        <ul class="space-y-2">
          <li
            v-for="m in members"
            :key="m.id"
            class="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-900 dark:text-white">{{ m.user?.username || m.user?.email }}</span>
              <span v-if="m.user_id === project.owner_id" class="text-xs text-gray-400">(owner)</span>
              <span v-else-if="m.user_id === user?.id" class="text-xs text-blue-500">(you)</span>
            </div>
            <template v-if="managingMembers && isOwner && m.user_id !== project.owner_id">
              <template v-if="confirmingRemove === m.user_id">
                <button
                  class="px-2 py-0.5 text-xs rounded bg-red-600 hover:bg-red-700 text-white font-medium"
                  @click="handleRemoveMember(m.user_id)"
                >
                  Remove
                </button>
                <button
                  class="px-2 py-0.5 text-xs rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium"
                  @click="confirmingRemove = null"
                >
                  Cancel
                </button>
              </template>
              <button
                v-else
                class="text-xs text-red-600 hover:text-red-700 dark:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="actionInProgress"
                @click="confirmingRemove = m.user_id"
              >
                Remove
              </button>
            </template>
          </li>
        </ul>

        <form v-if="managingMembers && isOwner" class="flex gap-2 mt-4" @submit.prevent="handleAddMember">
          <input
            v-model="newMemberIdentifier"
            type="text"
            required
            placeholder="Enter username or email"
            :disabled="actionInProgress"
            class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            :disabled="actionInProgress || addLoading"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg disabled:opacity-50"
          >
            {{ addLoading ? 'Adding...' : 'Add' }}
          </button>
        </form>
        <p v-if="addError" class="text-sm text-red-600 dark:text-red-400 mt-2">{{ addError }}</p>
      </div>

      <!-- Tasks section -->
      <div class="border-t border-gray-200 dark:border-gray-800 pt-6 mt-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Tasks ({{ taskCount }})</h2>
          <NuxtLink
            :to="`/projects/${project.id}/tasks?view=board`"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <ExternalLinkIcon :size="18" />
          </NuxtLink>
        </div>
        <TaskList
          ref="taskListRef"
          :project-id="project.id"
          :members="members"
          :current-user-id="user?.id"
          :is-owner="isOwner"
          :project-archived="project.archived"
          :owner-id="project.owner_id"
          :owner-name="ownerName"
          @task-count="taskCount = $event"
          @editing-change="taskEditing = $event"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Project, ProjectMember } from '~/types'
import { ExternalLink as ExternalLinkIcon } from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const user = useSupabaseUser()
const supabase = useSupabaseClient()

const { actionInProgress, setActionInProgress } = useActionState()

const {
  getProject,
  getProjectMembers,
  updateProject,
  deleteProject,
  getProfile,
  addProjectMember,
  removeProjectMember,
  isEmailConfirmed,
} = useSupabase()

const project = ref<Project | null>(null)
const members = ref<ProjectMember[]>([])
const ownerName = ref('')
const loading = ref(true)
const taskCount = ref(0)
const taskEditing = ref(false)

const isOwner = computed(() => project.value?.owner_id === user.value?.id)

// Edit state
const editing = ref(false)
const saving = ref(false)
const editError = ref('')
const editSuccess = ref(false)
const editForm = ref({ name: '', description: '', archived: false })

const startEditing = () => {
  if (!project.value) return
  editForm.value = {
    name: project.value.name,
    description: project.value.description || '',
    archived: project.value.archived,
  }
  editError.value = ''
  editSuccess.value = false
  editing.value = true
  setActionInProgress(true)
}

const cancelEditing = () => {
  editing.value = false
  editError.value = ''
  setActionInProgress(false)
}

const handleEditSubmit = async () => {
  if (!project.value) return
  editError.value = ''
  editSuccess.value = false
  saving.value = true
  const updated = await updateProject(project.value.id, {
    name: editForm.value.name,
    description: editForm.value.description,
    archived: editForm.value.archived,
  })
  saving.value = false
  if (updated) {
    project.value = updated
    editing.value = false
    setActionInProgress(false)
    editSuccess.value = true
    setTimeout(() => {
      editSuccess.value = false
    }, 2000)
  } else {
    setActionInProgress(false)
    editError.value = 'Failed to update project'
  }
}

// Delete state
const confirmDelete = ref(false)

watch(confirmDelete, (val) => {
  setActionInProgress(val)
})

const handleDelete = async () => {
  if (!project.value) return
  await deleteProject(project.value.id)
  await router.push('/dashboard')
}

// Members manage state
const managingMembers = ref(false)
const newMemberIdentifier = ref('')
const addLoading = ref(false)
const addError = ref('')
const confirmingRemove = ref<string | null>(null)

watch(confirmingRemove, (val) => {
  setActionInProgress(val !== null)
})

watch(addLoading, (val) => {
  setActionInProgress(val)
})

onMounted(async () => {
  const id = route.params.id as string
  const p = await getProject(id)
  if (!p) {
    await router.push('/dashboard')
    return
  }
  project.value = p

  const [mbrs, profile] = await Promise.all([getProjectMembers(id), getProfile(p.owner_id)])
  members.value = mbrs
  ownerName.value = profile?.username || profile?.email || 'Unknown'
  loading.value = false
})

const handleAddMember = async () => {
  addError.value = ''
  addLoading.value = true

  const p = project.value
  if (!p) {
    addError.value = 'Project not loaded'
    addLoading.value = false
    return
  }

  const profile = (
    await supabase
      .from('profiles')
      .select('id, email, username')
      .or(`email.eq.${newMemberIdentifier.value},username.eq.${newMemberIdentifier.value}`)
      .maybeSingle()
  ).data as { id: string; email: string; username: string } | null

  if (!profile) {
    addError.value = 'User not found'
    addLoading.value = false
    return
  }

  if (profile.id === p.owner_id) {
    addError.value = 'User is the project owner'
    addLoading.value = false
    return
  }

  if (members.value.some((m) => m.user_id === profile.id)) {
    addError.value = 'User is already a member'
    addLoading.value = false
    return
  }

  if (!(await isEmailConfirmed(profile.id))) {
    addError.value = 'User has not verified their email'
    addLoading.value = false
    return
  }

  await addProjectMember(p.id, profile.id)
  members.value = await getProjectMembers(route.params.id as string)
  newMemberIdentifier.value = ''
  addLoading.value = false
}

const taskListRef = ref<{ loadTasks: () => Promise<void> } | null>(null)

const handleRemoveMember = async (userId: string) => {
  await removeProjectMember(route.params.id as string, userId)
  members.value = await getProjectMembers(route.params.id as string)
  confirmingRemove.value = null
  await taskListRef.value?.loadTasks()
}

function closeManage() {
  managingMembers.value = false
  confirmingRemove.value = null
  addError.value = ''
}
</script>
