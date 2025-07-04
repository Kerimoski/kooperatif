'use client';

import { useState, useEffect } from 'react';
import { authAPI, dashboardAPI } from '@/lib/api';
import {
  UserGroupIcon,
  CheckIcon,
  CogIcon,
  PencilIcon,
  PauseIcon,
  TrashIcon,
  XMarkIcon,
  UserIcon,
  ShieldCheckIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  profession: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState<{
    isImporting: boolean;
    success: number;
    failed: number;
    errors: string[];
  }>({
    isImporting: false,
    success: 0,
    failed: 0,
    errors: []
  });

  const [newUser, setNewUser] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    profession: '',
    role: 'member' as 'member' | 'admin',
    password: ''
  });

  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    profession: '',
    role: 'member' as 'member' | 'admin',
    is_active: true
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getAllUsers();
      
      if (response.success) {
        setUsers(response.data);
      } else {
        setError(response.message || 'Ortaklar yüklenemedi');
      }
    } catch (error: any) {
      console.error('Load users error:', error);
      setError('Ortaklar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await authAPI.register(newUser);
      if (response.success) {
        setShowCreateModal(false);
        setNewUser({
          first_name: '',
          last_name: '',
          email: '',
          phone_number: '',
          profession: '',
          role: 'member' as 'member' | 'admin',
          password: ''
        });
        loadUsers();
        alert('Ortak başarıyla oluşturuldu!');
      } else {
        alert(response.message || 'Ortak oluşturulamadı');
      }
    } catch (error: any) {
      console.error('Create user error:', error);
      alert('Ortak oluşturulurken hata oluştu');
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number,
      profession: user.profession,
      role: user.role as 'member' | 'admin',
      is_active: user.is_active
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const response = await authAPI.updateUser(selectedUser.id, editFormData);
      if (response.success) {
        setShowEditModal(false);
        loadUsers();
        alert('Ortak başarıyla güncellendi!');
      } else {
        alert(response.message || 'Ortak güncellenemedi');
      }
    } catch (error: any) {
      console.error('Update user error:', error);
      alert('Ortak güncellenirken hata oluştu');
    }
  };

  const handleDeactivateUser = async (userId: number) => {
    if (confirm('Bu ortağı pasife almak istediğinizden emin misiniz?')) {
      try {
        const response = await authAPI.deactivateUser(userId);
        if (response.success) {
          loadUsers();
          alert('Ortak başarıyla pasife alındı!');
        } else {
                      alert(response.message || 'Ortak pasife alınamadı');
        }
      } catch (error: any) {
        console.error('Deactivate user error:', error);
                  alert('Ortak pasife alınırken hata oluştu');
      }
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (confirm('Bu ortağı tamamen silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve ortak tüm komisyonlardan çıkarılacak.')) {
      try {
        const response = await authAPI.deleteUser(userId);
        if (response.success) {
          loadUsers();
          alert('Ortak başarıyla silindi ve tüm komisyonlardan çıkarıldı!');
        } else {
          alert(response.message || 'Ortak silinemedi');
        }
      } catch (error: any) {
        console.error('Delete user error:', error);
        alert('Ortak silinirken hata oluştu');
      }
    }
  };

  // Excel template indirme
  const downloadExcelTemplate = () => {
    // CSV içeriği oluştur
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    
    // Header bölümü
    csvContent += "KOOPERATIF ORTAK LİSTESİ TEMPLATE,,,,\n";
    csvContent += "Bu dosyayı doldurarak toplu ortak ekleme yapabilirsiniz,,,,\n";
    csvContent += ",,,,\n";
    
    // Alan tanımları bölümü
    csvContent += "ALAN TANIMLARI ve AÇIKLAMALAR,,,,\n";
    csvContent += "════════════════════════════════════════,,,,\n";
    csvContent += "ad,Zorunlu - Ortağın adı,,\n";
    csvContent += "soyad,Zorunlu - Ortağın soyadı,,\n";
    csvContent += "email,Zorunlu - Benzersiz email adresi (örnek: ahmet@email.com),,\n";
    csvContent += "telefon,Opsiyonel - Cep telefonu (örnek: 05551234567),,\n";
    csvContent += "meslek,Opsiyonel - Meslek bilgisi (örnek: Öğretmen),,\n";
    csvContent += "rol,Zorunlu - member veya admin (çoğunlukla member),,\n";
    csvContent += "sifre,Zorunlu - Minimum 6 karakter (örnek: abc123),,\n";
    csvContent += ",,,,\n";
    
    // Veri giriş bölümü başlığı
    csvContent += "VERİ GİRİŞ BÖLÜMÜ,,,,\n";
    csvContent += "════════════════════════════════════════,,,,\n";
    csvContent += "Aşağıdaki satırlara ortak bilgilerini giriniz:,,,,\n";
    csvContent += ",,,,\n";
    
    // Kolon başlıkları
    csvContent += "ad,soyad,email,telefon,meslek,rol,sifre\n";
    
    // Örnek veri satırı (silinebilir)
    csvContent += "Örnek,Kullanıcı,ornek@email.com,05551234567,Öğretmen,member,123456\n";
    
    // Ayırıcı
    csvContent += "↑ Bu satırı silebilirsiniz ↑,,,,,\n";
    csvContent += "↓ Buradan itibaren verilerinizi giriniz ↓,,,,,\n";
    
    // 20 adet boş satır (kullanıcı verileri için)
    for (let i = 0; i < 20; i++) {
      csvContent += ",,,,,,\n";
    }
    
    // Footer
    csvContent += ",,,,\n";
    csvContent += "NOTLAR:,,,,\n";
    csvContent += "- Email adresleri benzersiz olmalıdır,,,,\n";
    csvContent += "- Şifreler minimum 6 karakter olmalıdır,,,,\n";
    csvContent += "- Rol için 'member' veya 'admin' yazınız,,,,\n";
    csvContent += "- Telefon numarası 05xxxxxxxxx formatında olmalıdır,,,,\n";
    
    // Dosyayı indir
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Kooperatif_Ortak_Listesi_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Excel dosyası yükleme ve işleme
  const handleExcelImport = async () => {
    if (!excelFile) {
      alert('Lütfen bir dosya seçin');
      return;
    }

    setImportProgress({
      isImporting: true,
      success: 0,
      failed: 0,
      errors: []
    });

    try {
      const formData = new FormData();
      formData.append('excel', excelFile);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/auth/users/excel-import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        setImportProgress({
          isImporting: false,
          success: result.successCount || 0,
          failed: result.failed || 0,
          errors: result.errors || []
        });

        // Kullanıcı listesini yenile
        loadUsers();
        
        if (result.successCount > 0) {
          alert(`${result.successCount} ortak başarıyla eklendi!`);
        }
      } else {
        setImportProgress({
          isImporting: false,
          success: 0,
          failed: 0,
          errors: [result.message || 'Import başarısız']
        });
        alert('Excel dosyası işlenirken hata oluştu: ' + (result.message || 'Bilinmeyen hata'));
      }
    } catch (error: any) {
      console.error('Excel import error:', error);
      setImportProgress({
        isImporting: false,
        success: 0,
        failed: 0,
        errors: ['Dosya yüklenirken hata oluştu']
      });
      alert('Excel dosyası yüklenirken hata oluştu');
    }
  };

  // Excel modal'ını sıfırla
  const resetExcelModal = () => {
    setExcelFile(null);
    setImportProgress({
      isImporting: false,
      success: 0,
      failed: 0,
      errors: []
    });
    setShowExcelImportModal(false);
  };

  const filteredUsers = users.filter(user =>
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.profession?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Ortaklar yükleniyor...</p>
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
              onClick={loadUsers}
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
          <h2 className="text-3xl font-bold text-gray-900">Ortak Yönetimi</h2>
          <p className="mt-2 text-gray-600">
            Kooperatif ortaklarını yönetin ve yeni ortaklar ekleyin
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={downloadExcelTemplate}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            Template İndir
          </button>
          <button
            onClick={() => setShowExcelImportModal(true)}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
          >
            <DocumentArrowUpIcon className="w-5 h-5" />
            Excel İmport
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Yeni Ortak
          </button>
              </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/70 backdrop-blur-lg shadow-lg overflow-hidden rounded-xl border border-white/20 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <UserGroupIcon className="w-5 h-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Toplam Ortak</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-lg shadow-lg overflow-hidden rounded-xl border border-white/20 p-6">
          <div className="flex items-center">
            
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                              <CheckIcon className="w-5 h-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Aktif Ortak</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(user => user.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-lg shadow-lg overflow-hidden rounded-xl border border-white/20 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <CogIcon className="w-5 h-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Yönetici</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(user => user.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Arama */}
      <div className="bg-white/70 backdrop-blur-lg shadow-lg rounded-2xl border border-white/20 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Ortak Ara
            </label>
            <input
              type="text"
              id="search"
              placeholder="Ad, soyad, e-posta, telefon veya meslek ile arayın..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Üyeler Tablosu */}
      <div className="bg-white/70 backdrop-blur-lg shadow-xl overflow-hidden rounded-2xl border border-white/20">
        <div className="px-6 py-4 sm:px-8 border-b border-gray-200/50">
          <h3 className="text-lg leading-6 font-bold text-gray-900">
            Ortak Listesi ({filteredUsers.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200/50">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ortak
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İletişim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Meslek
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Katılım
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200/30">
              {filteredUsers.map((user) => (
                <tr key={user.id} className={`hover:bg-gray-50/50 transition-colors ${!user.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center ${!user.is_active ? 'opacity-60' : ''}`}>
                        <span className="text-white font-bold text-sm">
                          {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className={`text-sm font-medium text-gray-900 ${!user.is_active ? 'text-gray-500' : ''}`}>
                          {user.first_name} {user.last_name}
                          {!user.is_active && <span className="ml-2 text-xs text-red-500">(Pasif)</span>}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {user.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.phone_number || 'Belirtilmemiş'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.profession || 'Belirtilmemiş'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      <div className="flex items-center">
                  {user.role === 'admin' ? (
                    <>
                      <ShieldCheckIcon className="w-4 h-4 mr-1" />
                      Yönetici
                    </>
                  ) : (
                    <>
                      <UserIcon className="w-4 h-4 mr-1" />
                      Üye
                    </>
                  )}
                </div>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      user.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      <div className="flex items-center">
                  {user.is_active ? (
                    <>
                      <CheckIcon className="w-4 h-4 mr-1 text-green-600" />
                      Aktif
                    </>
                  ) : (
                    <>
                      <XMarkIcon className="w-4 h-4 mr-1 text-red-600" />
                      Pasif
                    </>
                  )}
                </div>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-1">
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded-lg text-xs font-medium transition-colors"
                      >
                        <PencilIcon className="w-4 h-4 mr-1" />
                        Düzenle
                      </button>
                      {user.is_active && (
                        <button 
                          onClick={() => handleDeactivateUser(user.id)}
                          className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2 py-1 rounded-lg text-xs font-medium transition-colors"
                        >
                                                      <PauseIcon className="w-4 h-4 mr-1" />
                            Pasife Al
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded-lg text-xs font-medium transition-colors"
                      >
                                                  <TrashIcon className="w-4 h-4 mr-1" />
                          Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserGroupIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz ortak bulunmuyor'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? 'Farklı arama terimleri deneyin' 
                  : 'İlk ortakı oluşturmak için butona tıklayın'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium"
                >
                  ➕ İlk Ortak Oluştur
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Yeni Üye Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Yeni Ortak Oluştur</h3>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ad *
                    </label>
                    <input
                      type="text"
                      required
                      value={newUser.first_name}
                      onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Adınız"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Soyad *
                    </label>
                    <input
                      type="text"
                      required
                      value={newUser.last_name}
                      onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Soyadınız"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-posta *
                  </label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ornek@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon Numarası
                  </label>
                  <input
                    type="tel"
                    value={newUser.phone_number}
                    onChange={(e) => setNewUser({...newUser, phone_number: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0555 123 45 67"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meslek
                  </label>
                  <input
                    type="text"
                    value={newUser.profession}
                    onChange={(e) => setNewUser({...newUser, profession: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Örn: Öğretmen, Mühendis"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol
                  </label>
                    <select
                     value={newUser.role}
                     onChange={(e) => setNewUser({...newUser, role: e.target.value as 'member' | 'admin'})}
                     className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   >
                    <option value="member">Üye</option>
                    <option value="admin">Yönetici</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Şifre *
                  </label>
                  <input
                    type="password"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Güvenli bir şifre"
                    minLength={6}
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300"
                  >
                    Oluştur
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Üye Düzenle Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Ortak Düzenle</h3>
              
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ad *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.first_name}
                      onChange={(e) => setEditFormData({...editFormData, first_name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Adınız"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Soyad *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.last_name}
                      onChange={(e) => setEditFormData({...editFormData, last_name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Soyadınız"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-posta *
                  </label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ornek@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon Numarası
                  </label>
                  <input
                    type="tel"
                    value={editFormData.phone_number}
                    onChange={(e) => setEditFormData({...editFormData, phone_number: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0555 123 45 67"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meslek
                  </label>
                  <input
                    type="text"
                    value={editFormData.profession}
                    onChange={(e) => setEditFormData({...editFormData, profession: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Örn: Öğretmen, Mühendis"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol
                  </label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({...editFormData, role: e.target.value as 'member' | 'admin'})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="member">Üye</option>
                    <option value="admin">Yönetici</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={editFormData.is_active}
                    onChange={(e) => setEditFormData({...editFormData, is_active: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Aktif Ortak
                  </label>
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
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300"
                  >
                    Güncelle
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Excel İmport Modal */}
      {showExcelImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Excel ile Ortak İmport</h3>
                <button
                  onClick={resetExcelModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {!importProgress.isImporting && importProgress.success === 0 && importProgress.failed === 0 && (
                <div className="space-y-6">
                  {/* Açıklama */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start">
                      <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-2">Excel dosyası formatı:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>CSV veya Excel (.xlsx) formatında olmalı</li>
                          <li>İlk satır: ad, soyad, email, telefon, meslek, rol, sifre</li>
                          <li>Email adresleri benzersiz olmalı</li>
                          <li>Rol: "member" veya "admin" olmalı</li>
                          <li>Şifre minimum 6 karakter olmalı</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Template İndir */}
                  <div className="flex justify-center">
                    <button
                      onClick={downloadExcelTemplate}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                    >
                      <DocumentArrowDownIcon className="w-5 h-5" />
                      Template Dosyasını İndir
                    </button>
                  </div>

                  {/* Dosya Seçimi */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Excel Dosyası Seçin
                    </label>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {excelFile && (
                      <p className="text-sm text-green-600 mt-2">
                        Seçilen dosya: {excelFile.name}
                      </p>
                    )}
                  </div>

                  {/* İmport Butonu */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={resetExcelModal}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleExcelImport}
                      disabled={!excelFile}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 disabled:cursor-not-allowed"
                    >
                      İmport Başlat
                    </button>
                  </div>
                </div>
              )}

              {/* İmport İşlemi Devam Ediyor */}
              {importProgress.isImporting && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Excel dosyası işleniyor...</p>
                  <p className="text-sm text-gray-500 mt-2">Lütfen bekleyin</p>
                </div>
              )}

              {/* İmport Sonuçları */}
              {!importProgress.isImporting && (importProgress.success > 0 || importProgress.failed > 0) && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">İmport Sonuçları</h4>
                  
                  {/* Başarı İstatistikleri */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{importProgress.success}</p>
                        <p className="text-sm text-green-800">Başarılı</p>
                      </div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{importProgress.failed}</p>
                        <p className="text-sm text-red-800">Başarısız</p>
                      </div>
                    </div>
                  </div>

                  {/* Hata Listesi */}
                  {importProgress.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <h5 className="font-medium text-red-800 mb-2">Hatalar:</h5>
                      <ul className="text-sm text-red-700 space-y-1">
                        {importProgress.errors.map((error, index) => (
                          <li key={index} className="flex items-start">
                            <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-center pt-4">
                    <button
                      onClick={resetExcelModal}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300"
                    >
                      Tamam
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 