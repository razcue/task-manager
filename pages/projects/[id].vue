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
              class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              @click="startEditing"
            >
              Edit
            </button>
            <button
              class="px-3 py-1.5 text-sm border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950"
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
            class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            @click="managingMembers = true"
          >
            Manage
          </button>
          <button
            v-if="isOwner && managingMembers"
            class="text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400"
            @click="managingMembers = false"
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
            <button
              v-if="managingMembers && isOwner && m.user_id !== project.owner_id"
              class="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
              @click="handleRemoveMember(m.user_id)"
            >
              Remove
            </button>
          </li>
        </ul>

        <form v-if="managingMembers && isOwner" class="flex gap-2 mt-4" @submit.prevent="handleAddMember">
          <input
            v-model="newMemberIdentifier"
            type="text"
            required
            placeholder="Enter username or email"
            class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
          />
          <button
            type="submit"
            :disabled="addLoading"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg disabled:opacity-50"
          >
            {{ addLoading ? 'Adding...' : 'Add' }}
          </button>
        </form>
        <p v-if="addError" class="text-sm text-red-600 dark:text-red-400 mt-2">{{ addError }}</p>
      </div>

      <!-- Tasks placeholder -->
      <div class="border-t border-gray-200 dark:border-gray-800 pt-6 mt-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Tasks</h2>
        <p class="mt-2 text-sm text-gray-400 dark:text-gray-500">Tasks will be implemented next.</p>
      </div>

      <NuxtLink to="/dashboard" class="inline-block mt-6 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
        ← Back to projects
      </NuxtLink>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Project, ProjectMember } from '~/types'

const route = useRoute()
const router = useRouter()
const user = useSupabaseUser()
const supabase = useSupabaseClient()

const {
  getProject,
  getProjectMembers,
  updateProject,
  deleteProject,
  getProfile,
  addProjectMember,
  removeProjectMember,
} = useSupabase()

const project = ref<Project | null>(null)
const members = ref<ProjectMember[]>([])
const ownerName = ref('')
const loading = ref(true)

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
}

const cancelEditing = () => {
  editing.value = false
  editError.value = ''
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
    editSuccess.value = true
    setTimeout(() => {
      editSuccess.value = false
    }, 2000)
  } else {
    editError.value = 'Failed to update project'
  }
}

// Delete state
const confirmDelete = ref(false)

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

  await addProjectMember(p.id, profile.id)
  members.value = await getProjectMembers(route.params.id as string)
  newMemberIdentifier.value = ''
  addLoading.value = false
}

const handleRemoveMember = async (userId: string) => {
  await removeProjectMember(route.params.id as string, userId)
  members.value = await getProjectMembers(route.params.id as string)
}
</script>
