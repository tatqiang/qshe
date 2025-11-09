# QSHE Vue Project Structure

This document describes the organized file structure for the QSHE PWA application.

## Directory Structure

```
src/
├── assets/                 # Static assets (CSS, images, fonts)
│   └── main.css           # Global Tailwind CSS
│
├── components/            # Reusable components
│   ├── layout/           # Layout components
│   │   ├── TopNav.vue
│   │   ├── LeftSidebar.vue
│   │   └── BottomNav.vue
│   ├── ui/               # Reusable UI components (buttons, modals, forms)
│   └── common/           # Common shared components
│       ├── Logo.vue
│       └── ProjectSelector.vue
│
├── composables/          # Vue composition functions (shared logic)
│   ├── useAuth.js       # Authentication composable
│   ├── useDarkMode.js   # Theme management
│   └── useProject.js    # Project context management
│
├── constants/            # Application constants
│   └── index.js         # API endpoints, user roles, config
│
├── features/             # Feature modules (self-contained)
│   ├── patrol/
│   │   ├── components/  # Patrol-specific components
│   │   ├── composables/ # Patrol-specific composables
│   │   ├── services/    # Patrol API calls
│   │   └── views/       # Patrol pages
│   │       └── PatrolView.vue
│   ├── risk-assessment/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── services/
│   │   └── views/
│   │       └── RiskAssessmentView.vue
│   ├── safety-audit/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── services/
│   │   └── views/
│   ├── toolbox-talk/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── services/
│   │   └── views/
│   └── permit-to-work/
│       ├── components/
│       ├── composables/
│       ├── services/
│       └── views/
│
├── lib/                  # External integrations
│   ├── supabase.js      # Supabase client
│   └── azureAuth.js     # Azure AD authentication
│
├── router/               # Vue Router configuration
│   └── index.js         # Route definitions and guards
│
├── services/             # Shared API services
│   ├── projectService.js # Project CRUD operations
│   └── userService.js    # User CRUD operations
│
├── stores/               # Pinia state management
│   ├── authStore.js     # Global authentication state
│   ├── projectStore.js  # Project context state
│   ├── themeStore.js    # Theme state
│   └── index.js         # Store exports
│
├── types/                # TypeScript type definitions (future)
│
├── utils/                # Utility functions
│
├── views/                # Top-level page components
│   ├── DashboardView.vue
│   ├── LoginView.vue
│   └── SystemView.vue
│
├── App.vue              # Root component
└── main.js              # Application entry point
```

## Architecture Principles

### 1. Feature-Based Organization
Each feature (patrol, risk-assessment, etc.) is self-contained with its own:
- Components (feature-specific UI)
- Composables (feature-specific logic)
- Services (feature-specific API calls)
- Views (feature-specific pages)

**Benefits:**
- Clear separation of concerns
- Easy to find and modify feature code
- Scalable for large teams
- Supports code splitting and lazy loading

### 2. Shared Resources
Global/shared code is organized by type:
- `components/` - Reusable UI components
- `composables/` - Shared Vue composition functions
- `services/` - Shared API services
- `stores/` - Global application state

### 3. Service Layer
All API calls go through service files for:
- Centralized data access
- Consistent error handling
- Easy testing and mocking
- Cache management

### 4. State Management with Pinia
Stores manage global state:
- `authStore` - User authentication and profile
- `projectStore` - Selected project context
- `themeStore` - Dark/light mode

## Adding New Features

To add a new feature (e.g., "incident-report"):

1. **Create feature folder structure:**
   ```
   src/features/incident-report/
   ├── components/
   ├── composables/
   ├── services/
   └── views/
       └── IncidentReportView.vue
   ```

2. **Create service file:**
   ```javascript
   // src/services/incidentReportService.js
   export const incidentReportService = {
     getAll() { ... },
     getById(id) { ... },
     create(data) { ... },
     update(id, data) { ... },
     delete(id) { ... }
   }
   ```

3. **Add route:**
   ```javascript
   // src/router/index.js
   {
     path: '/incident-report',
     name: 'incident-report',
     component: () => import('@/features/incident-report/views/IncidentReportView.vue'),
     meta: { requiresAuth: true }
   }
   ```

4. **Add navigation item:**
   Update `LeftSidebar.vue` and `BottomNav.vue` with the new menu item.

## Import Path Aliases

Use the `@` alias for imports:
```javascript
import { projectService } from '@/services/projectService'
import Logo from '@/components/common/Logo.vue'
import { useAuthStore } from '@/stores'
```

## Best Practices

1. **Keep features independent** - Avoid cross-feature dependencies
2. **Use services for API calls** - Never call Supabase directly from components
3. **Use stores for global state** - Composables for local/shared logic
4. **Organize by feature** - Not by file type (except for truly shared code)
5. **Lazy load routes** - Use dynamic imports for code splitting
