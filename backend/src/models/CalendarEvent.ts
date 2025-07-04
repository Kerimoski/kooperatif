export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  event_type: 'duyuru' | 'etkinlik' | 'toplanti' | 'egitim' | 'diger';
  start_date: string; // YYYY-MM-DD format
  end_date?: string; // YYYY-MM-DD format
  start_time?: string; // HH:MM format
  end_time?: string; // HH:MM format
  is_all_day: boolean;
  location?: string;
  color?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCalendarEventRequest {
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
}

export interface UpdateCalendarEventRequest {
  title?: string;
  description?: string;
  event_type?: 'duyuru' | 'etkinlik' | 'toplanti' | 'egitim' | 'diger';
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  is_all_day?: boolean;
  location?: string;
  color?: string;
}

export const EVENT_TYPES = {
  duyuru: 'Duyuru',
  etkinlik: 'Etkinlik',
  toplanti: 'Toplantı',
  egitim: 'Eğitim',
  diger: 'Diğer'
} as const; 