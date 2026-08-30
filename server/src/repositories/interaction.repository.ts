import { query } from '../config/database';
import { validateDatabaseEnv } from '../config/env';
import { userRepository } from './user.repository';
import { CustomerInteraction, CreateInteractionInput } from '../types/interaction.types';

let memoryIdCounter = 3;
const memoryInteractions: CustomerInteraction[] = [];

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

    return memoryInteractions
      .filter((i) => i.customer_id === customerId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async create(input: CreateInteractionInput, employeeId: number): Promise<CustomerInteraction> {
    const employee = await userRepository.findById(employeeId);
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `
          INSERT INTO customer_interactions (
            customer_id, employee_id, interaction_type, interaction_date, summary, notes, status, follow_up_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
          input.follow_up_date || null,
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
      id: memoryIdCounter++,
      customer_id: input.customer_id,
      employee_id: employeeId,
      employee_name: employee?.full_name || 'موظف',
      interaction_type: input.interaction_type,
      interaction_date: input.interaction_date || new Date().toISOString().split('T')[0],
      summary: input.summary.trim(),
      notes: input.notes?.trim() || null,
      follow_up_date: input.follow_up_date || null,
      status: input.status || 'COMPLETED',
      created_at: new Date().toISOString(),
    };

    memoryInteractions.unshift(newInteraction);
    return newInteraction;
  }

  async updateOne(
    interactionId: number,
    customerId: number,
    input: Partial<CreateInteractionInput>
  ): Promise<CustomerInteraction | null> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const fields: string[] = [];
        const params: unknown[] = [interactionId, customerId];
        let pIdx = 3;

        if (input.interaction_type !== undefined) {
          fields.push(`interaction_type = $${pIdx++}`);
          params.push(input.interaction_type);
        }
        if (input.interaction_date !== undefined) {
          fields.push(`interaction_date = $${pIdx++}`);
          params.push(input.interaction_date);
        }
        if (input.summary !== undefined) {
          fields.push(`summary = $${pIdx++}`);
          params.push(input.summary.trim());
        }
        if (input.notes !== undefined) {
          fields.push(`notes = $${pIdx++}`);
          params.push(input.notes?.trim() || null);
        }
        if (input.status !== undefined) {
          fields.push(`status = $${pIdx++}`);
          params.push(input.status);
        }
        if (input.follow_up_date !== undefined) {
          fields.push(`follow_up_date = $${pIdx++}`);
          params.push(input.follow_up_date || null);
        }

        if (fields.length > 0) {
          const sql = `
            UPDATE customer_interactions
            SET ${fields.join(', ')}
            WHERE id = $1 AND customer_id = $2
            RETURNING *;
          `;
          const result = await query<CustomerInteraction>(sql, params);
          if (result.rows.length > 0) {
            const employee = await userRepository.findById(result.rows[0].employee_id);
            return {
              ...result.rows[0],
              employee_name: employee?.full_name,
            };
          }
        }
      } catch (err) {
        // Fallback to memory
      }
    }

    const idx = memoryInteractions.findIndex(
      (i) => i.id === interactionId && i.customer_id === customerId
    );
    if (idx !== -1) {
      if (input.interaction_type !== undefined) memoryInteractions[idx].interaction_type = input.interaction_type;
      if (input.interaction_date !== undefined) memoryInteractions[idx].interaction_date = input.interaction_date;
      if (input.summary !== undefined) memoryInteractions[idx].summary = input.summary.trim();
      if (input.notes !== undefined) memoryInteractions[idx].notes = input.notes?.trim() || null;
      if (input.status !== undefined) memoryInteractions[idx].status = input.status;
      if (input.follow_up_date !== undefined) memoryInteractions[idx].follow_up_date = input.follow_up_date || null;
      return memoryInteractions[idx];
    }

    return null;
  }

  async deleteOne(interactionId: number, customerId: number): Promise<boolean> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `DELETE FROM customer_interactions WHERE id = $1 AND customer_id = $2;`;
        await query(sql, [interactionId, customerId]);
        return true;
      } catch (err) {
        // Fallback to memory
      }
    }

    const idx = memoryInteractions.findIndex(
      (i) => i.id === interactionId && i.customer_id === customerId
    );
    if (idx !== -1) {
      memoryInteractions.splice(idx, 1);
      return true;
    }
    return false;
  }

  async deleteAllByCustomer(customerId: number): Promise<number> {
    const { isConfigured } = validateDatabaseEnv();

    if (isConfigured) {
      try {
        const sql = `DELETE FROM customer_interactions WHERE customer_id = $1;`;
        const result = await query(sql, [customerId]);
        return result.rowCount || 0;
      } catch (err) {
        // Fallback to memory
      }
    }

    const before = memoryInteractions.length;
    const toRemove = memoryInteractions.filter((i) => i.customer_id === customerId);
    toRemove.forEach((item) => {
      const idx = memoryInteractions.indexOf(item);
      if (idx !== -1) memoryInteractions.splice(idx, 1);
    });
    return before - memoryInteractions.length;
  }
}

export const interactionRepository = new InteractionRepository();
