import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  ProtectedRoute,
  PublicOnlyRoute,
  AdminProtectedRoute,
  AdminPublicOnlyRoute,
} from './components/ProtectedRoute';

// Student Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FindGroups from './pages/FindGroups';
import CreateGroup from './pages/CreateGroup';
import GroupDetails from './pages/GroupDetails';
import MyGroups from './pages/MyGroups';
import StudySessions from './pages/StudySessions';
import StudyMaterials from './pages/StudyMaterials';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import RealTimeExecutor from './pages/RealTimeExecutor';
import NotFound from './pages/NotFound';

// Administrator Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminGroups from './pages/admin/AdminGroups';
import AdminSessions from './pages/admin/AdminSessions';
import AdminMaterials from './pages/admin/AdminMaterials';
import AdminMessages from './pages/admin/AdminMessages';
import AdminReports from './pages/admin/AdminReports';
import AdminActivityLogs from './pages/admin/AdminActivityLogs';
import AdminSettings from './pages/admin/AdminSettings';
import AdminProfile from './pages/admin/AdminProfile';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Landing */}
            <Route path="/" element={<Home />} />

            {/* Public Only Auth Routes */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <Register />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicOnlyRoute>
                  <ForgotPassword />
                </PublicOnlyRoute>
              }
            />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* Administrator Auth Route */}
            <Route
              path="/admin/login"
              element={
                <AdminPublicOnlyRoute>
                  <AdminLogin />
                </AdminPublicOnlyRoute>
              }
            />

            {/* Protected Student Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Groups Routes - Specific before Dynamic */}
            <Route
              path="/groups"
              element={
                <ProtectedRoute>
                  <FindGroups />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/create"
              element={
                <ProtectedRoute>
                  <CreateGroup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/:groupId"
              element={
                <ProtectedRoute>
                  <GroupDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-groups"
              element={
                <ProtectedRoute>
                  <MyGroups />
                </ProtectedRoute>
              }
            />

            {/* Study Sessions & Materials */}
            <Route
              path="/sessions"
              element={
                <ProtectedRoute>
                  <StudySessions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/materials"
              element={
                <ProtectedRoute>
                  <StudyMaterials />
                </ProtectedRoute>
              }
            />

            {/* Messaging */}
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />

            {/* Real-Time Code Executor */}
            <Route
              path="/executor"
              element={
                <ProtectedRoute>
                  <RealTimeExecutor />
                </ProtectedRoute>
              }
            />

            {/* User Account */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Dedicated Administrator Protected Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminProtectedRoute>
                  <AdminUsers />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/groups"
              element={
                <AdminProtectedRoute>
                  <AdminGroups />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/sessions"
              element={
                <AdminProtectedRoute>
                  <AdminSessions />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/materials"
              element={
                <AdminProtectedRoute>
                  <AdminMaterials />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/messages"
              element={
                <AdminProtectedRoute>
                  <AdminMessages />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <AdminProtectedRoute>
                  <AdminReports />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/activity-logs"
              element={
                <AdminProtectedRoute>
                  <AdminActivityLogs />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <AdminProtectedRoute>
                  <AdminSettings />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/profile"
              element={
                <AdminProtectedRoute>
                  <AdminProfile />
                </AdminProtectedRoute>
              }
            />

            {/* 404 Catch All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;