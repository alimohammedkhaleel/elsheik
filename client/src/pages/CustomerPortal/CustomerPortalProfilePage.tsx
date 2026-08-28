import React, { useEffect, useState } from 'react';
import { customerPortalService, CustomerPortalProfile } from '../../services/api/customerPortalService';

export const CustomerPortalProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<CustomerPortalProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile Form state
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [address, setAddress] = useState('');
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await customerPortalService.getProfile();
      setProfile(data);
      setPhone(data.phone || '');
      setSecondaryPhone(data.secondaryPhone || '');
      setAddress(data.address || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setProfileMessage(null);
      await customerPortalService.updateProfile({ phone, secondaryPhone, address });
      setProfileMessage({ type: 'success', text: 'تم حفظ وتحديث بيانات الاتصال بنجاح' });
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'فشل تحديث البيانات' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'كلمة المرور الجديدة وتأكيدها غير متطابقين' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'يجب ألا تقل كلمة المرور عن 6 أحرف' });
      return;
    }

    try {
      setSavingPassword(true);
      setPasswordMessage(null);
      await customerPortalService.changePassword(currentPassword, newPassword);
      setPasswordMessage({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || 'فشل تغيير كلمة المرور' });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="portal-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: '#64748b' }}>جاري تحميل الملف التعريفي...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
      {/* Contact Profile Form */}
      <div className="portal-card">
        <div className="portal-card-header">
          <h2 className="portal-card-title">بيانات الاتصال والموقع</h2>
        </div>

        {profileMessage && (
          <div className={`portal-alert ${profileMessage.type === 'success' ? 'portal-alert-success' : 'portal-alert-error'}`}>
            <span>{profileMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit}>
          <div className="portal-form-group">
            <label className="portal-label">كود العميل (غير قابل للتعديل)</label>
            <input type="text" value={profile?.customerCode} disabled className="portal-input" />
          </div>

          <div className="portal-form-group">
            <label className="portal-label">اسم المنشأة / العميل</label>
            <input type="text" value={profile?.name} disabled className="portal-input" />
          </div>

          <div className="portal-form-group">
            <label className="portal-label">الاسم التجاري</label>
            <input type="text" value={profile?.tradeName || ''} disabled className="portal-input" />
          </div>

          <div className="portal-form-group">
            <label className="portal-label">رقم الهاتف الأساسي</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="portal-input"
              placeholder="01xxxxxxxxx"
            />
          </div>

          <div className="portal-form-group">
            <label className="portal-label">رقم هاتف إضافي / واتساب</label>
            <input
              type="text"
              value={secondaryPhone}
              onChange={(e) => setSecondaryPhone(e.target.value)}
              className="portal-input"
              placeholder="01xxxxxxxxx"
            />
          </div>

          <div className="portal-form-group">
            <label className="portal-label">عنوان الاستلام والتوصيل</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="portal-input"
              rows={3}
            />
          </div>

          <button type="submit" disabled={savingProfile} className="portal-btn portal-btn-primary" style={{ width: '100%' }}>
            {savingProfile ? 'جاري الحفظ...' : 'حفظ بيانات الاتصال'}
          </button>
        </form>
      </div>

      {/* Security & Password Form */}
      <div className="portal-card">
        <div className="portal-card-header">
          <h2 className="portal-card-title">أمان الحساب وتغيير كلمة المرور</h2>
        </div>

        {passwordMessage && (
          <div className={`portal-alert ${passwordMessage.type === 'success' ? 'portal-alert-success' : 'portal-alert-error'}`}>
            <span>{passwordMessage.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit}>
          <div className="portal-form-group">
            <label className="portal-label">اسم المستخدم للدخول</label>
            <input type="text" value={profile?.username} disabled className="portal-input" />
          </div>

          <div className="portal-form-group">
            <label className="portal-label">البريد الإلكتروني المرتبط</label>
            <input type="text" value={profile?.email} disabled className="portal-input" />
          </div>

          <div className="portal-form-group">
            <label className="portal-label">كلمة المرور الحالية</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="portal-input"
              required
            />
          </div>

          <div className="portal-form-group">
            <label className="portal-label">كلمة المرور الجديدة</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="portal-input"
              required
            />
          </div>

          <div className="portal-form-group">
            <label className="portal-label">تأكيد كلمة المرور الجديدة</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="portal-input"
              required
            />
          </div>

          <button type="submit" disabled={savingPassword} className="portal-btn portal-btn-primary" style={{ width: '100%', backgroundColor: '#0f172a' }}>
            {savingPassword ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
          </button>
        </form>
      </div>
    </div>
  );
};
