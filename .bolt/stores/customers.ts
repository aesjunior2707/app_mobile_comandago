import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import HttpRequest from '~/services/request'

const api = new HttpRequest()

export interface Customer {
  id: string
  company_id: string
  customer_name: string
  customer_phone: string
  document?: string
  delivery_address: string
  zip_code: string
  district: string
  number: string
  city: string
  state: string
  created_at: string
  updated_at: string
}

interface CustomerState {
  customers: Customer[]
  isLoading: boolean
}

export const useCustomersStore = defineStore('customers', {
  state: (): CustomerState => ({
    customers: [],
    isLoading: false
  }),

  getters: {
    allCustomers: (state) => state.customers,
    totalCustomers: (state) => state.customers.length
  },

  actions: {
    async list_customers() {
      this.isLoading = true
      try {
        const company_id = useAuthStore().user?.company_id
        const res = await api.request('GET', `customers/${company_id}`)
        res.data.data.forEach((customer: Customer) => {
          const existing = this.customers.find(c => c.id === customer.id)
          if (!existing) {
            this.customers.push(customer)
          }
        })
        console.log('Customers fetched successfully:', res.data)
      } catch (error: any) {
        console.error('Error fetching customers:', error)
      } finally {
        this.isLoading = false
      }
    },

    async addCustomer(customerData: Customer) {
      this.isLoading = true
      try {
        const res = await api.request('POST', `customers/`, customerData)
        this.list_customers() // refresh after adding
        return { success: true }
      } catch (error: any) {
        console.error('Error adding customer:', error)
        return { success: false, error: error.message }
      } finally {
        this.isLoading = false
      }
    },

    async updateCustomer(customerId: string, updates: Partial<Customer>) {
      this.isLoading = true
      try {
        const company_id = useAuthStore().user?.company_id
        
        // remove campos que não são aceitos no schema
        const { id, company_id: _, created_at, updated_at, ...allowedUpdates } = updates
        
        const res = await api.request('PUT', `customers/${company_id}/${customerId}`, allowedUpdates)

        const index = this.customers.findIndex(c => c.id === customerId)
        if (index !== -1) this.customers[index] = { ...this.customers[index], ...allowedUpdates }

        return { success: true }
      } catch (error: any) {
        console.error('Error updating customer:', error)
        return { success: false, error: error.message }
      } finally {
        this.isLoading = false
      }
    },

    async deleteCustomer(customerId: string) {
      this.isLoading = true
      try {
        const company_id = useAuthStore().user?.company_id
        await api.request('DELETE', `customers/${company_id}/${customerId}`)
        const index = this.customers.findIndex(c => c.id === customerId)
        if (index !== -1) this.customers.splice(index, 1)
        return { success: true }
      } catch (error: any) {
        console.error('Error deleting customer:', error)
        return { success: false, error: error.message }
      } finally {
        this.isLoading = false
      }
    }
  }
})
