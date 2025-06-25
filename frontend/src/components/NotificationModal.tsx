'use client';

import { useEffect } from 'react';
import {
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export default function NotificationModal({
  isOpen,
  onClose,
  type,
  title,
  message,
  autoClose = false,
  autoCloseDelay = 3000
}: NotificationModalProps) {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  const getTypeIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-6 h-6 text-white" />;
      case 'error':
        return <XMarkIcon className="w-6 h-6 text-white" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-6 h-6 text-white" />;
      case 'info':
        return <InformationCircleIcon className="w-6 h-6 text-white" />;
      default:
        return <InformationCircleIcon className="w-6 h-6 text-white" />;
    }
  };

  const getTypeStyles = () => {
    switch (type) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className={`bg-gradient-to-r ${styles.bgColor} p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                {getTypeIcon()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{title}</h3>
                {autoClose && (
                  <p className="text-white text-opacity-80 text-sm">
                    {autoCloseDelay / 1000} saniye sonra kapanacak
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-opacity-80 transition-colors p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`p-6 ${styles.bgLight} ${styles.borderColor} border-t-2`}>
          <p className={`text-lg ${styles.textColor} leading-relaxed`}>
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className={`w-full bg-gradient-to-r ${styles.bgColor} text-white py-3 px-4 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl`}
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
} 