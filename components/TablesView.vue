<template>
  <div class="p-4">

    <!-- Service Type Selection -->
    <div class="flex justify-end mb-6">
      <div class="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
        <button
          @click="selectServiceType('local')"
          class="flex items-center px-6 py-3 text-sm font-medium rounded-md transition-colors"
          :class="selectedServiceType === 'local' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'"
        >
          <UtensilsIcon class="w-4 h-4 mr-2" />
          Mesa
        </button>
        <button
          @click="selectServiceType('delivery')"
          class="flex items-center px-6 py-3 text-sm font-medium rounded-md transition-colors"
          :class="selectedServiceType === 'delivery' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'"
        >
          <TruckIcon class="w-4 h-4 mr-2" />
          Delivery
        </button>
      </div>
    </div>

    <!-- Tables View (Local) -->
    <div v-if="selectedServiceType === 'local'">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 mb-1">Mesas</h2>
          <p class="text-gray-600">Toque em uma mesa para gerenciar pedidos</p>
        </div>
        <button
          @click="refreshTables"
          :disabled="isRefreshing"
          class="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          <RefreshCwIcon :class="{ 'animate-spin': isRefreshing }" class="w-4 h-4" />
          <span>{{ isRefreshing ? 'Atualizando...' : 'Atualizar' }}</span>
        </button>
      </div>

      <!-- Search Filter -->
      <SearchInput
        v-model="searchQuery"
        placeholder="Pesquisar mesa..."
        size="md"
        inputmode="search"
        aria-label="Pesquisar mesas"
        class="mb-4"
        @clear="searchQuery = ''"
      />
    </div>
    
    <!-- Tables Grid -->
    <div v-if="selectedServiceType === 'local' && filteredTables.length > 0" class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
      <button
        v-for="table in filteredTables"
        :key="table.id"
        @click="selectTable(table)"
        class="aspect-square rounded-xl border-2 transition-all duration-200 active:scale-95 flex flex-col items-center justify-center p-3 shadow-sm hover:shadow-md"
        :class="getTableStatusClass(table)"
      >
        <div class="text-xl font-bold mb-1">{{ table.description }}</div>
        <div class="text-xs font-medium capitalize opacity-80">
          {{ getTableStatusText(table) }}
        </div>
      </button>
    </div>

    <!-- No Results State -->
    <div v-else-if="selectedServiceType === 'local' && searchQuery && filteredTables.length === 0" class="text-center py-12">
      <SearchIcon class="w-12 h-12 mx-auto mb-4 text-gray-300" />
      <p class="text-gray-500 text-lg mb-2">Nenhuma mesa encontrada</p>
      <p class="text-gray-400 text-sm mb-4">Tente pesquisar por outro termo ou status</p>
      <button
        @click="searchQuery = ''"
        class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors active:scale-95"
      >
        Ver todas as mesas
      </button>

    </div>

    <!-- Delivery View -->
    <DeliveryView v-if="selectedServiceType === 'delivery'" />

    <!-- Loading Modal when opening a table -->
    <LoadingModal v-if="showLoadingModal" :message="loadingMessage" />
  </div>
</template>

<script setup>

import { ref, computed } from 'vue'
import { Utensils as UtensilsIcon, Truck as TruckIcon, Search as SearchIcon, RefreshCw as RefreshCwIcon } from 'lucide-vue-next'

import { useRestaurantStore } from '~/stores/restaurant'
import SearchInput from './SearchInput.vue'
import LoadingModal from './LoadingModal.vue'

const restaurantStore = useRestaurantStore()

const selectedServiceType = ref('local')
const isRefreshing = ref(false)
const showLoadingModal = ref(false)
const loadingMessage = ref('')

const selectServiceType = (type) => {
  selectedServiceType.value = type
}

const refreshTables = async () => {
  isRefreshing.value = true
  try {
    await restaurantStore.initializeTables()
  } catch (error) {
    console.error('Erro ao atualizar mesas:', error)
  } finally {
    isRefreshing.value = false
  }
}

const searchQuery = ref('')

// Computed property to filter tables based on search query
const filteredTables = computed(() => {
  if (!searchQuery.value.trim()) {
    return restaurantStore.tables
  }

  const query = searchQuery.value.toLowerCase().trim()
  return restaurantStore.tables.filter(table => {
    const description = table.description?.toLowerCase() || ''
    const status = getTableStatusText(table).toLowerCase()

    return description.includes(query) || status.includes(query)
  })
})


const selectTable = async (table) => {
  loadingMessage.value = 'Abrindo mesa...'
  showLoadingModal.value = true
  try {
    const ok = await restaurantStore.selectTable(table.id)
    if (!ok) {
      alert('Não foi possível abrir a mesa. Tente novamente.')
    }
  } catch (error) {
    alert('Erro ao abrir a mesa. Tente novamente.')
  } finally {
    await new Promise(resolve => setTimeout(resolve, 10000))
    showLoadingModal.value = false
  }
}

const getTableStatusClass = (table) => {
  if (table.status === 'pedding') {
    return 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
  } else if (table.status === 'occupied') {
    return 'table-occupied hover:bg-red-200'
  } else {
    return 'table-available hover:bg-emerald-200'
  }
}

const getTableStatusText = (table) => {
  if (table.pendingItems.length > 0) {
    return 'pendente'
  } else if (table.status === 'occupied') {
    return 'ocupado'
  } else {
    return 'disponível'
  }
}
</script>
