'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { tokenManager, authAPI } from '@/lib/api';
import { User } from '@/types';
import {
  EnvelopeIcon,
  CalendarDaysIcon,
  StarIcon,
  CheckIcon,
  PencilIcon,
  XMarkIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  HomeIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function MemberProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    profession: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Şifre değiştirme state'leri
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    const userData = tokenManager.getUser();
    if (userData) {
      setUser(userData);
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        phone_number: userData.phone_number || '',
        profession: userData.profession || ''
      });
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await authAPI.updateUser(user.id, formData);

      if (response.success) {
        const updatedUser = { ...user, ...formData };
        tokenManager.setToken(tokenManager.getToken()!, updatedUser);
        setUser(updatedUser);
        setEditMode(false);
        setSuccess('Profil bilgileriniz başarıyla güncellendi');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      setError(error.response?.data?.message || 'Profil güncellenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_number: user.phone_number || '',
        profession: user.profession || ''
      });
    }
    setEditMode(false);
    setError(null);
    setSuccess(null);
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setPasswordLoading(true);
      setPasswordError(null);
      setPasswordSuccess(null);

      const response = await authAPI.changePassword(passwordData);

      if (response.success) {
        setPasswordSuccess('Şifreniz başarıyla değiştirildi!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess(null);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Change password error:', error);
      setPasswordError(error.response?.data?.message || 'Şifre değiştirilemedi');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordModal(false);
    setPasswordError(null);
    setPasswordSuccess(null);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/(?=.*[a-z])/.test(password)) strength++;
    if (/(?=.*[A-Z])/.test(password)) strength++;
    if (/(?=.*\d)/.test(password)) strength++;
    if (/(?=.*[@$!%*?&])/.test(password)) strength++;

    if (strength <= 2) return { level: 'Zayıf', color: 'red', width: '33%' };
    if (strength <= 3) return { level: 'Orta', color: 'yellow', width: '66%' };
    return { level: 'Güçlü', color: 'green', width: '100%' };
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  if (!user) {
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

      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Profil Bilgilerim</h2>
        <p className="mt-2 text-gray-600">
          Kişisel bilgilerinizi buradan görüntüleyebilir ve güncelleyebilirsiniz.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profil Kartı */}
        <div className="lg:col-span-1">
          <div className="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 overflow-hidden">
            <div className="px-6 py-8 bg-gradient-to-r from-green-500 to-emerald-500 text-center">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-3xl">
                  {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white">
                {user.first_name} {user.last_name}
              </h3>
              <p className="text-green-100 mt-1">Kooperatif Üyesi</p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <EnvelopeIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <CalendarDaysIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Üyelik Tarihi</p>
                    <p className="font-medium text-gray-900">
                      {new Date(user.created_at).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <StarIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Durum</p>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <CheckIcon className="w-4 h-4 mr-1" />
                      Aktif Üye
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bilgi Formu */}
        <div className="lg:col-span-2">
          <div className="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Kişisel Bilgiler
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Profil bilgilerinizi güncelleyebilirsiniz
                  </p>
                </div>
                {!editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center gap-1"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Düzenle
                  </button>
                )}
              </div>
            </div>

            <div className="p-8">
              {editMode ? (
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                        Ad *
                      </label>
                      <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Adınızı girin"
                      />
                    </div>

                    <div>
                      <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                        Soyad *
                      </label>
                      <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Soyadınızı girin"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon Numarası
                    </label>
                    <input
                      type="tel"
                      id="phone_number"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Telefon numaranızı girin"
                    />
                  </div>

                  <div>
                    <label htmlFor="profession" className="block text-sm font-medium text-gray-700 mb-2">
                      Meslek
                    </label>
                    <input
                      type="text"
                      id="profession"
                      name="profession"
                      value={formData.profession}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Mesleğinizi girin"
                    />
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                          Güncelleniyor...
                        </>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <CheckIcon className="w-4 h-4" />
                          Kaydet
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={loading}
                      className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <XMarkIcon className="w-4 h-4" />
                        İptal
                      </span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        Ad
                      </label>
                      <div className="bg-gray-50 px-4 py-3 rounded-xl">
                        <p className="font-medium text-gray-900">{user.first_name}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        Soyad
                      </label>
                      <div className="bg-gray-50 px-4 py-3 rounded-xl">
                        <p className="font-medium text-gray-900">{user.last_name}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">
                      Email Adresi
                    </label>
                    <div className="bg-gray-50 px-4 py-3 rounded-xl">
                      <p className="font-medium text-gray-900">{user.email}</p>
                      <p className="text-xs text-gray-500 mt-1">Email adresi değiştirilemez</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">
                      Telefon Numarası
                    </label>
                    <div className="bg-gray-50 px-4 py-3 rounded-xl">
                      <p className="font-medium text-gray-900">
                        {user.phone_number || 'Belirtilmemiş'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">
                      Meslek
                    </label>
                    <div className="bg-gray-50 px-4 py-3 rounded-xl">
                      <p className="font-medium text-gray-900">
                        {user.profession || 'Belirtilmemiş'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alt Bilgiler */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <StarIcon className="w-5 h-5 text-emerald-800" />
            Hesap İstatistikleri
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Üyelik süresi:</span>
              <span className="font-semibold">
                {Math.ceil((new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))} gün
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Hesap durumu:</span>
              <span className="text-green-600 font-semibold flex items-center gap-1">
                <CheckIcon className="w-4 h-4" />
                Aktif
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Kullanıcı ID:</span>
              <span className="font-semibold">#{user.id}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <LockClosedIcon className="w-5 h-5 text-blue-800" />
            Hesap İşlemleri
          </h3>
          <div className="space-y-4">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center justify-center w-full bg-orange-100 text-orange-700 px-4 py-3 rounded-xl font-medium hover:bg-orange-200 transition-colors"
            >
              <KeyIcon className="w-5 h-5 mr-2" />
              Şifre Değiştir
            </button>
            <a
              href="/member/commissions"
              className="flex items-center justify-center w-full bg-blue-100 text-blue-700 px-4 py-3 rounded-xl font-medium hover:bg-blue-200 transition-colors"
            >
              <ClipboardDocumentListIcon className="w-5 h-5 mr-2" />
              Komisyonlarım
            </a>
            <a
              href="/member/join"
              className="flex items-center justify-center w-full bg-green-100 text-green-700 px-4 py-3 rounded-xl font-medium hover:bg-green-200 transition-colors"
            >
              <DocumentTextIcon className="w-5 h-5 mr-2" />
              Komisyonlara Başvur
            </a>
            <a
              href="/member"
              className="flex items-center justify-center w-full bg-purple-100 text-purple-700 px-4 py-3 rounded-xl font-medium hover:bg-purple-200 transition-colors"
            >
              <HomeIcon className="w-5 h-5 mr-2" />
              Ana Sayfa
            </a>
          </div>
        </div>
      </div>

      {/* Şifre Değiştirme Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <KeyIcon className="w-6 h-6" />
                    Şifre Değiştir
                  </h3>
                  <p className="text-orange-100">Güvenliğiniz için güçlü bir şifre seçin</p>
                </div>
                <button
                  onClick={handleCancelPasswordChange}
                  className="text-white hover:text-orange-200 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8">
              {passwordError && (
                <div className="mb-6 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="mb-6 bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <CheckIcon className="w-5 h-5" />
                  {passwordSuccess}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-6">
                {/* Mevcut Şifre */}
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Mevcut Şifre *
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordInputChange}
                      required
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Mevcut şifrenizi girin"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Yeni Şifre */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Yeni Şifre *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordInputChange}
                      required
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Yeni şifrenizi girin"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  
                  {/* Şifre Güç Göstergesi */}
                  {passwordData.newPassword && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Şifre Gücü:</span>
                        <span className={`font-medium ${
                          passwordStrength.color === 'red' ? 'text-red-600' :
                          passwordStrength.color === 'yellow' ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {passwordStrength.level}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength.color === 'red' ? 'bg-red-500' :
                            passwordStrength.color === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: passwordStrength.width }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Yeni Şifre Onayı */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Yeni Şifre Onayı *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordInputChange}
                      required
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Yeni şifrenizi tekrar girin"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">Şifreler eşleşmiyor</p>
                  )}
                </div>

                {/* Şifre Gereksinimleri */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Şifre Gereksinimleri:</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li className={`flex items-center gap-1 ${passwordData.newPassword.length >= 8 ? 'text-green-600' : ''}`}>
                      <CheckIcon className={`w-3 h-3 ${passwordData.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}`} />
                      En az 8 karakter
                    </li>
                    <li className={`flex items-center gap-1 ${/(?=.*[a-z])/.test(passwordData.newPassword) ? 'text-green-600' : ''}`}>
                      <CheckIcon className={`w-3 h-3 ${/(?=.*[a-z])/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                      En az bir küçük harf (a-z)
                    </li>
                    <li className={`flex items-center gap-1 ${/(?=.*[A-Z])/.test(passwordData.newPassword) ? 'text-green-600' : ''}`}>
                      <CheckIcon className={`w-3 h-3 ${/(?=.*[A-Z])/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                      En az bir büyük harf (A-Z)
                    </li>
                    <li className={`flex items-center gap-1 ${/(?=.*\d)/.test(passwordData.newPassword) ? 'text-green-600' : ''}`}>
                      <CheckIcon className={`w-3 h-3 ${/(?=.*\d)/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                      En az bir rakam (0-9)
                    </li>
                    <li className={`flex items-center gap-1 ${/(?=.*[@$!%*?&])/.test(passwordData.newPassword) ? 'text-green-600' : ''}`}>
                      <CheckIcon className={`w-3 h-3 ${/(?=.*[@$!%*?&])/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                      En az bir özel karakter (@$!%*?&)
                    </li>
                  </ul>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    disabled={passwordLoading || passwordData.newPassword !== passwordData.confirmPassword}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {passwordLoading ? (
                      <>
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                        Değiştiriliyor...
                      </>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <KeyIcon className="w-4 h-4" />
                        Şifreyi Değiştir
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelPasswordChange}
                    disabled={passwordLoading}
                    className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <XMarkIcon className="w-4 h-4" />
                      İptal
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}