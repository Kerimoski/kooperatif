'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, tokenManager } from '@/lib/api';
import { LoginData } from '@/types';
import dynamic from 'next/dynamic';
import {
  EnvelopeIcon,
  LockClosedIcon,
  XMarkIcon,
  RocketLaunchIcon,
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

// Lottie component'ini dynamic import ile yüklüyoruz
const Lottie = dynamic(() => import('react-lottie-player'), { ssr: false });

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [animationData, setAnimationData] = useState(null);
  const router = useRouter();

  // Client-side rendering ve animasyon yükleme
  useEffect(() => {
    setMounted(true);
    
    // Animasyon verisini yükle
    const loadAnimation = async () => {
      try {
        const response = await fetch('/animations/koop.json');
        if (response.ok) {
          const data = await response.json();
          setAnimationData(data);
        }
      } catch (error) {
        console.log('Animasyon yüklenemedi:', error);
      }
    };

    loadAnimation();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Email validasyonu
    if (!formData.email || !formData.email.includes('@')) {
      setError('Lütfen geçerli bir email adresi girin');
      setLoading(false);
      return;
    }

    // Şifre validasyonu
    if (!formData.password || formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.login(formData);
      
      if (response.success) {
        // Token ve kullanıcı bilgilerini kaydet
        tokenManager.setToken(response.data.token, response.data.user);
        
        // Kullanıcı rolüne göre yönlendir
        if (response.data.user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/member');
        }
      } else {
        setError(response.message || 'Email adresi veya şifre hatalı. Lütfen kontrol ederek tekrar deneyin.');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        setError('Email adresi veya şifre hatalı. Lütfen kontrol ederek tekrar deneyin.');
      } else if (error.response?.status === 404) {
        setError('Bu email adresi ile kayıtlı bir kullanıcı bulunamadı.');
      } else if (error.response?.status === 403) {
        setError('Hesabınız deaktif edilmiş. Lütfen yönetici ile iletişime geçin.');
      } else {
        setError(error.response?.data?.message || 'Giriş yaparken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };



  if (!mounted) {
    return null; // SSR sırasında hiçbir şey render etme
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-blue-500/20"></div>
        {/* Animated particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Panel - Animation & Info */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 text-white">
          <div className="max-w-md text-center">
            {/* Lottie Animation */}
            <div className="w-80 h-80 mx-auto mb-8">
              {animationData ? (
                <Lottie
                  loop
                  animationData={animationData}
                  play
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
                    <SparklesIcon className="w-10 h-10 text-white" />
                  </div>
                </div>
              )}
            </div>
            
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
             Başka Bir Okul Mümkün Eğitim Kooperatifi 
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Eğitimde işbirliği, gelişimde birliktelik. Geleceği birlikte inşa ediyoruz.
            </p>
            
            {/* Features */}
            <div className="space-y-4 text-left">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-4"></div>
                <span className="text-blue-100">Demokratik yönetim sistemi</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-4"></div>
                <span className="text-blue-100">Şeffaf komisyon süreçleri</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-pink-400 rounded-full mr-4"></div>
                <span className="text-blue-100">Dijital belge yönetimi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
                <img 
                  src="/bbomizmir_logo.png" 
                  alt="BBOM İzmir Logo" 
                  className="w-12 h-12 object-contain"
                />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
            Eğitim Kooperatifi
          </h2>
              <p className="text-blue-200">Hesabınıza giriş yapın</p>
            </div>

            {/* Login Card */}
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 lg:p-10">
              <div className="hidden lg:block text-center mb-8">
                <div className="flex justify-center mb-4">
                  <img 
                    src="/bbomizmir_logo.png" 
                    alt="BBOM İzmir Logo" 
                    className="h-16 w-auto object-contain"
                  />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Hoş Geldiniz</h2>
                <p className="text-gray-600">Hesabınıza giriş yapın</p>
        </div>
        
          <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-5">
                  {/* Email Input */}
                  <div className="group">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email adresi
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                        className="w-full px-4 py-4 pl-12 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-gray-50 group-hover:bg-white group-focus-within:bg-white"
                    placeholder="ornek@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                  />
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                        <EnvelopeIcon className="w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                  </div>
                </div>
              </div>
              
                  {/* Password Input */}
                  <div className="group">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Şifre
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                        type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                        className="w-full px-4 py-4 pl-12 pr-12 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-gray-50 group-hover:bg-white group-focus-within:bg-white"
                    placeholder="Şifreniz"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                  />
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                        <LockClosedIcon className="w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                  </div>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-purple-500 transition-colors"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </button>
                </div>
              </div>
            </div>

                {/* Error Message */}
            {error && (
                  <div className="rounded-2xl bg-red-50 border border-red-200 p-4 animate-fade-in">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <XMarkIcon className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

                {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                  className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-base font-semibold rounded-2xl text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Giriş yapılıyor...
                  </div>
                ) : (
                  <div className="flex items-center">
                      <RocketLaunchIcon className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                    Giriş Yap
                  </div>
                )}
              </button>


              </form> 
            </div>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-sm text-blue-200">
                © 2025 BBOM Eğitim Kooperatifi. Tüm hakları saklıdır.
                </p>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
} 