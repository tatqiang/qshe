import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

// Force reload: 2025-11-16 21:45
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/system',
    name: 'system',
    component: () => import('@/views/SystemView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/patrol',
    name: 'patrol',
    component: () => import('@/features/patrol/views/PatrolView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/patrol/new',
    name: 'patrol-new',
    component: () => import('@/features/patrol/views/PatrolFormView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/patrol/:id/edit',
    name: 'patrol-edit',
    component: () => import('@/features/patrol/views/PatrolFormView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/patrol/:id',
    name: 'patrol-detail',
    component: () => import('@/features/patrol/views/PatrolDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/materials',
    name: 'materials',
    component: () => import('@/views/MaterialsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/materials/add',
    name: 'materials-add',
    component: () => import('@/views/MaterialsAddView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/materials/add-to-inventory',
    name: 'AddMaterialToInventory',
    component: () => import('@/views/AddMaterialToInventoryView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/materials/receives',
    name: 'materials-receive-list',
    component: () => import('@/views/MaterialReceiveListView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/materials/receive/new',
    name: 'materials-receive-new',
    component: () => import('@/views/MaterialReceiveView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/materials/receive/:id/print',
    name: 'materials-receive-print',
    component: () => import('@/views/MaterialReceivePrintView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/materials/receive/:id',
    name: 'materials-receive-edit',
    component: () => import('@/views/MaterialReceiveView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/materials/receive',
    redirect: '/materials/receives'
  },
  {
    path: '/admin/material-config',
    name: 'admin-material-config',
    component: () => import('@/views/admin/MaterialConfigView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

console.log('🔧 Router initialized with routes:', router.getRoutes().map(r => ({ name: r.name, path: r.path })))

// Global flag to track if auth has been checked
let authChecked = false

// Navigation guard
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  
  console.log('🚦 Router guard - Going to:', to.path, 'Auth required:', to.meta.requiresAuth)
  console.log('🚦 Current auth status:', authStore.isAuthenticated)
  console.log('🚦 Auth already checked:', authChecked)
  
  // Skip auth check if there's a hash (MSAL redirect in progress)
  if (window.location.hash.includes('code=') || window.location.hash.includes('id_token=')) {
    console.log('🔄 MSAL redirect detected, skipping auth check')
    next()
    return
  }
  
  // ALWAYS initialize auth on first navigation
  if (!authChecked) {
    console.log('⏳ First navigation - initializing auth...')
    await authStore.initialize()
    authChecked = true
    console.log('✅ Auth initialized. Status:', authStore.isAuthenticated)
  }

  const requiresAuth = to.meta.requiresAuth as boolean | undefined

  if (requiresAuth && !authStore.isAuthenticated) {
    // Redirect to login if route requires auth and user is not authenticated
    console.log('🚫 Access denied - redirecting to login')
    next({ name: 'login' })
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    // Redirect to dashboard if user is already authenticated
    console.log('✅ Already authenticated - redirecting to dashboard')
    next({ name: 'dashboard' })
  } else {
    console.log('✅ Access granted')
    next()
  }
})

export default router
