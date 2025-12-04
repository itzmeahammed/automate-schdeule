import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { 
  Home, 
  Settings, 
  ShoppingCart, 
  Calendar,
  FileText,
  Bell,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  User,
  BarChart3,
  Clock,
  Cog,
  Database,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

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
    'shift-management': true,
    settings: true,
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
    'shift-management': true,
    settings: true,
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
    'shift-management': false,
    settings: true,
  },
};

const Sidebar: React.FC = () => {
  const { 
    user, 
    sidebarCollapsed, 
    setSidebarCollapsed, 
    getUnreadNotificationsCount, 
    getCriticalAlertsCount,
    signOut,
    theme 
  } = useApp();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const unreadCount = getUnreadNotificationsCount();
  const criticalAlerts = getCriticalAlertsCount();

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: Home,
      description: 'Production overview and KPIs',
      path: '/dashboard',
    },
    { 
      id: 'master-data', 
      label: 'Master Data', 
      icon: Database,
      description: 'Manage core system data',
      path: '/master-data',
    },
    { 
      id: 'purchase-orders', 
      label: 'Sales Orders', 
      icon: ShoppingCart,
      description: 'Order management and tracking',
      path: '/purchase-orders',
    },
    { 
      id: 'scheduling', 
      label: 'Production Schedule', 
      icon: Calendar,
      description: 'Auto-generated schedules',
      path: '/scheduling',
    },
    { 
      id: 'reports', 
      label: 'Reports & Analytics', 
      icon: BarChart3,
      description: 'Performance insights',
      path: '/reports',
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      icon: Bell,
      description: 'System alerts and updates',
      badge: unreadCount,
      path: '/notifications',
    },
    { 
      id: 'alerts', 
      label: 'Critical Alerts', 
      icon: AlertTriangle,
      description: 'Urgent system warnings',
      badge: criticalAlerts,
      badgeColor: 'bg-red-500',
      path: '/alerts',
    },
    { 
      id: 'holidays', 
      label: 'Holiday Settings', 
      icon: Calendar,
      description: 'Manage company holidays',
      path: '/holidays',
    },
    { 
      id: 'shift-management', 
      label: 'Shift Management', 
      icon: Clock,
      description: 'Configure shift timing and breaks',
      path: '/shift-management',
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Cog,
      description: 'App preferences and configuration',
      path: '/settings',
    },
  ];

  // Map 'manager' to 'admin' for permissions
  let role: keyof typeof rolePermissions =
    user?.role === 'manager' ? 'admin' :
    user?.role === 'superadmin' ? 'superadmin' :
    user?.role === 'admin' ? 'admin' :
    'operator';

  // Only show menu items that are valid keys for permissions
  const allowedMenuItems = menuItems.filter(
    (item) => (rolePermissions[role] as Record<string, boolean>)[item.id] === true
  );

  return (
    <div className={`${sidebarCollapsed ? 'w-20' : 'w-80'} bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white h-screen flex flex-col transition-all duration-300 ease-in-out shadow-2xl border-r border-slate-700`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-700 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white mb-1">Manufacturing Pro</h1>
              <p className="text-sm text-blue-100">Auto Scheduling System</p>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200"
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </div>

      {/* User Profile */}
      {!sidebarCollapsed && user && (
        <div className="p-6 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <User size={24} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.role}{user.email ? ` • ${user.email}` : ''}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {allowedMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `w-full group relative flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-xl transition-all duration-200 ` +
                    (isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                      : 'text-slate-300 hover:bg-slate-800/50 hover:text-white hover:transform hover:scale-105')
                  }
                  end={item.path === '/dashboard'}
                >
                  <div className="relative">
                    <Icon size={20} className={`transition-colors duration-200`} />
                    {item.badge && item.badge > 0 && (
                      <span className={`${item.badgeColor || 'bg-red-500'} absolute -top-2 -right-2 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium`}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex-1 text-left">
                      <span className="font-medium">{item.label}</span>
                      <p className="text-xs text-slate-400 group-hover:text-slate-300 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  )}
                  {/* Tooltip for collapsed state */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-slate-700">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-slate-400">{item.description}</div>
                      {item.badge && item.badge > 0 && (
                        <div className="text-xs text-red-400 mt-1">{item.badge} unread</div>
                      )}
                    </div>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* System Status */}
      {!sidebarCollapsed && (
        <div className="p-4 border-t border-slate-700 bg-slate-800/30">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">System Status</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-xs">Online</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Last Sync</span>
              <span className="text-slate-300 text-xs">Just now</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Version</span>
              <span className="text-slate-300 text-xs">v1.0.0</span>
            </div>
          </div>
        </div>
      )}
      {/* Sign Out Button */}
      {user && (
        <div className="p-4 border-t border-slate-700 bg-slate-900/80">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-2 justify-center py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors shadow-lg mt-2"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      )}
      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full border-2 border-red-200 flex flex-col items-center animate-fadeIn">
            <ShieldAlert size={48} className="text-red-500 mb-3 animate-bounce" />
            <h3 className="text-xl font-bold text-red-900 mb-2">Sign Out?</h3>
            <p className="text-gray-700 mb-6 text-center">Are you sure you want to sign out? You will be returned to the login page.</p>
            <div className="flex gap-3 w-full justify-center">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  signOut();
                }}
                className="px-5 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div className="p-4 border-t border-slate-700 bg-slate-900/50">
        <div className={`text-xs text-slate-500 ${sidebarCollapsed ? 'text-center' : ''}`}>
          {sidebarCollapsed ? (
            <div className="flex justify-center">
              <Cog size={16} />
            </div>
          ) : (
            <>
              <p>© 2025 Manufacturing Pro</p>
              <p className="mt-1">Advanced Scheduling System</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;