<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h2 class="text-xl font-bold text-gray-900">Adicionar Mais</h2>
        <button
          @click="$emit('close')"
          class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XIcon class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6 space-y-6">
        <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <h3 class="font-semibold text-emerald-900 mb-1">{{ item.product_description }}</h3>
          <p class="text-sm text-emerald-700">R$ {{ item.unit_price.toFixed(2) }} por unidade</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Quantidade *
          </label>
          <div class="flex items-center space-x-3">
            <button
              @click="decreaseQuantity"
              type="button"
              class="w-14 h-14 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors active:scale-95"
              :disabled="quantity <= 1"
            >
              <MinusIcon class="w-6 h-6" />
            </button>
            <input
              v-model.number="quantity"
              type="number"
              min="1"
              class="w-20 text-center text-2xl font-semibold px-2 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <button
              @click="increaseQuantity"
              type="button"
              class="w-14 h-14 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors active:scale-95"
            >
              <PlusIcon class="w-6 h-6" />
            </button>
          </div>
        </div>

        <div>
          <label for="observation" class="block text-sm font-medium text-gray-700 mb-2">
            Observação (opcional)
          </label>
          <textarea
            id="observation"
            v-model="observation"
            rows="3"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            placeholder="Ex: Sem cebola, mal passado..."
          ></textarea>
        </div>

        <div class="bg-gray-50 rounded-lg p-4">
          <div class="flex items-center justify-between text-lg font-semibold">
            <span class="text-gray-700">Total:</span>
            <span class="text-emerald-600">R$ {{ totalPrice.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <div class="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex space-x-3">
        <button
          @click="$emit('close')"
          class="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          @click="handleConfirm"
          class="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors active:scale-95"
        >
          Adicionar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { X as XIcon, Plus as PlusIcon, Minus as MinusIcon } from 'lucide-vue-next'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'confirm'])

const quantity = ref(1)
const observation = ref('')

const totalPrice = computed(() => {
  return props.item.unit_price * quantity.value
})

const increaseQuantity = () => {
  quantity.value++
}

const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

const handleConfirm = () => {
  if (quantity.value < 1) {
    alert('A quantidade deve ser no mínimo 1')
    return
  }

  emit('confirm', {
    quantity: quantity.value,
    observation: observation.value
  })
}
</script>