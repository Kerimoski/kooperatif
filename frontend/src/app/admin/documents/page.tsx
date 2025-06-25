'use client';

import { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  FolderIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
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

export default function AdminDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    category: '',
    file: null as File | null
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
              setError(`Belgeler yüklenemedi: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file || !uploadData.title || !uploadData.category) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('title', uploadData.title);
      formData.append('category', uploadData.category);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        setSuccess('Belge başarıyla yüklendi!');
        setShowUploadModal(false);
        setUploadData({ title: '', category: '', file: null });
        loadDocuments();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error('Upload başarısız');
      }
    } catch (error) {
      console.error('Belge yüklenirken hata:', error);
      setError('Belge yüklenemedi');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu belgeyi silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/documents/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setDocuments(documents.filter(doc => doc.id !== id));
        setSuccess('Belge başarıyla silindi!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error('Silme işlemi başarısız');
      }
    } catch (error) {
      console.error('Belge silinirken hata:', error);
      setError('Belge silinemedi');
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredDocuments = selectedCategory 
    ? documents.filter(doc => doc.category === selectedCategory)
    : documents;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Belgeler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold flex items-center">
              <DocumentTextIcon className="w-6 h-6 md:w-8 md:h-8 mr-2 md:mr-3" />
              Belge Yönetimi
            </h1>
            <p className="text-indigo-100 text-sm md:text-base mt-1">
              Kooperatif belgelerini yönetin
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-white text-indigo-600 px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200 flex items-center shadow-lg"
          >
            <PlusIcon className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            Belge Yükle
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center">
          <CheckCircleIcon className="w-5 h-5 text-green-600 mr-3" />
          <span className="text-green-800 font-medium">{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-3" />
          <span className="text-red-800 font-medium">{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/70 backdrop-blur-lg rounded-lg md:rounded-xl shadow-xl border border-white/20 p-4 md:p-6">
        <div className="flex flex-wrap gap-2 md:gap-3">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm md:text-base ${
              selectedCategory === '' 
                ? 'bg-indigo-600 text-white' 
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
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white/70 backdrop-blur-lg rounded-lg md:rounded-xl shadow-xl border border-white/20 p-4 md:p-6">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <FolderIcon className="w-16 h-16 md:w-20 md:h-20 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
              {selectedCategory ? `${selectedCategory} kategorisinde belge bulunamadı` : 'Henüz belge yüklenmemiş'}
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedCategory ? 'Bu kategoriye ait belge bulunmuyor.' : 'İlk belgenizi yükleyerek başlayın.'}
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors duration-200 flex items-center mx-auto"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Belge Yükle
            </button>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {filteredDocuments.map((document) => (
              <div key={document.id} className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-start space-x-3 md:space-x-4 flex-1">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                      <DocumentTextIcon className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate text-sm md:text-base">
                        {document.title}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600 truncate">
                        {document.file_name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2 text-xs md:text-sm text-gray-500">
                        <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md font-medium">
                          {document.category}
                        </span>
                        <span>{formatFileSize(document.file_size)}</span>
                        <span>{formatDate(document.uploaded_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch(`http://localhost:5001/api/documents/file/${document.file_name}`, {
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
                      }}
                      className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                      title="Görüntüle"
                    >
                      <EyeIcon className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch(`http://localhost:5001/api/documents/file/${document.file_name}`, {
                            headers: {
                              'Authorization': `Bearer ${localStorage.getItem('token')}`
                            }
                          });

                          if (response.ok) {
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const link = window.document.createElement('a');
                            link.href = url;
                            link.download = document.file_name;
                            link.click();
                            // URL'yi temizle (memory leak önleme)
                            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
                          } else {
                            const errorData = await response.json();
                            console.error('Belge indirme hatası:', errorData);
                            alert('Belge indirilemedi: ' + (errorData.message || 'Bilinmeyen hata'));
                          }
                        } catch (error) {
                          console.error('Belge indirme hatası:', error);
                          alert('Belge indirilirken hata oluştu');
                        }
                      }}
                      className="bg-green-50 text-green-600 p-2 rounded-lg hover:bg-green-100 transition-colors duration-200"
                      title="İndir"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(document.id)}
                      className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors duration-200"
                      title="Sil"
                    >
                      <TrashIcon className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl w-full max-w-md md:max-w-lg">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center">
                  <CloudArrowUpIcon className="w-5 h-5 md:w-6 md:h-6 mr-2" />
                  Belge Yükle
                </h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl md:text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-4 md:space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Belge Başlığı
                  </label>
                  <input
                    type="text"
                    value={uploadData.title}
                    onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Örn: Kooperatif Anasözleşmesi"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kategori
                  </label>
                  <select
                    value={uploadData.category}
                    onChange={(e) => setUploadData({...uploadData, category: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="">Kategori seçin</option>
                    {DOCUMENT_CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    PDF Dosyası
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setUploadData({...uploadData, file: e.target.files?.[0] || null})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Sadece PDF dosyaları kabul edilir (Maks. 10MB)
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors duration-200"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Yükleniyor...
                      </>
                    ) : (
                      <>
                        <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                        Yükle
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


    </div>
  );
} 