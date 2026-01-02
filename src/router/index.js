import { createRouter, createWebHistory } from 'vue-router';


const routes = [];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Guard de navegação para verificar autenticação
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  
  if (to.meta.requiresAuth && !token) {
    next({ name: 'Login' });
  } else if (to.name === 'Login' && token) {
    next({ name: 'Dashboard' });
  } else {
    next();
  }
});

export default router;
