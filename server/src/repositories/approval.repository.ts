import { query } from '../config/database';
import { validateDatabaseEnv } from '../config/env';
import { ApprovalRecord, ApprovalStatus } from '../types/approval.types';

// In-memory fallback store for approvals
const memoryApprovals: ApprovalRecord[] = [
  {
    id: 1,
    entity_type: 'USER',
    entity_id: 5,
    entity_name: 'حسام ناصر سالم (مندوب مبيعات)',
    submitted_by: 5,
    submitter_name: 'حسام ناصر سالم',
    status: 'PENDING',
    details: {
      email: 'hossam@sheikh-foundation.com',
      phone: '01099887766',
      requested_role: 'EMPLOYEE',
      job_title: 'مندوب مبيعات جديد',
    },
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 2,
    entity_type: 'DATA',
    entity_id: 101,
    entity_name: 'تحديث بيانات ائتمان عميل (شركة النور للتجارة)',
    submitted_by: 2,
    submitter_name: 'علي محمد حسن',
    status: 'PENDING',
    details: {
      requested_change: 'رفع الحد الائتماني من 50,000 ج.م إلى 75,000 ج.م بناءً على انتظام السداد',
    },
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

export class ApprovalRepository {
  async findAll(status?: ApprovalStatus): Promise<ApprovalRecord[]> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        let sql = `
          SELECT 
            a.*,
            u.full_name as submitter_name,
            r.full_name as reviewer_name
          FROM approval_records a
          LEFT JOIN users u ON a.submitted_by = u.id
          LEFT JOIN users r ON a.reviewed_by = r.id
          WHERE 1=1
        `;
        const params: unknown[] = [];
        if (status) {
          sql += ` AND a.status = $1`;
          params.push(status);
        }
        sql += ` ORDER BY a.created_at DESC;`;
        const result = await query<ApprovalRecord>(sql, params);
        return result.rows;
      } catch (err) {
        // Fallback to memory
      }
    }

    if (status) {
      return memoryApprovals.filter((a) => a.status === status);
    }
    return memoryApprovals;
  }

  async findById(id: number): Promise<ApprovalRecord | null> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `
          SELECT a.*, u.full_name as submitter_name, r.full_name as reviewer_name
          FROM approval_records a
          LEFT JOIN users u ON a.submitted_by = u.id
          LEFT JOIN users r ON a.reviewed_by = r.id
          WHERE a.id = $1
          LIMIT 1;
        `;
        const result = await query<ApprovalRecord>(sql, [id]);
        return result.rows[0] || null;
      } catch (err) {
        // Fallback to memory
      }
    }

    const item = memoryApprovals.find((a) => a.id === id);
    return item ? { ...item } : null;
  }

  async create(record: Omit<ApprovalRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ApprovalRecord> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `
          INSERT INTO approval_records (entity_type, entity_id, submitted_by, status, review_notes)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *;
        `;
        const result = await query<ApprovalRecord>(sql, [
          record.entity_type,
          record.entity_id,
          record.submitted_by || null,
          record.status,
          record.review_notes || null,
        ]);
        return result.rows[0];
      } catch (err) {
        // Fallback to memory
      }
    }

    const newRec: ApprovalRecord = {
      ...record,
      id: memoryApprovals.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryApprovals.unshift(newRec);
    return newRec;
  }

  async updateDecision(
    id: number,
    decision: 'APPROVED' | 'REJECTED',
    reviewerId: number,
    notes?: string
  ): Promise<ApprovalRecord | null> {
    const now = new Date().toISOString();
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `
          UPDATE approval_records
          SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP, review_notes = $3, updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
          RETURNING *;
        `;
        const result = await query<ApprovalRecord>(sql, [decision, reviewerId, notes || null, id]);
        return result.rows[0] || null;
      } catch (err) {
        // Fallback to memory
      }
    }

    const idx = memoryApprovals.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    memoryApprovals[idx].status = decision;
    memoryApprovals[idx].reviewed_by = reviewerId;
    memoryApprovals[idx].reviewer_name = 'مدير النظام المركزي';
    memoryApprovals[idx].reviewed_at = now;
    memoryApprovals[idx].review_notes = notes || null;
    memoryApprovals[idx].updated_at = now;
    return memoryApprovals[idx];
  }
}

export const approvalRepository = new ApprovalRepository();
