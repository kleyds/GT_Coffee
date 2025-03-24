import { createApp } from 'vue';
import '../css/app.css';
import { createRouter, createWebHistory } from 'vue-router';
import App from './components/App.vue';
import Order from './components/Order.vue';
import Products from './components/Products.vue';
import Supplies from './components/Supplies.vue';
import Transactions from './components/Transactions.vue';
import Dashboard from './components/Dashboard.vue';

// Routes
const routes = [
    { path: '/', redirect: '/order' }, 
    { path: '/order', component: Order },
    { path: '/products', component: Products },
    { path: '/supplies', component: Supplies },
    { path: '/transactions', component: Transactions },
    { path: '/dashboard', component: Dashboard },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// Create and mount the app
const app = createApp(App);
app.use(router); 
app.mount('#app');