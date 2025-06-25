'use client';

import { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ClockIcon,
  MapPinIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SwatchIcon,
  SparklesIcon,
  DocumentTextIcon,
  BellIcon,
  UserGroupIcon,
  AcademicCapIcon,
  EllipsisHorizontalIcon,
  TagIcon,
  SunIcon,
  BookmarkIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { 
  CalendarDaysIcon,
  DocumentTextIcon as DocumentTextIconSolid,
  HomeIcon
} from '@heroicons/react/24/solid';

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  event_type: 'duyuru' | 'etkinlik' | 'toplanti' | 'egitim' | 'diger';
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  is_all_day: boolean;
  location?: string;
  color?: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
}

interface EventFormData {
  title: string;
  description: string;
  event_type: 'duyuru' | 'etkinlik' | 'toplanti' | 'egitim' | 'diger';
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  location: string;
  color: string;
}

const EVENT_TYPES = {
  duyuru: 'Duyuru',
  etkinlik: 'Etkinlik', 
  toplanti: 'Toplantı',
  egitim: 'Eğitim',
  diger: 'Diğer'
};

const EVENT_TYPE_COLORS = {
  duyuru: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg',
  etkinlik: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg',
  toplanti: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg',
  egitim: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg',
  diger: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg'
};

const COLOR_OPTIONS = [
  { name: 'Mavi', value: 'blue', bg: 'bg-gradient-to-r from-blue-500 to-blue-600', ring: 'ring-blue-500' },
  { name: 'Emerald', value: 'emerald', bg: 'bg-gradient-to-r from-emerald-500 to-emerald-600', ring: 'ring-emerald-500' },
  { name: 'Mor', value: 'purple', bg: 'bg-gradient-to-r from-purple-500 to-purple-600', ring: 'ring-purple-500' },
  { name: 'Turuncu', value: 'orange', bg: 'bg-gradient-to-r from-orange-500 to-orange-600', ring: 'ring-orange-500' },
  { name: 'Kırmızı', value: 'red', bg: 'bg-gradient-to-r from-red-500 to-red-600', ring: 'ring-red-500' },
  { name: 'Pembe', value: 'pink', bg: 'bg-gradient-to-r from-pink-500 to-pink-600', ring: 'ring-pink-500' },
  { name: 'İndigo', value: 'indigo', bg: 'bg-gradient-to-r from-indigo-500 to-indigo-600', ring: 'ring-indigo-500' },
  { name: 'Teal', value: 'teal', bg: 'bg-gradient-to-r from-teal-500 to-teal-600', ring: 'ring-teal-500' },
  { name: 'Yeşil', value: 'green', bg: 'bg-gradient-to-r from-green-500 to-green-600', ring: 'ring-green-500' },
  { name: 'Sarı', value: 'yellow', bg: 'bg-gradient-to-r from-yellow-500 to-yellow-600', ring: 'ring-yellow-500' },
  { name: 'Cyan', value: 'cyan', bg: 'bg-gradient-to-r from-cyan-500 to-cyan-600', ring: 'ring-cyan-500' },
  { name: 'Lime', value: 'lime', bg: 'bg-gradient-to-r from-lime-500 to-lime-600', ring: 'ring-lime-500' },
  { name: 'Amber', value: 'amber', bg: 'bg-gradient-to-r from-amber-500 to-amber-600', ring: 'ring-amber-500' },
  { name: 'Violet', value: 'violet', bg: 'bg-gradient-to-r from-violet-500 to-violet-600', ring: 'ring-violet-500' },
  { name: 'Slate', value: 'slate', bg: 'bg-gradient-to-r from-slate-500 to-slate-600', ring: 'ring-slate-500' },
  { name: 'Rose', value: 'rose', bg: 'bg-gradient-to-r from-rose-500 to-rose-600', ring: 'ring-rose-500' },
];

const getEventColor = (event: CalendarEvent) => {
  if (event.color) {
    const colorOption = COLOR_OPTIONS.find(c => c.value === event.color);
    return colorOption ? colorOption.bg : EVENT_TYPE_COLORS[event.event_type];
  }
  return EVENT_TYPE_COLORS[event.event_type];
};

const DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export default function AdminCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    event_type: 'duyuru',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    is_all_day: false,
    location: '',
    color: 'blue'
  });

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      const response = await fetch(`${API_BASE_URL}/calendar?month=${month}&year=${year}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Etkinlikler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_type: 'duyuru',
      start_date: '',
      end_date: '',
      start_time: '',
      end_time: '',
      is_all_day: false,
      location: '',
      color: 'blue'
    });
    setEditingEvent(null);
    setSelectedDate(null);
  };

  const openModal = (date?: Date, event?: CalendarEvent) => {
    if (event) {
      setEditingEvent(event);
      // Backend'den gelen UTC tarihlerini local timezone'a çevir
      const startDateLocal = new Date(event.start_date).toLocaleDateString('sv-SE');
      const endDateLocal = event.end_date ? new Date(event.end_date).toLocaleDateString('sv-SE') : '';
      setFormData({
        title: event.title,
        description: event.description || '',
        event_type: event.event_type,
        start_date: startDateLocal,
        end_date: endDateLocal,
        start_time: event.start_time || '',
        end_time: event.end_time || '',
        is_all_day: event.is_all_day,
        location: event.location || '',
        color: event.color || 'blue'
      });
    } else if (date) {
      setSelectedDate(date);
      // Local timezone'da tarih string'i oluştur
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      setFormData({
        title: '',
        description: '',
        event_type: 'duyuru',
        start_date: dateStr,
        end_date: dateStr,
        start_time: '09:00',
        end_time: '10:00',
        is_all_day: false,
        location: '',
        color: 'blue'
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = editingEvent 
        ? `${API_BASE_URL}/calendar/${editingEvent.id}`
        : `${API_BASE_URL}/calendar`;
      
      const method = editingEvent ? 'PUT' : 'POST';
      
      const submitData = {
        ...formData,
        end_date: formData.end_date || null,
        start_time: formData.is_all_day ? null : formData.start_time,
        end_time: formData.is_all_day ? null : formData.end_time,
        location: formData.location || null,
        description: formData.description || null
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        await fetchEvents();
        closeModal();
        // Başarı bildirimi
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce';
        successDiv.textContent = editingEvent ? 'Etkinlik başarıyla güncellendi!' : 'Etkinlik başarıyla oluşturuldu!';
        document.body.appendChild(successDiv);
        setTimeout(() => document.body.removeChild(successDiv), 3000);
      } else {
        const error = await response.json();
        alert(error.error || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Etkinlik kaydedilirken hata:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleDelete = async (eventId: number) => {
    if (!confirm('Bu etkinliği silmek istediğinizden emin misiniz?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/calendar/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchEvents();
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce';
        successDiv.textContent = 'Etkinlik başarıyla silindi!';
        document.body.appendChild(successDiv);
        setTimeout(() => document.body.removeChild(successDiv), 3000);
      } else {
        const error = await response.json();
        alert(error.error || 'Silme işlemi başarısız');
      }
    } catch (error) {
      console.error('Etkinlik silinirken hata:', error);
      alert('Bir hata oluştu');
    }
  };

  const getEventsForDate = (date: Date) => {
    // Local timezone'da tarih string'i oluştur
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return events.filter(event => {
      // Backend'den gelen UTC tarihi local timezone'a çevir
      const eventStartLocal = new Date(event.start_date).toLocaleDateString('sv-SE'); // YYYY-MM-DD format
      const eventEndLocal = event.end_date ? new Date(event.end_date).toLocaleDateString('sv-SE') : eventStartLocal;
      
      return dateStr >= eventStartLocal && dateStr <= eventEndLocal;
    });
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Önceki ayın günleri
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonth.getDate() - i;
      days.push({
        date: new Date(year, month - 1, day),
        isCurrentMonth: false
      });
    }

    // Mevcut ayın günleri
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true
      });
    }

    // Sonraki ayın günleri (42 güne tamamla - 6 hafta)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false
      });
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Takvim yükleniyor...</p>
        </div>
      </div>
    );
  }

  const days = getDaysInMonth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <CalendarIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Takvim Yönetimi
                </h1>
                <p className="text-gray-600 mt-1">
                  Etkinlikleri ve duyuruları yönetin
                </p>
              </div>
            </div>
            <button
              onClick={() => openModal()}
              className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <SparklesIcon className="h-5 w-5 mr-2 group-hover:animate-pulse" />
              Yeni Etkinlik
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden backdrop-blur-sm">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-3 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md group"
            >
              <ChevronLeftIcon className="h-6 w-6 text-gray-600 group-hover:text-blue-600 transition-colors" />
            </button>
            
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-3 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md group"
            >
              <ChevronRightIcon className="h-6 w-6 text-gray-600 group-hover:text-blue-600 transition-colors" />
            </button>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 bg-gray-50">
            {DAYS.map((day) => (
              <div key={day} className="p-4 text-center text-sm font-semibold text-gray-600 bg-gradient-to-b from-gray-50 to-gray-100">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {days.map((dayObj, index) => {
              const dayEvents = getEventsForDate(dayObj.date);
              const isCurrentMonth = dayObj.isCurrentMonth;
              const isTodayDate = isToday(dayObj.date);

              return (
                <div
                  key={index}
                  onClick={() => isCurrentMonth && openModal(dayObj.date)}
                  className={`min-h-28 sm:min-h-36 p-2 border-r border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-blue-50 group relative ${
                    !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                  } ${isTodayDate ? 'bg-gradient-to-br from-blue-50 to-purple-50 ring-2 ring-blue-400 ring-inset' : ''}`}
                >
                  <div className={`text-sm font-semibold mb-2 transition-colors ${
                    isTodayDate ? 'text-blue-600 bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto' : 
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {dayObj.date.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(undefined, event);
                        }}
                        className={`text-xs px-2 py-1 rounded-lg text-white truncate cursor-pointer transform hover:scale-105 transition-all duration-200 ${getEventColor(event)}`}
                        title={event.title}
                      >
                        {!event.is_all_day && event.start_time && (
                          <span className="mr-1 opacity-90">{formatTime(event.start_time)}</span>
                        )}
                        <span className="font-medium">{event.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-lg font-medium">
                        +{dayEvents.length - 2} daha
                      </div>
                    )}
                  </div>
                  
                  {/* Hover effect */}
                  {isCurrentMonth && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg pointer-events-none" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingEvent ? '✏️ Etkinlik Düzenle' : '✨ Yeni Etkinlik Oluştur'}
                </h3>
                {selectedDate && !editingEvent && (
                  <p className="text-sm text-gray-600 mt-1">
                    📅 {selectedDate.toLocaleDateString('tr-TR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                )}
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <PencilIcon className="w-4 h-4 text-blue-600" />
                    Başlık *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Etkinlik başlığını girin..."
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <DocumentTextIcon className="w-4 h-4 text-emerald-600" />
                    Açıklama
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Etkinlik hakkında detaylar..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <TagIcon className="w-4 h-4 text-purple-600" />
                      Etkinlik Türü *
                    </label>
                    <select
                      required
                      value={formData.event_type}
                      onChange={(e) => setFormData({ ...formData, event_type: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      {Object.entries(EVENT_TYPES).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <SwatchIcon className="w-4 h-4 text-pink-600" />
                      Renk Seçimi
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                      {COLOR_OPTIONS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: color.value })}
                          className={`h-10 w-full rounded-lg ${color.bg} shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 ${
                            formData.color === color.value ? `ring-4 ${color.ring} ring-opacity-50` : ''
                          }`}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <CalendarIcon className="w-4 h-4 text-blue-600" />
                      Başlangıç Tarihi *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <CalendarDaysIcon className="w-4 h-4 text-green-600" />
                      Bitiş Tarihi
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_all_day}
                      onChange={(e) => setFormData({ ...formData, is_all_day: e.target.checked })}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <SunIcon className="w-4 h-4 text-orange-600" />
                      Tüm gün etkinliği
                    </span>
                  </label>
                </div>

                {!formData.is_all_day && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <ClockIcon className="w-4 h-4 text-indigo-600" />
                        Başlangıç Saati *
                      </label>
                      <input
                        type="time"
                        required={!formData.is_all_day}
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <ClockIcon className="w-4 h-4 text-teal-600" />
                        Bitiş Saati
                      </label>
                      <input
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <MapPinIcon className="w-4 h-4 text-red-600" />
                    Konum
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Etkinlik konumunu girin..."
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                >
                  {editingEvent ? (
                    <span className="flex items-center gap-2">
                      <BookmarkIcon className="w-4 h-4" />
                      Güncelle
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <SparklesIcon className="w-4 h-4" />
                      Oluştur
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 sm:flex-none px-8 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <XCircleIcon className="w-4 h-4" />
                    İptal
                  </span>
                </button>
                {editingEvent && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDelete(editingEvent.id);
                      closeModal();
                    }}
                    className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                  >
                    <span className="flex items-center gap-2">
                      <TrashIcon className="w-4 h-4" />
                      Sil
                    </span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 