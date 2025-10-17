<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
      @click="close"
    ></div>

    <!-- Modal Content -->
    <div class="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-scale-up">
      <!-- Success Gradient Background -->
      <div class="bg-gradient-to-br from-emerald-500 to-emerald-600 h-32 flex items-center justify-center relative overflow-hidden">
        <!-- Animated circles -->
        <div class="absolute w-40 h-40 bg-emerald-400/20 rounded-full -top-20 -right-20 animate-pulse"></div>
        <div class="absolute w-32 h-32 bg-emerald-300/10 rounded-full -bottom-16 -left-16 animate-pulse" style="animation-delay: 0.5s;"></div>
        
        <!-- Success Icon -->
        <div class="relative z-10 flex items-center justify-center">
          <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
            <svg class="w-10 h-10 text-emerald-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="px-6 py-8">
        <!-- Title -->
        <h3 class="text-2xl font-bold text-gray-900 text-center mb-2">Transferência Concluída!</h3>
        <p class="text-center text-gray-500 text-sm mb-6">Mesa transferida com sucesso</p>

        <!-- Details Card -->
        <div class="bg-gray-50 rounded-2xl p-5 mb-6 space-y-4">
          <!-- From Table -->
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">De</p>
              <p class="text-lg font-bold text-gray-900 mt-1">{{ sourceTableName }}</p>
            </div>
            <div class="text-emerald-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>

          <div class="border-t border-gray-200"></div>

          <!-- To Table -->
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Para</p>
              <p class="text-lg font-bold text-gray-900 mt-1">{{ destinationTableName }}</p>
            </div>
            <div class="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-full">
              <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Orders Count -->
        <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
          <div class="flex items-center justify-center space-x-3">
            <div class="flex items-center justify-center w-10 h-10 bg-emerald-500 rounded-full">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p class="text-sm text-emerald-700 font-medium">
                <span class="text-xl font-bold">{{ ordersTransferred }}</span>
                <span class="ml-1">{{ ordersTransferred === 1 ? 'pedido' : 'pedidos' }} transferido{{ ordersTransferred === 1 ? '' : 's' }}</span>
              </p>
            </div>
          </div>
        </div>

        <!-- CTA Button -->
        <button
          @click="close"
          class="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 active:scale-95 shadow-lg hover:shadow-xl"
        >
          Entendido
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  sourceTableName: {
    type: String,
    default: 'Mesa de Origem'
  },
  destinationTableName: {
    type: String,
    default: 'Mesa de Destino'
  },
  ordersTransferred: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['close'])

const close = () => {
  emit('close')
}
</script>

<style scoped>
@keyframes scale-up {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-scale-up {
  animation: scale-up 0.3s ease-out;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.animate-bounce {
  animation: bounce 2s infinite;
}
</style>
