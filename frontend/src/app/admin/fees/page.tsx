'use client';

import { useState, useEffect } from 'react';
import { membershipAPI, dashboardAPI } from '@/lib/api';
import { useNotification } from '@/hooks/useNotification';
import {
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  CalendarIcon,
  UserIcon,
  BanknotesIcon,
  ChartBarIcon,
  FunnelIcon,
  XMarkIcon,
  DocumentTextIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  QuestionMarkCircleIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

interface MembershipPlan {
  id: number;
  name: string;
  amount: number;
  period_months: number;
  description: string;
  is_active: boolean;
  created_by_name: string;
  created_at: string;
}

interface MembershipFee {
  id: number;
  user_id: number;
  plan_id: number;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: string;
  status_text: string;
  late_fee: number;
  days_overdue: number;
  notes?: string;
  plan_name: string;
  period_months: number;
  user_name: string;
  user_email: string;
  phone_number?: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface FeeStats {
  total_fees: string;
  paid_fees: string;
  pending_fees: string;
  overdue_fees: string;
  total_paid_amount: string;
  pending_amount: string;
}

interface OverdueAnalysis {
  overdue_period: string;
  count: number;
  total_amount: string;
}

interface UpcomingStats {
  upcoming_count: string;
  upcoming_amount: string;
}

export default function AdminFeesPage() {
  const { showSuccess, showError } = useNotification();
  const [fees, setFees] = useState<MembershipFee[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<FeeStats | null>(null);
  const [upcomingStats, setUpcomingStats] = useState<UpcomingStats | null>(null);
  const [overdueAnalysis, setOverdueAnalysis] = useState<OverdueAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateFeeModal, setShowCreateFeeModal] = useState(false);
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBulkPaymentModal, setShowBulkPaymentModal] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [showFeeDetailModal, setShowFeeDetailModal] = useState(false);
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false);
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState<MembershipFee | null>(null);
  const [selectedFeeGroup, setSelectedFeeGroup] = useState<MembershipFee[]>([]);
  const [feeGroupDetails, setFeeGroupDetails] = useState<MembershipFee[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const [newFee, setNewFee] = useState({
    user_id: '',
    plan_id: '',
    due_date: '',
    notes: '',
    payment_type: 'installments'
  });

  const [newPlan, setNewPlan] = useState({
    name: '',
    amount: '',
    period_months: '1',
    description: ''
  });

  const [payment, setPayment] = useState({
    amount: '',
    payment_method: 'bank_transfer',
    transaction_id: '',
    notes: ''
  });

  const [bulkCreateData, setBulkCreateData] = useState({
    plan_id: '',
    due_date: '',
    notes: '',
    user_filter: [] as number[]
  });

  const [automationData, setAutomationData] = useState({
    plan_id: '',
    auto_create_day: '',
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadFees();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansResponse, usersResponse, statsResponse] = await Promise.all([
        membershipAPI.getPlans(),
        dashboardAPI.getAllUsers(),
        membershipAPI.getStats()
      ]);

      if (plansResponse.success) setPlans(plansResponse.data);
      if (usersResponse.success) setUsers(usersResponse.data);
      if (statsResponse.success) {
        setStats(statsResponse.data.stats);
        setUpcomingStats(statsResponse.data.upcoming);
        setOverdueAnalysis(statsResponse.data.overdue_analysis || []);
      }

      await loadFees();
    } catch (error: any) {
      console.error('Load data error:', error);
      showError('Hata', 'Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadFees = async () => {
    try {
      const params = filters.status === 'all' ? { month: filters.month, year: filters.year } : filters;
      const response = await membershipAPI.getAllFees(params);
      if (response.success) {
        setFees(response.data);
      }
    } catch (error: any) {
      console.error('Load fees error:', error);
    }
  };

  const handleCreateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newFee.user_id || !newFee.plan_id || !newFee.due_date) {
        showError('Hata', 'Tüm gerekli alanları doldurun');
        return;
      }

      const response = await membershipAPI.createFee({
        user_id: parseInt(newFee.user_id),
        plan_id: parseInt(newFee.plan_id),
        due_date: newFee.due_date,
        notes: newFee.notes,
        payment_type: newFee.payment_type
      });

      if (response.success) {
        setShowCreateFeeModal(false);
        setNewFee({ user_id: '', plan_id: '', due_date: '', notes: '', payment_type: 'installments' });
        await loadFees();
        showSuccess('Başarılı!', response.message || 'Aidat başarıyla oluşturuldu');
      } else {
        showError('Hata', response.message || 'Aidat oluşturulamadı');
      }
    } catch (error: any) {
      console.error('Create fee error:', error);
      showError('Hata', 'Aidat oluşturulurken hata oluştu');
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newPlan.name || !newPlan.amount || !newPlan.period_months) {
        showError('Hata', 'Tüm gerekli alanları doldurun');
        return;
      }

      const response = await membershipAPI.createPlan({
        name: newPlan.name,
        amount: parseFloat(newPlan.amount),
        period_months: parseInt(newPlan.period_months),
        description: newPlan.description
      });

      if (response.success) {
        setShowCreatePlanModal(false);
        setNewPlan({ name: '', amount: '', period_months: '1', description: '' });
        await loadData();
        showSuccess('Başarılı!', 'Aidat planı başarıyla oluşturuldu');
      } else {
        showError('Hata', response.message || 'Aidat planı oluşturulamadı');
      }
    } catch (error: any) {
      console.error('Create plan error:', error);
      showError('Hata', 'Aidat planı oluşturulurken hata oluştu');
    }
  };

  const handleDeletePlan = async (planId: number, planName: string) => {
    if (!confirm(`"${planName}" planını silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz ve bu plana bağlı aidatlar etkilenebilir.`)) {
      return;
    }

    try {
      const response = await membershipAPI.deletePlan(planId);

      if (response.success) {
        await loadData(); // Planları yeniden yükle
        showSuccess('Başarılı!', 'Plan başarıyla silindi');
      } else {
        showError('Hata', response.message || 'Plan silinemedi');
      }
    } catch (error: any) {
      console.error('Delete plan error:', error);
      showError('Hata', error.response?.data?.message || 'Plan silinirken hata oluştu');
    }
  };

  const handleExportExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showError('Hata', 'Oturum açmanız gerekli');
        return;
      }

      // Loading göster
      showSuccess('İşlem Başladı', 'Excel dosyası hazırlanıyor...');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/export/fees`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Excel dosyası oluşturulamadı');
      }

      // Dosyayı blob olarak al
      const blob = await response.blob();
      
      // Dosya adını response header'dan al veya varsayılan kullan
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `aidat-raporu-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Dosyayı indir
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showSuccess('Başarılı!', 'Excel dosyası indirildi');

    } catch (error: any) {
      console.error('Excel export error:', error);
      showError('Hata', 'Excel dosyası oluşturulurken hata oluştu');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!selectedFee || !payment.amount) {
        showError('Hata', 'Ödeme tutarı gereklidir');
        return;
      }

      const response = await membershipAPI.recordPayment({
        membership_fee_id: selectedFee.id,
        amount: parseFloat(payment.amount),
        payment_method: payment.payment_method,
        transaction_id: payment.transaction_id,
        notes: payment.notes
      });

      if (response.success) {
        setShowPaymentModal(false);
        setSelectedFee(null);
        setPayment({ amount: '', payment_method: 'bank_transfer', transaction_id: '', notes: '' });
        await loadFees();
        await loadData(); // Stats'ları da güncelle
        showSuccess('Başarılı!', 'Ödeme başarıyla kaydedildi');
      } else {
        showError('Hata', response.message || 'Ödeme kaydedilemedi');
      }
    } catch (error: any) {
      console.error('Record payment error:', error);
      showError('Hata', 'Ödeme kaydedilirken hata oluştu');
    }
  };

  const openPaymentModal = (fee: MembershipFee) => {
    setSelectedFee(fee);
    setPayment({ ...payment, amount: fee.amount.toString() });
    setShowPaymentModal(true);
  };

  const openBulkPaymentModal = (feeGroup: MembershipFee[]) => {
    setSelectedFeeGroup(feeGroup);
    const totalAmount = feeGroup.reduce((sum, fee) => sum + parseFloat(fee.amount.toString()), 0);
    setPayment({ ...payment, amount: totalAmount.toString() });
    setShowBulkPaymentModal(true);
  };

  const handleRecordBulkPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!selectedFeeGroup.length || !payment.amount) {
        showError('Hata', 'Ödeme tutarı gereklidir');
        return;
      }

      const response = await membershipAPI.recordBulkPayment({
        fee_ids: selectedFeeGroup.map(fee => fee.id),
        payment_method: payment.payment_method,
        transaction_id: payment.transaction_id,
        notes: payment.notes
      });

      if (response.success) {
        setShowBulkPaymentModal(false);
        setSelectedFeeGroup([]);
        setPayment({ amount: '', payment_method: 'bank_transfer', transaction_id: '', notes: '' });
        await loadFees();
        await loadData(); // Stats'ları da güncelle
        showSuccess('Başarılı!', response.message || 'Toplu ödeme başarıyla kaydedildi');
      } else {
        showError('Hata', response.message || 'Toplu ödeme kaydedilemedi');
      }
    } catch (error: any) {
      console.error('Record bulk payment error:', error);
      showError('Hata', 'Toplu ödeme kaydedilirken hata oluştu');
    }
  };

  const handleDeleteFee = async (feeId: number, feeName: string) => {
    if (!confirm(`"${feeName}" aidatını silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.`)) {
      return;
    }

    try {
      const response = await membershipAPI.deleteFee(feeId);

      if (response.success) {
        await loadFees();
        await loadData(); // Stats'ları da güncelle
        showSuccess('Başarılı!', 'Aidat başarıyla silindi');
      } else {
        showError('Hata', response.message || 'Aidat silinemedi');
      }
    } catch (error: any) {
      console.error('Delete fee error:', error);
      showError('Hata', error.response?.data?.message || 'Aidat silinirken hata oluştu');
    }
  };

  const openFeeDetailModal = async (fee: MembershipFee) => {
    // Eğer taksitli ödeme ise grup detaylarını getir
    if (fee.notes?.includes('taksit')) {
      try {
        const response = await membershipAPI.getFeeGroup(fee.user_id, fee.plan_id);
        if (response.success) {
          setFeeGroupDetails(response.data.fees);
          setShowFeeDetailModal(true);
        } else {
          showError('Hata', 'Taksit detayları yüklenemedi');
        }
      } catch (error: any) {
        console.error('Get fee group error:', error);
        showError('Hata', 'Taksit detayları yüklenemedi');
      }
    } else {
      // Tek aidat için sadece kendisini göster
      setFeeGroupDetails([fee]);
      setShowFeeDetailModal(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircleIcon className="w-4 h-4" />;
      case 'pending': return <ClockIcon className="w-4 h-4" />;
      case 'overdue': return <ExclamationTriangleIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const handleBulkCreateFees = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!bulkCreateData.plan_id || !bulkCreateData.due_date) {
        showError('Hata', 'Plan ve vade tarihi gereklidir');
        return;
      }

      const response = await membershipAPI.createBulkFees({
        plan_id: parseInt(bulkCreateData.plan_id),
        due_date: bulkCreateData.due_date,
        notes: bulkCreateData.notes,
        user_filter: bulkCreateData.user_filter.length > 0 ? bulkCreateData.user_filter : undefined
      });

      if (response.success) {
        setShowBulkCreateModal(false);
        setBulkCreateData({
          plan_id: '',
          due_date: '',
          notes: '',
          user_filter: []
        });
        await loadFees();
        showSuccess('Başarılı!', response.message || 'Toplu aidat başarıyla oluşturuldu');
      } else {
        showError('Hata', response.message || 'Toplu aidat oluşturulamadı');
      }
    } catch (error: any) {
      console.error('Bulk create fees error:', error);
      showError('Hata', 'Toplu aidat oluşturulurken hata oluştu');
    }
  };

  const handleSetAutomation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!automationData.plan_id || !automationData.auto_create_day) {
        showError('Hata', 'Plan ve gün seçimi gereklidir');
        return;
      }

      const response = await membershipAPI.setAutomaticFees({
        plan_id: parseInt(automationData.plan_id),
        auto_create_day: parseInt(automationData.auto_create_day),
        is_active: automationData.is_active
      });

      if (response.success) {
        setShowAutomationModal(false);
        setAutomationData({
          plan_id: '',
          auto_create_day: '',
          is_active: true
        });
        showSuccess('Başarılı!', response.message || 'Otomatik aidat ayarları başarıyla kaydedildi');
      } else {
        showError('Hata', response.message || 'Otomatik aidat ayarları kaydedilemedi');
      }
    } catch (error: any) {
      console.error('Set automation error:', error);
      showError('Hata', 'Otomatik aidat ayarları kaydedilirken hata oluştu');
    }
  };



  const handleApplyLateFees = async () => {
    try {
      // Gecikmiş aidatları bul
      const overdueFees = fees.filter(fee => 
        fee.status === 'pending' && 
        new Date(fee.due_date) < new Date() &&
        fee.late_fee === 0
      );

      if (overdueFees.length === 0) {
        showError('Bilgi', 'Gecikme cezası uygulanacak aidat bulunamadı');
        return;
      }

      const confirmed = window.confirm(
        `${overdueFees.length} adet gecikmiş aidaya ₺50 gecikme cezası uygulanacak. Onaylıyor musunuz?`
      );

      if (!confirmed) return;

      const response = await membershipAPI.applyLateFees({
        fee_ids: overdueFees.map(fee => fee.id),
        late_fee_amount: 50
      });

      if (response.success) {
        await loadFees();
        showSuccess('Başarılı!', response.message || 'Gecikme cezaları başarıyla uygulandı');
      } else {
        showError('Hata', response.message || 'Gecikme cezaları uygulanamadı');
      }
    } catch (error: any) {
      console.error('Apply late fees error:', error);
      showError('Hata', 'Gecikme cezaları uygulanırken hata oluştu');
    }
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
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Aidat Yönetimi</h2>
            <p className="mt-2 text-gray-600">
              Kooperatif aidat ödemelerini yönetin ve takip edin.
            </p>
          </div>
          <button
            onClick={() => setShowHelpModal(true)}
            className="flex items-center justify-center w-10 h-10 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors duration-200 group"
            title="Aidat yönetimi nasıl çalışır?"
          >
            <QuestionMarkCircleIcon className="w-6 h-6 text-blue-600 group-hover:text-blue-700" />
          </button>
        </div>
      </div>

      {/* Ana İstatistikler */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Toplam Aidat</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_fees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ödenen</p>
                <p className="text-2xl font-bold text-gray-900">{stats.paid_fees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Bekleyen</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending_fees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Gecikmiş</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdue_fees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BanknotesIcon className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Toplam Gelir</p>
                <p className="text-lg font-bold text-gray-900">₺{parseFloat(stats.total_paid_amount).toLocaleString('tr-TR')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="w-8 h-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Bekleyen Tutar</p>
                <p className="text-lg font-bold text-gray-900">₺{parseFloat(stats.pending_amount).toLocaleString('tr-TR')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detaylı Analizler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Yaklaşan Vadeler */}
        {upcomingStats && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
            <div className="flex items-center mb-4">
              <CalendarIcon className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">30 Gün İçinde Vadesi Dolacaklar</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Aidat Sayısı</p>
                <p className="text-2xl font-bold text-blue-600">{upcomingStats.upcoming_count}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Toplam Tutar</p>
                <p className="text-xl font-bold text-blue-600">₺{parseFloat(upcomingStats.upcoming_amount).toLocaleString('tr-TR')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Gecikme Analizi */}
        {overdueAnalysis.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200 p-6">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Gecikme Analizi</h3>
            </div>
            <div className="space-y-3">
              {overdueAnalysis.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{item.overdue_period}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-red-600">{item.count} aidat</span>
                    <p className="text-xs text-gray-600">₺{parseFloat(item.total_amount).toLocaleString('tr-TR')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Üst Butonlar */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={handleExportExcel}
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-300"
        >
          <DocumentArrowDownIcon className="w-5 h-5" />
          Excel İndir
        </button>
        
        <button
          onClick={() => setShowCreateFeeModal(true)}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-300"
        >
          <PlusIcon className="w-5 h-5" />
          Aidat Oluştur
        </button>

        <button
          onClick={() => setShowCreatePlanModal(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-300"
        >
          <PlusIcon className="w-5 h-5" />
          Plan Oluştur
        </button>

        <button
          onClick={() => setShowPlansModal(true)}
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-300"
        >
          <DocumentTextIcon className="w-5 h-5" />
          Mevcut Planları Görüntüle
        </button>

        <button
          onClick={() => setShowBulkCreateModal(true)}
          className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-300"
        >
          <UserIcon className="w-5 h-5" />
          Toplu Aidat Oluştur
        </button>

        <button
          onClick={() => setShowAutomationModal(true)}
          className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-300"
        >
          <ClockIcon className="w-5 h-5" />
          Otomatik Aidat Ayarla
        </button>



        <button
          onClick={handleApplyLateFees}
          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-300"
        >
          <ExclamationTriangleIcon className="w-5 h-5" />
          Gecikme Cezası Uygula
        </button>
      </div>

      {/* Filtreler */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtreler</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Tümü</option>
              <option value="pending">Bekleyen</option>
              <option value="paid">Ödenen</option>
              <option value="overdue">Gecikmiş</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ay</label>
            <select
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2024, i).toLocaleDateString('tr-TR', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Yıl</label>
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <option key={year} value={year}>{year}</option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Aidat Listesi */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Aidat Listesi ({fees.length})</h3>
        </div>

        {fees.length === 0 ? (
          <div className="p-12 text-center">
            <CurrencyDollarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aidat bulunamadı</h3>
            <p className="text-gray-600">Seçili kriterlere uygun aidat kaydı bulunamadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ortak
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vade Tarihi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{fee.user_name}</p>
                          <p className="text-sm text-gray-500">{fee.user_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <button
                          onClick={() => openFeeDetailModal(fee)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline"
                        >
                          {fee.plan_name}
                          {fee.notes?.includes('taksit') && (
                            <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 rounded">
                              {fee.notes.match(/(\d+) taksit/)?.[1]} taksit
                            </span>
                          )}
                        </button>
                        <p className="text-sm text-gray-500">{fee.period_months} aylık</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">₺{fee.amount}</p>
                      {fee.late_fee > 0 && (
                        <p className="text-sm text-red-600">+₺{fee.late_fee} gecikme</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">
                          {new Date(fee.due_date).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      {fee.days_overdue > 0 && (
                        <p className="text-xs text-red-600 mt-1">
                          {fee.days_overdue} gün gecikmiş
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(fee.status)}`}>
                        {getStatusIcon(fee.status)}
                        {fee.status_text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        {fee.status !== 'paid' && (
                          <button
                            onClick={() => openPaymentModal(fee)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Ödeme Kaydet
                          </button>
                        )}
                        {fee.status !== 'paid' && (
                          <button
                            onClick={() => handleDeleteFee(fee.id, fee.plan_name)}
                            className="text-red-600 hover:text-red-900"
                            title="Aidatı Sil"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                        {fee.paid_date && (
                          <span className="text-gray-500 text-xs">
                            {new Date(fee.paid_date).toLocaleDateString('tr-TR')} tarihinde ödendi
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Aidat Oluştur Modal */}
      {showCreateFeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Yeni Aidat Oluştur</h3>
              
              <form onSubmit={handleCreateFee} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ortak *
                  </label>
                  <select
                    required
                    value={newFee.user_id}
                    onChange={(e) => setNewFee({...newFee, user_id: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Ortak seçin</option>
                    {users.filter(user => user.role === 'member').map(user => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aidat Planı *
                  </label>
                  <select
                    required
                    value={newFee.plan_id}
                    onChange={(e) => setNewFee({...newFee, plan_id: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Plan seçin</option>
                    {plans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - ₺{plan.amount} ({plan.period_months} aylık)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ödeme Tipi *
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="installments"
                        name="payment_type"
                        value="installments"
                        checked={newFee.payment_type === 'installments'}
                        onChange={(e) => setNewFee({...newFee, payment_type: e.target.value})}
                        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                      />
                      <label htmlFor="installments" className="ml-2 text-sm font-medium text-gray-700">
                        Taksitli Ödeme
                        <span className="block text-xs text-gray-500">Plan süresine göre aylık taksitler halinde</span>
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="full_payment"
                        name="payment_type"
                        value="full_payment"
                        checked={newFee.payment_type === 'full_payment'}
                        onChange={(e) => setNewFee({...newFee, payment_type: e.target.value})}
                        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                      />
                      <label htmlFor="full_payment" className="ml-2 text-sm font-medium text-gray-700">
                        Tek Seferlik Ödeme
                        <span className="block text-xs text-gray-500">Toplam tutarı tek seferde öde</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {newFee.payment_type === 'installments' ? 'İlk Taksit Tarihi' : 'Vade Tarihi'} *
                  </label>
                  <input
                    type="date"
                    required
                    value={newFee.due_date}
                    onChange={(e) => setNewFee({...newFee, due_date: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {newFee.payment_type === 'installments' && (
                    <p className="mt-1 text-xs text-gray-500">
                      Diğer taksitler otomatik olarak aylık periyotlarla oluşturulacak
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notlar
                  </label>
                  <textarea
                    rows={3}
                    value={newFee.notes}
                    onChange={(e) => setNewFee({...newFee, notes: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ek notlar yazın..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateFeeModal(false)}
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

      {/* Plan Oluştur Modal */}
      {showCreatePlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Yeni Aidat Planı</h3>
              
              <form onSubmit={handleCreatePlan} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plan Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Örn: Standart Üyelik"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tutar (₺) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newPlan.amount}
                    onChange={(e) => setNewPlan({...newPlan, amount: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="100.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Periyot (Ay) *
                  </label>
                  <select
                    required
                    value={newPlan.period_months}
                    onChange={(e) => setNewPlan({...newPlan, period_months: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="1">1 Ay</option>
                    <option value="3">3 Ay</option>
                    <option value="6">6 Ay</option>
                    <option value="12">12 Ay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama
                  </label>
                  <textarea
                    rows={3}
                    value={newPlan.description}
                    onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Plan hakkında açıklama..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreatePlanModal(false)}
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

      {/* Mevcut Planları Görüntüle Modal */}
      {showPlansModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">Mevcut Aidat Planları</h3>
                <button
                  onClick={() => setShowPlansModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {plans.length === 0 ? (
                <div className="text-center py-8">
                  <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Plan bulunamadı</h3>
                  <p className="text-gray-600">Henüz aidat planı oluşturulmamış.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <div key={plan.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">{plan.name}</h4>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <CalendarIcon className="w-3 h-3 mr-1" />
                              {plan.period_months} ay
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${plan.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {plan.is_active ? 'Aktif' : 'Pasif'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">₺{plan.amount}</p>
                            <p className="text-xs text-gray-500">
                              ₺{(plan.amount / plan.period_months).toFixed(2)}/ay
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeletePlan(plan.id, plan.name)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors duration-200"
                            title="Planı Sil"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      {plan.description && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 line-clamp-3">{plan.description}</p>
                        </div>
                      )}

                      <div className="border-t border-gray-100 pt-4">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Oluşturan: {plan.created_by_name}</span>
                          <span>{new Date(plan.created_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <DocumentTextIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-900">Plan Yönetimi</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      • Yeni plan oluşturmak için "Plan Oluştur" butonunu kullanın<br/>
                      • Aidat oluştururken bu planlardan birini seçebilirsiniz<br/>
                      • Plan tutarları otomatik olarak aidata aktarılır
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Toplam {plans.length} plan • Aktif: {plans.filter(p => p.is_active).length}
                </div>
                <button
                  onClick={() => {
                    setShowPlansModal(false);
                    setShowCreatePlanModal(true);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-300"
                >
                  <PlusIcon className="w-4 h-4" />
                  Yeni Plan Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ödeme Kaydet Modal */}
      {showPaymentModal && selectedFee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Ödeme Kaydet</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600">Aidat Bilgileri</p>
                <p className="font-medium">{selectedFee.user_name}</p>
                <p className="text-sm text-gray-600">{selectedFee.plan_name} - ₺{selectedFee.amount}</p>
                <p className="text-xs text-gray-500">
                  Vade: {new Date(selectedFee.due_date).toLocaleDateString('tr-TR')}
                </p>
              </div>
              
              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ödeme Tutarı (₺) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={payment.amount}
                    onChange={(e) => setPayment({...payment, amount: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ödeme Yöntemi
                  </label>
                  <select
                    value={payment.payment_method}
                    onChange={(e) => setPayment({...payment, payment_method: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="bank_transfer">Banka Havalesi</option>
                    <option value="credit_card">Kredi Kartı</option>
                    <option value="cash">Nakit</option>
                    <option value="check">Çek</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İşlem Numarası
                  </label>
                  <input
                    type="text"
                    value={payment.transaction_id}
                    onChange={(e) => setPayment({...payment, transaction_id: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Banka işlem numarası"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notlar
                  </label>
                  <textarea
                    rows={3}
                    value={payment.notes}
                    onChange={(e) => setPayment({...payment, notes: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ödeme ile ilgili notlar..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300"
                  >
                    Ödemeyi Kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Aidat Detay Modal */}
      {showFeeDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">
                  {feeGroupDetails.length > 1 ? 'Taksitli Aidat Detayları' : 'Aidat Detayı'}
                </h3>
                <button
                  onClick={() => setShowFeeDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              {feeGroupDetails.length > 1 && (
                <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Toplam Taksit:</span>
                      <p className="font-semibold">{feeGroupDetails.length}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Ödenen:</span>
                      <p className="font-semibold text-green-600">
                        {feeGroupDetails.filter(f => f.status === 'paid').length}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Bekleyen:</span>
                      <p className="font-semibold text-yellow-600">
                        {feeGroupDetails.filter(f => f.status === 'pending').length}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Toplam Tutar:</span>
                      <p className="font-semibold">
                        ₺{feeGroupDetails.reduce((sum, f) => sum + parseFloat(f.amount.toString()), 0).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {feeGroupDetails.map((fee, index) => (
                  <div
                    key={fee.id}
                    className={`border rounded-xl p-4 ${
                      fee.status === 'paid' 
                        ? 'bg-green-50 border-green-200' 
                        : fee.status === 'pending' && new Date(fee.due_date) < new Date()
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {feeGroupDetails.length > 1 ? `${index + 1}. Taksit` : fee.plan_name}
                          </h4>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(fee.status)}`}>
                            {getStatusIcon(fee.status)}
                            {fee.status_text}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Tutar:</span>
                            <p className="font-semibold text-lg">₺{parseFloat(fee.amount.toString()).toLocaleString('tr-TR')}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Vade Tarihi:</span>
                            <p className="font-medium">{new Date(fee.due_date).toLocaleDateString('tr-TR')}</p>
                            {fee.days_overdue > 0 && (
                              <p className="text-red-600 text-xs mt-1">
                                {fee.days_overdue} gün gecikmiş
                              </p>
                            )}
                          </div>
                          {fee.paid_date && (
                            <div>
                              <span className="text-gray-600">Ödeme Tarihi:</span>
                              <p className="font-medium text-green-600">
                                {new Date(fee.paid_date).toLocaleDateString('tr-TR')}
                              </p>
                            </div>
                          )}
                        </div>

                        {fee.notes && (
                          <div className="mt-3">
                            <span className="text-gray-600">Notlar:</span>
                            <p className="text-sm text-gray-800 mt-1">{fee.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {fee.status !== 'paid' && (
                          <>
                            <button
                              onClick={() => {
                                setShowFeeDetailModal(false);
                                openPaymentModal(fee);
                              }}
                              className="text-green-600 hover:text-green-900 text-sm font-medium"
                            >
                              Ödeme Kaydet
                            </button>
                            <button
                              onClick={() => {
                                setShowFeeDetailModal(false);
                                handleDeleteFee(fee.id, fee.plan_name);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Taksiti Sil"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {feeGroupDetails.length > 1 && feeGroupDetails.filter(f => f.status === 'pending').length > 1 && (
                <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">Toplu Ödeme</h4>
                  <p className="text-sm text-purple-800 mb-3">
                    Bekleyen {feeGroupDetails.filter(f => f.status === 'pending').length} taksiti aynı anda ödeyebilirsiniz.
                  </p>
                  <button
                    onClick={() => {
                      setShowFeeDetailModal(false);
                      openBulkPaymentModal(feeGroupDetails.filter(f => f.status === 'pending'));
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Toplu Ödeme Yap
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {feeGroupDetails.length > 1 ? (
                    <>
                      {feeGroupDetails[0].user_name} - {feeGroupDetails[0].plan_name} 
                      ({feeGroupDetails[0].period_months} aylık plan)
                    </>
                  ) : (
                    <>
                      {feeGroupDetails[0].user_name} - Tek seferlik ödeme
                    </>
                  )}
                </div>
                <button
                  onClick={() => setShowFeeDetailModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toplu Ödeme Modal */}
      {showBulkPaymentModal && selectedFeeGroup.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Toplu Ödeme Kaydet</h3>
                <button
                  onClick={() => setShowBulkPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">Ödeme Bilgileri</p>
                <p className="font-medium">{selectedFeeGroup[0]?.user_name}</p>
                <p className="text-sm text-gray-600">{selectedFeeGroup[0]?.plan_name} - {selectedFeeGroup.length} taksit</p>
                <p className="text-lg font-bold text-purple-600 mt-2">
                  Toplam: ₺{selectedFeeGroup.reduce((sum, fee) => sum + parseFloat(fee.amount.toString()), 0).toLocaleString('tr-TR')}
                </p>
              </div>
              
              <form onSubmit={handleRecordBulkPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Toplam Ödeme Tutarı (₺) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={payment.amount}
                    onChange={(e) => setPayment({...payment, amount: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ödeme Yöntemi
                  </label>
                  <select
                    value={payment.payment_method}
                    onChange={(e) => setPayment({...payment, payment_method: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="bank_transfer">Banka Havalesi</option>
                    <option value="credit_card">Kredi Kartı</option>
                    <option value="cash">Nakit</option>
                    <option value="check">Çek</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İşlem Numarası
                  </label>
                  <input
                    type="text"
                    value={payment.transaction_id}
                    onChange={(e) => setPayment({...payment, transaction_id: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Banka işlem numarası"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notlar
                  </label>
                  <textarea
                    rows={3}
                    value={payment.notes}
                    onChange={(e) => setPayment({...payment, notes: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ek notlar..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBulkPaymentModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300"
                  >
                    Toplu Ödeme Kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toplu Aidat Oluşturma Modal */}
      {showBulkCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Toplu Aidat Oluştur</h3>
                <button
                  onClick={() => setShowBulkCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleBulkCreateFees} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Aidat Planı *</label>
                  <select
                    value={bulkCreateData.plan_id}
                    onChange={(e) => setBulkCreateData({...bulkCreateData, plan_id: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Plan Seçin</option>
                    {plans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - ₺{plan.amount} ({plan.period_months} aylık)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vade Tarihi *</label>
                  <input
                    type="date"
                    value={bulkCreateData.due_date}
                    onChange={(e) => setBulkCreateData({...bulkCreateData, due_date: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hedef Ortaklar</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={bulkCreateData.user_filter.length === 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBulkCreateData({...bulkCreateData, user_filter: []});
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium">Tüm Aktif Ortaklar</span>
                    </label>
                    {users.filter(u => u.role === 'member' && u.is_active).map(user => (
                      <label key={user.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={bulkCreateData.user_filter.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBulkCreateData({
                                ...bulkCreateData, 
                                user_filter: [...bulkCreateData.user_filter, user.id]
                              });
                            } else {
                              setBulkCreateData({
                                ...bulkCreateData, 
                                user_filter: bulkCreateData.user_filter.filter(id => id !== user.id)
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{user.first_name} {user.last_name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notlar</label>
                  <textarea
                    rows={3}
                    value={bulkCreateData.notes}
                    onChange={(e) => setBulkCreateData({...bulkCreateData, notes: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Bu aidat için özel notlar..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBulkCreateModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300"
                  >
                    Toplu Aidat Oluştur
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Otomatik Aidat Ayarları Modal */}
      {showAutomationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Otomatik Aidat Ayarları</h3>
                <button
                  onClick={() => setShowAutomationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSetAutomation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Aidat Planı *</label>
                  <select
                    value={automationData.plan_id}
                    onChange={(e) => setAutomationData({...automationData, plan_id: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  >
                    <option value="">Plan Seçin</option>
                    {plans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - ₺{plan.amount} ({plan.period_months} aylık)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ayın Hangi Günü Oluşturulsun? *</label>
                  <select
                    value={automationData.auto_create_day}
                    onChange={(e) => setAutomationData({...automationData, auto_create_day: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  >
                    <option value="">Gün Seçin</option>
                    {Array.from({length: 28}, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>
                        {day}. gün
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={automationData.is_active}
                      onChange={(e) => setAutomationData({...automationData, is_active: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Otomatik oluşturma aktif</span>
                  </label>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="text-sm font-medium text-yellow-800">Uyarı</span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    Otomatik aidat oluşturma sadece aktif ortaklar için çalışır. 
                    Aynı aya ait mevcut aidat varsa tekrar oluşturulmaz.
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAutomationModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300"
                  >
                    Ayarları Kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Yardım Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                    <QuestionMarkCircleIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Aidat Yönetimi Nasıl Çalışır?</h3>
                    <p className="text-sm text-gray-600 mt-1">Kooperatif aidat sistemi hakkında detaylar</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Temel Adımlar */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                    Temel Adımlar
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</div>
                        <div>
                          <span className="font-semibold text-blue-900">Aidat Planları Oluşturun</span>
                          <p className="text-sm text-blue-700 mt-1">Aylık, 3 aylık, yıllık gibi farklı dönemler için planlar oluşturun</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</div>
                        <div>
                          <span className="font-semibold text-blue-900">Aidat Ataması Yapın</span>
                          <p className="text-sm text-blue-700 mt-1">Ortaklara uygun planı atayın ve vade tarihi belirleyin</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</div>
                        <div>
                          <span className="font-semibold text-blue-900">Ödeme Takibi</span>
                          <p className="text-sm text-blue-700 mt-1">Ödemeleri kaydederek aidat durumunu güncel tutun</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</div>
                        <div>
                          <span className="font-semibold text-blue-900">Raporlama</span>
                          <p className="text-sm text-blue-700 mt-1">Detaylı raporlar ve analizlerle mali durumu takip edin</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gelişmiş Özellikler */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                    <BoltIcon className="w-5 h-5 mr-2" />
                    Gelişmiş Özellikler
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <UserIcon className="w-4 h-4 text-green-600 mr-2" />
                        <span className="font-medium text-green-900">Toplu Aidat Oluştur</span>
                      </div>
                      <p className="text-sm text-green-700 ml-6">Tüm ortaklara veya seçili gruplara aynı anda aidat oluşturun</p>
                      
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 text-green-600 mr-2" />
                        <span className="font-medium text-green-900">Otomatik Aidat</span>
                      </div>
                      <p className="text-sm text-green-700 ml-6">Ayın belirli günlerinde otomatik olarak aidat oluşturun</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <BanknotesIcon className="w-4 h-4 text-green-600 mr-2" />
                        <span className="font-medium text-green-900">Hatırlatma Sistemi</span>
                      </div>
                      <p className="text-sm text-green-700 ml-6">Vade yaklaştığında otomatik e-mail hatırlatmaları gönderin</p>
                      
                      <div className="flex items-center">
                        <ExclamationTriangleIcon className="w-4 h-4 text-green-600 mr-2" />
                        <span className="font-medium text-green-900">Gecikme Cezası</span>
                      </div>
                      <p className="text-sm text-green-700 ml-6">Gecikmiş aidatlara otomatik olarak geç ödeme cezası uygulayın</p>
                    </div>
                  </div>
                </div>

                {/* Ödeme Tipleri */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                    <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                    Ödeme Tipleri
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 mt-2"></div>
                      <div>
                        <span className="font-medium text-purple-900">Taksitli Ödeme:</span>
                        <span className="text-purple-700 ml-2">Plan süresine göre aylık taksitler halinde bölünür</span>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 mt-2"></div>
                      <div>
                        <span className="font-medium text-purple-900">Tek Seferlik Ödeme:</span>
                        <span className="text-purple-700 ml-2">Toplam tutarı tek seferde ödeme</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* İpuçları */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-amber-900 mb-4 flex items-center">
                    <BoltIcon className="w-5 h-5 mr-2" />
                    Pratik İpuçları
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-3 mt-2"></div>
                      <span className="text-sm text-amber-800">Excel formatında rapor alabilir ve toplu işlemler yapabilirsiniz</span>
                    </div>
                    <div className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-3 mt-2"></div>
                      <span className="text-sm text-amber-800">Filtreleri kullanarak belirli dönem veya durumları kolayca görüntüleyebilirsiniz</span>
                    </div>
                    <div className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-3 mt-2"></div>
                      <span className="text-sm text-amber-800">Yaklaşan vadeler ve gecikme analizleriyle proaktif yönetim yapabilirsiniz</span>
                    </div>
                    <div className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-3 mt-2"></div>
                      <span className="text-sm text-amber-800">Otomatik sistemler sayesinde manuel işlem yükünü azaltabilirsiniz</span>
                    </div>
                  </div>
                </div>

                {/* Kapatma Butonu */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setShowHelpModal(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                  >
                    Anladım
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 