import { createRouter, createWebHistory } from 'vue-router'
import { azureAuthService } from '@/lib/azureAuth'
import { supabase } from '@/lib/supabase'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
      path: '/patrol/:id',
      name: 'patrol-detail',
      component: () => import('@/features/patrol/views/PatrolDetailView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/patrol/:id/edit',
      name: 'patrol-edit',
      component: () => import('@/features/patrol/views/PatrolFormView.vue'),
      props: route => ({ patrolId: route.params.id, mode: 'edit' }),
      meta: { requiresAuth: true }
    },
    {
      path: '/risk-assessment',
      name: 'risk-assessment',
      component: () => import('@/features/risk-assessment/views/RiskAssessmentView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/system',
      name: 'system',
      component: () => import('@/views/SystemView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    }
  ]
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  try {
    const isLoggedIn = await azureAuthService.isLoggedIn()
    
    if (to.meta.requiresAuth && !isLoggedIn) {
      next('/login')
    } else if (to.path === '/login' && isLoggedIn) {
      next('/dashboard')
    } else if (to.meta.requiresAdmin && isLoggedIn) {
      // Check if user has system_admin role
      const azureUser = await azureAuthService.getUserProfile()
      if (azureUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('email', azureUser.email)
          .single()
        
        if (userData?.role !== 'system_admin') {
          next('/dashboard')
        } else {
          next()
        }
      } else {
        next('/login')
      }
    } else {
      next()
    }
  } catch (error) {
    console.error('Router guard error:', error)
    next('/login')
  }
})

export default router
