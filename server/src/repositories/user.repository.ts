import { query } from '../config/database';
import { validateDatabaseEnv } from '../config/env';
import { User, CreateUserInput, UpdateUserInput, UserRole, UserStatus } from '../types/user.types';
import bcrypt from 'bcryptjs';

// Pre-computed hash for 'Admin@123456' and '123456'
const DEFAULT_ADMIN_HASH = bcrypt.hashSync('Admin@123456', 10);
const DEFAULT_USER_HASH = bcrypt.hashSync('123456', 10);

// Memory fallback store with seeded initial users
export const memoryUsers: User[] = [
  {
    id: 1,
    full_name: 'مدير النظام المركزي',
    username: 'admin',
    email: 'admin@sheikh-foundation.com',
    password_hash: DEFAULT_ADMIN_HASH,
    phone: '01000000001',
    job_title: 'المدير العام',
    role_code: 'ADMIN',
    status: 'ACTIVE',
    approved_by: 1,
    approved_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    full_name: 'علي محمد حسن',
    username: 'ali',
    email: 'ali@sheikh-foundation.com',
    password_hash: DEFAULT_USER_HASH,
    phone: '01111111101',
    job_title: 'مندوب مبيعات وتوزيع',
    role_code: 'EMPLOYEE',
    status: 'ACTIVE',
    approved_by: 1,
    approved_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    full_name: 'أحمد محمود إبراهيم',
    username: 'ahmed',
    email: 'ahmed@sheikh-foundation.com',
    password_hash: DEFAULT_USER_HASH,
    phone: '01222222202',
    job_title: 'مندوب مبيعات وتوزيع',
    role_code: 'EMPLOYEE',
    status: 'ACTIVE',
    approved_by: 1,
    approved_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    full_name: 'طارق خالد عبد الرحمن',
    username: 'tarek',
    email: 'tarek@sheikh-foundation.com',
    password_hash: DEFAULT_USER_HASH,
    phone: '01555555505',
    job_title: 'محصل مالي ميداني',
    role_code: 'COLLECTOR',
    status: 'ACTIVE',
    approved_by: 1,
    approved_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 5,
    full_name: 'حسام ناصر سالم',
    username: 'hossam',
    email: 'hossam@sheikh-foundation.com',
    password_hash: DEFAULT_USER_HASH,
    phone: '01099887766',
    job_title: 'مندوب مبيعات جديد',
    role_code: 'EMPLOYEE',
    status: 'PENDING_APPROVAL',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 6,
    full_name: 'شركة الأمل للتجارة والتوزيع (أحمد)',
    username: 'customer_ahmed',
    email: 'customer@alamal.com',
    password_hash: DEFAULT_USER_HASH,
    phone: '01012345678',
    job_title: 'عميل معتمد',
    role_code: 'CUSTOMER',
    status: 'ACTIVE',
    customer_id: 1,
    approved_by: 1,
    approved_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 7,
    full_name: 'مؤسسة النور للتوريدات (نور الدين)',
    username: 'customer_nour',
    email: 'customer@alnoor.com',
    password_hash: DEFAULT_USER_HASH,
    phone: '01098765432',
    job_title: 'عميل معتمد',
    role_code: 'CUSTOMER',
    status: 'ACTIVE',
    customer_id: 2,
    approved_by: 1,
    approved_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];


export class UserRepository {
  async findByUsernameOrEmail(identifier: string): Promise<User | null> {
    const cleanId = identifier.trim().toLowerCase();
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `
          SELECT * FROM users
          WHERE LOWER(username) = $1 OR LOWER(email) = $1
          LIMIT 1;
        `;
        const result = await query<User>(sql, [cleanId]);
        return result.rows[0] || null;
      } catch (err) {
        // Fallback to memory
      }
    }

    const user = memoryUsers.find(
      (u) => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
    );
    return user ? { ...user } : null;
  }

  async findById(id: number): Promise<User | null> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `SELECT * FROM users WHERE id = $1 LIMIT 1;`;
        const result = await query<User>(sql, [id]);
        return result.rows[0] || null;
      } catch (err) {
        // Fallback to memory
      }
    }

    const user = memoryUsers.find((u) => u.id === id);
    return user ? { ...user } : null;
  }

  async findAll(options?: {
    search?: string;
    role?: UserRole;
    status?: UserStatus;
  }): Promise<User[]> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        let sql = `SELECT * FROM users WHERE 1=1`;
        const params: unknown[] = [];
        let paramIndex = 1;

        if (options?.search) {
          sql += ` AND (LOWER(full_name) LIKE $${paramIndex} OR LOWER(username) LIKE $${paramIndex} OR LOWER(email) LIKE $${paramIndex})`;
          params.push(`%${options.search.toLowerCase()}%`);
          paramIndex++;
        }

        if (options?.role) {
          sql += ` AND role_code = $${paramIndex}`;
          params.push(options.role);
          paramIndex++;
        }

        if (options?.status) {
          sql += ` AND status = $${paramIndex}`;
          params.push(options.status);
          paramIndex++;
        }

        sql += ` ORDER BY created_at DESC;`;
        const result = await query<User>(sql, params);
        return result.rows;
      } catch (err) {
        // Fallback to memory
      }
    }

    return memoryUsers.filter((u) => {
      if (options?.search) {
        const s = options.search.toLowerCase();
        const match =
          u.full_name.toLowerCase().includes(s) ||
          u.username.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s);
        if (!match) return false;
      }
      if (options?.role && u.role_code !== options.role) return false;
      if (options?.status && u.status !== options.status) return false;
      return true;
    });
  }

  async create(input: CreateUserInput, passwordHash: string): Promise<User> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `
          INSERT INTO users (full_name, username, email, password_hash, phone, job_title, role_code, status, customer_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *;
        `;
        const params = [
          input.full_name,
          input.username.toLowerCase().trim(),
          input.email.toLowerCase().trim(),
          passwordHash,
          input.phone || null,
          input.job_title || null,
          input.role_code,
          input.status || 'PENDING_APPROVAL',
          input.customer_id || null,
        ];
        const result = await query<User>(sql, params);
        return result.rows[0];
      } catch (err) {
        // Fallback to memory
      }
    }

    const newUser: User = {
      id: memoryUsers.length + 1,
      full_name: input.full_name,
      username: input.username.toLowerCase().trim(),
      email: input.email.toLowerCase().trim(),
      password_hash: passwordHash,
      phone: input.phone || null,
      job_title: input.job_title || null,
      role_code: input.role_code,
      status: input.status || 'PENDING_APPROVAL',
      customer_id: input.customer_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryUsers.unshift(newUser);
    return newUser;
  }

  async update(id: number, input: UpdateUserInput): Promise<User | null> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `
          UPDATE users
          SET 
            full_name = COALESCE($1, full_name),
            email = COALESCE($2, email),
            phone = COALESCE($3, phone),
            job_title = COALESCE($4, job_title),
            role_code = COALESCE($5, role_code),
            status = COALESCE($6, status),
            customer_id = COALESCE($7, customer_id),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $8
          RETURNING *;
        `;
        const params = [
          input.full_name || null,
          input.email?.toLowerCase().trim() || null,
          input.phone || null,
          input.job_title || null,
          input.role_code || null,
          input.status || null,
          input.customer_id !== undefined ? input.customer_id : null,
          id,
        ];
        const result = await query<User>(sql, params);
        return result.rows[0] || null;
      } catch (err) {
        // Fallback to memory
      }
    }

    const idx = memoryUsers.findIndex((u) => u.id === id);
    if (idx === -1) return null;

    const existing = memoryUsers[idx];
    const updated: User = {
      ...existing,
      full_name: input.full_name ?? existing.full_name,
      email: input.email?.toLowerCase().trim() ?? existing.email,
      phone: input.phone !== undefined ? input.phone : existing.phone,
      job_title: input.job_title !== undefined ? input.job_title : existing.job_title,
      role_code: input.role_code ?? existing.role_code,
      status: input.status ?? existing.status,
      customer_id: input.customer_id !== undefined ? input.customer_id : existing.customer_id,
      updated_at: new Date().toISOString(),
    };

    memoryUsers[idx] = updated;
    return { ...updated };
  }

  async approveUser(id: number, adminId: number): Promise<User | null> {
    const now = new Date().toISOString();
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `
          UPDATE users
          SET status = 'ACTIVE', approved_by = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *;
        `;
        const result = await query<User>(sql, [adminId, id]);
        return result.rows[0] || null;
      } catch (err) {
        // Fallback to memory
      }
    }

    const idx = memoryUsers.findIndex((u) => u.id === id);
    if (idx === -1) return null;

    memoryUsers[idx].status = 'ACTIVE';
    memoryUsers[idx].approved_by = adminId;
    memoryUsers[idx].approved_at = now;
    memoryUsers[idx].updated_at = now;
    return memoryUsers[idx];
  }

  async rejectUser(id: number, adminId: number, reason?: string): Promise<User | null> {
    const now = new Date().toISOString();
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `
          UPDATE users
          SET status = 'REJECTED', approved_by = $1, approved_at = CURRENT_TIMESTAMP, rejection_reason = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
          RETURNING *;
        `;
        const result = await query<User>(sql, [adminId, reason || null, id]);
        return result.rows[0] || null;
      } catch (err) {
        // Fallback to memory
      }
    }

    const idx = memoryUsers.findIndex((u) => u.id === id);
    if (idx === -1) return null;

    memoryUsers[idx].status = 'REJECTED';
    memoryUsers[idx].approved_by = adminId;
    memoryUsers[idx].approved_at = now;
    memoryUsers[idx].rejection_reason = reason || null;
    memoryUsers[idx].updated_at = now;
    return memoryUsers[idx];
  }

  async updatePassword(id: number, passwordHash: string): Promise<boolean> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        await query(
          `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;`,
          [passwordHash, id]
        );
        return true;
      } catch (err) {
        // Fallback to memory
      }
    }

    const idx = memoryUsers.findIndex((u) => u.id === id);
    if (idx !== -1) {
      memoryUsers[idx].password_hash = passwordHash;
      memoryUsers[idx].updated_at = new Date().toISOString();
      return true;
    }
    return false;
  }

  async countPending(): Promise<number> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `SELECT COUNT(*) as count FROM users WHERE status = 'PENDING_APPROVAL';`;
        const result = await query<{ count: string }>(sql);
        return parseInt(result.rows[0]?.count || '0', 10);
      } catch (err) {
        // Fallback to memory
      }
    }

    return memoryUsers.filter((u) => u.status === 'PENDING_APPROVAL').length;
  }
}

export const userRepository = new UserRepository();

