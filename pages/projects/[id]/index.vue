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
                <label for="editName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Name <span class="text-red-500">*</span></label
                >
                <input
                  id="editName"
                  v-model="editForm.name"
                  type="text"
                  maxlength="100"
                  :class="[
                    'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2',
                    editErrorField('name')
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500',
                  ]"
                />
                <p v-if="editErrorField('name')" class="mt-1 text-sm text-red-600 dark:text-red-400">
                  {{ editErrorField('name') }}
                </p>
              </div>
              <div>
                <label for="editDescription" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Description</label
                >
                <textarea
                  id="editDescription"
                  v-model="editForm.description"
                  rows="3"
                  maxlength="500"
                  :class="[
                    'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2',
                    editErrorField('description')
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500',
                  ]"
                />
                <p v-if="editErrorField('description')" class="mt-1 text-sm text-red-600 dark:text-red-400">
                  {{ editErrorField('description') }}
                </p>
              </div>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  id="editArchived"
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
              :disabled="saving"
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

        <ul v-if="members.length > 0" class="space-y-2">
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
        <p v-else class="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">No members yet</p>

        <form v-if="managingMembers && isOwner" novalidate class="flex gap-2 mt-4" @submit.prevent="handleAddMember">
          <div class="flex-1">
            <input
              v-model="newMemberIdentifier"
              type="text"
              placeholder="Enter username or email"
              aria-label="Add member by username or email"
              :disabled="actionInProgress"
              :class="[
                'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed focus:ring-2',
                memberError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500',
              ]"
            />
            <p v-if="memberError" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ memberError }}</p>
          </div>
          <button
            type="submit"
            :disabled="actionInProgress || addLoading"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg disabled:opacity-50"
          >
            {{ addLoading ? 'Adding...' : 'Add' }}
          </button>
        </form>
      </div>

      <!-- Tasks section -->
      <div class="border-t border-gray-200 dark:border-gray-800 pt-6 mt-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Tasks ({{ taskCount }})</h2>
          <NuxtLink
            :to="`/projects/${project.id}/tasks?view=board`"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="View all tasks"
          >
            <ExternalLinkIcon :size="18" aria-hidden="true" />
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
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ExternalLink as ExternalLinkIcon } from '@lucide/vue'

definePageMeta({ title: 'Project' })

const route = useRoute()
const user = useSupabaseUser()

const { actionInProgress, setActionInProgress } = useActionState()
const { notify } = useNotification()

const {
  getProject,
  getProjectMembers,
  updateProject,
  deleteProject,
  getProfile,
  addProjectMember,
  removeProjectMember,
  isEmailConfirmed,
  findProfileByIdentifier,
} = useSupabase()

const project = ref<Project | null>(null)
const members = ref<ProjectMember[]>([])
const ownerName = ref('')
const loading = ref(true)
const taskCount = ref(0)

const isOwner = computed(() => project.value?.owner_id === user.value?.id)

// Edit state
const editing = ref(false)
const saving = ref(false)
const editError = ref('')
const editSuccess = ref(false)
const editForm = ref({ name: '', description: '', archived: false })

const {
  validate: validateEdit,
  getError: editErrorField,
  clearErrors: clearEditErrors,
} = useValidation(editForm, {
  name: [
    { rule: 'required', message: 'Project name is required' },
    { rule: 'maxLength', value: 100, message: 'Project name must be 100 characters or less' },
  ],
  description: [{ rule: 'maxLength', value: 500, message: 'Description must be 500 characters or less' }],
})

const startEditing = () => {
  if (!project.value) return
  editForm.value = {
    name: project.value.name,
    description: project.value.description || '',
    archived: project.value.archived,
  }
  editError.value = ''
  editSuccess.value = false
  clearEditErrors()
  editing.value = true
  setActionInProgress(true)
}

const cancelEditing = () => {
  editing.value = false
  editError.value = ''
  clearEditErrors()
  setActionInProgress(false)
}

const handleEditSubmit = async () => {
  if (!project.value) return
  editError.value = ''
  editSuccess.value = false
  if (!validateEdit()) {
    notify('Please fix the form errors', 'error')
    return
  }
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
    notify('Project updated successfully')
  } else {
    setActionInProgress(false)
    editError.value = 'Failed to update project'
    notify('Failed to update project', 'error')
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
  notify('Project deleted successfully')
  await navigateTo('/dashboard')
}

// Members manage state
const managingMembers = ref(false)
const newMemberIdentifier = ref('')
const addLoading = ref(false)
const confirmingRemove = ref<string | null>(null)
const memberError = ref('')

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
    await navigateTo('/dashboard')
    return
  }
  project.value = p

  const [mbrs, profile] = await Promise.all([getProjectMembers(id), getProfile(p.owner_id)])
  members.value = mbrs
  ownerName.value = profile?.username || profile?.email || 'Unknown'
  loading.value = false
})

const handleAddMember = async () => {
  memberError.value = ''
  if (!newMemberIdentifier.value.trim()) {
    memberError.value = 'Enter a username or email'
    notify('Please enter a username or email', 'error')
    return
  }

  addLoading.value = true

  const p = project.value
  if (!p) {
    addLoading.value = false
    return
  }

  const profile = await findProfileByIdentifier(newMemberIdentifier.value)

  if (!profile) {
    notify('User not found', 'error')
    addLoading.value = false
    return
  }

  if (profile.id === p.owner_id) {
    notify('User is the project owner', 'error')
    addLoading.value = false
    return
  }

  if (members.value.some((m) => m.user_id === profile.id)) {
    notify('User is already a member', 'error')
    addLoading.value = false
    return
  }

  if (!(await isEmailConfirmed(profile.id))) {
    notify('User has not verified their email', 'error')
    addLoading.value = false
    return
  }

  await addProjectMember(p.id, profile.id)
  members.value = await getProjectMembers(route.params.id as string)
  newMemberIdentifier.value = ''
  addLoading.value = false
  notify('Member added successfully')
}

const taskListRef = ref<{ loadTasks: () => Promise<void> } | null>(null)

const handleRemoveMember = async (userId: string) => {
  await removeProjectMember(route.params.id as string, userId)
  members.value = await getProjectMembers(route.params.id as string)
  confirmingRemove.value = null
  await taskListRef.value?.loadTasks()
  notify('Member removed successfully')
}

function closeManage() {
  managingMembers.value = false
  confirmingRemove.value = null
  memberError.value = ''
}
</script>
