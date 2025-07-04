'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { dashboardAPI } from '@/lib/api';
import {
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ClockIcon,
  SparklesIcon,
  RocketLaunchIcon,
  ArrowRightIcon,
  ArrowTrendingUpIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  BoltIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalUsers: number;
  activeCommissions: number;
  monthlyActivities: number;
  pendingApplications: number;
  usersByRole: {
    admin: number;
    member: number;
  };
  commissionsData: Array<{
    id: number;
    name: string;
    members: number;
    max: number;
  }>;
  recentActivities: Array<{
    type: string;
    description: string;
    date: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadDashboardStats();
    
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getStats();
      
      if (response.success) {
        setStats(response.data);
      } else {
        setError(response.message || 'Veriler yüklenemedi');
      }
    } catch (error: any) {
      console.error('Dashboard stats error:', error);
      setError('Dashboard verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 mx-auto"></div>
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-600 absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <p className="mt-6 text-lg font-semibold text-gray-700">Dashboard Yükleniyor...</p>
          <p className="text-sm text-gray-500 mt-2">Veriler hazırlanıyor</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExclamationCircleIcon className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-red-800 mb-2">Bir Hata Oluştu</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button 
            onClick={loadDashboardStats}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center mx-auto"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_created':
        return <UserGroupIcon className="w-4 h-4 text-gray-600" />;
      case 'commission_created':
        return <ClipboardDocumentListIcon className="w-4 h-4 text-gray-600" />;
      default:
        return <CheckCircleIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl md:rounded-2xl lg:rounded-3xl p-4 md:p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 bg-white bg-opacity-10 rounded-full -mr-8 -mt-8 md:-mr-12 md:-mt-12 lg:-mr-16 lg:-mt-16"></div>
        <div className="absolute bottom-0 left-0 w-12 h-12 md:w-16 md:h-16 lg:w-24 lg:h-24 bg-white bg-opacity-10 rounded-full -ml-6 -mb-6 md:-ml-8 md:-mb-8 lg:-ml-12 lg:-mb-12"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col space-y-3 md:space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div>
              <div className="flex items-center mb-2">
                <SparklesIcon className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 mr-2 md:mr-3 text-white" />
                <h1 className="text-xl md:text-2xl lg:text-4xl font-bold">
                  Hoş Geldiniz, Yönetici!
                </h1>
              </div>
              <p className="text-blue-100 text-sm md:text-base lg:text-lg">
                Bugün kooperatifimizde harika şeyler yapacağız
              </p>
            </div>
            <div className="text-left lg:text-right">
              <div className="text-lg md:text-xl lg:text-2xl font-bold">{formatTime(currentTime)}</div>
              <div className="text-blue-100 text-xs md:text-sm">{formatDate(currentTime)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg md:rounded-xl lg:rounded-2xl p-3 md:p-4 lg:p-6 text-white relative overflow-hidden group hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl">
          <div className="absolute top-0 right-0 w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white bg-opacity-10 rounded-full -mr-6 -mt-6 md:-mr-8 md:-mt-8 lg:-mr-10 lg:-mt-10 group-hover:scale-110 transition-transform duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2 md:mb-3 lg:mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 lg:w-14 lg:h-14 bg-white bg-opacity-20 rounded-lg md:rounded-xl lg:rounded-2xl flex items-center justify-center">
                <UserGroupIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-7 lg:h-7 text-blue-800" />
              </div>
              <div className="text-blue-100 text-xs lg:text-sm font-medium">+12%</div>
            </div>
            <div className="text-xl md:text-2xl lg:text-3xl font-bold mb-1">{stats.totalUsers}</div>
                            <div className="text-blue-100 text-xs md:text-sm">Toplam Ortak</div>
            <div className="text-xs text-blue-200 mt-1 md:mt-2">
                              {stats.usersByRole.admin} yönetici • {stats.usersByRole.member} ortak
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg md:rounded-xl lg:rounded-2xl p-3 md:p-4 lg:p-6 text-white relative overflow-hidden group hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl">
          <div className="absolute top-0 right-0 w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white bg-opacity-10 rounded-full -mr-6 -mt-6 md:-mr-8 md:-mt-8 lg:-mr-10 lg:-mt-10 group-hover:scale-110 transition-transform duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2 md:mb-3 lg:mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 lg:w-14 lg:h-14 bg-white bg-opacity-20 rounded-lg md:rounded-xl lg:rounded-2xl flex items-center justify-center">
                <ClipboardDocumentListIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-7 lg:h-7 text-emerald-800" />
              </div>
              <div className="text-emerald-100 text-xs lg:text-sm font-medium">+8%</div>
            </div>
            <div className="text-xl md:text-2xl lg:text-3xl font-bold mb-1">{stats.activeCommissions}</div>
            <div className="text-emerald-100 text-xs md:text-sm">Aktif Komisyon</div>
            <div className="text-xs text-emerald-200 mt-1 md:mt-2">Tümü çalışır durumda</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg md:rounded-xl lg:rounded-2xl p-3 md:p-4 lg:p-6 text-white relative overflow-hidden group hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl">
          <div className="absolute top-0 right-0 w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white bg-opacity-10 rounded-full -mr-6 -mt-6 md:-mr-8 md:-mt-8 lg:-mr-10 lg:-mt-10 group-hover:scale-110 transition-transform duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2 md:mb-3 lg:mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 lg:w-14 lg:h-14 bg-white bg-opacity-20 rounded-lg md:rounded-xl lg:rounded-2xl flex items-center justify-center">
                <BoltIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-7 lg:h-7 text-orange-800" />
              </div>
              <div className="text-orange-100 text-xs lg:text-sm font-medium">Bu ay</div>
            </div>
            <div className="text-xl md:text-2xl lg:text-3xl font-bold mb-1">{stats.monthlyActivities}</div>
            <div className="text-orange-100 text-xs md:text-sm">Aylık Faaliyet</div>
            <div className="text-xs text-orange-200 mt-1 md:mt-2">Geçen aya göre artış</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg md:rounded-xl lg:rounded-2xl p-3 md:p-4 lg:p-6 text-white relative overflow-hidden group hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl">
          <div className="absolute top-0 right-0 w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white bg-opacity-10 rounded-full -mr-6 -mt-6 md:-mr-8 md:-mt-8 lg:-mr-10 lg:-mt-10 group-hover:scale-110 transition-transform duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2 md:mb-3 lg:mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 lg:w-14 lg:h-14 bg-white bg-opacity-20 rounded-lg md:rounded-xl lg:rounded-2xl flex items-center justify-center">
                <ClockIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-7 lg:h-7 text-purple-800" />
              </div>
              <div className="text-purple-100 text-xs lg:text-sm font-medium">Acil</div>
            </div>
            <div className="text-xl md:text-2xl lg:text-3xl font-bold mb-1">{stats.pendingApplications}</div>
            <div className="text-purple-100 text-xs md:text-sm">Bekleyen Başvuru</div>
            <div className="text-xs text-purple-200 mt-1 md:mt-2">İnceleme bekliyor</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
        
        {/* Quick Actions */}
        <div className="xl:col-span-2">
          <div className="bg-white/70 backdrop-blur-lg rounded-lg md:rounded-xl lg:rounded-2xl shadow-xl border border-white/20 p-4 md:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 space-y-2 sm:space-y-0">
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 flex items-center">
                <RocketLaunchIcon className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 mr-2 md:mr-3 text-gray-700" />
                Hızlı Aksiyonlar
              </h2>
              <div className="text-xs md:text-sm text-gray-500">Sık kullanılan işlemler</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 lg:gap-6">
              <Link href="/admin/users" className="group">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg md:rounded-xl lg:rounded-2xl p-3 md:p-4 lg:p-6 border border-blue-100 hover:border-blue-200 transition-all duration-300 hover:shadow-lg group-hover:scale-105">
                  <div className="flex items-center mb-3 md:mb-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <UserGroupIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <div className="ml-3 md:ml-4 flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate text-sm md:text-base">Ortak Yönetimi</h3>
                      <p className="text-xs md:text-sm text-gray-600 truncate">{stats.totalUsers} aktif ortak</p>
                    </div>
                  </div>
                  <div className="flex items-center text-blue-600 font-medium text-xs md:text-sm">
                    <span>Yönetim paneline git</span>
                    <ArrowRightIcon className="w-3 h-3 md:w-4 md:h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300 text-blue-600" />
                  </div>
                </div>
              </Link>

              <Link href="/admin/commissions" className="group">
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg md:rounded-xl lg:rounded-2xl p-3 md:p-4 lg:p-6 border border-emerald-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-lg group-hover:scale-105">
                  <div className="flex items-center mb-3 md:mb-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <ClipboardDocumentListIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <div className="ml-3 md:ml-4 flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate text-sm md:text-base">Komisyon Yönetimi</h3>
                      <p className="text-xs md:text-sm text-gray-600 truncate">{stats.activeCommissions} aktif komisyon</p>
                    </div>
                  </div>
                  <div className="flex items-center text-emerald-600 font-medium text-xs md:text-sm">
                    <span>Komisyonları yönet</span>
                    <ArrowRightIcon className="w-3 h-3 md:w-4 md:h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300 text-emerald-600" />
                  </div>
                </div>
              </Link>

              <Link href="/admin/fees" className="group">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg md:rounded-xl lg:rounded-2xl p-3 md:p-4 lg:p-6 border border-orange-100 hover:border-orange-200 transition-all duration-300 hover:shadow-lg group-hover:scale-105">
                  <div className="flex items-center mb-3 md:mb-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <CurrencyDollarIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <div className="ml-3 md:ml-4 flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate text-sm md:text-base">Aidat Yönetimi</h3>
                      <p className="text-xs md:text-sm text-gray-600 truncate">Ödemeler ve planlar</p>
                    </div>
                  </div>
                  <div className="flex items-center text-orange-600 font-medium text-xs md:text-sm">
                    <span>Aidatları yönet</span>
                    <ArrowRightIcon className="w-3 h-3 md:w-4 md:h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300 text-orange-600" />
                  </div>
                </div>
              </Link>

              <Link href="/admin/reports" className="group">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg md:rounded-xl lg:rounded-2xl p-3 md:p-4 lg:p-6 border border-purple-100 hover:border-purple-200 transition-all duration-300 hover:shadow-lg group-hover:scale-105">
                  <div className="flex items-center mb-3 md:mb-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <ChartBarIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <div className="ml-3 md:ml-4 flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate text-sm md:text-base">Raporlar</h3>
                      <p className="text-xs md:text-sm text-gray-600 truncate">Analiz ve istatistikler</p>
                    </div>
                  </div>
                  <div className="flex items-center text-purple-600 font-medium text-xs md:text-sm">
                    <span>Raporları görüntüle</span>
                    <ArrowRightIcon className="w-3 h-3 md:w-4 md:h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300 text-purple-600" />
                  </div>
                </div>
              </Link>

              <Link href="/admin/documents" className="group">
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg md:rounded-xl lg:rounded-2xl p-3 md:p-4 lg:p-6 border border-indigo-100 hover:border-indigo-200 transition-all duration-300 hover:shadow-lg group-hover:scale-105">
                  <div className="flex items-center mb-3 md:mb-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <DocumentTextIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <div className="ml-3 md:ml-4 flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate text-sm md:text-base">Belge Yönetimi</h3>
                      <p className="text-xs md:text-sm text-gray-600 truncate">PDF belgelerini yönet</p>
                    </div>
                  </div>
                  <div className="flex items-center text-indigo-600 font-medium text-xs md:text-sm">
                    <span>Belgeleri yönet</span>
                    <ArrowRightIcon className="w-3 h-3 md:w-4 md:h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300 text-indigo-600" />
                  </div>
                </div>
              </Link>

              <Link href="/admin/calendar" className="group">
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg md:rounded-xl lg:rounded-2xl p-3 md:p-4 lg:p-6 border border-teal-100 hover:border-teal-200 transition-all duration-300 hover:shadow-lg group-hover:scale-105">
                  <div className="flex items-center mb-3 md:mb-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <CalendarIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <div className="ml-3 md:ml-4 flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate text-sm md:text-base">Takvim Yönetimi</h3>
                      <p className="text-xs md:text-sm text-gray-600 truncate">Etkinlik ve duyuruları yönet</p>
                    </div>
                  </div>
                  <div className="flex items-center text-teal-600 font-medium text-xs md:text-sm">
                    <span>Takvimi yönet</span>
                    <ArrowRightIcon className="w-3 h-3 md:w-4 md:h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300 text-teal-600" />
                  </div>
                </div>
              </Link>

              <Link href="/admin/mail" className="group">
                <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg md:rounded-xl lg:rounded-2xl p-3 md:p-4 lg:p-6 border border-rose-100 hover:border-rose-200 transition-all duration-300 hover:shadow-lg group-hover:scale-105">
                  <div className="flex items-center mb-3 md:mb-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-rose-500 to-pink-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <EnvelopeIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <div className="ml-3 md:ml-4 flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate text-sm md:text-base">Mail Sistemi</h3>
                      <p className="text-xs md:text-sm text-gray-600 truncate">Duyuru ve hatırlatmalar</p>
                    </div>
                  </div>
                  <div className="flex items-center text-rose-600 font-medium text-xs md:text-sm">
                    <span>Mail gönder</span>
                    <ArrowRightIcon className="w-3 h-3 md:w-4 md:h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300 text-rose-600" />
                  </div>
                </div>
              </Link>

              <Link href="/admin/daily-messages" className="group">
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg md:rounded-xl lg:rounded-2xl p-3 md:p-4 lg:p-6 border border-emerald-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-lg group-hover:scale-105">
                  <div className="flex items-center mb-3 md:mb-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <ChatBubbleLeftRightIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <div className="ml-3 md:ml-4 flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate text-sm md:text-base">Günlük Mesajlar</h3>
                      <p className="text-xs md:text-sm text-gray-600 truncate">Anasayfa mesajlarını yönet</p>
                    </div>
                  </div>
                  <div className="flex items-center text-emerald-600 font-medium text-xs md:text-sm">
                    <span>Mesajları düzenle</span>
                    <ArrowRightIcon className="w-3 h-3 md:w-4 md:h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300 text-emerald-600" />
                  </div>
                </div>
              </Link>

              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg md:rounded-xl lg:rounded-2xl p-3 md:p-4 lg:p-6 border border-orange-100">
                <div className="flex items-center mb-3 md:mb-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg">
                    <BoltIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <div className="ml-3 md:ml-4 flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate text-sm md:text-base">Hızlı İşlemler</h3>
                    <p className="text-xs md:text-sm text-gray-600 truncate">Günlük görevler</p>
                  </div>
                </div>
                <div className="space-y-1 md:space-y-2">
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Bekleyen onaylar</span>
                    <span className="font-semibold text-orange-600">{stats.pendingApplications}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Bu ay toplam aktivite</span>
                    <span className="font-semibold text-orange-600">{stats.monthlyActivities}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities & Commission Status */}
        <div className="space-y-4 md:space-y-6">
          
          {/* Recent Activities */}
          <div className="bg-white/70 backdrop-blur-lg rounded-lg md:rounded-xl lg:rounded-2xl shadow-xl border border-white/20 p-3 md:p-4 lg:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4 lg:mb-6">
              <h3 className="text-base md:text-lg lg:text-xl font-bold text-gray-900 flex items-center">
                <ArrowTrendingUpIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 mr-2 text-gray-700" />
                Son Aktiviteler
              </h3>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            
            <div className="space-y-2 md:space-y-3 lg:space-y-4 max-h-48 md:max-h-60 lg:max-h-80 overflow-y-auto">
              {stats.recentActivities.length > 0 ? (
                stats.recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-2 md:space-x-3 p-2 md:p-3 rounded-lg md:rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors duration-200">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm flex-shrink-0"
                         style={{
                           backgroundColor: activity.type === 'user_created' ? '#EBF8FF' : 
                                          activity.type === 'commission_created' ? '#F0FDF4' : '#FEF3F2',
                           color: activity.type === 'user_created' ? '#3B82F6' : 
                                 activity.type === 'commission_created' ? '#10B981' : '#EF4444'
                         }}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-medium text-gray-900 truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.date).toLocaleDateString('tr-TR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 md:py-6 lg:py-8">
                  <div className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                    <ClipboardDocumentListIcon className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium text-sm md:text-base">Henüz aktivite yok</p>
                  <p className="text-xs md:text-sm text-gray-400 mt-1">İşlemler burada görünecek</p>
                </div>
              )}
            </div>
          </div>

          {/* Commission Overview */}
          <div className="bg-white/70 backdrop-blur-lg rounded-lg md:rounded-xl lg:rounded-2xl shadow-xl border border-white/20 p-3 md:p-4 lg:p-6">
            <h3 className="text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-3 md:mb-4 lg:mb-6 flex items-center">
              <ChartBarIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 mr-2 text-gray-700" />
              Komisyon Durumu
            </h3>
            
            <div className="space-y-4">
              {stats.commissionsData.length > 0 ? (
                stats.commissionsData.slice(0, 4).map((commission) => (
                  <div key={commission.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900 truncate">{commission.name}</span>
                      <span className="text-gray-600 flex-shrink-0 ml-2">
                        {commission.members}/{commission.max}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(commission.members / commission.max) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <ClipboardDocumentListIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 mt-2">Komisyon bilgisi yok</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
} 