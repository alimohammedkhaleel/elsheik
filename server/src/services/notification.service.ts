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

    // 2. Check for Overdue Invoices
    const invoicesRes = await invoiceRepository.findAll();
    const overdueInvoices = invoicesRes.data.filter((i) => i.payment_status === 'OVERDUE');
    if (overdueInvoices.length > 0) {
      const totalOverdue = overdueInvoices.reduce((acc, i) => acc + Number(i.total), 0);
      dynamicNotifications.push({
        id: idCounter++,
        title: 'فواتير متأخرة السداد',
        message: `تم رصد ${overdueInvoices.length} فاتورة متأخرة بإجمالي ${totalOverdue.toLocaleString()} ج.م تتطلب متابعة تحصيل.`,
        type: 'ALERT',
        link: '/invoices',
        is_read: readSet.has(1001),
        created_at: new Date(Date.now() - 3600000).toISOString(),
      });
    }

    // 3. Customers requiring follow-up (inactive or high balance)
    const customersRes = await customerRepository.findAll();
    const highBalanceCusts = customersRes.data.filter((c) => Number(c.current_balance || 0) > Number(c.credit_limit || 0) && Number(c.credit_limit || 0) > 0);
    if (highBalanceCusts.length > 0) {
      dynamicNotifications.push({
        id: idCounter++,
        title: 'تجاوز الحد الائتماني',
        message: `يوجد ${highBalanceCusts.length} عميل تجاوزوا سقف الحد الائتماني المسموح به.`,
        type: 'WARNING',
        link: '/customers',
        is_read: readSet.has(1002),
        created_at: new Date(Date.now() - 7200000).toISOString(),
      });
    }


    // 4. Combined with stored memory notifications
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
    readSet.add(1000);
    readSet.add(1001);
    readSet.add(1002);
    memoryNotifications.forEach((n) => (n.is_read = true));
  }
}

export const notificationService = new NotificationService();
