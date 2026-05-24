export function useTaskItem() {
  const editing = ref(false)
  const confirmingDelete = ref(false)
  const editNameInput = ref<HTMLInputElement | null>(null)

  const editForm = ref({
    name: '',
    status: 'pending' as TaskStatus,
    priority: 'medium' as TaskPriority,
    assignee_id: '',
  })

  const taskErrors = ref<{ name?: string }>({})

  function initEditForm(task: Task) {
    editForm.value = {
      name: task.name,
      status: task.status,
      priority: task.priority,
      assignee_id: task.assignee_id,
    }
  }

  function startEditing(task: Task) {
    initEditForm(task)
    editing.value = true
    taskErrors.value = {}
    nextTick(() => editNameInput.value?.focus())
  }

  function cancelEdit() {
    editing.value = false
    taskErrors.value = {}
  }

  function buildUpdates(task: Task): Partial<Pick<Task, 'name' | 'status' | 'priority' | 'assignee_id'>> {
    const updates: Partial<Pick<Task, 'name' | 'status' | 'priority' | 'assignee_id'>> = {}
    if (editForm.value.name.trim() && editForm.value.name.trim() !== task.name) {
      updates.name = editForm.value.name.trim()
    }
    if (editForm.value.status !== task.status) updates.status = editForm.value.status
    if (editForm.value.priority !== task.priority) updates.priority = editForm.value.priority
    if (editForm.value.assignee_id !== task.assignee_id) updates.assignee_id = editForm.value.assignee_id
    return updates
  }

  function validateTask(isNew: boolean): boolean {
    taskErrors.value = {}
    if (isNew) {
      const name = editForm.value.name.trim()
      if (!name) {
        taskErrors.value = { name: 'Task name is required' }
        return false
      }
      if (name.length > 200) {
        taskErrors.value = { name: 'Task name must be 200 characters or less' }
        return false
      }
    }
    return true
  }

  function confirmDelete() {
    confirmingDelete.value = true
  }

  function cancelDelete() {
    confirmingDelete.value = false
  }

  const statusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'in_progress':
        return 'In Progress'
      case 'completed':
        return 'Completed'
      default:
        return status
    }
  }

  const priorityClass = (priority: TaskPriority) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
      case 'medium':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
      case 'high':
        return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
      default:
        return ''
    }
  }

  const statusClass = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
      case 'in_progress':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
      case 'completed':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
      default:
        return ''
    }
  }

  return {
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
  }
}
