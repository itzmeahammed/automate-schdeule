import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  Cog, User, Bell, RefreshCw, Image as ImageIcon, Save, Eye, EyeOff, CheckCircle, AlertTriangle, LogOut, SlidersHorizontal, Globe, Shield, Database, Zap, ChevronRight, ChevronLeft, Mail, Trash2, Download, Languages, Sidebar as SidebarIcon, Settings as SettingsIcon, Key, Lock, Eye as EyeIcon, Users, Building, Phone, MapPin
} from 'lucide-react';

const tabConfig = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'data', label: 'Data & Privacy', icon: Database },
  { key: 'customization', label: 'Customization', icon: SlidersHorizontal },
  { key: 'system', label: 'System', icon: Zap },
];

const Settings: React.FC = () => {
  const { 
    user, 
    setUser, 
    theme, 
    setTheme, 
    resetToSampleData, 
    notifications, 
    setNotifications,
    signOut,
    sidebarCollapsed,
    setSidebarCollapsed,
    machines,
    products,
    purchaseOrders,
    scheduleItems,
    playNotificationSound
  } = useApp();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  // Enhanced profile form state with company info
  const [formData, setFormData] = useState({
    id: user?.id || '',
    name: user?.name || '',
    email: user?.email || '',
    password: user?.password || '',
    profileImage: user?.profileImage || '',
    role: user?.role || 'operator',
    companyName: 'Manufacturing Company',
    companyAddress: '',
    phone: '',
    department: 'Production'
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Enhanced notification preferences
  const [notificationSettings, setNotificationSettings] = useState({
    sound: true,
    criticalOnly: false,
    machineAlerts: true,
    orderUpdates: true,
    maintenanceReminders: true
  });

  // Handle notification sound toggle
  const handleNotificationSoundToggle = (key: string, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }));
    
    // If enabling sound, play a test sound
    if (key === 'sound' && value) {
      playNotificationSound();
    }
  };

  // Enhanced customization settings
  const [customizationSettings, setCustomizationSettings] = useState({
    sidebarAutoCollapse: sidebarCollapsed,
    defaultLanding: 'dashboard',
    compactMode: false,
    showAnimations: true,
    autoRefresh: true,
    refreshInterval: 30
  });

  // Enhanced data management
  const [dataStats, setDataStats] = useState({
    machines: 0,
    products: 0,
    orders: 0,
    scheduleItems: 0,
    notifications: 0
  });

  // Update data stats when data changes
  useEffect(() => {
    setDataStats({
      machines: machines.length,
      products: products.length,
      orders: purchaseOrders.length,
      scheduleItems: scheduleItems.length,
      notifications: notifications.length
    });
  }, [machines, products, purchaseOrders, scheduleItems, notifications]);

  // Enhanced profile submit with validation
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validate required fields
      if (!formData.name.trim() || !formData.email.trim()) {
        throw new Error('Name and email are required');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Update user with enhanced data
      const updatedUser = {
        ...user,
        ...formData,
        role: formData.role || user?.role || 'operator',
        profileImage: formData.profileImage
      };

      setUser(updatedUser);
      setShowToast({ message: 'Profile updated successfully!', type: 'success' });
    } catch (error) {
      setShowToast({ message: error instanceof Error ? error.message : 'Failed to update profile', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error('All password fields are required');
      }

      if (currentPassword !== user?.password) {
        throw new Error('Current password is incorrect');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('New passwords do not match');
      }

      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      setUser(prev => prev ? { ...prev, password: newPassword } : null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowToast({ message: 'Password changed successfully!', type: 'success' });
    } catch (error) {
      setShowToast({ message: error instanceof Error ? error.message : 'Failed to change password', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced profile image handling
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setShowToast({ message: 'Image size must be less than 5MB', type: 'error' });
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormData((prev) => ({ ...prev, profileImage: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Enhanced data export
  const handleExportData = async () => {
    setIsLoading(true);
    try {
      const exportData = {
        user: user,
        machines: machines,
        products: products,
        purchaseOrders: purchaseOrders,
        scheduleItems: scheduleItems,
        notifications: notifications,
        settings: {
          theme,
          notificationSettings,
          customizationSettings
        },
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      const content = JSON.stringify(exportData, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `manufacturing-data-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setShowToast({ message: 'Data exported successfully!', type: 'success' });
    } catch (error) {
      setShowToast({ message: 'Failed to export data', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced clear notifications
  const handleClearNotifications = () => {
    setNotifications([]);
    setShowToast({ message: 'All notifications cleared successfully!', type: 'success' });
  };

  // Enhanced reset demo
  const handleResetDemo = async () => {
    setIsLoading(true);
    try {
      resetToSampleData();
      setShowToast({ message: 'Demo data reset successfully!', type: 'success' });
    } catch (error) {
      setShowToast({ message: 'Failed to reset demo data', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced sign out
  const handleSignOut = () => {
    signOut();
    setShowToast({ message: 'Signed out successfully!', type: 'success' });
  };

  // Toast auto-hide
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 py-8 px-6 md:px-16">
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <SettingsIcon className="text-blue-600" size={32} /> Settings
            </h1>
            <p className="text-gray-600 text-lg">
              Welcome back, <span className="font-semibold text-blue-700">{user?.name}</span>! 
              Manage your preferences and account settings below.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
                         <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
               Theme: <span className="capitalize">{theme}</span>
             </span>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium">
              Role: <span className="capitalize">{user?.role}</span>
            </span>
          </div>
        </div>

        {/* Enhanced Tab Bar */}
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

        {/* Enhanced Tab Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-8">
              <div className="flex items-center gap-3 mb-6">
                <User className="text-blue-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Profile Settings</h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Image Section */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h3>
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-lg">
                          {formData.profileImage ? (
                            <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            formData.name?.charAt(0)?.toUpperCase() || 'U'
                          )}
                        </div>
                        <label className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <ImageIcon size={20} className="text-blue-600" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfileImageChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <div className="text-center">
                        <h4 className="font-semibold text-gray-900">{formData.name}</h4>
                        <p className="text-gray-600">{formData.email}</p>
                        <p className="text-sm text-gray-500 capitalize">Role: {formData.role}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Form Section */}
                <div className="lg:col-span-2">
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <User size={16} className="inline mr-2" />
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Mail size={16} className="inline mr-2" />
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Phone size={16} className="inline mr-2" />
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your phone number"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Users size={16} className="inline mr-2" />
                          Department
                        </label>
                        <input
                          type="text"
                          value={formData.department}
                          onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your department"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Building size={16} className="inline mr-2" />
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={formData.companyName}
                          onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter company name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <MapPin size={16} className="inline mr-2" />
                          Company Address
                        </label>
                        <input
                          type="text"
                          value={formData.companyAddress}
                          onChange={(e) => setFormData(prev => ({ ...prev, companyAddress: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter company address"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Shield size={16} className="inline mr-2" />
                          Role
                        </label>
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="operator">Operator</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                          <option value="superadmin">Super Admin</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
                      >
                        {isLoading ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>

                  {/* Password Change Section */}
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Lock size={20} />
                      Change Password
                    </h3>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                          <div className="relative">
                            <input
                              type={showCurrentPassword ? 'text' : 'password'}
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Current password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="New password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Confirm new password"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
                        >
                          {isLoading ? <RefreshCw size={18} className="animate-spin" /> : <Key size={18} />}
                          {isLoading ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="text-blue-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Notification Preferences</h2>
              </div>

              <div className="space-y-6">
                                 <div className="bg-gray-50 rounded-xl p-6">
                   <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
                   
                   <div className="mb-4">
                     <button
                       onClick={playNotificationSound}
                       className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                     >
                       <Bell size={16} />
                       Test Notification Sound
                     </button>
                   </div>
                   
                   <div className="space-y-4">
                     {Object.entries(notificationSettings).map(([key, value]) => (
                       <div key={key} className="flex items-center justify-between">
                         <div>
                           <div className="font-medium text-gray-900">
                             {key === 'sound' ? 'Notification Sounds' :
                              key === 'criticalOnly' ? 'Critical Notifications Only' :
                              key === 'machineAlerts' ? 'Machine Alerts' :
                              key === 'orderUpdates' ? 'Order Updates' :
                              key === 'maintenanceReminders' ? 'Maintenance Reminders' : key}
                           </div>
                           <div className="text-sm text-gray-500">
                             {key === 'sound' ? 'Play sounds for new notifications' :
                              key === 'criticalOnly' ? 'Show only high-priority notifications' :
                              key === 'machineAlerts' ? 'Get alerts for machine issues' :
                              key === 'orderUpdates' ? 'Receive updates on order status' :
                              key === 'maintenanceReminders' ? 'Get reminders for maintenance' : ''}
                           </div>
                         </div>
                         <button
                           onClick={() => handleNotificationSoundToggle(key, !value)}
                           className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                             value ? 'bg-blue-600' : 'bg-gray-200'
                           }`}
                         >
                           <span
                             className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                               value ? 'translate-x-6' : 'translate-x-1'
                             }`}
                           />
                         </button>
                       </div>
                     ))}
                   </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Notifications</h3>
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((notification) => (
                      <div key={notification.id} className="flex items-center gap-3 p-4 bg-white rounded-lg">
                        <div className={`w-3 h-3 rounded-full ${
                          notification.type === 'success' ? 'bg-green-500' :
                          notification.type === 'warning' ? 'bg-yellow-500' :
                          notification.type === 'error' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{notification.title}</div>
                          <div className="text-sm text-gray-500">{notification.message}</div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(notification.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="text-center text-gray-500 py-4">No notifications yet</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data & Privacy Tab */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Database className="text-blue-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Data & Privacy</h2>
              </div>

              <div className="space-y-6">
                {/* Data Statistics */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Overview</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{dataStats.machines}</div>
                      <div className="text-sm text-gray-500">Machines</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{dataStats.products}</div>
                      <div className="text-sm text-gray-500">Products</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">{dataStats.orders}</div>
                      <div className="text-sm text-gray-500">Orders</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">{dataStats.scheduleItems}</div>
                      <div className="text-sm text-gray-500">Schedule Items</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{dataStats.notifications}</div>
                      <div className="text-sm text-gray-500">Notifications</div>
                    </div>
                  </div>
                </div>

                {/* Data Management */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">Export Data</div>
                        <div className="text-sm text-gray-500">Download your data as JSON file</div>
                      </div>
                      <button
                        onClick={handleExportData}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                        {isLoading ? 'Exporting...' : 'Export'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">Clear Notifications</div>
                        <div className="text-sm text-gray-500">Remove all notification history</div>
                      </div>
                      <button
                        onClick={handleClearNotifications}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 size={16} />
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Information</h3>
                  <div className="space-y-3 text-sm text-gray-600">
                    <p>• Your data is stored locally on your device</p>
                    <p>• No personal information is shared with third parties</p>
                    <p>• You can export or delete your data at any time</p>
                    <p>• Settings are automatically saved to your browser</p>
                    <p>• All data is encrypted and secure</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Customization Tab */}
          {activeTab === 'customization' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <SlidersHorizontal className="text-blue-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Customization</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Interface Settings</h3>
                  
                  <div className="space-y-4">
                                         <div className="flex items-center justify-between">
                       <div>
                         <div className="font-medium text-gray-900">Auto-collapse Sidebar</div>
                         <div className="text-sm text-gray-500">Automatically hide sidebar on smaller screens</div>
                       </div>
                       <button
                         onClick={() => {
                           const newValue = !customizationSettings.sidebarAutoCollapse;
                           setCustomizationSettings(prev => ({ ...prev, sidebarAutoCollapse: newValue }));
                           setSidebarCollapsed(newValue);
                         }}
                         className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                           customizationSettings.sidebarAutoCollapse ? 'bg-blue-600' : 'bg-gray-200'
                         }`}
                       >
                         <span
                           className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                             customizationSettings.sidebarAutoCollapse ? 'translate-x-6' : 'translate-x-1'
                           }`}
                         />
                       </button>
                     </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">Compact Mode</div>
                        <div className="text-sm text-gray-500">Use more compact layout for better space utilization</div>
                      </div>
                      <button
                        onClick={() => setCustomizationSettings(prev => ({ ...prev, compactMode: !prev.compactMode }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          customizationSettings.compactMode ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            customizationSettings.compactMode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">Show Animations</div>
                        <div className="text-sm text-gray-500">Enable smooth animations and transitions</div>
                      </div>
                      <button
                        onClick={() => setCustomizationSettings(prev => ({ ...prev, showAnimations: !prev.showAnimations }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          customizationSettings.showAnimations ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            customizationSettings.showAnimations ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">Auto Refresh</div>
                        <div className="text-sm text-gray-500">Automatically refresh data periodically</div>
                      </div>
                      <button
                        onClick={() => setCustomizationSettings(prev => ({ ...prev, autoRefresh: !prev.autoRefresh }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          customizationSettings.autoRefresh ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            customizationSettings.autoRefresh ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div>
                      <label className="block font-medium text-gray-900 mb-2">Default Landing Page</label>
                      <select
                        value={customizationSettings.defaultLanding}
                        onChange={(e) => setCustomizationSettings(prev => ({ ...prev, defaultLanding: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="dashboard">Dashboard</option>
                        <option value="scheduling">Scheduling</option>
                        <option value="reports">Reports</option>
                        <option value="purchase-orders">Purchase Orders</option>
                      </select>
                    </div>

                    {customizationSettings.autoRefresh && (
                      <div>
                        <label className="block font-medium text-gray-900 mb-2">Refresh Interval (seconds)</label>
                        <input
                          type="number"
                          min="10"
                          max="300"
                          value={customizationSettings.refreshInterval}
                          onChange={(e) => setCustomizationSettings(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) || 30 }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="text-blue-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">System</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">System Actions</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">Reset Demo Data</div>
                        <div className="text-sm text-gray-500">Restore all sample data to original state</div>
                      </div>
                      <button
                        onClick={handleResetDemo}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                        {isLoading ? 'Resetting...' : 'Reset'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">Sign Out</div>
                        <div className="text-sm text-gray-500">Log out of your account</div>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Version:</span>
                      <span className="font-medium">1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Build Date:</span>
                      <span className="font-medium">{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Storage:</span>
                      <span className="font-medium">Local Browser</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Theme:</span>
                      <span className="font-medium capitalize">{theme}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">User Role:</span>
                      <span className="font-medium capitalize">{user?.role}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Toast/Snackbar */}
        {showToast && (
          <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 text-white font-semibold animate-fadeIn
            ${showToast.type === 'success' ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-red-600 to-pink-600'}`}
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