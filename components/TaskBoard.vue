<template>
  <div class="grid grid-cols-3 gap-4">
    <div v-for="col in columns" :key="col.value" class="space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">{{ col.label }}</h3>
        <span class="text-xs text-gray-400">{{ col.tasks.length }}</span>
      </div>
      <div
        class="min-h-[200px] space-y-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-800"
      >
        <draggable
          :list="col.tasks"
          :group="{
            name: 'tasks',
            pull: canEdit && !boardEditing && !actionInProgress,
            put: canEdit && !boardEditing && !actionInProgress,
          }"
          :item-key="itemKey"
          :disabled="boardEditing || actionInProgress"
          :class="{ 'cursor-default': boardEditing || actionInProgress }"
          class="space-y-2 min-h-[40px]"
          ghost-class="opacity-50"
          @change="onChange(col.value, $event)"
        >
          <template #item="{ element: task }: { element: Task }">
            <BoardTaskCard
              :task="task"
              :can-edit="(props.isOwner || task.assignee_id === props.currentUserId) && !props.projectArchived"
              :assignee-name="assigneeNames[task.assignee_id] || 'Unassigned'"
              :is-mine="task.assignee_id === currentUserId"
              :all-assignees="allAssignees"
              :current-user-id="currentUserId"
              :auto-edit-task-id="autoEditTaskId"
              @update="handleItemUpdate"
              @delete="(id) => $emit('delete', id)"
              @editing-change="handleEditingChange"
              @saved-new="(id) => $emit('saved-new', id)"
            />
          </template>
        </draggable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '~/types'
import draggable from 'vuedraggable'
import BoardTaskCard from './BoardTaskCard.vue'
import { useActionState } from '~/composables/useActionState'

const props = defineProps<{
  tasks: Task[]
  canEdit: boolean
  isOwner: boolean
  projectArchived: boolean
  assigneeNames: Record<string, string>
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

const { updateTask } = useSupabase()

const boardEditing = ref(false)
const { actionInProgress } = useActionState()

const handleEditingChange = (editing: boolean) => {
  boardEditing.value = editing
  emit('editing-change', editing)
}

const columns = computed(() => [
  {
    value: 'pending' as const,
    label: 'Pending',
    tasks: props.tasks.filter((t) => t.status === 'pending'),
  },
  {
    value: 'in_progress' as const,
    label: 'In Progress',
    tasks: props.tasks.filter((t) => t.status === 'in_progress'),
  },
  {
    value: 'completed' as const,
    label: 'Completed',
    tasks: props.tasks.filter((t) => t.status === 'completed'),
  },
])

const itemKey = (t: Task) => t.id

const onChange = (newStatus: string, event: { added?: { element: Task } }) => {
  if (event.added) {
    const task = event.added.element
    if (task.status !== newStatus) {
      updateTask(task.id, { status: newStatus as Task['status'] })
      emit('update', task.id, { status: newStatus as Task['status'] })
    }
  }
}

const handleItemUpdate = async (
  id: string,
  updates: Partial<Pick<Task, 'name' | 'status' | 'priority' | 'assignee_id'>>,
) => {
  emit('update', id, updates)
}
</script>
