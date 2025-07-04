import { Request, Response } from 'express';
import pool from '../config/database';
import { CalendarEvent, CreateCalendarEventRequest, UpdateCalendarEventRequest } from '../models/CalendarEvent';

// Tüm takvim etkinliklerini getir
export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const { month, year, event_type } = req.query;
    
    let query = `
      SELECT ce.*, u.first_name, u.last_name 
      FROM calendar_events ce 
      LEFT JOIN users u ON ce.created_by = u.id 
      WHERE 1=1
    `;
    const queryParams: any[] = [];
    
    // Aylık filtreleme
    if (month && year) {
      query += ` AND EXTRACT(MONTH FROM ce.start_date) = $${queryParams.length + 1} 
                 AND EXTRACT(YEAR FROM ce.start_date) = $${queryParams.length + 2}`;
      queryParams.push(month, year);
    }
    
    // Etkinlik türü filtreleme
    if (event_type) {
      query += ` AND ce.event_type = $${queryParams.length + 1}`;
      queryParams.push(event_type);
    }
    
    query += ` ORDER BY ce.start_date ASC, ce.start_time ASC`;
    
    const result = await pool.query(query, queryParams);
    
    const events = result.rows.map(row => ({
      ...row,
      created_by_name: row.first_name && row.last_name ? 
        `${row.first_name} ${row.last_name}` : 'Sistem'
    }));
    
    res.json(events);
  } catch (error) {
    console.error('Takvim etkinlikleri getirilirken hata:', error);
    res.status(500).json({ 
      error: 'Takvim etkinlikleri getirilirken hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Belirli bir tarihteki etkinlikleri getir
export const getEventsByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    
    const query = `
      SELECT ce.*, u.first_name, u.last_name 
      FROM calendar_events ce 
      LEFT JOIN users u ON ce.created_by = u.id 
      WHERE ce.start_date = $1 
         OR (ce.end_date IS NOT NULL AND ce.start_date <= $1 AND ce.end_date >= $1)
      ORDER BY ce.start_time ASC
    `;
    
    const result = await pool.query(query, [date]);
    
    const events = result.rows.map(row => ({
      ...row,
      created_by_name: row.first_name && row.last_name ? 
        `${row.first_name} ${row.last_name}` : 'Sistem'
    }));
    
    res.json(events);
  } catch (error) {
    console.error('Tarihli etkinlikler getirilirken hata:', error);
    res.status(500).json({ 
      error: 'Tarihli etkinlikler getirilirken hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Yeni takvim etkinliği oluştur
export const createEvent = async (req: Request, res: Response) => {
  try {
    const eventData: CreateCalendarEventRequest = req.body;
    const userId = (req as any).user?.userId;
    
    // Validasyon
    if (!eventData.title || !eventData.start_date || !eventData.event_type) {
      return res.status(400).json({ 
        error: 'Başlık, başlangıç tarihi ve etkinlik türü zorunludur' 
      });
    }
    
    // Eğer all_day false ise, start_time zorunlu
    if (!eventData.is_all_day && !eventData.start_time) {
      return res.status(400).json({ 
        error: 'Tüm gün etkinliği değilse başlangıç saati zorunludur' 
      });
    }
    
    const query = `
      INSERT INTO calendar_events 
      (title, description, event_type, start_date, end_date, start_time, end_time, is_all_day, location, color, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const values = [
      eventData.title,
      eventData.description || null,
      eventData.event_type,
      eventData.start_date,
      eventData.end_date || null,
      eventData.start_time || null,
      eventData.end_time || null,
      eventData.is_all_day,
      eventData.location || null,
      eventData.color || 'blue',
      userId
    ];
    
    const result = await pool.query(query, values);
    
    res.status(201).json({
      message: 'Takvim etkinliği başarıyla oluşturuldu',
      event: result.rows[0]
    });
  } catch (error) {
    console.error('Takvim etkinliği oluşturulurken hata:', error);
    res.status(500).json({ 
      error: 'Takvim etkinliği oluşturulurken hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Takvim etkinliğini güncelle
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const eventData: UpdateCalendarEventRequest = req.body;
    const userId = (req as any).user?.userId;
    
    // Etkinliğin var olup olmadığını kontrol et
    const checkQuery = 'SELECT * FROM calendar_events WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Etkinlik bulunamadı' });
    }
    
    // Admin değilse, sadece kendi oluşturduğu etkinlikleri güncelleyebilir
    const userQuery = 'SELECT role FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    const isAdmin = userResult.rows[0]?.role === 'admin';
    
    if (!isAdmin && checkResult.rows[0].created_by !== userId) {
      return res.status(403).json({ error: 'Bu etkinliği güncelleme yetkiniz yok' });
    }
    
    // Güncellenecek alanları belirle
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;
    
    Object.entries(eventData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Güncellenecek alan bulunamadı' });
    }
    
    const query = `
      UPDATE calendar_events 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    updateValues.push(id);
    const result = await pool.query(query, updateValues);
    
    res.json({
      message: 'Takvim etkinliği başarıyla güncellendi',
      event: result.rows[0]
    });
  } catch (error) {
    console.error('Takvim etkinliği güncellenirken hata:', error);
    res.status(500).json({ 
      error: 'Takvim etkinliği güncellenirken hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Takvim etkinliğini sil
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    
    console.log(`🗑️ Delete Event Debug - Event ID: ${id}, User ID: ${userId}`);
    
    // Etkinliğin var olup olmadığını kontrol et
    const checkQuery = 'SELECT * FROM calendar_events WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      console.log(`❌ Event not found: ${id}`);
      return res.status(404).json({ error: 'Etkinlik bulunamadı' });
    }
    
    // Admin değilse, sadece kendi oluşturduğu etkinlikleri silebilir
    const userQuery = 'SELECT role FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    const isAdmin = userResult.rows[0]?.role === 'admin';
    const eventCreatedBy = checkResult.rows[0].created_by;
    
    console.log(`👤 User role: ${userResult.rows[0]?.role}, isAdmin: ${isAdmin}`);
    console.log(`📝 Event created_by: ${eventCreatedBy}, user ID: ${userId}`);
    
    // Admin tüm etkinlikleri silebilir, diğer kullanıcılar sadece kendi oluşturdukları etkinlikleri silebilir
    if (!isAdmin && eventCreatedBy !== userId) {
      console.log(`🚫 Permission denied - not admin and not owner`);
      return res.status(403).json({ error: 'Bu etkinliği silme yetkiniz yok' });
    }
    
    console.log(`✅ Permission granted - proceeding with delete`);
    const deleteQuery = 'DELETE FROM calendar_events WHERE id = $1';
    await pool.query(deleteQuery, [id]);
    
    console.log(`🎉 Event ${id} deleted successfully`);
    res.json({ message: 'Takvim etkinliği başarıyla silindi' });
  } catch (error) {
    console.error('Takvim etkinliği silinirken hata:', error);
    res.status(500).json({ 
      error: 'Takvim etkinliği silinirken hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

// Belirli bir etkinliği getir
export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT ce.*, u.first_name, u.last_name 
      FROM calendar_events ce 
      LEFT JOIN users u ON ce.created_by = u.id 
      WHERE ce.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Etkinlik bulunamadı' });
    }
    
    const event = {
      ...result.rows[0],
      created_by_name: result.rows[0].first_name && result.rows[0].last_name ? 
        `${result.rows[0].first_name} ${result.rows[0].last_name}` : 'Sistem'
    };
    
    res.json(event);
  } catch (error) {
    console.error('Etkinlik getirilirken hata:', error);
    res.status(500).json({ 
      error: 'Etkinlik getirilirken hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
}; 