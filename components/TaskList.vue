<template>
  <div>
    <!-- View toggle and sort -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
        <button
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium transition-colors',
            viewMode === 'list'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
          ]"
          @click="viewMode = 'list'"
        >
          <ListIcon :size="16" />
          List
        </button>
        <button
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium transition-colors',
            viewMode === 'board'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
          ]"
          @click="viewMode = 'board'"
        >
          <Columns3Icon :size="16" />
          Board
        </button>
      </div>
      <div class="flex items-center gap-2">
        <select
          v-if="viewMode === 'list'"
          v-model="sortBy"
          :disabled="anyActionInProgress"
          class="text-sm bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1.5 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <option value="created_at">Created</option>
          <option value="priority">Priority</option>
          <option value="name">Name</option>
        </select>
        <button
          v-if="canCreate"
          :disabled="anyActionInProgress"
          class="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
          @click="handleAddTask"
        >
          <PlusIcon :size="16" />
          Add
        </button>
      </div>
    </div>

    <p v-if="loading" class="text-gray-500 dark:text-gray-400 text-sm">Loading tasks...</p>

    <!-- Board view -->
    <div v-else-if="viewMode === 'board'">
      <TaskBoard
        :tasks="tasks"
        :can-edit="!projectArchived"
        :is-owner="isOwner"
        :project-archived="projectArchived"
        :current-user-id="currentUserId"
        :assignee-names="assigneeNames"
        :all-assignees="allAssignees"
        :auto-edit-task-id="autoEditTaskId"
        @update="handleUpdate"
        @delete="handleDelete"
        @saved-new="handleSavedNew"
        @editing-change="handleEditingChange"
      />
    </div>

    <!-- List view -->
    <template v-else-if="sortedTasks.length > 0">
      <div class="space-y-1">
        <TaskItem
          v-for="task in sortedTasks"
          :key="task.id"
          :task="task"
          :can-edit="canEditTask(task)"
          :assignee-name="assigneeNames[task.assignee_id] || 'Unassigned'"
          :is-mine="task.assignee_id === currentUserId"
          :all-assignees="allAssignees"
          :current-user-id="currentUserId"
          :auto-edit-task-id="autoEditTaskId"
          @update="handleUpdate"
          @delete="handleDelete"
          @saved-new="handleSavedNew"
          @editing-change="handleEditingChange"
        />
      </div>
    </template>

    <p v-else class="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">No tasks yet</p>

    <p v-if="projectArchived && tasks.length > 0" class="mt-4 text-xs text-gray-500 dark:text-gray-400">
      This project is archived. Tasks are read-only.
    </p>
  </div>
</template>

<script setup lang="ts">
import type { Task, TaskPriority, ProjectMember } from '~/types'
import { List as ListIcon, Columns3 as Columns3Icon, Plus as PlusIcon } from '@lucide/vue'
import TaskItem from './ListTaskItem.vue'
import TaskBoard from './TaskBoard.vue'

const props = defineProps<{
  projectId: string
  members: ProjectMember[]
  currentUserId: string | undefined
  isOwner: boolean
  projectArchived: boolean
  ownerId?: string
  ownerName?: string
}>()

const emit = defineEmits<{
  'task-count': [count: number]
  'editing-change': [editing: boolean]
}>()

const { getTasks, createTask, updateTask, deleteTask } = useSupabase()
const route = useRoute()
const router = useRouter()

const tasks = ref<Task[]>([])
const loading = ref(true)
const viewMode = ref<'list' | 'board'>('board')
const sortBy = ref<'created_at' | 'priority' | 'name'>('created_at')
const autoEditTaskId = ref<string | null>(null)

watch(
  () => route.query.view,
  (view) => {
    if (view === 'list' || view === 'board') {
      viewMode.value = view
    }
  },
  { immediate: true },
)

watch(viewMode, (mode) => {
  if (route.query.view !== mode) {
    router.replace({ query: { ...route.query, view: mode } })
  }
})

const canCreate = computed(() => !props.projectArchived)

const allAssignees = computed(() => {
  const list: { id: string; name: string }[] = []
  if (props.ownerId && props.ownerName) {
    list.push({ id: props.ownerId, name: props.ownerName })
  }
  for (const m of props.members) {
    if (m.user) {
      list.push({ id: m.user_id, name: m.user.username || m.user.email })
    }
  }
  return list
})

const assigneeNames = computed(() => {
  const names: Record<string, string> = {}
  for (const a of allAssignees.value) {
    names[a.id] = a.name
  }
  return names
})

const canEditTask = (task: Task) => {
  if (props.projectArchived) return false
  if (props.isOwner) return true
  return task.assignee_id === props.currentUserId
}

const sortedTasks = computed(() => {
  const list = [...tasks.value]
  switch (sortBy.value) {
    case 'priority': {
      const order: Record<string, number> = { high: 0, medium: 1, low: 2 }
      list.sort((a, b) => order[a.priority] - order[b.priority])
      break
    }
    case 'name':
      list.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'created_at':
    default:
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      break
  }
  return list
})

const loadTasks = async () => {
  loading.value = true
  tasks.value = await getTasks(props.projectId)
  loading.value = false
  emit('task-count', tasks.value.length)
}

const { actionInProgress, setActionInProgress } = useActionState()

const anyActionInProgress = computed(() => taskEditing.value || actionInProgress.value)

const taskEditing = ref(false)

function handleEditingChange(editing: boolean) {
  taskEditing.value = editing
  emit('editing-change', editing)
}

onMounted(loadTasks)

async function handleAddTask() {
  if (!props.currentUserId) return
  setActionInProgress(true)
  const created = await createTask(
    { name: 'New task', priority: 'medium' as TaskPriority, assignee_id: props.currentUserId },
    props.projectId,
  )
  if (created) {
    tasks.value.unshift(created)
    autoEditTaskId.value = created.id
  } else {
    setActionInProgress(false)
  }
}

const handleUpdate = async (
  id: string,
  updates: Partial<Pick<Task, 'name' | 'status' | 'priority' | 'assignee_id'>>,
) => {
  const updated = await updateTask(id, updates)
  if (updated) {
    if (autoEditTaskId.value === id) {
      autoEditTaskId.value = null
    }
    const idx = tasks.value.findIndex((t) => t.id === id)
    if (idx !== -1) tasks.value[idx] = updated
  }
}

function handleSavedNew(id: string) {
  if (autoEditTaskId.value === id) {
    autoEditTaskId.value = null
  }
}

const handleDelete = async (id: string) => {
  await deleteTask(id)
  tasks.value = tasks.value.filter((t) => t.id !== id)
  emit('task-count', tasks.value.length)
}

defineExpose({ loadTasks })
</script>
