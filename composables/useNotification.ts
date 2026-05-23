import type { ToastNotification } from '~/types'

export function useNotification() {
  const notifications = useState<ToastNotification[]>('notifications', () => [])

  function notify(message: string, type: 'success' | 'error' = 'success', duration = 4000) {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 9)
    const notification: ToastNotification = { id, message, type }
    notifications.value = [...notifications.value, notification]

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, duration)
    }

    return id
  }

  function dismiss(id: string) {
    notifications.value = notifications.value.filter((n) => n.id !== id)
  }

  return {
    notifications,
    notify,
    dismiss,
  }
}
