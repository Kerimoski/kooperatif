export interface User {
  id: number;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  profession?: string;
  role: 'admin' | 'member';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  profession?: string;
  role?: 'admin' | 'member';
}

export interface UpdateUserData {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profession?: string;
  is_active?: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UserResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  profession?: string;
  role: 'admin' | 'member';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
} 