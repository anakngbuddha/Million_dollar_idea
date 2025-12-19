import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle, signUpWithEmail, signInWithEmail } from '../services/authService';
import { FirebaseError } from 'firebase/app';
import { Mail, Lock, User, LogIn, UserPlus, Eye, EyeOff, Chrome } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';

export const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      const firebaseError = err as FirebaseError;
      setError(firebaseError.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        if (!formData.displayName.trim()) {
          setError('Display name is required');
          setLoading(false);
          return;
        }
        await signUpWithEmail(formData.email, formData.password, formData.displayName);
        navigate('/verify-email');
      } else {
        await signInWithEmail(formData.email, formData.password);
        navigate('/dashboard');
      }
    } catch (err) {
      const firebaseError = err as FirebaseError;
      if (firebaseError.code === 'auth/email-already-in-use') {
        setError('Email already in use');
      } else if (firebaseError.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (firebaseError.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else if (firebaseError.code === 'auth/user-not-found') {
        setError('User not found. Please check your email or create a new account.');
      } else if (firebaseError.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (firebaseError.message === 'EMAIL_NOT_VERIFIED') {
        setError('Please verify your email first. Check your inbox for the verification link and try again.');
      } else {
        setError(firebaseError.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center p-4 relative z-0">
      {/* Subtle overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-slate-900/30 z-0" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Header Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex justify-center mb-4">
            <div className="bg-white/95 p-3 rounded-2xl shadow-lg backdrop-blur-sm">
              <LogIn className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            {import.meta.env.VITE_APP_NAME}
          </h1>
          <p className="text-slate-100 text-base font-medium">
            {isSignUp ? 'Create your account and get started today' : 'Welcome back, please sign in to continue'}
          </p>
        </div>

        {/* Card */}
        <Card className="p-6 md:p-8 bg-white/95 backdrop-blur-sm border border-white/20 shadow-xl">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 text-red-700 rounded-md text-sm font-medium flex gap-3 animate-fade-in">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign In Button */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            variant="outline"
            size="md"
            className="w-full mb-4"
            icon={<Chrome className="w-5 h-5" />}
          >
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="px-3 text-slate-500 text-xs font-semibold uppercase tracking-widest">Or continue with email</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {isSignUp && (
              <Input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                placeholder="John Doe"
                label="Full Name"
                icon={<User className="w-4 h-4" />}
                disabled={loading}
              />
            )}

            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your@email.com"
              label="Email Address"
              icon={<Mail className="w-4 h-4" />}
              disabled={loading}
            />

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                label="Password"
                icon={<Lock className="w-4 h-4" />}
                helper={isSignUp ? 'Minimum 6 characters' : ''}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-10 text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {isSignUp && (
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  label="Confirm Password"
                  icon={<Lock className="w-4 h-4" />}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-10 text-slate-400 hover:text-slate-600 transition"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              isLoading={loading}
              size="md"
              className="w-full mt-6"
              icon={isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-slate-600 text-sm mb-3">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </p>
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setFormData({
                  email: '',
                  password: '',
                  confirmPassword: '',
                  displayName: '',
                });
              }}
              className="text-blue-600 font-semibold hover:text-blue-700 transition inline-flex items-center gap-2"
            >
              {isSignUp ? (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In Instead
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </>
              )}
            </button>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-slate-200 text-xs mt-8 font-medium">
          © 2024 {import.meta.env.VITE_APP_NAME}. All rights reserved.
        </p>
      </div>
    </div>
  );
};
