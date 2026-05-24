<template>
  <div class="card p-3">
    <!-- Display mode -->
    <template v-if="!editing">
      <div>
        <div class="flex items-center min-h-[32px]">
          <button
            v-if="canEdit && !actionInProgress"
            class="px-2 py-1 text-sm font-medium text-gray-900 dark:text-white truncate text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors w-full"
            :aria-label="'Edit task: ' + task.name"
            @click="startEditing(task)"
          >
            {{ task.name }}
          </button>
          <p v-else class="px-2 py-1 text-sm font-medium text-gray-900 dark:text-white truncate">
            {{ task.name }}
          </p>
        </div>
        <div v-if="confirmingDelete" class="flex items-center gap-2 mt-2 min-h-[22px]">
          <span class="text-xs text-gray-500">Delete this task?</span>
          <button class="btn btn-danger btn-xs" @click.stop="handleDeleteConfirm">Delete</button>
          <button class="btn btn-secondary btn-xs" @click.stop="cancelDelete">Cancel</button>
        </div>
        <div v-else class="flex items-center gap-1 mt-2 min-h-[22px]">
          <div class="min-w-content">
            <span :class="['badge', priorityClass(task.priority)]">
              {{ task.priority }}
            </span>
          </div>
          <div class="min-w-content">
            <span :class="['badge', statusClass(task.status)]">
              {{ statusLabel(task.status) }}
            </span>
          </div>
          <div class="min-w-16 flex-1">
            <span class="block text-xs text-gray-500 truncate">
              {{ assigneeName }}<span v-if="isMine" class="text-blue-500"> (you)</span>
            </span>
          </div>
          <div class="shrink-0 w-[36px] flex items-center justify-center">
            <button
              v-if="canEdit"
              :disabled="actionInProgress"
              class="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-400 dark:disabled:hover:text-gray-400"
              aria-label="Delete task"
              @click.stop="confirmDelete"
            >
              <Trash2Icon :size="14" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Edit mode -->
    <template v-else>
      <div>
        <div v-if="isNewTask">
          <input
            ref="editNameInput"
            v-model="editForm.name"
            type="text"
            maxlength="200"
            aria-label="Task name"
            :class="['input text-xs mb-2', taskErrors.name ? 'input-error' : '']"
            :placeholder="taskErrors.name"
            @keyup.enter="handleSaveEdit"
            @keyup.escape="handleCancelEdit"
          />
        </div>
        <p v-else class="px-2 py-1 text-sm font-medium text-gray-900 dark:text-white truncate mb-2">
          {{ task.name }}
        </p>
        <div class="flex items-center gap-1 min-h-[22px]">
          <div class="min-w-20 flex-1">
            <StyledSelect
              v-model="editForm.priority"
              class="w-full"
              compact
              :options="priorityOptions"
              aria-label="Task priority"
            />
          </div>
          <div class="min-w-22 flex-1">
            <StyledSelect
              v-model="editForm.status"
              class="w-full"
              compact
              :options="statusOptions"
              aria-label="Task status"
            />
          </div>
          <div v-if="isNewTask && allAssignees" class="min-w-26 flex-1">
            <StyledSelect
              v-model="editForm.assignee_id"
              class="w-full"
              compact
              :options="assigneeOptions"
              aria-label="Task assignee"
            />
          </div>
          <div class="shrink-0 w-[36px] flex items-center justify-between">
            <button
              class="text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              aria-label="Save task"
              @click.stop="handleSaveEdit"
            >
              <CheckIcon :size="14" aria-hidden="true" />
            </button>
            <button
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Cancel"
              @click.stop="handleCancelEdit"
            >
              <XIcon :size="14" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Trash2 as Trash2Icon, Check as CheckIcon, X as XIcon } from '@lucide/vue'

const props = defineProps<{
  task: Task
  canEdit: boolean
  assigneeName: string
  isMine: boolean
  allAssignees?: { id: string; name: string }[]
  currentUserId?: string
  autoEditTaskId?: string | null
}>()

const { actionInProgress, setActionInProgress } = useActionState()
const { notify } = useNotification()

const emit = defineEmits<{
  update: [id: string, updates: Partial<Pick<Task, 'name' | 'status' | 'priority' | 'assignee_id'>>]
  delete: [id: string]
  create: [{ id: string; name: string; status: TaskStatus; priority: TaskPriority; assignee_id: string }]
  editingChange: [editing: boolean]
  savedNew: [id: string]
}>()

const {
  editing,
  confirmingDelete,
  editNameInput,
  editForm,
  taskErrors,
  startEditing,
  cancelEdit,
  buildUpdates,
  validateTask,
  confirmDelete,
  cancelDelete,
  statusLabel,
  priorityClass,
  statusClass,
} = useTaskItem()

const isNewTask = computed(() => props.autoEditTaskId === props.task.id)

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

const assigneeOptions = computed(() =>
  (props.allAssignees || []).map((a) => ({
    value: a.id,
    label: `${a.name}${a.id === props.currentUserId ? ' (you)' : ''}`,
  })),
)

watch(editing, (val) => {
  setActionInProgress(val)
  emit('editingChange', val)
})

watch(
  isNewTask,
  (val) => {
    if (val && props.canEdit) startEditing(props.task)
  },
  { immediate: true },
)

watch(confirmingDelete, (val) => {
  setActionInProgress(val)
})

onUnmounted(() => {
  setActionInProgress(false)
  emit('editingChange', false)
})

function handleDeleteConfirm() {
  setActionInProgress(false)
  emit('delete', props.task.id)
}

function handleSaveEdit() {
  if (isNewTask.value) {
    if (!validateTask(true)) {
      notify('Please fix the form errors', 'error')
      return
    }
    emit('create', {
      id: props.task.id,
      name: editForm.value.name.trim(),
      status: editForm.value.status,
      priority: editForm.value.priority,
      assignee_id: editForm.value.assignee_id,
    })
    emit('savedNew', props.task.id)
  } else {
    const updates = buildUpdates(props.task)
    if (Object.keys(updates).length > 0) {
      emit('update', props.task.id, updates)
    }
  }
  cancelEdit()
}

function handleCancelEdit() {
  cancelEdit()
  if (isNewTask.value) {
    emit('delete', props.task.id)
  }
}
</script>
