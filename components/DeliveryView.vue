<template>
  <div>
    <div class="mb-4">
      <h3 class="text-xl font-bold text-gray-900">Delivery</h3>
    </div>

    <!-- Search and Add Customer -->
    <div class="space-y-4 mb-6">
      <!-- Search Bar -->
      <div class="relative">
        <SearchIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por nome, CPF ou CEP..."
          class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
          @input="filterCustomers"
        />
      </div>

      <!-- Add Customer Button -->
      <button
        @click="showAddCustomerModal = true"
        class="w-full p-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2 font-medium"
      >
        <PlusIcon class="w-5 h-5" />
        <span>Adicionar Novo Cliente</span>
      </button>

    </div>

    <!-- Loading State -->
    <div v-if="customersStore.isLoading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredCustomers.length === 0 && !searchQuery" class="text-center py-12 text-gray-500">
      <UsersIcon class="w-12 h-12 mx-auto mb-4 text-gray-300" />
      <p>Nenhum cliente cadastrado</p>
      <p class="text-sm">Adicione um novo cliente para começar</p>
    </div>

    <!-- No Search Results -->
    <div v-else-if="filteredCustomers.length === 0 && searchQuery" class="text-center py-12 text-gray-500">
      <SearchIcon class="w-12 h-12 mx-auto mb-4 text-gray-300" />
      <p>Nenhum cliente encontrado</p>
      <p class="text-sm">Tente um termo de busca diferente</p>
    </div>

    <!-- Customers List -->
    <div v-else class="space-y-3">
      <button
        v-for="customer in filteredCustomers"
        :key="customer.id"
        @click="selectCustomer(customer)"
        class="w-full p-4 bg-white border border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-200 text-left"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <h4 class="font-semibold text-gray-900">{{ customer.customer_name }}</h4>
              <span v-if="restaurantStore.deliveryOpenTables[customer.id]" class="ml-2 px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Pedido em aberto</span>
            </div>
            <div class="space-y-1 mt-1">
              <p class="text-sm text-gray-600 flex items-center">
                <PhoneIcon class="w-3 h-3 mr-1" />
                {{ customer.customer_phone }}
              </p>
              <p v-if="customer.document" class="text-sm text-gray-600 flex items-center">
                <CreditCardIcon class="w-3 h-3 mr-1" />
                {{ customer.document }}
              </p>
              <p class="text-sm text-gray-600 flex items-center">
                <MapPinIcon class="w-3 h-3 mr-1" />
                {{ customer.delivery_address }}, {{ customer.number }} - {{ customer.district }}
              </p>
              <p class="text-sm text-gray-500">
                {{ customer.city }}, {{ customer.state }} - CEP: {{ customer.zip_code }}
              </p>
            </div>
          </div>
          <ChevronRightIcon class="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
        </div>
      </button>
    </div>

    <!-- Add Customer Modal -->
    <AddCustomerModal
      v-if="showAddCustomerModal"
      @close="showAddCustomerModal = false"
      @customer-added="onCustomerAdded"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import {
  SearchIcon,
  PlusIcon,
  UsersIcon,
  PhoneIcon,
  CreditCardIcon,
  MapPinIcon,
  ChevronRightIcon
} from 'lucide-vue-next'
import { useCustomersStore } from '~/stores/customers'
import { useRestaurantStore } from '~/stores/restaurant'
import { useAuthStore } from '~/stores/auth'

const customersStore = useCustomersStore()
const restaurantStore = useRestaurantStore()
const authStore = useAuthStore()
const searchQuery = ref('')
const showAddCustomerModal = ref(false)

onMounted(async () => {
  await customersStore.list_customers()
  restaurantStore.loadDeliveryOpenTables(authStore.user?.company_id || '')
  // Validate and clean stale delivery mappings
  await restaurantStore.validateAndCleanDeliveryMappings()
})

const filteredCustomers = computed(() => {
  const base = !searchQuery.value
    ? customersStore.allCustomers
    : customersStore.allCustomers.filter(customer => {
        const query = searchQuery.value.toLowerCase()
        return (
          customer.customer_name.toLowerCase().includes(query) ||
          customer.customer_phone.includes(query) ||
          (customer.document && customer.document.includes(query)) ||
          customer.zip_code.includes(query)
        )
      })

  // Sort: customers with open delivery orders first
  const hasOpen = (c) => !!restaurantStore.deliveryOpenTables[c.id]
  return [...base].sort((a, b) => {
    const ao = hasOpen(a) ? 1 : 0
    const bo = hasOpen(b) ? 1 : 0
    if (bo - ao !== 0) return bo - ao
    return a.customer_name.localeCompare(b.customer_name)
  })
})

const filterCustomers = () => {
  // The filtering is handled by the computed property
}

const selectCustomer = async (customer) => {
  const openId = restaurantStore.deliveryOpenTables[customer.id]
  if (openId) {
    await restaurantStore.selectDeliveryByTableId(customer, openId)
  } else {
    await restaurantStore.setDeliveryCustomer(customer)
  }
}

const onCustomerAdded = () => {
  showAddCustomerModal.value = false
  customersStore.list_customers() // Refresh the list
}

</script>
