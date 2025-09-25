import { defineStore } from 'pinia'

import HttpRequest from '~/services/request'

import { useAuthStore } from '~/stores/auth'
import type { Customer } from '~/stores/customers'

const http = new HttpRequest()
export interface MenuItem {
  id: string
  name: string
  price: number
  category: string
}

export interface Products {
  id: string
  category_id: string
  company_id: number
  created_at: string
  description: string
  price: number
  updated_at: string
  subcategory_id?: string | null
  subcategory_id_menu?: string | null
}


export interface Category {
  id: string
  description: string
}


export interface Order {
  company_id: string
  created_at: string
  id: string
  note: string
  product_description: string
  product_id: string
  quantity: number
  status: string,
  table_id: string
  total_price: number
  unit_price: number
  updated_at: string
  user_id: string
  user_name: string
}

export interface OrderItem {
  id: string
  menuItem: MenuItem
  quantity: number
  observation: string
  addedAt: Date
}




export interface PendingItem {
  id: string
  menuItem: MenuItem
  quantity: number
  observation: string
  addedAt: Date
}

export interface Table {
  id: string
  number: number
  description: string
  status: 'available' | 'occupied'
  items: OrderItem[]
  pendingItems: PendingItem[]
  total: number
  pendingTotal: number
}

export interface InvoiceData {
  documentType: string
  documentNumber: string
  customerName: string
  customerEmail: string
  issuedAt: Date
}

export interface ClosedTable {
  id: string
  tableNumber: number
  items: OrderItem[]
  total: number
  serviceCharge: number
  finalTotal: number
  closedAt: Date
  waiter: string
  paymentMethod: string
  invoice?: InvoiceData
}

export interface SalesRecord {
  id: string,
  company_id: string,
  table_id: string,
  payment_type: string,
  itens: [],
  user_id: string,
  user_name: string,
  total_amount: number,
  type_customer : string,
  identification_nfce: string,
  issues_invoice : boolean,
  created_at: string,
  updated_at: string
}

export const useRestaurantStore = defineStore('restaurant', {
  state: () => ({
    tables: [] as Table[],
    categories: [] as Category[],
    products: [] as Products[],
    pendingItems: [] as Order[],
    ItemsConfirmed: [] as Order[],
    SalesRecords: [] as SalesRecord[],
    pendingTotal: 0,
    menuItems: [] as MenuItem[],
    closedTables: [] as ClosedTable[],
    selectedTable: null as Table | null,
    deliveryOpenTables: {} as Record<string, string>,
  }),

  actions: {

    async initializeTables() {
      try {
        const res = await http.request('GET', `company-tables/${useAuthStore().user?.company_id}`)

        const tablesData = (res.data as { data: Table[] }).data;

        this.tables = tablesData.map((table: Table) => ({
          id: table.id,
          number: table.number,
          description: table.description || '',
          status: table.status || 'available',
          items: table.items || [],
          pendingItems: table.pendingItems || [],
          total: table.total || 0,
          pendingTotal: table.pendingTotal || 0
        }))


        return true

      }
      catch (error) {
        console.error('Error initializing tables:', error)
        return false
      }
    },


    initializeMenuItems() {
      if (this.menuItems.length === 0) {
        this.menuItems = [

        ]
      }
    },

    async selectTable(tableId: string) {
      // Reset transient order state when switching tables
      this.pendingItems = []
      this.pendingTotal = 0
      this.ItemsConfirmed = []

      this.selectedTable = this.tables.find(t => t.id === tableId) || null
      try {
        const res = await http.request('GET', `company-orders/${useAuthStore().user?.company_id}?table=${tableId}`)

        const responseData = res.data as { data: Order[] };
        this.ItemsConfirmed = responseData.data.map(order => ({
          id: order.id,
          company_id: order.company_id,
          created_at: order.created_at,
          note: order.note,
          product_description: order.product_description,
          product_id: order.product_id,
          quantity: order.quantity,
          status: order.status,
          table_id: order.table_id,
          total_price: order.total_price,
          unit_price: order.unit_price,
          updated_at: order.updated_at,
          user_id: order.user_id,
          user_name: order.user_name
        }))
      }
      catch (error) {
        console.error('Error fetching orders for table:', error)
      }
    },

    async setDeliveryCustomer(customer: Customer) {
      const companyId = useAuthStore().user?.company_id || ''
      this.loadDeliveryOpenTables(companyId)
      const existingId = this.deliveryOpenTables[customer.id]

      // Create a virtual table for delivery and reset order context
      const deliveryTable = {
        id: existingId || `delivery-${customer.id}`,
        number: 999,
        description: `Delivery - ${customer.customer_name}`,
        status: 'available' as const,
        items: [],
        pendingItems: [],
        total: 0,
        pendingTotal: 0,
        customer
      }

      this.pendingItems = []
      this.pendingTotal = 0
      this.ItemsConfirmed = []
      this.selectedTable = deliveryTable

      // If there is an existing open delivery table id, validate and fetch its orders
      if (existingId) {
        try {
          const res = await http.request('GET', `company-orders/${companyId}?table=${existingId}`)
          const orders = (res.data as { data: Order[] }).data

          // Filter for active orders only
          const activeOrders = orders?.filter(order =>
            order.status && !['closed', 'completed', 'paid'].includes(order.status.toLowerCase())
          ) || []

          if (activeOrders.length > 0) {
            this.ItemsConfirmed = activeOrders.map(order => ({
              id: order.id,
              company_id: order.company_id,
              created_at: order.created_at,
              note: order.note,
              product_description: order.product_description,
              product_id: order.product_id,
              quantity: order.quantity,
              status: order.status,
              table_id: order.table_id,
              total_price: order.total_price,
              unit_price: order.unit_price,
              updated_at: order.updated_at,
              user_id: order.user_id,
              user_name: order.user_name
            }))
          } else {
            // No active orders found, clear the mapping
            delete this.deliveryOpenTables[customer.id]
            this.saveDeliveryOpenTables(companyId)
            // Update table ID to new one since old mapping was invalid
            deliveryTable.id = `delivery-${customer.id}`
            this.selectedTable = deliveryTable
          }
        } catch (e) {
          console.error('Error fetching delivery orders:', e)
          // Clear invalid mapping on error
          delete this.deliveryOpenTables[customer.id]
          this.saveDeliveryOpenTables(companyId)
        }
      }
    },

    async selectDeliveryByTableId(customer: Customer, tableId: string) {
      const deliveryTable = {
        id: tableId,
        number: 999,
        description: `Delivery - ${customer.customer_name}`,
        status: 'available' as const,
        items: [],
        pendingItems: [],
        total: 0,
        pendingTotal: 0,
        customer
      }

      this.selectedTable = deliveryTable
      this.pendingItems = []
      this.pendingTotal = 0
      this.ItemsConfirmed = []

      try {
        const res = await http.request('GET', `company-orders/${useAuthStore().user?.company_id}?table=${tableId}`)
        const responseData = res.data as { data: Order[] };
        this.ItemsConfirmed = responseData.data.map(order => ({
          id: order.id,
          company_id: order.company_id,
          created_at: order.created_at,
          note: order.note,
          product_description: order.product_description,
          product_id: order.product_id,
          quantity: order.quantity,
          status: order.status,
          table_id: order.table_id,
          total_price: order.total_price,
          unit_price: order.unit_price,
          updated_at: order.updated_at,
          user_id: order.user_id,
          user_name: order.user_name
        }))
      } catch (e) {
        console.error('Error fetching orders for existing delivery table:', e)
      }
    },

    async addPendingItemToTable(order: Order) {
      if (order) {
        order.id = `ORD-${Date.now()}-${Math.random()}`

        console.log('Adding pending item to table:', order)
        this.pendingItems.push(order)
        this.updateTablePendingTotal()

        this.tables = this.tables.map(table => {
          if (table.id === order.table_id) {
            return {
              ...table,
              status: 'pedding' // ou 'occupied', conforme necessário
            }
          }
          return table
        })
      }
    },

    removePendingItemFromTable(pendingItemId: string) {
      this.pendingItems = this.pendingItems.filter(item => item.id !== pendingItemId)
      this.updateTablePendingTotal()
    },

    async sendPendingItems() {
      try {
        // Detect delivery context and create a random table id just-in-time
        const isDelivery = !!(this.selectedTable && typeof this.selectedTable.id === 'string' && this.selectedTable.id.startsWith('delivery-'))
        const deliveryTableId = isDelivery ? `DLV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` : null
        const tableIdForPayload = String(deliveryTableId ?? this.selectedTable?.id ?? this.pendingItems[0]?.table_id ?? '')

        // Keep store consistent for any follow-up actions
        if (deliveryTableId && this.selectedTable) {
          this.selectedTable.id = tableIdForPayload
          const companyId = useAuthStore().user?.company_id || ''
          const customerId = (this.selectedTable as any)?.customer?.id
          if (customerId) {
            this.loadDeliveryOpenTables(companyId)
            this.deliveryOpenTables[customerId] = tableIdForPayload
            this.saveDeliveryOpenTables(companyId)
          }
        }

        // Prepare minimal, validated payload for API
        const payload = this.pendingItems.map((o) => ({
          id: String(o.id || `ORD-${Date.now()}-${Math.random().toString(36).slice(2,8)}`),
          company_id: String(o.company_id),
          table_id: tableIdForPayload,
          user_id: String(o.user_id),
          product_id: String(o.product_id),
          product_description: String(o.product_description || ''),
          unit_price: Number(o.unit_price),
          quantity: parseInt(String(o.quantity), 10),
          total_price: Number(o.total_price ?? (Number(o.unit_price) * Number(o.quantity))),
          note: o.note ?? null,
          user_name: String(o.user_name || ''),
          status: (o.status === 'open' || o.status === 'closed' || o.status === 'peding') ? o.status : 'peding'
        }))

        await http.request('POST', `company-orders/`, payload)
        this.pendingItems = []
        this.pendingTotal = 0

        return true
      } catch (error) {
        console.error('Error sending pending items:', error)
        throw error
      }

    },

    clearPendingItems() {
      this.pendingItems = []
      this.pendingTotal = 0
    },

    async addItemToTable(order: Order) {
      this.addPendingItemToTable(order)
    },

    async removeItemFromTable(orderItemId: string) {
      try {
        http.request('DELETE', `company-orders/${useAuthStore().user?.company_id}/${orderItemId}`).then(() => {
          this.selectTable(this.selectedTable?.id || '')
        })
      }
      catch (error) {
        console.error('Error removing item from table:', error)
      }


      //this.updateTableTotal(tableId)

    },

    updateTableTotal(tableId: string) {
      const table = this.tables.find(t => t.id === tableId)
      if (table) {
        table.total = table.items.reduce((sum, item) =>
          sum + (item.menuItem.price * item.quantity), 0
        )
      }
    },

    updateTablePendingTotal() {
      this.pendingTotal = this.pendingItems.reduce((sum, item) =>
        sum + (item.unit_price * item.quantity), 0
      );
    },

    closeTable(tableId: string, waiterName: string, paymentMethod: string, invoiceData: InvoiceData | null = null) {
      const table = this.tables.find(t => t.id === tableId)
      if (table && table.items.length > 0) {
        const serviceCharge = table.total * 0.10
        const finalTotal = table.total + serviceCharge

        const closedTable: ClosedTable = {
          id: `closed-${Date.now()}`,
          tableNumber: table.number,
          items: [...table.items],
          total: table.total,
          serviceCharge: serviceCharge,
          finalTotal: finalTotal,
          closedAt: new Date(),
          waiter: waiterName,
          paymentMethod: paymentMethod,
          invoice: invoiceData || undefined
        }

        this.closedTables.unshift(closedTable)

        // Reset table
        table.items = []
        this.pendingItems = []
        table.total = 0
        this.pendingTotal = 0
        table.status = 'available'

        if (this.selectedTable?.id === tableId) {
          this.selectedTable = table
        }
      }
    },
    async getCategorysCompany() {
      try {
        const res = await http.request('GET', `company-category/${useAuthStore().user?.company_id}`)

        const categoriesData = (res.data as { data: { id: string, description: string }[] }).data;

        this.categories = categoriesData.map(category => ({
          id: category.id,
          description: category.description
        }));
      }
      catch (error) {
        console.error('Error getting categories:', error)
        return []
      }
    },

    async getProductsCategory(categoryId: string, subcategory_id: string = '') {
      try {
        console.log('Fetching products for category ID:', categoryId)

        const res = await http.request('GET', !subcategory_id ? `company-products/${useAuthStore().user?.company_id}/${categoryId}` :
          `company-products/${useAuthStore().user?.company_id}/${categoryId}?subcategory_id=${subcategory_id}`)

        const productsData = (res.data as { data: Products[] }).data;

        console.log('Products data:', productsData)
        this.products = productsData.map(product => ({
          id: product.id,
          category_id: product.category_id,
          company_id: product.company_id,
          created_at: product.created_at,
          description: product.description,
          price: product.price,
          updated_at: product.updated_at,
          subcategory_id: product.subcategory_id || null,
          subcategory_id_menu: product.subcategory_id_menu || null
        }));



        console.log('Products by category:', this.products)
        return this.products
      }
      catch (error) {
        console.error('Error getting products by category:', error)
      }
    },

    getTotalTable(): number {
      if (this.ItemsConfirmed.length === 0) {
        return 0;
      }

      return this.ItemsConfirmed.reduce((total, item) => {
        return total + (item.unit_price * item.quantity);
      }, 0);
    },
    async create_sales_record(sales: SalesRecord) {
      try {
        const res = await http.request('POST', `company-salesrecords/`, sales)
        return res.data
      } catch (error) {
        console.error('Error creating sales record:', error)
        throw error
      }

    },
    async get_sales_records(pdata_params: String = '') {
      try {
        const res = await http.request('GET', !pdata_params ? `company-salesrecords/${useAuthStore().user?.company_id}` :
          `company-salesrecords/${useAuthStore().user?.company_id}?created_at=${pdata_params}`)

        this.SalesRecords = []

        const salesData = (res.data as { data: SalesRecord[] }).data

        this.SalesRecords = salesData.map(sale => ({
          id: sale.id,
          company_id: sale.company_id,
          table_id: sale.table_id,
          payment_type: sale.payment_type,
          itens: sale.itens,
          user_id: sale.user_id,
          user_name: sale.user_name,
          total_amount: sale.total_amount,
          type_customer: sale.type_customer,
          identification_nfce: sale.identification_nfce,
          issues_invoice: sale.issues_invoice,
          created_at: sale.created_at,
          updated_at: sale.updated_at
        }))
      } catch (error) {
        console.error('Error getting sales records:', error)
        throw error
      }
    },
    async printPartialReceipt(content : any) {
      await http.request('POST', `print-partial/`, content)
    },

    async deleteAllOrdersForTable(tableId: string) {
      try {
        const companyId = useAuthStore().user?.company_id
        if (!companyId || !tableId) return
        await http.request('DELETE', `company-orders/${companyId}/table/${tableId}`)
      } catch (e) {
        console.warn('Failed to delete all orders for table:', e)
      }
    },

    clearDeliveryMapping(tableId?: string, customerId?: string) {
      const companyId = useAuthStore().user?.company_id || ''
      this.loadDeliveryOpenTables(companyId)
      if (customerId && this.deliveryOpenTables[customerId]) {
        delete this.deliveryOpenTables[customerId]
      } else if (tableId) {
        for (const [cid, tid] of Object.entries(this.deliveryOpenTables)) {
          if (tid === tableId) {
            delete this.deliveryOpenTables[cid]
            break
          }
        }
      }
      this.saveDeliveryOpenTables(companyId)
    },

    loadDeliveryOpenTables(companyId: string) {
      if (process.client) {
        try {
          const raw = localStorage.getItem(`delivery_open_tables_${companyId}`)
          this.deliveryOpenTables = raw ? JSON.parse(raw) : {}
        } catch (e) {
          this.deliveryOpenTables = {}
        }
      }
    },

    saveDeliveryOpenTables(companyId: string) {
      if (process.client) {
        localStorage.setItem(`delivery_open_tables_${companyId}`, JSON.stringify(this.deliveryOpenTables))
      }
    },

    async validateAndCleanDeliveryMappings() {
      const companyId = useAuthStore().user?.company_id
      if (!companyId) return

      this.loadDeliveryOpenTables(companyId)
      const mappingsToRemove: string[] = []

      // Check each mapped delivery table for actual active orders
      for (const [customerId, tableId] of Object.entries(this.deliveryOpenTables)) {
        try {
          const res = await http.request('GET', `company-orders/${companyId}?table=${tableId}`)
          const orders = (res.data as { data: Order[] }).data

          // Filter for active orders (not closed/completed)
          const activeOrders = orders?.filter(order =>
            order.status && !['closed', 'completed', 'paid'].includes(order.status.toLowerCase())
          ) || []

          // If no active orders found, mark for removal
          if (activeOrders.length === 0) {
            mappingsToRemove.push(customerId)
            console.log(`Removing stale delivery mapping for customer ${customerId}, table ${tableId}`)
          }
        } catch (e) {
          // If API call fails, also mark for removal
          console.warn(`Failed to validate delivery table ${tableId} for customer ${customerId}:`, e)
          mappingsToRemove.push(customerId)
        }
      }

      // Remove stale mappings
      mappingsToRemove.forEach(customerId => {
        delete this.deliveryOpenTables[customerId]
      })

      if (mappingsToRemove.length > 0) {
        this.saveDeliveryOpenTables(companyId)
      }
    }
  }

})
