'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  SparklesIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  SunIcon,
  UserIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

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
  { name: 'Mavi', value: 'blue', bg: 'bg-gradient-to-r from-blue-500 to-blue-600' },
  { name: 'Emerald', value: 'emerald', bg: 'bg-gradient-to-r from-emerald-500 to-emerald-600' },
  { name: 'Mor', value: 'purple', bg: 'bg-gradient-to-r from-purple-500 to-purple-600' },
  { name: 'Turuncu', value: 'orange', bg: 'bg-gradient-to-r from-orange-500 to-orange-600' },
  { name: 'Kırmızı', value: 'red', bg: 'bg-gradient-to-r from-red-500 to-red-600' },
  { name: 'Pembe', value: 'pink', bg: 'bg-gradient-to-r from-pink-500 to-pink-600' },
  { name: 'İndigo', value: 'indigo', bg: 'bg-gradient-to-r from-indigo-500 to-indigo-600' },
  { name: 'Teal', value: 'teal', bg: 'bg-gradient-to-r from-teal-500 to-teal-600' },
  { name: 'Yeşil', value: 'green', bg: 'bg-gradient-to-r from-green-500 to-green-600' },
  { name: 'Sarı', value: 'yellow', bg: 'bg-gradient-to-r from-yellow-500 to-yellow-600' },
  { name: 'Cyan', value: 'cyan', bg: 'bg-gradient-to-r from-cyan-500 to-cyan-600' },
  { name: 'Lime', value: 'lime', bg: 'bg-gradient-to-r from-lime-500 to-lime-600' },
  { name: 'Amber', value: 'amber', bg: 'bg-gradient-to-r from-amber-500 to-amber-600' },
  { name: 'Violet', value: 'violet', bg: 'bg-gradient-to-r from-violet-500 to-violet-600' },
  { name: 'Slate', value: 'slate', bg: 'bg-gradient-to-r from-slate-500 to-slate-600' },
  { name: 'Rose', value: 'rose', bg: 'bg-gradient-to-r from-rose-500 to-rose-600' },
];

const getEventColor = (event: CalendarEvent) => {
  if (event.color) {
    const colorOption = COLOR_OPTIONS.find(c => c.value === event.color);
    return colorOption ? `${colorOption.bg} text-white shadow-lg` : EVENT_TYPE_COLORS[event.event_type];
  }
  return EVENT_TYPE_COLORS[event.event_type];
};

const DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export default function MemberCalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const openEventModal = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const closeEventModal = () => {
    setIsEventModalOpen(false);
    setSelectedEvent(null);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatFullDate = (dateString: string, endDate?: string) => {
    const start = new Date(dateString);
    const startFormatted = start.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (endDate && endDate !== dateString) {
      const end = new Date(endDate);
      const endFormatted = end.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      return `${startFormatted} - ${endFormatted}`;
    }

    return startFormatted;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Takvim yükleniyor...</p>
        </div>
      </div>
    );
  }

  const days = getDaysInMonth();
  const todayEvents = getEventsForDate(new Date());

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
         <div className="flex items-center space-x-4">
           <div className="p-3 bg-white/20 rounded-xl shadow-lg">
             <CalendarIcon className="h-8 w-8 text-white" />
           </div>
           <div>
             <h1 className="text-2xl sm:text-3xl font-bold text-white">
               Takvim
             </h1>
             <p className="text-emerald-100 mt-1">
               Etkinlikleri ve duyuruları görüntüleyin
             </p>
           </div>
         </div>
       </div>

      {/* Today's Events - özel alan */}
      {todayEvents.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 via-emerald-50 to-teal-50 rounded-2xl shadow-xl border border-emerald-200 p-6 mb-8 backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-6">
            <SparklesIcon className="h-6 w-6 text-emerald-600" />
            <h3 className="text-xl font-bold text-emerald-900">Bugünün Etkinlikleri</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => openEventModal(event)}
                className="bg-white rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all duration-200 border border-emerald-100 transform hover:scale-105"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{event.title}</h4>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getEventColor(event)}`}>
                      {EVENT_TYPES[event.event_type]}
                    </span>
                  </div>
                  <EyeIcon className="h-5 w-5 text-gray-400 ml-2" />
                </div>
                {!event.is_all_day && event.start_time && (
                  <div className="flex items-center mt-3 text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    <span className="font-medium">{formatTime(event.start_time)}</span>
                    {event.end_time && <span className="ml-1">- {formatTime(event.end_time)}</span>}
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center mt-2 text-sm text-gray-600">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden backdrop-blur-sm">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-3 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md group"
          >
            <ChevronLeftIcon className="h-6 w-6 text-gray-600 group-hover:text-emerald-600 transition-colors" />
          </button>
          
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-3 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md group"
          >
            <ChevronRightIcon className="h-6 w-6 text-gray-600 group-hover:text-emerald-600 transition-colors" />
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
                className={`min-h-28 sm:min-h-36 p-2 border-r border-b border-gray-100 transition-all duration-200 hover:bg-emerald-50 group relative ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                } ${isTodayDate ? 'bg-gradient-to-br from-emerald-50 to-teal-50 ring-2 ring-emerald-400 ring-inset' : ''}`}
              >
                <div className={`text-sm font-semibold mb-2 transition-colors ${
                  isTodayDate ? 'text-emerald-600 bg-emerald-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto' : 
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {dayObj.date.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      onClick={() => openEventModal(event)}
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
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Detail Modal */}
      {isEventModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div>
                <h3 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                  <MagnifyingGlassIcon className="w-5 h-5 text-emerald-600" />
                  Etkinlik Detayları
                </h3>
              </div>
              <button
                onClick={closeEventModal}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                {/* Başlık ve Tür */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    {selectedEvent.title}
                  </h2>
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getEventColor(selectedEvent)}`}>
                    {EVENT_TYPES[selectedEvent.event_type]}
                  </span>
                </div>

                {/* Açıklama */}
                {selectedEvent.description && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <DocumentTextIcon className="w-4 h-4 text-emerald-600" />
                      Açıklama
                    </h4>
                    <p className="text-gray-700 leading-relaxed">{selectedEvent.description}</p>
                  </div>
                )}

                {/* Tarih ve Saat */}
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <CalendarIcon className="w-4 h-4 text-blue-600" />
                    Tarih ve Saat Bilgileri
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-700">
                      <CalendarIcon className="h-5 w-5 mr-3 text-blue-600" />
                      <span className="font-medium">{formatFullDate(selectedEvent.start_date, selectedEvent.end_date)}</span>
                    </div>
                    
                    {selectedEvent.is_all_day ? (
                      <div className="flex items-center text-gray-700">
                        <ClockIcon className="h-5 w-5 mr-3 text-blue-600" />
                        <span className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-sm font-medium">
                          <SunIcon className="w-4 h-4" />
                          Tüm gün etkinliği
                        </span>
                      </div>
                    ) : (
                      selectedEvent.start_time && (
                        <div className="flex items-center text-gray-700">
                          <ClockIcon className="h-5 w-5 mr-3 text-blue-600" />
                          <span className="font-medium">
                            {formatTime(selectedEvent.start_time)}
                            {selectedEvent.end_time && ` - ${formatTime(selectedEvent.end_time)}`}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Konum */}
                {selectedEvent.location && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <MapPinIcon className="w-4 h-4 text-green-600" />
                      Konum
                    </h4>
                    <div className="flex items-center text-gray-700">
                      <MapPinIcon className="h-5 w-5 mr-3 text-green-600" />
                      <span className="font-medium">{selectedEvent.location}</span>
                    </div>
                  </div>
                )}

                {/* Diğer Bilgiler */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <InformationCircleIcon className="w-4 h-4 text-gray-600" />
                    Diğer Bilgiler
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedEvent.created_by_name && (
                      <div className="flex items-center">
                        <UserIcon className="w-4 h-4 text-gray-600 mr-2" />
                        <span className="text-gray-600">Oluşturan:</span>
                        <span className="ml-2 font-medium text-gray-800">{selectedEvent.created_by_name}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 text-gray-600 mr-2" />
                      <span className="text-gray-600">Oluşturulma Tarihi:</span>
                      <span className="ml-2 font-medium text-gray-800">
                        {new Date(selectedEvent.created_at).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={closeEventModal}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4" />
                    Kapat
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 