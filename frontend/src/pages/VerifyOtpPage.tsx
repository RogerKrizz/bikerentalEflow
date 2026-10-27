import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { KeyRound, ArrowRight, RefreshCw } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';

export default function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState<string>(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/verify-otp', { email, otp });
      login(res.data.accessToken, res.data.refreshToken, res.data.user);
      navigate(res.data.user.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setSuccess(null);
    setResending(true);

    try {
      await apiClient.post('/auth/resend-otp', { email });
      setSuccess('A new verification OTP has been generated.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)]">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-full mb-3">
            <KeyRound size={32} />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-primary)]">Verify Email</h2>
          <p className="text-sm text-[var(--color-text-secondary)] text-center mt-1">
            Enter the 6-digit verification code sent to <br />
            <span className="font-semibold text-gray-800">{email || 'your email'}</span>
          </p>
          <div className="mt-2 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-[11px] font-semibold text-amber-800">
            Dev Mode Standard OTP: <span className="font-mono font-bold text-amber-900">123456</span>
          </div>
        </div>

        {error && <div className="mb-4"><ErrorMessage message={error} /></div>}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!location.state?.email && (
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">6-Digit Code</label>
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="input-field text-center text-2xl tracking-widest font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <LoadingSpinner size={20} /> : <><span>Verify Account</span> <ArrowRight size={18} /></>}
          </button>
        </form>

        <div className="mt-6 flex justify-between items-center text-sm">
          <button
            onClick={() => navigate('/login')}
            className="text-[var(--color-text-secondary)] hover:underline"
          >
            Back to Login
          </button>
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-[var(--color-primary)] font-medium flex items-center gap-1 hover:underline disabled:opacity-50"
          >
            <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
            Resend Code
          </button>
        </div>
      </div>
    </div>
  );
}
