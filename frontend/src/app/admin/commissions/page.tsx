'use client';

import { useState, useEffect } from 'react';
import { commissionAPI, dashboardAPI } from '@/lib/api';
import { useNotification } from '@/hooks/useNotification';
import {
  UserGroupIcon,
  ClipboardDocumentListIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  LinkIcon,
  EyeIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

interface Commission {
  id: number;
  name: string;
  description: string;
  max_members: number;
  current_members: number;
  is_active: boolean;
  created_at: string;
  created_by_name: string;
}

interface CommissionMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  profession: string;
  commission_role: string;
  joined_at: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  profession: string;
  role: string;
  is_active: boolean;
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

export default function CommissionsPage() {
  const { showSuccess, showError, showWarning } = useNotification();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [commissionMembers, setCommissionMembers] = useState<CommissionMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [showEditLinkModal, setShowEditLinkModal] = useState(false);
  const [pendingApplications, setPendingApplications] = useState<any[]>([]);
  const [commissionLinks, setCommissionLinks] = useState<CommissionLink[]>([]);
  const [selectedLink, setSelectedLink] = useState<CommissionLink | null>(null);

  const [newCommission, setNewCommission] = useState({
    name: '',
    description: '',
    max_members: 10
  });

  const [initialLinks, setInitialLinks] = useState<Array<{title: string, url: string, description: string}>>([]);

  const [editCommission, setEditCommission] = useState({
    id: 0,
    name: '',
    description: '',
    max_members: 10,
    is_active: true
  });

  const [newLink, setNewLink] = useState({
    title: '',
    url: '',
    description: ''
  });

  const [editLinkData, setEditLinkData] = useState({
    title: '',
    url: '',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [commissionsResponse, usersResponse] = await Promise.all([
        commissionAPI.getAll(),
        dashboardAPI.getAllUsers()
      ]);

      if (commissionsResponse.success) {
        setCommissions(commissionsResponse.data);
      }
      
      if (usersResponse.success) {
        setUsers(usersResponse.data);
      }
    } catch (error: any) {
      console.error('Load data error:', error);
      setError('Komisyon ortakları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadCommissionMembers = async (commissionId: number) => {
    try {
      const response = await commissionAPI.getMembers(commissionId);
      if (response.success) {
        setCommissionMembers(response.data);
      }
    } catch (error: any) {
      console.error('Load commission members error:', error);
      setError('Komisyon ortakları yüklenirken hata oluştu');
    }
  };

  const handleCreateCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await commissionAPI.create(newCommission);
      if (response.success) {
        const commissionId = response.data.id;
        
        // Eğer başlangıç bağlantıları varsa, onları da ekle
        if (initialLinks.length > 0) {
          for (const link of initialLinks) {
            if (link.title.trim() && link.url.trim()) {
              try {
                await commissionAPI.addLink(commissionId, link);
              } catch (linkError) {
                console.error('Link ekleme hatası:', linkError);
              }
            }
          }
        }
        
        setShowCreateModal(false);
        setNewCommission({ name: '', description: '', max_members: 10 });
        setInitialLinks([]);
        loadData();
        showSuccess('Başarılı!', 'Komisyon başarıyla oluşturuldu!');
      } else {
        showError('Hata Oluştu 😞', response.message || 'Komisyon oluşturulamadı');
      }
    } catch (error: any) {
      console.error('Create commission error:', error);
      showError('Hata Oluştu 😞', 'Komisyon oluşturulurken beklenmeyen bir hata oluştu');
    }
  };

  const handleViewMembers = async (commission: Commission) => {
    setSelectedCommission(commission);
    await loadCommissionMembers(commission.id);
    setShowMembersModal(true);
  };

  const handleAddMember = async (userId: number) => {
    if (!selectedCommission) return;

    try {
      const response = await commissionAPI.addMember(selectedCommission.id, userId);
      if (response.success) {
        await loadCommissionMembers(selectedCommission.id);
        loadData(); // Komisyon sayılarını güncelle
        setShowAddMemberModal(false);
        showSuccess('Başarılı!', 'Ortak başarıyla komisyona eklendi!');
      } else {
        showError('Hata Oluştu 😞', response.message || 'Ortak eklenemedi');
      }
    } catch (error: any) {
      console.error('Add member error:', error);
      showError('Hata Oluştu 😞', 'Ortak eklenirken beklenmeyen bir hata oluştu');
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!selectedCommission) return;

    if (confirm('Bu ortağı komisyondan çıkarmak istediğinizden emin misiniz?')) {
      try {
        const response = await commissionAPI.removeMember(selectedCommission.id, userId);
        if (response.success) {
          await loadCommissionMembers(selectedCommission.id);
          loadData(); // Komisyon sayılarını güncelle
          alert('Ortak başarıyla çıkarıldı!');
        } else {
          alert(response.message || 'Ortak çıkarılamadı');
        }
      } catch (error: any) {
        console.error('Remove member error:', error);
        alert('Ortak çıkarılırken hata oluştu');
      }
    }
  };

  const handlePromoteToManager = async (userId: number) => {
    if (!selectedCommission) return;

    if (confirm('Bu ortağı komisyon yöneticisi yapmak istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/commissions/${selectedCommission.id}/promote/${userId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        if (data.success) {
          await loadCommissionMembers(selectedCommission.id);
          loadData();
          alert(data.message || 'Ortak başarıyla yönetici olarak atandı!');
        } else {
          alert(data.message || 'Yönetici ataması yapılamadı');
        }
      } catch (error: any) {
        console.error('Promote to manager error:', error);
        alert('Yönetici ataması yapılırken hata oluştu');
      }
    }
  };

  const handleDemoteManager = async (userId: number) => {
    if (!selectedCommission) return;

    if (confirm('Bu ortağın yönetici yetkisini kaldırmak istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/commissions/${selectedCommission.id}/demote/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        if (data.success) {
          await loadCommissionMembers(selectedCommission.id);
          loadData();
          alert(data.message || 'Yönetici yetkisi başarıyla kaldırıldı!');
        } else {
          alert(data.message || 'Yönetici yetkisi kaldırılamadı');
        }
      } catch (error: any) {
        console.error('Demote manager error:', error);
        alert('Yönetici yetkisi kaldırılırken hata oluştu');
      }
    }
  };

  const loadPendingApplications = async (commissionId: number) => {
    console.log('🔍 Loading pending applications for commission:', commissionId);
    try {
      const response = await fetch(`/api/commissions/${commissionId}/pending`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 API Response Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 API Response Data:', data);
        if (data.success) {
          setPendingApplications(data.data);
          console.log('✓ Pending applications set:', data.data.length, 'applications');
        } else {
          console.log('✗ API returned false success:', data.message);
        }
      } else {
        const errorData = await response.text();
        console.log('🚫 API Error Response:', errorData);
      }
    } catch (error: any) {
      console.error('Load pending applications error:', error);
      setError('Bekleyen başvurular yüklenirken hata oluştu');
    }
  };

  const handleViewPendingApplications = async (commission: Commission) => {
    setSelectedCommission(commission);
    await loadPendingApplications(commission.id);
    setShowPendingModal(true);
  };

  const handleApproveApplication = async (applicationUserId: number, applicantName: string) => {
    if (!selectedCommission) return;

    if (confirm(`${applicantName} adlı kişinin başvurusunu onaylamak istediğinizden emin misiniz?`)) {
      try {
        const response = await fetch(`/api/commissions/${selectedCommission.id}/approve/${applicationUserId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        if (data.success) {
          await loadPendingApplications(selectedCommission.id);
          loadData();
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
    if (!selectedCommission) return;

    if (confirm(`${applicantName} adlı kişinin başvurusunu reddetmek istediğinizden emin misiniz?`)) {
      try {
        const response = await fetch(`/api/commissions/${selectedCommission.id}/reject/${applicationUserId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        if (data.success) {
          await loadPendingApplications(selectedCommission.id);
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

  const handleEditCommission = (commission: Commission) => {
    setEditCommission({
      id: commission.id,
      name: commission.name,
      description: commission.description,
      max_members: commission.max_members,
      is_active: commission.is_active
    });
    setShowEditModal(true);
  };

  const handleUpdateCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await commissionAPI.update(editCommission.id, {
        name: editCommission.name,
        description: editCommission.description,
        max_members: editCommission.max_members,
        is_active: editCommission.is_active
      });
      if (response.success) {
        setShowEditModal(false);
        loadData();
        alert('Komisyon başarıyla güncellendi!');
      } else {
        alert(response.message || 'Komisyon güncellenemedi');
      }
    } catch (error: any) {
      console.error('Update commission error:', error);
      alert('Komisyon güncellenirken hata oluştu');
    }
  };

  const handleDeleteCommission = async (commissionId: number) => {
    if (confirm('Bu komisyonu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        const response = await commissionAPI.delete(commissionId);
        if (response.success) {
          loadData();
          alert('Komisyon başarıyla silindi!');
        } else {
          alert(response.message || 'Komisyon silinemedi');
        }
      } catch (error: any) {
        console.error('Delete commission error:', error);
        alert('Komisyon silinirken hata oluştu');
      }
    }
  };

  // ================== LİNK YÖNETİMİ ==================
  
  const loadCommissionLinks = async (commissionId: number) => {
    try {
      const response = await commissionAPI.getLinks(commissionId);
      if (response.success) {
        setCommissionLinks(response.data);
      }
    } catch (error: any) {
      console.error('Load commission links error:', error);
      showError('Hata Oluştu 😞', 'Komisyon linkleri yüklenirken hata oluştu');
    }
  };

  const handleViewLinks = async (commission: Commission) => {
    setSelectedCommission(commission);
    await loadCommissionLinks(commission.id);
    setShowLinksModal(true);
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommission) return;

    try {
      const response = await commissionAPI.addLink(selectedCommission.id, newLink);
      if (response.success) {
        await loadCommissionLinks(selectedCommission.id);
        setShowAddLinkModal(false);
        setNewLink({ title: '', url: '', description: '' });
        showSuccess('Başarılı!', 'Link başarıyla eklendi!');
      } else {
        showError('Hata Oluştu 😞', response.message || 'Link eklenemedi');
      }
    } catch (error: any) {
      console.error('Add link error:', error);
      showError('Hata Oluştu 😞', 'Link eklenirken hata oluştu');
    }
  };

  const handleEditLink = (link: CommissionLink) => {
    setSelectedLink(link);
    setEditLinkData({
      title: link.title,
      url: link.url,
      description: link.description || ''
    });
    setShowEditLinkModal(true);
  };

  const handleUpdateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommission || !selectedLink) return;

    try {
      const response = await commissionAPI.updateLink(selectedCommission.id, selectedLink.id, editLinkData);
      if (response.success) {
        await loadCommissionLinks(selectedCommission.id);
        setShowEditLinkModal(false);
        setSelectedLink(null);
        showSuccess('Başarılı!', 'Link başarıyla güncellendi!');
      } else {
        showError('Hata Oluştu 😞', response.message || 'Link güncellenemedi');
      }
    } catch (error: any) {
      console.error('Update link error:', error);
      showError('Hata Oluştu 😞', 'Link güncellenirken hata oluştu');
    }
  };

  const handleDeleteLink = async (linkId: number) => {
    if (!selectedCommission) return;

    if (confirm('Bu linki silmek istediğinizden emin misiniz?')) {
      try {
        const response = await commissionAPI.deleteLink(selectedCommission.id, linkId);
        if (response.success) {
          await loadCommissionLinks(selectedCommission.id);
          showSuccess('Başarılı!', 'Link başarıyla silindi!');
        } else {
          showError('Hata Oluştu 😞', response.message || 'Link silinemedi');
        }
      } catch (error: any) {
        console.error('Delete link error:', error);
        showError('Hata Oluştu 😞', 'Link silinirken hata oluştu');
      }
    }
  };

  // Komisyona ortak olmayan kullanıcıları filtrele
  const availableUsers = users.filter(user => 
    user.is_active && 
    !commissionMembers.some(member => member.id === user.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Komisyonlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <XMarkIcon className="w-5 h-5 text-red-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-red-800">{error}</p>
            <button 
              onClick={loadData}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Tekrar dene
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Komisyon Yönetimi</h2>
          <p className="mt-2 text-gray-600">
            Kooperatif komisyonlarını yönetin ve ortaklarını organize edin
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
        >
          ➕ Yeni Komisyon
        </button>
      </div>

      {/* Komisyonlar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {commissions.map((commission) => (
          <div key={commission.id} className="bg-white/70 backdrop-blur-lg shadow-xl overflow-hidden rounded-2xl border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{commission.name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  commission.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {commission.is_active ? 'Aktif' : 'Pasif'}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {commission.description}
              </p>

              {/* Ortak Sayısı ve Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Ortak Sayısı</span>
                  <span>{commission.current_members}/{commission.max_members}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(commission.current_members / commission.max_members) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Komisyon Bilgileri */}
              <div className="text-xs text-gray-500 mb-4">
                <p>Oluşturan: {commission.created_by_name}</p>
                <p>
                  Oluşturma: {new Date(commission.created_at).toLocaleDateString('tr-TR')}
                </p>
              </div>

              {/* Aksiyon Butonları */}
              <div className="space-y-2">
                <button
                  onClick={() => handleViewMembers(commission)}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <UserGroupIcon className="w-4 h-4" />
                  Ortakları Yönet ({commission.current_members})
                </button>
                
                <button
                  onClick={() => handleViewPendingApplications(commission)}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <ClockIcon className="w-4 h-4" />
                  Başvuruları İncele
                </button>
                
                <button
                  onClick={() => handleViewLinks(commission)}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <LinkIcon className="w-4 h-4" />
                  Bağlantıları Yönet
                </button>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleEditCommission(commission)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDeleteCommission(commission.id)}
                    className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Sil
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {commissions.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-4xl">📋</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Henüz komisyon bulunmuyor
            </h3>
            <p className="text-gray-500 mb-4">
              İlk komisyonunuzu oluşturmak için butona tıklayın
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-medium"
            >
              ➕ İlk Komisyonu Oluştur
            </button>
          </div>
        )}
      </div>

      {/* Yeni Komisyon Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Yeni Komisyon Oluştur</h3>
              
              <form onSubmit={handleCreateCommission} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Komisyon Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCommission.name}
                    onChange={(e) => setNewCommission({...newCommission, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Örn: Eğitim Komisyonu"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newCommission.description}
                    onChange={(e) => setNewCommission({...newCommission, description: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Komisyonun görevleri ve sorumluluklarını açıklayın"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maksimum Ortak Sayısı
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newCommission.max_members}
                    onChange={(e) => setNewCommission({...newCommission, max_members: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Başlangıç Bağlantıları Bölümü */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Başlangıç Bağlantıları (Opsiyonel)
                    </label>
                    <button
                      type="button"
                      onClick={() => setInitialLinks([...initialLinks, { title: '', url: '', description: '' }])}
                      className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Bağlantı Ekle
                    </button>
                  </div>
                  
                  {initialLinks.map((link, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-700">Bağlantı {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => setInitialLinks(initialLinks.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Bağlantı başlığı"
                          value={link.title}
                          onChange={(e) => {
                            const updatedLinks = [...initialLinks];
                            updatedLinks[index].title = e.target.value;
                            setInitialLinks(updatedLinks);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <input
                          type="url"
                          placeholder="https://..."
                          value={link.url}
                          onChange={(e) => {
                            const updatedLinks = [...initialLinks];
                            updatedLinks[index].url = e.target.value;
                            setInitialLinks(updatedLinks);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          placeholder="Açıklama (opsiyonel)"
                          value={link.description}
                          onChange={(e) => {
                            const updatedLinks = [...initialLinks];
                            updatedLinks[index].description = e.target.value;
                            setInitialLinks(updatedLinks);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ))}
                  
                  {initialLinks.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-2">
                      Komisyon oluştururken bağlantı eklemek için "Bağlantı Ekle" butonuna tıklayın
                    </p>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewCommission({ name: '', description: '', max_members: 10 });
                      setInitialLinks([]);
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300"
                  >
                    Oluştur
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Ortaklar Modal */}
      {showMembersModal && selectedCommission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedCommission.name}</h3>
                  <p className="text-gray-600">Ortak Yönetimi</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Ortak Ekle
                  </button>
                  <button
                    onClick={() => setShowMembersModal(false)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    Kapat
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {commissionMembers.length > 0 ? (
                <div className="space-y-4">
                  {commissionMembers.map((member) => (
                    <div key={member.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold">
                            {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {member.first_name} {member.last_name}
                          </h4>
                          <p className="text-sm text-gray-600">{member.email}</p>
                          <p className="text-xs text-gray-500">
                            {member.profession} • {new Date(member.joined_at).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                          member.commission_role === 'manager' 
                            ? 'bg-purple-100 text-purple-800' 
                            : member.commission_role === 'leader'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {member.commission_role === 'manager' ? 'Yönetici' : 
                           member.commission_role === 'leader' ? 'Başkan' : 'Ortak'}
                        </span>
                        
                        {member.commission_role !== 'manager' && (
                          <button
                            onClick={() => handlePromoteToManager(member.id)}
                            className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                          >
                            Yönetici Yap
                          </button>
                        )}
                        
                        {member.commission_role === 'manager' && (
                          <button
                            onClick={() => handleDemoteManager(member.id)}
                            className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                          >
                            Yöneticilikten Al
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                        >
                          Çıkar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserGroupIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">Bu komisyonda henüz ortak bulunmuyor</p>
                  <p className="text-sm text-gray-500 mt-2">İlk ortakı eklemek için "Ortak Ekle" butonuna tıklayın</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ortak Ekle Modal */}
      {showAddMemberModal && selectedCommission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {selectedCommission.name} - Ortak Ekle
              </h3>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {availableUsers.length > 0 ? (
                <div className="space-y-3">
                  {availableUsers.map((user) => (
                    <div key={user.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-bold text-sm">
                            {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </h4>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">{user.profession}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddMember(user.id)}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                      >
                        Ekle
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClipboardDocumentListIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">Eklenebilecek ortak bulunmuyor</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Tüm aktif ortaklar zaten bu komisyonda veya başka komisyonlarda
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Komisyon Düzenle Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Komisyon Düzenle</h3>
              
              <form onSubmit={handleUpdateCommission} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Komisyon Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={editCommission.name}
                    onChange={(e) => setEditCommission({...editCommission, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Örn: Eğitim Komisyonu"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={editCommission.description}
                    onChange={(e) => setEditCommission({...editCommission, description: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Komisyonun görevleri ve sorumluluklarını açıklayın"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maksimum Ortak Sayısı
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={editCommission.max_members}
                    onChange={(e) => setEditCommission({...editCommission, max_members: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300"
                  >
                    Güncelle
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bağlantılar Yönetimi Modal */}
      {showLinksModal && selectedCommission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedCommission.name}</h3>
                  <p className="text-gray-600">Bağlantı Yönetimi</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowAddLinkModal(true)}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Bağlantı Ekle
                  </button>
                  <button
                    onClick={() => setShowLinksModal(false)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    Kapat
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {commissionLinks.length > 0 ? (
                <div className="space-y-4">
                  {commissionLinks.map((link) => (
                    <div key={link.id} className="bg-gray-50 rounded-xl p-4 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <LinkIcon className="w-5 h-5 text-purple-600" />
                          <h4 className="font-medium text-gray-900 text-lg">{link.title}</h4>
                        </div>
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm break-all"
                        >
                          {link.url}
                        </a>
                        {link.description && (
                          <p className="text-gray-600 text-sm mt-2">{link.description}</p>
                        )}
                        <div className="text-xs text-gray-500 mt-2">
                          <p>Oluşturan: {link.created_by_name}</p>
                          <p>Tarih: {new Date(link.created_at).toLocaleDateString('tr-TR')}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEditLink(link)}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLink(link.id)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LinkIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">Bu komisyonda henüz bağlantı bulunmuyor</p>
                  <p className="text-sm text-gray-500 mt-2">İlk bağlantıyı eklemek için "Bağlantı Ekle" butonuna tıklayın</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bağlantı Ekleme Modal */}
      {showAddLinkModal && selectedCommission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Bağlantı Ekle</h3>
              
              <form onSubmit={handleAddLink} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başlık *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLink.title}
                    onChange={(e) => setNewLink({...newLink, title: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Örn: Google Drive Dosyaları"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={newLink.url}
                    onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://drive.google.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama
                  </label>
                  <textarea
                    rows={3}
                    value={newLink.description}
                    onChange={(e) => setNewLink({...newLink, description: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Bu bağlantı hakkında açıklama yazın..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddLinkModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300"
                  >
                    Ekle
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bağlantı Düzenleme Modal */}
      {showEditLinkModal && selectedLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Bağlantı Düzenle</h3>
              
              <form onSubmit={handleUpdateLink} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başlık *
                  </label>
                  <input
                    type="text"
                    required
                    value={editLinkData.title}
                    onChange={(e) => setEditLinkData({...editLinkData, title: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Örn: Google Drive Dosyaları"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={editLinkData.url}
                    onChange={(e) => setEditLinkData({...editLinkData, url: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://drive.google.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama
                  </label>
                  <textarea
                    rows={3}
                    value={editLinkData.description}
                    onChange={(e) => setEditLinkData({...editLinkData, description: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Bu bağlantı hakkında açıklama yazın..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditLinkModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300"
                  >
                    Güncelle
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Admin Bekleyen Başvurular Modal */}
      {showPendingModal && selectedCommission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedCommission.name} - Bekleyen Başvurular
                  </h3>
                  <p className="text-gray-600">Admin olarak tüm başvuruları yönetebilirsiniz</p>
                </div>
                <button
                  onClick={() => setShowPendingModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium"
                >
                  ✕ Kapat
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
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
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
                          >
                            ✅ Onayla
                          </button>
                          <button
                            onClick={() => handleRejectApplication(
                              application.user_id, 
                              `${application.first_name} ${application.last_name}`
                            )}
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
                          >
                            ❌ Reddet
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-400 text-2xl">📝</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Bekleyen Başvuru Yok
                  </h3>
                  <p className="text-gray-600">
                    {selectedCommission.name} komisyonu için şu anda bekleyen başvuru bulunmuyor.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 