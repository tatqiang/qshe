import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { AppProvider } from './contexts/AppContext';
import { AuthWrapper } from './components/features/auth/AuthWrapper';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { MainLayout } from './components/layouts/MainLayout';
import { Dashboard } from './components/features/Dashboard';
import { UserManagement } from './components/features/users/UserManagement';
import { PreRegistrationManagement } from './components/features/admin/PreRegistrationManagement';
import { PreRegistrationTest } from './components/features/admin/PreRegistrationTest';
import { SystemSettings } from './components/features/admin/SystemSettings';
import { SystemAdminOnly } from './components/common/RoleGuard';
import { TokenValidation } from './components/features/registration/TokenValidation';
import { PublicRegistration } from './components/features/registration/PublicRegistration';
import { CompleteProfilePage } from './components/profile-completion/CompleteProfilePage';
import { EditProfilePage } from './components/profile-completion/EditProfilePage';
import { MyProfileEditPage } from './components/features/users/MyProfileEditPage';
import { PasswordReset } from './pages/PasswordReset';
import { FaceApiDemo } from './pages/FaceApiDemo';
import { DatabaseFaceDetectionTest } from './pages/DatabaseFaceDetectionTest';
import { FaceRecognitionLibraryComparison } from './pages/FaceRecognitionLibraryComparison';
import { DatabaseMigration } from './pages/DatabaseMigration';
import { PunchListDemo } from './pages/PunchListDemo';
import SafetyPatrolDashboard from './components/features/safety/SafetyPatrolDashboard';
// import SafetyAuditDashboard from './components/features/safety/SafetyAuditDashboard';
import HierarchicalAreasDemo from './components/features/HierarchicalAreasDemo';
import GlobalStateTest from './components/test/GlobalStateTest';
import { azureADService } from './lib/api/azureAD';
import { UserAssignmentDemo } from './components/demo/UserAssignmentDemo';
import ProjectManagement from './components/features/projects/ProjectManagement';
import { HRCiTestComponent } from './components/demo/HRCiTestComponent';
import { MembersManagementPage } from './pages/admin/MembersManagementPage';
import { ProjectFormConfigPage } from './pages/admin/ProjectFormConfigPage';
import { TestFormConfigPage } from './pages/admin/TestFormConfigPage';
import { MemberApplyPage } from './pages/public/MemberApplyPage';
import { MemberFormPage } from './pages/public/MemberFormPage';
import { MemberReportPage } from './pages/public/MemberReportPage';
import { MaterialsPage } from './pages/Materials';
import { MaterialsAddPage } from './pages/MaterialsAdd';
import { MaterialConfigPage } from './pages/admin/MaterialConfigPage';

// Initialize session debug tools in development
if (import.meta.env.DEV) {
  import('./utils/sessionDebug');
  import('./utils/debugUsers');
}

function App() {
  // Initialize Azure AD service on app startup
  useEffect(() => {
    const initializeAzureAD = async () => {
      try {
        await azureADService.initialize();
        console.log('✅ Azure AD service initialized');
      } catch (error) {
        console.error('❌ Azure AD initialization failed:', error);
      }
    };
    
    initializeAzureAD();
  }, []);
  return (
  <ErrorBoundary>
    <Provider store={store}>
      <AppProvider>
        <Router>
          <AuthWrapper>
          <Routes>
            {/* Public routes (outside MainLayout) */}
            <Route path="/invite/:token" element={<TokenValidation />} />
            <Route path="/register/:token" element={<PublicRegistration />} />
            <Route path="/reset-password" element={<PasswordReset />} />
            <Route path="/complete-profile" element={<CompleteProfilePage />} />
            <Route path="/face-api" element={<FaceApiDemo />} />
            <Route path="/face-api-demo" element={<FaceApiDemo />} />
            <Route path="/face-db-test" element={<DatabaseFaceDetectionTest />} />
            <Route path="/face-recognition-library-comparison" element={<FaceRecognitionLibraryComparison />} />
            <Route path="/db-migration" element={<DatabaseMigration />} />
            
            {/* Public Member Application routes */}
            <Route path="/public/member-apply" element={<MemberApplyPage />} />
            <Route path="/public/member-form" element={<MemberFormPage />} />
            <Route path="/public/member-form/:id" element={<MemberFormPage />} />
            
            {/* Protected Member Report routes - require authentication */}
            <Route path="/member-report/:id" element={<MemberReportPage />} />
            
            {/* Protected routes (inside MainLayout) */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/" element={<MainLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="projects" element={<ProjectManagement />} />
              <Route path="patrol" element={<SafetyPatrolDashboard />} />
              <Route path="audit" element={<div>Safety Audit (Coming Soon)</div>} />
              <Route path="materials" element={<MaterialsPage />} />
              <Route path="materials/add" element={<MaterialsAddPage />} />
              <Route path="areas-demo" element={<HierarchicalAreasDemo />} />
              <Route path="punch-list-demo" element={<PunchListDemo />} />
              <Route path="global-state-test" element={<GlobalStateTest />} />
              <Route path="user-assignment-demo" element={<UserAssignmentDemo />} />
              <Route path="hrci-test" element={<HRCiTestComponent />} />
              <Route path="ptw" element={<div>Permit to Work (Coming Soon)</div>} />
              <Route path="toolbox" element={<div>Toolbox Meetings (Coming Soon)</div>} />
              <Route path="users" element={<UserManagement />} />
              <Route path="users/:userId/edit" element={<EditProfilePage />} />
              <Route path="admin/users/:userId/edit" element={<EditProfilePage />} />
              <Route path="admin/system" element={<SystemSettings />} />
              <Route path="admin/members" element={<MembersManagementPage />} />
              <Route path="admin/material-config" element={<MaterialConfigPage />} />
              <Route path="admin/project-form-config" element={<ProjectFormConfigPage />} />
              <Route path="admin/test-form-config" element={<TestFormConfigPage />} />
              <Route path="my-profile/edit" element={<MyProfileEditPage />} />
              <Route path="settings" element={<div>Settings (Coming Soon)</div>} />
              <Route path="more" element={<div>More Options (Coming Soon)</div>} />
            </Route>
          </Routes>
        </AuthWrapper>
      </Router>
    </AppProvider>
  </Provider>
  </ErrorBoundary>
  );
}

export default App;
