'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  TagIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface Document {
  id: number;
  title: string;
  file_name: string;
  file_path: string;
  category: string;
  uploaded_at: string;
  file_size: number;
}

const DOCUMENT_CATEGORIES = [
  'Anasözleşme',
  'Genel Kurul Kararları',
  'Ortak Bilgileri',
  'Karşılama Dosyaları',
  'Faaliyet ve Mali Raporlar',
  'Pedagoji İlkeleri',
  'Diğer'
];

export default function MemberDocuments() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  // Modal artık kullanılmıyor - direkt PDF açılıyor

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'mevcut' : 'yok');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        setDocuments(data.data || []);
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`API yanıtı başarısız: ${errorData.message || response.status}`);
      }
    } catch (error) {
      console.error('Belgeler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePreview = async (document: Document) => {
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

  const filteredDocuments = documents
    .filter(doc => selectedCategory === '' || doc.category === selectedCategory)
    .filter(doc => 
      searchTerm === '' || 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Belgeler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
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
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold flex items-center">
              <DocumentTextIcon className="w-6 h-6 md:w-8 md:h-8 mr-2 md:mr-3" />
              Kooperatif Belgeleri
            </h1>
            <p className="text-emerald-100 text-sm md:text-base mt-1">
              Anasözleşme, tutanaklar ve önemli belgeler
            </p>
          </div>
          <div className="bg-white/20 rounded-lg px-3 py-2">
            <span className="text-emerald-100 text-sm font-semibold">
              {filteredDocuments.length} Belge
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/70 backdrop-blur-lg rounded-lg md:rounded-xl shadow-xl border border-white/20 p-4 md:p-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Belgeler içinde ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 md:gap-3">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm md:text-base ${
                selectedCategory === '' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tümü ({documents.length})
            </button>
            {DOCUMENT_CATEGORIES.map(category => {
              const count = documents.filter(doc => doc.category === category).length;
              if (count === 0) return null;
              
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm md:text-base ${
                    selectedCategory === category 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="bg-white/70 backdrop-blur-lg rounded-lg md:rounded-xl shadow-xl border border-white/20 p-4 md:p-6">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <FolderIcon className="w-16 h-16 md:w-20 md:h-20 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'Arama sonucu bulunamadı' : 'Bu kategoride belge bulunamadı'}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Arama kriterlerinizi değiştirip tekrar deneyin.' 
                : 'Bu kategoriye ait belge bulunmuyor.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredDocuments.map((document) => (
              <div 
                key={document.id} 
                className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200 group"
              >
                <div className="flex items-start space-x-3 md:space-x-4 mb-4">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-red-100 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                    <DocumentTextIcon className="w-6 h-6 md:w-7 md:h-7 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm md:text-base mb-1 line-clamp-2">
                      {document.title}
                    </h3>
                    <div className="flex items-center space-x-2 text-xs md:text-sm text-gray-500 mb-2">
                      <TagIcon className="w-3 h-3 md:w-4 md:h-4" />
                      <span>{document.category}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs md:text-sm text-gray-500">
                      <CalendarIcon className="w-3 h-3 md:w-4 md:h-4" />
                      <span>{formatDate(document.uploaded_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                    {formatFileSize(document.file_size)}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePreview(document)}
                      className="bg-emerald-50 text-emerald-600 p-2 rounded-lg hover:bg-emerald-100 transition-colors duration-200 group-hover:scale-110"
                      title="Görüntüle"
                    >
                      <EyeIcon className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
} 