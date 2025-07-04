import { Request, Response } from 'express';
import pool from '../config/database';

// Tüm aktif günlük mesajları getir
export const getDailyMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        id,
        message,
        is_active,
        display_order,
        created_at,
        updated_at
      FROM daily_messages 
      WHERE is_active = true 
      ORDER BY display_order ASC, created_at ASC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get daily messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Günlük mesajlar getirilemedi'
    });
  }
};

// Admin: Tüm günlük mesajları getir (aktif/pasif tümü)
export const getAllDailyMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        dm.id,
        dm.message,
        dm.is_active,
        dm.display_order,
        dm.created_at,
        dm.updated_at,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM daily_messages dm
      LEFT JOIN users u ON dm.created_by = u.id
      ORDER BY dm.display_order ASC, dm.created_at DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get all daily messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Mesajlar getirilemedi'
    });
  }
};

// Yeni günlük mesaj ekle
export const createDailyMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, display_order } = req.body;
    const userId = req.user?.userId;

    if (!message || message.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Mesaj boş olamaz'
      });
      return;
    }

    if (message.length > 500) {
      res.status(400).json({
        success: false,
        message: 'Mesaj en fazla 500 karakter olabilir'
      });
      return;
    }

    // Maksimum 10 aktif mesaj kontrolü
    const countQuery = 'SELECT COUNT(*) as count FROM daily_messages WHERE is_active = true';
    const countResult = await pool.query(countQuery);
    
    if (parseInt(countResult.rows[0].count) >= 10) {
      res.status(400).json({
        success: false,
        message: 'Maksimum 10 aktif mesaj ekleyebilirsiniz'
      });
      return;
    }

    const insertQuery = `
      INSERT INTO daily_messages (message, display_order, created_by, is_active)
      VALUES ($1, $2, $3, true)
      RETURNING id, message, display_order, created_at
    `;

    const result = await pool.query(insertQuery, [
      message.trim(),
      display_order || 0,
      userId
    ]);

    res.status(201).json({
      success: true,
      message: 'Günlük mesaj başarıyla eklendi',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Create daily message error:', error);
    res.status(500).json({
      success: false,
      message: 'Mesaj eklenemedi'
    });
  }
};

// Günlük mesaj güncelle
export const updateDailyMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { message, is_active, display_order } = req.body;

    if (!message || message.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Mesaj boş olamaz'
      });
      return;
    }

    if (message.length > 500) {
      res.status(400).json({
        success: false,
        message: 'Mesaj en fazla 500 karakter olabilir'
      });
      return;
    }

    const updateQuery = `
      UPDATE daily_messages 
      SET 
        message = $1,
        is_active = $2,
        display_order = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, message, is_active, display_order, updated_at
    `;

    const result = await pool.query(updateQuery, [
      message.trim(),
      is_active !== undefined ? is_active : true,
      display_order || 0,
      id
    ]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Mesaj bulunamadı'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Mesaj başarıyla güncellendi',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update daily message error:', error);
    res.status(500).json({
      success: false,
      message: 'Mesaj güncellenemedi'
    });
  }
};

// Günlük mesaj sil
export const deleteDailyMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const deleteQuery = 'DELETE FROM daily_messages WHERE id = $1 RETURNING id, message';
    const result = await pool.query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Mesaj bulunamadı'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Mesaj başarıyla silindi'
    });

  } catch (error) {
    console.error('Delete daily message error:', error);
    res.status(500).json({
      success: false,
      message: 'Mesaj silinemedi'
    });
  }
};

// Mesaj sırasını güncelle
export const updateMessageOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages } = req.body; // [{ id, display_order }]

    if (!Array.isArray(messages)) {
      res.status(400).json({
        success: false,
        message: 'Geçersiz veri formatı'
      });
      return;
    }

    // Tüm mesajların sırasını güncelle
    const promises = messages.map(({ id, display_order }) => {
      return pool.query(
        'UPDATE daily_messages SET display_order = $1 WHERE id = $2',
        [display_order, id]
      );
    });

    await Promise.all(promises);

    res.json({
      success: true,
      message: 'Mesaj sırası güncellendi'
    });

  } catch (error) {
    console.error('Update message order error:', error);
    res.status(500).json({
      success: false,
      message: 'Sıra güncellenemedi'
    });
  }
}; 