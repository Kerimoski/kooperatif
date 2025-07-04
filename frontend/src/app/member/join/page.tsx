'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { memberAPI } from '@/lib/api';
import {
  ClipboardDocumentListIcon,
  PlusIcon,
  ClockIcon,
  CheckIcon,
  DocumentTextIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  BriefcaseIcon,
  SparklesIcon,
  NoSymbolIcon,
  PencilSquareIcon,
  EyeIcon,
  ShieldCheckIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface AvailableCommission {
  id: number;
  name: string;
  description: string;
  max_members: number;
  current_members: number;
  is_member: boolean;
  member_status?: 'active' | 'pending' | null;
}

interface CommissionDetail {
  commission: {
    id: number;
    name: string;
    description: string;
    max_members: number;
    current_members: number;
    created_by_name: string;
  };
  members: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    profession: string;
    joined_at: string;
    role: string;
  }[];
}

export default function JoinCommissionsPage() {
  const router = useRouter();
  const [availableCommissions, setAvailableCommissions] = useState<AvailableCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showCommissionDetail, setShowCommissionDetail] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<{id: number, name: string} | null>(null);
  const [selectedCommissionDetail, setSelectedCommissionDetail] = useState<CommissionDetail | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    loadAvailableCommissions();
  }, []);

  const loadAvailableCommissions = async () => {
    try {
      setLoading(true);
      const response = await memberAPI.getAvailableCommissions();

      if (response.success) {
        setAvailableCommissions(response.data);
      }
    } catch (error) {
      console.error('Available commissions load error:', error);
      setError('Komisyonlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCommission = (commissionId: number, commissionName: string) => {
    setSelectedCommission({ id: commissionId, name: commissionName });
    setShowConfirmModal(true);
  };

  const confirmJoinCommission = async () => {
    if (!selectedCommission) return;

    try {
      setActionLoading(selectedCommission.id);
      const response = await memberAPI.joinCommission(selectedCommission.id);
      
      if (response.success) {
        await loadAvailableCommissions();
        setNotification({
          type: 'success',
          title: 'Başvuru Gönderildi!',
          message: response.message || 'Başvurunuz başarıyla gönderildi. Komisyon yöneticisi veya sistem yöneticisi tarafından değerlendirilecektir.'
        });
        setShowNotificationModal(true);
      }
    } catch (error: any) {
      console.error('Join commission error:', error);
      setNotification({
        type: 'error',
        title: 'Başvuru Gönderilemedi',
        message: error.response?.data?.message || 'Başvuru gönderilirken bir hata oluştu. Lütfen tekrar deneyiniz.'
      });
      setShowNotificationModal(true);
    } finally {
      setActionLoading(null);
      setSelectedCommission(null);
    }
  };

  const handleViewCommissionDetail = async (commissionId: number) => {
    try {
      setLoading(true);
      const response = await memberAPI.getCommissionDetail(commissionId);
      
      if (response.success) {
        setSelectedCommissionDetail(response.data);
        setShowCommissionDetail(true);
      }
    } catch (error: any) {
      console.error('Commission detail error:', error);
      setNotification({
        type: 'error',
        title: 'Komisyon Detayları Yüklenemedi',
        message: error.response?.data?.message || 'Komisyon detayları yüklenirken bir hata oluştu.'
      });
      setShowNotificationModal(true);
    } finally {
      setLoading(false);
    }
  };

  const filteredCommissions = availableCommissions.filter(commission =>
    commission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    commission.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const joinableCommissions = filteredCommissions.filter(commission => !commission.is_member && commission.member_status !== 'pending');
  const pendingCommissions = filteredCommissions.filter(commission => commission.member_status === 'pending');
  const alreadyMemberCommissions = filteredCommissions.filter(commission => commission.is_member && commission.member_status === 'active');

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
           <UserGroupIcon className="w-8 h-8 mr-3" />
           <div>
             <h2 className="text-3xl font-bold text-white">Komisyonlara Başvur</h2>
             <p className="mt-2 text-emerald-100">
               Kooperatif komisyonlarına başvuru yaparak onay aldıktan sonra faaliyetlere destek olabilirsiniz.
             </p>
           </div>
         </div>
       </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Arama Çubuğu */}
      <div className="mb-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
            placeholder="Komisyon ara (isim veya açıklama)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <ClipboardDocumentListIcon className="w-5 h-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Komisyon</p>
              <p className="text-2xl font-bold text-gray-900">{availableCommissions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <PlusIcon className="w-5 h-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Başvurabileceğim</p>
              <p className="text-2xl font-bold text-gray-900">{joinableCommissions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Başvuru Bekliyor</p>
              <p className="text-2xl font-bold text-gray-900">{pendingCommissions.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <CheckIcon className="w-5 h-5 text-white" />
            </div>
            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-600">Zaten Ortağıyım</p>
              <p className="text-2xl font-bold text-gray-900">{alreadyMemberCommissions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Onay Bekleyen Başvurularım */}
      {pendingCommissions.length > 0 && (
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            ⏳ Onay Bekleyen Başvurularım ({pendingCommissions.length})
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pendingCommissions.map((commission) => (
              <div key={commission.id} className="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 overflow-hidden">
                <div className="p-6 sm:p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{commission.name}</h4>
                      <p className="text-gray-600 mb-4">{commission.description}</p>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        ⏳ Onay Bekliyor
                      </span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Ortak Sayısı</span>
                      <span className="text-sm font-medium text-gray-900">
                        {commission.current_members}/{commission.max_members}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(commission.current_members / commission.max_members) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex space-x-3 mb-4">
                    <button
                      onClick={() => handleViewCommissionDetail(commission.id)}
                      className="flex-1 bg-blue-100 text-blue-700 px-4 py-3 rounded-xl text-sm font-medium hover:bg-blue-200 transition-colors"
                    >
                      <span className="flex items-center justify-center gap-1">
                        <EyeIcon className="w-4 h-4" />
                        Üyeleri Gör
                      </span>
                    </button>
                  </div>

                  <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <p className="text-sm text-yellow-800 flex items-center gap-2">
                      <span className="font-medium flex items-center gap-1">
                        <ClipboardDocumentListIcon className="w-4 h-4" />
                        Başvuru Durumu:
                      </span> 
                      Komisyon yöneticisi veya sistem yöneticisi tarafından değerlendirilmeyi bekliyor.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Katılabileceğim Komisyonlar */}
      {joinableCommissions.length > 0 && (
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            <span className="flex items-center gap-2">
              <SparklesIcon className="w-6 h-6" />
              Başvurabileceğiniz Komisyonlar ({joinableCommissions.length})
            </span>
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {joinableCommissions.map((commission) => (
              <div key={commission.id} className="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="p-6 sm:p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{commission.name}</h4>
                      <p className="text-gray-600 mb-4">{commission.description}</p>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 gap-1">
                        <BriefcaseIcon className="w-4 h-4" />
                        Açık
                      </span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Ortak Sayısı</span>
                      <span className="text-sm font-medium text-gray-900">
                        {commission.current_members}/{commission.max_members}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(commission.current_members / commission.max_members) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleViewCommissionDetail(commission.id)}
                      className="flex-1 bg-blue-100 text-blue-700 px-4 py-3 rounded-xl text-sm font-medium hover:bg-blue-200 transition-colors"
                    >
                      <span className="flex items-center justify-center gap-1">
                        <EyeIcon className="w-4 h-4" />
                        Üyeleri Gör
                      </span>
                    </button>
                    <button
                      onClick={() => handleJoinCommission(commission.id, commission.name)}
                      disabled={actionLoading === commission.id || commission.current_members >= commission.max_members}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-xl text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === commission.id ? (
                        <>
                          <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                          İşleniyor...
                        </>
                      ) : commission.current_members >= commission.max_members ? (
                        <span className="flex items-center gap-1">
                          <NoSymbolIcon className="w-4 h-4" />
                          Kapasite Dolu
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <PencilSquareIcon className="w-4 h-4" />
                          Başvuru Yap
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zaten Ortak Olduğum Komisyonlar */}
      {alreadyMemberCommissions.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            <span className="flex items-center gap-2">
              <CheckIcon className="w-6 h-6" />
              Zaten Ortak Olduğunuz Komisyonlar ({alreadyMemberCommissions.length})
            </span>
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {alreadyMemberCommissions.map((commission) => (
              <div key={commission.id} className="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 overflow-hidden opacity-75">
                <div className="p-6 sm:p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{commission.name}</h4>
                      <p className="text-gray-600 mb-4">{commission.description}</p>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 gap-1">
                        <CheckIcon className="w-4 h-4" />
                        Ortaksınız
                      </span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Ortak Sayısı</span>
                      <span className="text-sm font-medium text-gray-900">
                        {commission.current_members}/{commission.max_members}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
                        style={{ width: `${(commission.current_members / commission.max_members) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleViewCommissionDetail(commission.id)}
                      className="flex-1 bg-blue-100 text-blue-700 px-4 py-3 rounded-xl text-sm font-medium hover:bg-blue-200 transition-colors"
                    >
                      <span className="flex items-center justify-center gap-1">
                        <EyeIcon className="w-4 h-4" />
                        Üyeleri Gör
                      </span>
                    </button>
                    <a
                      href="/member/commissions"
                      className="flex-1 bg-green-100 text-green-700 px-4 py-3 rounded-xl text-sm font-medium hover:bg-green-200 transition-colors text-center"
                    >
                      Komisyonlarım
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hiç Komisyon Yok */}
      {filteredCommissions.length === 0 && searchTerm && (
        <div className="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 p-12 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MagnifyingGlassIcon className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Arama sonucu bulunamadı
          </h3>
          <p className="text-gray-600 mb-6">
            "<strong>{searchTerm}</strong>" için herhangi bir komisyon bulunamadı.
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200"
          >
            Tüm Komisyonları Göster
          </button>
        </div>
      )}

      {/* Hiç Katılabilecek Komisyon Yok */}
      {availableCommissions.length > 0 && joinableCommissions.length === 0 && !searchTerm && (
        <div className="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 p-12 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserGroupIcon className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Tebrikler! Tüm komisyonlara katıldınız
          </h3>
          <p className="text-gray-600 mb-6">
            Şu anda tüm mevcut komisyonların ortağısınız. Komisyon faaliyetlerinizi yönetmek için komisyonlarım sayfasını ziyaret edebilirsiniz.
          </p>
          <a
            href="/member/commissions"
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200"
          >
            Komisyonlarım
          </a>
        </div>
      )}

      {/* Commission Detail Modal */}
      {showCommissionDetail && selectedCommissionDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedCommissionDetail.commission.name}</h3>
                  <p className="text-gray-600">Komisyon Ortakları</p>
                </div>
                <button
                  onClick={() => setShowCommissionDetail(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                >
                  <XMarkIcon className="w-4 h-4" />
                  Kapat
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Komisyon Açıklaması</h4>
                <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">{selectedCommissionDetail.commission.description}</p>
              </div>

              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Komisyon Ortakları ({selectedCommissionDetail.members.length}/{selectedCommissionDetail.commission.max_members})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedCommissionDetail.members.map((member) => (
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

              <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <UserGroupIcon className="w-5 h-5" />
                  Komisyon İstatistikleri
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedCommissionDetail.members.length}</p>
                    <p className="text-sm text-gray-600">Toplam Ortak</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {Math.round((selectedCommissionDetail.members.length / selectedCommissionDetail.commission.max_members) * 100)}%
                    </p>
                    <p className="text-sm text-gray-600">Ortak Sayısı</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {selectedCommissionDetail.commission.max_members - selectedCommissionDetail.members.length}
                    </p>
                    <p className="text-sm text-gray-600">Boş Kota</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedCommission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all duration-300 scale-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <DocumentTextIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Komisyona Başvuru</h3>
                  <p className="text-white text-opacity-80 text-sm">Lütfen seçiminizi onaylayın</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 text-lg leading-relaxed">
                <span className="font-semibold text-blue-600">{selectedCommission.name}</span> komisyonuna başvuru yapmak istediğinize emin misiniz?
              </p>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium flex items-center gap-1"><InformationCircleIcon className="w-4 h-4" /> Bilgi:</span> Başvurunuz komisyon yöneticisi veya sistem yöneticisi tarafından değerlendirilecektir.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedCommission(null);
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-all duration-300"
                >
                  İptal
                </button>
                <button
                  onClick={confirmJoinCommission}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Başvuru Yap
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && notification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all duration-300 scale-100">
            {/* Header */}
            <div className={`bg-gradient-to-r p-6 ${
              notification.type === 'success' ? 'from-green-500 to-emerald-600' : 
              notification.type === 'error' ? 'from-red-500 to-red-600' :
              notification.type === 'warning' ? 'from-yellow-500 to-orange-600' :
              'from-blue-500 to-blue-600'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    {notification.type === 'success' ? <CheckIcon className="w-6 h-6 text-white" /> : 
                     notification.type === 'error' ? <XMarkIcon className="w-6 h-6 text-white" /> :
                     notification.type === 'warning' ? <ExclamationTriangleIcon className="w-6 h-6 text-white" /> : 
                     <InformationCircleIcon className="w-6 h-6 text-white" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{notification.title}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="text-white hover:text-opacity-80 transition-colors p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className={`p-6 border-t-2 ${
              notification.type === 'success' ? 'bg-green-50 border-green-200' : 
              notification.type === 'error' ? 'bg-red-50 border-red-200' :
              notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <p className={`text-lg leading-relaxed ${
                notification.type === 'success' ? 'text-green-800' : 
                notification.type === 'error' ? 'text-red-800' :
                notification.type === 'warning' ? 'text-yellow-800' :
                'text-blue-800'
              }`}>
                {notification.message}
              </p>
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setShowNotificationModal(false)}
                className={`w-full bg-gradient-to-r text-white py-3 px-4 rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl ${
                  notification.type === 'success' ? 'from-green-500 to-emerald-600' : 
                  notification.type === 'error' ? 'from-red-500 to-red-600' :
                  notification.type === 'warning' ? 'from-yellow-500 to-orange-600' :
                  'from-blue-500 to-blue-600'
                }`}
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 