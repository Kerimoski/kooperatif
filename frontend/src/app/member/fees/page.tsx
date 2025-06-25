'use client';

import { useState, useEffect } from 'react';
import { membershipAPI } from '@/lib/api';
import { useNotification } from '@/hooks/useNotification';
import {
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  ChartBarIcon,
  CreditCardIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

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
}

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

interface MemberStats {
  total_fees: string;
  paid_fees: string;
  pending_fees: string;
  overdue_fees: string;
  total_paid_amount: string;
  pending_amount: string;
  overdue_amount: string;
}

interface LastPayment {
  payment_date: string;
  amount: string;
  payment_method: string;
  fee_description: string;
}

interface UpcomingFee {
  id: number;
  amount: string;
  due_date: string;
  notes: string;
  plan_name: string;
}

interface PaymentHistory {
  year: string;
  month: string;
  payment_count: string;
  total_amount: string;
}

export default function MemberFeesPage() {
  const { showError } = useNotification();
  const [fees, setFees] = useState<MembershipFee[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [lastPayment, setLastPayment] = useState<LastPayment | null>(null);
  const [upcomingFees, setUpcomingFees] = useState<UpcomingFee[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [feesResponse, plansResponse, statsResponse] = await Promise.all([
        membershipAPI.getUserFees(),
        membershipAPI.getPlans(),
        membershipAPI.getMemberStats()
      ]);

      if (feesResponse.success) {
        setFees(feesResponse.data);
      }
      if (plansResponse.success) {
        setPlans(plansResponse.data);
      }
      if (statsResponse.success) {
        setStats(statsResponse.data.stats);
        setLastPayment(statsResponse.data.last_payment);
        setUpcomingFees(statsResponse.data.upcoming_fees);
        setPaymentHistory(statsResponse.data.payment_history);
      }
    } catch (error: any) {
      console.error('Load data error:', error);
      showError('Hata', 'Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircleIcon className="w-5 h-5" />;
      case 'pending': return <ClockIcon className="w-5 h-5" />;
      case 'overdue': return <ExclamationTriangleIcon className="w-5 h-5" />;
      default: return <ClockIcon className="w-5 h-5" />;
    }
  };

  const getPaymentMethodName = (method: string) => {
    const methods: { [key: string]: string } = {
      'bank_transfer': 'Banka Havalesi',
      'credit_card': 'Kredi Kartı',
      'cash': 'Nakit',
      'check': 'Çek'
    };
    return methods[method] || method;
  };

  const getMonthName = (month: string) => {
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return months[parseInt(month) - 1];
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
        <h2 className="text-3xl font-bold text-gray-900">Aidat Bilgilerim</h2>
        <p className="mt-2 text-gray-600">
          Aidat ödemelerinizi ve planlarınızı görüntüleyin.
        </p>
      </div>

      {/* Ana İstatistikler */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
        </div>
      )}

      {/* Mali Durum ve Son Ödeme */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
            <div className="flex items-center mb-4">
              <BanknotesIcon className="w-6 h-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Toplam Ödenen</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">₺{parseFloat(stats.total_paid_amount).toLocaleString('tr-TR')}</p>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 p-6">
            <div className="flex items-center mb-4">
              <CurrencyDollarIcon className="w-6 h-6 text-yellow-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Bekleyen Borç</h3>
            </div>
            <p className="text-3xl font-bold text-yellow-600">₺{parseFloat(stats.pending_amount).toLocaleString('tr-TR')}</p>
          </div>

          {lastPayment && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
              <div className="flex items-center mb-4">
                <CreditCardIcon className="w-6 h-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Son Ödeme</h3>
              </div>
              <p className="text-xl font-bold text-blue-600">₺{parseFloat(lastPayment.amount).toLocaleString('tr-TR')}</p>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(lastPayment.payment_date).toLocaleDateString('tr-TR')} - {getPaymentMethodName(lastPayment.payment_method)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Yaklaşan Vadeler */}
      {upcomingFees.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200 p-6 mb-8">
          <div className="flex items-center mb-4">
            <CalendarIcon className="w-6 h-6 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">30 Gün İçinde Vadesi Dolacak Aidatlarım</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingFees.map((fee) => (
              <div key={fee.id} className="bg-white rounded-lg p-4 border border-orange-200">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">{fee.plan_name}</h4>
                  <span className="text-lg font-bold text-orange-600">₺{parseFloat(fee.amount).toLocaleString('tr-TR')}</span>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  Vade: {new Date(fee.due_date).toLocaleDateString('tr-TR')}
                </p>
                {fee.notes && (
                  <p className="text-xs text-gray-500">{fee.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ödeme Geçmişi */}
      {paymentHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center mb-6">
            <ArrowTrendingUpIcon className="w-6 h-6 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Son 12 Ay Ödeme Geçmişi</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paymentHistory.map((item) => (
              <div key={`${item.year}-${item.month}`} className="bg-gray-50 rounded-lg p-4">
                <div className="text-center">
                  <h4 className="font-semibold text-gray-900">{getMonthName(item.month)} {item.year}</h4>
                  <p className="text-2xl font-bold text-purple-600">₺{parseFloat(item.total_amount).toLocaleString('tr-TR')}</p>
                  <p className="text-sm text-gray-600">{item.payment_count} ödeme</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aidat Listesi */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Tüm Aidat Geçmişim ({fees.length})</h3>
        </div>

        {fees.length === 0 ? (
          <div className="p-12 text-center">
            <CurrencyDollarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz aidat kaydınız yok</h3>
            <p className="text-gray-600">Aidat bilgileriniz burada görünecektir.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                    Ödeme Tarihi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{fee.plan_name}</p>
                        {fee.notes && (
                          <p className="text-sm text-gray-500">{fee.notes}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">₺{fee.amount.toLocaleString('tr-TR')}</p>
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
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(fee.status)}`}>
                        {getStatusIcon(fee.status)}
                        {fee.status_text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {fee.paid_date ? new Date(fee.paid_date).toLocaleDateString('tr-TR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mevcut Planlar */}
      {plans.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Mevcut Aidat Planları</h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <div key={plan.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
                    <span className="text-lg font-bold text-green-600">₺{plan.amount.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      {plan.period_months} aylık
                    </div>
                    {plan.description && (
                      <p className="text-sm text-gray-600">{plan.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bilgilendirme */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <InformationCircleIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-blue-900">Ödeme Bilgilendirmesi</h3>
            <div className="mt-2 text-sm text-blue-800 space-y-2">
              <p>• Aidat ödemelerinizi zamanında yapmayı unutmayın.</p>
              <p>• Ödeme ile ilgili sorularınız için yönetim ile iletişime geçebilirsiniz.</p>
              <p>• Ödeme yöntemleri ve detayları için admin paneli ile koordinasyon sağlanır.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 