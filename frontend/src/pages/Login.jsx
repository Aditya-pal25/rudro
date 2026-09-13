import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  ArrowRight,
  Mail,
  CheckCircle,
  Loader2,
  RefreshCw,
  Shield,
  LockKeyhole,
  KeyRound
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import OTPInput from '../components/auth/OTPInput';

const STEPS = {
  CREDS: 1,
  OTP: 2,
  FORGOT_EMAIL: 3,
  FORGOT_OTP: 4,
  RESET_PASSWORD: 5
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const { setAuth, isAuthenticated } = useAuthStore();

  const [step, setStep] = useState(STEPS.CREDS);

  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const [forgotEmail, setForgotEmail] = useState('');

  const [showPass, setShowPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    if (timer <= 0) return;

    const t = setInterval(() => {
      setTimer(v => v - 1);
    }, 1000);

    return () => clearInterval(t);
  }, [timer]);

  // =========================================================
  // NORMAL LOGIN
  // =========================================================

  const sendOTP = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      toast.error('Enter email and password');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/login/send-otp', form);

      setStep(STEPS.OTP);
      setTimer(60);
      setOtp('');

      toast.success(`OTP sent to ${form.email}!`);
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Login failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Enter all 6 digits');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post(
        '/auth/login/verify-otp',
        {
          email: form.email,
          otp
        }
      );

      setAuth(data.user, data.token);

      toast.success(
        `Welcome back, ${data.user.name.split(' ')[0]}! 🔥`
      );

      navigate(from, { replace: true });
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Invalid OTP'
      );

      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    if (timer > 0) return;

    setLoading(true);

    try {
      await api.post('/auth/resend-otp', {
        email: form.email,
        type: 'login'
      });

      setTimer(60);
      setOtp('');

      toast.success('New OTP sent!');
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to resend'
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FORGOT PASSWORD
  // =========================================================

  const openForgotPassword = () => {
  setForgotEmail(form.email || '');
  setOtp('');
  setTimer(0);
  setNewPassword('');
  setConfirmPassword('');
  setResetToken('');
  setStep(STEPS.FORGOT_EMAIL);
};

  const sendForgotPasswordOTP = async (e) => {
    e.preventDefault();

    if (!forgotEmail) {
      toast.error('Enter your email address');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/forgot-password/send-otp', {
        email: forgotEmail
      });

      setStep(STEPS.FORGOT_OTP);
      setTimer(60);
      setOtp('');

      toast.success('Password reset OTP sent!');
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        'Unable to send password reset OTP'
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyForgotPasswordOTP = async () => {
  if (otp.length !== 6) {
    toast.error('Enter all 6 digits');
    return;
  }

  setLoading(true);

  try {
    const { data } = await api.post(
      '/auth/forgot-password/verify-otp',
      {
        email: forgotEmail,
        otp
      }
    );

    // Store the one-time reset authorization token
    setResetToken(data.resetToken);

    setStep(STEPS.RESET_PASSWORD);
    setOtp('');

    toast.success('OTP verified. Create your new password.');
  } catch (err) {
    toast.error(
      err.response?.data?.message || 'Invalid or expired OTP'
    );

    setOtp('');
  } finally {
    setLoading(false);
  }
};

  const resendForgotPasswordOTP = async () => {
    if (timer > 0) return;

    setLoading(true);

    try {
      await api.post('/auth/forgot-password/send-otp', {
        email: forgotEmail
      });

      setTimer(60);
      setOtp('');

      toast.success('New OTP sent!');
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        'Failed to resend OTP'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error('Enter both password fields');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/forgot-password/reset', {
  email: forgotEmail,
  password: newPassword,
  confirmPassword,
  resetToken
});

      toast.success(
        'Password changed successfully! You can now login.'
      );

      setForm({
        email: forgotEmail,
        password: ''
      });

      setForgotEmail('');
      setNewPassword('');
      setConfirmPassword('');
      setOtp('');
      setTimer(0);

      setStep(STEPS.CREDS);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        'Failed to reset password'
      );
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = () => {
    setStep(STEPS.CREDS);
    setOtp('');
    setTimer(0);
    setNewPassword('');
    setConfirmPassword('');
    setResetToken('');
  };

  return (
    <div className="min-h-screen bg-black flex">

      {/* LEFT IMAGE */}
      <div className="hidden lg:block flex-1 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200"
          alt=""
          className="w-full h-full object-cover opacity-30"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black" />

        <div className="absolute bottom-12 left-12">
          <span className="font-display text-7xl text-cream">
            RUDROHAM
          </span>

          <p className="text-muted mt-2 font-label tracking-wider">
            PREMIUM STREETWEAR
          </p>
        </div>
      </div>

      {/* RIGHT CONTENT */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          <Link
            to="/"
            className="font-display text-2xl text-cream block mb-10 lg:hidden"
          >
            RUDROHAM
          </Link>

          {/* =====================================================
              NORMAL LOGIN
          ====================================================== */}

          {step === STEPS.CREDS && (
            <>
              <div className="mb-8">
                <span className="section-label">
                  Welcome Back
                </span>

                <h1 className="font-display text-5xl text-cream">
                  LOGIN
                </h1>

                <p className="text-muted text-sm mt-2">
                  Enter credentials — an OTP will be sent to verify you
                </p>
              </div>

              <form
                onSubmit={sendOTP}
                className="space-y-4"
              >
                {/* EMAIL */}
                <div>
                  <label className="text-xs font-label font-semibold tracking-[0.15em] uppercase text-muted block mb-2">
                    Email
                  </label>

                  <input
                    type="email"
                    value={form.email}
                    onChange={e =>
                      setForm(f => ({
                        ...f,
                        email: e.target.value
                      }))
                    }
                    placeholder="you@example.com"
                    required
                    className="input-field"
                    autoComplete="email"
                  />
                </div>

                {/* PASSWORD */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-label font-semibold tracking-[0.15em] uppercase text-muted">
                      Password
                    </label>

                    <button
                      type="button"
                      onClick={openForgotPassword}
                      className="text-xs text-accent hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={e =>
                        setForm(f => ({
                          ...f,
                          password: e.target.value
                        }))
                      }
                      placeholder="Your password"
                      required
                      className="input-field pr-10"
                      autoComplete="current-password"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-cream transition-colors"
                    >
                      {showPass ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* SECURITY MESSAGE */}
                <div className="flex items-center gap-2 p-3 bg-surface2 border border-border">
                  <Shield
                    size={14}
                    className="text-accent flex-shrink-0"
                  />

                  <p className="text-xs text-muted">
                    An OTP will be sent to your email for secure login
                  </p>
                </div>

                {/* LOGIN BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3.5"
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Mail size={16} />
                      Send OTP
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-muted text-sm mt-8">
                New here?{' '}
                <Link
                  to="/register"
                  className="text-accent hover:underline"
                >
                  Create account
                </Link>
              </p>
            </>
          )}

          {/* =====================================================
              NORMAL LOGIN OTP
          ====================================================== */}

          {step === STEPS.OTP && (
            <>
              <div className="mb-8">
                <span className="section-label">
                  Two-Factor Verification
                </span>

                <h1 className="font-display text-5xl text-cream">
                  ENTER OTP
                </h1>

                <div className="flex items-center gap-2 mt-3">
                  <Mail
                    size={14}
                    className="text-accent"
                  />

                  <p className="text-muted text-sm">
                    Code sent to{' '}
                    <span className="text-accent font-semibold">
                      {form.email}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <OTPInput
                  value={otp}
                  onChange={setOtp}
                  disabled={loading}
                />

                <button
                  onClick={verifyOTP}
                  disabled={loading || otp.length < 6}
                  className="btn-primary w-full justify-center py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Verify & Login
                    </>
                  )}
                </button>

                <div className="text-center space-y-2">
                  <p className="text-muted text-xs">
                    Didn't receive it? Check your spam folder.
                  </p>

                  <button
                    onClick={resendOTP}
                    disabled={timer > 0 || loading}
                    className="flex items-center gap-1.5 text-sm mx-auto text-accent hover:text-accent-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <RefreshCw size={13} />

                    {timer > 0
                      ? `Resend in ${timer}s`
                      : 'Resend OTP'}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setStep(STEPS.CREDS);
                    setOtp('');
                  }}
                  className="w-full text-center text-xs text-muted hover:text-cream transition-colors"
                >
                  ← Back to login
                </button>
              </div>
            </>
          )}

          {/* =====================================================
              FORGOT PASSWORD — EMAIL
          ====================================================== */}

          {step === STEPS.FORGOT_EMAIL && (
            <>
              <div className="mb-8">
                <span className="section-label">
                  Account Recovery
                </span>

                <h1 className="font-display text-5xl text-cream">
                  FORGOT PASSWORD
                </h1>

                <p className="text-muted text-sm mt-2">
                  Enter your registered email and we'll send you
                  a verification code.
                </p>
              </div>

              <form
                onSubmit={sendForgotPasswordOTP}
                className="space-y-5"
              >
                <div>
                  <label className="text-xs font-label font-semibold tracking-[0.15em] uppercase text-muted block mb-2">
                    Registered Email
                  </label>

                  <div className="relative">
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={e =>
                        setForgotEmail(e.target.value)
                      }
                      placeholder="you@example.com"
                      required
                      className="input-field pr-10"
                      autoComplete="email"
                    />

                    <Mail
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-surface2 border border-border">
                  <Shield
                    size={14}
                    className="text-accent flex-shrink-0"
                  />

                  <p className="text-xs text-muted">
                    We'll verify your identity using a one-time
                    password sent to your email.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3.5"
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Mail size={16} />
                      Send Reset OTP
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={backToLogin}
                  className="w-full text-center text-xs text-muted hover:text-cream transition-colors"
                >
                  ← Back to login
                </button>
              </form>
            </>
          )}

          {/* =====================================================
              FORGOT PASSWORD — OTP
          ====================================================== */}

          {step === STEPS.FORGOT_OTP && (
            <>
              <div className="mb-8">
                <span className="section-label">
                  Account Recovery
                </span>

                <h1 className="font-display text-5xl text-cream">
                  VERIFY OTP
                </h1>

                <div className="flex items-center gap-2 mt-3">
                  <Mail
                    size={14}
                    className="text-accent"
                  />

                  <p className="text-muted text-sm">
                    Code sent to{' '}
                    <span className="text-accent font-semibold">
                      {forgotEmail}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <OTPInput
                  value={otp}
                  onChange={setOtp}
                  disabled={loading}
                />

                <button
                  onClick={verifyForgotPasswordOTP}
                  disabled={loading || otp.length < 6}
                  className="btn-primary w-full justify-center py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Verify OTP
                    </>
                  )}
                </button>

                <div className="text-center space-y-2">
                  <p className="text-muted text-xs">
                    Didn't receive it? Check your spam folder.
                  </p>

                  <button
                    onClick={resendForgotPasswordOTP}
                    disabled={timer > 0 || loading}
                    className="flex items-center gap-1.5 text-sm mx-auto text-accent hover:text-accent-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <RefreshCw size={13} />

                    {timer > 0
                      ? `Resend in ${timer}s`
                      : 'Resend OTP'}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setStep(STEPS.FORGOT_EMAIL);
                    setOtp('');
                  }}
                  className="w-full text-center text-xs text-muted hover:text-cream transition-colors"
                >
                  ← Change email
                </button>
              </div>
            </>
          )}

          {/* =====================================================
              FORGOT PASSWORD — NEW PASSWORD
          ====================================================== */}

          {step === STEPS.RESET_PASSWORD && (
            <>
              <div className="mb-8">
                <span className="section-label">
                  Account Recovery
                </span>

                <h1 className="font-display text-5xl text-cream">
                  NEW PASSWORD
                </h1>

                <p className="text-muted text-sm mt-2">
                  Create a new password for your Rudroham account.
                </p>
              </div>

              <form
                onSubmit={resetPassword}
                className="space-y-5"
              >
                {/* NEW PASSWORD */}
                <div>
                  <label className="text-xs font-label font-semibold tracking-[0.15em] uppercase text-muted block mb-2">
                    New Password
                  </label>

                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e =>
                        setNewPassword(e.target.value)
                      }
                      placeholder="Enter new password"
                      required
                      minLength={6}
                      className="input-field pr-10"
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowNewPass(v => !v)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-cream transition-colors"
                    >
                      {showNewPass ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* CONFIRM PASSWORD */}
                <div>
                  <label className="text-xs font-label font-semibold tracking-[0.15em] uppercase text-muted block mb-2">
                    Confirm Password
                  </label>

                  <div className="relative">
                    <input
                      type={
                        showConfirmPass
                          ? 'text'
                          : 'password'
                      }
                      value={confirmPassword}
                      onChange={e =>
                        setConfirmPassword(e.target.value)
                      }
                      placeholder="Confirm new password"
                      required
                      minLength={6}
                      className="input-field pr-10"
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPass(v => !v)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-cream transition-colors"
                    >
                      {showConfirmPass ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* PASSWORD REQUIREMENT */}
                <div className="flex items-center gap-2 p-3 bg-surface2 border border-border">
                  <LockKeyhole
                    size={14}
                    className="text-accent flex-shrink-0"
                  />

                  <p className="text-xs text-muted">
                    Password must be at least 6 characters long.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3.5"
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <KeyRound size={16} />
                      Change Password
                    </>
                  )}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>

  );
}
