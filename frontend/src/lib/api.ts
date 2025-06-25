import axios from 'axios';
import { LoginData, CreateUserData, User, Commission, ApiResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Axios instance oluştur
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Token manager
export const tokenManager = {
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  },

  setToken: (token: string, user: User): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  removeToken: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  getUser: (): User | null => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  },

  isAuthenticated: (): boolean => {
    return !!tokenManager.getToken();
  },

  logout: (): void => {
    tokenManager.removeToken();
  }
};

// Request interceptor - her isteğe token ekle
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - 401 hatalarında logout yap
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenManager.logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (data: LoginData) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  register: async (data: CreateUserData) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateUser: async (userId: number, data: any) => {
    const response = await api.put(`/auth/users/${userId}`, data);
    return response.data;
  },

  deactivateUser: async (userId: number) => {
    const response = await api.patch(`/auth/users/${userId}/deactivate`);
    return response.data;
  },

  deleteUser: async (userId: number) => {
    const response = await api.delete(`/auth/users/${userId}`);
    return response.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  }
};

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getAllUsers: async () => {
    const response = await api.get('/dashboard/users');
    return response.data;
  }
};

// Commission API
export const commissionAPI = {
  getAll: async () => {
    const response = await api.get('/commissions');
    return response.data;
  },

  create: async (data: { name: string; description: string; max_members: number }) => {
    const response = await api.post('/commissions', data);
    return response.data;
  },

  update: async (id: number, data: { name: string; description: string; max_members: number; is_active: boolean }) => {
    const response = await api.put(`/commissions/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/commissions/${id}`);
    return response.data;
  },

  getMembers: async (commissionId: number) => {
    const response = await api.get(`/commissions/${commissionId}/members`);
    return response.data;
  },

  addMember: async (commissionId: number, userId: number, role: string = 'member') => {
    const response = await api.post(`/commissions/${commissionId}/members`, { userId, role });
    return response.data;
  },

  removeMember: async (commissionId: number, userId: number) => {
    const response = await api.delete(`/commissions/${commissionId}/members/${userId}`);
    return response.data;
  },

  // Komisyon linkleri
  getLinks: async (commissionId: number) => {
    const response = await api.get(`/commissions/${commissionId}/links`);
    return response.data;
  },

  addLink: async (commissionId: number, data: { title: string; url: string; description?: string }) => {
    const response = await api.post(`/commissions/${commissionId}/links`, data);
    return response.data;
  },

  updateLink: async (commissionId: number, linkId: number, data: { title: string; url: string; description?: string }) => {
    const response = await api.put(`/commissions/${commissionId}/links/${linkId}`, data);
    return response.data;
  },

  deleteLink: async (commissionId: number, linkId: number) => {
    const response = await api.delete(`/commissions/${commissionId}/links/${linkId}`);
    return response.data;
  }
};

// Member API (üye işlemleri)
export const memberAPI = {
  getDashboard: async () => {
    const response = await api.get('/member/dashboard');
    return response.data;
  },

  getAvailableCommissions: async () => {
    const response = await api.get('/member/commissions/available');
    return response.data;
  },

  joinCommission: async (commissionId: number) => {
    const response = await api.post(`/member/commissions/${commissionId}/join`);
    return response.data;
  },

  leaveCommission: async (commissionId: number) => {
    const response = await api.delete(`/member/commissions/${commissionId}/leave`);
    return response.data;
  },

  getCommissionDetail: async (commissionId: number) => {
    const response = await api.get(`/member/commissions/${commissionId}/detail`);
    return response.data;
  }
};

// Membership API (Aidat sistemi)
export const membershipAPI = {
  // Aidat planları
  getPlans: async () => {
    const response = await api.get('/membership/plans');
    return response.data;
  },

  createPlan: async (data: { name: string; amount: number; period_months: number; description?: string }) => {
    const response = await api.post('/membership/plans', data);
    return response.data;
  },

  deletePlan: async (planId: number) => {
    const response = await api.delete(`/membership/plans/${planId}`);
    return response.data;
  },

  // Aidatlar
  getAllFees: async (params?: { status?: string; month?: number; year?: number }) => {
    const response = await api.get('/membership/fees', { params });
    return response.data;
  },

  getUserFees: async (targetUserId?: number) => {
    const endpoint = targetUserId ? `/membership/fees/user/${targetUserId}` : '/membership/fees/user';
    const response = await api.get(endpoint);
    return response.data;
  },

  createFee: async (data: { user_id: number; plan_id: number; due_date: string; notes?: string; payment_type?: string }) => {
    const response = await api.post('/membership/fees', data);
    return response.data;
  },

  deleteFee: async (feeId: number) => {
    const response = await api.delete(`/membership/fees/${feeId}`);
    return response.data;
  },

  getFeeGroup: async (userId: number, planId: number) => {
    const response = await api.get(`/membership/fees/group/${userId}/${planId}`);
    return response.data;
  },

  getMemberStats: async () => {
    const response = await api.get('/membership/member-stats');
    return response.data;
  },

  // Ödemeler
  recordPayment: async (data: { 
    membership_fee_id: number; 
    amount: number; 
    payment_method?: string; 
    transaction_id?: string; 
    notes?: string 
  }) => {
    const response = await api.post('/membership/payments', data);
    return response.data;
  },

  recordBulkPayment: async (data: {
    fee_ids: number[];
    payment_method?: string;
    transaction_id?: string;
    notes?: string;
  }) => {
    const response = await api.post('/membership/payments/bulk', data);
    return response.data;
  },

  // İstatistikler
  getStats: async () => {
    const response = await api.get('/membership/stats');
    return response.data;
  },

  // Gelişmiş Aidat Yönetimi
  createBulkFees: async (data: { 
    plan_id: number; 
    due_date: string; 
    notes?: string; 
    user_filter?: number[] 
  }) => {
    const response = await api.post('/membership/fees/bulk', data);
    return response.data;
  },

  applyLateFees: async (data: { fee_ids: number[]; late_fee_amount: number }) => {
    const response = await api.post('/membership/fees/late-fee', data);
    return response.data;
  },



  // Otomatik Aidat Sistemi
  getAutomaticFees: async () => {
    const response = await api.get('/membership/automatic');
    return response.data;
  },

  setAutomaticFees: async (data: { 
    plan_id: number; 
    auto_create_day: number; 
    is_active: boolean; 
    target_users?: number[] 
  }) => {
    const response = await api.post('/membership/automatic', data);
    return response.data;
  }
};

// Mail API
export const mailAPI = {
  // Duyuru gönderme
  sendAnnouncement: async (data: {
    subject: string;
    message: string;
    target_users?: number[];
    sender_name?: string;
  }) => {
    const response = await api.post('/mail/announcement', data);
    return response.data;
  },

  // Aidat hatırlatması gönderme
  sendFeeReminders: async (data?: {
    days_before?: number;
    include_overdue?: boolean;
  }) => {
    const response = await api.post('/mail/fee-reminders', data || {});
    return response.data;
  },

  // Mail geçmişi
  getHistory: async (params?: {
    page?: number;
    limit?: number;
    mail_type?: string;
    status?: string;
  }) => {
    const response = await api.get('/mail/history', { params });
    return response.data;
  },

  // Mail istatistikleri
  getStats: async () => {
    const response = await api.get('/mail/stats');
    return response.data;
  }
};

export default api; 