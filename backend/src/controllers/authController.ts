import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { generateToken } from '../utils/jwt';
import { LoginData, CreateUserData, UserResponse } from '../models/User';

// Kullanıcı girişi
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginData = req.body;

    // Debug için log ekle
    console.log('🔑 Login attempt:', { email, hasPassword: !!password });

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email ve şifre gerekli'
      });
      return;
    }

    // Kullanıcıyı veritabanında ara
    const userQuery = 'SELECT * FROM users WHERE email = $1 AND is_active = true';
    const userResult = await pool.query(userQuery, [email]);

    console.log('👤 User query result:', { found: userResult.rows.length > 0, email });

    if (userResult.rows.length === 0) {
      console.log('❌ User not found or inactive');
      res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre'
      });
      return;
    }

    const user = userResult.rows[0];

    // Şifre kontrolü
    console.log('🔒 Password validation starting...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('🔒 Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Password validation failed');
      res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre'
      });
      return;
    }

    // JWT token oluştur
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Kullanıcı bilgilerini şifre olmadan döndür
    const userResponse: UserResponse = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number,
      profession: user.profession,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    res.json({
      success: true,
      message: 'Giriş başarılı',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

// Kullanıcı kaydı (sadece admin)
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      email, 
      password, 
      first_name, 
      last_name, 
      phone_number, 
      profession, 
      role = 'member' 
    }: CreateUserData = req.body;

    if (!email || !password || !first_name || !last_name) {
      res.status(400).json({
        success: false,
        message: 'Email, şifre, ad ve soyad alanları gerekli'
      });
      return;
    }

    // Email kontrolü
    const emailCheck = 'SELECT id FROM users WHERE email = $1';
    const emailResult = await pool.query(emailCheck, [email]);

    if (emailResult.rows.length > 0) {
      res.status(409).json({
        success: false,
        message: 'Bu email adresi zaten kullanılıyor'
      });
      return;
    }

    // Şifreyi hash'le
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Kullanıcıyı kaydet
    const insertQuery = `
      INSERT INTO users (email, password, first_name, last_name, phone_number, profession, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING id, email, first_name, last_name, phone_number, profession, role, is_active, created_at, updated_at
    `;

    const values = [email, hashedPassword, first_name, last_name, phone_number, profession, role];
    const result = await pool.query(insertQuery, values);
    const newUser = result.rows[0];

    const userResponse: UserResponse = {
      id: newUser.id,
      email: newUser.email,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      phone_number: newUser.phone_number,
      profession: newUser.profession,
      role: newUser.role,
      is_active: newUser.is_active,
      created_at: newUser.created_at,
      updated_at: newUser.updated_at
    };

    res.status(201).json({
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu',
      data: userResponse
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

// Profil bilgilerini getir
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const query = `
      SELECT id, email, first_name, last_name, phone_number, profession, role, is_active, created_at
      FROM users 
      WHERE id = $1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Profil bilgileri getirilemedi'
    });
  }
};

// Kullanıcı güncelle (Admin: tüm alanlar, Member: sadece kendi profili)
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { first_name, last_name, email, phone_number, profession, role, is_active } = req.body;
    const currentUserRole = req.user?.role;
    const currentUserId = req.user?.userId;

    // Yetki kontrolü
    if (currentUserRole !== 'admin' && currentUserId !== parseInt(userId)) {
      res.status(403).json({
        success: false,
        message: 'Sadece kendi profil bilgilerinizi güncelleyebilirsiniz'
      });
      return;
    }

    // Admin ile member arasında farklı validasyon
    if (currentUserRole === 'admin') {
      // Admin tüm alanları güncelleyebilir
      if (!first_name || !last_name || !email) {
        res.status(400).json({
          success: false,
          message: 'Ad, soyad ve e-posta gerekli'
        });
        return;
      }

      // Email benzersizlik kontrolü (kendisi hariç)
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );

      if (emailCheck.rows.length > 0) {
        res.status(409).json({
          success: false,
          message: 'Bu e-posta adresi zaten kullanılıyor'
        });
        return;
      }

      const updateQuery = `
        UPDATE users 
        SET first_name = $1, last_name = $2, email = $3, phone_number = $4, 
            profession = $5, role = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING id, email, first_name, last_name, phone_number, profession, role, is_active, created_at, updated_at
      `;

      const values = [first_name, last_name, email, phone_number, profession, role, is_active, userId];
      const result = await pool.query(updateQuery, values);

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Kullanıcı başarıyla güncellendi',
        data: result.rows[0]
      });

    } else {
      // Member sadece belirli alanları güncelleyebilir (email, role, is_active hariç)
      if (!first_name || !last_name) {
        res.status(400).json({
          success: false,
          message: 'Ad ve soyad gerekli'
        });
        return;
      }

      const updateQuery = `
        UPDATE users 
        SET first_name = $1, last_name = $2, phone_number = $3, profession = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5 AND is_active = true
        RETURNING id, email, first_name, last_name, phone_number, profession, role, is_active, created_at, updated_at
      `;

      const values = [first_name, last_name, phone_number, profession, userId];
      const result = await pool.query(updateQuery, values);

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı veya hesabınız aktif değil'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Profil bilgileriniz başarıyla güncellendi',
        data: result.rows[0]
      });
    }

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı güncellenemedi'
    });
  }
};

// Kullanıcıyı pasife al (sadece admin)
export const deactivateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.userId;

    // Kendi kendini pasife alma kontrolü
    if (parseInt(userId) === currentUserId) {
      res.status(400).json({
        success: false,
        message: 'Kendi hesabınızı pasife alamazsınız'
      });
      return;
    }

    const result = await pool.query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Kullanıcı başarıyla pasife alındı'
    });

  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı pasife alınamadı'
    });
  }
};

// Kullanıcıyı tamamen sil (hard delete - sadece admin)
// Şifre değiştir (sadece kendi şifresi)
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Mevcut şifre, yeni şifre ve şifre onayı gerekli'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Yeni şifre ve şifre onayı eşleşmiyor'
      });
      return;
    }

    // Şifre güvenlik kontrolleri
    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Yeni şifre en az 8 karakter olmalıdır'
      });
      return;
    }

    if (!/(?=.*[a-z])/.test(newPassword)) {
      res.status(400).json({
        success: false,
        message: 'Yeni şifre en az bir küçük harf içermelidir'
      });
      return;
    }

    if (!/(?=.*[A-Z])/.test(newPassword)) {
      res.status(400).json({
        success: false,
        message: 'Yeni şifre en az bir büyük harf içermelidir'
      });
      return;
    }

    if (!/(?=.*\d)/.test(newPassword)) {
      res.status(400).json({
        success: false,
        message: 'Yeni şifre en az bir rakam içermelidir'
      });
      return;
    }

    if (!/(?=.*[@$!%*?&])/.test(newPassword)) {
      res.status(400).json({
        success: false,
        message: 'Yeni şifre en az bir özel karakter (@$!%*?&) içermelidir'
      });
      return;
    }

    // Mevcut kullanıcıyı ve şifresini al
    const userQuery = 'SELECT id, password FROM users WHERE id = $1 AND is_active = true';
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı veya hesabınız aktif değil'
      });
      return;
    }

    const user = userResult.rows[0];

    // Mevcut şifre kontrolü
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Mevcut şifre yanlış'
      });
      return;
    }

    // Yeni şifre mevcut şifre ile aynı olmamalı
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      res.status(400).json({
        success: false,
        message: 'Yeni şifre mevcut şifre ile aynı olamaz'
      });
      return;
    }

    // Yeni şifreyi hash'le
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Şifreyi güncelle
    const updateQuery = 'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
    await pool.query(updateQuery, [hashedNewPassword, userId]);

    res.json({
      success: true,
      message: 'Şifreniz başarıyla değiştirildi'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Şifre değiştirilemedi'
    });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.userId;

    // Kendi kendini silme kontrolü
    if (parseInt(userId) === currentUserId) {
      res.status(400).json({
        success: false,
        message: 'Kendi hesabınızı silemezsiniz'
      });
      return;
    }

    // Transaction başlat
    await pool.query('BEGIN');

    try {
      // Önce kullanıcıyı tüm komisyonlardan çıkar
      await pool.query(
        'DELETE FROM commission_members WHERE user_id = $1',
        [userId]
      );

      // Sonra kullanıcıyı tamamen sil
      const result = await pool.query(
        'DELETE FROM users WHERE id = $1',
        [userId]
      );

      if (result.rowCount === 0) {
        await pool.query('ROLLBACK');
        res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
        return;
      }

      // Transaction'ı tamamla
      await pool.query('COMMIT');

      res.json({
        success: true,
        message: 'Kullanıcı başarıyla silindi ve tüm komisyonlardan çıkarıldı'
      });

    } catch (error) {
      // Hata durumunda rollback
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı silinemedi'
    });
  }
}; 

// Excel ile toplu kullanıcı oluşturma
export const importUsersFromExcel = async (req: Request, res: Response): Promise<void> => {
  try {
    const XLSX = require('xlsx');
    
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'Excel dosyası yüklenmedi'
      });
      return;
    }

    // Excel dosyasını oku
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Tüm veriyi al (header_rows olmadan)
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    
    // Veri başlık satırını bul (ad,soyad,email,telefon,meslek,rol,sifre)
    let dataStartIndex = -1;
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i] as any[];
      if (row && row[0] === 'ad' && row[1] === 'soyad' && row[2] === 'email') {
        dataStartIndex = i + 1; // Başlık satırının bir sonraki satırından başla
        break;
      }
    }
    
    if (dataStartIndex === -1) {
      res.status(400).json({
        success: false,
        message: 'Excel dosyasında geçerli veri formatı bulunamadı. Lütfen template dosyasını kullanın.'
      });
      return;
    }

    // Veri satırlarını işle
    for (let i = dataStartIndex; i < rawData.length; i++) {
      const row = rawData[i] as any[];
      const realRowNumber = i + 1; // Excel satır numarası (1-indexed)
      
      // Boş satırları atla
      if (!row || row.length === 0 || !row[0] || row[0].toString().trim() === '') {
        continue;
      }
      
      // Açıklama/bilgi/notlar satırlarını atla
      const firstCell = row[0].toString().trim();
      if (firstCell.includes('↑') || firstCell.includes('↓') || 
          firstCell.includes('Örnek') || firstCell.includes('Bu satırı') ||
          firstCell.includes('NOTLAR') || firstCell.includes('notlar') ||
          firstCell.includes('-') || firstCell.includes('•') ||
          firstCell.includes('Email adresleri') || firstCell.includes('Şifreler') ||
          firstCell.includes('Rol için') || firstCell.includes('Telefon numarası') ||
          firstCell.length === 0) {
        continue;
      }

      // Veri objesini oluştur
      const userRow = {
        ad: row[0] ? row[0].toString().trim() : '',
        soyad: row[1] ? row[1].toString().trim() : '',
        email: row[2] ? row[2].toString().trim() : '',
        telefon: row[3] ? row[3].toString().trim() : '',
        meslek: row[4] ? row[4].toString().trim() : '',
        rol: row[5] ? row[5].toString().trim() : 'member',
        sifre: row[6] ? row[6].toString().trim() : ''
      };
      
      // Debug log
      console.log(`Satır ${realRowNumber} işleniyor:`, {
        ad: userRow.ad,
        soyad: userRow.soyad,
        email: userRow.email,
        telefon: userRow.telefon,
        meslek: userRow.meslek,
        rol: userRow.rol,
        sifre: userRow.sifre ? '***' : ''
      });

      try {
        // Gerekli alanları kontrol et
        if (!userRow.ad || !userRow.soyad || !userRow.email || !userRow.sifre) {
          errors.push(`Satır ${realRowNumber}: Ad, soyad, email ve şifre zorunludur`);
          failedCount++;
          continue;
        }

        // Email validasyonu
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userRow.email)) {
          errors.push(`Satır ${realRowNumber}: Geçersiz email formatı`);
          failedCount++;
          continue;
        }

        // Şifre validasyonu
        if (userRow.sifre.length < 6) {
          errors.push(`Satır ${realRowNumber}: Şifre en az 6 karakter olmalıdır`);
          failedCount++;
          continue;
        }

        // Rol validasyonu
        const role = userRow.rol || 'member';
        if (!['member', 'admin'].includes(role)) {
          errors.push(`Satır ${realRowNumber}: Rol 'member' veya 'admin' olmalıdır`);
          failedCount++;
          continue;
        }

        // Email'in var olup olmadığını kontrol et
        const existingUserQuery = 'SELECT id FROM users WHERE email = $1';
        const existingUserResult = await pool.query(existingUserQuery, [userRow.email]);
        
        if (existingUserResult.rows.length > 0) {
          errors.push(`Satır ${realRowNumber}: ${userRow.email} email adresi zaten kullanımda`);
          failedCount++;
          continue;
        }

        // Şifreyi hash'le
        const hashedPassword = await bcrypt.hash(userRow.sifre, 10);

        // Kullanıcıyı oluştur
        const insertQuery = `
          INSERT INTO users (first_name, last_name, email, password, role, is_active, phone_number, profession)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `;

        const values = [
          userRow.ad.trim(),
          userRow.soyad.trim(),
          userRow.email.trim().toLowerCase(),
          hashedPassword,
          role,
          true,
          userRow.telefon.trim() || null,
          userRow.meslek.trim() || null
        ];

        await pool.query(insertQuery, values);
        successCount++;

      } catch (error) {
        console.error(`Satır ${realRowNumber} işlenirken hata:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
        errors.push(`Satır ${realRowNumber}: ${errorMessage}`);
        failedCount++;
      }
    }

    res.json({
      success: true,
      message: 'Excel import işlemi tamamlandı',
      total: successCount + failedCount,
      successCount: successCount,
      failed: failedCount,
      errors: errors.slice(0, 20) // Maksimum 20 hata göster
    });

  } catch (error) {
    console.error('Excel import error:', error);
    res.status(500).json({
      success: false,
      message: 'Excel dosyası işlenirken hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
}; 

// Default admin kullanıcısını oluştur
export const createDefaultAdmin = async (): Promise<void> => {
  try {
    const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@koop.org';
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';

    // Admin zaten var mı kontrol et
    const adminCheck = 'SELECT id FROM users WHERE email = $1';
    const adminResult = await pool.query(adminCheck, [defaultEmail]);

    if (adminResult.rows.length > 0) {
      console.log('🔑 Default admin zaten mevcut:', defaultEmail);
      return;
    }

    // Şifreyi hash'le
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

    // Default admin oluştur
    const insertQuery = `
      INSERT INTO users (email, password, first_name, last_name, phone_number, profession, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING id, email, first_name, last_name, role
    `;

    const values = [
      defaultEmail,
      hashedPassword,
      'System',
      'Administrator',
      '5555555555',
      'System Admin',
      'admin'
    ];

    const result = await pool.query(insertQuery, values);
    const newAdmin = result.rows[0];

    console.log('✅ Default admin oluşturuldu:');
    console.log(`   Email: ${newAdmin.email}`);
    console.log(`   Password: ${defaultPassword}`);
    console.log(`   Role: ${newAdmin.role}`);

  } catch (error) {
    console.error('❌ Default admin oluşturulurken hata:', error);
  }
}; 