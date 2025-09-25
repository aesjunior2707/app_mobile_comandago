import { ref, computed } from 'vue'

/**
 * Composable para gerenciar funcionalidades de pesquisa
 * @param {Array|Ref} items - Array ou ref reativo dos itens para filtrar
 * @param {Function} filterFn - Função que define como filtrar os itens
 * @param {Object} options - Opções adicionais
 * @returns {Object} Objeto com estado e métodos de pesquisa
 */
export function useSearch(items, filterFn, options = {}) {
  const {
    debounce = 300,
    initialQuery = '',
    caseSensitive = false,
    minLength = 0
  } = options

  const searchQuery = ref(initialQuery)
  const isSearching = ref(false)
  let debounceTimer = null

  // Filtered items based on search query
  const filteredItems = computed(() => {
    const query = searchQuery.value?.trim() || ''
    
    // If query is too short, return all items
    if (query.length < minLength) {
      return Array.isArray(items) ? items : items.value || []
    }

    const searchTerm = caseSensitive ? query : query.toLowerCase()
    const itemsArray = Array.isArray(items) ? items : items.value || []

    return itemsArray.filter(item => {
      try {
        return filterFn(item, searchTerm, { caseSensitive })
      } catch (error) {
        console.warn('Search filter function error:', error)
        return false
      }
    })
  })

  // Search statistics
  const searchStats = computed(() => ({
    total: Array.isArray(items) ? items.length : items.value?.length || 0,
    filtered: filteredItems.value.length,
    hasFilter: searchQuery.value.trim().length > 0,
    percentage: filteredItems.value.length / (Array.isArray(items) ? items.length : items.value?.length || 1) * 100
  }))

  // Debounced search function
  const debouncedSearch = (query, callback) => {
    isSearching.value = true
    
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = setTimeout(() => {
      searchQuery.value = query
      isSearching.value = false
      if (callback && typeof callback === 'function') {
        callback(query)
      }
    }, debounce)
  }

  // Clear search
  const clearSearch = () => {
    searchQuery.value = ''
    isSearching.value = false
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
  }

  // Set search query directly (no debounce)
  const setSearchQuery = (query) => {
    searchQuery.value = query
  }

  // Search methods for common use cases
  const searchInText = (text, query, options = {}) => {
    if (!text || !query) return false
    const searchText = options.caseSensitive ? text : text.toLowerCase()
    const searchQuery = options.caseSensitive ? query : query.toLowerCase()
    return searchText.includes(searchQuery)
  }

  const searchInMultipleFields = (item, fields, query, options = {}) => {
    return fields.some(field => {
      const value = getNestedValue(item, field)
      return value && searchInText(String(value), query, options)
    })
  }

  // Helper to get nested object values
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  return {
    // State
    searchQuery,
    isSearching,
    filteredItems,
    searchStats,

    // Methods
    debouncedSearch,
    clearSearch,
    setSearchQuery,
    
    // Utilities
    searchInText,
    searchInMultipleFields,
    getNestedValue
  }
}

/**
 * Pre-configured search functions for common use cases
 */
export const searchPresets = {
  // Search for tables
  tables: (table, query) => {
    const fields = ['description', 'status']
    return searchPresets.multiField(table, fields, query)
  },

  // Search for products
  products: (product, query) => {
    const fields = ['description', 'price']
    return searchPresets.multiField(product, fields, query) ||
           String(product.price || '').includes(query)
  },

  // Search for categories
  categories: (category, query) => {
    return searchPresets.text(category.description, query)
  },

  // Search for sales records
  salesRecords: (record, query) => {
    const fields = [
      'table_id',
      'total_amount',
      'user_name',
      'identification_nfce'
    ]
    
    // Search in basic fields
    const basicMatch = searchPresets.multiField(record, fields, query)
    
    // Search in product descriptions
    const productMatch = record.itens?.some(item => 
      searchPresets.text(item.product_description, query)
    )
    
    return basicMatch || productMatch
  },

  // Generic text search
  text: (text, query, options = {}) => {
    if (!text || !query) return false
    const searchText = options.caseSensitive ? String(text) : String(text).toLowerCase()
    const searchQuery = options.caseSensitive ? query : query.toLowerCase()
    return searchText.includes(searchQuery)
  },

  // Multi-field search
  multiField: (item, fields, query, options = {}) => {
    return fields.some(field => {
      const value = field.split('.').reduce((current, key) => current?.[key], item)
      return value && searchPresets.text(value, query, options)
    })
  }
}

/**
 * Hook for mobile-optimized search
 */
export function useMobileSearch(items, filterFn, options = {}) {
  const mobileOptions = {
    debounce: 200, // Faster response on mobile
    minLength: 1,   // Start searching immediately
    ...options
  }

  const search = useSearch(items, filterFn, mobileOptions)

  // Mobile-specific enhancements
  const isMobileView = computed(() => {
    return window.innerWidth < 768
  })

  return {
    ...search,
    isMobileView
  }
}
