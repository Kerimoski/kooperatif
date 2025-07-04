'use client';

import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ChatBubbleLeftRightIcon,
  ExclamationCircleIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface DailyMessage {
  id: number;
  message: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by_name?: string;
}

export default function DailyMessagesAdmin() {
  const [messages, setMessages] = useState<DailyMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMessage, setEditingMessage] = useState<DailyMessage | null>(null);
  const [formData, setFormData] = useState({
    message: '',
    display_order: 0
  });

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/daily-messages/admin`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(data.data);
        }
      } else {
        console.error('Failed to load messages');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.message.trim()) {
      alert('Mesaj alanı boş olamaz');
      return;
    }

    try {
      const url = editingMessage 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/daily-messages/${editingMessage.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/daily-messages`;
      
      const method = editingMessage ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        setShowForm(false);
        setEditingMessage(null);
        setFormData({ message: '', display_order: 0 });
        await loadMessages();
        alert(data.message || 'İşlem başarılı');
      } else {
        alert(data.message || 'İşlem başarısız');
      }
    } catch (error) {
      console.error('Error saving message:', error);
      alert('Mesaj kaydedilirken hata oluştu');
    }
  };

  const handleEdit = (message: DailyMessage) => {
    setEditingMessage(message);
    setFormData({
      message: message.message,
      display_order: message.display_order
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu mesajı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/daily-messages/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        await loadMessages();
        alert('Mesaj başarıyla silindi');
      } else {
        alert(data.message || 'Mesaj silinemedi');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Mesaj silinirken hata oluştu');
    }
  };

  const toggleActive = async (message: DailyMessage) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/daily-messages/${message.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message.message,
          is_active: !message.is_active,
          display_order: message.display_order
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await loadMessages();
      } else {
        alert(data.message || 'Durum güncellenemedi');
      }
    } catch (error) {
      console.error('Error toggling active status:', error);
      alert('Durum güncellenirken hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Mesajlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ChatBubbleLeftRightIcon className="w-8 h-8 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">Günlük Mesajlar</h1>
              <p className="text-emerald-100">Üye ana sayfasında görünen mesajları yönetebilirsiniz</p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingMessage(null);
              setFormData({ message: '', display_order: messages.length + 1 });
            }}
            disabled={messages.filter(m => m.is_active).length >= 10}
            className="bg-white text-emerald-600 px-4 py-2 rounded-xl font-semibold hover:bg-emerald-50 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Yeni Mesaj
          </button>
        </div>
        
        <div className="mt-4 bg-emerald-700/30 rounded-lg p-3">
          <p className="text-sm text-emerald-100">
            ℹ️ Bu mesajlar üye ana sayfasında her 10 saniyede bir değişir. Maksimum 10 aktif mesaj ekleyebilirsiniz.
          </p>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {editingMessage ? 'Mesajı Düzenle' : 'Yeni Mesaj Ekle'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mesaj Metni
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Günlük mesajınızı yazın..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.message.length}/500 karakter
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sıra
              </label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Görünüm sırası"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingMessage(null);
                  setFormData({ message: '', display_order: 0 });
                }}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center"
              >
                <CheckIcon className="w-4 h-4 mr-2" />
                {editingMessage ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Messages List */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Mevcut Mesajlar ({messages.filter(m => m.is_active).length}/10 aktif)
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Henüz mesaj eklenmemiş</p>
              <p className="text-sm text-gray-400 mt-1">İlk mesajınızı eklemek için yukarıdaki butonu kullanın</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        message.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {message.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                      <span className="text-xs text-gray-500 ml-3">Sıra: {message.display_order}</span>
                    </div>
                    <p className="text-gray-900 font-medium mb-1">{message.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleDateString('tr-TR')} 
                      {message.created_by_name && ` • ${message.created_by_name}`}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => toggleActive(message)}
                      className={`p-2 rounded-lg transition-colors ${
                        message.is_active 
                          ? 'text-green-600 hover:bg-green-50' 
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                      title={message.is_active ? 'Pasif yap' : 'Aktif yap'}
                    >
                      {message.is_active ? (
                        <CheckIcon className="w-4 h-4" />
                      ) : (
                        <XMarkIcon className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(message)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Düzenle"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(message.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Sil"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 