import React, { useState } from 'react';
import {
  Lock,
  User as UserIcon,
  Mail,
  Phone,
  Briefcase,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api/authService';
import { Logo } from '../../components/common/Logo/Logo';
import './LoginPage.css';

interface LoginPageProps {
  onBackToDashboard?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBackToDashboard }) => {
  const { login, register, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [fullName, setFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regJobTitle, setRegJobTitle] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Status & feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      setErrorMessage('يرجى إدخال اسم المستخدم أو البريد الإلكتروني');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('يرجى إدخال كلمة المرور');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const res = await login({ usernameOrEmail: loginIdentifier, password: loginPassword });
      if (res.success) {
        setSuccessMessage('تم تسجيل الدخول بنجاح! جاري تحويلك...');
        setTimeout(() => {
          if (onBackToDashboard) onBackToDashboard();
        }, 500);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('فشل تسجيل الدخول، يرجى التحقق من صحة البيانات والاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !regUsername.trim() || !regEmail.trim() || !regPassword) {
      setErrorMessage('يرجى ملء جميع الحقول الإلزامية المطلوبة');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('كلمة المرور يجب ألا تقل عن 6 أحرف');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('كلمتا المرور غير متطابقتين');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const res = await register({
        full_name: fullName,
        username: regUsername,
        email: regEmail,
        phone: regPhone,
        job_title: regJobTitle,
        password: regPassword,
      });

      if (res.success) {
        setSuccessMessage(res.message);
        // Clear fields
        setFullName('');
        setRegUsername('');
        setRegEmail('');
        setRegPhone('');
        setRegJobTitle('');
        setRegPassword('');
        setRegConfirmPassword('');
        // Switch back to login tab with success note
        setTimeout(() => {
          setActiveTab('login');
        }, 2500);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('حدث خطأ أثناء إرسال طلب التسجيل، يرجى المحاولة لاحقاً');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotStatus({ success: false, message: 'يرجى إدخال البريد الإلكتروني' });
      return;
    }
    try {
      const res = await authService.forgotPassword(forgotEmail.trim());
      setForgotStatus({ success: true, message: res.message });
    } catch {
      setForgotStatus({ success: false, message: 'تعذر إرسال الطلب في الوقت الحالي' });
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card-container">
        {/* Header & Brand Logo */}
        <div className="login-header">
          <Logo size="large" showText={true} />
          <h2 className="login-welcome-title">
            {activeTab === 'login' ? 'تسجيل الدخول للنظام' : 'طلب إنشاء حساب موظف جديد'}
          </h2>
          <p className="login-welcome-sub">
            {activeTab === 'login'
              ? 'مرحباً بك في النظام المركزي لإدارة ومتابعة العملاء والمبيعات'
              : 'قم بتسجيل بياناتك لتقديم طلب اعتماد حساب جديد لدى الإدارة'}
          </p>
        </div>

        {/* Auth Tabs */}
        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab-btn ${activeTab === 'login' ? 'login-tab-active' : ''}`}
            onClick={() => {
              setActiveTab('login');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
          >
            <LogIn size={16} />
            <span>تسجيل الدخول</span>
          </button>
          <button
            type="button"
            className={`login-tab-btn ${activeTab === 'register' ? 'login-tab-active' : ''}`}
            onClick={() => {
              setActiveTab('register');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
          >
            <UserPlus size={16} />
            <span>طلب حساب جديد</span>
          </button>
        </div>

        {/* Current Active Session Note */}
        {user && activeTab === 'login' && (
          <div className="login-active-banner">
            <div className="active-user-avatar">{user.full_name.charAt(0)}</div>
            <div className="active-user-info">
              <span className="active-user-label">أنت مسجل حالياً كـ:</span>
              <span className="active-user-name">
                {user.full_name} ({user.role})
              </span>
            </div>
            {onBackToDashboard && (
              <button onClick={onBackToDashboard} className="btn-gold-small">
                <span>الذهاب للوحة</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}

        {/* Error / Success Alerts */}
        {errorMessage && (
          <div className="login-alert-error" role="alert">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="login-alert-success" role="alert">
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="login-username">
                اسم المستخدم أو البريد الإلكتروني <span className="req-star">*</span>
              </label>
              <div className="form-input-wrapper">
                <UserIcon size={18} className="input-icon" />
                <input
                  id="login-username"
                  type="text"
                  className="form-input"
                  placeholder="مثال: admin أو admin@sheikh.com"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-with-action">
                <label className="form-label" htmlFor="login-password">
                  كلمة المرور <span className="req-star">*</span>
                </label>
                <button
                  type="button"
                  className="btn-forgot-password-link"
                  onClick={() => {
                    setIsForgotModalOpen(true);
                    setForgotStatus(null);
                  }}
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
              <div className="form-input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="login-password"
                  type={showLoginPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  aria-label={showLoginPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-gold login-submit-btn" disabled={isSubmitting}>
              <LogIn size={18} />
              <span>{isSubmitting ? 'جاري التحقق من الحساب...' : 'تسجيل الدخول'}</span>
            </button>
          </form>
        )}

        {/* 2. REGISTER FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-fullname">
                الاسم الكامل <span className="req-star">*</span>
              </label>
              <div className="form-input-wrapper">
                <UserIcon size={18} className="input-icon" />
                <input
                  id="reg-fullname"
                  type="text"
                  className="form-input"
                  placeholder="الاسم الثلاثي أو الرباعي"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-username">
                  اسم المستخدم <span className="req-star">*</span>
                </label>
                <div className="form-input-wrapper">
                  <UserIcon size={18} className="input-icon" />
                  <input
                    id="reg-username"
                    type="text"
                    className="form-input"
                    placeholder="username"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">
                  البريد الإلكتروني <span className="req-star">*</span>
                </label>
                <div className="form-input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    id="reg-email"
                    type="email"
                    className="form-input"
                    placeholder="name@sheikh.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-phone">
                  رقم الهاتف
                </label>
                <div className="form-input-wrapper">
                  <Phone size={18} className="input-icon" />
                  <input
                    id="reg-phone"
                    type="tel"
                    className="form-input"
                    placeholder="010XXXXXXXX"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-job">
                  الوظيفة / القسم
                </label>
                <div className="form-input-wrapper">
                  <Briefcase size={18} className="input-icon" />
                  <input
                    id="reg-job"
                    type="text"
                    className="form-input"
                    placeholder="مندوب مبيعات / محصل / موظف"
                    value={regJobTitle}
                    onChange={(e) => setRegJobTitle(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">
                  كلمة المرور <span className="req-star">*</span>
                </label>
                <div className="form-input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    id="reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    aria-label={showRegPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-confirm-password">
                  تأكيد كلمة المرور <span className="req-star">*</span>
                </label>
                <div className="form-input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    id="reg-confirm-password"
                    type={showRegPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="reg-info-notice">
              <HelpCircle size={16} />
              <span>
                ملاحظة: بعد تقديم الطلب، سيتم إرسال حسابك إلى مركز اعتمادات الإدارة للمراجعة وتحديد الصلاحيات قبل تفعيل الدخول.
              </span>
            </div>

            <button type="submit" className="btn-gold login-submit-btn" disabled={isSubmitting}>
              <UserPlus size={18} />
              <span>{isSubmitting ? 'جاري إرسال الطلب...' : 'إرسال طلب التسجيل'}</span>
            </button>
          </form>
        )}

        {/* Forgot Password Modal */}
        {isForgotModalOpen && (
          <div className="modal-overlay" onClick={() => setIsForgotModalOpen(false)}>
            <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">استعادة كلمة المرور</h3>
              <p className="modal-desc">
                أدخل بريدك الإلكتروني المسجل وسيقوم مسؤول النظام بمراجعة طلبك وإعادة تعيين كلمة المرور.
              </p>

              {forgotStatus && (
                <div className={forgotStatus.success ? 'login-alert-success' : 'login-alert-error'}>
                  {forgotStatus.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{forgotStatus.message}</span>
                </div>
              )}

              <form onSubmit={handleForgotPasswordSubmit} className="modal-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="forgot-email">
                    البريد الإلكتروني
                  </label>
                  <div className="form-input-wrapper">
                    <Mail size={18} className="input-icon" />
                    <input
                      id="forgot-email"
                      type="email"
                      className="form-input"
                      placeholder="name@sheikh.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="submit" className="btn-gold">
                    إرسال الطلب
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsForgotModalOpen(false)}
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
