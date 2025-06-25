'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import {
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

interface NotificationContextType {
  showNotification: (notification: Omit<NotificationData, 'id'>) => void;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const addNotification = (notification: Omit<NotificationData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);

    // Auto-close functionality
    if (notification.autoClose !== false) {
      const delay = notification.autoCloseDelay || 4000;
      setTimeout(() => {
        removeNotification(id);
      }, delay);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const showSuccess = (title: string, message: string) => {
    addNotification({
      type: 'success',
      title,
      message,
      autoClose: true,
      autoCloseDelay: 3000
    });
  };

  const showError = (title: string, message: string) => {
    addNotification({
      type: 'error',
      title,
      message,
      autoClose: true,
      autoCloseDelay: 5000
    });
  };

  const showWarning = (title: string, message: string) => {
    addNotification({
      type: 'warning',
      title,
      message,
      autoClose: true,
      autoCloseDelay: 4000
    });
  };

  const showInfo = (title: string, message: string) => {
    addNotification({
      type: 'info',
      title,
      message,
      autoClose: true,
      autoCloseDelay: 4000
    });
  };

  const contextValue: NotificationContextType = {
    showNotification: addNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-4 max-w-md">
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

// Toast Component
interface NotificationToastProps {
  notification: NotificationData;
  onClose: () => void;
}

const NotificationToast = ({ notification, onClose }: NotificationToastProps) => {
  const getTypeIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-white" />;
      case 'error':
        return <XMarkIcon className="w-5 h-5 text-white" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-white" />;
      case 'info':
        return <InformationCircleIcon className="w-5 h-5 text-white" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-white" />;
    }
  };

  const getTypeStyles = () => {
    switch (notification.type) {
      case 'success':
        return {
          bgColor: 'from-green-500 to-emerald-600',
          textColor: 'text-green-800',
          bgLight: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'error':
        return {
          bgColor: 'from-red-500 to-red-600',
          textColor: 'text-red-800',
          bgLight: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'warning':
        return {
          bgColor: 'from-yellow-500 to-orange-600',
          textColor: 'text-yellow-800',
          bgLight: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'info':
        return {
          bgColor: 'from-blue-500 to-blue-600',
          textColor: 'text-blue-800',
          bgLight: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      default:
        return {
          bgColor: 'from-gray-500 to-gray-600',
          textColor: 'text-gray-800',
          bgLight: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-white/20 overflow-hidden transform transition-all duration-300 animate-slide-in-right max-w-sm">
      {/* Header */}
      <div className={`bg-gradient-to-r ${styles.bgColor} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              {getTypeIcon()}
            </div>
            <h3 className="text-lg font-bold text-white">{notification.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-opacity-80 transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`p-4 ${styles.bgLight} ${styles.borderColor} border-t-2`}>
        <p className={`text-sm ${styles.textColor} leading-relaxed`}>
          {notification.message}
        </p>
      </div>
    </div>
  );
}; 