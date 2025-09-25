<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div class="px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <h1 class="text-xl">
              <span class="text-gray-900">comanda</span><span class="text-emerald-600">GO</span> PDV
            </h1>
            <span class="text-sm text-gray-500">Bem vindo, {{ authStore.user?.name }}</span>
          </div>
          
          <div class="flex items-center space-x-2">
            <button
              @click="showHistory = !showHistory"
              class="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              :class="{ 'text-emerald-600': showHistory }"
            >
              <ClockIcon class="w-5 h-5" />
            </button>
            
            <button
              @click="handleLogout"
              class="p-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOutIcon class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="pb-20">
      <HistoryView v-if="showHistory" @close="showHistory = false" />
      <TableDetailView v-else-if="restaurantStore.selectedTable" />
      <TablesView v-else />
    </main>

    <!-- PWA Install Prompt -->
    <PWAInstallPrompt />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Clock as ClockIcon, LogOut as LogOutIcon } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'
import { useRestaurantStore } from '~/stores/restaurant'
import { useSocketStore } from '~/stores/socket'

const authStore = useAuthStore()
const restaurantStore = useRestaurantStore()
const socketStore = useSocketStore()
const showHistory = ref(false)

onMounted(async() => {
  // Initialize auth from localStorage
  authStore.initializeAuth()
  
  // Garantir que o socket está conectado e autenticado
  if (!socketStore.isConnected) {
    socketStore.initializeConnection()
  } else if (authStore.isAuthenticated && !socketStore.isAuthenticated) {
    socketStore.authenticateUser()
  }
  
  await restaurantStore.initializeTables()
})

const handleLogout = () => {
  if (confirm('Tem certeza que deseja sair?')) {
    authStore.logout()
  }
}
</script>