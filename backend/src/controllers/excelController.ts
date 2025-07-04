import { Request, Response } from 'express';
import pool from '../config/database';
import * as XLSX from 'xlsx';

export const exportFeesExcel = async (req: Request, res: Response): Promise<void> => {
  try {
    // Tüm aidat verilerini getir
    const feesQuery = `
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
        END as days_overdue,
        p.amount as payment_amount,
        p.payment_date,
        p.payment_method,
        p.transaction_id as payment_transaction_id
      FROM membership_fees mf
      JOIN membership_plans mp ON mf.plan_id = mp.id
      JOIN users u ON mf.user_id = u.id
      LEFT JOIN payments p ON mf.id = p.membership_fee_id
      ORDER BY u.last_name ASC, mf.due_date DESC
    `;

    const feesResult = await pool.query(feesQuery);
    const fees = feesResult.rows;

    // İstatistikleri getir
    const statsQuery = `
      SELECT 
        COUNT(*) as toplam_aidat,
        COUNT(CASE WHEN mf.status = 'paid' THEN 1 END) as odenen_aidat,
        COUNT(CASE WHEN mf.status = 'pending' THEN 1 END) as bekleyen_aidat,
        COUNT(CASE WHEN mf.due_date < CURRENT_DATE AND mf.status = 'pending' THEN 1 END) as geciken_aidat,
        COALESCE(SUM(CASE WHEN mf.status = 'paid' THEN mf.amount END), 0) as toplam_odenen_tutar,
        COALESCE(SUM(CASE WHEN mf.status = 'pending' THEN mf.amount END), 0) as bekleyen_tutar,
        COALESCE(SUM(CASE WHEN mf.due_date < CURRENT_DATE AND mf.status = 'pending' THEN mf.amount + mf.late_fee END), 0) as geciken_tutar
      FROM membership_fees mf
    `;

    const statsResult = await pool.query(statsQuery);
    const stats = statsResult.rows[0];

    // Vadesi gelecek aidatlar (30 gün içinde)
    const upcomingQuery = `
      SELECT 
        mf.*,
        mp.name as plan_name,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email,
        u.phone_number
      FROM membership_fees mf
      JOIN membership_plans mp ON mf.plan_id = mp.id
      JOIN users u ON mf.user_id = u.id
      WHERE mf.status = 'pending' 
      AND mf.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
      ORDER BY mf.due_date ASC
    `;

    const upcomingResult = await pool.query(upcomingQuery);
    const upcomingFees = upcomingResult.rows;

    // Excel workbook oluştur
    const workbook = XLSX.utils.book_new();

    // 1. Özet Sayfa
    const summaryData = [
      ['KOOP AIDAT SİSTEMİ - GENEL RAPOR'],
      ['Rapor Tarihi:', new Date().toLocaleDateString('tr-TR')],
      [''],
      ['GENEL İSTATİSTİKLER'],
      ['Toplam Aidat Sayısı:', stats.toplam_aidat],
      ['Ödenen Aidatlar:', stats.odenen_aidat],
      ['Bekleyen Aidatlar:', stats.bekleyen_aidat],
      ['Geciken Aidatlar:', stats.geciken_aidat],
      [''],
      ['MALİ DURUM'],
      ['Toplam Ödenen Tutar:', `₺${parseFloat(stats.toplam_odenen_tutar).toLocaleString('tr-TR')}`],
      ['Bekleyen Tutar:', `₺${parseFloat(stats.bekleyen_tutar).toLocaleString('tr-TR')}`],
      ['Geciken Tutar (Gecikme Dahil):', `₺${parseFloat(stats.geciken_tutar).toLocaleString('tr-TR')}`],
      [''],
      ['30 GÜN İÇİNDE VADESİ GELECEK AIDATLAR'],
      ['Ad Soyad', 'Plan', 'Tutar', 'Vade Tarihi', 'E-posta', 'Telefon']
    ];

    // Vadesi gelecek aidatları ekle
    upcomingFees.forEach(fee => {
      summaryData.push([
        fee.user_name,
        fee.plan_name,
        `₺${parseFloat(fee.amount).toLocaleString('tr-TR')}`,
        new Date(fee.due_date).toLocaleDateString('tr-TR'),
        fee.user_email,
        fee.phone_number || ''
      ]);
    });

    const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Özet Rapor');

    // 2. Tüm Aidatlar Sayfası
    const allFeesData = [
      ['TÜM AIDAT KAYITLARI'],
      [''],
      ['Ad Soyad', 'E-posta', 'Telefon', 'Plan', 'Tutar', 'Vade Tarihi', 'Durum', 'Gecikme (Gün)', 'Gecikme Cezası', 'Ödeme Tarihi', 'Ödeme Tutarı', 'Ödeme Yöntemi', 'İşlem No', 'Notlar']
    ];

    fees.forEach(fee => {
      allFeesData.push([
        fee.user_name,
        fee.user_email,
        fee.phone_number || '',
        fee.plan_name,
        `₺${parseFloat(fee.amount).toLocaleString('tr-TR')}`,
        new Date(fee.due_date).toLocaleDateString('tr-TR'),
        fee.status_text,
        fee.days_overdue,
        fee.late_fee > 0 ? `₺${parseFloat(fee.late_fee).toLocaleString('tr-TR')}` : '',
        fee.payment_date ? new Date(fee.payment_date).toLocaleDateString('tr-TR') : '',
        fee.payment_amount ? `₺${parseFloat(fee.payment_amount).toLocaleString('tr-TR')}` : '',
        fee.payment_method || '',
        fee.payment_transaction_id || '',
        fee.notes || ''
      ]);
    });

    const allFeesWorksheet = XLSX.utils.aoa_to_sheet(allFeesData);
    XLSX.utils.book_append_sheet(workbook, allFeesWorksheet, 'Tüm Aidatlar');

    // 3. Kullanıcı bazlı sayfalar oluştur
    const userMap = new Map();
    fees.forEach(f => {
      if (!userMap.has(f.user_id)) {
        userMap.set(f.user_id, { id: f.user_id, name: f.user_name, email: f.user_email });
      }
    });
    const usersWithFees = Array.from(userMap.values());
    
    usersWithFees.forEach(user => {
      const userFees = fees.filter(f => f.user_id === user.id);
      
      const userData = [
        [`${user.name} - AIDAT RAPORU`],
        ['E-posta:', user.email],
        [''],
        ['Tarih', 'Plan', 'Tutar', 'Vade Tarihi', 'Durum', 'Gecikme (Gün)', 'Gecikme Cezası', 'Ödeme Tarihi', 'Ödeme Tutarı', 'Ödeme Yöntemi', 'İşlem No', 'Notlar']
      ];

      userFees.forEach(fee => {
        userData.push([
          new Date(fee.created_at).toLocaleDateString('tr-TR'),
          fee.plan_name,
          `₺${parseFloat(fee.amount).toLocaleString('tr-TR')}`,
          new Date(fee.due_date).toLocaleDateString('tr-TR'),
          fee.status_text,
          fee.days_overdue,
          fee.late_fee > 0 ? `₺${parseFloat(fee.late_fee).toLocaleString('tr-TR')}` : '',
          fee.payment_date ? new Date(fee.payment_date).toLocaleDateString('tr-TR') : '',
          fee.payment_amount ? `₺${parseFloat(fee.payment_amount).toLocaleString('tr-TR')}` : '',
          fee.payment_method || '',
          fee.payment_transaction_id || '',
          fee.notes || ''
        ]);
      });

      // Kullanıcı özeti
      const userStats = {
        total: userFees.length,
        paid: userFees.filter(f => f.status === 'paid').length,
        pending: userFees.filter(f => f.status === 'pending').length,
        totalPaid: userFees.filter(f => f.payment_amount).reduce((sum, f) => sum + parseFloat(f.payment_amount || '0'), 0),
        totalPending: userFees.filter(f => f.status === 'pending').reduce((sum, f) => sum + parseFloat(f.amount), 0)
      };

      userData.push(
        [''],
        ['ÖZET'],
        ['Toplam Aidat:', userStats.total],
        ['Ödenen:', userStats.paid],
        ['Bekleyen:', userStats.pending],
        ['Toplam Ödenen:', `₺${userStats.totalPaid.toLocaleString('tr-TR')}`],
        ['Bekleyen Tutar:', `₺${userStats.totalPending.toLocaleString('tr-TR')}`]
      );

      const userWorksheet = XLSX.utils.aoa_to_sheet(userData);
      
      // Sayfa adını temizle (Excel için geçersiz karakterleri kaldır)
      let sheetName = user.name.replace(/[\\\/\[\]\*\?:]/g, '_').substring(0, 31);
      XLSX.utils.book_append_sheet(workbook, userWorksheet, sheetName);
    });

    // Excel dosyasını buffer olarak oluştur
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Response headers
    const filename = `aidat-raporu-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);

  } catch (error: any) {
    console.error('Excel export error:', error);
    console.error('Error details:', error);
    res.status(500).json({
      success: false,
      message: 'Excel dosyası oluşturulurken hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 