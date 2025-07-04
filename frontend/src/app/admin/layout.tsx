'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { tokenManager } from '@/lib/api';
import { User } from '@/types';
import Link from 'next/link';
import { NotificationProvider } from '@/hooks/useNotification';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Kullanıcı kontrolü
    if (!tokenManager.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const userData = tokenManager.getUser();
    if (!userData || userData.role !== 'admin') {
      router.push('/login');
      return;
    }

    setUser(userData);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    tokenManager.logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Navigation */}
        <nav className="bg-white/90 backdrop-blur-lg shadow-xl border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 md:h-20">
              {/* Logo and Title */}
            <div className="flex items-center">
              <Link href="/admin" className="flex items-center">
                <div className="flex-shrink-0">
                    <img 
                      src="/bbomizmir_logo.png" 
                      alt="BBOM İzmir Logo" 
                      className="w-8 h-8 md:w-10 md:h-10 object-contain"
                    />
                  </div>
                  <div className="ml-3 md:ml-4 hidden sm:block">
                    <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    BBOM İzmir
                  </h1>
                    <p className="text-xs md:text-sm text-gray-500">Admin Paneli</p>
                </div>
              </Link>
            </div>

              {/* Desktop Menu */}
              <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-gray-500">Yönetici</p>
              </div>
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-xs lg:text-sm">
                    {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 lg:px-6 py-2 rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm"
                >
                  Çıkış Yap
                </button>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900 p-2"
                >
                  {mobileMenuOpen ? (
                    <XMarkIcon className="h-6 w-6" />
                  ) : (
                    <Bars3Icon className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-lg">
                <div className="px-2 pt-2 pb-3 space-y-1">
                  <div className="px-3 py-2 text-center border-b border-gray-200">
                    <div className="flex items-center justify-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                </span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-gray-500">Yönetici</p>
                      </div>
                    </div>
              </div>
              <button
                onClick={handleLogout}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg text-sm mx-2"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
            )}
        </div>
      </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-4 md:py-8 px-4 sm:px-6 lg:px-8">
          <div className="py-2 md:py-6">
            {children}
          </div>
        </main>
      </div>
    </NotificationProvider>
  );
} 