<template>
  <div class="relative">
    <SearchIcon 
      :class="[
        'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400',
        size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
      ]" 
    />
    <input
      :value="modelValue"
      @input="handleInput"
      @focus="$emit('focus')"
      @blur="$emit('blur')"
      :type="type"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :class="[
        'w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors',
        size === 'sm' ? 'pl-9 pr-4 py-2.5 text-sm' : 'pl-10 pr-4 py-3 text-base',
        disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white',
        error ? 'border-red-300 focus:ring-red-500' : ''
      ]"
      :disabled="disabled"
      :aria-label="ariaLabel || placeholder"
      ref="inputRef"
    />
    <button
      v-if="modelValue && !disabled"
      @click="clearInput"
      :class="[
        'absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded',
        size === 'sm' ? '-mr-1' : ''
      ]"
      type="button"
      :aria-label="clearLabel"
    >
      <XIcon :class="size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'" />
    </button>
    
    <!-- Error message -->
    <p v-if="error && errorMessage" class="mt-1 text-sm text-red-600">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { SearchIcon, XIcon } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Pesquisar...'
  },
  size: {
    type: String,
    default: 'md', // 'sm' or 'md'
    validator: (value) => ['sm', 'md'].includes(value)
  },
  type: {
    type: String,
    default: 'search'
  },
  autocomplete: {
    type: String,
    default: 'off'
  },
  inputmode: {
    type: String,
    default: 'search'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  error: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: ''
  },
  ariaLabel: {
    type: String,
    default: ''
  },
  clearLabel: {
    type: String,
    default: 'Limpar pesquisa'
  },
  debounce: {
    type: Number,
    default: 300
  }
})

const emit = defineEmits(['update:modelValue', 'input', 'clear', 'focus', 'blur'])

const inputRef = ref(null)
let debounceTimer = null

const handleInput = (event) => {
  const value = event.target.value
  
  // Clear previous timer
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  
  // Immediate update for better UX
  emit('update:modelValue', value)
  
  // Debounced input event for API calls
  if (props.debounce > 0) {
    debounceTimer = setTimeout(() => {
      emit('input', value)
    }, props.debounce)
  } else {
    emit('input', value)
  }
}

const clearInput = () => {
  emit('update:modelValue', '')
  emit('clear')
  
  // Focus input after clearing for better UX
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus()
    }
  })
}

// Focus method for parent components
const focus = () => {
  if (inputRef.value) {
    inputRef.value.focus()
  }
}

// Expose focus method
defineExpose({
  focus
})
</script>
