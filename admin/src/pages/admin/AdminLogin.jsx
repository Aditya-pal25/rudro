import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, ArrowRight, Lock, Mail, Loader2, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import OTPInput from '../../components/auth/OTPInput';

const STEPS = { CREDS: 1, OTP: 2 };

export default function AdminLogin() {
  const [step, setStep] = useState(STEPS.CREDS);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const navigate = useNavigate();
  const { setAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setInterval(() => setTimer((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [timer]);

  // Step 1: Send credentials and request 6-digit email OTP
  const sendOTP = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) {
      toast.error('Email and password are required');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/login/send-otp', form);
      setStep(STEPS.OTP);
      setTimer(60);
      toast.success(`OTP sent to ${form.email}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 6-digit OTP and set admin auth
  const verifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Enter all 6 digits');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login/verify-otp', {
        email: form.email,
        otp,
      });
      const adminUser = data.admin || data.user;
      if (adminUser?.role !== 'admin') {
        toast.error('Access denied. Admins only.');
        setLoading(false);
        return;
      }
      setAuth(adminUser, data.token);
      toast.success('Welcome to Admin Panel!');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP with 60s countdown cooldown
  const resendOTP = async () => {
    if (timer > 0) return;
    setLoading(true);
    try {
      await api.post('/auth/resend-otp', { email: form.email, type: 'login' });
      setTimer(60);
      setOtp('');
      toast.success('New OTP sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden bg-surface border-r border-border">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(#E8351A 1px,transparent 1px),linear-gradient(90deg,#E8351A 1px,transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-display text-2xl text-cream">RUDROHAM</span>
          </div>
          <div>
            <p className="font-label text-xs tracking-[0.3em] text-accent uppercase mb-4">
              Admin Control Center
            </p>
            <h2 className="font-display text-6xl text-cream leading-none mb-6">
              SECURE<br />ADMIN<br /><span className="text-accent">PORTAL</span>
            </h2>
            <div className="p-4 border border-accent/20 bg-accent/5">
              <p className="text-xs font-label text-accent uppercase tracking-wider mb-1">
                🔒 Two-Factor Authentication
              </p>
              <p className="text-xs text-muted">
                Password + Email OTP required for every login. OTP is generated and delivered securely via Nodemailer.
              </p>
            </div>
          </div>
          <p className="text-muted text-xs">© 2026 Rudroham. Restricted access.</p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm">
          <div className="w-14 h-14 bg-accent/10 border border-accent/30 flex items-center justify-center mb-8">
            <Lock size={24} className="text-accent" />
          </div>

          {step === STEPS.CREDS && (
            <>
              <span className="section-label">Restricted Area</span>
              <h1 className="font-display text-5xl text-cream mb-2">ADMIN LOGIN</h1>
              <p className="text-muted text-sm mb-8">Enter credentials — OTP will follow</p>
              <form onSubmit={sendOTP} className="space-y-4">
                <div>
                  <label className="text-xs font-label font-semibold tracking-[0.15em] uppercase text-muted block mb-2">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="admin@rudroham.com"
                    required
                    className="input-field"
                    autoComplete="username"
                  />
                </div>
                <div>
                  <label className="text-xs font-label font-semibold tracking-[0.15em] uppercase text-muted block mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••"
                      required
                      className="input-field pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-cream"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3.5 mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Sending OTP...
                    </>
                  ) : (
                    <>
                      <Mail size={16} /> Send OTP <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {step === STEPS.OTP && (
            <>
              <span className="section-label">Two-Factor Verification</span>
              <h1 className="font-display text-5xl text-cream mb-2">ENTER OTP</h1>
              <div className="flex items-center gap-2 mb-8">
                <Mail size={14} className="text-accent" />
                <p className="text-muted text-sm">
                  Code sent to <span className="text-accent font-semibold">{form.email}</span>
                </p>
              </div>
              <div className="space-y-6">
                <OTPInput value={otp} onChange={setOtp} disabled={loading} />
                <button
                  onClick={verifyOTP}
                  disabled={loading || otp.length < 6}
                  className="btn-primary w-full justify-center py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>
                      <Shield size={16} /> Enter Admin Panel
                    </>
                  )}
                </button>
                <div className="text-center space-y-2">
                  <p className="text-muted text-xs">Didn't get it? Check spam folder.</p>
                  <button
                    onClick={resendOTP}
                    disabled={timer > 0 || loading}
                    className="flex items-center gap-1.5 text-sm mx-auto text-accent disabled:opacity-40 disabled:cursor-not-allowed hover:text-accent-dark transition-colors"
                  >
                    <RefreshCw size={13} />
                    {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                  </button>
                </div>
                <button
                  onClick={() => {
                    setStep(STEPS.CREDS);
                    setOtp('');
                  }}
                  className="w-full text-center text-xs text-muted hover:text-cream transition-colors"
                >
                  ← Back
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}