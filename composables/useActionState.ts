export function useActionState() {
  const actionInProgress = useState('action-in-progress', () => false)

  function setActionInProgress(val: boolean) {
    actionInProgress.value = val
  }

  return {
    actionInProgress,
    setActionInProgress,
  }
}
