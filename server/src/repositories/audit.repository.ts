import { query } from '../config/database';
import { validateDatabaseEnv } from '../config/env';
import { AuditLog, CreateAuditLogInput } from '../types/audit.types';

// In-memory fallback store for audit logs
const memoryAuditLogs: AuditLog[] = [
  {
    id: 1,
    user_id: 1,
    user_name: 'مدير النظام المركزي',
    action: 'SYSTEM_INITIALIZATION',
    entity_type: 'SYSTEM',
    entity_id: 1,
    new_values: { description: 'تهيئة منظومة إدارة ومتابعة العملاء - مؤسسة الشيخ' },
    created_at: new Date().toISOString(),
  },
];

export class AuditRepository {
  async log(input: CreateAuditLogInput): Promise<AuditLog> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `
          INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *;
        `;
        const params = [
          input.user_id || null,
          input.action,
          input.entity_type,
          input.entity_id || null,
          input.old_values ? JSON.stringify(input.old_values) : null,
          input.new_values ? JSON.stringify(input.new_values) : null,
          input.ip_address || null,
        ];
        const result = await query<AuditLog>(sql, params);
        return result.rows[0];
      } catch (err) {
        console.error('Failed to write audit log to database, falling back to memory store:', err);
      }
    }

    const newLog: AuditLog = {
      id: memoryAuditLogs.length + 1,
      user_id: input.user_id || null,
      user_name: input.user_id === 1 ? 'مدير النظام المركزي' : 'المستخدم',
      action: input.action,
      entity_type: input.entity_type,
      entity_id: input.entity_id || null,
      old_values: input.old_values || null,
      new_values: input.new_values || null,
      ip_address: input.ip_address || '127.0.0.1',
      created_at: new Date().toISOString(),
    };
    memoryAuditLogs.unshift(newLog);
    return newLog;
  }

  async findAll(limit: number = 50): Promise<AuditLog[]> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `
          SELECT a.*, u.full_name as user_name
          FROM audit_logs a
          LEFT JOIN users u ON a.user_id = u.id
          ORDER BY a.created_at DESC
          LIMIT $1;
        `;
        const result = await query<AuditLog>(sql, [limit]);
        return result.rows;
      } catch (err) {
        // Fallback to memory
      }
    }

    return memoryAuditLogs.slice(0, limit);
  }
}

export const auditRepository = new AuditRepository();
