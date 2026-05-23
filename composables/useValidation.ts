import type { ValidationRules } from '~/types'

export function useValidation<T extends Record<string, unknown>>(formRef: Ref<T>, rules: ValidationRules<T>) {
  const errors = ref<Partial<Record<keyof T, string>>>({})

  function validateField(field: keyof T): boolean {
    const fieldRules = rules[field]
    if (!fieldRules || fieldRules.length === 0) return true

    const value = formRef.value[field]
    for (const r of fieldRules) {
      let failed = false
      switch (r.rule) {
        case 'required':
          if (value === undefined || value === null) {
            failed = true
          } else if (typeof value === 'string' && !value.trim()) {
            failed = true
          } else if (typeof value === 'number' && isNaN(value)) {
            failed = true
          }
          break
        case 'minLength':
          if (typeof value === 'string' && value.trim().length < (r.value as number)) {
            failed = true
          }
          break
        case 'maxLength':
          if (typeof value === 'string' && value.length > (r.value as number)) {
            failed = true
          }
          break
        case 'pattern':
          if (typeof value === 'string' && !new RegExp(r.value as string).test(value)) {
            failed = true
          }
          break
        case 'email':
          if (typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            failed = true
          }
          break
      }
      if (failed) {
        errors.value = { ...errors.value, [field]: r.message }
        return false
      }
    }
    const { [field]: _, ...rest } = errors.value
    errors.value = rest as Partial<Record<keyof T, string>>
    return true
  }

  function validate(): boolean {
    errors.value = {}
    let valid = true
    for (const field in rules) {
      if (rules[field] && rules[field]!.length > 0 && !validateField(field as keyof T)) {
        valid = false
      }
    }
    return valid
  }

  function clearErrors() {
    errors.value = {}
  }

  function getError(field: keyof T): string | undefined {
    return errors.value[field]
  }

  return { errors, validate, clearErrors, getError }
}
