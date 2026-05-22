<template>
  <div
    class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 flex items-center gap-3"
  >
    <!-- Display mode -->
    <template v-if="!editing">
      <div class="flex-1 flex items-center gap-1 min-w-0">
        <span class="px-2 py-1 text-sm font-medium text-gray-900 dark:text-white truncate flex-1 min-w-0">
          {{ task.name }}
        </span>
        <template v-if="confirmingDelete">
          <span class="text-xs text-gray-500">Delete this task?</span>
          <button
            class="px-2 py-0.5 text-xs rounded bg-red-600 hover:bg-red-700 text-white font-medium"
            @click="handleDeleteConfirm"
          >
            Delete
          </button>
          <button
            class="px-2 py-0.5 text-xs rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium"
            @click="cancelDelete"
          >
            Cancel
          </button>
        </template>
        <template v-else>
          <div class="w-[68px] shrink-0">
            <span
              :class="[
                'block w-full text-center px-1.5 py-0.5 text-xs rounded-full font-medium',
                priorityClass(task.priority),
              ]"
            >
              {{ task.priority }}
            </span>
          </div>
          <div class="w-[90px] shrink-0">
            <span
              :class="[
                'block w-full text-center px-1.5 py-0.5 text-xs rounded-full font-medium',
                statusClass(task.status),
              ]"
            >
              {{ statusLabel(task.status) }}
            </span>
          </div>
          <div class="w-20 shrink-0">
            <span class="block text-xs text-gray-400 truncate text-center">
              {{ assigneeName }}<span v-if="isMine" class="text-blue-500"> (you)</span>
            </span>
          </div>
          <div class="shrink-0 w-[36px] flex items-center justify-between">
            <button
              v-if="canEdit"
              :disabled="actionInProgress"
              class="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-400 dark:disabled:hover:text-gray-400"
              @click="startEditing(task)"
            >
              <PencilIcon :size="14" />
            </button>
            <button
              v-if="canEdit"
              :disabled="actionInProgress"
              class="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-400 dark:disabled:hover:text-gray-400"
              @click="confirmDelete"
            >
              <Trash2Icon :size="14" />
            </button>
          </div>
        </template>
      </div>
    </template>

    <!-- Edit mode -->
    <template v-else>
      <div class="flex-1 flex items-center gap-1 min-w-0">
        <input
          v-if="isNewTask"
          ref="editNameInput"
          v-model="editForm.name"
          type="text"
          maxlength="200"
          class="px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex-1 min-w-0"
          @keyup.enter="handleSaveEdit"
          @keyup.escape="handleCancelEdit"
        />
        <span v-else class="px-2 py-1 text-sm font-medium text-gray-900 dark:text-white truncate flex-1 min-w-0">
          {{ task.name }}
        </span>
        <div class="w-[68px] shrink-0">
          <select
            v-model="editForm.priority"
            class="w-full text-xs bg-transparent border border-gray-300 dark:border-gray-700 rounded px-1 py-0.5 text-center text-gray-700 dark:text-gray-300"
            @change="handleEmitUpdate"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div class="w-[90px] shrink-0">
          <select
            v-model="editForm.status"
            class="w-full text-xs bg-transparent border border-gray-300 dark:border-gray-700 rounded px-1 py-0.5 text-center text-gray-700 dark:text-gray-300"
            @change="handleEmitUpdate"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div v-if="isNewTask && allAssignees" class="w-20 shrink-0">
          <select
            v-model="editForm.assignee_id"
            class="w-full text-xs bg-transparent border border-gray-300 dark:border-gray-700 rounded px-1 py-0.5 text-center text-gray-700 dark:text-gray-300"
            @change="handleEmitUpdate"
          >
            <option v-for="a in allAssignees" :key="a.id" :value="a.id">
              {{ a.name }}{{ a.id === currentUserId ? ' (you)' : '' }}
            </option>
          </select>
        </div>
      </div>
      <div class="shrink-0 w-[36px] flex items-center justify-between">
        <button
          class="text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
          @click="handleSaveEdit"
        >
          <CheckIcon :size="14" />
        </button>
        <button
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          @click="handleCancelEdit"
        >
          <XIcon :size="14" />
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '~/types'
import { Pencil as PencilIcon, Trash2 as Trash2Icon, Check as CheckIcon, X as XIcon } from '@lucide/vue'
import { useTaskItem } from '~/composables/useTaskItem'

const props = defineProps<{
  task: Task
  canEdit: boolean
  assigneeName: string
  isMine: boolean
  allAssignees?: { id: string; name: string }[]
  currentUserId?: string
  autoEditTaskId?: string | null
}>()

const emit = defineEmits<{
  update: [id: string, updates: Partial<Pick<Task, 'name' | 'status' | 'priority' | 'assignee_id'>>]
  delete: [id: string]
  'saved-new': [id: string]
  'editing-change': [editing: boolean]
}>()

const {
  editing,
  confirmingDelete,
  editForm,
  startEditing,
  cancelEdit,
  buildUpdates,
  confirmDelete,
  cancelDelete,
  statusLabel,
  priorityClass,
  statusClass,
} = useTaskItem()

const { actionInProgress, setActionInProgress } = useActionState()

const isNewTask = computed(() => props.autoEditTaskId === props.task.id)

watch(editing, (val) => {
  setActionInProgress(val)
  emit('editing-change', val)
})

watch(confirmingDelete, (val) => {
  setActionInProgress(val)
})

onUnmounted(() => {
  if (editing.value) {
    setActionInProgress(false)
    emit('editing-change', false)
  }
  if (confirmingDelete.value) {
    setActionInProgress(false)
  }
})

watch(
  isNewTask,
  (val) => {
    if (val && props.canEdit) startEditing(props.task)
  },
  { immediate: true },
)

function handleDeleteConfirm() {
  setActionInProgress(false)
  emit('delete', props.task.id)
}

function handleSaveEdit() {
  const updates = buildUpdates(props.task)
  if (Object.keys(updates).length > 0) {
    emit('update', props.task.id, updates)
  }
  if (isNewTask.value) {
    emit('saved-new', props.task.id)
  }
  cancelEdit()
}

function handleCancelEdit() {
  cancelEdit()
  if (isNewTask.value) {
    emit('delete', props.task.id)
  }
}

function handleEmitUpdate() {
  if (isNewTask.value) return
  const updates = buildUpdates(props.task)
  if (Object.keys(updates).length > 0) {
    emit('update', props.task.id, updates)
  }
}
</script>
