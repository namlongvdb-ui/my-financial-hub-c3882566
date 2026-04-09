/**
 * ============================================
 * NODE.JS WEB API SERVER + FRONTEND
 * Máy chủ: 10.24.16.77:3001
 * Proxy mạng: hn.proxy.vdb:8080
 * ============================================
 * Server phục vụ cả API và Frontend trên cùng cổng 3001
 * Các máy trạm kết nối qua WAN:
 * - Cao Bằng: 10.24.x.x
 * - Bắc Giang: 10.42.x.x
 * - Lạng Sơn: 10.30.x.x
 * - Bắc Ninh: 10.44.x.x
 * ============================================
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();

// ============================================
// CẤU HÌNH
// ============================================
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-key';

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'tai_chinh_cong_doan',
  user: process.env.DB_USER || 'finance_admin',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test DB connection
pool.query('SELECT NOW()').then(() => {
  console.log('✅ Kết nối PostgreSQL thành công');
}).catch(err => {
  console.error('❌ Lỗi kết nối PostgreSQL:', err.message);
});

// ============================================
// MIDDLEWARE
// ============================================

// CORS - cho phép các IP trong mạng WAN
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (/^https?:\/\/10\.\d+\.\d+\.\d+/.test(origin)) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.includes('localhost')) return callback(null, true);
    callback(new Error('CORS not allowed'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// ============================================
// PHỤC VỤ FRONTEND (file tĩnh từ thư mục dist)
// Server và Frontend cùng chạy trên cổng 3001
// ============================================
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// JWT Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Chưa đăng nhập' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    req.user = decoded;
    next();
  });
}

// Role check middleware
function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      const { rows } = await pool.query(
        'SELECT role FROM user_roles WHERE user_id = $1',
        [req.user.id]
      );
      const userRoles = rows.map(r => r.role);
      if (roles.some(r => userRoles.includes(r))) return next();
      res.status(403).json({ error: 'Không có quyền truy cập' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
}

// ============================================
// AUTH ROUTES
// ============================================

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    let { email, username, password } = req.body;
    if (!password) return res.status(400).json({ error: 'Thiếu mật khẩu' });

    // Hỗ trợ đăng nhập bằng username hoặc email
    const loginInput = username || email;
    if (!loginInput) return res.status(400).json({ error: 'Thiếu tên đăng nhập' });

    // Tìm user theo username trước, nếu không có thì tìm theo email
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE (username = $1 OR email = $1 OR email = $2) AND is_active = true',
      [loginInput, loginInput.includes('@') ? loginInput : `${loginInput}@app.local`]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    const rolesResult = await pool.query('SELECT role FROM user_roles WHERE user_id = $1', [user.id]);
    const roles = rolesResult.rows.map(r => r.role);

    const profileResult = await pool.query(
      'SELECT full_name, email, username, assigned_area FROM profiles WHERE user_id = $1',
      [user.id]
    );
    const profile = profileResult.rows[0] || null;

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, email: user.email }, roles, profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const [rolesResult, profileResult] = await Promise.all([
      pool.query('SELECT role FROM user_roles WHERE user_id = $1', [req.user.id]),
      pool.query('SELECT full_name, email, username, assigned_area FROM profiles WHERE user_id = $1', [req.user.id]),
    ]);
    res.json({
      user: req.user,
      roles: rolesResult.rows.map(r => r.role),
      profile: profileResult.rows[0] || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/change-password
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// SETUP ADMIN (chạy lần đầu)
// ============================================
app.post('/api/setup-admin', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const loginEmail = email || (username ? `${username}@app.local` : null);
    if (!loginEmail || !password) return res.status(400).json({ error: 'Username and password required' });

    const { rows: existingAdmins } = await pool.query(
      "SELECT ur.user_id FROM user_roles ur WHERE ur.role = 'admin'"
    );

    if (existingAdmins.length > 0) {
      return res.status(400).json({ error: 'Admin đã tồn tại. Sử dụng tài khoản admin hiện có.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await pool.query(
      'INSERT INTO users (id, email, username, password_hash) VALUES ($1, $2, $3, $4)',
      [userId, loginEmail, username || 'admin', hash]
    );

    await pool.query(
      'INSERT INTO profiles (user_id, full_name, email, username) VALUES ($1, $2, $3, $4)',
      [userId, 'Administrator', loginEmail, username || 'admin']
    );

    await pool.query(
      "INSERT INTO user_roles (user_id, role) VALUES ($1, 'admin')",
      [userId]
    );

    res.json({ success: true, message: 'Admin created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ADMIN USER MANAGEMENT
// ============================================

app.post('/api/admin/create-user', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { username, password, fullName, role, assignedArea } = req.body;
    const email = `${username}@app.local`;
    const hash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await pool.query(
      'INSERT INTO users (id, email, username, password_hash) VALUES ($1, $2, $3, $4)',
      [userId, email, username, hash]
    );

    await pool.query(
      'INSERT INTO profiles (user_id, full_name, email, username, assigned_area) VALUES ($1, $2, $3, $4, $5)',
      [userId, fullName, email, username, assignedArea || null]
    );

    if (role) {
      await pool.query('INSERT INTO user_roles (user_id, role) VALUES ($1, $2)', [userId, role]);
    }

    res.json({ success: true, userId });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/manage-user', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { userId, action, fullName, role, assignedArea, isActive } = req.body;

    if (action === 'update') {
      if (fullName !== undefined) {
        await pool.query('UPDATE profiles SET full_name = $1, updated_at = NOW() WHERE user_id = $2', [fullName, userId]);
      }
      if (assignedArea !== undefined) {
        await pool.query('UPDATE profiles SET assigned_area = $1, updated_at = NOW() WHERE user_id = $2', [assignedArea, userId]);
      }
      if (role !== undefined) {
        await pool.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
        await pool.query('INSERT INTO user_roles (user_id, role) VALUES ($1, $2)', [userId, role]);
      }
      if (isActive !== undefined) {
        await pool.query('UPDATE users SET is_active = $1 WHERE id = $2', [isActive, userId]);
      }
    } else if (action === 'delete') {
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/reset-password', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/users', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.email, u.username, u.is_active, u.created_at,
             p.full_name, p.assigned_area,
             array_agg(ur.role) as roles
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      GROUP BY u.id, p.full_name, p.assigned_area
      ORDER BY u.created_at
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// PROFILES
// ============================================
app.get('/api/profiles', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM profiles ORDER BY full_name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/profiles/:userId', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [req.params.userId]);
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// USER ROLES
// ============================================
app.get('/api/user-roles', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.query;
    let query = 'SELECT * FROM user_roles';
    let params = [];
    if (userId) {
      query += ' WHERE user_id = $1';
      params = [userId];
    }
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// TRANSACTIONS (Chứng từ)
// ============================================

app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const { year, type } = req.query;
    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params = [];
    let idx = 1;

    if (year) { query += ` AND year = $${idx++}`; params.push(parseInt(year)); }
    if (type) { query += ` AND type = $${idx++}`; params.push(type); }
    query += ' ORDER BY date, voucher_no';

    const { rows } = await pool.query(query, params);
    res.json(rows.map(mapTransactionFromDb));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const tx = req.body;
    const id = uuidv4();
    const year = new Date(tx.date).getFullYear();

    const yearCheck = await pool.query('SELECT is_closed FROM year_data WHERE year = $1', [year]);
    if (yearCheck.rows[0]?.is_closed) {
      return res.status(400).json({ error: `Năm ${year} đã khóa sổ` });
    }

    await pool.query(`
      INSERT INTO transactions (id, date, voucher_no, type, amount, description, person_name,
        department, account_code, approver, attachments, created_by, year,
        recipient_name, reason, bank_account, bank_account_name, bank_name, times)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
    `, [
      id, tx.date, tx.voucherNo, tx.type, tx.amount, tx.description, tx.personName,
      tx.department, tx.accountCode, tx.approver, tx.attachments || 0, req.user.id, year,
      tx.recipientName || null, tx.reason || null, tx.bankAccount || null,
      tx.bankAccountName || null, tx.bankName || null, tx.times || null
    ]);

    const { rows } = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    res.json(mapTransactionFromDb(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const tx = req.body;
    await pool.query(`
      UPDATE transactions SET
        date=$1, voucher_no=$2, type=$3, amount=$4, description=$5, person_name=$6,
        department=$7, account_code=$8, approver=$9, attachments=$10,
        recipient_name=$11, reason=$12, bank_account=$13, bank_account_name=$14, bank_name=$15, times=$16
      WHERE id=$17
    `, [
      tx.date, tx.voucherNo, tx.type, tx.amount, tx.description, tx.personName,
      tx.department, tx.accountCode, tx.approver, tx.attachments || 0,
      tx.recipientName || null, tx.reason || null, tx.bankAccount || null,
      tx.bankAccountName || null, tx.bankName || null, tx.times || null,
      req.params.id
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/transactions/next-voucher-no', authenticateToken, async (req, res) => {
  try {
    const { type, year } = req.query;
    const prefixMap = { thu: 'PT', chi: 'PC', 'tham-hoi': 'TH', 'de-nghi': 'DN' };
    const prefix = prefixMap[type] || 'XX';
    const { rows } = await pool.query(
      'SELECT COUNT(*) as cnt FROM transactions WHERE type = $1 AND year = $2',
      [type, parseInt(year) || new Date().getFullYear()]
    );
    const nextNum = parseInt(rows[0].cnt) + 1;
    res.json({ voucherNo: `${prefix}${String(nextNum).padStart(3, '0')}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// DIGITAL SIGNATURES
// ============================================
app.get('/api/digital-signatures', authenticateToken, async (req, res) => {
  try {
    const { userId, isActive } = req.query;
    let query = 'SELECT * FROM digital_signatures WHERE 1=1';
    const params = [];
    let idx = 1;
    if (userId) { query += ` AND user_id = $${idx++}`; params.push(userId); }
    if (isActive !== undefined) { query += ` AND is_active = $${idx++}`; params.push(isActive === 'true'); }
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/digital-signatures', authenticateToken, async (req, res) => {
  try {
    const { userId, publicKey, encryptedPrivateKey, createdBy } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO digital_signatures (user_id, public_key, encrypted_private_key, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, publicKey, encryptedPrivateKey || null, createdBy]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/digital-signatures/:id', authenticateToken, async (req, res) => {
  try {
    const { isActive } = req.body;
    await pool.query('UPDATE digital_signatures SET is_active = $1 WHERE id = $2', [isActive, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/digital-signatures/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM digital_signatures WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// VOUCHER SIGNATURES
// ============================================
app.get('/api/voucher-signatures', authenticateToken, async (req, res) => {
  try {
    const { voucherId, voucherType, signerId } = req.query;
    let query = 'SELECT * FROM voucher_signatures WHERE 1=1';
    const params = [];
    let idx = 1;
    if (voucherId) { query += ` AND voucher_id = $${idx++}`; params.push(voucherId); }
    if (voucherType) { query += ` AND voucher_type = $${idx++}`; params.push(voucherType); }
    if (signerId) { query += ` AND signer_id = $${idx++}`; params.push(signerId); }
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/voucher-signatures', authenticateToken, async (req, res) => {
  try {
    const { voucherId, voucherType, signature, dataHash } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO voucher_signatures (voucher_id, voucher_type, signer_id, signature, data_hash)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [voucherId, voucherType, req.user.id, signature, dataHash]
    );
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Đã ký phiếu này rồi', code: '23505' });
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// PENDING VOUCHERS
// ============================================
app.get('/api/pending-vouchers', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM pending_vouchers';
    const params = [];
    if (status) { query += ' WHERE status = $1'; params.push(status); }
    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pending-vouchers', authenticateToken, async (req, res) => {
  try {
    const { voucherId, voucherType, voucherData, createdBy } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO pending_vouchers (voucher_id, voucher_type, voucher_data, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [voucherId, voucherType, JSON.stringify(voucherData), createdBy]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/pending-vouchers/:id', authenticateToken, async (req, res) => {
  try {
    const updates = req.body;
    const setClauses = [];
    const params = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      setClauses.push(`${dbKey} = $${idx++}`);
      params.push(key === 'voucherData' ? JSON.stringify(value) : value);
    }
    params.push(req.params.id);
    
    await pool.query(
      `UPDATE pending_vouchers SET ${setClauses.join(', ')} WHERE id = $${idx}`,
      params
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// NOTIFICATIONS
// ============================================
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const { userId, title, message, type, relatedVoucherId, relatedVoucherType } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, related_voucher_id, related_voucher_type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, title, message, type, relatedVoucherId || null, relatedVoucherType || null]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// STAFF (Cán bộ / Đoàn viên)
// ============================================
app.get('/api/staff', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM staff ORDER BY full_name');
    res.json(rows.map(mapStaffFromDb));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/staff', authenticateToken, async (req, res) => {
  try {
    const s = req.body;
    const id = uuidv4();
    await pool.query(`
      INSERT INTO staff (id, full_name, department, position, birth_date, gender, salary_coefficient, position_coefficient, regional_salary)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    `, [id, s.fullName, s.department, s.position, s.birthDate || null, s.gender || 'nam',
        s.salaryCoefficient || 0, s.positionCoefficient || 0, s.regionalSalary || 0]);
    const { rows } = await pool.query('SELECT * FROM staff WHERE id = $1', [id]);
    res.json(mapStaffFromDb(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/staff/:id', authenticateToken, async (req, res) => {
  try {
    const s = req.body;
    await pool.query(`
      UPDATE staff SET full_name=$1, department=$2, position=$3, birth_date=$4, gender=$5,
        salary_coefficient=$6, position_coefficient=$7, regional_salary=$8
      WHERE id=$9
    `, [s.fullName, s.department, s.position, s.birthDate || null, s.gender || 'nam',
        s.salaryCoefficient || 0, s.positionCoefficient || 0, s.regionalSalary || 0, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/staff/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM staff WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Staff settings
app.get('/api/staff-settings', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT key, value FROM staff_settings');
    const settings = {};
    rows.forEach(r => { settings[r.key] = JSON.parse(typeof r.value === 'string' ? r.value : JSON.stringify(r.value)); });
    res.json({ baseSalary: settings.baseSalary || 2340000 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/staff-settings', authenticateToken, async (req, res) => {
  try {
    const { baseSalary } = req.body;
    await pool.query(
      `INSERT INTO staff_settings (key, value) VALUES ('baseSalary', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
      [JSON.stringify(baseSalary)]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Transfer history
app.get('/api/transfer-history', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM transfer_history ORDER BY created_at DESC');
    res.json(rows.map(mapTransferFromDb));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transfer-history', authenticateToken, async (req, res) => {
  try {
    const r = req.body;
    const id = uuidv4();
    await pool.query(`
      INSERT INTO transfer_history (id, staff_id, staff_name, from_department, to_department, type, date, note)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `, [id, r.staffId, r.staffName, r.fromDepartment, r.toDepartment, r.type || 'move', r.date, r.note || null]);
    res.json({ id, ...r });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ORG SETTINGS
// ============================================
app.get('/api/org-settings', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT key, value FROM org_settings');
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/org-settings', authenticateToken, async (req, res) => {
  try {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      // value is already a JS object/array, pass as JSON string for JSONB column
      const jsonValue = typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value);
      await pool.query(
        `INSERT INTO org_settings (key, value) VALUES ($1, $2::jsonb)
         ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = NOW()`,
        [key, jsonValue]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// YEAR DATA
// ============================================
app.get('/api/year-data', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM year_data ORDER BY year DESC');
    res.json(rows.map(r => ({
      year: r.year,
      openingBalance: parseFloat(r.opening_balance),
      closingBalance: parseFloat(r.closing_balance),
      isClosed: r.is_closed,
      closedAt: r.closed_at,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/year-data', authenticateToken, async (req, res) => {
  try {
    const { year, openingBalance } = req.body;
    await pool.query(
      `INSERT INTO year_data (year, opening_balance) VALUES ($1, $2)
       ON CONFLICT (year) DO UPDATE SET opening_balance = $2`,
      [year, openingBalance || 0]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/year-data/close', authenticateToken, async (req, res) => {
  try {
    const { year } = req.body;
    const { rows: txRows } = await pool.query(
      `SELECT type, COALESCE(SUM(amount), 0) as total
       FROM transactions WHERE year = $1 GROUP BY type`,
      [year]
    );
    const yearDataResult = await pool.query('SELECT * FROM year_data WHERE year = $1', [year]);
    const openingBalance = yearDataResult.rows[0] ? parseFloat(yearDataResult.rows[0].opening_balance) : 0;

    let totalThu = 0, totalChi = 0;
    txRows.forEach(r => {
      if (r.type === 'thu') totalThu = parseFloat(r.total);
      if (r.type === 'chi') totalChi = parseFloat(r.total);
    });
    const closingBalance = openingBalance + totalThu - totalChi;

    await pool.query(
      `INSERT INTO year_data (year, opening_balance, closing_balance, is_closed, closed_at)
       VALUES ($1, $2, $3, true, NOW())
       ON CONFLICT (year) DO UPDATE SET closing_balance = $3, is_closed = true, closed_at = NOW()`,
      [year, openingBalance, closingBalance]
    );

    const nextYear = year + 1;
    await pool.query(
      `INSERT INTO year_data (year, opening_balance) VALUES ($1, $2)
       ON CONFLICT (year) DO UPDATE SET opening_balance = $2`,
      [nextYear, closingBalance]
    );

    res.json({
      success: true,
      closingBalance,
      message: `Đã khóa sổ năm ${year}. Số dư cuối kỳ ${closingBalance.toLocaleString('vi-VN')} đ kết chuyển sang năm ${nextYear}.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// HELPERS
// ============================================
function mapTransactionFromDb(row) {
  return {
    id: row.id,
    date: row.date,
    voucherNo: row.voucher_no,
    type: row.type,
    amount: parseFloat(row.amount),
    description: row.description,
    personName: row.person_name,
    department: row.department,
    accountCode: row.account_code,
    approver: row.approver,
    attachments: row.attachments,
    createdAt: row.created_at,
    createdBy: row.created_by,
    recipientName: row.recipient_name,
    reason: row.reason,
    bankAccount: row.bank_account,
    bankAccountName: row.bank_account_name,
    bankName: row.bank_name,
    times: row.times,
  };
}

function mapStaffFromDb(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    department: row.department,
    position: row.position,
    birthDate: row.birth_date,
    gender: row.gender,
    salaryCoefficient: parseFloat(row.salary_coefficient),
    positionCoefficient: parseFloat(row.position_coefficient),
    regionalSalary: parseFloat(row.regional_salary),
  };
}

function mapTransferFromDb(row) {
  return {
    id: row.id,
    staffId: row.staff_id,
    staffName: row.staff_name,
    fromDepartment: row.from_department,
    toDepartment: row.to_department,
    type: row.type,
    date: row.date,
    note: row.note,
  };
}

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), server: '10.24.16.77' });
});

// ============================================
// SPA FALLBACK - Mọi route không phải /api sẽ trả về index.html
// ============================================
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, HOST, () => {
  console.log(`
  ============================================
  🚀 Finance Server đang chạy (API + Frontend)
  ============================================
  URL: http://${HOST}:${PORT}
  Server: http://10.24.16.77:${PORT}
  Proxy mạng: hn.proxy.vdb:8080
  
  Truy cập chương trình:
  http://10.24.16.77:${PORT}
  
  Các máy trạm kết nối:
  - Cao Bằng (10.24.x.x) → http://10.24.16.77:${PORT}
  - Bắc Giang (10.42.x.x) → http://10.24.16.77:${PORT}
  - Lạng Sơn (10.30.x.x) → http://10.24.16.77:${PORT}
  - Bắc Ninh (10.44.x.x)  → http://10.24.16.77:${PORT}
  ============================================
  `);
});
