import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error('Invalid password reset link.');
      return;
    }

    if (!password || !confirmPassword) {
      toast.error('Please enter both password fields.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await api.put(`/auth/reset-password/${token}`, {
        password
      });

      setSuccess(true);

      toast.success('Password changed successfully!');

      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        'This reset link is invalid or has expired.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">

          <CheckCircle
            size={52}
            className="text-accent mx-auto mb-6"
          />

          <span className="section-label">
            Account Recovery
          </span>

          <h1 className="font-display text-5xl text-cream mt-2">
            PASSWORD
            <br />
            UPDATED
          </h1>

          <p className="text-muted text-sm mt-4">
            Your password has been changed successfully.
            You can now login with your new password.
          </p>

          <Link
            to="/login"
            className="btn-primary w-full justify-center py-3.5 mt-8 inline-flex"
          >
            Continue to Login
          </Link>

        </div>
      </div>
    );
  }

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

          <div className="mb-8">

            <span className="section-label">
              Account Recovery
            </span>

            <h1 className="font-display text-5xl text-cream mt-1">
              RESET
              <br />
              PASSWORD
            </h1>

            <p className="text-muted text-sm mt-3">
              Create a new password for your Rudroham account.
            </p>

          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* NEW PASSWORD */}
            <div>

              <label className="text-xs font-label font-semibold tracking-[0.15em] uppercase text-muted block mb-2">
                New Password
              </label>

              <div className="relative">

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  minLength={6}
                  required
                  autoComplete="new-password"
                  className="input-field pr-10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-cream transition-colors"
                >
                  {showPassword ? (
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
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  minLength={6}
                  required
                  autoComplete="new-password"
                  className="input-field pr-10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((v) => !v)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-cream transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>

              </div>

            </div>

            {/* SECURITY MESSAGE */}
            <div className="flex items-center gap-2 p-3 bg-surface2 border border-border">

              <LockKeyhole
                size={14}
                className="text-accent flex-shrink-0"
              />

              <p className="text-xs text-muted">
                Password must be at least 6 characters long.
              </p>

            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >

              {loading ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                  Updating Password...
                </>
              ) : (
                <>
                  <LockKeyhole size={16} />
                  Update Password
                </>
              )}

            </button>

          </form>

          <Link
            to="/login"
            className="w-full text-center text-xs text-muted hover:text-cream transition-colors block mt-6"
          >
            ← Back to login
          </Link>

        </div>

      </div>

    </div>
  );
}