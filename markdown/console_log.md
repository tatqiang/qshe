project-planning:30 Dark mode forced OFF
project-planning:31 localStorage.darkMode: false
project-planning:32 HTML classes: 
index.ts:123 🔧 Router initialized with routes: (19) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
ProjectSelector.vue:144 🔍 ProjectSelector - Loading projects
ProjectSelector.vue:145 👤 Current user: null
ProjectSelector.vue:146 🔐 User role: undefined
projectStore.ts:46 🏪 projectStore.loadActiveProjects - Passing user: null
authStore.ts:31 🔍 Initializing auth...
index.ts:132 🚦 Router guard - Going to: /project-planning Auth required: true
index.ts:133 🚦 Current auth status: false
index.ts:134 🚦 Auth already checked: false
index.ts:145 ⏳ First navigation - initializing auth...
authStore.ts:31 🔍 Initializing auth...
azureAuth.ts:73 ✅ MSAL initialized successfully
authStore.ts:34 📊 isLoggedIn: true
authStore.ts:34 📊 isLoggedIn: true
authStore.ts:43 🔑 Access token: EXISTS
authStore.ts:43 🔑 Access token: EXISTS
authStore.ts:53 👤 User profile: nithat.su@th.jec.com
authStore.ts:53 👤 User profile: nithat.su@th.jec.com
project-planning:1 Banner not shown: beforeinstallpromptevent.preventDefault() called. The page must call beforeinstallpromptevent.prompt() to show the banner.
authStore.ts:81 ✅ User loaded from database: nithat.su@th.jec.com Role: system_admin
authStore.ts:81 ✅ User loaded from database: nithat.su@th.jec.com Role: system_admin
projectService.ts:40 ✅ Projects loaded from server: 8
projectService.ts:57 🔍 getActive - Total projects: 8
projectService.ts:58 👤 User role: no user
projectService.ts:59 📋 All projects: (8) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
projectService.ts:63 ✅ Active projects: 7
projectService.ts:64 📋 Active projects list: (7) [{…}, {…}, {…}, {…}, {…}, {…}, {…}]
projectService.ts:68 🔐 Is admin: false
projectService.ts:73 🎭 Filtered test projects: 7 -> 6
projectService.ts:78 📊 Final projects to show: (6) ['AIA Connect', 'Anantara hotel', 'Cloud11', 'DCP-R', 'Mega Bangna', 'Pomelo']
ProjectSelector.vue:148 📊 Projects loaded: 6
authStore.ts:89  POST https://wbzzvchjdqtzxwwquogl.supabase.co/auth/v1/token?grant_type=password 400 (Bad Request)
(anonymous) @ @supabase_supabase-js.js?v=3d7c931d:6548
_handleRequest3 @ @supabase_supabase-js.js?v=3d7c931d:6838
_request @ @supabase_supabase-js.js?v=3d7c931d:6828
signInWithPassword @ @supabase_supabase-js.js?v=3d7c931d:8559
initialize @ authStore.ts:89
await in initialize
wrappedAction @ pinia.js?v=3d7c931d:5508
store.<computed> @ pinia.js?v=3d7c931d:5205
(anonymous) @ index.ts:146
(anonymous) @ vue-router.js?v=3d7c931d:595
runWithContext @ vue-router.js?v=3d7c931d:577
(anonymous) @ vue-router.js?v=3d7c931d:595
(anonymous) @ vue-router.js?v=3d7c931d:579
runWithContext @ chunk-BZD72IEI.js?v=3d7c931d:6183
runWithContext @ vue-router.js?v=3d7c931d:2162
(anonymous) @ vue-router.js?v=3d7c931d:2351
Promise.then
(anonymous) @ vue-router.js?v=3d7c931d:2351
runGuardQueue @ vue-router.js?v=3d7c931d:2351
(anonymous) @ vue-router.js?v=3d7c931d:2177
Promise.then
navigate @ vue-router.js?v=3d7c931d:2173
pushWithRedirect @ vue-router.js?v=3d7c931d:2138
push @ vue-router.js?v=3d7c931d:2089
install @ vue-router.js?v=3d7c931d:2321
use @ chunk-BZD72IEI.js?v=3d7c931d:6046
(anonymous) @ main.ts:10
authStore.ts:89  POST https://wbzzvchjdqtzxwwquogl.supabase.co/auth/v1/token?grant_type=password 400 (Bad Request)
(anonymous) @ @supabase_supabase-js.js?v=3d7c931d:6548
_handleRequest3 @ @supabase_supabase-js.js?v=3d7c931d:6838
_request @ @supabase_supabase-js.js?v=3d7c931d:6828
signInWithPassword @ @supabase_supabase-js.js?v=3d7c931d:8559
initialize @ authStore.ts:89
await in initialize
wrappedAction @ pinia.js?v=3d7c931d:5508
store.<computed> @ pinia.js?v=3d7c931d:5205
(anonymous) @ App.vue:18
(anonymous) @ chunk-BZD72IEI.js?v=3d7c931d:5003
callWithErrorHandling @ chunk-BZD72IEI.js?v=3d7c931d:2296
callWithAsyncErrorHandling @ chunk-BZD72IEI.js?v=3d7c931d:2303
hook.__weh.hook.__weh @ chunk-BZD72IEI.js?v=3d7c931d:4983
flushPostFlushCbs @ chunk-BZD72IEI.js?v=3d7c931d:2481
render2 @ chunk-BZD72IEI.js?v=3d7c931d:8211
mount @ chunk-BZD72IEI.js?v=3d7c931d:6122
app.mount @ chunk-BZD72IEI.js?v=3d7c931d:12437
(anonymous) @ main.ts:11
authStore.ts:97 📝 Creating Supabase session for Azure user...
authStore.ts:97 📝 Creating Supabase session for Azure user...
@supabase_supabase-js.js?v=3d7c931d:6125  POST https://wbzzvchjdqtzxwwquogl.supabase.co/rest/v1/rpc/create_azure_session 404 (Not Found)
(anonymous) @ @supabase_supabase-js.js?v=3d7c931d:6125
(anonymous) @ @supabase_supabase-js.js?v=3d7c931d:6143
await in (anonymous)
then @ @supabase_supabase-js.js?v=3d7c931d:606
authStore.ts:108 ⚠️ Could not create session (non-critical): {code: 'PGRST202', details: 'Searched for the function public.create_azure_sess…r, but no matches were found in the schema cache.', hint: 'Perhaps you meant to call the function public.generate_material_description', message: 'Could not find the function public.create_azure_session(p_email, p_user_id) in the schema cache'}
initialize @ authStore.ts:108
await in initialize
wrappedAction @ pinia.js?v=3d7c931d:5508
store.<computed> @ pinia.js?v=3d7c931d:5205
(anonymous) @ index.ts:146
(anonymous) @ vue-router.js?v=3d7c931d:595
runWithContext @ vue-router.js?v=3d7c931d:577
(anonymous) @ vue-router.js?v=3d7c931d:595
(anonymous) @ vue-router.js?v=3d7c931d:579
runWithContext @ chunk-BZD72IEI.js?v=3d7c931d:6183
runWithContext @ vue-router.js?v=3d7c931d:2162
(anonymous) @ vue-router.js?v=3d7c931d:2351
Promise.then
(anonymous) @ vue-router.js?v=3d7c931d:2351
runGuardQueue @ vue-router.js?v=3d7c931d:2351
(anonymous) @ vue-router.js?v=3d7c931d:2177
Promise.then
navigate @ vue-router.js?v=3d7c931d:2173
pushWithRedirect @ vue-router.js?v=3d7c931d:2138
push @ vue-router.js?v=3d7c931d:2089
install @ vue-router.js?v=3d7c931d:2321
use @ chunk-BZD72IEI.js?v=3d7c931d:6046
(anonymous) @ main.ts:10
authStore.ts:128 ✅ Auth initialization complete. Authenticated: true
index.ts:148 ✅ Auth initialized. Status: true
index.ts:162 ✅ Access granted
@supabase_supabase-js.js?v=3d7c931d:6125  POST https://wbzzvchjdqtzxwwquogl.supabase.co/rest/v1/rpc/create_azure_session 404 (Not Found)
(anonymous) @ @supabase_supabase-js.js?v=3d7c931d:6125
(anonymous) @ @supabase_supabase-js.js?v=3d7c931d:6143
await in (anonymous)
then @ @supabase_supabase-js.js?v=3d7c931d:606
authStore.ts:108 ⚠️ Could not create session (non-critical): {code: 'PGRST202', details: 'Searched for the function public.create_azure_sess…r, but no matches were found in the schema cache.', hint: 'Perhaps you meant to call the function public.generate_material_description', message: 'Could not find the function public.create_azure_session(p_email, p_user_id) in the schema cache'}
initialize @ authStore.ts:108
await in initialize
wrappedAction @ pinia.js?v=3d7c931d:5508
store.<computed> @ pinia.js?v=3d7c931d:5205
(anonymous) @ App.vue:18
(anonymous) @ chunk-BZD72IEI.js?v=3d7c931d:5003
callWithErrorHandling @ chunk-BZD72IEI.js?v=3d7c931d:2296
callWithAsyncErrorHandling @ chunk-BZD72IEI.js?v=3d7c931d:2303
hook.__weh.hook.__weh @ chunk-BZD72IEI.js?v=3d7c931d:4983
flushPostFlushCbs @ chunk-BZD72IEI.js?v=3d7c931d:2481
render2 @ chunk-BZD72IEI.js?v=3d7c931d:8211
mount @ chunk-BZD72IEI.js?v=3d7c931d:6122
app.mount @ chunk-BZD72IEI.js?v=3d7c931d:12437
(anonymous) @ main.ts:11
authStore.ts:128 ✅ Auth initialization complete. Authenticated: true
ProjectPlanningView.vue:476 🔍 Project changed: Proxy(Object) {id: '65f5e3d1-6c7a-4159-8a49-8291a078dd67', name: 'Pomelo', description: '', created_at: '2025-10-14T03:37:24.334122+00:00', updated_at: '2025-10-14T03:37:24.334122+00:00', …}
ProjectPlanningView.vue:416 📊 Loading project planning for: 65f5e3d1-6c7a-4159-8a49-8291a078dd67
ProjectPlanningView.vue:430 ✅ Project data: {id: '65f5e3d1-6c7a-4159-8a49-8291a078dd67', name: 'Pomelo', description: '', created_at: '2025-10-14T03:37:24.334122+00:00', updated_at: '2025-10-14T03:37:24.334122+00:00', …}
ProjectPlanningView.vue:434 ✅ Tasks loaded: 2
ProjectPlanningView.vue:438 ✅ Areas loaded: 4
ProjectPlanningView.vue:446 ✅ Sub areas loaded for DCH: 0
ProjectPlanningView.vue:446 ✅ Sub areas loaded for EYD: 1
ProjectPlanningView.vue:446 ✅ Sub areas loaded for FSA: 0
ProjectPlanningView.vue:446 ✅ Sub areas loaded for MYD: 0
ProjectPlanningView.vue:465 ✅ Current project set: Proxy(Object) {id: '65f5e3d1-6c7a-4159-8a49-8291a078dd67', projectCode: 'PML01', name: 'Pomelo', description: '', startDate: Sat Jun 01 2024 07:00:00 GMT+0700 (Indochina Time), …}
ProjectPlanningView.vue:895 Loaded ITRs: 13 Systems: 5 Types: 4
GanttChart.vue:742 ITR button clicked for task: c373683b-75b1-41ac-93b4-ec7ee9734dfd
ProjectPlanningView.vue:804 handleRequestITR called with taskId: c373683b-75b1-41ac-93b4-ec7ee9734dfd
ProjectPlanningView.vue:805 currentProject: Proxy(Object) {id: '65f5e3d1-6c7a-4159-8a49-8291a078dd67', projectCode: 'PML01', name: 'Pomelo', description: '', startDate: Sat Jun 01 2024 07:00:00 GMT+0700 (Indochina Time), …}
ProjectPlanningView.vue:808 Found task: Proxy(Object) {id: 'c373683b-75b1-41ac-93b4-ec7ee9734dfd', taskId: 'task-1769874134262', projectId: '65f5e3d1-6c7a-4159-8a49-8291a078dd67', parentTaskId: '75006ebb-a393-4c7a-85b2-f7fde3245db0', displayOrder: 1, …}
ProjectPlanningView.vue:817 showITRModal set to true
ITRRequestModal.vue:838 Modal opened with projectId: 65f5e3d1-6c7a-4159-8a49-8291a078dd67
ITRRequestModal.vue:776 Loading reference data, projectId: 65f5e3d1-6c7a-4159-8a49-8291a078dd67
ITRRequestModal.vue:784 Loading systems and ITR types...
ITRRequestModal.vue:845 Prefilling location from task: Proxy(Object) {mainAreaId: '4eb92ea9-ad45-43d3-b5a6-e38e7166fc95', mainAreaName: 'EYD'}
ITRRequestModal.vue:885 Task changed - Updating location: Proxy(Object) {mainAreaId: '4eb92ea9-ad45-43d3-b5a6-e38e7166fc95', mainAreaName: 'EYD'}
ITRRequestModal.vue:788 Loaded systems: 5
ITRRequestModal.vue:791 Loaded ITR types: 4
ITRRequestModal.vue:810 Loading Google Sheets data...
ITRRequestModal.vue:814 Loaded ITP docs: 3 Material docs: 1
ProjectPlanningView.vue:827 📝 Current user ID from authStore: 63465875-d4cb-4c1b-9e38-f1744508eeeb
ProjectPlanningView.vue:828 📝 Auth store user: Proxy(Object) {id: '63465875-d4cb-4c1b-9e38-f1744508eeeb', email: 'nithat.su@th.jec.com', first_name: 'Nithat', last_name: 'Suksomboonlert', user_type: 'internal', …}
ProjectPlanningView.vue:838 ITR created: 75dc3395-fdce-42d4-a4fb-7b37abbfe117
ProjectPlanningView.vue:842 Uploading 1 attachments...
@supabase_supabase-js.js?v=3d7c931d:6125  POST https://wbzzvchjdqtzxwwquogl.supabase.co/rest/v1/construction_itr_attachments?select=* 409 (Conflict)
(anonymous) @ @supabase_supabase-js.js?v=3d7c931d:6125
(anonymous) @ @supabase_supabase-js.js?v=3d7c931d:6143
await in (anonymous)
then @ @supabase_supabase-js.js?v=3d7c931d:606
constructionITRService.ts:522 Error saving attachment: {code: '23503', details: 'Key (uploaded_by)=(63465875-d4cb-4c1b-9e38-f1744508eeeb) is not present in table "users".', hint: null, message: 'insert or update on table "construction_itr_attach…t "construction_itr_attachments_uploaded_by_fkey"'}
uploadAttachment @ constructionITRService.ts:522
await in uploadAttachment
handleITRSubmit @ ProjectPlanningView.vue:846
await in handleITRSubmit
callWithErrorHandling @ chunk-BZD72IEI.js?v=3d7c931d:2296
callWithAsyncErrorHandling @ chunk-BZD72IEI.js?v=3d7c931d:2303
emit @ chunk-BZD72IEI.js?v=3d7c931d:8604
(anonymous) @ chunk-BZD72IEI.js?v=3d7c931d:10323
saveAsDraft @ ITRRequestModal.vue:1031
callWithErrorHandling @ chunk-BZD72IEI.js?v=3d7c931d:2296
callWithAsyncErrorHandling @ chunk-BZD72IEI.js?v=3d7c931d:2303
invoker @ chunk-BZD72IEI.js?v=3d7c931d:11358
constructionITRService.ts:523 User ID: 63465875-d4cb-4c1b-9e38-f1744508eeeb
uploadAttachment @ constructionITRService.ts:523
await in uploadAttachment
handleITRSubmit @ ProjectPlanningView.vue:846
await in handleITRSubmit
callWithErrorHandling @ chunk-BZD72IEI.js?v=3d7c931d:2296
callWithAsyncErrorHandling @ chunk-BZD72IEI.js?v=3d7c931d:2303
emit @ chunk-BZD72IEI.js?v=3d7c931d:8604
(anonymous) @ chunk-BZD72IEI.js?v=3d7c931d:10323
saveAsDraft @ ITRRequestModal.vue:1031
callWithErrorHandling @ chunk-BZD72IEI.js?v=3d7c931d:2296
callWithAsyncErrorHandling @ chunk-BZD72IEI.js?v=3d7c931d:2303
invoker @ chunk-BZD72IEI.js?v=3d7c931d:11358
constructionITRService.ts:524 ITR ID: 75dc3395-fdce-42d4-a4fb-7b37abbfe117
uploadAttachment @ constructionITRService.ts:524
await in uploadAttachment
handleITRSubmit @ ProjectPlanningView.vue:846
await in handleITRSubmit
callWithErrorHandling @ chunk-BZD72IEI.js?v=3d7c931d:2296
callWithAsyncErrorHandling @ chunk-BZD72IEI.js?v=3d7c931d:2303
emit @ chunk-BZD72IEI.js?v=3d7c931d:8604
(anonymous) @ chunk-BZD72IEI.js?v=3d7c931d:10323
saveAsDraft @ ITRRequestModal.vue:1031
callWithErrorHandling @ chunk-BZD72IEI.js?v=3d7c931d:2296
callWithAsyncErrorHandling @ chunk-BZD72IEI.js?v=3d7c931d:2303
invoker @ chunk-BZD72IEI.js?v=3d7c931d:11358
ProjectPlanningView.vue:854 ✗ Failed to upload PR_ถุงมือกันบาด_Pomelo_NS.pdf: Error: Failed to save attachment: insert or update on table "construction_itr_attachments" violates foreign key constraint "construction_itr_attachments_uploaded_by_fkey"
    at ConstructionITRService.uploadAttachment (constructionITRService.ts:525:13)
    at async handleITRSubmit (ProjectPlanningView.vue:846:11)
handleITRSubmit @ ProjectPlanningView.vue:854
await in handleITRSubmit
callWithErrorHandling @ chunk-BZD72IEI.js?v=3d7c931d:2296
callWithAsyncErrorHandling @ chunk-BZD72IEI.js?v=3d7c931d:2303
emit @ chunk-BZD72IEI.js?v=3d7c931d:8604
(anonymous) @ chunk-BZD72IEI.js?v=3d7c931d:10323
saveAsDraft @ ITRRequestModal.vue:1031
callWithErrorHandling @ chunk-BZD72IEI.js?v=3d7c931d:2296
callWithAsyncErrorHandling @ chunk-BZD72IEI.js?v=3d7c931d:2303
invoker @ chunk-BZD72IEI.js?v=3d7c931d:11358
ProjectPlanningView.vue:895 Loaded ITRs: 14 Systems: 5 Types: 4
