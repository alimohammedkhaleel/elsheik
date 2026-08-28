import { query } from '../config/database';
import { validateDatabaseEnv } from '../config/env';
import { userRepository } from './user.repository';
import {
  RepBonusDeduction,
  CreateRepBonusInput,
  RepBonusFilterOptions,
  RepBonusSummary,
} from '../types/repBonus.types';

// In-memory fallback transactions
const memoryRepTransactions: RepBonusDeduction[] = [
  {
    id: 1,
    representative_id: 2,
    representative_name: 'علي محمد حسن',
    representative_job: 'مندوب مبيعات وتوزيع',
    type: 'BONUS',
    amount: 5000,
    reason: 'تحقيق تارجت مبيعات الربع الأول بنسبة 115%',
    transaction_date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    notes: 'معتمد من الإدارة العامة',
    created_by: 1,
    created_by_name: 'مدير النظام المركزي',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 2,
    representative_id: 3,
    representative_name: 'أحمد محمود إبراهيم',
    representative_job: 'مندوب مبيعات وتوزيع',
    type: 'DEDUCTION',
    amount: 1500,
    reason: 'تأخير في تسليم سندات التحصيل عن الموعد المحدد',
    transaction_date: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0],
    notes: 'إشعار مالي مسجل',
    created_by: 1,
    created_by_name: 'مدير النظام المركزي',
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 3,
    representative_id: 4,
    representative_name: 'طارق خالد عبد الرحمن',
    representative_job: 'محصل مالي ميداني',
    type: 'BONUS',
    amount: 3000,
    reason: 'تحصيل ديون قديمة متعثرة تجاوزت 90 يوماً',
    transaction_date: new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0],
    notes: 'مكافأة تميز تحصيلي',
    created_by: 1,
    created_by_name: 'مدير النظام المركزي',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];

export class RepBonusRepository {
  async findAll(options?: RepBonusFilterOptions): Promise<RepBonusDeduction[]> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        let sql = `
          SELECT 
            rbd.*,
            u.full_name as representative_name,
            u.job_title as representative_job,
            c.full_name as created_by_name
          FROM rep_bonus_deductions rbd
          JOIN users u ON rbd.representative_id = u.id
          LEFT JOIN users c ON rbd.created_by = c.id
          WHERE 1=1
        `;
        const params: unknown[] = [];
        let pIndex = 1;

        if (options?.representative_id) {
          sql += ` AND rbd.representative_id = $${pIndex++}`;
          params.push(options.representative_id);
        }

        if (options?.type) {
          sql += ` AND rbd.type = $${pIndex++}`;
          params.push(options.type);
        }

        if (options?.start_date) {
          sql += ` AND rbd.transaction_date >= $${pIndex++}`;
          params.push(options.start_date);
        }

        if (options?.end_date) {
          sql += ` AND rbd.transaction_date <= $${pIndex++}`;
          params.push(options.end_date);
        }

        sql += ` ORDER BY rbd.transaction_date DESC, rbd.id DESC`;
        const result = await query<RepBonusDeduction>(sql, params);
        return result.rows.map((row) => ({
          ...row,
          amount: Number(row.amount),
        }));
      } catch (err) {
        // Fallback to memory
      }
    }

    return memoryRepTransactions.filter((tx) => {
      if (options?.representative_id && tx.representative_id !== options.representative_id) return false;
      if (options?.type && tx.type !== options.type) return false;
      if (options?.start_date && tx.transaction_date < options.start_date) return false;
      if (options?.end_date && tx.transaction_date > options.end_date) return false;
      return true;
    });
  }

  async create(input: CreateRepBonusInput, createdBy: number): Promise<RepBonusDeduction> {
    const rep = await userRepository.findById(input.representative_id);
    const creator = await userRepository.findById(createdBy);

    const { isConfigured } = validateDatabaseEnv();
    if (isConfigured) {
      try {
        const sql = `
          INSERT INTO rep_bonus_deductions (
            representative_id, type, amount, reason, transaction_date, notes, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *;
        `;
        const params = [
          input.representative_id,
          input.type,
          input.amount,
          input.reason.trim(),
          input.transaction_date || new Date().toISOString().split('T')[0],
          input.notes?.trim() || null,
          createdBy,
        ];
        const result = await query<RepBonusDeduction>(sql, params);
        const row = result.rows[0];
        return {
          ...row,
          amount: Number(row.amount),
          representative_name: rep?.full_name,
          representative_job: rep?.job_title || undefined,
          created_by_name: creator?.full_name,
        };
      } catch (err) {
        // Fallback to memory
      }
    }

    const newTx: RepBonusDeduction = {
      id: memoryRepTransactions.length + 1,
      representative_id: input.representative_id,
      representative_name: rep?.full_name || 'مندوب مبيعات',
      representative_job: rep?.job_title || 'مندوب مبيعات',
      type: input.type,
      amount: Number(input.amount),
      reason: input.reason.trim(),
      transaction_date: input.transaction_date || new Date().toISOString().split('T')[0],
      notes: input.notes?.trim() || null,
      created_by: createdBy,
      created_by_name: creator?.full_name || 'مدير النظام',
      created_at: new Date().toISOString(),
    };

    memoryRepTransactions.unshift(newTx);
    return newTx;
  }

  async getSummaries(): Promise<RepBonusSummary[]> {
    const all = await this.findAll();
    const map = new Map<number, RepBonusSummary>();

    for (const tx of all) {
      const prev = map.get(tx.representative_id) || {
        representative_id: tx.representative_id,
        representative_name: tx.representative_name || 'مندوب',
        total_bonuses: 0,
        total_deductions: 0,
        net_amount: 0,
        transaction_count: 0,
      };

      if (tx.type === 'BONUS') {
        prev.total_bonuses += tx.amount;
      } else {
        prev.total_deductions += tx.amount;
      }
      prev.net_amount = prev.total_bonuses - prev.total_deductions;
      prev.transaction_count += 1;
      map.set(tx.representative_id, prev);
    }

    return Array.from(map.values());
  }
}

export const repBonusRepository = new RepBonusRepository();
