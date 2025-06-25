import { Request, Response } from 'express';
import pool from '../config/database';
import { Commission } from '../models/Commission';

// Tüm komisyonları getir
export const getAllCommissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    const query = `
      SELECT 
        c.*,
        COUNT(CASE WHEN u.is_active = true AND cm.status = 'active' THEN cm.user_id END) as current_members,
        creator.first_name || ' ' || creator.last_name as created_by_name,
        COALESCE(user_cm.role, 'none') as user_role,
        COALESCE(user_cm.status, 'none') as user_status
      FROM commissions c
      LEFT JOIN commission_members cm ON c.id = cm.commission_id
      LEFT JOIN users u ON cm.user_id = u.id
      LEFT JOIN users creator ON c.created_by = creator.id
      LEFT JOIN commission_members user_cm ON c.id = user_cm.commission_id AND user_cm.user_id = $1
      WHERE c.is_active = true
      GROUP BY c.id, c.name, c.description, c.max_members, c.created_by, c.is_active, c.created_at, c.updated_at, creator.first_name, creator.last_name, user_cm.role, user_cm.status
      ORDER BY c.created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    
    
    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get commissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Komisyonlar getirilemedi'
    });
  }
};

// Yeni komisyon oluştur
export const createCommission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, max_members } = req.body;
    const userId = req.user?.userId;

    if (!name || !description) {
      res.status(400).json({
        success: false,
        message: 'Komisyon adı ve açıklama gerekli'
      });
      return;
    }

    // Aynı isimde komisyon var mı kontrol et
    const existingCommission = await pool.query(
      'SELECT id FROM commissions WHERE name = $1 AND is_active = true',
      [name]
    );

    if (existingCommission.rows.length > 0) {
      res.status(409).json({
        success: false,
        message: 'Bu isimde bir komisyon zaten mevcut'
      });
      return;
    }

    const insertQuery = `
      INSERT INTO commissions (name, description, max_members, created_by, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING *
    `;

    const values = [name, description, max_members || 10, userId];
    const result = await pool.query(insertQuery, values);

    res.status(201).json({
      success: true,
      message: 'Komisyon başarıyla oluşturuldu',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Create commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Komisyon oluşturulamadı'
    });
  }
};

// Komisyon üyelerini getir
export const getCommissionMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commissionId } = req.params;

    const query = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number,
        u.profession,
        cm.joined_at,
        cm.role as commission_role,
        cm.status
      FROM commission_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.commission_id = $1 AND u.is_active = true AND cm.status = 'active'
      ORDER BY cm.joined_at ASC
    `;

    const result = await pool.query(query, [commissionId]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get commission members error:', error);
    res.status(500).json({
      success: false,
      message: 'Komisyon üyeleri getirilemedi'
    });
  }
};

// Komisyona üye ekle
export const addMemberToCommission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commissionId } = req.params;
    const { userId, role = 'member' } = req.body;

    // Komisyon kapasitesi kontrolü
    const capacityQuery = `
      SELECT 
        c.max_members,
        COUNT(cm.user_id) as current_members
      FROM commissions c
      LEFT JOIN commission_members cm ON c.id = cm.commission_id
      WHERE c.id = $1 AND c.is_active = true
      GROUP BY c.id, c.max_members
    `;

    const capacityResult = await pool.query(capacityQuery, [commissionId]);
    
    if (capacityResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Komisyon bulunamadı'
      });
      return;
    }

    const commission = capacityResult.rows[0];
    if (commission.current_members >= commission.max_members) {
      res.status(400).json({
        success: false,
        message: 'Komisyon kapasitesi dolu'
      });
      return;
    }

    // Üye zaten komisyonda mı kontrol et
    const memberCheck = await pool.query(
      'SELECT id FROM commission_members WHERE commission_id = $1 AND user_id = $2',
      [commissionId, userId]
    );

    if (memberCheck.rows.length > 0) {
      res.status(409).json({
        success: false,
        message: 'Kullanıcı zaten bu komisyonda'
      });
      return;
    }

    // Üyeyi ekle
    await pool.query(
      'INSERT INTO commission_members (commission_id, user_id, role) VALUES ($1, $2, $3)',
      [commissionId, userId, role]
    );

    res.json({
      success: true,
      message: 'Üye komisyona başarıyla eklendi'
    });

  } catch (error) {
    console.error('Add member to commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Üye komisyona eklenemedi'
    });
  }
};

// Komisyondan üye çıkar
export const removeMemberFromCommission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commissionId, userId } = req.params;

    const result = await pool.query(
      'DELETE FROM commission_members WHERE commission_id = $1 AND user_id = $2',
      [commissionId, userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: 'Üye bu komisyonda bulunamadı'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Üye komisyondan başarıyla çıkarıldı'
    });

  } catch (error) {
    console.error('Remove member from commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Üye komisyondan çıkarılamadı'
    });
  }
};

// Komisyon güncelle
export const updateCommission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commissionId } = req.params;
    const { name, description, max_members, is_active } = req.body;

    const updateQuery = `
      UPDATE commissions 
      SET name = $1, description = $2, max_members = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;

    const values = [name, description, max_members, is_active, commissionId];
    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Komisyon bulunamadı'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Komisyon başarıyla güncellendi',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Komisyon güncellenemedi'
    });
  }
};

// Komisyon sil (soft delete)
export const deleteCommission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commissionId } = req.params;

    const result = await pool.query(
      'UPDATE commissions SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [commissionId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: 'Komisyon bulunamadı'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Komisyon başarıyla silindi'
    });

  } catch (error) {
    console.error('Delete commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Komisyon silinemedi'
    });
  }
};

// Komisyon yöneticisi ata (sadece admin)
export const promoteToManager = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commissionId, userId } = req.params;

    // Kullanıcı komisyonda üye mi kontrol et
    const memberCheck = await pool.query(
      'SELECT cm.id, cm.role, u.first_name, u.last_name FROM commission_members cm JOIN users u ON cm.user_id = u.id WHERE cm.commission_id = $1 AND cm.user_id = $2 AND cm.status = $3',
      [commissionId, userId, 'active']
    );

    if (memberCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Kullanıcı bu komisyonun aktif üyesi değil'
      });
      return;
    }

    const member = memberCheck.rows[0];

    // Zaten yönetici mi kontrol et
    if (member.role === 'manager') {
      res.status(400).json({
        success: false,
        message: 'Kullanıcı zaten bu komisyonun yöneticisi'
      });
      return;
    }

    // Önceki yöneticiyi normal üye yap
    await pool.query(
      'UPDATE commission_members SET role = $1 WHERE commission_id = $2 AND role = $3',
      ['member', commissionId, 'manager']
    );

    // Yeni yöneticiyi ata
    await pool.query(
      'UPDATE commission_members SET role = $1 WHERE commission_id = $2 AND user_id = $3',
      ['manager', commissionId, userId]
    );

    res.json({
      success: true,
      message: `${member.first_name} ${member.last_name} komisyon yöneticisi olarak atandı`
    });

  } catch (error) {
    console.error('Promote to manager error:', error);
    res.status(500).json({
      success: false,
      message: 'Yönetici ataması yapılamadı'
    });
  }
};

// Komisyon yöneticisini geri al (sadece admin)
export const demoteManager = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commissionId, userId } = req.params;

    const result = await pool.query(
      'UPDATE commission_members SET role = $1 WHERE commission_id = $2 AND user_id = $3 AND role = $4',
      ['member', commissionId, userId, 'manager']
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: 'Kullanıcı bu komisyonun yöneticisi değil'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Komisyon yöneticisi yetkisi kaldırıldı'
    });

  } catch (error) {
    console.error('Demote manager error:', error);
    res.status(500).json({
      success: false,
      message: 'Yönetici yetkisi kaldırılamadı'
    });
  }
};

// Bekleyen başvuruları getir (komisyon yöneticisi için)
export const getPendingApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commissionId } = req.params;
    const userId = req.user?.userId;
    
    console.log('🔍 getPendingApplications called:', { 
      commissionId, 
      userId, 
      userRole: req.user?.role 
    });

    // Kullanıcının admin mi yoksa bu komisyonun yöneticisi mi olduğunu kontrol et
    const userRole = req.user?.role;
    const isAdmin = userRole === 'admin';
    
    if (!isAdmin) {
      const managerCheck = await pool.query(
        'SELECT id FROM commission_members WHERE commission_id = $1 AND user_id = $2 AND role = $3 AND status = $4',
        [commissionId, userId, 'manager', 'active']
      );

      if (managerCheck.rows.length === 0) {
        res.status(403).json({
          success: false,
          message: 'Bu komisyonun yöneticisi değilsiniz veya admin yetkileriniz yok'
        });
        return;
      }
    }

    // Bekleyen başvuruları getir
    const query = `
      SELECT 
        cm.id as application_id,
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.profession,
        cm.joined_at,
        cm.status
      FROM commission_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.commission_id = $1 AND cm.status = $2 AND u.is_active = true
      ORDER BY cm.joined_at ASC
    `;

    const result = await pool.query(query, [commissionId, 'pending']);
    
    console.log('📊 Query result:', {
      rowCount: result.rowCount,
      applications: result.rows.length,
      data: result.rows
    });

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get pending applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Bekleyen başvurular getirilemedi'
    });
  }
};

// Başvuruyu onayla (komisyon yöneticisi veya admin)
export const approveApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commissionId, applicationUserId } = req.params;
    const userId = req.user?.userId;

    // Kullanıcının admin mi yoksa bu komisyonun yöneticisi mi olduğunu kontrol et
    const userRole = req.user?.role;
    const isAdmin = userRole === 'admin';
    
    if (!isAdmin) {
      const managerCheck = await pool.query(
        'SELECT id FROM commission_members WHERE commission_id = $1 AND user_id = $2 AND role = $3 AND status = $4',
        [commissionId, userId, 'manager', 'active']
      );

      if (managerCheck.rows.length === 0) {
        res.status(403).json({
          success: false,
          message: 'Bu komisyonun yöneticisi değilsiniz veya admin yetkileriniz yok'
        });
        return;
      }
    }

    // Başvuru var mı ve pending durumda mı kontrol et
    const applicationCheck = await pool.query(
      'SELECT cm.id, u.first_name, u.last_name FROM commission_members cm JOIN users u ON cm.user_id = u.id WHERE cm.commission_id = $1 AND cm.user_id = $2 AND cm.status = $3',
      [commissionId, applicationUserId, 'pending']
    );

    if (applicationCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Bekleyen başvuru bulunamadı'
      });
      return;
    }

    const applicant = applicationCheck.rows[0];

    // Komisyon kapasitesi kontrolü
    const capacityQuery = `
      SELECT 
        c.max_members,
        COUNT(CASE WHEN cm.status = 'active' AND u.is_active = true THEN 1 END) as current_members
      FROM commissions c
      LEFT JOIN commission_members cm ON c.id = cm.commission_id
      LEFT JOIN users u ON cm.user_id = u.id
      WHERE c.id = $1 AND c.is_active = true
      GROUP BY c.id, c.max_members
    `;

    const capacityResult = await pool.query(capacityQuery, [commissionId]);
    const commission = capacityResult.rows[0];

    if (commission.current_members >= commission.max_members) {
      res.status(400).json({
        success: false,
        message: 'Komisyon kapasitesi dolu'
      });
      return;
    }

    // Başvuruyu onayla
    await pool.query(
      'UPDATE commission_members SET status = $1, role = $2 WHERE commission_id = $3 AND user_id = $4 AND status = $5',
      ['active', 'member', commissionId, applicationUserId, 'pending']
    );

    res.json({
      success: true,
      message: `${applicant.first_name} ${applicant.last_name} komisyona kabul edildi`
    });

  } catch (error) {
    console.error('Approve application error:', error);
    res.status(500).json({
      success: false,
      message: 'Başvuru onaylanamadı'
    });
  }
};

// Başvuruyu reddet (komisyon yöneticisi veya admin)
export const rejectApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commissionId, applicationUserId } = req.params;
    const userId = req.user?.userId;

    // Kullanıcının admin mi yoksa bu komisyonun yöneticisi mi olduğunu kontrol et
    const userRole = req.user?.role;
    const isAdmin = userRole === 'admin';
    
    if (!isAdmin) {
      const managerCheck = await pool.query(
        'SELECT id FROM commission_members WHERE commission_id = $1 AND user_id = $2 AND role = $3 AND status = $4',
        [commissionId, userId, 'manager', 'active']
      );

      if (managerCheck.rows.length === 0) {
        res.status(403).json({
          success: false,
          message: 'Bu komisyonun yöneticisi değilsiniz veya admin yetkileriniz yok'
        });
        return;
      }
    }

    // Başvuru var mı ve pending durumda mı kontrol et
    const applicationCheck = await pool.query(
      'SELECT cm.id, u.first_name, u.last_name FROM commission_members cm JOIN users u ON cm.user_id = u.id WHERE cm.commission_id = $1 AND cm.user_id = $2 AND cm.status = $3',
      [commissionId, applicationUserId, 'pending']
    );

    if (applicationCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Bekleyen başvuru bulunamadı'
      });
      return;
    }

    const applicant = applicationCheck.rows[0];

    // Başvuruyu sil (reddet)
    await pool.query(
      'DELETE FROM commission_members WHERE commission_id = $1 AND user_id = $2 AND status = $3',
      [commissionId, applicationUserId, 'pending']
    );

    res.json({
      success: true,
      message: `${applicant.first_name} ${applicant.last_name} başvurusu reddedildi`
    });

  } catch (error) {
    console.error('Reject application error:', error);
    res.status(500).json({
      success: false,
      message: 'Başvuru reddedilemedi'
    });
  }
};

// ================== KOMISYON LİNK YÖNETİMİ ==================

// Komisyon linklerini getir (sadece komisyon üyeleri)
export const getCommissionLinks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commissionId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Admin kullanıcılar veya komisyon üyeleri linkleri görebilir
    const isAdmin = userRole === 'admin';
    
    if (!isAdmin) {
      // Kullanıcının bu komisyonun üyesi olup olmadığını kontrol et
      const memberCheck = await pool.query(
        'SELECT id FROM commission_members WHERE commission_id = $1 AND user_id = $2 AND status = $3',
        [commissionId, userId, 'active']
      );

      if (memberCheck.rows.length === 0) {
        res.status(403).json({
          success: false,
          message: 'Bu komisyonun linklerini görme yetkiniz yok - komisyon üyesi değilsiniz'
        });
        return;
      }
    }

    // Komisyon linklerini getir
    const query = `
      SELECT 
        cl.*,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM commission_links cl
      LEFT JOIN users u ON cl.created_by = u.id
      WHERE cl.commission_id = $1
      ORDER BY cl.created_at DESC
    `;

    const result = await pool.query(query, [commissionId]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get commission links error:', error);
    res.status(500).json({
      success: false,
      message: 'Komisyon linkleri getirilemedi'
    });
  }
};

// Komisyon linki ekle (sadece komisyon yöneticisi veya admin)
export const addCommissionLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commissionId } = req.params;
    const { title, url, description } = req.body;
    const userId = req.user?.userId;

    // URL validasyonu
    if (!url || !title) {
      res.status(400).json({
        success: false,
        message: 'Başlık ve URL gereklidir'
      });
      return;
    }

    // URL formatını kontrol et
    try {
      new URL(url);
    } catch {
      res.status(400).json({
        success: false,
        message: 'Geçersiz URL formatı'
      });
      return;
    }

    // Kullanıcının admin mi yoksa bu komisyonun yöneticisi mi olduğunu kontrol et
    const userRole = req.user?.role;
    const isAdmin = userRole === 'admin';
    
    if (!isAdmin) {
      const managerCheck = await pool.query(
        'SELECT id FROM commission_members WHERE commission_id = $1 AND user_id = $2 AND role = $3 AND status = $4',
        [commissionId, userId, 'manager', 'active']
      );

      if (managerCheck.rows.length === 0) {
        res.status(403).json({
          success: false,
          message: 'Bu komisyona link ekleme yetkiniz yok - komisyon yöneticisi değilsiniz'
        });
        return;
      }
    }

    // Komisyonun aktif olup olmadığını kontrol et
    const commissionCheck = await pool.query(
      'SELECT is_active FROM commissions WHERE id = $1',
      [commissionId]
    );

    if (commissionCheck.rows.length === 0 || !commissionCheck.rows[0].is_active) {
      res.status(404).json({
        success: false,
        message: 'Komisyon bulunamadı veya aktif değil'
      });
      return;
    }

    // Linki ekle
    const insertQuery = `
      INSERT INTO commission_links (commission_id, title, url, description, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [commissionId, title.trim(), url.trim(), description?.trim() || null, userId];
    const result = await pool.query(insertQuery, values);

    res.status(201).json({
      success: true,
      message: 'Link başarıyla eklendi',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Add commission link error:', error);
    res.status(500).json({
      success: false,
      message: 'Link eklenemedi'
    });
  }
};

// Komisyon linki güncelle (sadece link oluşturan veya komisyon yöneticisi veya admin)
export const updateCommissionLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commissionId, linkId } = req.params;
    const { title, url, description } = req.body;
    const userId = req.user?.userId;

    // URL validasyonu
    if (!url || !title) {
      res.status(400).json({
        success: false,
        message: 'Başlık ve URL gereklidir'
      });
      return;
    }

    // URL formatını kontrol et
    try {
      new URL(url);
    } catch {
      res.status(400).json({
        success: false,
        message: 'Geçersiz URL formatı'
      });
      return;
    }

    // Link mevcut mu ve bu komisyona ait mi kontrol et
    const linkCheck = await pool.query(
      'SELECT created_by FROM commission_links WHERE id = $1 AND commission_id = $2',
      [linkId, commissionId]
    );

    if (linkCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Link bulunamadı'
      });
      return;
    }

    const link = linkCheck.rows[0];

    // Yetki kontrolü: link oluşturan, komisyon yöneticisi veya admin
    const userRole = req.user?.role;
    const isAdmin = userRole === 'admin';
    const isLinkOwner = link.created_by === userId;

    if (!isAdmin && !isLinkOwner) {
      const managerCheck = await pool.query(
        'SELECT id FROM commission_members WHERE commission_id = $1 AND user_id = $2 AND role = $3 AND status = $4',
        [commissionId, userId, 'manager', 'active']
      );

      if (managerCheck.rows.length === 0) {
        res.status(403).json({
          success: false,
          message: 'Bu linki güncelleme yetkiniz yok'
        });
        return;
      }
    }

    // Linki güncelle
    const updateQuery = `
      UPDATE commission_links 
      SET title = $1, url = $2, description = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND commission_id = $5
      RETURNING *
    `;

    const values = [title.trim(), url.trim(), description?.trim() || null, linkId, commissionId];
    const result = await pool.query(updateQuery, values);

    res.json({
      success: true,
      message: 'Link başarıyla güncellendi',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update commission link error:', error);
    res.status(500).json({
      success: false,
      message: 'Link güncellenemedi'
    });
  }
};

// Komisyon linki sil (sadece link oluşturan veya komisyon yöneticisi veya admin)
export const deleteCommissionLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commissionId, linkId } = req.params;
    const userId = req.user?.userId;

    // Link mevcut mu ve bu komisyona ait mi kontrol et
    const linkCheck = await pool.query(
      'SELECT created_by FROM commission_links WHERE id = $1 AND commission_id = $2',
      [linkId, commissionId]
    );

    if (linkCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Link bulunamadı'
      });
      return;
    }

    const link = linkCheck.rows[0];

    // Yetki kontrolü: link oluşturan, komisyon yöneticisi veya admin
    const userRole = req.user?.role;
    const isAdmin = userRole === 'admin';
    const isLinkOwner = link.created_by === userId;

    if (!isAdmin && !isLinkOwner) {
      const managerCheck = await pool.query(
        'SELECT id FROM commission_members WHERE commission_id = $1 AND user_id = $2 AND role = $3 AND status = $4',
        [commissionId, userId, 'manager', 'active']
      );

      if (managerCheck.rows.length === 0) {
        res.status(403).json({
          success: false,
          message: 'Bu linki silme yetkiniz yok'
        });
        return;
      }
    }

    // Linki sil
    await pool.query(
      'DELETE FROM commission_links WHERE id = $1 AND commission_id = $2',
      [linkId, commissionId]
    );

    res.json({
      success: true,
      message: 'Link başarıyla silindi'
    });

  } catch (error) {
    console.error('Delete commission link error:', error);
    res.status(500).json({
      success: false,
      message: 'Link silinemedi'
    });
  }
}; 