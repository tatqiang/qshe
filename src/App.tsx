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
import HierarchicalAreasDemo from './components/features/HierarchicalAreasDemo';
import GlobalStateTest from './components/test/GlobalStateTest';

// Initialize session debug tools in development
if (import.meta.env.DEV) {
  import('./utils/sessionDebug');
}

function App() {
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
            
            {/* Protected routes (inside MainLayout) */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/" element={<MainLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="patrol" element={<SafetyPatrolDashboard />} />
              <Route path="areas-demo" element={<HierarchicalAreasDemo />} />
              <Route path="punch-list-demo" element={<PunchListDemo />} />
              <Route path="global-state-test" element={<GlobalStateTest />} />
              <Route path="ptw" element={<div>Permit to Work (Coming Soon)</div>} />
              <Route path="toolbox" element={<div>Toolbox Meetings (Coming Soon)</div>} />
              <Route path="users" element={<UserManagement />} />
              <Route path="users/:userId/edit" element={<EditProfilePage />} />
              <Route path="admin/users/:userId/edit" element={<EditProfilePage />} />
              <Route path="admin/system" element={<SystemSettings />} />
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
