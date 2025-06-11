import { Request, Response } from 'express';
import pool from '../config/database';

// Dashboard istatistiklerini getir
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Toplam kullanıcı sayısı ve rol dağılımı
    const userStatsQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN role = 'member' THEN 1 END) as member_count,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_users
      FROM users
    `;

    // Aktif komisyon sayısı
    const commissionStatsQuery = `
      SELECT 
        COUNT(*) as total_commissions,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_commissions
      FROM commissions
    `;

    // Bu ay oluşturulan kayıtlar (aktivite)
    const monthlyActivityQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) as new_users_this_month,
        (SELECT COUNT(*) FROM commissions WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) as new_commissions_this_month,
        (SELECT COUNT(*) FROM commission_members WHERE DATE_TRUNC('month', joined_at) = DATE_TRUNC('month', CURRENT_DATE)) as new_memberships_this_month
    `;

    // Komisyon doluluk oranları
    const commissionDetailsQuery = `
      SELECT 
        c.id,
        c.name,
        c.max_members,
        COUNT(CASE WHEN u.is_active = true THEN cm.user_id END) as current_members,
        c.created_at
      FROM commissions c
      LEFT JOIN commission_members cm ON c.id = cm.commission_id
      LEFT JOIN users u ON cm.user_id = u.id
      WHERE c.is_active = true
      GROUP BY c.id, c.name, c.max_members, c.created_at
      ORDER BY c.created_at DESC
    `;

    // Son aktiviteler
    const recentActivitiesQuery = `
      SELECT 
        'user_created' as activity_type,
        u.first_name || ' ' || u.last_name as description,
        u.created_at as activity_date
      FROM users u
      WHERE u.created_at >= CURRENT_DATE - INTERVAL '30 days'
      
      UNION ALL
      
      SELECT 
        'commission_created' as activity_type,
        'Yeni komisyon: ' || c.name as description,
        c.created_at as activity_date
      FROM commissions c
      WHERE c.created_at >= CURRENT_DATE - INTERVAL '30 days'
      
      UNION ALL
      
      SELECT 
        'member_joined' as activity_type,
        u.first_name || ' ' || u.last_name || ' komisyona katıldı' as description,
        cm.joined_at as activity_date
      FROM commission_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.joined_at >= CURRENT_DATE - INTERVAL '30 days'
      
      ORDER BY activity_date DESC
      LIMIT 10
    `;

    // Bekleyen başvuru sayısı
    const pendingApplicationsQuery = `
      SELECT COUNT(*) as pending_count
      FROM commission_members 
      WHERE status = 'pending'
    `;

    // Tüm sorguları paralel çalıştır
    const [
      userStatsResult,
      commissionStatsResult,
      monthlyActivityResult,
      commissionDetailsResult,
      recentActivitiesResult,
      pendingApplicationsResult
    ] = await Promise.all([
      pool.query(userStatsQuery),
      pool.query(commissionStatsQuery),
      pool.query(monthlyActivityQuery),
      pool.query(commissionDetailsQuery),
      pool.query(recentActivitiesQuery),
      pool.query(pendingApplicationsQuery)
    ]);

    const userStats = userStatsResult.rows[0];
    const commissionStats = commissionStatsResult.rows[0];
    const monthlyActivity = monthlyActivityResult.rows[0];
    const commissionDetails = commissionDetailsResult.rows;
    const recentActivities = recentActivitiesResult.rows;
    const pendingApplications = parseInt(pendingApplicationsResult.rows[0].pending_count);

    // Toplam aylık aktivite hesapla
    const totalMonthlyActivities = 
      parseInt(monthlyActivity.new_users_this_month) + 
      parseInt(monthlyActivity.new_commissions_this_month) + 
      parseInt(monthlyActivity.new_memberships_this_month);

    const dashboardData = {
      totalUsers: parseInt(userStats.total_users),
      activeCommissions: parseInt(commissionStats.active_commissions),
      monthlyActivities: totalMonthlyActivities,
      pendingApplications: pendingApplications,
      usersByRole: {
        admin: parseInt(userStats.admin_count),
        member: parseInt(userStats.member_count)
      },
      commissionsData: commissionDetails.map(commission => ({
        id: commission.id,
        name: commission.name,
        members: parseInt(commission.current_members),
        max: commission.max_members
      })),
      recentActivities: recentActivities.map(activity => ({
        type: activity.activity_type,
        description: activity.description,
        date: activity.activity_date
      }))
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Dashboard verileri getirilemedi'
    });
  }
};

// Tüm kullanıcıları getir (üye yönetimi için)
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        id, email, first_name, last_name, phone_number, profession, 
        role, is_active, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcılar getirilemedi'
    });
  }
}; 