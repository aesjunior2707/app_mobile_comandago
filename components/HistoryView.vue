<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center space-x-3">
        <button
          @click="$emit('close')"
          class="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon class="w-5 h-5" />
        </button>
        <div>
          <h2 class="text-xl font-bold text-gray-900">Histórico da Mesa</h2>
          <p class="text-sm text-gray-600">{{ SalesRecords.length }} mesas encontradas</p>
        </div>
      </div>
    </div>

    <!-- Search Filter -->
    <SearchInput
      v-model="searchQuery"
      placeholder="Pesquisar por mesa, valor, método..."
      size="md"
      inputmode="search"
      aria-label="Pesquisar no histórico"
      class="mb-4"
      @clear="searchQuery = ''"
    />

    <!-- Date Filter -->
    <div class="mb-6">
      <div class="flex items-center">
        <div class="w-48">
          <label for="date-filter" class="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por data
          </label>
          <input
            id="date-filter"
            v-model="selectedDate"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          />
        </div>
        <button
          @click="clearFilter"
          class="w-full mt-6 ml-5 px-4 py-2 text-sm text-white rounded-lg transition-colors"
          style="background-color: #EF5350;"
          onmouseover="this.style.backgroundColor='#E53935'"
          onmouseout="this.style.backgroundColor='#EF5350'"
        >
          Limpar
        </button>
      </div>
      
      <!-- Quick Date Buttons -->
      <div class="flex space-x-2 mt-3">
        <button
          @click="setToday"
          class="px-3 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 transition-colors"
          :class="{ 'ring-2 ring-emerald-300': isToday }"
        >
          Hoje
        </button>
        <button
          @click="setYesterday"
          class="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
          :class="{ 'ring-2 ring-gray-300': isYesterday }"
        >
          Ontem
        </button>
        <button
          @click="setThisWeek"
          class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
          :class="{ 'ring-2 ring-blue-300': isThisWeek }"
        >
          Esta semana
        </button>
      </div>
      
      <!-- Results Summary -->
      <div class="mt-3 text-sm text-gray-600">
        <span v-if="selectedDate">
          Mostrando resultados para: <span class="font-medium">{{ formatSelectedDate }}</span>
        </span>
        <span v-if="searchQuery" class="ml-2">
          • Pesquisa: "<span class="font-medium">{{ searchQuery }}</span>"
        </span>
        <span class="block mt-1">
          {{ filteredSalesRecords.length }} de {{ SalesRecords.length }} registros encontrados
        </span>
        <div v-if="isTypeA" class="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-800">
          Total do faturamento no período: <span class="font-semibold">R${{ totalRevenue.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- History List -->
    <div v-if="filteredSalesRecords.length > 0" class="space-y-4">
      <div
        v-for="closedTable in filteredSalesRecords"
        :key="closedTable.id"
        class="card"
      >
        <div class="flex items-start justify-between mb-3">
          <div>
            <h3 class="font-medium text-gray-900">Mesa {{ closedTable.table_id }}</h3>
            <p class="text-sm text-gray-600">
              {{ formatDateTime(closedTable.updated_at) }} • {{ closedTable.user_name }}
            </p>
            <p class="text-sm text-blue-600 font-medium">
              Pagamento: {{ getPaymentMethodLabel(closedTable.payment_type) }}
            </p>
            <!-- Invoice Information -->
            <div v-if="closedTable.issues_invoice" class="text-sm text-emerald-600 font-medium mt-1">
              📄 NF emitida: {{ closedTable.type_customer.toUpperCase() }} {{ closedTable.identification_nfce }}
              <div v-if="false" class="text-xs text-gray-600">
                {{ closedTable.invoice.customerName }}
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-semibold text-gray-900">R${{ closedTable.total_amount.toFixed(2) }}</div>
            <button
              @click="reprintReceipt(closedTable)"
              class="text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Imprimir
            </button>
          </div>
        </div>
        
        <div class="border-t border-gray-100 pt-3">
          <div class="space-y-1">
            <div
              v-for="group in getGroupedItems(closedTable.itens)"
              :key="group.name"
              class="flex justify-between text-sm"
            >
              <span class="text-gray-600">{{ group.name }} ×{{ group.totalQuantity }}</span>
              <span class="text-gray-900">R${{ group.totalPrice.toFixed(2) }}</span>
            </div>
            
            <!-- Service charge in history -->
            <div class="flex justify-between text-sm pt-2 border-t border-gray-100">
              <span class="text-gray-600">Subtotal</span>
              <span class="text-gray-900">R${{calculateTotalSalesAmount(closedTable.id).toFixed(2)}}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Taxa de serviço (10%)</span>
              <span class="text-gray-900">R${{ calculateTenPercent(calculateTotalSalesAmount(closedTable.id)).toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-sm font-medium pt-1 border-t border-gray-200">
              <span class="text-gray-900">Total Final</span>
              <span class="text-emerald-600">R${{ closedTable.total_amount.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12 text-gray-500">
      <ClockIcon class="w-12 h-12 mx-auto mb-4 text-gray-300" />
      <p v-if="searchQuery && SalesRecords.length > 0">
        Nenhum resultado encontrado para "{{ searchQuery }}"
      </p>
      <p v-else-if="selectedDate">
        Nenhuma mesa fechada encontrada para {{ formatSelectedDate }}
      </p>
      <p v-else>Nenhuma mesa fechada ainda</p>

      <p class="text-sm mt-2">
        <span v-if="searchQuery">Tente pesquisar por outro termo</span>
        <span v-else-if="selectedDate">Tente selecionar uma data diferente</span>
        <span v-else>O histórico da mesa aparecerá aqui após o fechamento da mesa</span>
      </p>

      <div v-if="searchQuery || selectedDate" class="mt-4 space-x-2">
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors active:scale-95"
        >
          Limpar pesquisa
        </button>
        <button
          v-if="selectedDate"
          @click="clearFilter"
          class="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors active:scale-95"
        >
          Ver todos
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ArrowLeftIcon, ClockIcon } from 'lucide-vue-next'
import { useRestaurantStore } from '~/stores/restaurant'
import { useAuthStore } from '~/stores/auth'
import SearchInput from './SearchInput.vue'

const emit = defineEmits(['close'])

const selectedDate = ref('')
const searchQuery = ref('')
const authStore = useAuthStore()
const isTypeA = computed(() => {
  const t = (authStore.user?.user_type ?? '').toString().trim().toUpperCase()
  return t === 'A'
})

onMounted(() => {
  setToday().then(() => {
  useRestaurantStore().get_sales_records(selectedDate.value)
  })
})

const calculateTenPercent = (value) => {
  return value * 0.1
}


const calculateTotalSalesAmount = (id) => {
  const record = SalesRecords.value.find(record => record.id === id)
  if (!record) return 0
  return record.itens.reduce((total, item) => total + (item.quantity * item.unit_price), 0)
}

const formatDateTime = (date) => {
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatSelectedDate = computed(() => {
  if (!selectedDate.value) return ''
  return new Date(selectedDate.value + 'T00:00:00').toLocaleDateString('pt-BR')
})


const SalesRecords = computed(() => {
  return useRestaurantStore().SalesRecords
})

// Filtered sales records based on search query
const filteredSalesRecords = computed(() => {
  if (!searchQuery.value.trim()) {
    return SalesRecords.value
  }

  const query = searchQuery.value.toLowerCase().trim()
  return SalesRecords.value.filter(record => {
    const tableId = record.table_id?.toString().toLowerCase() || ''
    const totalAmount = record.total_amount?.toString().toLowerCase() || ''
    const paymentMethod = getPaymentMethodLabel(record.payment_type)?.toLowerCase() || ''
    const userName = record.user_name?.toLowerCase() || ''
    const productDescriptions = record.itens?.map(item => item.product_description?.toLowerCase() || '').join(' ') || ''
    const invoiceInfo = record.identification_nfce?.toLowerCase() || ''

    return tableId.includes(query) ||
           totalAmount.includes(query) ||
           paymentMethod.includes(query) ||
           userName.includes(query) ||
           productDescriptions.includes(query) ||
           invoiceInfo.includes(query)
  })
})

// Total revenue of current filtered set
const totalRevenue = computed(() => {
  return filteredSalesRecords.value.reduce((sum, rec) => sum + Number(rec.total_amount || 0), 0)
})

// Quick filter helpers
const isToday = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return selectedDate.value === today
})

const isYesterday = computed(() => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return selectedDate.value === yesterday.toISOString().split('T')[0]
})

const isThisWeek = computed(() => {
  return !selectedDate.value
})

const setToday = async () => {
  const today = new Date()
  selectedDate.value = today.toISOString().split('T')[0]
}

const setYesterday = async () => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  selectedDate.value = yesterday.toISOString().split('T')[0]
}

const setThisWeek = async() => {
  selectedDate.value = ''
}

const clearFilter = async() => {
  selectedDate.value = ''
}

watch(selectedDate, async (newDate) => {
  await useRestaurantStore().get_sales_records(newDate)
})

const getPaymentMethodLabel = (method) => {
  const methods = {
    'pix': 'PIX',
    'debit': 'Débito',
    'credit': 'Crédito',
    'cash': 'Dinheiro'
  }
  return methods[method] || method
}

const getGroupedItems = (items) => {
  const groups = new Map()
  
  items.forEach(item => {
    const key = item.product_description
    if (groups.has(key)) {
      const existing = groups.get(key)
      existing.totalQuantity += item.quantity
      existing.totalPrice += item.quantity * item.unit_price
    } else {
      groups.set(key, {
        name: item.product_description,
        price: item.unit_price,
        totalQuantity: item.quantity,
        totalPrice: item.quantity * item.unit_price
      })
    }
  })
  
  return Array.from(groups.values())
}

const reprintReceipt = (closedTable) => {
  console.log('Reprinting receipt for Table', closedTable.tableNumber, {
    items: getGroupedItems(closedTable.items),
    subtotal: closedTable.total,
    serviceCharge: closedTable.serviceCharge,
    finalTotal: closedTable.finalTotal,
    date: closedTable.closedAt,
    waiter: closedTable.waiter,
    paymentMethod: closedTable.paymentMethod,
    invoice: closedTable.invoice,
    type: 'REPRINT'
  })
  
  // Show feedback to user
  alert(`Receipt for Table ${closedTable.tableNumber} sent to printer${closedTable.invoice ? ' (with invoice data)' : ''}`)
}
</script>
