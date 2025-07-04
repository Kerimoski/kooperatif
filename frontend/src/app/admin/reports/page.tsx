'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  UserGroupIcon,
  ClipboardDocumentListIcon,
  BookOpenIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  DocumentChartBarIcon,
  DocumentTextIcon,
  TableCellsIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  CalendarIcon,
  ChartBarIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface CommissionData {
  id: number;
  name: string;
  members: number;
  max: number;
}

interface ReportStats {
  totalUsers: number;
  activeCommissions: number;
  monthlyActivities: number;
  pendingApplications: number;
  totalDocuments: number;
  documentsThisMonth: number;
  usersByRole: {
    admin: number;
    member: number;
  };
  commissionsData: CommissionData[];
  recentActivities: Array<{
    type: string;
    description: string;
    date: string;
  }>;
  documentsByCategory: Array<{
    category: string;
    count: number;
  }>;
}

export default function ReportsPage() {
  const [stats, setStats] = useState<ReportStats>({
    totalUsers: 0,
    activeCommissions: 0,
    monthlyActivities: 0,
    pendingApplications: 0,
    totalDocuments: 0,
    documentsThisMonth: 0,
    usersByRole: {
      admin: 0,
      member: 0
    },
    commissionsData: [],
    recentActivities: [],
    documentsByCategory: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      // Dashboard istatistiklerini yükle
      const dashboardResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!dashboardResponse.ok) {
        throw new Error('Dashboard verileri yüklenemedi');
      }
      
      const dashboardData = await dashboardResponse.json();
      
      // Belge istatistiklerini yükle
      const documentsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/documents`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      let documentsData = { data: [] };
      if (documentsResponse.ok) {
        documentsData = await documentsResponse.json();
      }
      
      // Belge kategorilerini hesapla
      const categoryCount: { [key: string]: number } = {};
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      let documentsThisMonth = 0;
      
      documentsData.data.forEach((doc: any) => {
        // Kategori sayısı
        categoryCount[doc.category] = (categoryCount[doc.category] || 0) + 1;
        
        // Bu ay yüklenen belgeler
        const docDate = new Date(doc.uploaded_at);
        if (docDate.getMonth() === currentMonth && docDate.getFullYear() === currentYear) {
          documentsThisMonth++;
        }
      });
      
      const documentsByCategory = Object.entries(categoryCount).map(([category, count]) => ({
        category,
        count
      }));

    setStats({
        totalUsers: dashboardData.data.totalUsers,
        activeCommissions: dashboardData.data.activeCommissions,
        monthlyActivities: dashboardData.data.monthlyActivities,
        pendingApplications: dashboardData.data.pendingApplications,
        totalDocuments: documentsData.data.length,
        documentsThisMonth,
        usersByRole: dashboardData.data.usersByRole,
        commissionsData: dashboardData.data.commissionsData,
        recentActivities: dashboardData.data.recentActivities,
        documentsByCategory
      });
      
    } catch (error) {
      console.error('Rapor verileri yüklenirken hata:', error);
      setError('Rapor verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const createStyledWorkbook = (data: any[][], sheetName: string, reportTitle: string) => {
    const wb = XLSX.utils.book_new();
    
    // Rapor başlığı ve meta bilgiler
    const headerData = [
      [reportTitle],
      [`Eğitim Kooperatifi Yönetim Sistemi`],
      [``],
      [`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`],
      [`Toplam Kayıt: ${data.length - 1} adet`],
      [``],
      ...data
    ];

    const ws = XLSX.utils.aoa_to_sheet(headerData);
    
    // Sütun genişliklerini otomatik ayarla
    const maxWidths: number[] = [];
    headerData.forEach((row) => {
      row.forEach((cell, colIndex) => {
        const cellValue = cell ? cell.toString() : '';
        maxWidths[colIndex] = Math.max(maxWidths[colIndex] || 0, cellValue.length);
      });
    });
    
    ws['!cols'] = maxWidths.map(width => ({ wch: Math.min(Math.max(width + 2, 10), 50) }));
    
    // Başlık satırları için stil
    const headerRowIndex = 6; // Verinin başladığı satır (0-based)
    
    // Başlık satırının stilini ayarla
    if (data.length > 0) {
      data[0].forEach((_, colIndex) => {
        const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: colIndex });
        if (!ws[cellAddress]) ws[cellAddress] = { v: '', t: 's' };
        ws[cellAddress].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '4F46E5' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        };
      });
    }
    
    // Rapor başlığının stilini ayarla
    const titleCell = 'A1';
    if (ws[titleCell]) {
      ws[titleCell].s = {
        font: { bold: true, size: 16, color: { rgb: '1F2937' } },
        alignment: { horizontal: 'center' }
      };
    }
    
    const subtitleCell = 'A2';
    if (ws[subtitleCell]) {
      ws[subtitleCell].s = {
        font: { italic: true, size: 12, color: { rgb: '6B7280' } },
        alignment: { horizontal: 'center' }
      };
    }

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    return wb;
  };

  const exportToExcel = (data: any[][], filename: string, sheetName: string, reportTitle: string) => {
    if (data.length === 0) return;
    
    const wb = createStyledWorkbook(data, sheetName, reportTitle);
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(blob, `${filename}_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.xlsx`);
  };

  const downloadReport = async (type: string) => {
    try {
      const token = localStorage.getItem('token');
      
      switch (type) {
        case 'users':
          const usersResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/dashboard/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            const headers = ['Ad Soyad', 'Email', 'Telefon', 'Meslek', 'Rol', 'Durum', 'Kayıt Tarihi'];
            const rows = usersData.data.map((user: any) => [
              `${user.first_name} ${user.last_name}`,
              user.email,
              user.phone_number || 'Belirtilmemiş',
              user.profession || 'Belirtilmemiş',
                              user.role === 'admin' ? 'Yönetici' : 'Ortak',
              user.is_active ? 'Aktif' : 'Pasif',
              new Date(user.created_at).toLocaleDateString('tr-TR')
            ]);
            exportToExcel([headers, ...rows], 'kullanici_raporu', 'Kullanıcılar', 'Kullanıcı Raporu');
          }
          break;
          
        case 'commissions':
          const commissionsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/commissions`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (commissionsResponse.ok) {
            const commissionsData = await commissionsResponse.json();
            const headers = ['Komisyon Adı', 'Açıklama', 'Maksimum Ortak', 'Mevcut Ortak', 'Ortak Sayısı', 'Durum', 'Oluşturulma Tarihi'];
            const rows = commissionsData.data.map((commission: any) => [
              commission.name,
              commission.description || 'Açıklama yok',
              commission.max_members,
              commission.current_members || 0,
              `%${Math.round(((commission.current_members || 0) / commission.max_members) * 100)}`,
              commission.is_active ? 'Aktif' : 'Pasif',
              new Date(commission.created_at).toLocaleDateString('tr-TR')
            ]);
            exportToExcel([headers, ...rows], 'komisyon_raporu', 'Komisyonlar', 'Komisyon Raporu');
          }
          break;
          
        case 'documents':
          const documentsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/documents`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (documentsResponse.ok) {
            const documentsData = await documentsResponse.json();
            const headers = ['Belge Başlığı', 'Dosya Adı', 'Kategori', 'Dosya Boyutu (MB)', 'Yükleme Tarihi'];
            const rows = documentsData.data.map((doc: any) => [
              doc.title,
              doc.file_name,
              doc.category,
              (doc.file_size / (1024 * 1024)).toFixed(2),
              new Date(doc.uploaded_at).toLocaleDateString('tr-TR')
            ]);
            exportToExcel([headers, ...rows], 'belge_raporu', 'Belgeler', 'Belge Raporu');
          }
          break;
          
        case 'activities':
          const headers = ['Aktivite Türü', 'Açıklama', 'Tarih'];
          const rows = stats.recentActivities.map(activity => [
            activity.type === 'user_created' ? 'Kullanıcı Oluşturuldu' :
            activity.type === 'commission_created' ? 'Komisyon Oluşturuldu' :
                            activity.type === 'member_joined' ? 'Ortak Katıldı' : activity.type,
            activity.description,
            new Date(activity.date).toLocaleDateString('tr-TR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          ]);
          exportToExcel([headers, ...rows], 'faaliyet_raporu', 'Aktiviteler', 'Faaliyet Raporu');
          break;
          
        case 'complete':
          // Kapsamlı rapor - çoklu sayfa
          const wb = XLSX.utils.book_new();
          
          // Sayfa 1: Genel İstatistikler
          const statsHeaders = ['Metrik', 'Değer', 'Açıklama'];
          const statsRows = [
            ['Toplam Kullanıcı', stats.totalUsers, 'Sistemde kayıtlı tüm kullanıcılar'],
            ['Admin Sayısı', stats.usersByRole.admin, 'Yönetici yetkisine sahip kullanıcılar'],
                          ['Ortak Sayısı', stats.usersByRole.member, 'Normal ortak kullanıcılar'],
            ['Aktif Komisyon', stats.activeCommissions, 'Şu anda aktif olan komisyonlar'],
            ['Toplam Belge', stats.totalDocuments, 'Sisteme yüklenmiş tüm belgeler'],
            ['Bu Ay Belge', stats.documentsThisMonth, 'Bu ay içinde yüklenen belgeler'],
            ['Bu Ay Aktivite', stats.monthlyActivities, 'Bu ay gerçekleşen toplam aktivite'],
            ['Bekleyen Başvuru', stats.pendingApplications, 'İncelenmesi gereken başvurular'],
            ['Rapor Tarihi', new Date().toLocaleDateString('tr-TR'), 'Bu raporun oluşturulma tarihi']
          ];
          
                     const statsData = [
             [`Kapsamlı Sistem Raporu`],
             [`Eğitim Kooperatifi Yönetim Sistemi`],
             [``],
             [`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR', { 
               weekday: 'long', 
               year: 'numeric', 
               month: 'long', 
               day: 'numeric',
               hour: '2-digit',
               minute: '2-digit'
             })}`],
             [``],
             ['GENEL İSTATİSTİKLER'],
            [``],
            statsHeaders,
            ...statsRows
          ];
          
          const statsWs = XLSX.utils.aoa_to_sheet(statsData);
          statsWs['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 40 }];
          XLSX.utils.book_append_sheet(wb, statsWs, 'Genel İstatistikler');
          
          // Sayfa 2: Komisyon Detayları
          if (stats.commissionsData.length > 0) {
            const commHeaders = ['Komisyon Adı', 'Mevcut Ortak', 'Maksimum Ortak', 'Ortak Sayısı', 'Durum'];
            const commRows = stats.commissionsData.map(comm => [
              comm.name,
              comm.members,
              comm.max,
              `%${Math.round((comm.members / comm.max) * 100)}`,
              'Aktif'
            ]);
            
                         const commData = [
               [`Komisyon Detay Raporu`],
              [``],
              [`Toplam Aktif Komisyon: ${stats.commissionsData.length}`],
              [``],
              commHeaders,
              ...commRows
            ];
            
            const commWs = XLSX.utils.aoa_to_sheet(commData);
            commWs['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }];
            XLSX.utils.book_append_sheet(wb, commWs, 'Komisyonlar');
          }
          
          // Sayfa 3: Belge Kategorileri
          if (stats.documentsByCategory.length > 0) {
            const docHeaders = ['Kategori', 'Belge Sayısı', 'Yüzde'];
            const totalDocs = stats.documentsByCategory.reduce((sum, cat) => sum + cat.count, 0);
            const docRows = stats.documentsByCategory.map(cat => [
              cat.category,
              cat.count,
              `%${Math.round((cat.count / totalDocs) * 100)}`
            ]);
            
                         const docData = [
               [`Belge Kategori Raporu`],
              [``],
              [`Toplam Belge Sayısı: ${totalDocs}`],
              [``],
              docHeaders,
              ...docRows
            ];
            
            const docWs = XLSX.utils.aoa_to_sheet(docData);
            docWs['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 10 }];
            XLSX.utils.book_append_sheet(wb, docWs, 'Belge Kategorileri');
          }
          
          const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
          saveAs(blob, `kapsamli_sistem_raporu_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.xlsx`);
          break;
          
        default:
          console.log(`${type} raporu henüz hazır değil`);
      }
    } catch (error) {
      console.error('Rapor indirme hatası:', error);
      alert('Rapor indirilemedi');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Rapor verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <ExclamationCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">{error}</p>
          <button 
            onClick={loadReportData}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
    <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold flex items-center">
              <ChartBarIcon className="w-6 h-6 md:w-8 md:h-8 mr-2 md:mr-3" />
              Raporlar ve İstatistikler
            </h1>
            <p className="text-indigo-100 text-sm md:text-base mt-1">
              Kooperatif verilerini analiz edin ve detaylı Excel raporları alın
        </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{new Date().toLocaleDateString('tr-TR')}</div>
            <div className="text-indigo-200 text-sm">Son Güncelleme</div>
          </div>
        </div>
      </div>

      {/* Main Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/70 backdrop-blur-lg shadow-xl overflow-hidden rounded-2xl border border-white/20 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-500">Toplam Ortak</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Yönetici: {stats.usersByRole.admin}</span>
                              <span className="text-gray-500">Ortak: {stats.usersByRole.member}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-lg shadow-xl overflow-hidden rounded-2xl border border-white/20 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <ClipboardDocumentListIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Aktif Komisyon</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeCommissions}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-lg shadow-xl overflow-hidden rounded-2xl border border-white/20 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Toplam Belge</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalDocuments}</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-green-600 font-medium flex items-center gap-1">
              <ArrowTrendingUpIcon className="w-4 h-4" />
              Bu ay +{stats.documentsThisMonth}
            </span>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-lg shadow-xl overflow-hidden rounded-2xl border border-white/20 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Bekleyen Başvuru</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingApplications}</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-orange-600 font-medium">
              {stats.pendingApplications > 0 ? 'İnceleme Gerekli' : 'Tümü İncelendi'}
            </span>
          </div>
        </div>
      </div>

      {/* Analysis Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/70 backdrop-blur-lg shadow-xl overflow-hidden rounded-2xl border border-white/20">
          <div className="px-6 py-5 border-b border-gray-200/50">
            <h3 className="text-xl font-bold text-gray-900">Komisyon Doluluk Oranları</h3>
                            <p className="text-sm text-gray-500">Komisyonların ortak kapasitesi analizi</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.commissionsData.length > 0 ? (
                stats.commissionsData.map((commission, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">{commission.name}</span>
                    <span className="text-sm text-gray-500">
                      {commission.members}/{commission.max}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((commission.members / commission.max) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Doluluk: %{Math.round((commission.members / commission.max) * 100)}
                  </div>
                </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Henüz aktif komisyon bulunmuyor
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-lg shadow-xl overflow-hidden rounded-2xl border border-white/20">
          <div className="px-6 py-5 border-b border-gray-200/50">
            <h3 className="text-xl font-bold text-gray-900">Belge Kategorileri</h3>
            <p className="text-sm text-gray-500">Kategori bazında belge dağılımı</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.documentsByCategory.length > 0 ? (
                stats.documentsByCategory.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 bg-gradient-to-r ${
                        index % 6 === 0 ? 'from-blue-500 to-blue-600' :
                        index % 6 === 1 ? 'from-green-500 to-green-600' :
                        index % 6 === 2 ? 'from-purple-500 to-purple-600' :
                        index % 6 === 3 ? 'from-orange-500 to-orange-600' :
                        index % 6 === 4 ? 'from-red-500 to-red-600' :
                        'from-indigo-500 to-indigo-600'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-900">{category.category}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{category.count}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Henüz belge bulunmuyor
                </div>
              )}
                </div>
              </div>
                  </div>
                </div>
                
      {/* Recent Activities */}
      <div className="bg-white/70 backdrop-blur-lg shadow-xl overflow-hidden rounded-2xl border border-white/20">
        <div className="px-6 py-5 border-b border-gray-200/50">
          <h3 className="text-xl font-bold text-gray-900">Son Aktiviteler</h3>
          <p className="text-sm text-gray-500">Son 30 günün sistem aktiviteleri</p>
        </div>
        <div className="p-6">
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors duration-200">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
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
              <div className="text-center py-8 text-gray-500">
                Son 30 günde aktivite bulunmuyor
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Downloads */}
      <div className="bg-white/70 backdrop-blur-lg shadow-xl overflow-hidden rounded-2xl border border-white/20">
        <div className="px-6 py-5 border-b border-gray-200/50 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <DocumentTextIcon className="w-6 h-6 mr-2 text-green-600" />
                Excel Rapor İndir
              </h3>
              <p className="text-sm text-gray-600 mt-1">Detaylı raporları profesyonel Excel formatında indirin</p>
            </div>
            <div className="hidden sm:flex items-center space-x-2 text-green-600">
              <ArrowDownTrayIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Excel Format</span>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => downloadReport('users')}
              className="flex items-center justify-center p-6 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group transform hover:scale-105"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <UserGroupIcon className="w-8 h-8 text-blue-600" />
                </div>
                                 <h4 className="font-bold text-gray-900 mb-2">Kullanıcı Raporu</h4>
                <p className="text-sm text-gray-600 mb-2">Tüm ortak bilgileri</p>
                <div className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded">
                  {stats.totalUsers} kullanıcı
                </div>
              </div>
            </button>

            <button
              onClick={() => downloadReport('commissions')}
              className="flex items-center justify-center p-6 border-2 border-dashed border-green-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-200 group transform hover:scale-105"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                  <ClipboardDocumentListIcon className="w-8 h-8 text-green-600" />
                </div>
                                 <h4 className="font-bold text-gray-900 mb-2">Komisyon Raporu</h4>
                <p className="text-sm text-gray-600 mb-2">Komisyon detayları</p>
                <div className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded">
                  {stats.activeCommissions} aktif komisyon
                </div>
              </div>
            </button>

            <button
              onClick={() => downloadReport('documents')}
              className="flex items-center justify-center p-6 border-2 border-dashed border-purple-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 group transform hover:scale-105"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                  <DocumentTextIcon className="w-8 h-8 text-purple-600" />
                </div>
                                 <h4 className="font-bold text-gray-900 mb-2">Belge Raporu</h4>
                <p className="text-sm text-gray-600 mb-2">Tüm belgeler</p>
                <div className="text-xs text-purple-600 font-medium bg-purple-100 px-2 py-1 rounded">
                  {stats.totalDocuments} belge
                </div>
              </div>
            </button>

            <button
              onClick={() => downloadReport('activities')}
              className="flex items-center justify-center p-6 border-2 border-dashed border-orange-300 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all duration-200 group transform hover:scale-105"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                  <DocumentChartBarIcon className="w-8 h-8 text-orange-600" />
                </div>
                                 <h4 className="font-bold text-gray-900 mb-2">Faaliyet Raporu</h4>
                <p className="text-sm text-gray-600 mb-2">Son aktiviteler</p>
                <div className="text-xs text-orange-600 font-medium bg-orange-100 px-2 py-1 rounded">
                  {stats.recentActivities.length} aktivite
                </div>
              </div>
            </button>

            <button
              onClick={() => downloadReport('complete')}
              className="flex items-center justify-center p-6 border-2 border-dashed border-indigo-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 group transform hover:scale-105"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-200 transition-colors">
                  <TableCellsIcon className="w-8 h-8 text-indigo-600" />
                </div>
                                 <h4 className="font-bold text-gray-900 mb-2">Kapsamlı Rapor</h4>
                <p className="text-sm text-gray-600 mb-2">Çoklu sayfa raporu</p>
                <div className="text-xs text-indigo-600 font-medium bg-indigo-100 px-2 py-1 rounded">
                  Tüm veriler
                </div>
              </div>
            </button>

            <div className="flex items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <ArrowDownTrayIcon className="w-8 h-8 text-gray-400" />
                </div>
                                 <h4 className="font-medium text-gray-600 mb-2">Geliştirilecek</h4>
                <p className="text-sm text-gray-400 mb-2">Yeni raporlar</p>
                <div className="text-xs text-gray-400 font-medium bg-gray-200 px-2 py-1 rounded">
                  Yakında...
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <DocumentTextIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">Excel Rapor Özellikleri</h4>
                <p className="text-sm text-blue-700 mt-1">
                  • Renkli başlıklar ve profesyonel formatlar • Otomatik sütun genişlikleri • Tarih ve metin formatlama • Çoklu sayfa desteği
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 