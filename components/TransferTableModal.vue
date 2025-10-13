<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-end justify-center sm:items-center overflow-hidden">
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      @click="close"
    ></div>

    <!-- Modal Content -->
    <div class="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl transition-all flex flex-col"
         :class="currentStep === 'menu' ? 'pb-safe' : ''"
         style="max-height: 85vh;">

      <!-- Header -->
      <div class="flex-shrink-0 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-t-3xl sm:rounded-t-3xl px-6 py-5 flex items-center justify-between">
        <div class="flex-1">
          <h3 class="text-xl font-bold text-white mb-1">
            {{ currentStep === 'menu' ? 'Opções da Mesa' : 'Selecionar Mesa' }}
          </h3>
          <p v-if="sourceTable && currentStep === 'select'" class="text-emerald-100 text-sm">
            Transferir de: <span class="font-semibold">{{ sourceTable.description }}</span>
          </p>
        </div>
        <button
          @click="close"
          class="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
        >
          <XIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- Menu Step -->
      <div v-if="currentStep === 'menu'" class="flex-1 p-6 overflow-y-auto">
        <button
          @click="currentStep = 'select'"
          class="w-full group flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl hover:border-emerald-400 hover:shadow-md transition-all duration-200 active:scale-98"
        >
          <div class="flex items-center space-x-4">
            <div class="p-3 bg-emerald-100 group-hover:bg-emerald-500 rounded-xl transition-colors">
              <ArrowRightLeftIcon class="w-6 h-6 text-emerald-700 group-hover:text-white transition-colors" />
            </div>
            <div class="text-left">
              <p class="font-semibold text-gray-900 text-base mb-0.5">Transferir mesa</p>
              <p class="text-sm text-gray-500">Mover todos os pedidos para outra mesa</p>
            </div>
          </div>
          <ChevronRightIcon class="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
        </button>
      </div>

      <!-- Select Table Step -->
      <div v-else-if="currentStep === 'select'" class="flex-1 flex flex-col overflow-hidden bg-gray-50">
        <!-- Search -->
        <div class="flex-shrink-0 px-6 pt-5 pb-3 bg-white border-b border-gray-200">
          <SearchInput
            v-model="searchQuery"
            placeholder="Pesquisar mesa de destino..."
            size="md"
            @clear="searchQuery = ''"
          />
          <p class="text-xs text-gray-500 mt-2">{{ availableTables.length }} mesa(s) disponível(is)</p>
        </div>

        <!-- Tables List -->
        <div class="flex-1 overflow-y-auto px-6 py-4">
          <div v-if="availableTables.length === 0" class="text-center py-12">
            <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
              <SearchIcon class="w-8 h-8 text-gray-400" />
            </div>
            <p class="text-gray-600 font-medium mb-1">Nenhuma mesa disponível</p>
            <p class="text-sm text-gray-400">Tente ajustar sua busca</p>
          </div>

          <div v-else class="space-y-2.5">
            <button
              v-for="table in availableTables"
              :key="table.id"
              @click="selectDestinationTable(table)"
              class="w-full group flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-400 hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
            >
              <div class="flex items-center space-x-4 flex-1">
                <div class="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-emerald-100 group-hover:to-emerald-200 rounded-xl font-bold text-gray-900 text-lg transition-all shadow-sm">
                  {{ table.number }}
                </div>
                <div class="text-left flex-1">
                  <p class="font-semibold text-gray-900 text-base mb-0.5">{{ table.description }}</p>
                  <div class="flex items-center space-x-2">
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="getStatusBadgeClass(table)"
                    >
                      <span class="w-1.5 h-1.5 rounded-full mr-1.5" :class="getStatusDotClass(table)"></span>
                      {{ getTableStatusText(table) }}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRightIcon class="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors flex-shrink-0" />
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

const getStatusBadgeClass = (table) => {
  if (table.pendingItems?.length > 0) {
    return 'bg-amber-100 text-amber-700'
  } else if (table.status === 'occupied') {
    return 'bg-red-100 text-red-700'
  } else {
    return 'bg-emerald-100 text-emerald-700'
  }
}

const getStatusDotClass = (table) => {
  if (table.pendingItems?.length > 0) {
    return 'bg-amber-500'
  } else if (table.status === 'occupied') {
    return 'bg-red-500'
  } else {
    return 'bg-emerald-500'
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
