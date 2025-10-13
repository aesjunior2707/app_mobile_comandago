<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-sm w-full p-8 text-center">
      <div class="flex flex-col items-center space-y-4">
        <div class="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <h2 class="text-lg font-semibold text-gray-900">{{ message }}</h2>
        <p v-if="subtext" class="text-sm text-gray-600">{{ subtext }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  message: { type: String, default: 'Carregando...' },
  subtext: { type: String, default: '' }
})
</script>
