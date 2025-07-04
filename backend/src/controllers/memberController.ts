import { Request, Response } from 'express';
import pool from '../config/database';

// Üyenin dashboard verilerini getir
export const getMemberDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    // Üyenin katıldığı komisyonlar (sadece aktif olanlar)
    const commissionsQuery = `
      SELECT 
        c.id,
        c.name,
        c.description,
        c.max_members,
        COUNT(CASE WHEN u.is_active = true AND cm2.status = 'active' THEN cm2.user_id END) as current_members,
        cm.joined_at,
        cm.role as member_role,
        cm.status,
        CASE WHEN cm.role = 'manager' THEN 
          (SELECT COUNT(*) FROM commission_members WHERE commission_id = c.id AND status = 'pending')
        ELSE 0 END as pending_applications_count
      FROM commission_members cm
      JOIN commissions c ON cm.commission_id = c.id
      LEFT JOIN commission_members cm2 ON c.id = cm2.commission_id
      LEFT JOIN users u ON cm2.user_id = u.id
      WHERE cm.user_id = $1 AND c.is_active = true AND cm.status = 'active'
      GROUP BY c.id, c.name, c.description, c.max_members, cm.joined_at, cm.role, cm.status
      ORDER BY cm.joined_at DESC
    `;

    // Toplam istatistikler
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM commission_members WHERE user_id = $1 AND status = 'active') as total_commissions,
        (SELECT COUNT(*) FROM commissions WHERE is_active = true) as available_commissions,
        (SELECT COUNT(DISTINCT cm.commission_id) 
         FROM commission_members cm 
         JOIN commissions c ON cm.commission_id = c.id 
         WHERE cm.user_id = $1 AND c.is_active = true AND cm.status = 'active') as active_memberships,
        (SELECT COUNT(*) 
         FROM users u 
         WHERE u.role = 'member' AND u.is_active = true) as total_members
    `;

    // Son aktiviteler (sadece aktif üyelikler)
    const activitiesQuery = `
      SELECT 
        'commission_join' as type,
        c.name as title,
        CASE 
          WHEN cm.status = 'active' THEN 'Komisyona katıldınız'
          WHEN cm.status = 'pending' THEN 'Komisyona başvuru yaptınız'
          ELSE 'Komisyon işlemi'
        END as description,
        cm.joined_at as date
      FROM commission_members cm
      JOIN commissions c ON cm.commission_id = c.id
      WHERE cm.user_id = $1
      ORDER BY cm.joined_at DESC
      LIMIT 5
    `;

    // Yaklaşan etkinlikler (önümüzdeki 30 gün)
    const upcomingEventsQuery = `
      SELECT 
        id,
        title,
        description,
        event_type,
        start_date,
        end_date,
        start_time,
        end_time,
        is_all_day,
        location,
        color
      FROM calendar_events 
      WHERE start_date >= CURRENT_DATE 
        AND start_date <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY start_date ASC, start_time ASC
      LIMIT 8
    `;

    // Günlük mesajlar
    const dailyMessagesQuery = `
      SELECT 
        id,
        message,
        display_order
      FROM daily_messages 
      WHERE is_active = true 
      ORDER BY display_order ASC, created_at ASC
    `;

    const [commissionsResult, statsResult, activitiesResult, upcomingEventsResult, dailyMessagesResult] = await Promise.all([
      pool.query(commissionsQuery, [userId]),
      pool.query(statsQuery, [userId]),
      pool.query(activitiesQuery, [userId]),
      pool.query(upcomingEventsQuery),
      pool.query(dailyMessagesQuery)
    ]);

    res.json({
      success: true,
      data: {
        commissions: commissionsResult.rows,
        stats: statsResult.rows[0],
        recentActivities: activitiesResult.rows,
        upcomingEvents: upcomingEventsResult.rows,
        dailyMessages: dailyMessagesResult.rows
      }
    });

  } catch (error) {
    console.error('Get member dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Dashboard verileri getirilemedi'
    });
  }
};

// Üyenin katılabileceği komisyonları getir
export const getAvailableCommissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const query = `
      SELECT 
        c.id,
        c.name,
        c.description,
        c.max_members,
        COUNT(CASE WHEN u.is_active = true AND cm.status = 'active' THEN cm.user_id END) as current_members,
        CASE WHEN cm_user.user_id IS NOT NULL THEN true ELSE false END as is_member,
        cm_user.status as member_status
      FROM commissions c
      LEFT JOIN commission_members cm ON c.id = cm.commission_id
      LEFT JOIN users u ON cm.user_id = u.id
      LEFT JOIN commission_members cm_user ON c.id = cm_user.commission_id AND cm_user.user_id = $1
      WHERE c.is_active = true
      GROUP BY c.id, c.name, c.description, c.max_members, cm_user.user_id, cm_user.status
      HAVING COUNT(CASE WHEN u.is_active = true AND cm.status = 'active' THEN cm.user_id END) < c.max_members 
         OR cm_user.user_id IS NOT NULL
      ORDER BY c.created_at DESC
    `;

    const result = await pool.query(query, [userId]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get available commissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Komisyonlar getirilemedi'
    });
  }
};

// Komisyona katıl (sadece üyeler katılabilir)
export const joinCommission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commissionId } = req.params;
    const userId = req.user?.userId;

    // Kullanıcının member olduğunu kontrol et
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Yetkisiz erişim'
      });
      return;
    }

    // Komisyon var mı ve kapasite dolu mu kontrol et
    const capacityQuery = `
      SELECT 
        c.max_members,
        COUNT(CASE WHEN u.is_active = true THEN cm.user_id END) as current_members,
        c.name,
        c.is_active
      FROM commissions c
      LEFT JOIN commission_members cm ON c.id = cm.commission_id
      LEFT JOIN users u ON cm.user_id = u.id
      WHERE c.id = $1 AND c.is_active = true
      GROUP BY c.id, c.max_members, c.name, c.is_active
    `;

    const capacityResult = await pool.query(capacityQuery, [commissionId]);
    
    if (capacityResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Komisyon bulunamadı veya aktif değil'
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

    // Zaten üye mi veya başvuru yapmış mı kontrol et
    const memberCheck = await pool.query(
      'SELECT id, status FROM commission_members WHERE commission_id = $1 AND user_id = $2',
      [commissionId, userId]
    );

    if (memberCheck.rows.length > 0) {
      const memberStatus = memberCheck.rows[0].status;
      if (memberStatus === 'active') {
        res.status(409).json({
          success: false,
          message: 'Zaten bu komisyonun üyesisiniz'
        });
        return;
      } else if (memberStatus === 'pending') {
        res.status(409).json({
          success: false,
          message: 'Bu komisyona zaten başvuru yaptınız'
        });
        return;
      }
    }

    // Kullanıcının aktif olduğunu kontrol et
    const userCheck = await pool.query(
      'SELECT is_active FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0 || !userCheck.rows[0].is_active) {
      res.status(403).json({
        success: false,
        message: 'Hesabınız aktif değil'
      });
      return;
    }

    // Komisyona başvur (pending durumunda)
    await pool.query(
      'INSERT INTO commission_members (commission_id, user_id, role, status) VALUES ($1, $2, $3, $4)',
      [commissionId, userId, 'member', 'pending']
    );

    res.json({
      success: true,
      message: `${commission.name} komisyonuna başvurunuz alındı. Komisyon yöneticisinin onayını bekleyiniz.`
    });

  } catch (error) {
    console.error('Join commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Komisyona katılınamadı'
    });
  }
};

// Komisyondan ayrıl (sadece kendi üyeliğinden)
export const leaveCommission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commissionId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Yetkisiz erişim'
      });
      return;
    }

    // Komisyon ve üyelik durumunu kontrol et
    const membershipCheck = await pool.query(
      `SELECT cm.id, cm.role, c.name, c.is_active 
       FROM commission_members cm 
       JOIN commissions c ON cm.commission_id = c.id 
       WHERE cm.commission_id = $1 AND cm.user_id = $2`,
      [commissionId, userId]
    );

    if (membershipCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Bu komisyonun üyesi değilsiniz'
      });
      return;
    }

    const membership = membershipCheck.rows[0];

    // Komisyon lideriyse uyar
    if (membership.role === 'leader') {
      res.status(400).json({
        success: false,
        message: 'Komisyon lideri olduğunuz için ayrılamazsınız. Lütfen yönetici ile iletişime geçin.'
      });
      return;
    }

    // Normal üye ise ayrılabilir
    const result = await pool.query(
      'DELETE FROM commission_members WHERE commission_id = $1 AND user_id = $2',
      [commissionId, userId]
    );

    if (result.rowCount === 0) {
      res.status(500).json({
        success: false,
        message: 'Komisyondan ayrılma işlemi başarısız'
      });
      return;
    }

    res.json({
      success: true,
      message: `${membership.name} komisyonundan başarıyla ayrıldınız`
    });

  } catch (error) {
    console.error('Leave commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Komisyondan ayrılınamadı'
    });
  }
};

// Belirli bir komisyonun detayını ve üyelerini getir (tüm aktif ortaklar görüntüleyebilir)
export const getCommissionDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commissionId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Yetkisiz erişim'
      });
      return;
    }

    // Kullanıcının aktif olup olmadığını kontrol et
    const userCheck = await pool.query(
      'SELECT is_active FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0 || !userCheck.rows[0].is_active) {
      res.status(403).json({
        success: false,
        message: 'Hesabınız aktif değil'
      });
      return;
    }

    // Komisyonun aktif olup olmadığını kontrol et
    const commissionCheck = await pool.query(
      'SELECT is_active FROM commissions WHERE id = $1',
      [commissionId]
    );

    if (commissionCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Komisyon bulunamadı'
      });
      return;
    }

    if (!commissionCheck.rows[0].is_active) {
      res.status(404).json({
        success: false,
        message: 'Komisyon artık aktif değil'
      });
      return;
    }

    // Komisyon bilgileri (sadece aktif üyeleri say)
    const commissionQuery = `
      SELECT 
        c.*,
        COUNT(CASE WHEN u.is_active = true AND cm.status = 'active' THEN cm.user_id END) as current_members,
        creator.first_name || ' ' || creator.last_name as created_by_name
      FROM commissions c
      LEFT JOIN commission_members cm ON c.id = cm.commission_id
      LEFT JOIN users u ON cm.user_id = u.id
      LEFT JOIN users creator ON c.created_by = creator.id
      WHERE c.id = $1 AND c.is_active = true
      GROUP BY c.id, c.name, c.description, c.max_members, c.created_by, c.is_active, c.created_at, c.updated_at, creator.first_name, creator.last_name
    `;

    // Komisyon üyeleri (sadece aktif status)
    const membersQuery = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.profession,
        cm.joined_at,
        cm.role
      FROM commission_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.commission_id = $1 AND u.is_active = true AND cm.status = 'active'
      ORDER BY cm.joined_at ASC
    `;

    // Kullanıcının bu komisyonun üyesi olup olmadığını kontrol et (linkler için)
    const userMembershipQuery = `
      SELECT id FROM commission_members 
      WHERE commission_id = $1 AND user_id = $2 AND status = 'active'
    `;

    // Komisyon linkleri (sadece üyeler için)
    const linksQuery = `
      SELECT 
        cl.*,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM commission_links cl
      LEFT JOIN users u ON cl.created_by = u.id
      WHERE cl.commission_id = $1
      ORDER BY cl.created_at DESC
    `;

    const [commissionResult, membersResult, userMembershipResult] = await Promise.all([
      pool.query(commissionQuery, [commissionId]),
      pool.query(membersQuery, [commissionId]),
      pool.query(userMembershipQuery, [commissionId, userId])
    ]);

    if (commissionResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Komisyon bulunamadı'
      });
      return;
    }

    // Eğer kullanıcı komisyon üyesiyse linkleri de getir
    let links: any[] = [];
    const isMember = userMembershipResult.rows.length > 0;
    
    if (isMember) {
      const linksResult = await pool.query(linksQuery, [commissionId]);
      links = linksResult.rows;
    }

    res.json({
      success: true,
      data: {
        commission: commissionResult.rows[0],
        members: membersResult.rows,
        links: links,
        isMember: isMember
      }
    });

  } catch (error) {
    console.error('Get commission detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Komisyon detayları getirilemedi'
    });
  }
}; 