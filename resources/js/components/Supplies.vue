<script lang="ts">
import { defineComponent, ref, onMounted, computed } from "vue";

const API_BASE_URL = "http://localhost:3000";

export default defineComponent({
  name: "Supplies",
  setup() {
    const supplies = ref<{ id: number; name: string; quantity: number; unit: string; price_per_unit: number }[]>([]);
    const showModal = ref(false);
    const isEditing = ref(false);
    const sortOrder = ref<"asc" | "desc">("asc"); // Sorting order state

    const newSupply = ref({
      id: undefined as number | undefined,
      name: "",
      quantity: "" as string | number,
      unit: "",
      price_per_unit: "" as string | number,
    });

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

    const saveSupply = async () => {
      const { name, quantity, unit, price_per_unit, id } = newSupply.value;

      if (!name.trim() || Number(quantity) <= 0 || !unit.trim() || Number(price_per_unit) <= 0) {
        alert("Please fill in all fields correctly.");
        return;
      }

      const payload = { 
        name: name.trim(), 
        quantity: parseFloat(Number(quantity).toFixed(2)), 
        unit: unit.trim(), 
        price_per_unit: parseFloat(Number(price_per_unit).toFixed(2)) 
      };

      const url = isEditing.value ? `${API_BASE_URL}/update-supply/${id}` : `${API_BASE_URL}/add-supply`;
      const method = isEditing.value ? "PUT" : "POST";

      try {
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(await response.text());

        alert(isEditing.value ? "Supply updated successfully!" : "Supply added successfully!");
        resetForm();
        await fetchSupplies();
      } catch (error) {
        console.error(`Error ${isEditing.value ? "updating" : "saving"} supply:`, error);
        alert(`Failed to ${isEditing.value ? "update" : "add"} supply.`);
      }
    };

    const editSupply = (supply: typeof supplies.value[number]) => {
      isEditing.value = true;
      showModal.value = true;
      newSupply.value = { ...supply };
    };

    const deleteSupply = async (id: number) => {
      if (!confirm("Are you sure you want to delete this supply?")) return;

      try {
        const response = await fetch(`${API_BASE_URL}/delete-supply/${id}`, { method: "DELETE" });

        if (!response.ok) throw new Error(await response.text());

        alert("Supply deleted successfully!");
        await fetchSupplies();
      } catch (error) {
        console.error("Error deleting supply:", error);
        alert("Failed to delete supply.");
      }
    };

    const resetForm = () => {
      newSupply.value = { id: undefined, name: "", quantity: "", unit: "", price_per_unit: "" };
      showModal.value = false;
      isEditing.value = false;
    };

    // **Sorting Computed Property**
    const sortedSupplies = computed(() => {
      return [...supplies.value].sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        return sortOrder.value === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
    });

    // **Toggle Sorting Order**
    const toggleSort = () => {
      sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
    };

    onMounted(fetchSupplies);

    return { 
      supplies, showModal, newSupply, saveSupply, editSupply, deleteSupply, isEditing, resetForm, 
      sortedSupplies, sortOrder, toggleSort 
    };
  },
});
</script>


<template>
  <div class="px-6 pt-10 flex flex-col h-full">
    <div class="flex-shrink-0">
      <h2 class="text-3xl font-extrabold text-center mb-2 text-gray-800 tracking-wide font-serif italic select-none">
        List of Supplies
      </h2>
      <div class="flex justify-between items-center mb-2">
        <button @click="showModal = true; isEditing = false" class="bg-blue-500 text-white px-4 py-2 rounded-lg shadow select-none">
          + Add Supply
        </button>
      </div>
    </div>

    <!-- Scrollable table container -->
    <div class="flex-grow max-h-[calc(100vh-18rem)] overflow-y-auto">
      <table class="w-full border-collapse border border-gray-300">
      <thead class="bg-gray-100 sticky top-0 z-10">
        <tr>
          <th class="border border-gray-300 p-2 text-left cursor-pointer" @click="toggleSort">
            Name
            <span v-if="sortOrder === 'asc'">🔼</span>
            <span v-else>🔽</span>
          </th>
          <th class="border border-gray-300 p-2 text-center">Quantity</th>
          <th class="border border-gray-300 p-2 text-center">Unit</th>
          <th class="border border-gray-300 p-2 text-center">Price per Unit</th>
          <th class="border border-gray-300 p-2 text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="supply in sortedSupplies" :key="supply.id">
          <td class="border border-gray-300 p-2 text-left">{{ supply.name }}</td>
          <td class="border border-gray-300 p-2 text-center">{{ supply.quantity.toFixed(2) }}</td>
          <td class="border border-gray-300 p-2 text-center">{{ supply.unit }}</td>
          <td class="border border-gray-300 p-2 text-center">₱{{ supply.price_per_unit.toFixed(2) }}</td>
          <td class="border border-gray-300 p-2 text-center">
            <div class="flex justify-center items-center space-x-2">
              <button @click="editSupply(supply)" class="text-yellow-500 hover:text-yellow-700">✏️</button>
              <button @click="deleteSupply(supply.id)" class="text-red-500 hover:text-red-700">🗑️</button>
            </div>
          </td>
        </tr>
        <tr v-if="sortedSupplies.length === 0">
          <td colspan="5" class="border border-gray-300 p-2 text-center text-gray-500">No supplies available</td>
        </tr>
      </tbody>
    </table>

    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-30">
      <div class="bg-white p-6 rounded-lg shadow-lg w-1/3 max-h-[90vh] flex flex-col">
        <h3 class="text-xl font-semibold mb-4">{{ isEditing ? "Edit Supply" : "Add Supply" }}</h3>
        <div class="flex-1 overflow-y-auto space-y-4">
          <input v-model="newSupply.name" placeholder="Supply Name" class="w-full p-2 border rounded" />
          <input v-model.number="newSupply.quantity" type="number" placeholder="Quantity" class="w-full p-2 border rounded" step="1" min="0" />
          <input v-model="newSupply.unit" placeholder="Unit" class="w-full p-2 border rounded" />
          <input v-model.number="newSupply.price_per_unit" type="number" placeholder="Price per Unit" class="w-full p-2 border rounded" step="1" min="0" />
        </div>
        <div class="flex justify-end space-x-2 mt-4">
          <button @click="resetForm" class="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
          <button @click="saveSupply" class="bg-blue-500 text-white px-4 py-2 rounded">
            {{ isEditing ? "Update" : "Save" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>