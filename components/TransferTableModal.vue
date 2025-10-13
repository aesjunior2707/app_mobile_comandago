<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-end justify-center sm:items-center overflow-hidden">
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/50 transition-opacity"
      @click="close"
    ></div>

    <!-- Modal Content -->
    <div class="relative bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md shadow-xl transition-all flex flex-col"
         :class="currentStep === 'menu' ? 'pb-safe' : ''"
         style="max-height: 80vh;">

      <!-- Header -->
      <div class="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">
          {{ currentStep === 'menu' ? 'Opções da Mesa' : 'Transferir para' }}
        </h3>
        <button
          @click="close"
          class="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
        >
          <XIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- Menu Step -->
      <div v-if="currentStep === 'menu'" class="flex-1 p-4 overflow-y-auto">
        <button
          @click="currentStep = 'select'"
          class="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors active:scale-98"
        >
          <div class="flex items-center space-x-3">
            <div class="p-2 bg-emerald-50 rounded-lg">
              <ArrowRightLeftIcon class="w-5 h-5 text-emerald-600" />
            </div>
            <div class="text-left">
              <p class="font-medium text-gray-900">Transferir mesa</p>
              <p class="text-sm text-gray-500">Mover pedidos para outra mesa</p>
            </div>
          </div>
          <ChevronRightIcon class="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <!-- Select Table Step -->
      <div v-else-if="currentStep === 'select'" class="flex-1 flex flex-col overflow-hidden">
        <!-- Search -->
        <div class="flex-shrink-0 px-4 pt-4 pb-2 bg-white">
          <SearchInput
            v-model="searchQuery"
            placeholder="Pesquisar mesa de destino..."
            size="sm"
            @clear="searchQuery = ''"
          />
        </div>

        <!-- Tables List -->
        <div class="flex-1 overflow-y-auto px-4 pb-4">
          <div v-if="availableTables.length === 0" class="text-center py-8">
            <SearchIcon class="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p class="text-gray-500">Nenhuma mesa disponível</p>
          </div>

          <div v-else class="space-y-2">
            <button
              v-for="table in availableTables"
              :key="table.id"
              @click="selectDestinationTable(table)"
              class="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all active:scale-98"
            >
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg font-bold text-gray-900">
                  {{ table.number }}
                </div>
                <div class="text-left">
                  <p class="font-medium text-gray-900">{{ table.description }}</p>
                  <p class="text-sm text-gray-500 capitalize">{{ getTableStatusText(table) }}</p>
                </div>
              </div>
              <ChevronRightIcon class="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { X as XIcon, ArrowRightLeft as ArrowRightLeftIcon, ChevronRight as ChevronRightIcon, Search as SearchIcon } from 'lucide-vue-next'
import SearchInput from './SearchInput.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  sourceTable: {
    type: Object,
    default: null
  },
  allTables: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'transfer'])

const currentStep = ref('menu')
const searchQuery = ref('')

// Reset to menu when modal opens and prevent body scroll
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    currentStep.value = 'menu'
    searchQuery.value = ''
    // Prevent background scroll
    if (process.client) {
      document.body.style.overflow = 'hidden'
    }
  } else {
    // Restore background scroll
    if (process.client) {
      document.body.style.overflow = ''
    }
  }
})

// Filter available tables (exclude source table and filter by search)
const availableTables = computed(() => {
  if (!props.sourceTable) return []
  
  let tables = props.allTables.filter(t => t.id !== props.sourceTable.id)
  
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    tables = tables.filter(table => {
      const description = table.description?.toLowerCase() || ''
      const number = String(table.number).toLowerCase()
      const status = getTableStatusText(table).toLowerCase()
      return description.includes(query) || number.includes(query) || status.includes(query)
    })
  }
  
  return tables
})

const getTableStatusText = (table) => {
  if (table.pendingItems?.length > 0) {
    return 'pendente'
  } else if (table.status === 'occupied') {
    return 'ocupado'
  } else {
    return 'disponível'
  }
}

const selectDestinationTable = (table) => {
  emit('transfer', {
    source: props.sourceTable,
    destination: table
  })
  close()
}

const close = () => {
  emit('close')
}
</script>
