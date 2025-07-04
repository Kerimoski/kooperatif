'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/hooks/useNotification';
import {
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  BanknotesIcon,
  ArrowLeftIcon
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

interface MemberStats {
  total_fees: string;
  paid_fees: string;
  pending_fees: string;
  overdue_fees: string;
  total_paid_amount: string;
  pending_amount: string;
  overdue_amount: string;
}

export default function MemberFeesPage() {
  const router = useRouter();
  const { showError } = useNotification();
  const [fees, setFees] = useState<MembershipFee[]>([]);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cache-busting için timestamp ekle
      const timestamp = new Date().getTime();
      
      const [feesResponse, statsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/membership/fees/user?_t=${timestamp}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }).then(res => res.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/membership/member-stats?_t=${timestamp}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }).then(res => res.json())
      ]);

      if (feesResponse.success) {
        setFees(feesResponse.data);
      }
      if (statsResponse.success) {
        setStats(statsResponse.data.stats);
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
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CurrencyDollarIcon className="w-8 h-8 mr-3" />
            <div>
              <h2 className="text-3xl font-bold text-white">Aidat Bilgilerim</h2>
              <p className="mt-2 text-emerald-100">
                Aidat ödemelerinizi ve mali durumunuzu görüntüleyin.
              </p>
            </div>
          </div>
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="group flex items-center px-4 py-2 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg 
              className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-300`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="font-medium">Yenile</span>
          </button>
        </div>
      </div>

      {/* Mali Durum Özeti */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
            <div className="flex items-center mb-4">
              <BanknotesIcon className="w-8 h-8 text-green-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Toplam Ödenen</h3>
            </div>
            <p className="text-4xl font-bold text-green-600">
              ₺{parseFloat(stats.total_paid_amount || '0').toLocaleString('tr-TR')}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {stats.paid_fees} adet ödeme
            </p>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 p-6">
            <div className="flex items-center mb-4">
              <ClockIcon className="w-8 h-8 text-yellow-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Bekleyen Borç</h3>
            </div>
            <p className="text-4xl font-bold text-yellow-600">
              ₺{parseFloat(stats.pending_amount || '0').toLocaleString('tr-TR')}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {stats.pending_fees} bekleyen + {stats.overdue_fees} gecikmiş
            </p>
          </div>
        </div>
      )}

      {/* Aidat Geçmişi */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <CalendarIcon className="w-6 h-6 mr-2 text-emerald-600" />
            Tüm Aidat Geçmişim ({fees.length})
          </h3>
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
                  <tr key={fee.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{fee.plan_name}</div>
                      {fee.notes && (
                        <div className="text-sm text-gray-500 truncate max-w-xs" title={fee.notes}>
                          {fee.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        ₺{parseFloat(fee.amount.toString()).toLocaleString('tr-TR')}
                      </div>
                      {fee.late_fee > 0 && (
                        <div className="text-sm text-red-600">
                          + ₺{parseFloat(fee.late_fee.toString()).toLocaleString('tr-TR')} gecikme
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(fee.due_date).toLocaleDateString('tr-TR')}
                      {fee.days_overdue > 0 && (
                        <div className="text-xs text-red-600">
                          {fee.days_overdue} gün gecikmiş
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(fee.status)}`}>
                        {getStatusIcon(fee.status)}
                        <span className="ml-1">{fee.status_text}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {fee.paid_date ? (
                        <div className="text-green-600 font-medium">
                          {new Date(fee.paid_date).toLocaleDateString('tr-TR')}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 