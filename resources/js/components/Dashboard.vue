<script lang="ts">
import { defineComponent, ref, onMounted, computed, watch, nextTick } from "vue";
import Chart from "chart.js/auto";

const API_BASE_URL = "http://localhost:3000";

export default defineComponent({
  name: "Dashboard",
  setup() {
    const orders = ref<{ product: string; quantity: number; amount: number; order_time: string }[]>([]);
    const products = ref<{ name: string; price: number }[]>([]);
    const timePeriod = ref<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
    let bestSellersChart: Chart | null = null;
    let topGrossingChart: Chart | null = null;

    // Fetch data
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/orders`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        orders.value = await response.json();
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        products.value = (await response.json()).map((p: any) => ({ name: p.name, price: p.price }));
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    // Filter orders based on time period
    const filteredOrders = computed(() => {
      const now = new Date();
      return orders.value.filter(order => {
        const orderDate = new Date(order.order_time);
        switch (timePeriod.value) {
          case 'daily':
            return orderDate.toDateString() === now.toDateString();
          case 'weekly':
            const oneWeekAgo = new Date(now);
            oneWeekAgo.setDate(now.getDate() - 7);
            return orderDate >= oneWeekAgo;
          case 'monthly':
            const oneMonthAgo = new Date(now);
            oneMonthAgo.setMonth(now.getMonth() - 1);
            return orderDate >= oneMonthAgo;
          case 'yearly':
            const oneYearAgo = new Date(now);
            oneYearAgo.setFullYear(now.getFullYear() - 1);
            return orderDate >= oneYearAgo;
          default:
            return true;
        }
      });
    });

    // Compute best sellers (by quantity)
    const bestSellers = computed(() => {
      const productTotals = filteredOrders.value.reduce((acc, order) => {
        acc[order.product] = (acc[order.product] || 0) + order.quantity;
        return acc;
      }, {} as Record<string, number>);
      
      return Object.entries(productTotals)
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
    });

    // Compute top grossing (by revenue)
    const topGrossing = computed(() => {
      const productRevenue = filteredOrders.value.reduce((acc, order) => {
        acc[order.product] = (acc[order.product] || 0) + order.amount;
        return acc;
      }, {} as Record<string, number>);
      
      return Object.entries(productRevenue)
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    });

    // Export to CSV function
    const exportToCSV = () => {
      const headers = ['Product', 'Quantity', 'Amount', 'Order Time'];
      const rows = filteredOrders.value.map(order => [
        order.product,
        order.quantity,
        order.amount,
        order.order_time
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(value => `"${value}"`).join(','))
      ].join('\n');

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `orders_${timePeriod.value}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    // Initialize charts
    const initCharts = async () => {
      await nextTick();

      if (bestSellersChart) bestSellersChart.destroy();
      if (topGrossingChart) topGrossingChart.destroy();

      const bestSellersCtx = document.getElementById("bestSellersChart") as HTMLCanvasElement | null;
      const topGrossingCtx = document.getElementById("topGrossingChart") as HTMLCanvasElement | null;

      if (bestSellersCtx) {
        bestSellersChart = new Chart(bestSellersCtx.getContext("2d")!, {
          type: "bar",
          data: {
            labels: bestSellers.value.map(item => item.name),
            datasets: [{
              label: "Units Sold",
              data: bestSellers.value.map(item => item.quantity),
              backgroundColor: "rgba(75, 192, 192, 0.6)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            scales: { y: { beginAtZero: true, title: { display: true, text: "Quantity" } } },
            plugins: { title: { display: true, text: `Top 5 Best-Selling Products (${timePeriod.value})` } }
          }
        });
      }

      if (topGrossingCtx) {
        topGrossingChart = new Chart(topGrossingCtx.getContext("2d")!, {
          type: "bar",
          data: {
            labels: topGrossing.value.map(item => item.name),
            datasets: [{
              label: "Revenue (₱)",
              data: topGrossing.value.map(item => item.revenue),
              backgroundColor: "rgba(255, 159, 64, 0.6)",
              borderColor: "rgba(255, 159, 64, 1)",
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            scales: { y: { beginAtZero: true, title: { display: true, text: "Revenue (₱)" } } },
            plugins: { title: { display: true, text: `Top 5 Grossing Products (${timePeriod.value})` } }
          }
        });
      }
    };

    // Watch for changes
    watch([bestSellers, topGrossing, timePeriod], async () => {
      if (bestSellers.value.length || topGrossing.value.length) {
        await initCharts();
      }
    });

    onMounted(async () => {
      await fetchOrders();
      await fetchProducts();
    });

    return {
      bestSellers,
      topGrossing,
      timePeriod,
      exportToCSV,
    };
  },
});
</script>

<template>
  <div class="px-6 pt-10 flex flex-col h-full">
      <h2 class="text-3xl font-extrabold text-center mb-6 text-gray-800 tracking-wide font-serif italic select-none">   
            Dashboard
      </h2>

    <div class="mb-6 flex justify-center gap-4">
      <select 
        v-model="timePeriod"
        class="p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      </select>
      <button 
        @click="exportToCSV"
        class="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Extract to CSV
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white p-4 rounded-lg shadow-md">
        <canvas id="bestSellersChart"></canvas>
      </div>
      <div class="bg-white p-4 rounded-lg shadow-md">
        <canvas id="topGrossingChart"></canvas>
      </div>
    </div>
  </div>
</template>

<style scoped>
canvas {
  max-height: 400px;
}
</style>