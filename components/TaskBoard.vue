<template>
  <div class="flex gap-4 overflow-x-auto snap-x snap-mandatory lg:grid lg:grid-cols-3 pb-2">
    <div v-for="col in columns" :key="col.value" class="min-w-[280px] lg:min-w-0 space-y-3">
      <div class="flex items-center justify-start gap-4">
        <h2 class="text-sm font-semibold text-gray-900 dark:text-white">{{ col.label }}</h2>
        <span class="text-xs text-gray-400">{{ col.tasks.length }}</span>
      </div>
      <div
        class="min-h-[200px] space-y-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-800"
      >
        <draggable
          :list="col.tasks"
          :group="{
            name: 'tasks',
            pull: canEdit && !anyLock,
            put: canEdit && !anyLock,
          }"
          :item-key="itemKey"
          :disabled="anyLock"
          :class="{ 'cursor-default': anyLock }"
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
              @create="(data) => $emit('create', data)"
              @editing-change="handleEditingChange"
              @saved-new="(id) => $emit('savedNew', id)"
            />
          </template>
        </draggable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'

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
  create: [{ id: string; name: string; status: TaskStatus; priority: TaskPriority; assignee_id: string }]
  savedNew: [id: string]
  editingChange: [editing: boolean]
}>()

const boardEditing = ref(false)
const { actionInProgress } = useActionState()
const anyLock = computed(() => boardEditing.value || actionInProgress.value)

const handleEditingChange = (editing: boolean) => {
  boardEditing.value = editing
  emit('editingChange', editing)
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

const onChange = (newStatus: TaskStatus, event: { added?: { element: Task } }) => {
  if (event.added) {
    const task = event.added.element
    if (task.status !== newStatus) {
      emit('update', task.id, { status: newStatus })
    }
  }
}

const handleItemUpdate = (id: string, updates: Partial<Pick<Task, 'name' | 'status' | 'priority' | 'assignee_id'>>) => {
  emit('update', id, updates)
}
</script>
