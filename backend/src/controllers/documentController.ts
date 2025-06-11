import { Request, Response } from 'express';
import pool from '../config/database';

// Tüm belgeleri getir
export const getAllDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        d.*,
        u.first_name || ' ' || u.last_name as uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      ORDER BY d.uploaded_at DESC
    `;

    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Belgeler getirilemedi'
    });
  }
};

// Belge yükle
export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, category } = req.body;
    const userId = req.user?.userId;
    const file = (req as any).file;

    if (!title || !category) {
      res.status(400).json({
        success: false,
        message: 'Başlık ve kategori gerekli'
      });
      return;
    }

    if (!file) {
      res.status(400).json({
        success: false,
        message: 'Dosya seçilmesi gerekli'
      });
      return;
    }

    // Veritabanına kaydet
    const query = `
      INSERT INTO documents (title, file_name, file_path, category, file_size, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const filePath = `/uploads/documents/${file.filename}`;
    const values = [
      title,
      file.filename,
      filePath,
      category,
      file.size,
      userId
    ];

    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Belge başarıyla yüklendi'
    });

  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Belge yüklenirken hata oluştu'
    });
  }
};

// Belge sil
export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Önce belgenin var olup olmadığını kontrol et
    const selectQuery = 'SELECT id FROM documents WHERE id = $1';
    const selectResult = await pool.query(selectQuery, [id]);

    if (selectResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Belge bulunamadı'
      });
      return;
    }

    // Veritabanından sil
    const deleteQuery = 'DELETE FROM documents WHERE id = $1';
    await pool.query(deleteQuery, [id]);

    res.json({
      success: true,
      message: 'Belge başarıyla silindi'
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Belge silinirken hata oluştu'
    });
  }
}; 