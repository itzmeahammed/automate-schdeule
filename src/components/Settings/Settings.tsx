import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  Cog, User, Sun, Moon, Bell, RefreshCw, Image as ImageIcon, Save, Eye, EyeOff, CheckCircle, AlertTriangle, LogOut, SlidersHorizontal, Globe, Shield, Database, Zap, ChevronRight, ChevronLeft, Mail, Trash2, Download, Languages, Palette, Sidebar as SidebarIcon
} from 'lucide-react';

const tabConfig = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'data', label: 'Data & Privacy', icon: Database },
  { key: 'customization', label: 'Customization', icon: SlidersHorizontal },
  { key: 'system', label: 'System', icon: Zap },
  // Integrations tab removed
];

const Settings: React.FC = () => {
  const { user, setUser, theme, setTheme, resetToSampleData, notifications, setNotifications } = useApp();
  const [activeTab, setActiveTab] = useState('profile');
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Font size persistence
  const getInitialFontSize = () => {
    const stored = localStorage.getItem('fontSize');
    if (stored === 'small' || stored === 'medium' || stored === 'large') return stored;
    return 'medium';
  };
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(getInitialFontSize());
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    document.documentElement.style.fontSize = fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : '16px';
    localStorage.setItem('fontSize', fontSize);
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [fontSize, highContrast]);

  // Profile form state
  const [formData, setFormData] = useState({
    id: user?.id || '',
    name: user?.name || '',
    email: user?.email || '',
    password: user?.password || '',
    profileImage: user?.profileImage || '',
    role: user?.role || 'operator',
  });
  const [showPassword, setShowPassword] = useState(false);
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({
      ...user,
      ...formData,
      role: formData.role || user?.role || 'operator',
      profileImage: formData.profileImage
    });
    setShowToast({ message: 'Profile updated!', type: 'success' });
  };
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormData((prev) => ({ ...prev, profileImage: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Notification preferences (local for now)
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [notificationSound, setNotificationSound] = useState(false);
  const [criticalOnly, setCriticalOnly] = useState(false);

  // Data & Privacy actions
  const handleExportData = () => {
    const data = { user, notifications };
    const content = JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manufacturing-data-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowToast({ message: 'Data exported!', type: 'success' });
  };
  const handleClearNotifications = () => {
    setNotifications([]);
    setShowToast({ message: 'All notifications cleared!', type: 'success' });
  };

  // Customization (local for now)
  const [sidebarAutoCollapse, setSidebarAutoCollapse] = useState(false);
  const [defaultLanding, setDefaultLanding] = useState('dashboard');

  // System
  const handleResetDemo = () => {
    resetToSampleData();
    setShowToast({ message: 'Demo data reset!', type: 'success' });
  };

  // Toast auto-hide
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Responsive tab bar
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 py-8 px-6 md:px-16">
      <div className="max-w-5xl mx-auto">
        {/* Greeting and summary */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Cog className="text-blue-600" size={32} /> Settings
            </h1>
            <p className="text-gray-600 text-lg">Hi, <span className="font-semibold text-blue-700">{user?.name}</span>! Manage your preferences and account below.</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
              Theme: <span className="capitalize">{theme}</span>
              {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium">
              Font Size: <span className="capitalize">{fontSize}</span>
            </span>
          </div>
        </div>

        {/* Professional Tab Bar */}
        <div className="flex overflow-x-auto gap-1 mb-8 bg-white rounded-full shadow border border-gray-100 px-2 py-1 items-center min-h-[48px] max-h-[48px]">
          {tabConfig.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400
                  ${isActive ? 'bg-blue-600 text-white shadow' : 'bg-transparent text-blue-700 hover:bg-blue-50'}
                  border border-transparent ${isActive ? 'border-blue-600' : ''}`}
                style={{ minHeight: 36, maxHeight: 36 }}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {/* Under Construction Message */}
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="bg-gradient-to-br from-blue-100 via-indigo-50 to-white rounded-2xl shadow-lg border border-blue-200 p-12 flex flex-col items-center gap-6 animate-fadeIn max-w-xl w-full">
            <Cog size={48} className="text-blue-500 animate-spin-slow" />
            <h2 className="text-2xl font-bold text-blue-900 mb-2 text-center">Settings Page is Under Construction</h2>
            <p className="text-lg text-gray-700 text-center">We're working hard to bring you more customization and control. Please check back soon for new features and improvements!</p>
            </div>
        </div>

        {/* Toast/Snackbar */}
        {showToast && (
          <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 text-white font-semibold animate-fadeIn
            ${showToast.type === 'success' ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-red-600'}`}
          >
            {showToast.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            {showToast.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings; 