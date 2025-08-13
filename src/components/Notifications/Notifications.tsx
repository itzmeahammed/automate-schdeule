import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Bell, Check, X, AlertTriangle, Info, CheckCircle, XCircle, Filter, Search, Undo2 as UndoIcon } from 'lucide-react';

const Notifications: React.FC = () => {
  const { notifications, markNotificationAsRead, setNotifications, playNotificationSound } = useApp();
  const [filter, setFilter] = useState<'all' | 'unread' | 'info' | 'warning' | 'error' | 'success' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Enhanced: filter logic for tabs
  const filteredNotifications = notifications.filter(notification => {
    const matchesCompleted =
      filter === 'completed'
        ? notification.completed
        : filter === 'all'
          ? true
          : !notification.completed;

    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'unread'
          ? !notification.isRead
          : filter === 'completed'
            ? true
            : notification.type === filter;

    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCompleted && matchesFilter && matchesSearch;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info size={20} className="text-blue-500" />;
      case 'warning': return <AlertTriangle size={20} className="text-amber-500" />;
      case 'error': return <XCircle size={20} className="text-red-500" />;
      case 'success': return <CheckCircle size={20} className="text-green-500" />;
      default: return <Bell size={20} className="text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'info': return 'border-l-blue-500 bg-blue-50';
      case 'warning': return 'border-l-amber-500 bg-amber-50';
      case 'error': return 'border-l-red-500 bg-red-50';
      case 'success': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const markAllAsRead = () => {
    notifications.forEach(notification => {
      if (!notification.isRead) {
        markNotificationAsRead(notification.id);
      }
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Add a button to mark all as completed
  const markAllAsCompleted = () => {
    setNotifications(notifications.map(n => n.completed ? n : { ...n, completed: true }));
  };
  // Add a button to restore all completed notifications
  const restoreAllCompleted = () => {
    setNotifications(notifications.map(n => n.completed ? { ...n, completed: false } : n));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Bell size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All notifications read'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={playNotificationSound}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Bell size={16} />
                Test Sound
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Mark All Read
                </button>
              )}
              <button
                onClick={clearAllNotifications}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear All
              </button>
              {/* Mark all as completed button */}
              {filter !== 'completed' && notifications.some(n => !n.completed) && (
                <button
                  onClick={markAllAsCompleted}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Mark All Completed
                </button>
              )}
              {/* Restore all button in completed filter */}
              {filter === 'completed' && notifications.some(n => n.completed) && (
                <button
                  onClick={restoreAllCompleted}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Restore All
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <Filter size={20} className="text-gray-400" />
              <div className="flex items-center space-x-2">
                {['all', 'unread', 'info', 'warning', 'error', 'success', 'completed'].map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setFilter(filterType as any)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filter === filterType
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <Bell size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search terms' : 'You\'re all caught up!'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-2xl shadow-sm border-l-4 ${getNotificationColor(notification.type)} ${
                  !notification.isRead ? 'border-r-4 border-r-blue-500' : ''
                } transition-all duration-200 hover:shadow-md flex items-center`}
              >
                {/* Special icon for completed notifications */}
                {notification.completed && (
                  <div className="flex items-center justify-center w-10 h-10 ml-2">
                    <CheckCircle size={28} className="text-green-400 opacity-70" />
                    {/* Optionally, add a tooltip: */}
                    {/* <span className="sr-only">Completed/Closed</span> */}
                  </div>
                )}
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className={`text-lg font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          {/* Subtle completed icon in 'all' tab */}
                          {filter === 'all' && notification.completed && (
                            <CheckCircle size={16} className="text-green-400 opacity-70 ml-1" />
                          )}
                        </div>
                        <p className="text-gray-600 mb-3">{notification.message}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{new Date(notification.timestamp).toLocaleString()}</span>
                          {notification.actionRequired && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                              Action Required
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {/* Restore button for completed notifications */}
                      {notification.completed && (
                        <button
                          onClick={() => setNotifications(notifications.map(n => n.id === notification.id ? { ...n, completed: false } : n))}
                          className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors"
                          title="Restore notification"
                        >
                          <UndoIcon />
                        </button>
                      )}
                      {/* Mark as read only if not completed */}
                      {!notification.isRead && !notification.completed && (
                        <button
                          onClick={() => markNotificationAsRead(notification.id)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      {/* Mark as completed only if not completed */}
                      {!notification.completed && (
                        <button
                          onClick={() => setNotifications(notifications.map(n => n.id === notification.id ? { ...n, completed: true } : n))}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="Mark as completed/closed"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => setNotifications(notifications.filter(n => n.id !== notification.id))}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete notification"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;