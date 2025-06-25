'use client';

import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'default' | 'danger' | 'warning' | 'success';
  icon?: string;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  type = 'default',
  icon
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getTypeIcon = () => {
    if (icon) return icon; // Eğer custom icon varsa onu kullan
    
    switch (type) {
      case 'danger':
      case 'warning':
        return <ExclamationTriangleIcon className="w-6 h-6 text-white" />;
      case 'success':
        return <CheckCircleIcon className="w-6 h-6 text-white" />;
      default:
        return <QuestionMarkCircleIcon className="w-6 h-6 text-white" />;
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          headerBg: 'from-red-500 to-red-600',
          confirmBtn: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
        };
      case 'warning':
        return {
          headerBg: 'from-yellow-500 to-orange-600',
          confirmBtn: 'from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700'
        };
      case 'success':
        return {
          headerBg: 'from-green-500 to-emerald-600',
          confirmBtn: 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
        };
      default:
        return {
          headerBg: 'from-blue-500 to-blue-600',
          confirmBtn: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className={`bg-gradient-to-r ${styles.headerBg} p-6`}>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              {getTypeIcon()}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <p className="text-white text-opacity-80 text-sm">Lütfen seçiminizi onaylayın</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-all duration-300"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 bg-gradient-to-r ${styles.confirmBtn} text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 