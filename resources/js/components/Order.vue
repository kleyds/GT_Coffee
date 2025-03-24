<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';

const API_BASE_URL = "http://localhost:3000";

// Temporary variable to store products
let tempProducts: { product: string; quantity: number; amount: number }[] = [];

export default defineComponent({
  name: 'Order',
  setup() {
    const showModal = ref(false);
    const products = ref(tempProducts);
    const availableProducts = ref<{ name: string; price: number; ingredients: { name: string; qty: number }[] }[]>([]);
    const newProduct = ref({ product: '', quantity: 0, amount: 0 });
    const editIndex = ref<number | null>(null);

    // Fetch products from the database (including ingredients)
    const fetchProducts = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();

        // Map and sort products alphabetically with explicit typing
        availableProducts.value = data
        .map((prod: any): { name: string; price: number; ingredients: { name: string; qty: number }[] } => ({
            name: prod.name,
            price: prod.price,
            ingredients: Array.from({ length: 8 }, (_, i) => ({
            name: prod[`ingredient${i + 1}`] || '',
            qty: prod[`ingredient${i + 1}_qty`] || 0,
            })).filter(ing => ing.name && ing.qty > 0),
        }))
        .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)); // Explicitly typed parameters
    } catch (error) {
        console.error("Error fetching products:", error);
        alert("Failed to load products for order.");
    }
    };



    // Computed property to calculate total amount for the modal
    const calculatedAmount = computed(() => {
      const selectedProduct = availableProducts.value.find(p => p.name === newProduct.value.product);
      const price = selectedProduct ? selectedProduct.price : 0;
      return price * newProduct.value.quantity;
    });

    // Computed property to calculate total amount of all products in the table
    const totalAmount = computed(() => {
      return products.value.reduce((sum, item) => sum + item.amount, 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
    });

    const addProduct = () => {
      if (!newProduct.value.product || newProduct.value.quantity <= 0) {
        alert("Please select a product and enter a quantity greater than 0.");
        return;
      }
      const selectedProduct = availableProducts.value.find(p => p.name === newProduct.value.product);
      if (!selectedProduct) {
        alert("Please select a valid product from the list.");
        return;
      }

      const amount = selectedProduct.price * newProduct.value.quantity;
      const productEntry = { product: newProduct.value.product, quantity: newProduct.value.quantity, amount };

      if (editIndex.value !== null) {
        products.value[editIndex.value] = productEntry;
        editIndex.value = null;
      } else {
        products.value.push(productEntry);
      }
      tempProducts = [...products.value];
      resetForm();
    };

    const editProduct = (index: number) => {
      newProduct.value = { ...products.value[index] };
      editIndex.value = index;
      showModal.value = true;
    };

    const deleteProduct = (index: number) => {
      products.value.splice(index, 1);
      tempProducts = [...products.value];
    };

    const resetForm = () => {
      newProduct.value = { product: '', quantity: 0, amount: 0 };
      showModal.value = false;
    };

    const checkout = async () => {
      if (products.value.length === 0) {
        alert("No products to checkout.");
        return;
      }

      try {
        // Prepare order data with ingredient deductions
        const orderData = products.value.map(order => {
          const product = availableProducts.value.find(p => p.name === order.product);
          if (!product) throw new Error(`Product ${order.product} not found`);
          
          // Calculate ingredient deductions based on quantity ordered
          const deductions = product.ingredients.map(ing => ({
            name: ing.name,
            qty: ing.qty * order.quantity, // Multiply ingredient qty by ordered qty
          }));

          return {
            product: order.product,
            quantity: order.quantity,
            amount: order.amount,
            deductions,
          };
        });

        // Send checkout request to the server
        const response = await fetch(`${API_BASE_URL}/checkout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orders: orderData }),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const result = await response.json();
        alert(result.message);
        products.value = [];
        tempProducts = []; // Clear after successful checkout
      } catch (error) {
        alert("Checkout failed. Please try again.");
        console.error("Checkout error:", error);
      }
    };

    onMounted(fetchProducts);

    return { 
      showModal, 
      products, 
      availableProducts, 
      newProduct, 
      totalAmount, 
      addProduct, 
      editProduct, 
      deleteProduct, 
      resetForm, 
      checkout, 
      editIndex,
      calculatedAmount
    };
  }
});
</script>

<template>
  <div class="px-6 pt-10 flex flex-col h-full">
    <!-- Title and Controls Container -->
    <div class="flex-shrink-0">
      <h2 class="text-3xl font-extrabold text-center mb-6 text-gray-800 tracking-wide font-serif italic select-none">
        New Order
      </h2>

      <!-- Controls (Add Order, Total, Checkout) -->
      <div class="flex justify-between items-center mb-2">
        <button @click="showModal = true" class="bg-blue-500 text-white px-4 py-2 rounded-lg shadow select-none">
          + Add Order
        </button>
        <div class="flex items-center space-x-10">
          <div class="text-lg font-semibold">
            Total: <span class="text-green-600">{{ totalAmount }}</span>
          </div>
          <button @click="checkout" class="bg-green-500 text-white px-4 py-2 rounded-lg shadow select-none">
            Checkout
          </button>
        </div>
      </div>
    </div>

    <!-- Scrollable Table Container -->
    <div class="flex-grow max-h-[calc(100vh-18rem)] overflow-y-auto">
      <table class="w-full border-collapse border border-gray-300">
        <thead class="bg-gray-100 sticky top-0 z-10">
          <tr>
            <th class="border border-gray-300 p-2 w-[40%] text-left">Product</th>
            <th class="border border-gray-300 p-2 w-[20%] text-center">Quantity</th>
            <th class="border border-gray-300 p-2 w-[20%] text-center">Amount</th>
            <th class="border border-gray-300 p-2 w-[20%] text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in products" :key="index">
            <td class="border border-gray-300 p-2 w-[40%] text-left">{{ item.product }}</td>
            <td class="border border-gray-300 p-2 w-[20%] text-center">{{ item.quantity }}</td>
            <td class="border border-gray-300 p-2 w-[20%] text-center">₱{{ item.amount.toFixed(2) }}</td>
            <td class="border border-gray-300 p-2 w-[20%] text-center">
              <div class="flex justify-center items-center space-x-2">
                <button @click="editProduct(index)" class="text-yellow-500 hover:text-yellow-700">✏️</button>
                <button @click="deleteProduct(index)" class="text-red-500 hover:text-red-700">🗑️</button>
              </div>
            </td>
          </tr>
          <tr v-if="products.length === 0">
            <td colspan="4" class="border border-gray-300 p-2 text-center text-gray-500">No orders added</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-30">
      <div class="bg-white p-6 rounded-lg shadow-lg w-1/3 max-h-[90vh] flex flex-col">
        <h3 class="text-xl font-semibold mb-4">{{ editIndex !== null ? "Edit Order" : "Add Order" }}</h3>
        <div class="flex-1 overflow-y-auto space-y-4">
          <select 
            v-model="newProduct.product" 
            class="w-full p-2 border rounded"
            @change="newProduct.amount = calculatedAmount"
          >
            <option value="" disabled>Select a product</option>
            <option v-for="prod in availableProducts" :key="prod.name" :value="prod.name">
              {{ prod.name }} (₱{{ prod.price.toFixed(2) }})
            </option>
          </select>
          <input 
            v-model.number="newProduct.quantity" 
            type="number" 
            placeholder="Quantity" 
            class="w-full p-2 border rounded appearance-none"
            step="1"
            min="0"
            @input="newProduct.amount = calculatedAmount"
          />
          <input 
            v-model.number="newProduct.amount" 
            type="number" 
            placeholder="Total Amount" 
            class="w-full p-2 border rounded appearance-none"
            step="0.01"
            min="0"
            readonly
          />
        </div>
        <div class="flex justify-end space-x-2 mt-4">
          <button @click="resetForm" class="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
          <button @click="addProduct" class="bg-blue-500 text-white px-4 py-2 rounded">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>