/**
 * API Client - Kết nối tới Node.js Backend Server
 * Thay thế Supabase client cho môi trường WAN
 */

// Đọc từ biến môi trường, mặc định tới máy chủ 10.24.16.77
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://10.24.16.77:3001';

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

function setToken(token: string) {
  localStorage.setItem('auth_token', token);
}

function removeToken() {
  localStorage.removeItem('auth_token');
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: any }> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const json = await response.json();

    if (!response.ok) {
      return { data: null, error: { message: json.error || 'Lỗi server', code: json.code, status: response.status } };
    }

    return { data: json, error: null };
  } catch (err: any) {
    return { data: null, error: { message: err.message || 'Không thể kết nối tới server' } };
  }
}

// ============================================
// AUTH API
// ============================================
export const authApi = {
  async login(username: string, password: string) {
    const email = username.includes('@') ? username : `${username}@app.local`;
    const result = await request<{
      token: string;
      user: { id: string; email: string };
      roles: string[];
      profile: { full_name: string; email: string | null; username: string | null; assigned_area: string | null } | null;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.data?.token) {
      setToken(result.data.token);
    }
    return result;
  },

  async getMe() {
    return request<{
      user: { id: string; email: string };
      roles: string[];
      profile: { full_name: string; email: string | null; username: string | null; assigned_area: string | null } | null;
    }>('/api/auth/me');
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  logout() {
    removeToken();
  },

  isLoggedIn() {
    return !!getToken();
  },

  getToken,
};

// ============================================
// SETUP ADMIN
// ============================================
export const setupApi = {
  async setupAdmin(username: string, password: string) {
    return request('/api/setup-admin', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },
};

// ============================================
// ADMIN USER MANAGEMENT
// ============================================
export const adminApi = {
  async getUsers() {
    return request<any[]>('/api/admin/users');
  },
  async createUser(data: { username: string; password: string; fullName: string; role?: string; assignedArea?: string }) {
    return request('/api/admin/create-user', { method: 'POST', body: JSON.stringify(data) });
  },
  async manageUser(data: { userId: string; action: string; fullName?: string; role?: string; assignedArea?: string; isActive?: boolean }) {
    return request('/api/admin/manage-user', { method: 'POST', body: JSON.stringify(data) });
  },
  async resetPassword(userId: string, newPassword: string) {
    return request('/api/admin/reset-password', { method: 'POST', body: JSON.stringify({ userId, newPassword }) });
  },
};

// ============================================
// PROFILES
// ============================================
export const profilesApi = {
  async getAll() {
    return request<any[]>('/api/profiles');
  },
  async getByUserId(userId: string) {
    return request<any>(`/api/profiles/${userId}`);
  },
};

// ============================================
// USER ROLES
// ============================================
export const rolesApi = {
  async getAll(userId?: string) {
    const query = userId ? `?userId=${userId}` : '';
    return request<any[]>(`/api/user-roles${query}`);
  },
};

// ============================================
// TRANSACTIONS
// ============================================
export const transactionsApi = {
  async getAll(year?: number, type?: string) {
    const params = new URLSearchParams();
    if (year) params.set('year', String(year));
    if (type) params.set('type', type);
    return request<any[]>(`/api/transactions?${params}`);
  },
  async create(tx: any) {
    return request('/api/transactions', { method: 'POST', body: JSON.stringify(tx) });
  },
  async update(id: string, tx: any) {
    return request(`/api/transactions/${id}`, { method: 'PUT', body: JSON.stringify(tx) });
  },
  async delete(id: string) {
    return request(`/api/transactions/${id}`, { method: 'DELETE' });
  },
  async getNextVoucherNo(type: string, year?: number) {
    const y = year || new Date().getFullYear();
    return request<{ voucherNo: string }>(`/api/transactions/next-voucher-no?type=${type}&year=${y}`);
  },
};

// ============================================
// DIGITAL SIGNATURES
// ============================================
export const digitalSignaturesApi = {
  async get(userId?: string, isActive?: boolean) {
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    if (isActive !== undefined) params.set('isActive', String(isActive));
    return request<any[]>(`/api/digital-signatures?${params}`);
  },
  async create(data: { userId: string; publicKey: string; encryptedPrivateKey?: string; createdBy: string }) {
    return request('/api/digital-signatures', { method: 'POST', body: JSON.stringify(data) });
  },
  async update(id: string, data: { isActive: boolean }) {
    return request(`/api/digital-signatures/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async delete(id: string) {
    return request(`/api/digital-signatures/${id}`, { method: 'DELETE' });
  },
};

// ============================================
// VOUCHER SIGNATURES
// ============================================
export const voucherSignaturesApi = {
  async get(voucherId?: string, voucherType?: string, signerId?: string) {
    const params = new URLSearchParams();
    if (voucherId) params.set('voucherId', voucherId);
    if (voucherType) params.set('voucherType', voucherType);
    if (signerId) params.set('signerId', signerId);
    return request<any[]>(`/api/voucher-signatures?${params}`);
  },
  async create(data: { voucherId: string; voucherType: string; signature: string; dataHash: string }) {
    return request('/api/voucher-signatures', { method: 'POST', body: JSON.stringify(data) });
  },
};

// ============================================
// PENDING VOUCHERS
// ============================================
export const pendingVouchersApi = {
  async getAll(status?: string) {
    const query = status ? `?status=${status}` : '';
    return request<any[]>(`/api/pending-vouchers${query}`);
  },
  async create(data: any) {
    return request('/api/pending-vouchers', { method: 'POST', body: JSON.stringify(data) });
  },
  async update(id: string, data: any) {
    return request(`/api/pending-vouchers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
};

// ============================================
// NOTIFICATIONS
// ============================================
export const notificationsApi = {
  async getAll() {
    return request<any[]>('/api/notifications');
  },
  async create(data: { userId: string; title: string; message: string; type: string; relatedVoucherId?: string; relatedVoucherType?: string }) {
    return request('/api/notifications', { method: 'POST', body: JSON.stringify(data) });
  },
  async markRead(id: string) {
    return request(`/api/notifications/${id}/read`, { method: 'PUT' });
  },
  async markAllRead() {
    return request('/api/notifications/read-all', { method: 'PUT' });
  },
};

// ============================================
// STAFF
// ============================================
export const staffApi = {
  async getAll() {
    return request<any[]>('/api/staff');
  },
  async create(data: any) {
    return request('/api/staff', { method: 'POST', body: JSON.stringify(data) });
  },
  async update(id: string, data: any) {
    return request(`/api/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async delete(id: string) {
    return request(`/api/staff/${id}`, { method: 'DELETE' });
  },
  async getSettings() {
    return request<{ baseSalary: number }>('/api/staff-settings');
  },
  async saveSettings(data: { baseSalary: number }) {
    return request('/api/staff-settings', { method: 'PUT', body: JSON.stringify(data) });
  },
  async getTransferHistory() {
    return request<any[]>('/api/transfer-history');
  },
  async addTransfer(data: any) {
    return request('/api/transfer-history', { method: 'POST', body: JSON.stringify(data) });
  },
};

// ============================================
// ORG SETTINGS
// ============================================
export const orgSettingsApi = {
  async get() {
    return request<Record<string, any>>('/api/org-settings');
  },
  async save(settings: Record<string, any>) {
    return request('/api/org-settings', { method: 'PUT', body: JSON.stringify(settings) });
  },
};

// ============================================
// YEAR DATA
// ============================================
export const yearDataApi = {
  async getAll() {
    return request<any[]>('/api/year-data');
  },
  async create(year: number, openingBalance: number) {
    return request('/api/year-data', { method: 'POST', body: JSON.stringify({ year, openingBalance }) });
  },
  async closeYear(year: number) {
    return request<{ success: boolean; closingBalance: number; message: string }>('/api/year-data/close', {
      method: 'POST',
      body: JSON.stringify({ year }),
    });
  },
};

// ============================================
// HEALTH CHECK
// ============================================
export const healthApi = {
  async check() {
    return request<{ status: string; time: string; server: string }>('/api/health');
  },
};
