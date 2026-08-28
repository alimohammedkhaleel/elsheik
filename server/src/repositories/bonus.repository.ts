import { query } from '../config/database';
import { validateDatabaseEnv } from '../config/env';
import { Bonus, CreateBonusInput } from '../types/bonus.types';

// In-memory fallback store with seeded sample bonus plans
const memoryBonuses: Bonus[] = [
  {
    id: 1,
    name: 'مكافأة تحقيق المستهدف الشهري للمبيعات',
    description: 'حافز نقدي يصرف لكل مندوب مبيعات يتجاوز مستهدف 100,000 ج.م شهرياً',
    bonus_type: 'FIXED',
    value: 2500.0,
    is_active: true,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    criteria: 'تحقيق نسبة 100% فأكثر من مبيعات التوزيع المعتمدة',
    created_by: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'عمولة التحصيل المبكر للديون',
    description: 'نسبة مئوية تمنح للمحصل على إجمالي المبالغ المحصلة قبل موعد الاستحقاق',
    bonus_type: 'PERCENTAGE',
    value: 2.5,
    is_active: true,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    criteria: 'تحصيل الفواتير الآجلة في أول 10 أيام من تاريخ الإصدار',
    created_by: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export class BonusRepository {
  async findAll(activeOnly?: boolean): Promise<Bonus[]> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        let sql = `SELECT * FROM bonuses WHERE 1=1`;
        if (activeOnly) {
          sql += ` AND is_active = TRUE`;
        }
        sql += ` ORDER BY created_at DESC;`;
        const result = await query<Bonus>(sql);
        return result.rows;
      } catch (err) {
        // Fallback to memory
      }
    }

    if (activeOnly) {
      return memoryBonuses.filter((b) => b.is_active);
    }
    return memoryBonuses;
  }

  async findById(id: number): Promise<Bonus | null> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `SELECT * FROM bonuses WHERE id = $1 LIMIT 1;`;
        const result = await query<Bonus>(sql, [id]);
        return result.rows[0] || null;
      } catch (err) {
        // Fallback to memory
      }
    }

    const b = memoryBonuses.find((item) => item.id === id);
    return b ? { ...b } : null;
  }

  async create(input: CreateBonusInput, creatorId?: number): Promise<Bonus> {
    const now = new Date().toISOString();
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `
          INSERT INTO bonuses (name, description, bonus_type, value, is_active, start_date, end_date, criteria, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *;
        `;
        const result = await query<Bonus>(sql, [
          input.name.trim(),
          input.description || null,
          input.bonus_type,
          input.value,
          input.is_active !== undefined ? input.is_active : true,
          input.start_date || null,
          input.end_date || null,
          input.criteria || null,
          creatorId || null,
        ]);
        return result.rows[0];
      } catch (err) {
        // Fallback to memory
      }
    }

    const newBonus: Bonus = {
      id: memoryBonuses.length + 1,
      name: input.name.trim(),
      description: input.description || null,
      bonus_type: input.bonus_type,
      value: Number(input.value),
      is_active: input.is_active !== undefined ? input.is_active : true,
      start_date: input.start_date || null,
      end_date: input.end_date || null,
      criteria: input.criteria || null,
      created_by: creatorId || null,
      created_at: now,
      updated_at: now,
    };
    memoryBonuses.unshift(newBonus);
    return newBonus;
  }

  async update(id: number, input: Partial<CreateBonusInput>): Promise<Bonus | null> {
    const now = new Date().toISOString();
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `
          UPDATE bonuses
          SET
            name = COALESCE($1, name),
            description = COALESCE($2, description),
            bonus_type = COALESCE($3, bonus_type),
            value = COALESCE($4, value),
            is_active = COALESCE($5, is_active),
            start_date = COALESCE($6, start_date),
            end_date = COALESCE($7, end_date),
            criteria = COALESCE($8, criteria),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $9
          RETURNING *;
        `;
        const result = await query<Bonus>(sql, [
          input.name || null,
          input.description || null,
          input.bonus_type || null,
          input.value !== undefined ? input.value : null,
          input.is_active !== undefined ? input.is_active : null,
          input.start_date || null,
          input.end_date || null,
          input.criteria || null,
          id,
        ]);
        return result.rows[0] || null;
      } catch (err) {
        // Fallback to memory
      }
    }

    const idx = memoryBonuses.findIndex((b) => b.id === id);
    if (idx === -1) return null;

    memoryBonuses[idx] = {
      ...memoryBonuses[idx],
      ...input,
      updated_at: now,
    };
    return memoryBonuses[idx];
  }

  async toggleActive(id: number): Promise<Bonus | null> {
    const bonus = await this.findById(id);
    if (!bonus) return null;
    return this.update(id, { is_active: !bonus.is_active });
  }
}

export const bonusRepository = new BonusRepository();
