'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { mailAPI, dashboardAPI } from '@/lib/api';
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  PaperAirplaneIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  SpeakerWaveIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface MailRecord {
  id: number;
  sender_name: string;
  recipient_email: string;
  subject: string;
  message: string;
  status: string;
  sent_at: string;
  mail_type: string;
  error_message?: string;
  created_at: string;
}

interface MailStats {
  total_mails: string;
  sent_mails: string;
  failed_mails: string;
  announcements: string;
  reminders: string;
  last_30_days: string;
}

export default function AdminMailPage() {
  const [activeTab, setActiveTab] = useState<'send' | 'history' | 'stats'>('send');
  const [users, setUsers] = useState<User[]>([]);
  const [mailHistory, setMailHistory] = useState<MailRecord[]>([]);
  const [mailStats, setMailStats] = useState<MailStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Duyuru formu
  const [announcementForm, setAnnouncementForm] = useState({
    subject: '',
    message: '',
    target_users: [] as number[],
    sender_name: 'Kooperatif Yönetimi'
  });

  // Aidat hatırlatması formu
  const [reminderForm, setReminderForm] = useState({
    days_before: 7,
    include_overdue: true
  });

  useEffect(() => {
    loadUsers();
    loadMailStats();
    if (activeTab === 'history') {
      loadMailHistory();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      const response = await dashboardAPI.getAllUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Kullanıcılar yüklenemedi:', error);
    }
  };

  const loadMailHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await mailAPI.getHistory({ limit: 50 });
      setMailHistory(response.data.mails || []);
    } catch (error) {
      console.error('Mail geçmişi yüklenemedi:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadMailStats = async () => {
    try {
      const response = await mailAPI.getStats();
      setMailStats(response.data || null);
    } catch (error) {
      console.error('Mail istatistikleri yüklenemedi:', error);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementForm.subject || !announcementForm.message) {
      alert('Konu ve mesaj gereklidir');
      return;
    }

    setLoading(true);
    try {
      const response = await mailAPI.sendAnnouncement(announcementForm);
      alert(`Duyuru gönderildi! ${response.data.total_sent} başarılı, ${response.data.total_failed} başarısız`);
      
      // Formu temizle
      setAnnouncementForm({
        subject: '',
        message: '',
        target_users: [],
        sender_name: 'Kooperatif Yönetimi'
      });

      // İstatistikleri güncelle
      loadMailStats();
    } catch (error: any) {
      alert('Hata: ' + (error.response?.data?.message || 'Mail gönderilemedi'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminders = async () => {
    setLoading(true);
    try {
      const response = await mailAPI.sendFeeReminders(reminderForm);
      alert(`Hatırlatmalar gönderildi! ${response.data.total_sent} başarılı, ${response.data.total_failed} başarısız`);
      
      // İstatistikleri güncelle
      loadMailStats();
    } catch (error: any) {
      alert('Hata: ' + (error.response?.data?.message || 'Hatırlatmalar gönderilemedi'));
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelection = (userId: number) => {
    const currentSelection = announcementForm.target_users;
    if (currentSelection.includes(userId)) {
      setAnnouncementForm({
        ...announcementForm,
        target_users: currentSelection.filter(id => id !== userId)
      });
    } else {
      setAnnouncementForm({
        ...announcementForm,
        target_users: [...currentSelection, userId]
      });
    }
  };

  const selectAllUsers = () => {
    const allUserIds = users.map(user => user.id);
    setAnnouncementForm({
      ...announcementForm,
      target_users: allUserIds
    });
  };

  const clearUserSelection = () => {
    setAnnouncementForm({
      ...announcementForm,
      target_users: []
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getMailTypeColor = (type: string) => {
    switch (type) {
      case 'announcement': return 'text-blue-600 bg-blue-50';
      case 'fee_reminder': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            <span className="font-medium">Admin Paneli</span>
          </Link>
          <div className="text-gray-400">/</div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <EnvelopeIcon className="w-8 h-8 mr-3 text-rose-600" />
            Mail Sistemi
          </h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('send')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'send'
                  ? 'border-rose-500 text-rose-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <PaperAirplaneIcon className="w-5 h-5 inline mr-2" />
              Mail Gönder
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'history'
                  ? 'border-rose-500 text-rose-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ClockIcon className="w-5 h-5 inline mr-2" />
              Mail Geçmişi
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'stats'
                  ? 'border-rose-500 text-rose-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ChartBarIcon className="w-5 h-5 inline mr-2" />
              İstatistikler
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Mail Gönder Tab */}
          {activeTab === 'send' && (
            <div className="space-y-8">
              {/* Duyuru Gönderme */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <SpeakerWaveIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-bold text-gray-900">Duyuru Gönder</h3>
                    <p className="text-sm text-gray-600">Tüm ortaklara veya seçili ortaklara duyuru gönderin</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gönderen Adı
                      </label>
                      <input
                        type="text"
                        value={announcementForm.sender_name}
                        onChange={(e) => setAnnouncementForm({...announcementForm, sender_name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Gönderen adı"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Konu
                      </label>
                      <input
                        type="text"
                        value={announcementForm.subject}
                        onChange={(e) => setAnnouncementForm({...announcementForm, subject: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Mail konusu"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mesaj
                    </label>
                    <textarea
                      value={announcementForm.message}
                      onChange={(e) => setAnnouncementForm({...announcementForm, message: e.target.value})}
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Duyuru mesajınızı yazın..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hedef Ortaklar ({announcementForm.target_users.length} seçili)
                    </label>
                    <div className="flex space-x-2 mb-3">
                      <button
                        onClick={selectAllUsers}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                      >
                        Hepsini Seç
                      </button>
                      <button
                        onClick={clearUserSelection}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                      >
                        Seçimi Temizle
                      </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-white">
                      {users.map((user) => (
                        <label key={user.id} className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-gray-50 rounded px-2">
                          <input
                            type="checkbox"
                            checked={announcementForm.target_users.includes(user.id)}
                            onChange={() => handleUserSelection(user.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {user.first_name} {user.last_name} ({user.email})
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                            {user.role === 'admin' ? 'Yönetici' : 'Ortak'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleSendAnnouncement}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ) : (
                      <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                    )}
                    {loading ? 'Gönderiliyor...' : 'Duyuru Gönder'}
                  </button>
                </div>
              </div>

              {/* Aidat Hatırlatması */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                    <ExclamationTriangleIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-bold text-gray-900">Aidat Hatırlatması</h3>
                    <p className="text-sm text-gray-600">Ödenmemiş aidatlar için hatırlatma maili gönderin</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kaç Gün Öncesinden
                      </label>
                      <select
                        value={reminderForm.days_before}
                        onChange={(e) => setReminderForm({...reminderForm, days_before: parseInt(e.target.value)})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value={1}>1 gün önce</option>
                        <option value={3}>3 gün önce</option>
                        <option value={7}>7 gün önce</option>
                        <option value={14}>14 gün önce</option>
                        <option value={30}>30 gün önce</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={reminderForm.include_overdue}
                          onChange={(e) => setReminderForm({...reminderForm, include_overdue: e.target.checked})}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">Gecikmiş aidatları da dahil et</span>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleSendReminders}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 px-6 rounded-lg font-medium hover:from-orange-600 hover:to-amber-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ) : (
                      <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                    )}
                    {loading ? 'Gönderiliyor...' : 'Hatırlatma Gönder'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mail Geçmişi Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Mail Geçmişi</h3>
                <button
                  onClick={loadMailHistory}
                  disabled={historyLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {historyLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <ClockIcon className="w-4 h-4 mr-2" />
                  )}
                  Yenile
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tür</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Konu</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alıcı</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gönderen</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mailHistory.map((mail) => (
                      <tr key={mail.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(mail.status)}`}>
                            {mail.status === 'sent' ? (
                              <CheckCircleIcon className="w-3 h-3 mr-1" />
                            ) : (
                              <XCircleIcon className="w-3 h-3 mr-1" />
                            )}
                            {mail.status === 'sent' ? 'Gönderildi' : 'Başarısız'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMailTypeColor(mail.mail_type)}`}>
                            {mail.mail_type === 'announcement' ? (
                              <SpeakerWaveIcon className="w-3 h-3 mr-1" />
                            ) : (
                              <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                            )}
                            {mail.mail_type === 'announcement' ? 'Duyuru' : 'Hatırlatma'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate" title={mail.subject}>
                          {mail.subject}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {mail.recipient_email}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {mail.sender_name || 'Sistem'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(mail.sent_at || mail.created_at).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {mailHistory.length === 0 && !historyLoading && (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Henüz mail geçmişi yok</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* İstatistikler Tab */}
          {activeTab === 'stats' && mailStats && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900">Mail İstatistikleri</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <EnvelopeIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Toplam Mail</p>
                      <p className="text-2xl font-bold text-gray-900">{mailStats.total_mails}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <CheckCircleIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Başarılı Gönderim</p>
                      <p className="text-2xl font-bold text-gray-900">{mailStats.sent_mails}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border border-red-100">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <XCircleIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Başarısız Gönderim</p>
                      <p className="text-2xl font-bold text-gray-900">{mailStats.failed_mails}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-100">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
                      <SpeakerWaveIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Duyuru Maili</p>
                      <p className="text-2xl font-bold text-gray-900">{mailStats.announcements}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                      <ExclamationTriangleIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Hatırlatma Maili</p>
                      <p className="text-2xl font-bold text-gray-900">{mailStats.reminders}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-100">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <ClockIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Son 30 Gün</p>
                      <p className="text-2xl font-bold text-gray-900">{mailStats.last_30_days}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 