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

    // Belge istatistikleri - boş tablo için güvenli sorgu
    const documentStatsQuery = `
      SELECT 
        COALESCE(COUNT(*), 0) as total_documents,
        COALESCE(COUNT(CASE WHEN uploaded_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END), 0) as new_documents_this_month,
        COALESCE(SUM(file_size), 0) as total_size,
        COALESCE(COUNT(DISTINCT category), 0) as categories_count
      FROM documents
    `;

    // Mail/rapor istatistikleri - boş tablo için güvenli sorgu
    const mailStatsQuery = `
      SELECT 
        COALESCE(COUNT(*), 0) as total_mails,
        COALESCE(COUNT(CASE WHEN status = 'sent' THEN 1 END), 0) as sent_mails,
        COALESCE(COUNT(CASE WHEN status = 'failed' THEN 1 END), 0) as failed_mails,
        COALESCE(COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END), 0) as mails_this_month
      FROM mail_logs
    `;

    // Ödeme/aidat istatistikleri - boş tablo için güvenli sorgu
    const feeStatsQuery = `
      SELECT 
        COALESCE(COUNT(*), 0) as total_fees,
        COALESCE(COUNT(CASE WHEN status = 'paid' THEN 1 END), 0) as paid_fees,
        COALESCE(COUNT(CASE WHEN status = 'pending' THEN 1 END), 0) as pending_fees,
        COALESCE(COUNT(CASE WHEN status = 'overdue' THEN 1 END), 0) as overdue_fees,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_collected
      FROM membership_fees
    `;

    // Tüm sorguları paralel çalıştır
    const [
      userStatsResult,
      commissionStatsResult,
      monthlyActivityResult,
      commissionDetailsResult,
      recentActivitiesResult,
      pendingApplicationsResult,
      documentStatsResult,
      mailStatsResult,
      feeStatsResult
    ] = await Promise.all([
      pool.query(userStatsQuery),
      pool.query(commissionStatsQuery),
      pool.query(monthlyActivityQuery),
      pool.query(commissionDetailsQuery),
      pool.query(recentActivitiesQuery),
      pool.query(pendingApplicationsQuery),
      pool.query(documentStatsQuery),
      pool.query(mailStatsQuery),
      pool.query(feeStatsQuery)
    ]);

    const userStats = userStatsResult.rows[0];
    const commissionStats = commissionStatsResult.rows[0];
    const monthlyActivity = monthlyActivityResult.rows[0];
    const commissionDetails = commissionDetailsResult.rows;
    const recentActivities = recentActivitiesResult.rows;
    const pendingApplications = parseInt(pendingApplicationsResult.rows[0].pending_count);
    const documentStats = documentStatsResult.rows[0];
    const mailStats = mailStatsResult.rows[0];
    const feeStats = feeStatsResult.rows[0];

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
      
      // Belge istatistikleri
      totalDocuments: parseInt(documentStats.total_documents) || 0,
      newDocumentsThisMonth: parseInt(documentStats.new_documents_this_month) || 0,
      totalDocumentSize: parseInt(documentStats.total_size) || 0,
      documentCategories: parseInt(documentStats.categories_count) || 0,
      
      // Mail/rapor istatistikleri
      totalMails: parseInt(mailStats.total_mails) || 0,
      sentMails: parseInt(mailStats.sent_mails) || 0,
      failedMails: parseInt(mailStats.failed_mails) || 0,
      mailsThisMonth: parseInt(mailStats.mails_this_month) || 0,
      
      // Ödeme/aidat istatistikleri
      totalFees: parseInt(feeStats.total_fees) || 0,
      paidFees: parseInt(feeStats.paid_fees) || 0,
      pendingFees: parseInt(feeStats.pending_fees) || 0,
      overdueFees: parseInt(feeStats.overdue_fees) || 0,
      totalCollected: parseFloat(feeStats.total_collected) || 0,
      
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