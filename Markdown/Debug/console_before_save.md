react-dom_client.js?v=5d8fef52:17995 Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
preRegistrationSlice.ts:75 PreRegistration USE_MOCK_DATA: false {url: 'configured', key: 'configured'}
azureAuthService.ts:17 🔍 Azure Environment Variables: {clientId: '618098ec-e3e8-4d7b-a718-c10c23e82407', tenantId: 'd6bb4e04-1f12-4303-95a7-71d94f834f0a', redirectUri: 'http://localhost:5173', allEnvVars: Array(18)}
azureAuthService.ts:24 🔍 Raw Environment Check: {VITE_AZURE_TENANT_ID: 'd6bb4e04-1f12-4303-95a7-71d94f834f0a', VITE_AZURE_COMPANY_CLIENT_ID: '618098ec-e3e8-4d7b-a718-c10c23e82407'}
azureAuthService.ts:49 🔍 Final MSAL Config: {auth: {…}, cache: {…}}
iosPwaDebugger.ts:50 🔍 iOS PWA Debugger initialized
iosPwaDebugger.ts:92 📱 Device Info: {isIOS: false, isSafari: false, isPWA: false, isStandalone: false, viewport: '479x825'}
iosPwaDebugger.ts:100 🔧 Environment: {mode: 'development', hasSupabaseUrl: true, hasSupabaseKey: true, hasServiceWorker: true}
azureAD.ts:31 🔵 Azure AD Service created
azureAuthService.ts:121 🔍 MSAL redirect response: null
azureAuthService.ts:175 ❌ No MSAL response or account found {hasResponse: false, hasAccount: undefined, hasAuthParams: false}
AuthWrapper.tsx:28 🔍 AuthWrapper render: {isAuthenticated: false, isLoading: false, currentPath: '/audit', isPublicRoute: false}
AuthWrapper.tsx:116 💾 Saving redirect path for after login: /audit
AuthWrapper.tsx:122 🔐 AuthWrapper: User not authenticated, showing login page {isAuthenticated: false, isLoading: false, showRegistration: false, currentPath: '/audit', savedRedirectPath: null}
AuthWrapper.tsx:28 🔍 AuthWrapper render: {isAuthenticated: false, isLoading: false, currentPath: '/audit', isPublicRoute: false}
AuthWrapper.tsx:119 ⏸️ Already have saved path, not overwriting: /audit
AuthWrapper.tsx:122 🔐 AuthWrapper: User not authenticated, showing login page {isAuthenticated: false, isLoading: false, showRegistration: false, currentPath: '/audit', savedRedirectPath: '/audit'}
Login.tsx:27 🔍 [DEBUG] Login useEffect triggered - hasCheckedSession: false
Login.tsx:28 🔍 [DEBUG] Current URL: http://localhost:5173/audit
Login.tsx:37 🔄 LOGIN COMPONENT MOUNTED - Azure AD redirect handling...
Login.tsx:38 🔍 [DEBUG] Has auth params: false
AuthWrapper.tsx:66 🔍 [DEBUG] AuthWrapper useEffect triggered {shouldBypassAuth: false, pathname: '/audit'}
AuthWrapper.tsx:70 🔍 [DEBUG] Dispatching checkAuthStatus...
index.ts:10 auth/checkAuthStatus/pending
index.ts:11 dispatching {type: 'auth/checkAuthStatus/pending', payload: undefined, meta: {…}}
index.ts:13 next state {auth: {…}, users: {…}, preRegistration: {…}}
sessionManager.ts:89 ✅ SessionManager: Session restored {userId: '63465875-d4cb-4c1b-9e38-f1744508eeeb', email: 'nithat.su@th.jec.com', daysRemaining: 30}
authSlice.ts:469 ✅ checkAuthStatus: Restored from session manager
authSlice.ts:473 ✅ Extracted AuthUser: {id: '63465875-d4cb-4c1b-9e38-f1744508eeeb', email: 'nithat.su@th.jec.com', role: 'system_admin', userDetails: {…}}
AppContext.tsx:87 ✅ AppContext: Loaded user from localStorage: {id: '63465875-d4cb-4c1b-9e38-f1744508eeeb', firstName: 'Nithat', lastName: 'Suksomboonlert', name: 'Nithat Suksomboonlert', email: 'nithat.su@th.jec.com', …}
AppContext.tsx:95 ✅ AppContext: Loaded project from localStorage: {id: '5863ee50-89e0-437f-9f1e-507ad568b900', name: 'Under Test', description: '', created_at: '2025-10-14T03:37:24.334122+00:00', updated_at: '2025-10-14T03:37:24.334122+00:00', …}
AppContext.tsx:106 ✅ AppContext: Initial data loaded successfully
Login.tsx:27 🔍 [DEBUG] Login useEffect triggered - hasCheckedSession: true
Login.tsx:28 🔍 [DEBUG] Current URL: http://localhost:5173/audit
Login.tsx:32 ⏸️ Session already checked, skipping...
AuthWrapper.tsx:66 🔍 [DEBUG] AuthWrapper useEffect triggered {shouldBypassAuth: false, pathname: '/audit'}
AuthWrapper.tsx:70 🔍 [DEBUG] Dispatching checkAuthStatus...
index.ts:10 auth/checkAuthStatus/pending
index.ts:11 dispatching {type: 'auth/checkAuthStatus/pending', payload: undefined, meta: {…}}
index.ts:13 next state {auth: {…}, users: {…}, preRegistration: {…}}
sessionManager.ts:89 ✅ SessionManager: Session restored {userId: '63465875-d4cb-4c1b-9e38-f1744508eeeb', email: 'nithat.su@th.jec.com', daysRemaining: 30}
authSlice.ts:469 ✅ checkAuthStatus: Restored from session manager
authSlice.ts:473 ✅ Extracted AuthUser: {id: '63465875-d4cb-4c1b-9e38-f1744508eeeb', email: 'nithat.su@th.jec.com', role: 'system_admin', userDetails: {…}}
AppContext.tsx:87 ✅ AppContext: Loaded user from localStorage: {id: '63465875-d4cb-4c1b-9e38-f1744508eeeb', firstName: 'Nithat', lastName: 'Suksomboonlert', name: 'Nithat Suksomboonlert', email: 'nithat.su@th.jec.com', …}
AppContext.tsx:95 ✅ AppContext: Loaded project from localStorage: {id: '5863ee50-89e0-437f-9f1e-507ad568b900', name: 'Under Test', description: '', created_at: '2025-10-14T03:37:24.334122+00:00', updated_at: '2025-10-14T03:37:24.334122+00:00', …}
AppContext.tsx:106 ✅ AppContext: Initial data loaded successfully
index.ts:10 auth/checkAuthStatus/fulfilled
index.ts:11 dispatching {type: 'auth/checkAuthStatus/fulfilled', payload: {…}, meta: {…}}
index.ts:13 next state {auth: {…}, users: {…}, preRegistration: {…}}
index.ts:10 auth/checkAuthStatus/fulfilled
index.ts:11 dispatching {type: 'auth/checkAuthStatus/fulfilled', payload: {…}, meta: {…}}
index.ts:13 next state {auth: {…}, users: {…}, preRegistration: {…}}
AuthWrapper.tsx:28 🔍 AuthWrapper render: {isAuthenticated: true, isLoading: false, currentPath: '/audit', isPublicRoute: false}
AuthWrapper.tsx:99 ✅ User authenticated, clearing saved redirect path: /audit
AuthWrapper.tsx:28 🔍 AuthWrapper render: {isAuthenticated: true, isLoading: false, currentPath: '/audit', isPublicRoute: false}
Sidebar.tsx:53 🔍 [SIDEBAR DEBUG] ===================
Sidebar.tsx:54   user object: {id: '63465875-d4cb-4c1b-9e38-f1744508eeeb', email: 'nithat.su@th.jec.com', role: 'system_admin', userDetails: {…}}
Sidebar.tsx:55   user.role: system_admin
Sidebar.tsx:56   role variable: system_admin
Sidebar.tsx:57   isSystemAdmin: true
Sidebar.tsx:58   Expected for admin menu: isSystemAdmin === true
Sidebar.tsx:59   Menu will show: ✅ YES
Sidebar.tsx:60 ========================================
Sidebar.tsx:53 🔍 [SIDEBAR DEBUG] ===================
Sidebar.tsx:54   user object: {id: '63465875-d4cb-4c1b-9e38-f1744508eeeb', email: 'nithat.su@th.jec.com', role: 'system_admin', userDetails: {…}}
Sidebar.tsx:55   user.role: system_admin
Sidebar.tsx:56   role variable: system_admin
Sidebar.tsx:57   isSystemAdmin: true
Sidebar.tsx:58   Expected for admin menu: isSystemAdmin === true
Sidebar.tsx:59   Menu will show: ✅ YES
Sidebar.tsx:60 ========================================
MainLayout.tsx:101 Fetching user profile for: 63465875-d4cb-4c1b-9e38-f1744508eeeb
index.ts:10 users/fetchCurrentUserProfile/pending
index.ts:11 dispatching {type: 'users/fetchCurrentUserProfile/pending', payload: undefined, meta: {…}}
index.ts:13 next state {auth: {…}, users: {…}, preRegistration: {…}}
usersSlice.ts:269 📱 Mock user profile fetch for userId: 63465875-d4cb-4c1b-9e38-f1744508eeeb
AppContext.tsx:182 AppContext: authUser.userDetails: {id: '63465875-d4cb-4c1b-9e38-f1744508eeeb', firstName: 'Nithat', lastName: 'Suksomboonlert', email: 'nithat.su@th.jec.com', role: 'system_admin', …}
AppContext.tsx:183 AppContext: contextUser created: {id: '63465875-d4cb-4c1b-9e38-f1744508eeeb', firstName: 'Nithat', lastName: 'Suksomboonlert', name: 'Nithat Suksomboonlert', email: 'nithat.su@th.jec.com', …}
MainLayout.tsx:101 Fetching user profile for: 63465875-d4cb-4c1b-9e38-f1744508eeeb
index.ts:10 users/fetchCurrentUserProfile/pending
index.ts:11 dispatching {type: 'users/fetchCurrentUserProfile/pending', payload: undefined, meta: {…}}
index.ts:13 next state {auth: {…}, users: {…}, preRegistration: {…}}
usersSlice.ts:269 📱 Mock user profile fetch for userId: 63465875-d4cb-4c1b-9e38-f1744508eeeb
AuthWrapper.tsx:28 🔍 AuthWrapper render: {isAuthenticated: true, isLoading: false, currentPath: '/audit', isPublicRoute: false}
AuthWrapper.tsx:28 🔍 AuthWrapper render: {isAuthenticated: true, isLoading: false, currentPath: '/audit', isPublicRoute: false}
index.ts:10 users/fetchCurrentUserProfile/fulfilled
index.ts:11 dispatching {type: 'users/fetchCurrentUserProfile/fulfilled', payload: {…}, meta: {…}}
index.ts:13 next state {auth: {…}, users: {…}, preRegistration: {…}}
index.ts:10 users/fetchCurrentUserProfile/fulfilled
index.ts:11 dispatching {type: 'users/fetchCurrentUserProfile/fulfilled', payload: {…}, meta: {…}}
index.ts:13 next state {auth: {…}, users: {…}, preRegistration: {…}}
Sidebar.tsx:53 🔍 [SIDEBAR DEBUG] ===================
Sidebar.tsx:54   user object: {id: '63465875-d4cb-4c1b-9e38-f1744508eeeb', email: 'nithat.su@th.jec.com', role: 'system_admin', userDetails: {…}}
Sidebar.tsx:55   user.role: system_admin
Sidebar.tsx:56   role variable: system_admin
Sidebar.tsx:57   isSystemAdmin: true
Sidebar.tsx:58   Expected for admin menu: isSystemAdmin === true
Sidebar.tsx:59   Menu will show: ✅ YES
Sidebar.tsx:60 ========================================
Sidebar.tsx:53 🔍 [SIDEBAR DEBUG] ===================
Sidebar.tsx:54   user object: {id: '63465875-d4cb-4c1b-9e38-f1744508eeeb', email: 'nithat.su@th.jec.com', role: 'system_admin', userDetails: {…}}
Sidebar.tsx:55   user.role: system_admin
Sidebar.tsx:56   role variable: system_admin
Sidebar.tsx:57   isSystemAdmin: true
Sidebar.tsx:58   Expected for admin menu: isSystemAdmin === true
Sidebar.tsx:59   Menu will show: ✅ YES
Sidebar.tsx:60 ========================================
azureAD.ts:48 ✅ Azure AD MSAL initialized
App.tsx:47 ✅ Azure AD service initialized
App.tsx:47 ✅ Azure AD service initialized
OfflineFaceRecognitionService.ts:82 ✅ Face Models SW registered: http://localhost:5173/
face-models-sw.js:171 🔄 Starting background model caching...
debugUsers.ts:36 🔧 Debug functions loaded: debugRegisteredUsers(), clearRegisteredUsers()
face-models-sw.js:184 ⏭️ Already cached: face_landmark_68_model-weights_manifest.json
face-models-sw.js:184 ⏭️ Already cached: face_landmark_68_model-shard1
face-models-sw.js:184 ⏭️ Already cached: face_recognition_model-weights_manifest.json
face-models-sw.js:184 ⏭️ Already cached: face_recognition_model-shard1
face-models-sw.js:184 ⏭️ Already cached: face_recognition_model-shard2
face-models-sw.js:213 ✅ Background model caching completed
sessionDebug.ts:70 🔧 Session debug tools loaded. Use qsheSession.debug() in console.
OfflineFaceRecognitionService.ts:88 ✅ Background model caching completed
audit:1 <meta name="apple-mobile-web-app-capable" content="yes"> is deprecated. Please include <meta name="mobile-web-app-capable" content="yes">
Login.tsx:160 🔍 [DEBUG] Delayed check - isLoggedIn: false
Login.tsx:180 🔍 [DEBUG] No existing session found
projectAreasApi.mock.ts:432 [MOCK] Cleaning up duplicate areas for project project-123
projectAreasApi.mock.ts:482 [MOCK] Cleanup complete. Removed 0 duplicate areas.
SafetyAuditDashboard.tsx:82 ✅ Loaded audits: (6) [{…}, {…}, {…}, {…}, {…}, {…}]
SafetyAuditDashboard.tsx:82 ✅ Loaded audits: (6) [{…}, {…}, {…}, {…}, {…}, {…}]
SafetyAuditDashboard.tsx:82 ✅ Loaded audits: (6) [{…}, {…}, {…}, {…}, {…}, {…}]
SafetyAuditDashboard.tsx:82 ✅ Loaded audits: (6) [{…}, {…}, {…}, {…}, {…}, {…}]
SafetyAuditForm.tsx:769 🔄 Recalculating scores...
SafetyAuditForm.tsx:770 Form Values: {}
SafetyAuditForm.tsx:769 🔄 Recalculating scores...
SafetyAuditForm.tsx:770 Form Values: {}
SafetyAuditForm.tsx:516 🔄 isSubmitting state changed: false
SafetyAuditForm.tsx:628 📸 No initialData provided
SafetyAuditForm.tsx:516 🔄 isSubmitting state changed: false
SafetyAuditForm.tsx:628 📸 No initialData provided
SafetyAuditForm.tsx:769 🔄 Recalculating scores...
SafetyAuditForm.tsx:770 Form Values: {cat01: Array(4), cat02: Array(6), cat03: Array(7)}
SafetyAuditForm.tsx:775 Category cat01 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 4, …}
SafetyAuditForm.tsx:775 Category cat02 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 6, …}
SafetyAuditForm.tsx:775 Category cat03 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 7, …}
SafetyAuditForm.tsx:769 🔄 Recalculating scores...
SafetyAuditForm.tsx:770 Form Values: {cat01: Array(4), cat02: Array(6), cat03: Array(7)}
SafetyAuditForm.tsx:775 Category cat01 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 4, …}
SafetyAuditForm.tsx:775 Category cat02 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 6, …}
SafetyAuditForm.tsx:775 Category cat03 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 7, …}
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
HierarchicalAreaInput.tsx:56 [AREA_INPUT_DEBUG] Props updated: {mainArea: '', subArea1: '', subArea2: ''}
HierarchicalAreaInput.tsx:56 [AREA_INPUT_DEBUG] Props updated: {mainArea: '', subArea1: '', subArea2: ''}
CompanyMultiSelect.tsx:179 🔍 Auth Session Check: {hasSession: false, userId: undefined, userEmail: undefined, role: undefined}
CompanyMultiSelect.tsx:186 🔍 Fetching companies from Supabase (authenticated session)...
CompanyMultiSelect.tsx:179 🔍 Auth Session Check: {hasSession: false, userId: undefined, userEmail: undefined, role: undefined}
CompanyMultiSelect.tsx:186 🔍 Fetching companies from Supabase (authenticated session)...
SafetyAuditForm.tsx:769 🔄 Recalculating scores...
SafetyAuditForm.tsx:770 Form Values: {cat01: Array(4), cat02: Array(6), cat03: Array(7)}
SafetyAuditForm.tsx:775 Category cat01 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 4, …}
SafetyAuditForm.tsx:775 Category cat02 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 6, …}
SafetyAuditForm.tsx:775 Category cat03 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 7, …}
SafetyAuditForm.tsx:769 🔄 Recalculating scores...
SafetyAuditForm.tsx:770 Form Values: {cat01: Array(4), cat02: Array(6), cat03: Array(7)}
SafetyAuditForm.tsx:775 Category cat01 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 4, …}
SafetyAuditForm.tsx:775 Category cat02 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 6, …}
SafetyAuditForm.tsx:775 Category cat03 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 7, …}
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
CompanyMultiSelect.tsx:205 ✅ Query successful - Loaded companies: 5
CompanyMultiSelect.tsx:206 📋 Company data: (5) [{…}, {…}, {…}, {…}, {…}]
hierarchicalAreasApi.ts:43 [HIERARCHICAL_API] Getting main areas for project 5863ee50-89e0-437f-9f1e-507ad568b900: 3
CompanyMultiSelect.tsx:205 ✅ Query successful - Loaded companies: 5
CompanyMultiSelect.tsx:206 📋 Company data: (5) [{…}, {…}, {…}, {…}, {…}]
HierarchicalAreaInput.tsx:235 [MAIN_AREA] Selected existing main area: {id: '8f9ef705-d819-4935-a617-aee4889eccb4', project_id: '5863ee50-89e0-437f-9f1e-507ad568b900', name: 'Building C', code: 'BC', description: 'Main area: Building C', …}
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
HierarchicalAreaInput.tsx:56 [AREA_INPUT_DEBUG] Props updated: {mainArea: 'Building C', subArea1: '', subArea2: ''}
hierarchicalAreasApi.ts:43 [HIERARCHICAL_API] Getting main areas for project 5863ee50-89e0-437f-9f1e-507ad568b900: 3
hierarchicalAreasApi.ts:43 [HIERARCHICAL_API] Getting main areas for project 5863ee50-89e0-437f-9f1e-507ad568b900: 3
hierarchicalAreasApi.ts:123 [HIERARCHICAL_API] Getting sub areas 1 for main area 8f9ef705-d819-4935-a617-aee4889eccb4: 1
HierarchicalAreaInput.tsx:267 [SUB_AREA_1] Creating/selecting: "L20"
hierarchicalAreasApi.ts:43 [HIERARCHICAL_API] Getting main areas for project 5863ee50-89e0-437f-9f1e-507ad568b900: 3
HierarchicalAreaInput.tsx:355 [SUB_AREA_1] Successfully selected: "L20"
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
HierarchicalAreaInput.tsx:56 [AREA_INPUT_DEBUG] Props updated: {mainArea: 'Building C', subArea1: 'L20', subArea2: ''}
hierarchicalAreasApi.ts:43 [HIERARCHICAL_API] Getting main areas for project 5863ee50-89e0-437f-9f1e-507ad568b900: 3
hierarchicalAreasApi.ts:123 [HIERARCHICAL_API] Getting sub areas 1 for main area 8f9ef705-d819-4935-a617-aee4889eccb4: 1
hierarchicalAreasApi.ts:206 [HIERARCHICAL_API] Getting sub areas 2 for sub area 1 28e9339f-d8eb-427d-be57-3eded27ccfbc: 1
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:769 🔄 Recalculating scores...
SafetyAuditForm.tsx:770 Form Values: {cat01: Array(4), cat02: Array(6), cat03: Array(7)}
SafetyAuditForm.tsx:775 Category cat01 score: {total_score: 3, max_score: 3, weighted_avg: 3, percentage: 100, item_count: 4, …}
SafetyAuditForm.tsx:775 Category cat02 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 6, …}
SafetyAuditForm.tsx:775 Category cat03 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 7, …}
SafetyAuditForm.tsx:769 🔄 Recalculating scores...
SafetyAuditForm.tsx:770 Form Values: {cat01: Array(4), cat02: Array(6), cat03: Array(7)}
SafetyAuditForm.tsx:775 Category cat01 score: {total_score: 3, max_score: 3, weighted_avg: 3, percentage: 100, item_count: 4, …}
SafetyAuditForm.tsx:775 Category cat02 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 6, …}
SafetyAuditForm.tsx:775 Category cat03 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 7, …}
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:769 🔄 Recalculating scores...
SafetyAuditForm.tsx:770 Form Values: {cat01: Array(4), cat02: Array(6), cat03: Array(7)}
SafetyAuditForm.tsx:775 Category cat01 score: {total_score: 7, max_score: 9, weighted_avg: 2.3333333333333335, percentage: 77.77777777777779, item_count: 4, …}
SafetyAuditForm.tsx:775 Category cat02 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 6, …}
SafetyAuditForm.tsx:775 Category cat03 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 7, …}
SafetyAuditForm.tsx:769 🔄 Recalculating scores...
SafetyAuditForm.tsx:770 Form Values: {cat01: Array(4), cat02: Array(6), cat03: Array(7)}
SafetyAuditForm.tsx:775 Category cat01 score: {total_score: 7, max_score: 9, weighted_avg: 2.3333333333333335, percentage: 77.77777777777779, item_count: 4, …}
SafetyAuditForm.tsx:775 Category cat02 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 6, …}
SafetyAuditForm.tsx:775 Category cat03 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 7, …}
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:769 🔄 Recalculating scores...
SafetyAuditForm.tsx:770 Form Values: {cat01: Array(4), cat02: Array(6), cat03: Array(7)}
SafetyAuditForm.tsx:775 Category cat01 score: {total_score: 9, max_score: 15, weighted_avg: 1.7999999999999998, percentage: 60, item_count: 4, …}
SafetyAuditForm.tsx:775 Category cat02 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 6, …}
SafetyAuditForm.tsx:775 Category cat03 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 7, …}
SafetyAuditForm.tsx:769 🔄 Recalculating scores...
SafetyAuditForm.tsx:770 Form Values: {cat01: Array(4), cat02: Array(6), cat03: Array(7)}
SafetyAuditForm.tsx:775 Category cat01 score: {total_score: 9, max_score: 15, weighted_avg: 1.7999999999999998, percentage: 60, item_count: 4, …}
SafetyAuditForm.tsx:775 Category cat02 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 6, …}
SafetyAuditForm.tsx:775 Category cat03 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 7, …}
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:769 🔄 Recalculating scores...
SafetyAuditForm.tsx:770 Form Values: {cat01: Array(4), cat02: Array(6), cat03: Array(7)}
SafetyAuditForm.tsx:775 Category cat01 score: {total_score: 12, max_score: 24, weighted_avg: 1.5, percentage: 50, item_count: 4, …}
SafetyAuditForm.tsx:775 Category cat02 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 6, …}
SafetyAuditForm.tsx:775 Category cat03 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 7, …}
SafetyAuditForm.tsx:769 🔄 Recalculating scores...
SafetyAuditForm.tsx:770 Form Values: {cat01: Array(4), cat02: Array(6), cat03: Array(7)}
SafetyAuditForm.tsx:775 Category cat01 score: {total_score: 12, max_score: 24, weighted_avg: 1.5, percentage: 50, item_count: 4, …}
SafetyAuditForm.tsx:775 Category cat02 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 6, …}
SafetyAuditForm.tsx:775 Category cat03 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 7, …}
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:1260 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
SafetyAuditForm.tsx:285 📸 PhotoSection for cat01: 0 photos []
 📸 Rendering PhotoSection: {selectedCategory: 'cat02', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
 📸 Rendering PhotoSection: {selectedCategory: 'cat02', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
 📸 PhotoSection for cat02: 0 photos []
 📸 PhotoSection for cat02: 0 photos []
 🔄 Recalculating scores...
 Form Values: {cat01: Array(4), cat02: Array(6), cat03: Array(7)}
 Category cat01 score: {total_score: 12, max_score: 24, weighted_avg: 1.5, percentage: 50, item_count: 4, …}
 Category cat02 score: {total_score: 4, max_score: 6, weighted_avg: 2, percentage: 66.66666666666666, item_count: 6, …}
 Category cat03 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 7, …}
 🔄 Recalculating scores...
 Form Values: {cat01: Array(4), cat02: Array(6), cat03: Array(7)}
 Category cat01 score: {total_score: 12, max_score: 24, weighted_avg: 1.5, percentage: 50, item_count: 4, …}
 Category cat02 score: {total_score: 4, max_score: 6, weighted_avg: 2, percentage: 66.66666666666666, item_count: 6, …}
 Category cat03 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 7, …}
 📸 Rendering PhotoSection: {selectedCategory: 'cat02', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
 📸 Rendering PhotoSection: {selectedCategory: 'cat02', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
 📸 PhotoSection for cat02: 0 photos []
 📸 PhotoSection for cat02: 0 photos []
 🔄 Recalculating scores...
 Form Values: {cat01: Array(4), cat02: Array(6), cat03: Array(7)}
 Category cat01 score: {total_score: 12, max_score: 24, weighted_avg: 1.5, percentage: 50, item_count: 4, …}
 Category cat02 score: {total_score: 8, max_score: 12, weighted_avg: 2, percentage: 66.66666666666666, item_count: 6, …}
 Category cat03 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 7, …}
 🔄 Recalculating scores...
 Form Values: {cat01: Array(4), cat02: Array(6), cat03: Array(7)}
 Category cat01 score: {total_score: 12, max_score: 24, weighted_avg: 1.5, percentage: 50, item_count: 4, …}
 Category cat02 score: {total_score: 8, max_score: 12, weighted_avg: 2, percentage: 66.66666666666666, item_count: 6, …}
 Category cat03 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 7, …}
 📸 Rendering PhotoSection: {selectedCategory: 'cat02', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
 📸 Rendering PhotoSection: {selectedCategory: 'cat02', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
 📸 PhotoSection for cat02: 0 photos []
 📸 PhotoSection for cat02: 0 photos []
 🔄 Recalculating scores...
 Form Values: {cat01: Array(4), cat02: Array(6), cat03: Array(7)}
 Category cat01 score: {total_score: 12, max_score: 24, weighted_avg: 1.5, percentage: 50, item_count: 4, …}
 Category cat02 score: {total_score: 14, max_score: 18, weighted_avg: 2.3333333333333335, percentage: 77.77777777777779, item_count: 6, …}
 Category cat03 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 7, …}
 🔄 Recalculating scores...
 Form Values: {cat01: Array(4), cat02: Array(6), cat03: Array(7)}
 Category cat01 score: {total_score: 12, max_score: 24, weighted_avg: 1.5, percentage: 50, item_count: 4, …}
 Category cat02 score: {total_score: 14, max_score: 18, weighted_avg: 2.3333333333333335, percentage: 77.77777777777779, item_count: 6, …}
 Category cat03 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 7, …}
 📸 Rendering PhotoSection: {selectedCategory: 'cat02', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
 📸 Rendering PhotoSection: {selectedCategory: 'cat02', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
 📸 PhotoSection for cat02: 0 photos []
 📸 PhotoSection for cat02: 0 photos []
 🔄 Recalculating scores...
 Form Values: {cat01: Array(4), cat02: Array(6), cat03: Array(7)}
 Category cat01 score: {total_score: 12, max_score: 24, weighted_avg: 1.5, percentage: 50, item_count: 4, …}
 Category cat02 score: {total_score: 16, max_score: 21, weighted_avg: 2.2857142857142856, percentage: 76.19047619047619, item_count: 6, …}
 Category cat03 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 7, …}
 🔄 Recalculating scores...
 Form Values: {cat01: Array(4), cat02: Array(6), cat03: Array(7)}
 Category cat01 score: {total_score: 12, max_score: 24, weighted_avg: 1.5, percentage: 50, item_count: 4, …}
 Category cat02 score: {total_score: 16, max_score: 21, weighted_avg: 2.2857142857142856, percentage: 76.19047619047619, item_count: 6, …}
 Category cat03 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 7, …}
 📸 Rendering PhotoSection: {selectedCategory: 'cat02', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
 📸 Rendering PhotoSection: {selectedCategory: 'cat02', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
 📸 PhotoSection for cat02: 0 photos []
 📸 PhotoSection for cat02: 0 photos []
 🔄 Recalculating scores...
 Form Values: {cat01: Array(4), cat02: Array(6), cat03: Array(7)}
 Category cat01 score: {total_score: 12, max_score: 24, weighted_avg: 1.5, percentage: 50, item_count: 4, …}
 Category cat02 score: {total_score: 22, max_score: 30, weighted_avg: 2.1999999999999997, percentage: 73.33333333333333, item_count: 6, …}
 Category cat03 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 7, …}
 🔄 Recalculating scores...
 Form Values: {cat01: Array(4), cat02: Array(6), cat03: Array(7)}
 Category cat01 score: {total_score: 12, max_score: 24, weighted_avg: 1.5, percentage: 50, item_count: 4, …}
 Category cat02 score: {total_score: 22, max_score: 30, weighted_avg: 2.1999999999999997, percentage: 73.33333333333333, item_count: 6, …}
 Category cat03 score: {total_score: 0, max_score: 0, weighted_avg: 0, percentage: 0, item_count: 7, …}
 📸 Rendering PhotoSection: {selectedCategory: 'cat02', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
 📸 Rendering PhotoSection: {selectedCategory: 'cat02', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(0)}
 📸 PhotoSection for cat02: 0 photos []
 📸 PhotoSection for cat02: 0 photos []
 📸 Rendering PhotoSection: {selectedCategory: 'cat02', photosForCategory: Array(1), photoCount: 1, allPhotosByCategory: {…}, photoKeys: Array(1)}
 📸 Rendering PhotoSection: {selectedCategory: 'cat02', photosForCategory: Array(1), photoCount: 1, allPhotosByCategory: {…}, photoKeys: Array(1)}
 📸 PhotoSection for cat02: 1 photos [{…}]
 📸 PhotoSection for cat02: 1 photos [{…}]
 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(1)}
 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(0), photoCount: 0, allPhotosByCategory: {…}, photoKeys: Array(1)}
 📸 PhotoSection for cat01: 0 photos []
 📸 PhotoSection for cat01: 0 photos []
 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(1), photoCount: 1, allPhotosByCategory: {…}, photoKeys: Array(2)}
 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(1), photoCount: 1, allPhotosByCategory: {…}, photoKeys: Array(2)}
 📸 PhotoSection for cat01: 1 photos [{…}]
 📸 PhotoSection for cat01: 1 photos [{…}]
 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(1), photoCount: 1, allPhotosByCategory: {…}, photoKeys: Array(2)}
 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(1), photoCount: 1, allPhotosByCategory: {…}, photoKeys: Array(2)}
 📸 PhotoSection for cat01: 1 photos [{…}]
 📸 PhotoSection for cat01: 1 photos [{…}]
 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(1), photoCount: 1, allPhotosByCategory: {…}, photoKeys: Array(2)}
 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(1), photoCount: 1, allPhotosByCategory: {…}, photoKeys: Array(2)}
 📸 PhotoSection for cat01: 1 photos [{…}]
 📸 PhotoSection for cat01: 1 photos [{…}]
 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(1), photoCount: 1, allPhotosByCategory: {…}, photoKeys: Array(2)}
 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(1), photoCount: 1, allPhotosByCategory: {…}, photoKeys: Array(2)}
 📸 PhotoSection for cat01: 1 photos [{…}]
 📸 PhotoSection for cat01: 1 photos [{…}]
 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(1), photoCount: 1, allPhotosByCategory: {…}, photoKeys: Array(2)}
 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(1), photoCount: 1, allPhotosByCategory: {…}, photoKeys: Array(2)}
 📸 PhotoSection for cat01: 1 photos [{…}]
 📸 PhotoSection for cat01: 1 photos [{…}]
 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(1), photoCount: 1, allPhotosByCategory: {…}, photoKeys: Array(2)}
 📸 Rendering PhotoSection: {selectedCategory: 'cat01', photosForCategory: Array(1), photoCount: 1, allPhotosByCategory: {…}, photoKeys: Array(2)}
 📸 PhotoSection for cat01: 1 photos [{…}]
 📸 PhotoSection for cat01: 1 photos [{…}]
