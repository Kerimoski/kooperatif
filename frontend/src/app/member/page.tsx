'use client';

import { useEffect, useState } from 'react';
import { memberAPI, tokenManager } from '@/lib/api';
import Link from 'next/link';
import {
  UserGroupIcon,
  ClipboardDocumentListIcon,
  StarIcon,
  DocumentTextIcon,
  UserIcon,
  ChartBarIcon,
  ArrowRightIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  SunIcon,
  MoonIcon,
  ClockIcon,
  XMarkIcon,
  CheckIcon,
  CalendarIcon,
  MapPinIcon,
  BellIcon,
  BookOpenIcon,
  CurrencyDollarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';


interface MemberDashboardData {
  commissions: any[];
  stats: {
    total_commissions: number;
    available_commissions: number;
    active_memberships: number;
    total_members: number;
  };
  recentActivities: any[];
  upcomingEvents: any[];
  dailyMessages: Array<{
    id: number;
    message: string;
    display_order: number;
  }>;
}

interface Document {
  id: number;
  title: string;
  file_name: string;
  file_path: string;
  category: string;
  uploaded_at: string;
  file_size: number;
}

function RecentDocumentsCard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/documents`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDocuments(data.data.slice(0, 3)); // Sadece 3 belge göster
        }
      }
    } catch (error) {
      console.error('Belgeler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const openDocument = async (document: Document) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/documents/file/${document.file_name}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        // URL'yi temizle (memory leak önleme)
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else {
        const errorData = await response.json();
        console.error('Belge açma hatası:', errorData);
        alert('Belge açılamadı: ' + (errorData.message || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Belge açma hatası:', error);
      alert('Belge açılırken hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg md:rounded-xl lg:rounded-2xl p-3 md:p-4 lg:p-6 text-white relative overflow-hidden group hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl">
        <div className="absolute top-0 right-0 w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white bg-opacity-10 rounded-full -mr-6 -mt-6 md:-mr-8 md:-mt-8 lg:-mr-10 lg:-mt-10 group-hover:scale-110 transition-transform duration-300"></div>
        <div className="relative z-10 flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  const handleCardClick = () => {
    if (documents.length > 0) {
      // İlk belgeyi aç
      openDocument(documents[0]);
    } else {
      // Belgeler sayfasına git
      window.location.href = '/member/documents';
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg md:rounded-xl lg:rounded-2xl p-3 md:p-4 lg:p-6 text-white relative overflow-hidden group hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl cursor-pointer"
    >
      <div className="absolute top-0 right-0 w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white bg-opacity-10 rounded-full -mr-6 -mt-6 md:-mr-8 md:-mt-8 lg:-mr-10 lg:-mt-10 group-hover:scale-110 transition-transform duration-300"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2 md:mb-3 lg:mb-4">
          <div className="w-8 h-8 md:w-10 md:h-10 lg:w-14 lg:h-14 bg-white bg-opacity-20 rounded-lg md:rounded-xl lg:rounded-2xl flex items-center justify-center">
            <DocumentTextIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-7 lg:h-7 text-red-800" />
          </div>
          <div className="text-red-100 text-xs lg:text-sm font-medium">Belgeler</div>
        </div>
        <div className="text-xl md:text-2xl lg:text-3xl font-bold mb-1">{documents.length}</div>
        <div className="text-red-100 text-xs md:text-sm">Son Eklenenler</div>
        {documents.length > 0 && (
          <div className="text-xs text-red-200 mt-1 md:mt-2 truncate">
            Son: {documents[0].title}
          </div>
        )}
        {documents.length === 0 && (
          <div className="text-xs text-red-200 mt-1 md:mt-2">
            Henüz belge yok
          </div>
        )}
      </div>
      
    </div>
  );
}



function SidebarDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/documents`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDocuments(data.data.slice(0, 4)); // En son 4 belge
        }
      }
    } catch (error) {
      console.error('Belgeler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const openDocument = async (document: Document) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/documents/file/${document.file_name}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        // URL'yi temizle (memory leak önleme)
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else {
        const errorData = await response.json();
        console.error('Belge açma hatası:', errorData);
        alert('Belge açılamadı: ' + (errorData.message || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Belge açma hatası:', error);
      alert('Belge açılırken hata oluştu');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short'
    });
  };

  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-lg rounded-xl lg:rounded-2xl shadow-xl border border-white/20 p-4 lg:p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-3 text-gray-600">Belgeler yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-lg rounded-xl lg:rounded-2xl shadow-xl border border-white/20 p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <h3 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center">
          <DocumentTextIcon className="w-5 h-5 lg:w-6 lg:h-6 mr-2 text-red-600" />
          Son Belgeler
        </h3>
        <Link
          href="/member/documents"
          className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
        >
          Tümü
        </Link>
      </div>
      
      {documents.length === 0 ? (
        <div className="text-center py-6 lg:py-8">
          <div className="w-12 h-12 lg:w-16 lg:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DocumentTextIcon className="w-6 h-6 lg:w-8 lg:h-8 text-red-500" />
          </div>
          <p className="text-gray-500 font-medium">Henüz belge yok</p>
          <p className="text-sm text-gray-400 mt-1">Belgeler burada görünecek</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((document) => (
            <div 
              key={document.id}
              onClick={() => openDocument(document)}
              className="flex items-center space-x-3 p-3 rounded-xl bg-red-50/50 hover:bg-red-100/50 transition-all duration-200 cursor-pointer group"
            >
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <DocumentTextIcon className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-red-600 transition-colors duration-300">
                  {document.title}
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                  <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-md font-medium">
                    {document.category}
                  </span>
                  <span>{formatDate(document.uploaded_at)}</span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-red-600 transition-colors duration-300" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



function MemberDashboard() {
  const [dashboardData, setDashboardData] = useState<MemberDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<any>(null);
  const [pendingApplications, setPendingApplications] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    // Load user data from token
    const userData = tokenManager.getUser();
    if (userData) {
      setUser(userData);
    }
    
    loadDashboardData();
    
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Günlük mesajları 10 saniyede bir değiştir
  useEffect(() => {
    console.log('Message rotation useEffect triggered:', {
      hasMessages: !!dashboardData?.dailyMessages,
      messageCount: dashboardData?.dailyMessages?.length,
      shouldStartTimer: dashboardData?.dailyMessages && dashboardData.dailyMessages.length > 1
    });
    
    if (dashboardData?.dailyMessages && dashboardData.dailyMessages.length > 1) {
      console.log('Starting message rotation timer');
      const messageTimer = setInterval(() => {
        setCurrentMessageIndex((prevIndex) => {
          const newIndex = (prevIndex + 1) % dashboardData.dailyMessages.length;
          console.log('Message index changed:', prevIndex, '->', newIndex);
          return newIndex;
        });
      }, 10000); // 10 saniye

      return () => {
        console.log('Clearing message rotation timer');
        clearInterval(messageTimer);
      };
    }
  }, [dashboardData?.dailyMessages]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Loading dashboard data...');
      const response = await memberAPI.getDashboard();
      console.log('Dashboard API response:', response);

      if (response.success) {
        console.log('Setting dashboard data:', response.data);
        console.log('Daily messages in response:', response.data.dailyMessages);
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Dashboard data load error:', error);
      setError('Dashboard verileri yüklenemedi');
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
          loadDashboardData();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-green-200 mx-auto"></div>
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-green-600 absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <p className="mt-6 text-lg font-semibold text-gray-700">Bilgileriniz Yükleniyor...</p>
          <p className="text-sm text-gray-500 mt-2">Komisyon verileriniz hazırlanıyor</p>
        </div>
      </div>
    );
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

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return { text: "Günaydın", icon: SunIcon };
    if (hour < 18) return { text: "İyi günler", icon: SunIcon };
    return { text: "İyi akşamlar", icon: MoonIcon };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  const getCurrentMessage = () => {
    try {
      console.log('getCurrentMessage called:', {
        dashboardData: dashboardData?.dailyMessages,
        currentMessageIndex,
        messagesLength: dashboardData?.dailyMessages?.length
      });
      
      if (!dashboardData?.dailyMessages || dashboardData.dailyMessages.length === 0) {
        console.log('No daily messages found, using default message');
        return "Bugün hangi komisyon faaliyetlerinde yer alacaksınız?";
      }
      
      const currentMessage = dashboardData.dailyMessages[currentMessageIndex]?.message || "Bugün hangi komisyon faaliyetlerinde yer alacaksınız?";
      console.log('Current message:', currentMessage);
      return currentMessage;
    } catch (error) {
      console.error('Error in getCurrentMessage:', error);
      return "Bugün hangi komisyon faaliyetlerinde yer alacaksınız?";
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'duyuru':
        return 'bg-blue-100';
      case 'etkinlik':
        return 'bg-green-100';
      case 'toplanti':
        return 'bg-purple-100';
      case 'egitim':
        return 'bg-orange-100';
      case 'diger':
        return 'bg-gray-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'duyuru':
        return <BellIcon className="w-4 h-4 text-blue-600" />;
      case 'etkinlik':
        return <SparklesIcon className="w-4 h-4 text-green-600" />;
      case 'toplanti':
        return <UserGroupIcon className="w-4 h-4 text-purple-600" />;
      case 'egitim':
        return <BookOpenIcon className="w-4 h-4 text-orange-600" />;
      case 'diger':
        return <CalendarIcon className="w-4 h-4 text-gray-600" />;
      default:
        return <CalendarIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatEventTime = (timeString: string) => {
    const time = new Date(`1970-01-01T${timeString}`);
    return time.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-xl md:rounded-2xl lg:rounded-3xl p-4 md:p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 bg-white bg-opacity-10 rounded-full -mr-8 -mt-8 md:-mr-12 md:-mt-12 lg:-mr-16 lg:-mt-16"></div>
        <div className="absolute bottom-0 left-0 w-12 h-12 md:w-16 md:h-16 lg:w-24 lg:h-24 bg-white bg-opacity-10 rounded-full -ml-6 -mb-6 md:-ml-8 md:-mb-8 lg:-ml-12 lg:-mb-12"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col space-y-3 md:space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div>
              <div className="flex items-center mb-2">
                <GreetingIcon className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 mr-2 md:mr-3 text-white" />
                <h1 className="text-xl md:text-2xl lg:text-4xl font-bold">
                  {greeting.text}, {user?.first_name || 'Ortak'}!
                </h1>
              </div>
              <p className="text-green-100 text-sm md:text-base lg:text-lg">
                {getCurrentMessage()}
              </p>
            </div>
            <div className="text-left lg:text-right">
              <div className="text-lg md:text-xl lg:text-2xl font-bold">{formatTime(currentTime)}</div>
              <div className="text-green-100 text-xs md:text-sm">{formatDate(currentTime)}</div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExclamationCircleIcon className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-red-800 mb-2">Bir Hata Oluştu</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadDashboardData}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center mx-auto"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Tekrar Dene
          </button>
        </div>
      )}



      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
        
        {/* Quick Actions */}
        <div className="xl:col-span-2">
          <div className="bg-white/70 backdrop-blur-lg rounded-lg md:rounded-xl lg:rounded-2xl shadow-xl border border-white/20 p-4 md:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 space-y-2 sm:space-y-0">
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 flex items-center">
                <ClockIcon className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 mr-2 md:mr-3 text-gray-700" />
                Özetim
              </h2>
              <div className="text-xs md:text-sm text-gray-500">Sık kullanılan menüler</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 lg:gap-6 mb-4 md:mb-6 lg:mb-8">
              <Link href="/member/join" className="group">
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg md:rounded-xl lg:rounded-2xl p-3 md:p-4 lg:p-6 border border-emerald-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-lg group-hover:scale-105">
                  <div className="flex items-center mb-3 md:mb-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <DocumentTextIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <div className="ml-3 md:ml-4 flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate text-sm md:text-base">Komisyonlar</h3>
                      <p className="text-xs md:text-sm text-gray-600 truncate">Yeni komisyonlara katılın</p>
                    </div>
                  </div>
                  <div className="flex items-center text-emerald-600 font-medium text-xs md:text-sm">
                    <span>Başvuru sayfasına git</span>
                    <ArrowRightIcon className="w-3 h-3 md:w-4 md:h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300 text-emerald-600" />
                  </div>
                </div>
              </Link>

              <Link href="/member/commissions" className="group">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg md:rounded-xl lg:rounded-2xl p-3 md:p-4 lg:p-6 border border-blue-100 hover:border-blue-200 transition-all duration-300 hover:shadow-lg group-hover:scale-105">
                  <div className="flex items-center mb-3 md:mb-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <ClipboardDocumentListIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <div className="ml-3 md:ml-4 flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate text-sm md:text-base">Komisyonlarım</h3>
                      <p className="text-xs md:text-sm text-gray-600 truncate">{dashboardData?.commissions.length || 0} aktif ortaklık</p>
                    </div>
                  </div>
                  <div className="flex items-center text-blue-600 font-medium text-xs md:text-sm">
                    <span>Ortaklıkları yönet</span>
                    <ArrowRightIcon className="w-3 h-3 md:w-4 md:h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300 text-blue-600" />
                  </div>
                </div>
              </Link>

              <Link href="/member/profile" className="group">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg md:rounded-xl lg:rounded-2xl p-3 md:p-4 lg:p-6 border border-purple-100 hover:border-purple-200 transition-all duration-300 hover:shadow-lg group-hover:scale-105">
                  <div className="flex items-center mb-3 md:mb-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <UserIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <div className="ml-3 md:ml-4 flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate text-sm md:text-base">Profil Ayarları</h3>
                      <p className="text-xs md:text-sm text-gray-600 truncate">Bilgilerinizi güncelleyin</p>
                    </div>
                  </div>
                  <div className="flex items-center text-purple-600 font-medium text-xs md:text-sm">
                    <span>Profili düzenle</span>
                    <ArrowRightIcon className="w-3 h-3 md:w-4 md:h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300 text-purple-600" />
                  </div>
                </div>
              </Link>

              <Link href="/member/documents" className="group">
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-lg md:rounded-xl lg:rounded-2xl p-3 md:p-4 lg:p-6 border border-slate-100 hover:border-slate-200 transition-all duration-300 hover:shadow-lg group-hover:scale-105">
                  <div className="flex items-center mb-3 md:mb-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-slate-600 to-gray-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <DocumentTextIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <div className="ml-3 md:ml-4 flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate text-sm md:text-base">Belgeler</h3>
                      <p className="text-xs md:text-sm text-gray-600 truncate">Kooperatif belgelerine erişin</p>
                    </div>
                  </div>
                  <div className="flex items-center text-slate-600 font-medium text-xs md:text-sm">
                    <span>Belgeleri görüntüle</span>
                    <ArrowRightIcon className="w-3 h-3 md:w-4 md:h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300 text-slate-600" />
                  </div>
                </div>
              </Link>

              <Link href="/member/fees" className="group">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg md:rounded-xl lg:rounded-2xl p-3 md:p-4 lg:p-6 border border-orange-100 hover:border-orange-200 transition-all duration-300 hover:shadow-lg group-hover:scale-105">
                  <div className="flex items-center mb-3 md:mb-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <CurrencyDollarIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <div className="ml-3 md:ml-4 flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate text-sm md:text-base">Aidat Bilgilerim</h3>
                      <p className="text-xs md:text-sm text-gray-600 truncate">Ödemeler ve planlar</p>
                    </div>
                  </div>
                  <div className="flex items-center text-orange-600 font-medium text-xs md:text-sm">
                    <span>Aidatları görüntüle</span>
                    <ArrowRightIcon className="w-3 h-3 md:w-4 md:h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300 text-orange-600" />
                  </div>
                </div>
              </Link>

              <Link href="/member/calendar" className="group">
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg md:rounded-xl lg:rounded-2xl p-3 md:p-4 lg:p-6 border border-teal-100 hover:border-teal-200 transition-all duration-300 hover:shadow-lg group-hover:scale-105">
                  <div className="flex items-center mb-3 md:mb-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <CalendarIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <div className="ml-3 md:ml-4 flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate text-sm md:text-base">Takvim</h3>
                      <p className="text-xs md:text-sm text-gray-600 truncate">Etkinlik ve duyurular</p>
                    </div>
                  </div>
                  <div className="flex items-center text-teal-600 font-medium text-xs md:text-sm">
                    <span>Takvimi görüntüle</span>
                    <ArrowRightIcon className="w-3 h-3 md:w-4 md:h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300 text-teal-600" />
                  </div>
                </div>
              </Link>
            </div>

            {/* My Commissions Overview */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-green-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 lg:mb-6 space-y-2 sm:space-y-0">
                <h3 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center">
                  <CheckCircleIcon className="w-5 h-5 lg:w-6 lg:h-6 mr-2 text-gray-700" />
                  Katıldığım Komisyonlar
                </h3>
                <Link
                  href="/member/commissions"
                  className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-200 transition-colors"
                >
                  Tümünü Gör
                </Link>
              </div>
              
              {dashboardData?.commissions?.length === 0 ? (
                <div className="text-center py-6 lg:py-8">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClipboardDocumentListIcon className="w-6 h-6 lg:w-8 lg:h-8 text-green-500" />
                  </div>
                  <p className="text-gray-600 mb-4 font-medium">Henüz herhangi bir komisyona katılmadınız</p>
                  <Link
                    href="/member/join"
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 inline-flex items-center"
                  >
                    <DocumentTextIcon className="w-5 h-5 mr-2 text-white" />
                    İlk Başvurunuzu Yapın
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dashboardData?.commissions.slice(0, 4).map((commission) => (
                    <div key={commission.id} className="bg-white border border-green-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:border-green-300">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 truncate">{commission.name}</h4>
                        <div className="flex items-center gap-2">
                          {commission.member_role === 'manager' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <ShieldCheckIcon className="w-3 h-3 mr-1" />
                              Yönetici
                            </span>
                          )}
                          <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 flex items-center">
                        <UserGroupIcon className="w-4 h-4 mr-1 text-gray-600" />
                        {commission.current_members}/{commission.max_members} ortak
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-emerald-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(commission.current_members / commission.max_members) * 100}%` }}
                        ></div>
                      </div>
                      {commission.member_role === 'manager' && (
                        <button
                          onClick={() => handleViewPendingApplications(commission)}
                          className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                        >
                          <ClockIcon className="w-3 h-3" />
                          Başvuruları Görüntüle
                          {commission.pending_applications_count > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                              {commission.pending_applications_count}
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                  {dashboardData?.commissions?.length && dashboardData.commissions.length > 4 && (
                    <div className="col-span-full text-center pt-4">
                      <Link
                        href="/member/commissions"
                        className="text-green-600 font-medium hover:text-green-700 transition-colors flex items-center justify-center"
                      >
                        +{dashboardData.commissions.length - 4} komisyon daha
                        <ArrowRightIcon className="w-4 h-4 ml-1 text-green-600" />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          
          {/* Upcoming Events Calendar Widget */}
          <div className="bg-white/70 backdrop-blur-lg rounded-xl lg:rounded-2xl shadow-xl border border-white/20 p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <h3 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center">
                <CalendarIcon className="w-5 h-5 lg:w-6 lg:h-6 mr-2 text-gray-700" />
                Yaklaşan Etkinlikler
              </h3>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            
            <div className="space-y-3 lg:space-y-4 max-h-60 lg:max-h-80 overflow-y-auto">
              {!dashboardData?.upcomingEvents || dashboardData.upcomingEvents.length === 0 ? (
                <div className="text-center py-6 lg:py-8">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="w-6 h-6 lg:w-8 lg:h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">Yaklaşan etkinlik yok</p>
                  <p className="text-sm text-gray-400 mt-1">Yeni etkinlikler buraya gelecek</p>
                </div>
              ) : (
                dashboardData?.upcomingEvents?.map((event, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors duration-200 cursor-pointer">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getEventTypeColor(event.event_type)}`}>
                      {getEventTypeIcon(event.event_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{event.description || 'Açıklama yok'}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <p className="text-xs text-gray-500 flex items-center">
                          <CalendarIcon className="w-3 h-3 mr-1" />
                          {formatEventDate(event.start_date)}
                        </p>
                        {event.start_time && !event.is_all_day && (
                          <p className="text-xs text-gray-500 flex items-center">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            {formatEventTime(event.start_time)}
                          </p>
                        )}
                      </div>
                      {event.location && (
                        <p className="text-xs text-gray-500 flex items-center mt-1">
                          <MapPinIcon className="w-3 h-3 mr-1" />
                          {event.location}
                      </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {dashboardData?.upcomingEvents && dashboardData.upcomingEvents.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  href="/member/calendar"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center transition-colors"
                >
                  Tüm etkinlikleri görüntüle
                  <ArrowRightIcon className="w-4 h-4 ml-1" />
                </Link>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white/70 backdrop-blur-lg rounded-xl lg:rounded-2xl shadow-xl border border-white/20 p-4 lg:p-6">
            <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6 flex items-center">
              <ChartBarIcon className="w-5 h-5 lg:w-6 lg:h-6 mr-2 text-gray-700" />
              Hızlı İstatistikler
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Üye olduğum komisyonlar</span>
                </div>
                <span className="text-lg font-bold text-emerald-600">{dashboardData?.commissions?.length || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <ClipboardDocumentListIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Tüm komisyonlar</span>
                </div>
                <span className="text-lg font-bold text-blue-600">{dashboardData?.stats?.available_commissions || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <UserGroupIcon className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Ortak sayısı</span>
                </div>
                <span className="text-lg font-bold text-purple-600">{dashboardData?.stats?.total_members || 0}</span>
              </div>
            </div>
          </div>

          {/* Recent Documents */}
          <SidebarDocuments />

        </div>
      </div>

      {/* Pending Applications Modal */}
      {showPendingModal && selectedCommission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {selectedCommission.name} - Bekleyen Başvurular
                  </h3>
                  <p className="text-blue-100">Komisyon yöneticisi olarak başvuruları değerlendirin</p>
                </div>
                <button
                  onClick={() => setShowPendingModal(false)}
                  className="text-white hover:text-blue-200 transition-colors"
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
                    {selectedCommission.name} komisyonu için şu anda bekleyen başvuru bulunmuyor.
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
    </div>
  );
}

export default MemberDashboard;