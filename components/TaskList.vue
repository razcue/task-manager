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
          :aria-pressed="viewMode === 'list'"
          aria-label="List view"
          @click="viewMode = 'list'"
        >
          <ListIcon :size="16" aria-hidden="true" />
          List
        </button>
        <button
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium transition-colors',
            viewMode === 'board'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
          ]"
          :aria-pressed="viewMode === 'board'"
          aria-label="Board view"
          @click="viewMode = 'board'"
        >
          <Columns3Icon :size="16" aria-hidden="true" />
          Board
        </button>
      </div>
      <div class="flex sm:hidden items-center gap-2">
        <StyledSelect
          v-if="viewMode === 'list'"
          v-model="sortBy"
          compact
          :disabled="anyActionInProgress"
          :options="sortOptions"
          aria-label="Sort tasks"
        />
        <button
          v-if="canCreate"
          :disabled="anyActionInProgress"
          class="btn btn-primary py-1 px-2 text-xs"
          aria-label="Add task"
          @click="handleAddTask"
        >
          <PlusIcon :size="16" class="-translate-y-px" aria-hidden="true" />
          {{ viewMode === 'list' ? '' : 'Add' }}
        </button>
      </div>
      <div class="hidden sm:flex items-center gap-2">
        <StyledSelect
          v-if="viewMode === 'list'"
          v-model="sortBy"
          :disabled="anyActionInProgress"
          :options="sortOptions"
          aria-label="Sort tasks"
        />
        <button
          v-if="canCreate"
          :disabled="anyActionInProgress"
          class="btn btn-primary"
          aria-label="Add task"
          @click="handleAddTask"
        >
          <PlusIcon :size="16" class="-translate-y-px" aria-hidden="true" />
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
        @create="handleCreate"
        @saved-new="handleSavedNew"
        @editing-change="handleEditingChange"
      />
    </div>

    <!-- List view -->
    <template v-else-if="sortedTasks.length > 0">
      <div class="space-y-1">
        <ListTaskItem
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
          @create="handleCreate"
          @saved-new="handleSavedNew"
          @editing-change="handleEditingChange"
        />
      </div>
    </template>

    <p v-else class="text-sm text-gray-500 dark:text-gray-500 py-8 text-center">No tasks yet</p>

    <p v-if="projectArchived && tasks.length > 0" class="mt-4 text-xs text-gray-500 dark:text-gray-400">
      This project is archived. Tasks are read-only.
    </p>
  </div>
</template>

<script setup lang="ts">
import { List as ListIcon, Columns3 as Columns3Icon, Plus as PlusIcon } from '@lucide/vue'

const props = defineProps<{
  projectId: string
  members: ProjectMember[]
  currentUserId?: string
  isOwner: boolean
  projectArchived: boolean
  ownerId?: string
  ownerName?: string
}>()

const emit = defineEmits<{
  taskCount: [count: number]
  editingChange: [editing: boolean]
}>()

const { getTasks, createTask, updateTask, deleteTask } = useSupabase()
const { notify } = useNotification()
const route = useRoute()
const router = useRouter()

const tasks = ref<Task[]>([])
const loading = ref(true)
const viewMode = ref<'list' | 'board'>('board')
const sortBy = ref<'created_at' | 'priority' | 'name'>('created_at')
const sortOptions = [
  { value: 'created_at', label: 'Created' },
  { value: 'priority', label: 'Priority' },
  { value: 'name', label: 'Name' },
]
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
  emit('taskCount', tasks.value.length)
}

const { actionInProgress } = useActionState()

const anyActionInProgress = computed(() => taskEditing.value || actionInProgress.value)

const taskEditing = ref(false)

function handleEditingChange(editing: boolean) {
  taskEditing.value = editing
  emit('editingChange', editing)
}

onMounted(loadTasks)

function handleAddTask() {
  if (!props.currentUserId) return
  const tempTask: Task = {
    id: 'new-' + Date.now(),
    name: 'New task',
    status: 'pending',
    priority: 'medium',
    project_id: props.projectId,
    assignee_id: props.currentUserId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  tasks.value.unshift(tempTask)
  autoEditTaskId.value = tempTask.id
}

const handleCreate = async (data: {
  id: string
  name: string
  status: TaskStatus
  priority: TaskPriority
  assignee_id: string
}) => {
  const created = await createTask(
    { name: data.name, status: data.status, priority: data.priority, assignee_id: data.assignee_id },
    props.projectId,
  )
  if (created) {
    const idx = tasks.value.findIndex((t) => t.id === data.id)
    if (idx !== -1) {
      tasks.value[idx] = created
    }
    autoEditTaskId.value = null
    emit('taskCount', tasks.value.length)
    notify('Task created successfully')
  } else {
    tasks.value = tasks.value.filter((t) => t.id !== data.id)
    notify('Failed to create task', 'error')
  }
}

const handleUpdate = async (
  id: string,
  updates: Partial<Pick<Task, 'name' | 'status' | 'priority' | 'assignee_id'>>,
) => {
  if (id.startsWith('new-')) return
  const updated = await updateTask(id, updates)
  if (updated) {
    if (autoEditTaskId.value === id) {
      autoEditTaskId.value = null
    }
    const idx = tasks.value.findIndex((t) => t.id === id)
    if (idx !== -1) tasks.value[idx] = updated
    notify('Task updated successfully')
  } else {
    notify('Failed to update task', 'error')
  }
}

function handleSavedNew(id: string) {
  if (autoEditTaskId.value === id) {
    autoEditTaskId.value = null
  }
}

const handleDelete = async (id: string) => {
  if (id.startsWith('new-')) {
    tasks.value = tasks.value.filter((t) => t.id !== id)
    if (autoEditTaskId.value === id) {
      autoEditTaskId.value = null
    }
    return
  }
  await deleteTask(id)
  tasks.value = tasks.value.filter((t) => t.id !== id)
  emit('taskCount', tasks.value.length)
  notify('Task deleted successfully')
}

defineExpose({ loadTasks })
</script>
