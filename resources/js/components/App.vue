<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'App',
});
</script>

<template>
    <div class="min-h-screen flex flex-col bg-gray-100">
        <!-- Header -->
        <header class="fixed top-0 left-0 w-full bg-gray-700 text-white py-4 text-center shadow-md select-none z-20">
            <h1 class="text-3xl font-extrabold tracking-wide">
                GT! Coffee 
                <span class="text-lg italic font-light text-gray-300">by Cleid</span>
            </h1>
        </header>


        <!-- Navigation -->
        <nav class="fixed top-[4rem] left-0 w-full flex justify-center space-x-8 py-2 bg-white shadow text-lg font-semibold select-none z-10">
            <router-link 
                to="/order" 
                class="text-gray-700 hover:text-blue-600 transition duration-300 px-4 py-2"
                active-class="font-bold text-blue-600 border-b-2 border-blue-600"
            >
                Orders
            </router-link>
            <router-link 
                to="/products" 
                class="text-gray-700 hover:text-blue-600 transition duration-300 px-4 py-2"
                active-class="font-bold text-blue-600 border-b-2 border-blue-600"
            >
                Products
            </router-link>
            <router-link 
                to="/supplies" 
                class="text-gray-700 hover:text-blue-600 transition duration-300 px-4 py-2"
                active-class="font-bold text-blue-600 border-b-2 border-blue-600"
            >
                Supplies
            </router-link>
            <router-link 
                to="/transactions" 
                class="text-gray-700 hover:text-blue-600 transition duration-300 px-4 py-2"
                active-class="font-bold text-blue-600 border-b-2 border-blue-600"
            >
                Transactions
            </router-link>
            <router-link 
                to="/dashboard" 
                class="text-gray-700 hover:text-blue-600 transition duration-300 px-4 py-2"
                active-class="font-bold text-blue-600 border-b-2 border-blue-600"
            >
                Dashboard
            </router-link>
        </nav>

        <!-- Main Content Area -->
        <main class="flex-grow w-full pt-[6rem] pb-[4rem] px-6 bg-gray-100 h-[calc(100vh-10rem)] overflow-y-auto">
            <div class="w-full h-full bg-white shadow-lg rounded-lg py-4 px-6 flex flex-col">
                <router-view class="flex-1 min-h-0"></router-view>
            </div>
        </main>

        <!-- Footer -->
        <footer class="fixed bottom-0 w-full bg-gray-700 text-white text-center py-3 shadow-md">
            <p class="text-sm">
                GT! Coffee © 2025 | 
                <a href="https://lowcostengineer.com" target="_blank" class="text-blue-400 hover:underline">
                    Visit GT Coffee
                </a>
            </p>
        </footer>
    </div>
</template>
