'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { memberAPI, commissionAPI } from '@/lib/api';
import {
  ClipboardDocumentListIcon,
  UserIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  XMarkIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckIcon,
  LinkIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';

interface MemberCommission {
  id: number;
  name: string;
  description: string;
  max_members: number;
  current_members: number;
  joined_at: string;
  member_role: string;
}

interface CommissionDetail {
  commission: any;
  members: any[];
  links?: CommissionLink[];
}

interface CommissionLink {
  id: number;
  title: string;
  url: string;
  description?: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export default function MemberCommissionsPage() {
  const router = useRouter();
  const [commissions, setCommissions] = useState<MemberCommission[]>([]);
  const [selectedCommission, setSelectedCommission] = useState<CommissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showCommissionDetail, setShowCommissionDetail] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingApplications, setPendingApplications] = useState<any[]>([]);
  const [selectedCommissionForPending, setSelectedCommissionForPending] = useState<any>(null);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [commissionLinks, setCommissionLinks] = useState<CommissionLink[]>([]);
  const [selectedCommissionForLinks, setSelectedCommissionForLinks] = useState<any>(null);

  useEffect(() => {
    loadCommissions();
  }, []);

  const loadCommissions = async () => {
    try {
      setLoading(true);
      const response = await memberAPI.getDashboard();

      if (response.success) {
        setCommissions(response.data.commissions);
      }
    } catch (error) {
      console.error('Commissions load error:', error);
      setError('Komisyonlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveCommission = async (commissionId: number, commissionName: string) => {
    if (!confirm(`${commissionName} komisyonundan ayrılmak istediğinize emin misiniz?`)) {
      return;
    }

    try {
      setActionLoading(commissionId);
      const response = await memberAPI.leaveCommission(commissionId);
      
      if (response.success) {
        await loadCommissions();
        setShowCommissionDetail(false);
        alert(response.message);
      }
    } catch (error: any) {
      console.error('Leave commission error:', error);
      alert(error.response?.data?.message || 'Komisyondan ayrılınamadı');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewCommissionDetail = async (commissionId: number) => {
    try {
      setLoading(true);
      const response = await memberAPI.getCommissionDetail(commissionId);
      
      if (response.success) {
        setSelectedCommission(response.data);
        setShowCommissionDetail(true);
      }
    } catch (error: any) {
      console.error('Commission detail error:', error);
      alert(error.response?.data?.message || 'Komisyon detayları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingApplications = async (commissionId: number) => {
    try {
      const response = await fetch(`/api/commissions/${commissionId}/pending`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPendingApplications(data.data);
        }
      }
    } catch (error: any) {
      console.error('Load pending applications error:', error);
    }
  };

  const handleViewPendingApplications = async (commission: any) => {
    setSelectedCommissionForPending(commission);
    await loadPendingApplications(commission.id);
    setShowPendingModal(true);
  };

  const handleApproveApplication = async (applicationUserId: number, applicantName: string) => {
    if (!selectedCommissionForPending) return;

    if (confirm(`${applicantName} adlı kişinin başvurusunu onaylamak istediğinizden emin misiniz?`)) {
      try {
        const response = await fetch(`/api/commissions/${selectedCommissionForPending.id}/approve/${applicationUserId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        if (data.success) {
          await loadPendingApplications(selectedCommissionForPending.id);
          loadCommissions();
          alert(data.message || 'Başvuru başarıyla onaylandı!');
        } else {
          alert(data.message || 'Başvuru onaylanamadı');
        }
      } catch (error: any) {
        console.error('Approve application error:', error);
        alert('Başvuru onaylanırken hata oluştu');
      }
    }
  };

  const handleRejectApplication = async (applicationUserId: number, applicantName: string) => {
    if (!selectedCommissionForPending) return;

    if (confirm(`${applicantName} adlı kişinin başvurusunu reddetmek istediğinizden emin misiniz?`)) {
      try {
        const response = await fetch(`/api/commissions/${selectedCommissionForPending.id}/reject/${applicationUserId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        if (data.success) {
          await loadPendingApplications(selectedCommissionForPending.id);
          alert(data.message || 'Başvuru başarıyla reddedildi!');
        } else {
          alert(data.message || 'Başvuru reddedilemedi');
        }
      } catch (error: any) {
        console.error('Reject application error:', error);
        alert('Başvuru reddedilirken hata oluştu');
      }
    }
  };

  const loadCommissionLinks = async (commissionId: number) => {
    try {
      const response = await commissionAPI.getLinks(commissionId);
      if (response.success) {
        setCommissionLinks(response.data);
      }
    } catch (error: any) {
      console.error('Load commission links error:', error);
      alert('Bağlantılar yüklenirken hata oluştu');
    }
  };

  const handleViewLinks = async (commission: any) => {
    setSelectedCommissionForLinks(commission);
    await loadCommissionLinks(commission.id);
    setShowLinksModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.push('/member')}
          className="group flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="font-medium">Ana Sayfaya Dön</span>
        </button>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center">
          <ClipboardDocumentListIcon className="w-8 h-8 mr-3" />
          <div>
            <h2 className="text-3xl font-bold text-white">Komisyonlarım</h2>
            <p className="mt-2 text-emerald-100">
              Katıldığınız komisyonları buradan yönetebilirsiniz.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {commissions.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 p-12 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ClipboardDocumentListIcon className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Henüz komisyon ortaklığınız yok
          </h3>
          <p className="text-gray-600 mb-6">
            Kooperatif komisyonlarına başvuru yaparak onay aldıktan sonra faaliyetlere destek olabilirsiniz.
          </p>
          <a
            href="/member/join"
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Komisyonlara Başvur
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {commissions.map((commission) => (
            <div key={commission.id} className="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{commission.name}</h3>
                    <p className="text-gray-600 mb-4">{commission.description}</p>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <span className="flex items-center gap-1">
                        {commission.member_role === 'manager' ? (
                          <>
                            <ShieldCheckIcon className="w-4 h-4" />
                            Komisyon Yöneticisi
                          </>
                        ) : commission.member_role === 'leader' ? (
                          <>
                            <ShieldCheckIcon className="w-4 h-4" />
                            Lider
                          </>
                        ) : (
                          <>
                            <UserIcon className="w-4 h-4" />
                            Ortak
                          </>
                        )}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-500">Ortak Sayısı</p>
                    <p className="text-lg font-bold text-gray-900">
                      {commission.current_members}/{commission.max_members}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-500">Katılım Tarihi</p>
                    <p className="text-lg font-bold text-gray-900">
                      {new Date(commission.joined_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col space-y-3">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleViewCommissionDetail(commission.id)}
                      className="flex-1 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                    >
                      Detayları Gör
                    </button>
                    <button
                      onClick={() => handleViewLinks(commission)}
                      className="flex-1 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Bağlantılar
                    </button>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleLeaveCommission(commission.id, commission.name)}
                      disabled={actionLoading === commission.id}
                      className="flex-1 bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === commission.id ? (
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          İşleniyor...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <ArrowRightOnRectangleIcon className="w-4 h-4" />
                          Ayrıl
                        </span>
                      )}
                    </button>
                  {commission.member_role === 'manager' && (
                    <button
                      onClick={() => handleViewPendingApplications(commission)}
                        className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <ClockIcon className="w-4 h-4" />
                        Başvurular
                    </button>
                  )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Komisyon Detay Modal */}
      {showCommissionDetail && selectedCommission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-green-500 to-green-600">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {selectedCommission.commission.name}
                  </h3>
                  <p className="text-green-100">Komisyon Detayları ve Ortaklar</p>
                </div>
                <button
                  onClick={() => setShowCommissionDetail(false)}
                  className="text-white hover:text-green-200 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto max-h-[70vh]">
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Komisyon Açıklaması</h4>
                <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">{selectedCommission.commission.description}</p>
              </div>

              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Komisyon Ortakları ({selectedCommission.members.length}/{selectedCommission.commission.max_members})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedCommission.members.map((member) => (
                    <div key={member.id} className="flex items-center p-4 bg-gray-50 rounded-xl border hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mr-4">
                        <span className="text-white font-semibold">
                          {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <p className="font-semibold text-gray-900">
                            {member.first_name} {member.last_name}
                          </p>
                          {member.role === 'manager' ? (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              <span className="flex items-center gap-1">
                                <ShieldCheckIcon className="w-3 h-3" />
                                Komisyon Yöneticisi
                              </span>
                            </span>
                          ) : member.role === 'leader' ? (
                            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              <span className="flex items-center gap-1">
                                <ShieldCheckIcon className="w-3 h-3" />
                                Lider
                              </span>
                            </span>
                          ) : (
                            <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                              <span className="flex items-center gap-1">
                                <UserIcon className="w-3 h-3" />
                                Ortak
                              </span>
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{member.profession || 'Meslek bilgisi yok'}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(member.joined_at).toLocaleDateString('tr-TR')} tarihinde katıldı
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Komisyon Bağlantıları */}
              {selectedCommission.links && selectedCommission.links.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <LinkIcon className="w-5 h-5" />
                    Komisyon Bağlantıları
                  </h4>
                  <div className="space-y-3">
                    {selectedCommission.links.map((link: CommissionLink) => (
                      <div key={link.id} className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900 mb-1">{link.title}</h5>
                            {link.description && (
                              <p className="text-sm text-gray-600 mb-2">{link.description}</p>
                            )}
                            <p className="text-xs text-gray-500">
                              {link.created_by_name} tarafından eklendi
                            </p>
                          </div>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            <LinkIcon className="w-4 h-4" />
                            Git
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <UserGroupIcon className="w-5 h-5" />
                  Komisyon İstatistikleri
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedCommission.members.length}</p>
                    <p className="text-sm text-gray-600">Toplam Ortak</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {Math.round((selectedCommission.members.length / selectedCommission.commission.max_members) * 100)}%
                    </p>
                    <p className="text-sm text-gray-600">Ortak Sayısı</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {selectedCommission.commission.max_members - selectedCommission.members.length}
                    </p>
                    <p className="text-sm text-gray-600">Boş Kota</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
              <button
                onClick={() => handleLeaveCommission(selectedCommission.commission.id, selectedCommission.commission.name)}
                disabled={actionLoading === selectedCommission.commission.id}
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === selectedCommission.commission.id ? (
                  <span className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    İşleniyor...
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    Komisyondan Ayrıl
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowCommissionDetail(false)}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Applications Modal */}
      {showPendingModal && selectedCommissionForPending && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-green-500 to-green-600">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {selectedCommissionForPending.name} - Bekleyen Başvurular
                  </h3>
                  <p className="text-green-100">Komisyon yöneticisi olarak başvuruları değerlendirin</p>
                </div>
                <button
                  onClick={() => setShowPendingModal(false)}
                  className="text-white hover:text-green-200 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto max-h-[70vh]">
              {pendingApplications.length > 0 ? (
                <div className="space-y-4">
                  {pendingApplications.map((application) => (
                    <div key={application.application_id} className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold">
                              {application.first_name.charAt(0)}{application.last_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg">
                              {application.first_name} {application.last_name}
                            </h4>
                            <p className="text-gray-600 mb-1">{application.email}</p>
                            <p className="text-sm text-gray-500">{application.profession}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              Başvuru Tarihi: {new Date(application.joined_at).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleApproveApplication(
                              application.user_id, 
                              `${application.first_name} ${application.last_name}`
                            )}
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-1"
                          >
                            <CheckIcon className="w-4 h-4" />
                            Onayla
                          </button>
                          <button
                            onClick={() => handleRejectApplication(
                              application.user_id, 
                              `${application.first_name} ${application.last_name}`
                            )}
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-1"
                          >
                            <XMarkIcon className="w-4 h-4" />
                            Reddet
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClockIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Bekleyen Başvuru Yok
                  </h3>
                  <p className="text-gray-600">
                    {selectedCommissionForPending.name} komisyonu için şu anda bekleyen başvuru bulunmuyor.
                  </p>
                </div>
              )}
            </div>

            <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowPendingModal(false)}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bağlantılar Modal */}
      {showLinksModal && selectedCommissionForLinks && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-purple-600">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {selectedCommissionForLinks.name} - Bağlantılar
                  </h3>
                  <p className="text-purple-100">Komisyon bağlantılarını görüntüleyin</p>
                </div>
                <button
                  onClick={() => setShowLinksModal(false)}
                  className="text-white hover:text-purple-200 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto max-h-[70vh]">
              {commissionLinks.length > 0 ? (
                <div className="space-y-4">
                  {commissionLinks.map((link) => (
                    <div key={link.id} className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <LinkIcon className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-lg">{link.title}</h4>
                              <p className="text-sm text-gray-500">
                                {link.created_by_name} tarafından eklendi
                              </p>
                            </div>
                          </div>
                          
                          {link.description && (
                            <p className="text-gray-600 mb-3 bg-white p-3 rounded-lg border">
                              {link.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              <LinkIcon className="w-4 h-4" />
                              Bağlantıya Git
                            </a>
                            <span className="text-xs text-gray-400">
                              {new Date(link.created_at).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LinkIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Henüz Bağlantı Yok
                  </h3>
                  <p className="text-gray-600">
                    {selectedCommissionForLinks.name} komisyonu için henüz bağlantı eklenmemiş.
                  </p>
                </div>
              )}
            </div>

            <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowLinksModal(false)}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 