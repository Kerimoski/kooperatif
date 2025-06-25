'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { tokenManager } from '@/lib/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Eğer kullanıcı giriş yapmışsa, rolüne göre yönlendir
    if (tokenManager.isAuthenticated()) {
      const user = tokenManager.getUser();
      if (user?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/member');
      }
    } else {
      // Giriş yapmamışsa login sayfasına yönlendir
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-3 md:mt-4 text-sm md:text-base text-gray-600">Yönlendiriliyor...</p>
        </div>
    </div>
  );
}
