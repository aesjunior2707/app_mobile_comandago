<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="p-6 border-b border-gray-200">
        <h2 class="text-xl font-bold text-gray-900">Adicionar Novo Cliente</h2>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <!-- Nome do Cliente -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Nome do Cliente
          </label>
          <input
            v-model="form.customer_name"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Digite o nome completo"
          />
        </div>

        <!-- Telefone e Documento -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Telefone
            </label>
            <input
              v-model="form.customer_phone"
              type="tel"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="(11) 99999-9999"
              @input="formatPhone"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Documento
            </label>
            <input
              v-model="form.document"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="CPF/CNPJ"
              @input="formatDocument"
            />
          </div>
        </div>

        <!-- CEP -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            CEP
          </label>
          <div class="flex space-x-2">
            <input
              v-model="form.zip_code"
              type="text"
              required
              class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="00000-000"
              @input="formatCep"
              @blur="searchCep"
            />
            <button
              type="button"
              @click="searchCep"
              :disabled="isSearchingCep || !isValidCep"
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <SearchIcon v-if="!isSearchingCep" class="w-4 h-4" />
              <div v-else class="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
            </button>
          </div>
          <p v-if="cepError" class="text-sm text-red-600 mt-1">{{ cepError }}</p>
        </div>

        <!-- Endereço de Entrega -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Endereço de Entrega
          </label>
          <input
            v-model="form.delivery_address"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Rua, Avenida..."
          />
        </div>

        <!-- Número e Bairro -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Número
            </label>
            <input
              v-model="form.number"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="123"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Bairro
            </label>
            <input
              v-model="form.district"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Nome do bairro"
            />
          </div>
        </div>

        <!-- Cidade e Estado -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Cidade
            </label>
            <input
              v-model="form.city"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Nome da cidade"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              v-model="form.state"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Selecione</option>
              <option v-for="state in states" :key="state.value" :value="state.value">
                {{ state.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex space-x-3 pt-4">
          <button
            type="button"
            @click="$emit('close')"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="!isSubmitting">Adicionar Cliente</span>
            <span v-else class="flex items-center justify-center">
              <div class="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
              Salvando...
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { SearchIcon } from 'lucide-vue-next'
import { useCustomersStore } from '~/stores/customers'
import { useAuthStore } from '~/stores/auth'

const emit = defineEmits(['close', 'customer-added'])

const customersStore = useCustomersStore()
const authStore = useAuthStore()

const form = ref({
  customer_name: '',
  customer_phone: '',
  document: '',
  delivery_address: '',
  zip_code: '',
  district: '',
  number: '',
  city: '',
  state: '',
  company_id: authStore.user?.company_id || ''
})

const isSubmitting = ref(false)
const isSearchingCep = ref(false)
const cepError = ref('')

const states = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' }
]

const isValidCep = computed(() => {
  return form.value.zip_code.replace(/\D/g, '').length === 8
})

const formatPhone = (event) => {
  let value = event.target.value.replace(/\D/g, '')
  if (value.length >= 11) {
    value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  } else if (value.length >= 7) {
    value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
  } else if (value.length >= 3) {
    value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2')
  }
  form.value.customer_phone = value
}

const formatDocument = (event) => {
  let value = event.target.value.replace(/\D/g, '')
  if (value.length <= 11) {
    // CPF format
    value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  } else {
    // CNPJ format
    value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  form.value.document = value
}

const formatCep = (event) => {
  let value = event.target.value.replace(/\D/g, '')
  value = value.replace(/(\d{5})(\d{3})/, '$1-$2')
  form.value.zip_code = value
}

const searchCep = async () => {
  if (!isValidCep.value) return
  
  isSearchingCep.value = true
  cepError.value = ''
  
  try {
    const cep = form.value.zip_code.replace(/\D/g, '')
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    const data = await response.json()
    
    if (data.erro) {
      cepError.value = 'CEP não encontrado'
      return
    }
    
    // Preencher os campos automaticamente
    form.value.delivery_address = data.logradouro || ''
    form.value.district = data.bairro || ''
    form.value.city = data.localidade || ''
    form.value.state = data.uf || ''
    
  } catch (error) {
    cepError.value = 'Erro ao buscar CEP'
    console.error('Erro ao buscar CEP:', error)
  } finally {
    isSearchingCep.value = false
  }
}

const handleSubmit = async () => {
  isSubmitting.value = true
  
  try {
    const result = await customersStore.addCustomer(form.value)
    
    if (result.success) {
      emit('customer-added')
    } else {
      alert('Erro ao adicionar cliente: ' + result.error)
    }
  } catch (error) {
    console.error('Erro ao adicionar cliente:', error)
    alert('Erro ao adicionar cliente. Tente novamente.')
  } finally {
    isSubmitting.value = false
  }
}
</script>
