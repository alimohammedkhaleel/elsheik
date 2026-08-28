export interface AuditLog {
  id: number;
  user_id?: number | null;
  user_name?: string | null;
  action: string;
  entity_type: string;
  entity_id?: number | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  ip_address?: string | null;
  created_at: string;
}

export interface CreateAuditLogInput {
  user_id?: number | null;
  action: string;
  entity_type: string;
  entity_id?: number | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  ip_address?: string | null;
}
