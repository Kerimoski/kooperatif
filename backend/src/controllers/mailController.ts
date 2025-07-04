import { Request, Response } from 'express';
import * as nodemailer from 'nodemailer';
import pool from '../config/database';
import { TokenPayload } from '../utils/jwt';

// Express Request tipini genişlet
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

// Mail yapılandırması - gerçek ortamda environment variables kullanılmalı
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USER || 'bilgi@renkliorman.k12.tr',
      pass: process.env.MAIL_PASS || 'fvuv ifvq kpea xvfy'
    }
  });
};

// Tüm kullanıcılara duyuru maili gönder
export const sendAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subject, message, target_users, sender_name } = req.body;
    const userId = req.user?.userId;

    if (!subject || !message) {
      res.status(400).json({
        success: false,
        message: 'Konu ve mesaj gereklidir'
      });
      return;
    }

    // Hedef kullanıcıları belirle
    let userQuery = 'SELECT id, first_name, last_name, email FROM users WHERE is_active = true';
    let queryParams: any[] = [];

    if (target_users && target_users.length > 0) {
      userQuery += ' AND id = ANY($1)';
      queryParams.push(target_users);
    }

    const usersResult = await pool.query(userQuery, queryParams);
    const users = usersResult.rows;

    if (users.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Gönderilecek kullanıcı bulunamadı'
      });
      return;
    }

    // Mail tablosu yoksa oluştur
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mail_logs (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id),
        recipient_email VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        sent_at TIMESTAMP,
        error_message TEXT,
        mail_type VARCHAR(50) DEFAULT 'announcement',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const transporter = createTransporter();
    const mailResults = [];

    // Her kullanıcıya mail gönder
    for (const user of users) {
      try {
        const mailOptions = {
          from: `"${sender_name || 'Kooperatif Yönetimi'}" <${process.env.MAIL_USER || 'noreply@koop.com'}>`,
          to: user.email,
          subject: subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">Kooperatif Duyurusu</h1>
              </div>
              
              <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
                <p style="color: #495057; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                  Merhaba <strong>${user.first_name} ${user.last_name}</strong>,
                </p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                  <div style="color: #495057; font-size: 16px; line-height: 1.8;">
                    ${message.replace(/\n/g, '<br>')}
                  </div>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 14px;">
                  <p>Bu mail kooperatif yönetim sistemi tarafından otomatik olarak gönderilmiştir.</p>
                  <p><strong>Gönderen:</strong> ${sender_name || 'Kooperatif Yönetimi'}</p>
                  <p><strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}</p>
                </div>
              </div>
            </div>
          `
        };

        // Mail gönder
        await transporter.sendMail(mailOptions);

        // Başarılı gönderimi kaydet
        await pool.query(`
          INSERT INTO mail_logs (sender_id, recipient_email, subject, message, status, sent_at, mail_type)
          VALUES ($1, $2, $3, $4, 'sent', CURRENT_TIMESTAMP, 'announcement')
        `, [userId, user.email, subject, message]);

        mailResults.push({
          user_id: user.id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          status: 'sent'
        });

      } catch (error) {
        console.error(`Mail gönderme hatası - ${user.email}:`, error);

        // Hatalı gönderimi kaydet
        await pool.query(`
          INSERT INTO mail_logs (sender_id, recipient_email, subject, message, status, error_message, mail_type)
          VALUES ($1, $2, $3, $4, 'failed', $5, 'announcement')
        `, [userId, user.email, subject, message, error instanceof Error ? error.message : 'Unknown error']);

        mailResults.push({
          user_id: user.id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = mailResults.filter(r => r.status === 'sent').length;
    const failCount = mailResults.filter(r => r.status === 'failed').length;

    res.json({
      success: true,
      message: `Mail gönderimi tamamlandı. ${successCount} başarılı, ${failCount} başarısız`,
      data: {
        total_sent: successCount,
        total_failed: failCount,
        results: mailResults
      }
    });

  } catch (error) {
    console.error('Send announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Mail gönderilirken hata oluştu'
    });
  }
};

// Aidat hatırlatma maili gönder
export const sendFeeReminders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { days_before = 7, include_overdue = true } = req.body;

    // Hatırlatma gönderilecek aidatları bul
    let feesQuery = `
      SELECT 
        mf.*,
        u.first_name,
        u.last_name,
        u.email,
        mp.name as plan_name,
        CASE 
          WHEN mf.due_date < CURRENT_DATE THEN 'overdue'
          ELSE 'upcoming'
        END as reminder_type,
        CASE 
          WHEN mf.due_date < CURRENT_DATE THEN CURRENT_DATE - mf.due_date
          ELSE mf.due_date - CURRENT_DATE
        END as days_diff
      FROM membership_fees mf
      JOIN users u ON mf.user_id = u.id
      JOIN membership_plans mp ON mf.plan_id = mp.id
      WHERE mf.status = 'pending'
      AND u.is_active = true
      AND (
        (mf.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${days_before} days')
        ${include_overdue ? 'OR mf.due_date < CURRENT_DATE' : ''}
      )
    `;

    const feesResult = await pool.query(feesQuery);
    const fees = feesResult.rows;

    if (fees.length === 0) {
      res.json({
        success: true,
        message: 'Hatırlatma gönderilecek aidat bulunamadı',
        data: { sent_count: 0 }
      });
      return;
    }

    const transporter = createTransporter();
    const mailResults = [];

    for (const fee of fees) {
      try {
        const isOverdue = fee.reminder_type === 'overdue';
        const subject = isOverdue 
          ? `🔴 Gecikmiş Aidat Hatırlatması - ${fee.plan_name}` 
          : `⏰ Aidat Hatırlatması - ${fee.plan_name}`;

        const totalAmount = parseFloat(fee.amount) + parseFloat(fee.late_fee || 0);

        const mailOptions = {
          from: `"Kooperatif Aidat Sistemi" <${process.env.MAIL_USER || 'noreply@koop.com'}>`,
          to: fee.email,
          subject: subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: ${isOverdue ? 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' : 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)'}; color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">
                  ${isOverdue ? '🔴 Gecikmiş Aidat' : '⏰ Aidat Hatırlatması'}
                </h1>
              </div>
              
              <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
                <p style="color: #495057; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                  Merhaba <strong>${fee.first_name} ${fee.last_name}</strong>,
                </p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${isOverdue ? '#e74c3c' : '#f39c12'}; margin: 20px 0;">
                  <h3 style="color: ${isOverdue ? '#e74c3c' : '#f39c12'}; margin-top: 0;">Aidat Bilgileri</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Plan:</strong></td>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${fee.plan_name}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Tutar:</strong></td>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eee;">₺${parseFloat(fee.amount).toLocaleString('tr-TR')}</td>
                    </tr>
                    ${fee.late_fee > 0 ? `
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Gecikme Cezası:</strong></td>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #e74c3c;">₺${parseFloat(fee.late_fee).toLocaleString('tr-TR')}</td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Toplam:</strong></td>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: ${isOverdue ? '#e74c3c' : '#f39c12'};">₺${totalAmount.toLocaleString('tr-TR')}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;"><strong>Vade Tarihi:</strong></td>
                      <td style="padding: 8px 0; color: ${isOverdue ? '#e74c3c' : '#495057'};">${new Date(fee.due_date).toLocaleDateString('tr-TR')}</td>
                    </tr>
                  </table>
                  
                  ${isOverdue ? `
                    <div style="background: #ffe6e6; color: #c0392b; padding: 15px; border-radius: 6px; margin-top: 15px; text-align: center;">
                      <strong>⚠️ Bu aidat ${fee.days_diff} gün gecikmiştir</strong>
                    </div>
                  ` : `
                    <div style="background: #fff3cd; color: #856404; padding: 15px; border-radius: 6px; margin-top: 15px; text-align: center;">
                      <strong>📅 Bu aidatın ${fee.days_diff} gün sonra vadesi dolacaktır</strong>
                    </div>
                  `}
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <p style="color: #495057; margin-bottom: 20px;">
                    ${isOverdue 
                      ? 'Lütfen en kısa sürede ödemenizi gerçekleştirin.' 
                      : 'Vade tarihinden önce ödemenizi yapmanızı rica ederiz.'}
                  </p>
                  <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 15px 0;">
                    <p style="margin: 0; color: #1976d2; font-size: 14px;">
                      💡 <strong>Ödeme için:</strong> Kooperatif yönetimine başvurabilir veya online sistemden ödeme yapabilirsiniz.
                    </p>
                  </div>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 14px;">
                  <p>Bu mail kooperatif aidat sistemi tarafından otomatik olarak gönderilmiştir.</p>
                  <p><strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}</p>
                </div>
              </div>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);

        // Başarılı gönderimi kaydet
        await pool.query(`
          INSERT INTO mail_logs (recipient_email, subject, message, status, sent_at, mail_type)
          VALUES ($1, $2, $3, 'sent', CURRENT_TIMESTAMP, 'fee_reminder')
        `, [fee.email, subject, `Aidat hatırlatması - ${fee.plan_name}`]);

        // Fee reminder tablosuna kaydet
        await pool.query(`
          INSERT INTO fee_reminders (membership_fee_id, reminder_type, sent_date, status)
          VALUES ($1, 'email', CURRENT_TIMESTAMP, 'sent')
        `, [fee.id]);

        mailResults.push({
          fee_id: fee.id,
          user_name: `${fee.first_name} ${fee.last_name}`,
          email: fee.email,
          amount: totalAmount,
          due_date: fee.due_date,
          type: fee.reminder_type,
          status: 'sent'
        });

      } catch (error) {
        console.error(`Aidat hatırlatma hatası - ${fee.email}:`, error);

        const isOverdueError = fee.reminder_type === 'overdue';
        const errorSubject = isOverdueError 
          ? `🔴 Gecikmiş Aidat Hatırlatması - ${fee.plan_name}` 
          : `⏰ Aidat Hatırlatması - ${fee.plan_name}`;

        await pool.query(`
          INSERT INTO mail_logs (recipient_email, subject, message, status, error_message, mail_type)
          VALUES ($1, $2, $3, 'failed', $4, 'fee_reminder')
        `, [fee.email, errorSubject, `Aidat hatırlatması - ${fee.plan_name}`, error instanceof Error ? error.message : 'Unknown error']);

        mailResults.push({
          fee_id: fee.id,
          user_name: `${fee.first_name} ${fee.last_name}`,
          email: fee.email,
          type: fee.reminder_type,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = mailResults.filter(r => r.status === 'sent').length;
    const failCount = mailResults.filter(r => r.status === 'failed').length;

    res.json({
      success: true,
      message: `Aidat hatırlatmaları gönderildi. ${successCount} başarılı, ${failCount} başarısız`,
      data: {
        total_sent: successCount,
        total_failed: failCount,
        results: mailResults
      }
    });

  } catch (error) {
    console.error('Send fee reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Aidat hatırlatmaları gönderilirken hata oluştu'
    });
  }
};

// Mail geçmişini getir
export const getMailHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 50, mail_type, status } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (mail_type) {
      params.push(mail_type);
      whereClause += ` AND mail_type = $${params.length}`;
    }

    if (status) {
      params.push(status);
      whereClause += ` AND status = $${params.length}`;
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    params.push(parseInt(limit as string), offset);

    const query = `
      SELECT 
        ml.*,
        u.first_name || ' ' || u.last_name as sender_name
      FROM mail_logs ml
      LEFT JOIN users u ON ml.sender_id = u.id
      ${whereClause}
      ORDER BY ml.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const result = await pool.query(query, params);

    // Toplam sayı
    const countQuery = `SELECT COUNT(*) as total FROM mail_logs ml ${whereClause.replace(/LIMIT.*OFFSET.*/, '')}`;
    const countResult = await pool.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        mails: result.rows,
        pagination: {
          current_page: parseInt(page as string),
          per_page: parseInt(limit as string),
          total: total,
          total_pages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });

  } catch (error) {
    console.error('Get mail history error:', error);
    res.status(500).json({
      success: false,
      message: 'Mail geçmişi getirilemedi'
    });
  }
};

// Mail istatistikleri
export const getMailStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*)::text as total_mails,
        COUNT(CASE WHEN status = 'sent' THEN 1 END)::text as sent_mails,
        COUNT(CASE WHEN status = 'failed' THEN 1 END)::text as failed_mails,
        COUNT(CASE WHEN mail_type = 'announcement' THEN 1 END)::text as announcements,
        COUNT(CASE WHEN mail_type = 'fee_reminder' THEN 1 END)::text as reminders,
        COUNT(CASE WHEN sent_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END)::text as last_30_days
      FROM mail_logs
    `;

    const result = await pool.query(statsQuery);

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Get mail stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Mail istatistikleri getirilemedi'
    });
  }
}; 