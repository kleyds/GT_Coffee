<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";

const API_BASE_URL = "http://localhost:3000";

export default defineComponent({
  name: "Products",
  setup() {
    const products = ref<{ id: number; name: string; description: string; price: number; [key: string]: any }[]>([]);
    const supplies = ref<{ id: number; name: string }[]>([]);
    const showModal = ref(false);
    const isEditing = ref(false);
    const sortDirection = ref<"asc" | "desc" | null>(null);

    const newProduct = ref({
      id: undefined as number | undefined,
      name: "",
      description: "",
      price: "" as string | number,
      ingredients: Array.from({ length: 8 }, () => ({ name: "", qty: 0 })),
    });

    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        products.value = await response.json();
      } catch (error) {
        console.error("Error fetching products:", error);
        alert("Failed to load products.");
      }
    };

    const fetchSupplies = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/supplies`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        supplies.value = await response.json();
      } catch (error) {
        console.error("Error fetching supplies:", error);
        alert("Failed to load supplies.");
      }
    };

    const saveProduct = async () => {
      const { name, description, price, ingredients, id } = newProduct.value;

      if (!name.trim() || Number(price) <= 0) {
        alert("Please enter a valid product name and a price greater than 0.");
        return;
      }

      const filteredIngredients = ingredients.filter((ing) => ing.name.trim() && ing.qty > 0);

      const payload = { 
        name: name.trim(), 
        description: description.trim() || null, 
        price: +price, 
        ingredients: filteredIngredients 
      };

      const url = isEditing.value ? `${API_BASE_URL}/update-product/${id}` : `${API_BASE_URL}/add-product`;
      const method = isEditing.value ? "PUT" : "POST";

      try {
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(await response.text());

        alert(isEditing.value ? "Product updated successfully!" : "Product added successfully!");
        resetForm();
        await fetchProducts();
      } catch (error) {
        console.error(`Error ${isEditing.value ? "updating" : "saving"} product:`, error);
        alert(`Failed to ${isEditing.value ? "update" : "add"} product.`);
      }
    };

    const editProduct = (product: typeof products.value[number]) => {
      isEditing.value = true;
      showModal.value = true;
      newProduct.value = {
        id: product.id,
        name: product.name,
        description: product.description || "",
        price: product.price,
        ingredients: Array.from({ length: 8 }, (_, i) => ({
          name: product[`ingredient${i + 1}`] || "",
          qty: product[`ingredient${i + 1}_qty`] || 0,
        })),
      };
    };

    const deleteProduct = async (id: number) => {
      if (!confirm("Are you sure you want to delete this product?")) return;

      try {
        const response = await fetch(`${API_BASE_URL}/delete-product/${id}`, { method: "DELETE" });

        if (!response.ok) throw new Error(await response.text());

        alert("Product deleted successfully!");
        await fetchProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Failed to delete product.");
      }
    };

    const resetForm = () => {
      newProduct.value = { id: undefined, name: "", description: "", price: "", ingredients: Array.from({ length: 8 }, () => ({ name: "", qty: 0 })) };
      showModal.value = false;
      isEditing.value = false;
    };

    // Sorting function
    const sortByName = () => {
      if (sortDirection.value === "desc" || sortDirection.value === null) {
        products.value = [...products.value].sort((a, b) => a.name.localeCompare(b.name));
        sortDirection.value = "asc";
      } else {
        products.value = [...products.value].sort((a, b) => b.name.localeCompare(a.name));
        sortDirection.value = "desc";
      }
    };

    onMounted(() => {
      fetchProducts();
      fetchSupplies();
    });

    return { products, supplies, showModal, newProduct, saveProduct, editProduct, deleteProduct, isEditing, resetForm, sortByName, sortDirection };
  },
});
</script>

<template>
  <div class="px-6 pt-10 flex flex-col h-full">
    <div class="flex-shrink-0">
      <h2 class="text-3xl font-extrabold text-center mb-6 text-gray-800 tracking-wide font-serif italic select-none">
        List of Products
      </h2>
      <div class="flex justify-between items-center mb-2">
        <button @click="showModal = true; isEditing = false" class="bg-blue-500 text-white px-4 py-2 rounded-lg shadow select-none">
          + Add Product
        </button>
      </div>
    </div>

    <!-- Scrollable table container -->
    <div class="flex-grow max-h-[calc(100vh-18rem)] overflow-y-auto">
      <table class="w-full border-collapse border border-gray-300">
        <thead class="bg-gray-100 sticky top-0 z-10">
          <tr>
            <th class="border border-gray-300 p-2 w-[40%] text-left cursor-pointer select-none" @click="sortByName">
              Name
              <span v-if="sortDirection === 'asc'">🔼</span>
              <span v-if="sortDirection === 'desc'">🔽</span>
            </th>
            <th class="border border-gray-300 p-2 w-[30%] text-center">Description</th>
            <th class="border border-gray-300 p-2 w-[20%] text-center">Price</th>
            <th class="border border-gray-300 p-2 w-[10%] text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td class="border border-gray-300 p-2 text-left">{{ product.name }}</td>
            <td class="border border-gray-300 p-2 text-center">{{ product.description || "N/A" }}</td>
            <td class="border border-gray-300 p-2 text-center">₱{{ product.price.toFixed(2) }}</td>
            <td class="border border-gray-300 p-2 text-center">
              <div class="flex justify-center items-center space-x-2">
                <button @click="editProduct(product)" class="text-yellow-500 hover:text-yellow-700">✏️</button>
                <button @click="deleteProduct(product.id)" class="text-red-500 hover:text-red-700">🗑️</button>
              </div>
            </td>
          </tr>
          <tr v-if="products.length === 0">
            <td colspan="4" class="border border-gray-300 p-2 text-center text-gray-500">No products available</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-30">
      <div class="bg-white p-6 rounded-lg shadow-lg w-1/3 max-h-[90vh] flex flex-col">
        <h3 class="text-xl font-semibold mb-4">{{ isEditing ? "Edit Product" : "Add Product" }}</h3>
        <div class="flex-1 overflow-y-auto space-y-4">
          <input v-model="newProduct.name" placeholder="Product Name" class="w-full p-2 border rounded" />
          <textarea v-model="newProduct.description" placeholder="Description" class="w-full p-2 border rounded"></textarea>
          <input v-model.number="newProduct.price" type="number" placeholder="Price" class="w-full p-2 border rounded" step="0.01" min="0" />
          <label class="block font-bold">Ingredients:</label>
          <div v-for="(ingredient, index) in newProduct.ingredients" :key="index" class="flex space-x-2">
            <select v-model="ingredient.name" class="w-1/2 p-2 border rounded">
              <option value="" disabled>Select Ingredient</option>
              <option v-for="supply in supplies" :key="supply.id" :value="supply.name">
                {{ supply.name }}
              </option>
            </select>
            <input v-model.number="ingredient.qty" type="number" class="w-1/2 p-2 border rounded" placeholder="Qty" step="0.1" min="0" />
          </div>
        </div>
        <div class="mt-4 flex justify-end space-x-2">
          <button @click="resetForm" class="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
          <button @click="saveProduct" class="bg-blue-500 text-white px-4 py-2 rounded">
            {{ isEditing ? "Update" : "Save" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>