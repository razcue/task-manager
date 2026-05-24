export function useNotification() {
  onUnmounted(() => clearAllTimeouts())
  const notifications = useState<ToastNotification[]>('notifications', () => [])

  const timeouts = new Map<string, ReturnType<typeof setTimeout>>()

  function notify(message: string, type: 'success' | 'error' = 'success', duration = 4000) {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 9)
    const notification: ToastNotification = { id, message, type }
    notifications.value = [...notifications.value, notification]

    if (duration > 0) {
      const timer = setTimeout(() => {
        dismiss(id)
        timeouts.delete(id)
      }, duration)
      timeouts.set(id, timer)
    }

    return id
  }

  function clearAllTimeouts() {
    for (const timer of timeouts.values()) {
      clearTimeout(timer)
    }
    timeouts.clear()
  }

  function dismiss(id: string) {
    notifications.value = notifications.value.filter((n) => n.id !== id)
  }

  return {
    notifications,
    notify,
    dismiss,
    clearAllTimeouts,
  }
}
