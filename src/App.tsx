import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import MasterData from './components/MasterData/MasterData';
import PurchaseOrders from './components/PurchaseOrders/PurchaseOrders';
import Scheduling from './components/Scheduling/Scheduling';
import Reports from './components/Reports/Reports';
import Notifications from './components/Notifications/Notifications';
import Alerts from './components/Alerts/Alerts';
import HolidaySettings from './components/HolidaySettings';
import Settings from './components/Settings/Settings';
import { AppProvider, useApp } from './contexts/AppContext';
import SignIn from './components/Auth/SignIn';
import SignUp from './components/Auth/SignUp';
import React, { useState } from 'react';

const rolePermissions = {
  superadmin: {
    dashboard: true,
    'master-data': true,
    'purchase-orders': true,
    scheduling: true,
    reports: true,
    notifications: true,
    alerts: true,
    holidays: true,
  },
  admin: {
    dashboard: true,
    'master-data': true,
    'purchase-orders': true,
    scheduling: true,
    reports: true,
    notifications: true,
    alerts: true,
    holidays: true,
  },
  operator: {
    dashboard: true,
    'master-data': false,
    'purchase-orders': true,
    scheduling: true,
    reports: false,
    notifications: true,
    alerts: true,
    holidays: false,
  },
};

function NotAuthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-blue-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-red-200 flex flex-col items-center">
        <span className="text-5xl mb-2">🚫</span>
        <h2 className="text-2xl font-bold text-red-700 mb-2">Not Authorized</h2>
        <p className="text-gray-700 text-center">You do not have permission to access this page.</p>
        <a href="#/dashboard" className="mt-4 text-blue-600 underline">Go to Dashboard</a>
      </div>
    </div>
  );
}

function ProtectedRoute({ page, children }: { page: keyof typeof rolePermissions['admin'], children: React.ReactNode }) {
  const { user } = useApp();
  if (!user) return null;
  // Map 'manager' to 'admin' for permissions
  let role = (user.role === 'manager' ? 'admin' : user.role) as 'admin' | 'superadmin' | 'operator';
  if (rolePermissions[role][page]) {
    return <>{children}</>;
  }
  return <NotAuthorized />;
}

function AuthGate() {
  const { user } = useApp();
  const [showSignUp, setShowSignUp] = useState(false);
  const location = useLocation();
  console.log('Current route location:', location);

  if (!user) {
    return (
      <>
        {showSignUp ? (
          <SignUp onSignUp={() => setShowSignUp(false)} />
        ) : (
          <SignIn onSignIn={() => {}} />
        )}
        <div className="absolute top-4 right-4">
          {showSignUp ? (
            <button className="text-blue-600 underline" onClick={() => setShowSignUp(false)}>
              Already have an account? Sign In
            </button>
          ) : (
            <button className="text-blue-600 underline" onClick={() => setShowSignUp(true)}>
              New user? Sign Up
            </button>
          )}
        </div>
      </>
    );
  }

  // Main app layout when user is logged in
  return (
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute page="dashboard"><Dashboard /></ProtectedRoute>} />
          <Route path="/master-data" element={<ProtectedRoute page="master-data"><MasterData /></ProtectedRoute>} />
          <Route path="/purchase-orders" element={<ProtectedRoute page="purchase-orders"><PurchaseOrders /></ProtectedRoute>} />
          <Route path="/scheduling" element={<ProtectedRoute page="scheduling"><Scheduling /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute page="reports"><Reports /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute page="notifications"><Notifications /></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute page="alerts"><Alerts /></ProtectedRoute>} />
          <Route path="/holidays" element={<ProtectedRoute page="holidays"><HolidaySettings /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute page="dashboard"><Settings /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AuthGate />
    </AppProvider>
  );
}

export default App;