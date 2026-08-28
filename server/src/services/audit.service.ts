import { auditRepository } from '../repositories/audit.repository';
import { AuditLog, CreateAuditLogInput } from '../types/audit.types';

export class AuditService {
  async record(input: CreateAuditLogInput): Promise<AuditLog> {
    return auditRepository.log(input);
  }

  async getLogs(limit: number = 50): Promise<AuditLog[]> {
    return auditRepository.findAll(limit);
  }
}

export const auditService = new AuditService();
