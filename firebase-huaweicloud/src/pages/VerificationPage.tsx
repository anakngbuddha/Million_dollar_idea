import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyEmailAfterLink, resendVerificationLink, getCurrentUser } from '../services/authService';
import { Mail, CheckCircle, RotateCcw, AlertCircle, Lock } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export const VerificationPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const user = getCurrentUser();
    if (user?.email) {
      setEmail(user.email);
    }
  }, []);

  const handleCheckVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await verifyEmailAfterLink();
      setSuccess('Email verified successfully! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification check failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendLink = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await resendVerificationLink();
      setSuccess('New verification link sent to your email! Check your inbox.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend link';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-2xl shadow-lg">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Verify Your Email
          </h1>
          <p className="text-slate-600 text-sm">
            A verification link has been sent to your email
          </p>
        </div>

        {/* Card */}
        <Card className="p-6 md:p-8">
          {/* Email Display */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <p className="text-blue-900 font-semibold break-all text-sm">{email}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg text-sm font-medium flex gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 text-green-700 rounded-lg text-sm font-medium flex gap-3 animate-fade-in">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              What to do next:
            </h3>
            <ol className="space-y-2">
              <li className="text-sm text-slate-700 flex gap-3">
                <span className="font-semibold text-blue-600 min-w-fit">1.</span>
                <span>Check your email inbox and spam folder</span>
              </li>
              <li className="text-sm text-slate-700 flex gap-3">
                <span className="font-semibold text-blue-600 min-w-fit">2.</span>
                <span>Click the "Verify Email" link in the email</span>
              </li>
              <li className="text-sm text-slate-700 flex gap-3">
                <span className="font-semibold text-blue-600 min-w-fit">3.</span>
                <span>You'll be redirected back automatically</span>
              </li>
              <li className="text-sm text-slate-700 flex gap-3">
                <span className="font-semibold text-blue-600 min-w-fit">4.</span>
                <span>Click the button below to confirm verification</span>
              </li>
            </ol>
          </div>

          {/* Check Verification Button */}
          <form onSubmit={handleCheckVerification} className="mb-4">
            <Button
              type="submit"
              disabled={loading}
              isLoading={loading}
              size="md"
              className="w-full"
              icon={<CheckCircle className="w-5 h-5" />}
            >
              I Have Verified My Email
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="px-3 text-slate-500 text-xs font-semibold uppercase">Or</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Resend Button */}
          <Button
            onClick={handleResendLink}
            disabled={loading}
            variant="outline"
            size="md"
            className="w-full"
            icon={<RotateCcw className="w-5 h-5" />}
          >
            Resend Verification Link
          </Button>

          {/* Info Section */}
          <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">Why verify your email?</h4>
              <ul className="space-y-1 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">✓</span>
                  <span>Confirm you own this email address</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">✓</span>
                  <span>Secure your account from unauthorized access</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">✓</span>
                  <span>Receive important account notifications</span>
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-900">
                <span className="font-bold">💡 Tip:</span> The verification link may take a few seconds to arrive. Check your spam/promotions folder if you don't see it in your inbox.
              </p>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-slate-400 text-xs mt-8 font-medium">
          © 2024 {import.meta.env.VITE_APP_NAME}. All rights reserved.
        </p>
      </div>
    </div>
  );
};
