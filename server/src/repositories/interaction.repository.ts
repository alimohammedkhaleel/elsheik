import { query } from '../config/database';
import { validateDatabaseEnv } from '../config/env';
import { userRepository } from './user.repository';
import { CustomerInteraction, CreateInteractionInput } from '../types/interaction.types';

const memoryInteractions: CustomerInteraction[] = [
  {
    id: 1,
    customer_id: 1,
    employee_id: 2,
    employee_name: 'علي محمد حسن',
    interaction_type: 'VISIT',
    interaction_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    summary: 'زيارة ميدانية دورية وتفقد رصيد المخزون',
    notes: 'العميل يطلب شحنة إضافية مطلع الشهر القادم',
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 2,
    customer_id: 1,
    employee_id: 4,
    employee_name: 'طارق خالد عبد الرحمن',
    interaction_type: 'CALL',
    interaction_date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
    summary: 'مكالمة هاتفية لتذكير بموعد استحقاق دفعة الفاتورة',
    notes: 'أكد العميل تحويل المبلغ عبر الحساب البنكي',
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
];

export class InteractionRepository {
  async findByCustomer(customerId: number): Promise<CustomerInteraction[]> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `
          SELECT 
            ci.*,
            u.full_name as employee_name
          FROM customer_interactions ci
          JOIN users u ON ci.employee_id = u.id
          WHERE ci.customer_id = $1
          ORDER BY ci.interaction_date DESC, ci.id DESC;
        `;
        const result = await query<CustomerInteraction>(sql, [customerId]);
        return result.rows;
      } catch (err) {
        // Fallback to memory
      }
    }

    return memoryInteractions.filter((i) => i.customer_id === customerId);
  }

  async create(input: CreateInteractionInput, employeeId: number): Promise<CustomerInteraction> {
    const employee = await userRepository.findById(employeeId);
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `
          INSERT INTO customer_interactions (
            customer_id, employee_id, interaction_type, interaction_date, summary, notes, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *;
        `;
        const params = [
          input.customer_id,
          employeeId,
          input.interaction_type,
          input.interaction_date || new Date().toISOString().split('T')[0],
          input.summary.trim(),
          input.notes?.trim() || null,
          input.status || 'COMPLETED',
        ];
        const result = await query<CustomerInteraction>(sql, params);
        return {
          ...result.rows[0],
          employee_name: employee?.full_name,
        };
      } catch (err) {
        // Fallback to memory
      }
    }

    const newInteraction: CustomerInteraction = {
      id: memoryInteractions.length + 1,
      customer_id: input.customer_id,
      employee_id: employeeId,
      employee_name: employee?.full_name || 'موظف',
      interaction_type: input.interaction_type,
      interaction_date: input.interaction_date || new Date().toISOString().split('T')[0],
      summary: input.summary.trim(),
      notes: input.notes?.trim() || null,
      status: input.status || 'COMPLETED',
      created_at: new Date().toISOString(),
    };

    memoryInteractions.unshift(newInteraction);
    return newInteraction;
  }
}

export const interactionRepository = new InteractionRepository();
