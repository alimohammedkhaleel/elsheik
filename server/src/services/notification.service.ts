import { query } from '../config/database';
import { validateDatabaseEnv } from '../config/env';
import { approvalRepository } from '../repositories/approval.repository';
import { invoiceRepository } from '../repositories/invoice.repository';
import { customerRepository } from '../repositories/customer.repository';
import { SystemNotification, NotificationType } from '../types/notification.types';
import { UserRole } from '../types/user.types';

const memoryNotifications: SystemNotification[] = [];
let readSet = new Set<number>();

export class NotificationService {
  async getNotifications(userId: number, role: UserRole): Promise<{ notifications: SystemNotification[]; unreadCount: number }> {
    const dynamicNotifications: SystemNotification[] = [];
    let idCounter = 1000;

    // 1. Check for Pending Approvals (for ADMIN / MANAGER)
    if (role === 'ADMIN' || role === 'MANAGER') {
      const pendingApprovals = await approvalRepository.findAll('PENDING');
      if (pendingApprovals.length > 0) {
        dynamicNotifications.push({
          id: idCounter++,
          title: 'طلبات اعتماد معلقة',
          message: `يوجد عدد ${pendingApprovals.length} طلب اعتماد جديد بانتظار مراجعتك الإدارية.`,
          type: 'WARNING',
          link: '/approvals',
          is_read: readSet.has(1000),
          created_at: new Date().toISOString(),
        });
      }
    }

    // 2. Check for Overdue Invoices — group per customer with direct links
    const invoicesRes = await invoiceRepository.findAll();
    const overdueInvoices = invoicesRes.data.filter((i) => i.payment_status === 'OVERDUE');
    if (overdueInvoices.length > 0) {
      const overdueByCustomer = overdueInvoices.reduce<Record<number, { name: string; code: string; count: number; total: number }>>((acc, inv) => {
        const cid = inv.customer_id;
        if (!acc[cid]) {
          acc[cid] = {
            name: (inv as any).customer_name || `عميل #${cid}`,
            code: (inv as any).customer_code || '',
            count: 0,
            total: 0,
          };
        }
        acc[cid].count++;
        acc[cid].total += Number(inv.total);
        return acc;
      }, {});

      Object.entries(overdueByCustomer).forEach(([cidStr, data], idx) => {
        const cid = parseInt(cidStr, 10);
        dynamicNotifications.push({
          id: idCounter++,
          title: `فواتير متأخرة — ${data.name}`,
          message: `العميل ${data.name}${data.code ? ` (${data.code})` : ''} لديه ${data.count} فاتورة متأخرة بإجمالي ${data.total.toLocaleString('ar-EG', { minimumFractionDigits: 0 })} ج.م`,
          type: 'ALERT',
          link: `/customers/${cid}`,
          is_read: readSet.has(1001 + idx),
          created_at: new Date(Date.now() - 3600000).toISOString(),
        });
      });
    }

    // 3. Customers with overdue balance based on payment terms
    const customersRes = await customerRepository.findAll();
    const overdueCustomers = customersRes.data.filter((c) => {
      if ((Number(c.current_balance) || 0) <= 0 || !c.last_order_date) return false;
      const daysSinceOrder = Math.floor((Date.now() - new Date(c.last_order_date).getTime()) / 86400000);
      return daysSinceOrder > (c.payment_terms_days || 30);
    });

    overdueCustomers.slice(0, 5).forEach((c, idx) => {
      const daysSinceOrder = Math.floor((Date.now() - new Date(c.last_order_date!).getTime()) / 86400000);
      const daysLate = Math.max(0, daysSinceOrder - (c.payment_terms_days || 30));
      dynamicNotifications.push({
        id: idCounter++,
        title: `تأخير في السداد — ${c.name}`,
        message: `العميل ${c.name} (${c.customer_code}) متأخر عن سداد رصيد ${Number(c.current_balance).toLocaleString('ar-EG', { minimumFractionDigits: 0 })} ج.م منذ ${daysLate} يوم.`,
        type: 'ALERT',
        link: `/customers/${c.id}`,
        is_read: readSet.has(1020 + idx),
        created_at: new Date(Date.now() - 5400000).toISOString(),
      });
    });

    // 4. Customers exceeding credit limit — one notification per customer with direct link
    const highBalanceCusts = customersRes.data.filter(
      (c) => Number(c.current_balance || 0) > Number(c.credit_limit || 0) && Number(c.credit_limit || 0) > 0
    );
    if (highBalanceCusts.length > 0) {
      const displayCusts = highBalanceCusts.slice(0, 5);
      displayCusts.forEach((c, idx) => {
        const excess = Number(c.current_balance || 0) - Number(c.credit_limit || 0);
        dynamicNotifications.push({
          id: idCounter++,
          title: `تجاوز الحد الائتماني — ${c.name}`,
          message: `العميل ${c.name} (${c.customer_code}) تجاوز حده الائتماني بمقدار ${excess.toLocaleString('ar-EG', { minimumFractionDigits: 0 })} ج.م (الرصيد: ${Number(c.current_balance).toLocaleString('ar-EG')} / الحد: ${Number(c.credit_limit).toLocaleString('ar-EG')})`,
          type: 'WARNING',
          link: `/customers/${c.id}`,
          is_read: readSet.has(1002 + idx),
          created_at: new Date(Date.now() - 7200000).toISOString(),
        });
      });
    }

    // Combined with stored memory notifications
    const all = [...dynamicNotifications, ...memoryNotifications];
    const unreadCount = all.filter((n) => !n.is_read).length;

    return {
      notifications: all,
      unreadCount,
    };
  }

  async markAsRead(notificationId: number): Promise<void> {
    readSet.add(notificationId);
    const found = memoryNotifications.find((n) => n.id === notificationId);
    if (found) {
      found.is_read = true;
    }
  }

  async markAllAsRead(): Promise<void> {
    for (let i = 1000; i < 1100; i++) {
      readSet.add(i);
    }
    memoryNotifications.forEach((n) => (n.is_read = true));
  }
}

export const notificationService = new NotificationService();
