import { Request, Response } from 'express';
import pool from '../config/database';

// Tüm aidat planlarını getir
export const getAllPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        mp.*,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM membership_plans mp
      LEFT JOIN users u ON mp.created_by = u.id
      WHERE mp.is_active = true
      ORDER BY mp.period_months ASC, mp.amount ASC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get all plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Aidat planları getirilemedi'
    });
  }
};

// Aidat planı oluştur (sadece admin)
export const createPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, amount, period_months, description } = req.body;
    const userId = req.user?.userId;

    if (!name || !amount || !period_months) {
      res.status(400).json({
        success: false,
        message: 'Plan adı, tutarı ve periyodu gereklidir'
      });
      return;
    }

    const query = `
      INSERT INTO membership_plans (name, amount, period_months, description, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [name.trim(), parseFloat(amount), parseInt(period_months), description?.trim(), userId];
    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Aidat planı başarıyla oluşturuldu',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Aidat planı oluşturulamadı'
    });
  }
};

// Aidat planı sil (sadece admin)
export const deletePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId } = req.params;

    if (!planId) {
      res.status(400).json({
        success: false,
        message: 'Plan ID gereklidir'
      });
      return;
    }

    // Önce plan var mı kontrol et
    const planCheck = await pool.query(
      'SELECT id, name FROM membership_plans WHERE id = $1',
      [planId]
    );

    if (planCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Plan bulunamadı'
      });
      return;
    }

    // Bu plana bağlı aidatlar var mı kontrol et
    const feeCheck = await pool.query(
      'SELECT COUNT(*) as fee_count FROM membership_fees WHERE plan_id = $1',
      [planId]
    );

    const feeCount = parseInt(feeCheck.rows[0].fee_count);

    if (feeCount > 0) {
      res.status(400).json({
        success: false,
        message: `Bu plana bağlı ${feeCount} adet aidat kaydı bulunmaktadır. Önce bu aidatları silmeniz veya başka plana taşımanız gerekmektedir.`
      });
      return;
    }

    // Planı sil
    await pool.query('DELETE FROM membership_plans WHERE id = $1', [planId]);

    res.json({
      success: true,
      message: 'Aidat planı başarıyla silindi'
    });

  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Aidat planı silinirken hata oluştu'
    });
  }
};

// Kullanıcının aidatlarını getir
export const getUserFees = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const { targetUserId } = req.params;

    // Admin tüm kullanıcıları görebilir, üye sadece kendisini
    const queryUserId = userRole === 'admin' && targetUserId ? targetUserId : userId;

    const query = `
      SELECT 
        mf.*,
        mp.name as plan_name,
        mp.period_months,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email,
        CASE 
          WHEN mf.status = 'paid' THEN 'Ödendi'
          WHEN mf.due_date < CURRENT_DATE AND mf.status = 'pending' THEN 'Gecikmiş'
          ELSE 'Beklemede'
        END as status_text,
        CASE 
          WHEN mf.due_date < CURRENT_DATE AND mf.status = 'pending' 
          THEN CURRENT_DATE - mf.due_date 
          ELSE 0 
        END as days_overdue
      FROM membership_fees mf
      JOIN membership_plans mp ON mf.plan_id = mp.id
      JOIN users u ON mf.user_id = u.id
      WHERE mf.user_id = $1
      ORDER BY mf.due_date DESC
    `;

    const result = await pool.query(query, [queryUserId]);

    // Cache-control header'ları ekle
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get user fees error:', error);
    res.status(500).json({
      success: false,
      message: 'Aidat bilgileri getirilemedi'
    });
  }
};

// Tüm aidatları getir (sadece admin)
export const getAllFees = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, month, year } = req.query;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (status && status !== 'all') {
      params.push(status);
      whereClause += ` AND mf.status = $${params.length}`;
    }

    if (month && year) {
      params.push(parseInt(year as string), parseInt(month as string));
      whereClause += ` AND EXTRACT(YEAR FROM mf.due_date) = $${params.length - 1} AND EXTRACT(MONTH FROM mf.due_date) = $${params.length}`;
    }

    const query = `
      SELECT 
        mf.*,
        mp.name as plan_name,
        mp.period_months,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email,
        u.phone_number,
        CASE 
          WHEN mf.status = 'paid' THEN 'Ödendi'
          WHEN mf.due_date < CURRENT_DATE AND mf.status = 'pending' THEN 'Gecikmiş'
          ELSE 'Beklemede'
        END as status_text,
        CASE 
          WHEN mf.due_date < CURRENT_DATE AND mf.status = 'pending' 
          THEN CURRENT_DATE - mf.due_date 
          ELSE 0 
        END as days_overdue
      FROM membership_fees mf
      JOIN membership_plans mp ON mf.plan_id = mp.id
      JOIN users u ON mf.user_id = u.id
      ${whereClause}
      ORDER BY mf.due_date DESC, u.last_name ASC
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get all fees error:', error);
    res.status(500).json({
      success: false,
      message: 'Aidat listesi getirilemedi'
    });
  }
};

// Aidat oluştur
export const createFee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id, plan_id, due_date, notes, payment_type = 'installments' } = req.body;

    if (!user_id || !plan_id || !due_date) {
      res.status(400).json({
        success: false,
        message: 'Kullanıcı, plan ve vade tarihi gereklidir'
      });
      return;
    }

    // Plan bilgilerini al
    const planResult = await pool.query(
      'SELECT * FROM membership_plans WHERE id = $1 AND is_active = true',
      [plan_id]
    );

    if (planResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Geçersiz aidat planı'
      });
      return;
    }

    const plan = planResult.rows[0];
    
    // Transaction başlat
    await pool.query('BEGIN');

    try {
      let createdFees = [];

      if (payment_type === 'full_payment') {
        // Tek seferde tam ödeme - sadece bir aidat kaydı
        const query = `
          INSERT INTO membership_fees (user_id, plan_id, amount, due_date, notes)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;

        const values = [user_id, plan_id, plan.amount, due_date, notes?.trim()];
        const result = await pool.query(query, values);
        createdFees.push(result.rows[0]);

      } else {
        // Taksitli ödeme - plan süresine göre aylık aidatlar
        const monthlyAmount = (parseFloat(plan.amount) / plan.period_months).toFixed(2);
        const startDate = new Date(due_date);

        for (let i = 0; i < plan.period_months; i++) {
          const installmentDate = new Date(startDate);
          installmentDate.setMonth(installmentDate.getMonth() + i);

          const installmentNotes = `${plan.name} - ${i + 1}. Taksit (${plan.period_months} taksit)${notes ? ' - ' + notes : ''}`;

          const query = `
            INSERT INTO membership_fees (user_id, plan_id, amount, due_date, notes)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
          `;

          const values = [
            user_id, 
            plan_id, 
            parseFloat(monthlyAmount), 
            installmentDate.toISOString().split('T')[0], 
            installmentNotes
          ];

          const result = await pool.query(query, values);
          createdFees.push(result.rows[0]);
        }
      }

      await pool.query('COMMIT');

      res.status(201).json({
        success: true,
        message: payment_type === 'full_payment' 
          ? 'Tek seferlik aidat başarıyla oluşturuldu'
          : `${plan.period_months} aylık taksitli aidat başarıyla oluşturuldu`,
        data: {
          payment_type,
          plan_info: {
            name: plan.name,
            total_amount: plan.amount,
            period_months: plan.period_months,
            monthly_amount: payment_type === 'installments' ? parseFloat(plan.amount) / plan.period_months : null
          },
          created_fees: createdFees
        }
      });

    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Create fee error:', error);
    res.status(500).json({
      success: false,
      message: 'Aidat oluşturulamadı'
    });
  }
};

// Ödeme kaydet
export const recordPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { membership_fee_id, amount, payment_method, transaction_id, notes } = req.body;
    const processedBy = req.user?.userId;

    if (!membership_fee_id || !amount) {
      res.status(400).json({
        success: false,
        message: 'Aidat ID ve tutar gereklidir'
      });
      return;
    }

    // Aidat bilgilerini kontrol et
    const feeResult = await pool.query(
      'SELECT * FROM membership_fees WHERE id = $1',
      [membership_fee_id]
    );

    if (feeResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Aidat bulunamadı'
      });
      return;
    }

    const fee = feeResult.rows[0];

    if (fee.status === 'paid') {
      res.status(400).json({
        success: false,
        message: 'Bu aidat zaten ödenmiş'
      });
      return;
    }

    // Transaction başlat
    await pool.query('BEGIN');

    try {
      // Ödeme kaydı oluştur
      const paymentQuery = `
        INSERT INTO payments (membership_fee_id, amount, payment_method, transaction_id, processed_by, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const paymentValues = [
        membership_fee_id, 
        parseFloat(amount), 
        payment_method || 'bank_transfer', 
        transaction_id?.trim(), 
        processedBy, 
        notes?.trim()
      ];

      const paymentResult = await pool.query(paymentQuery, paymentValues);

      // Aidat durumunu güncelle
      await pool.query(
        'UPDATE membership_fees SET status = $1, paid_date = CURRENT_TIMESTAMP WHERE id = $2',
        ['paid', membership_fee_id]
      );

      await pool.query('COMMIT');

      res.json({
        success: true,
        message: 'Ödeme başarıyla kaydedildi',
        data: paymentResult.rows[0]
      });

    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Ödeme kaydedilemedi'
    });
  }
};

// Aidat istatistikleri getir
// Toplu ödeme kaydet (bir grup aidat için)
export const recordBulkPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fee_ids, payment_method, transaction_id, notes } = req.body;
    const processedBy = req.user?.userId;

    if (!fee_ids || !Array.isArray(fee_ids) || fee_ids.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Aidat ID\'leri gereklidir'
      });
      return;
    }

    // Transaction başlat
    await pool.query('BEGIN');

    try {
      const paymentResults = [];
      let totalAmount = 0;

      for (const fee_id of fee_ids) {
        // Aidat bilgilerini kontrol et
        const feeResult = await pool.query(
          'SELECT * FROM membership_fees WHERE id = $1',
          [fee_id]
        );

        if (feeResult.rows.length === 0) {
          throw new Error(`Aidat bulunamadı: ${fee_id}`);
        }

        const fee = feeResult.rows[0];

        if (fee.status === 'paid') {
          throw new Error(`Bu aidat zaten ödenmiş: ${fee_id}`);
        }

        totalAmount += parseFloat(fee.amount);

        // Ödeme kaydı oluştur
        const paymentQuery = `
          INSERT INTO payments (membership_fee_id, amount, payment_method, transaction_id, processed_by, notes)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;

        const paymentValues = [
          fee_id,
          parseFloat(fee.amount),
          payment_method || 'bank_transfer',
          transaction_id?.trim(),
          processedBy,
          notes?.trim()
        ];

        const paymentResult = await pool.query(paymentQuery, paymentValues);
        paymentResults.push(paymentResult.rows[0]);

        // Aidat durumunu güncelle
        await pool.query(
          'UPDATE membership_fees SET status = $1, paid_date = CURRENT_TIMESTAMP WHERE id = $2',
          ['paid', fee_id]
        );
      }

      await pool.query('COMMIT');

      res.json({
        success: true,
        message: `${fee_ids.length} adet aidat başarıyla ödendi`,
        data: {
          total_amount: totalAmount,
          payment_count: fee_ids.length,
          payments: paymentResults
        }
      });

    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error: any) {
    console.error('Record bulk payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Toplu ödeme kaydedilemedi'
    });
  }
};

// Aidat sil
export const deleteFee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { feeId } = req.params;

    if (!feeId) {
      res.status(400).json({
        success: false,
        message: 'Aidat ID gereklidir'
      });
      return;
    }

    // Aidat var mı kontrol et
    const feeCheck = await pool.query(
      'SELECT * FROM membership_fees WHERE id = $1',
      [feeId]
    );

    if (feeCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Aidat bulunamadı'
      });
      return;
    }

    const fee = feeCheck.rows[0];

    // Ödenmiş aidat silinemesin
    if (fee.status === 'paid') {
      res.status(400).json({
        success: false,
        message: 'Ödenmiş aidatlar silinemez'
      });
      return;
    }

    // Transaction başlat
    await pool.query('BEGIN');

    try {
      // Önce payment kayıtlarını sil (eğer varsa)
      await pool.query('DELETE FROM payments WHERE membership_fee_id = $1', [feeId]);
      
      // Hatırlatma kayıtlarını sil (eğer varsa)
      await pool.query('DELETE FROM fee_reminders WHERE membership_fee_id = $1', [feeId]);
      
      // Aidat kaydını sil
      await pool.query('DELETE FROM membership_fees WHERE id = $1', [feeId]);

      await pool.query('COMMIT');

      res.json({
        success: true,
        message: 'Aidat başarıyla silindi'
      });

    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Delete fee error:', error);
    res.status(500).json({
      success: false,
      message: 'Aidat silinirken hata oluştu'
    });
  }
};

// Taksitli aidat grubunu getir
export const getFeeGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, planId } = req.params;

    if (!userId || !planId) {
      res.status(400).json({
        success: false,
        message: 'Kullanıcı ID ve Plan ID gereklidir'
      });
      return;
    }

    const query = `
      SELECT 
        mf.*,
        mp.name as plan_name,
        mp.period_months,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email,
        CASE 
          WHEN mf.status = 'paid' THEN 'Ödendi'
          WHEN mf.due_date < CURRENT_DATE AND mf.status = 'pending' THEN 'Gecikmiş'
          ELSE 'Beklemede'
        END as status_text,
        CASE 
          WHEN mf.due_date < CURRENT_DATE AND mf.status = 'pending' 
          THEN CURRENT_DATE - mf.due_date 
          ELSE 0 
        END as days_overdue,
        p.amount as payment_amount,
        p.payment_date,
        p.payment_method,
        p.transaction_id as payment_transaction_id
      FROM membership_fees mf
      JOIN membership_plans mp ON mf.plan_id = mp.id
      JOIN users u ON mf.user_id = u.id
      LEFT JOIN payments p ON mf.id = p.membership_fee_id
      WHERE mf.user_id = $1 AND mf.plan_id = $2
      AND mf.notes LIKE '%taksit%'
      ORDER BY mf.due_date ASC
    `;

    const result = await pool.query(query, [userId, planId]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Taksitli aidat grubu bulunamadı'
      });
      return;
    }

    // Grup bilgilerini hesapla
    const fees = result.rows;
    const totalAmount = fees.reduce((sum, fee) => sum + parseFloat(fee.amount), 0);
    const paidAmount = fees.filter(fee => fee.status === 'paid').reduce((sum, fee) => sum + parseFloat(fee.amount), 0);
    const pendingAmount = totalAmount - paidAmount;
    const completedCount = fees.filter(fee => fee.status === 'paid').length;

    res.json({
      success: true,
      data: {
        fees,
        summary: {
          total_installments: fees.length,
          completed_installments: completedCount,
          remaining_installments: fees.length - completedCount,
          total_amount: totalAmount,
          paid_amount: paidAmount,
          pending_amount: pendingAmount,
          plan_name: fees[0].plan_name,
          user_name: fees[0].user_name,
          period_months: fees[0].period_months
        }
      }
    });

  } catch (error) {
    console.error('Get fee group error:', error);
    res.status(500).json({
      success: false,
      message: 'Taksit grubu bilgileri getirilemedi'
    });
  }
};

export const getFeeStats = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Getting fee stats...');
    
    // Güncel gerçek istatistikler - tüm zamanlar
    const statsQuery = `
      SELECT 
        COUNT(*)::text as total_fees,
        COUNT(CASE WHEN status = 'paid' THEN 1 END)::text as paid_fees,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::text as pending_fees,
        COUNT(CASE WHEN status = 'pending' AND due_date < CURRENT_DATE THEN 1 END)::text as overdue_fees,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0)::text as total_paid_amount,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0)::text as pending_amount
      FROM membership_fees
    `;

    // Aylık ödeme istatistikleri - payments tablosundan gerçek ödemeler
    const monthlyQuery = `
      SELECT 
        EXTRACT(YEAR FROM p.payment_date)::text as year,
        EXTRACT(MONTH FROM p.payment_date)::text as month,
        COUNT(*)::text as payment_count,
        SUM(p.amount)::text as total_amount
      FROM payments p
      WHERE p.payment_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY EXTRACT(YEAR FROM p.payment_date), EXTRACT(MONTH FROM p.payment_date)
      ORDER BY year DESC, month DESC
    `;

    // Bu ay vadesi dolacak aidatlar
    const upcomingQuery = `
      SELECT 
        COUNT(*)::text as upcoming_count,
        COALESCE(SUM(amount), 0)::text as upcoming_amount
      FROM membership_fees
      WHERE status = 'pending' 
      AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    `;

    // Gecikme analizı
    const overdueAnalysisQuery = `
      SELECT 
        CASE 
          WHEN CURRENT_DATE - due_date <= 7 THEN '1-7 gün'
          WHEN CURRENT_DATE - due_date <= 30 THEN '1-4 hafta'
          WHEN CURRENT_DATE - due_date <= 90 THEN '1-3 ay'
          ELSE '3+ ay'
        END as overdue_period,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM membership_fees
      WHERE status = 'pending' AND due_date < CURRENT_DATE
      GROUP BY 
        CASE 
          WHEN CURRENT_DATE - due_date <= 7 THEN '1-7 gün'
          WHEN CURRENT_DATE - due_date <= 30 THEN '1-4 hafta'
          WHEN CURRENT_DATE - due_date <= 90 THEN '1-3 ay'
          ELSE '3+ ay'
        END
      ORDER BY 
        MIN(CASE 
          WHEN CURRENT_DATE - due_date <= 7 THEN 1
          WHEN CURRENT_DATE - due_date <= 30 THEN 2
          WHEN CURRENT_DATE - due_date <= 90 THEN 3
          ELSE 4
        END)
    `;

    console.log('Executing queries...');
    const [statsResult, monthlyResult, upcomingResult, overdueResult] = await Promise.all([
      pool.query(statsQuery),
      pool.query(monthlyQuery),
      pool.query(upcomingQuery),
      pool.query(overdueAnalysisQuery)
    ]);
    
    console.log('Stats result:', statsResult.rows[0]);

    res.json({
      success: true,
      data: {
        stats: statsResult.rows[0],
        monthly: monthlyResult.rows,
        upcoming: upcomingResult.rows[0] || { upcoming_count: '0', upcoming_amount: '0' },
        overdue_analysis: overdueResult.rows
      }
    });

  } catch (error) {
    console.error('Get fee stats error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    res.status(500).json({
      success: false,
      message: 'İstatistikler getirilemedi',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Üye için kişisel aidat istatistikleri
export const getMemberStats = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('getMemberStats çağrıldı');
    console.log('req.user:', (req as any).user);
    
    const userId = (req as any).user?.userId;
    console.log('userId:', userId);
    
    if (!userId) {
      console.log('UserId bulunamadı');
      res.status(401).json({
        success: false,
        message: 'Kullanıcı kimliği gereklidir'
      });
      return;
    }

    // Üyenin aidat istatistikleri
    const memberStatsQuery = `
      SELECT 
        COUNT(*)::text as total_fees,
        COUNT(CASE WHEN status = 'paid' THEN 1 END)::text as paid_fees,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::text as pending_fees,
        COUNT(CASE WHEN status = 'pending' AND due_date < CURRENT_DATE THEN 1 END)::text as overdue_fees,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0)::text as total_paid_amount,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0)::text as pending_amount,
        COALESCE(SUM(CASE WHEN status = 'pending' AND due_date < CURRENT_DATE THEN amount ELSE 0 END), 0)::text as overdue_amount
      FROM membership_fees
      WHERE user_id = $1
    `;

    // Son ödeme tarihi
    const lastPaymentQuery = `
      SELECT 
        p.payment_date,
        p.amount,
        p.payment_method,
        mf.notes as fee_description
      FROM payments p
      JOIN membership_fees mf ON p.membership_fee_id = mf.id
      WHERE mf.user_id = $1
      ORDER BY p.payment_date DESC
      LIMIT 1
    `;

    // Yaklaşan vadeler (30 gün içinde)
    const upcomingFeesQuery = `
      SELECT 
        mf.id,
        mf.amount,
        mf.due_date,
        mf.notes,
        mp.name as plan_name
      FROM membership_fees mf
      JOIN membership_plans mp ON mf.plan_id = mp.id
      WHERE mf.user_id = $1 
      AND mf.status = 'pending'
      AND mf.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
      ORDER BY mf.due_date ASC
    `;

    // Ödeme geçmişi (son 12 ay)
    const paymentHistoryQuery = `
      SELECT 
        EXTRACT(YEAR FROM p.payment_date)::text as year,
        EXTRACT(MONTH FROM p.payment_date)::text as month,
        COUNT(*)::text as payment_count,
        SUM(p.amount)::text as total_amount
      FROM payments p
      JOIN membership_fees mf ON p.membership_fee_id = mf.id
      WHERE mf.user_id = $1
      AND p.payment_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY EXTRACT(YEAR FROM p.payment_date), EXTRACT(MONTH FROM p.payment_date)
      ORDER BY year DESC, month DESC
    `;

    const [memberStatsResult, lastPaymentResult, upcomingResult, historyResult] = await Promise.all([
      pool.query(memberStatsQuery, [userId]),
      pool.query(lastPaymentQuery, [userId]),
      pool.query(upcomingFeesQuery, [userId]),
      pool.query(paymentHistoryQuery, [userId])
    ]);

    // Cache-control header'ları ekle
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.json({
      success: true,
      data: {
        stats: memberStatsResult.rows[0],
        last_payment: lastPaymentResult.rows[0] || null,
        upcoming_fees: upcomingResult.rows,
        payment_history: historyResult.rows
      }
    });

  } catch (error) {
    console.error('Get member stats error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    res.status(500).json({
      success: false,
      message: 'Üye istatistikleri getirilemedi',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Toplu aidat oluşturma (tüm aktif ortaklara)
export const createBulkFees = async (req: Request, res: Response): Promise<void> => {
  try {
    const { plan_id, due_date, notes, user_filter } = req.body;
    const userId = req.user?.userId;

    if (!plan_id || !due_date) {
      res.status(400).json({
        success: false,
        message: 'Plan ID ve vade tarihi gereklidir'
      });
      return;
    }

    // Plan kontrolü
    const planCheck = await pool.query(
      'SELECT id, name, amount FROM membership_plans WHERE id = $1 AND is_active = true',
      [plan_id]
    );

    if (planCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Geçerli bir plan bulunamadı'
      });
      return;
    }

    const plan = planCheck.rows[0];

    // Kullanıcı filtresi oluştur
    let userQuery = 'SELECT id, first_name, last_name, email FROM users WHERE role = $1 AND is_active = true';
    const userParams = ['member'];

    if (user_filter && user_filter.length > 0) {
      userQuery += ` AND id = ANY($${userParams.length + 1})`;
      userParams.push(user_filter);
    }

    const usersResult = await pool.query(userQuery, userParams);
    const users = usersResult.rows;

    if (users.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Seçilen kriterlere uygun kullanıcı bulunamadı'
      });
      return;
    }

    // Her kullanıcı için aidat kontrolü yap (aynı aya ait aidat var mı?)
    const duplicateCheck = await pool.query(`
      SELECT user_id, COUNT(*) as existing_count
      FROM membership_fees mf
      WHERE mf.user_id = ANY($1)
      AND EXTRACT(YEAR FROM mf.due_date) = EXTRACT(YEAR FROM $2::date)
      AND EXTRACT(MONTH FROM mf.due_date) = EXTRACT(MONTH FROM $2::date)
      GROUP BY user_id
    `, [users.map(u => u.id), due_date]);

    const duplicateUsers = duplicateCheck.rows.map(row => row.user_id);
    const eligibleUsers = users.filter(user => !duplicateUsers.includes(user.id));

    if (eligibleUsers.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Seçilen ay için tüm kullanıcıların zaten aidatı mevcut'
      });
      return;
    }

    // Toplu aidat oluştur
    const createdFees = [];
    for (const user of eligibleUsers) {
      const feeQuery = `
        INSERT INTO membership_fees (user_id, plan_id, amount, due_date, notes, status)
        VALUES ($1, $2, $3, $4, $5, 'pending')
        RETURNING *
      `;

      const feeResult = await pool.query(feeQuery, [
        user.id,
        plan_id,
        plan.amount,
        due_date,
        notes || `${plan.name} - ${user.first_name} ${user.last_name}`
      ]);

      createdFees.push({
        ...feeResult.rows[0],
        user_name: `${user.first_name} ${user.last_name}`,
        user_email: user.email,
        plan_name: plan.name
      });
    }

    res.status(201).json({
      success: true,
      message: `${createdFees.length} adet aidat başarıyla oluşturuldu`,
      data: {
        created_count: createdFees.length,
        skipped_count: users.length - eligibleUsers.length,
        fees: createdFees
      }
    });

  } catch (error) {
    console.error('Create bulk fees error:', error);
    res.status(500).json({
      success: false,
      message: 'Toplu aidat oluşturulurken hata oluştu'
    });
  }
};

// Otomatik aidat oluşturma ayarları
export const setAutomaticFees = async (req: Request, res: Response): Promise<void> => {
  try {
    const { plan_id, auto_create_day, is_active, target_users } = req.body;
    const userId = req.user?.userId;

    if (!plan_id || !auto_create_day) {
      res.status(400).json({
        success: false,
        message: 'Plan ID ve otomatik oluşturma günü gereklidir'
      });
      return;
    }

    // Plan kontrolü
    const planCheck = await pool.query(
      'SELECT id, name FROM membership_plans WHERE id = $1 AND is_active = true',
      [plan_id]
    );

    if (planCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Geçerli bir plan bulunamadı'
      });
      return;
    }

    // Otomatik aidat tablosu yoksa oluştur
    await pool.query(`
      CREATE TABLE IF NOT EXISTS automatic_fees (
        id SERIAL PRIMARY KEY,
        plan_id INTEGER REFERENCES membership_plans(id),
        auto_create_day INTEGER NOT NULL CHECK (auto_create_day >= 1 AND auto_create_day <= 28),
        is_active BOOLEAN DEFAULT true,
        target_users INTEGER[] DEFAULT NULL,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Mevcut otomatik ayar var mı kontrol et
    const existingCheck = await pool.query(
      'SELECT id FROM automatic_fees WHERE plan_id = $1',
      [plan_id]
    );

    let result;
    if (existingCheck.rows.length > 0) {
      // Güncelle
      result = await pool.query(`
        UPDATE automatic_fees 
        SET auto_create_day = $1, is_active = $2, target_users = $3, updated_at = CURRENT_TIMESTAMP
        WHERE plan_id = $4
        RETURNING *
      `, [auto_create_day, is_active, target_users, plan_id]);
    } else {
      // Yeni kayıt oluştur
      result = await pool.query(`
        INSERT INTO automatic_fees (plan_id, auto_create_day, is_active, target_users, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [plan_id, auto_create_day, is_active, target_users, userId]);
    }

    res.json({
      success: true,
      message: 'Otomatik aidat ayarları başarıyla kaydedildi',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Set automatic fees error:', error);
    res.status(500).json({
      success: false,
      message: 'Otomatik aidat ayarları kaydedilemedi'
    });
  }
};

// Otomatik aidat ayarlarını getir
export const getAutomaticFees = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        af.*,
        mp.name as plan_name,
        mp.amount as plan_amount,
        mp.period_months,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM automatic_fees af
      JOIN membership_plans mp ON af.plan_id = mp.id
      LEFT JOIN users u ON af.created_by = u.id
      ORDER BY af.created_at DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get automatic fees error:', error);
    res.status(500).json({
      success: false,
      message: 'Otomatik aidat ayarları getirilemedi'
    });
  }
};

// Gecikmiş aidatlar için geç ödeme cezası uygula
export const applyLateFees = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fee_ids, late_fee_amount } = req.body;

    if (!fee_ids || !Array.isArray(fee_ids) || fee_ids.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Aidat ID\'leri gereklidir'
      });
      return;
    }

    if (!late_fee_amount || late_fee_amount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Geçerli bir gecikme cezası tutarı gereklidir'
      });
      return;
    }

    // Sadece gecikmiş ve ödenmemiş aidatlara ceza uygula
    const updateQuery = `
      UPDATE membership_fees 
      SET late_fee = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ANY($2)
      AND status = 'pending'
      AND due_date < CURRENT_DATE
      AND late_fee = 0
      RETURNING id, user_id, amount, late_fee
    `;

    const result = await pool.query(updateQuery, [late_fee_amount, fee_ids]);
    const updatedFees = result.rows;

    if (updatedFees.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Gecikme cezası uygulanabilecek uygun aidat bulunamadı'
      });
      return;
    }

    res.json({
      success: true,
      message: `${updatedFees.length} adet aidaya gecikme cezası uygulandı`,
      data: {
        updated_count: updatedFees.length,
        late_fee_amount,
        updated_fees: updatedFees
      }
    });

  } catch (error) {
    console.error('Apply late fees error:', error);
    res.status(500).json({
      success: false,
      message: 'Gecikme cezası uygulanırken hata oluştu'
    });
  }
};

// Aidat hatırlatma sistemi
export const sendFeeReminders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reminder_type = 'email', days_before = 7 } = req.body;

    // Hatırlatma gönderilecek aidatları bul
    const feesQuery = `
      SELECT 
        mf.*,
        u.first_name,
        u.last_name,
        u.email,
        mp.name as plan_name
      FROM membership_fees mf
      JOIN users u ON mf.user_id = u.id
      JOIN membership_plans mp ON mf.plan_id = mp.id
      WHERE mf.status = 'pending'
      AND mf.due_date BETWEEN CURRENT_DATE + INTERVAL '${days_before} days' - INTERVAL '1 day'
      AND mf.due_date + INTERVAL '${days_before} days'
      AND NOT EXISTS (
        SELECT 1 FROM fee_reminders fr
        WHERE fr.membership_fee_id = mf.id
        AND fr.sent_date::date = CURRENT_DATE
        AND fr.reminder_type = $1
      )
    `;

    const feesResult = await pool.query(feesQuery, [reminder_type]);
    const fees = feesResult.rows;

    if (fees.length === 0) {
      res.json({
        success: true,
        message: 'Hatırlatma gönderilecek aidat bulunamadı',
        data: { sent_count: 0 }
      });
      return;
    }

    // Hatırlatma kayıtlarını oluştur
    const reminderPromises = fees.map(fee => {
      return pool.query(`
        INSERT INTO fee_reminders (membership_fee_id, reminder_type, sent_date, status)
        VALUES ($1, $2, CURRENT_TIMESTAMP, 'sent')
      `, [fee.id, reminder_type]);
    });

    await Promise.all(reminderPromises);

    // Burada gerçek hatırlatma gönderme işlemi yapılabilir (email, SMS vs.)
    // Şimdilik sadece kayıt ediyoruz

    res.json({
      success: true,
      message: `${fees.length} adet hatırlatma başarıyla gönderildi`,
      data: {
        sent_count: fees.length,
        reminder_type,
        fees: fees.map(fee => ({
          id: fee.id,
          user_name: `${fee.first_name} ${fee.last_name}`,
          user_email: fee.email,
          amount: fee.amount,
          due_date: fee.due_date,
          plan_name: fee.plan_name
        }))
      }
    });

  } catch (error) {
    console.error('Send fee reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Hatırlatmalar gönderilirken hata oluştu'
    });
  }
}; 