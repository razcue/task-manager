<template>
  <select
    :value="modelValue"
    :disabled="disabled"
    :aria-label="ariaLabel"
    class="styled-select"
    :class="{ compact }"
    v-bind="$attrs"
    @change="onChange"
  >
    <button>
      <selectedcontent></selectedcontent>
    </button>
    <option v-for="opt in options" :key="opt.value" :value="opt.value">
      <span v-if="opt.icon" class="icon" aria-hidden="true">{{ opt.icon }}</span>
      <span class="option-label">{{ opt.label }}</span>
    </option>
  </select>
</template>

<script setup lang="ts">
export interface StyledSelectOption {
  value: string
  label: string
  icon?: string
}

defineProps<{
  modelValue: string
  options: StyledSelectOption[]
  disabled?: boolean
  ariaLabel?: string
  compact?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<style scoped>
select.styled-select {
  appearance: base-select;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  background: #fff;
  color: #111827;
  cursor: pointer;
  transition:
    border-color 0.15s,
    box-shadow 0.15s,
    background-color 0.15s;
  min-width: 140px;
  column-gap: 0.5rem;
}

.dark select.styled-select {
  border-color: #374151;
  background: #111827;
  color: #fff;
}

select.styled-select:hover {
  background: #f9fafb;
}

.dark select.styled-select:hover {
  background: #1f2937;
}

select.styled-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px #3b82f6;
}

select.styled-select:disabled {
  opacity: 0.5;
  pointer-events: none;
}

select.styled-select.compact {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  line-height: 1rem;
  min-width: auto;
  column-gap: 0.25rem;
}

select.styled-select::picker(select) {
  appearance: base-select;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #fff;
  padding: 0.25rem;
}

.dark select.styled-select::picker(select) {
  border-color: #374151;
  background: #111827;
}

select.styled-select.compact::picker(select) {
  padding: 0.125rem;
}

select.styled-select::picker-icon {
  order: -1;
  color: #6b7280;
  transition: rotate 0.2s;
  margin: 0 0.25rem;
}

.dark select.styled-select::picker-icon {
  color: #9ca3af;
}

select.styled-select:open::picker-icon {
  rotate: 180deg;
}

option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: #111827;
  border-radius: 0.25rem;
}

.dark option {
  color: #fff;
}

select.styled-select.compact option {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  line-height: 1rem;
  gap: 0.5rem;
}

option:hover,
option:focus {
  background: #f3f4f6;
}

.dark option:hover,
.dark option:focus {
  background: #1f2937;
}

option:checked {
  font-weight: 600;
}

option .icon {
  font-size: 1.6rem;
  text-box: trim-both cap alphabetic;
}

selectedcontent {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

selectedcontent .icon {
  display: none;
}
</style>
