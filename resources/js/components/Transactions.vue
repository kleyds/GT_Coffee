<script lang="ts">
import { defineComponent, ref, onMounted, computed } from "vue";

const API_BASE_URL = "http://localhost:3000";

export default defineComponent({
  name: "Transactions",
  setup() {
    // Adjusted type to exclude id
    const orders = ref<{ product: string; quantity: number; amount: number; order_time: string }[]>([]);
    const products = ref<{ name: string; price: number }[]>([]); // To store product unit prices
    const selectedDate = ref<string>("all"); // Default to show all orders

    // Fetch orders from the API
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/orders`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        orders.value = await response.json();
      } catch (error) {
        console.error("Error fetching orders:", error);
        alert("Failed to load transactions.");
      }
    };

    // Fetch products to get unit prices
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        products.value = (await response.json()).map((p: any) => ({ name: p.name, price: p.price }));
      } catch (error) {
        console.error("Error fetching products:", error);
        alert("Failed to load product data.");
      }
    };

  // Get unique dates for the dropdown, sorted in descending order
  const uniqueDates = computed(() => {
    const dates = orders.value.map(order => order.order_time.split(" ")[0]); // Extract date part (e.g., "2025-03-22")
    const uniqueSortedDates = [...new Set(dates)].sort((a, b) => b.localeCompare(a)); // Sort descending
    return ["all", ...uniqueSortedDates]; // "all" first, then sorted dates
  });

    // Filter and sort orders based on selected date, latest first
    const filteredOrders = computed(() => {
      let result = orders.value.map(order => {
        const product = products.value.find(p => p.name === order.product);
        return {
          ...order,
          unitPrice: product ? product.price : 0, // Add unit price from products
        };
      });
      if (selectedDate.value !== "all") {
        result = result.filter(order => order.order_time.startsWith(selectedDate.value));
      }
      // Sort by order_time in descending order (latest first)
      return result.sort((a, b) => b.order_time.localeCompare(a.order_time));
    });

    onMounted(() => {
      fetchOrders();
      fetchProducts();
    });

    return {
      orders,
      selectedDate,
      uniqueDates,
      filteredOrders,
    };
  },
});
</script>

<template>
  <div class="px-6 pt-10 flex flex-col h-full">
    <div class="flex-shrink-0">
      <h2 class="text-3xl font-extrabold text-center mb-2 text-gray-800 tracking-wide font-serif italic select-none">
        Transactions
      </h2>

      <!-- Filters Section -->
      <div class="flex justify-between items-center mb-4">
        <div class="flex items-center">
          <label for="date-filter" class="mr-2 font-semibold">Filter by Date:</label>
          <select
            v-model="selectedDate"
            id="date-filter"
            class="p-2 border rounded-lg bg-white shadow-sm mr-4"
          >
            <option v-for="date in uniqueDates" :key="date" :value="date">
              {{ date === "all" ? "All Dates" : date }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Scrollable Table Container -->
    <div class="flex-grow max-h-[calc(100vh-18rem)] overflow-y-auto">
      <table class="w-full border-collapse border border-gray-300">
        <thead class="bg-gray-100 sticky top-0 z-10">
          <tr>
            <th class="border border-gray-300 p-2 text-left">Product</th>
            <th class="border border-gray-300 p-2 text-center">Unit Price</th>
            <th class="border border-gray-300 p-2 text-center">Quantity</th>
            <th class="border border-gray-300 p-2 text-center">Total</th>
            <th class="border border-gray-300 p-2 text-center">Order Time</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in filteredOrders" :key="order.order_time + order.product">
            <td class="border border-gray-300 p-2 text-left">{{ order.product }}</td>
            <td class="border border-gray-300 p-2 text-center">₱{{ order.unitPrice.toFixed(2) }}</td>
            <td class="border border-gray-300 p-2 text-center">{{ order.quantity }}</td>
            <td class="border border-gray-300 p-2 text-center">₱{{ order.amount.toFixed(2) }}</td>
            <td class="border border-gray-300 p-2 text-center">{{ order.order_time }}</td>
          </tr>
          <tr v-if="filteredOrders.length === 0">
            <td colspan="5" class="border border-gray-300 p-2 text-center text-gray-500">
              No transactions available
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>