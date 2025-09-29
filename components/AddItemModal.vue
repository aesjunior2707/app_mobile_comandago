<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50"
  >
    <div
      :class="[
        'bg-white w-full sm:max-w-lg sm:mx-4 rounded-t-2xl sm:rounded-2xl overflow-y-auto transition-all duration-300',
        isKeyboardVisible ? 'modal-keyboard-adjusted' : 'max-h-[90vh]'
      ]"
      :style="modalStyles"
    >
      <!-- Header -->
      <div
        class="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-2xl"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">
            {{
              category.selected ? category.description : "Adicionar novo item"
            }}
          </h3>
          <button
            @click="$emit('close')"
            class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-4">
        <!-- Category Selection -->
        <div v-if="!category.selected">
          <h4 class="text-base font-medium text-gray-700 mb-4">Categoria</h4>
          
          <!-- Search Categories -->
          <SearchInput
            v-model="categorySearch"
            placeholder="Pesquisar categoria..."
            size="sm"
            inputmode="search"
            aria-label="Pesquisar categorias"
            class="mb-4"
            @clear="categorySearch = ''"
          />
          
          <!-- Categories Grid -->
          <div v-if="filteredCategories.length > 0" class="grid grid-cols-2 gap-3">
            <button
              v-for="category in filteredCategories"
              :key="category.id"
              @click="onClickSelectCategory(category)"
              class="p-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-center font-medium text-gray-700 transition-colors duration-200 active:scale-95"
            >
              {{ category.description }}
            </button>
          </div>
          
          <!-- No Categories Found -->
          <div v-else-if="categorySearch && filteredCategories.length === 0" class="text-center py-8">
            <SearchIcon class="w-8 h-8 mx-auto mb-3 text-gray-300" />
            <p class="text-gray-500 mb-2">Nenhuma categoria encontrada</p>
            <p class="text-gray-400 text-sm mb-4">Tente pesquisar por outro termo</p>
            <button
              @click="categorySearch = ''"
              class="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
            >
              Ver todas
            </button>
          </div>
        </div>

        <!-- Product Selection -->
        <div v-else>
          <!-- Back to Categories -->
          <div class="flex items-center mb-4">
            <button
              @click="onClickBackToCategories"
              class="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon class="w-5 h-5" />
            </button>
            <span class="text-sm text-gray-600 ml-2"
              >Voltar para categorias</span
            >
          </div>
          
          <!-- Search Products -->
          <SearchInput
            v-model="productSearch"
            placeholder="Pesquisar produto..."
            size="sm"
            inputmode="search"
            aria-label="Pesquisar produtos"
            class="mb-4"
            @clear="productSearch = ''"
          />

          <!-- Product List -->
          <div v-if="filteredProducts.length > 0" class="space-y-3">
            <div
              v-for="product in filteredProducts"
              :key="product.id"
              @click="selectProduct(product)"
            >
              <button
                v-if="!product.subcategory_id || show_product_subs_cateogory"
                class="w-full flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div class="flex-1">
                  <div class="font-medium text-gray-900">
                    {{ product.description }}
                  </div>
                  <div
                    class="text-sm text-gray-600"
                    v-if="!product.subcategory_id_menu"
                  >
                    R${{ product.price.toFixed(2) }}
                  </div>
                </div>
                <ArrowRightIcon class="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
          
          <!-- No Products Found -->
          <div v-else-if="productSearch && filteredProducts.length === 0" class="text-center py-8">
            <SearchIcon class="w-8 h-8 mx-auto mb-3 text-gray-300" />
            <p class="text-gray-500 mb-2">Nenhum produto encontrado</p>
            <p class="text-gray-400 text-sm mb-4">Tente pesquisar por outro termo</p>
            <button
              @click="productSearch = ''"
              class="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
            >
              Ver todos
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Details Modal -->
    <ProductDetailsModal
      v-if="selectedProduct"
      :product="selectedProduct"
      :table="table"
      @close="selectedProduct = null"
      @add="handleAddProduct"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { XIcon, ArrowLeftIcon, ArrowRightIcon, SearchIcon } from "lucide-vue-next";
import { useRestaurantStore } from "~/stores/restaurant";
import SearchInput from './SearchInput.vue';
import { useKeyboardDetection } from '~/composables/useKeyboardDetection';

const props = defineProps(["table"]);

const emit = defineEmits(["close", "add"]);

const restaurantStore = useRestaurantStore();

// Keyboard detection
const { isKeyboardVisible, getModalMaxHeight, getModalBottomOffset } = useKeyboardDetection();

const category = ref({
  selected: false,
  description: "",
  id: null,
});

const selectedProduct = ref(null);
const categorySearch = ref('');
const productSearch = ref('');
const show_product_subs_cateogory = ref(false);

// Modal styles for keyboard adjustment
const modalStyles = computed(() => {
  if (isKeyboardVisible.value) {
    return {
      maxHeight: `${getModalMaxHeight()}px`,
      marginBottom: `${getModalBottomOffset()}px`,
      transform: 'none'
    }
  }
  return {}
});

const categories = computed(() => restaurantStore.categories);
const products = computed(() => restaurantStore.products);

// Filtered categories based on search
const filteredCategories = computed(() => {
  if (!categorySearch.value.trim()) {
    return categories.value
  }
  
  const query = categorySearch.value.toLowerCase().trim()
  return categories.value.filter(cat => 
    cat.description?.toLowerCase().includes(query)
  )
})

// Filtered products based on search, sorted by price (highest to lowest)
const filteredProducts = computed(() => {
  let filteredList = products.value

  if (productSearch.value.trim()) {
    const query = productSearch.value.toLowerCase().trim()
    filteredList = products.value.filter(product => {
      const description = product.description?.toLowerCase() || ''
      const price = product.price?.toString() || ''

      return description.includes(query) || price.includes(query)
    })
  }

  // Sort by price from highest to lowest
  return filteredList.sort((a, b) => (b.price || 0) - (a.price || 0))
})

const onClickSelectCategory = async (pcategory) => {
  await restaurantStore.getProductsCategory(pcategory.id).then(() => {
    category.value.selected = true;
    category.value.description = pcategory.description;
    category.value.id = pcategory.id;
  });
};

const onClickBackToCategories = () => {
  show_product_subs_cateogory.value = false;
  category.value.selected = false;
  category.value.description = "";
  category.value.id = null;
  productSearch.value = ''; // Clear product search when going back
};

// Watch for category selection to clear searches
watch(() => category.value.selected, (newVal) => {
  if (!newVal) {
    categorySearch.value = ''
    productSearch.value = ''
  }
})

const selectProduct = async (product) => {
  if (!product.subcategory_id_menu) {
    selectedProduct.value = product;
  } else {
    await restaurantStore
      .getProductsCategory(product.category_id, product.subcategory_id_menu)
      .then(() => {
        show_product_subs_cateogory.value = true;
      });
  }
};

const handleAddProduct = (
  productId,
  product_description,
  price,
  quantity,
  observation
) => {
  console.log("Adding product:", {
    productId,
    product_description,
    quantity,
    observation,
  });
  emit("add", productId, product_description, price, quantity, observation);
  selectedProduct.value = null;
};
</script>

<style scoped>
.modal-keyboard-adjusted {
  /* Ensure smooth transitions when keyboard appears/disappears */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Ensure the modal container maintains proper positioning */
@media (max-width: 640px) {
  .modal-keyboard-adjusted {
    position: relative;
    transform: none !important;
  }
}

/* Improve scrolling behavior when keyboard is visible */
.modal-keyboard-adjusted .overflow-y-auto {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer/Edge */
}

.modal-keyboard-adjusted .overflow-y-auto::-webkit-scrollbar {
  display: none; /* WebKit browsers */
}

/* Ensure input focus is visible when keyboard appears */
.modal-keyboard-adjusted input:focus,
.modal-keyboard-adjusted textarea:focus {
  transform: translateY(0);
  z-index: 10;
}
</style>
