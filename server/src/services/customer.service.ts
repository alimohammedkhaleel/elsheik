import { customerRepository } from '../repositories/customer.repository';
import { auditService } from './audit.service';
import { AppError } from '../middleware/errorHandler';
import {
  Customer,
  CustomerAssignmentRecord,
  AssignCustomerInput,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerFilterOptions,
} from '../types/customer.types';
import { UserRole } from '../types/user.types';

export class CustomerService {
  async getCustomers(
    options?: CustomerFilterOptions,
    actor?: { role: UserRole; userId: number }
  ): Promise<{ data: Customer[]; total: number }> {
    return customerRepository.findAll(options, actor);
  }

  async getCustomerById(id: number, actor?: { role: UserRole; userId: number }): Promise<Customer> {
    const customer = await customerRepository.findById(id, actor);
    if (!customer) {
      throw new AppError('العميل غير موجود أو ليس لديك صلاحية الوصول إليه', 404, 'CUSTOMER_NOT_FOUND');
    }
    return customer;
  }

  async createCustomer(input: CreateCustomerInput, actorId: number): Promise<Customer> {
    if (!input.name || !input.name.trim()) {
      throw new AppError('يرجى إدخال اسم العميل', 400, 'VALIDATION_ERROR');
    }

    if (input.customer_code) {
      const existing = await customerRepository.findByCode(input.customer_code.trim());
      if (existing) {
        throw new AppError('كود العميل مستخدم بالفعل، يرجى اختيار كود آخر', 400, 'DUPLICATE_CUSTOMER_CODE');
      }
    }

    const created = await customerRepository.create(input, actorId);

    await auditService.record({
      user_id: actorId,
      action: 'CUSTOMER_CREATED',
      entity_type: 'CUSTOMER',
      entity_id: created.id,
      new_values: {
        customer_code: created.customer_code,
        name: created.name,
        payment_type: created.payment_type,
        assigned_employee_id: created.assigned_employee_id,
      },
    });

    return created;
  }

  async updateCustomer(id: number, input: UpdateCustomerInput, actorId: number): Promise<Customer> {
    const existing = await customerRepository.findById(id);
    if (!existing) {
      throw new AppError('العميل غير موجود', 404, 'CUSTOMER_NOT_FOUND');
    }

    const updated = await customerRepository.update(id, input);
    if (!updated) {
      throw new AppError('فشل تحديث بيانات العميل', 500, 'UPDATE_FAILED');
    }

    await auditService.record({
      user_id: actorId,
      action: 'CUSTOMER_UPDATED',
      entity_type: 'CUSTOMER',
      entity_id: id,
      old_values: { name: existing.name, payment_type: existing.payment_type },
      new_values: { ...input },
    });

    return updated;
  }

  async assignCustomer(
    customerId: number,
    input: AssignCustomerInput,
    adminId: number
  ): Promise<{ customer: Customer; assignment: CustomerAssignmentRecord }> {
    const result = await customerRepository.assignEmployee(
      customerId,
      input.employee_id,
      adminId,
      input.reason,
      input.assignment_type || 'SALES_REP'
    );

    if (!result) {
      throw new AppError('فشل تعيين الموظف للعميل', 500, 'ASSIGNMENT_FAILED');
    }

    await auditService.record({
      user_id: adminId,
      action: 'CUSTOMER_ASSIGNMENT_CHANGED',
      entity_type: 'CUSTOMER',
      entity_id: customerId,
      old_values: { previous_employee_id: result.assignment.previous_employee_id },
      new_values: {
        new_employee_id: input.employee_id,
        assignment_type: input.assignment_type || 'SALES_REP',
        reason: input.reason,
      },
    });

    return result;
  }


  async getAssignmentHistory(customerId?: number): Promise<CustomerAssignmentRecord[]> {
    return customerRepository.getAssignmentHistory(customerId);
  }

  async deleteCustomer(id: number, adminId?: number): Promise<boolean> {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      throw new AppError('العميل غير موجود', 404, 'CUSTOMER_NOT_FOUND');
    }

    const deleted = await customerRepository.delete(id);
    if (!deleted) {
      throw new AppError('فشل حذف العميل من المنظومة', 500, 'DELETE_FAILED');
    }

    await auditService.record({
      user_id: adminId || null,
      action: 'CUSTOMER_DELETED',
      entity_type: 'CUSTOMER',
      entity_id: id,
      old_values: { name: customer.name, code: customer.customer_code },
    });

    return true;
  }

  async resetAllBalances(): Promise<{ updated: number }> {
    const result = await customerRepository.resetAllBalances();

    await auditService.record({
      user_id: 1,
      action: 'CUSTOMER_UPDATED',
      entity_type: 'CUSTOMER',
      entity_id: 0,
      new_values: { action: 'RESET_ALL_BALANCES', affected_rows: result.updated },
    });

    return result;
  }
}

export const customerService = new CustomerService();
