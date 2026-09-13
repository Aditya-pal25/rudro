import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Mail, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import OTPInput from '../components/auth/OTPInput';

const STEPS = { DETAILS: 1, OTP: 2, SUCCESS: 3 };

export default function Register() {
  const navigate = useNavigate();
  const { setAuth, isAuthenticated } = useAuthStore();
  const [step, setStep]       = useState(STEPS.DETAILS);
  const [form, setForm]       = useState({ name: '', email: '', phone: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [otp, setOtp]         = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer]     = useState(0);
  const [errors, setErrors]   = useState({});

  useEffect(() => { if (isAuthenticated) navigate('/', { replace: true }); }, [isAuthenticated]);
  useEffect(() => { if (timer <= 0) return; const t = setInterval(() => setTimer(v => v - 1), 1000); return () => clearInterval(t); }, [timer]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const sendOTP = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/auth/register/send-otp', { name: form.name.trim(), email: form.email.toLowerCase().trim(), password: form.password, phone: form.phone || undefined });
      setStep(STEPS.OTP); setTimer(60);
      toast.success(`OTP sent to ${form.email}!`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send OTP'); }
    finally { setLoading(false); }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) { toast.error('Enter all 6 digits'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register/verify-otp', { email: form.email.toLowerCase().trim(), otp });
      setAuth(data.user, data.token);
      setStep(STEPS.SUCCESS);
      toast.success('Welcome to Rudroham! 🔥');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid OTP'); setOtp(''); }
    finally { setLoading(false); }
  };

  const resendOTP = async () => {
    if (timer > 0) return;
    setLoading(true);
    try { await api.post('/auth/resend-otp', { email: form.email, type: 'register' }); setTimer(60); setOtp(''); toast.success('New OTP sent!'); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to resend'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-black flex">
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200" alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black" />
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          <Link to="/" className="font-display text-3xl text-cream">RUDROHAM</Link>
          <div>
            <h2 className="font-display text-6xl text-cream leading-none mb-4">JOIN THE<br /><span className="text-accent">MOVEMENT</span></h2>
            <p className="text-muted text-sm max-w-xs leading-relaxed">Create your account and unlock exclusive drops, early access, and member-only deals.</p>
          </div>
          <p className="text-muted text-xs">© 2025 Rudroham</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="font-display text-2xl text-cream block mb-10 lg:hidden">RUDROHAM</Link>

          {step !== STEPS.SUCCESS && (
            <div className="flex items-center gap-2 mb-8">
              {[STEPS.DETAILS, STEPS.OTP].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= s ? 'bg-accent text-white' : 'bg-surface2 border border-border text-muted'}`}>
                    {step > s ? <CheckCircle size={12} /> : i + 1}
                  </div>
                  <span className={`text-xs font-label uppercase tracking-wider ${step >= s ? 'text-cream' : 'text-muted'}`}>{s === STEPS.DETAILS ? 'Details' : 'Verify'}</span>
                  {i < 1 && <div className={`w-8 h-px ${step > s ? 'bg-accent' : 'bg-border'}`} />}
                </div>
              ))}
            </div>
          )}

          {step === STEPS.DETAILS && (
            <>
              <div className="mb-8"><span className="section-label">Create Account</span><h1 className="font-display text-5xl text-cream">SIGN UP</h1><p className="text-muted text-sm mt-2">We'll send an OTP to verify your email</p></div>
              <form onSubmit={sendOTP} className="space-y-4">
                <div>
                  <label className="text-xs font-label font-semibold tracking-[0.15em] uppercase text-muted block mb-2">Full Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" className={`input-field ${errors.name ? 'border-accent' : ''}`} />
                  {errors.name && <p className="text-accent text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="text-xs font-label font-semibold tracking-[0.15em] uppercase text-muted block mb-2">Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" className={`input-field ${errors.email ? 'border-accent' : ''}`} />
                  {errors.email && <p className="text-accent text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="text-xs font-label font-semibold tracking-[0.15em] uppercase text-muted block mb-2">Phone (optional)</label>
                  <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="10-digit number" className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-label font-semibold tracking-[0.15em] uppercase text-muted block mb-2">Password *</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 6 characters" className={`input-field pr-10 ${errors.password ? 'border-accent' : ''}`} />
                    <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-cream transition-colors">{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                  {errors.password && <p className="text-accent text-xs mt-1">{errors.password}</p>}
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 mt-2">
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Sending OTP...</> : <><Mail size={16} /> Send OTP to Email <ArrowRight size={16} /></>}
                </button>
              </form>
              <p className="text-center text-muted text-sm mt-8">Already have an account? <Link to="/login" className="text-accent hover:underline">Login</Link></p>
            </>
          )}

          {step === STEPS.OTP && (
            <>
              <div className="mb-8"><span className="section-label">Email Verification</span><h1 className="font-display text-5xl text-cream">ENTER OTP</h1>
                <div className="flex items-center gap-2 mt-3"><Mail size={14} className="text-accent" /><p className="text-muted text-sm">Code sent to <span className="text-accent font-semibold">{form.email}</span></p></div>
              </div>
              <div className="space-y-6">
                <OTPInput value={otp} onChange={setOtp} disabled={loading} />
                <button onClick={verifyOTP} disabled={loading || otp.length < 6} className="btn-primary w-full justify-center py-3.5 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : <><CheckCircle size={16} /> Verify & Create Account</>}
                </button>
                <div className="text-center space-y-2">
                  <p className="text-muted text-xs">Didn't receive it? Check spam folder.</p>
                  <button onClick={resendOTP} disabled={timer > 0 || loading} className="flex items-center gap-1.5 text-sm mx-auto text-accent hover:text-accent-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    <RefreshCw size={13} />{timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                  </button>
                </div>
                <button onClick={() => { setStep(STEPS.DETAILS); setOtp(''); }} className="w-full text-center text-xs text-muted hover:text-cream transition-colors">← Change details</button>
              </div>
            </>
          )}

          {step === STEPS.SUCCESS && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-400/10 border border-green-400/30 flex items-center justify-center mx-auto mb-6"><CheckCircle size={40} className="text-green-400" /></div>
              <h1 className="font-display text-5xl text-cream mb-3">WELCOME!</h1>
              <p className="text-muted">Account created successfully.<br />Taking you to the store...</p>
              <div className="mt-6 w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
