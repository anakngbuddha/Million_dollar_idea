import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  resetPassword,
} from '../services/authService';
import '../styles/LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Redirect to dashboard if already logged in
  if (user && !loading) {
    navigate('/dashboard');
    return null;
  }

  const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign up
        if (!displayName.trim()) {
          setError('Display name is required');
          setIsLoading(false);
          return;
        }
        await signUpWithEmail(email, password, displayName);
        setSuccess('✅ Sign up successful! Please check your email to verify your account.');
        setEmail('');
        setPassword('');
        setDisplayName('');
        setTimeout(() => {
          setIsSignUp(false);
          setSuccess('');
        }, 3000);
      } else {
        // Sign in
        await signInWithEmail(email, password);
        setSuccess('✅ Signed in successfully!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Authentication failed';
      if (errorMessage.includes('EMAIL_NOT_VERIFIED')) {
        setError('❌ Please verify your email first. Check your inbox for the verification link.');
      } else if (errorMessage.includes('user-not-found')) {
        setError('❌ Email not found. Please sign up first.');
      } else if (errorMessage.includes('wrong-password')) {
        setError('❌ Incorrect password.');
      } else if (errorMessage.includes('email-already-in-use')) {
        setError('❌ Email already in use. Please sign in or use a different email.');
      } else if (errorMessage.includes('weak-password')) {
        setError('❌ Password is too weak. Use at least 6 characters.');
      } else {
        setError(`❌ ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await signInWithGoogle();
      setSuccess('✅ Signed in with Google successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (err: any) {
      const errorMessage = err.message || 'Google sign-in failed';
      if (!errorMessage.includes('popup_closed_by_user')) {
        setError(`❌ ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await resetPassword(forgotEmail);
      setSuccess('✅ Password reset link sent to your email!');
      setResetSent(true);
      setForgotEmail('');
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetSent(false);
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send reset email';
      if (errorMessage.includes('user-not-found')) {
        setError('❌ Email not found.');
      } else {
        setError(`❌ ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="landing-container">
      {/* Header */}
      <header className="landing-header">
        <div className="header-content">
          <div className="logo">
            <h1>HUAWEI CLOUD</h1>
            <span className="logo-accent"></span>
          </div>
          <nav className="header-nav">
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="landing-main">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h2 className="hero-headline">Let's go beyond with HUAWEI CLOUD</h2>
            <p className="hero-subheadline">
             A personal Huawei Reviewer website.
            </p>
            
          </div>
        </section>

        {/* Login Section */}
        <section className="login-section">
          <div className="login-container">
            {/* Forgot Password Modal */}
            {showForgotPassword && (
              <div className="modal-overlay" onClick={() => setShowForgotPassword(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="modal-close"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    ✕
                  </button>
                  <h3>Reset Your Password</h3>
                  <p>Enter your email address to receive a password reset link.</p>
                  
                  {error && <div className="error-message">{error}</div>}
                  {success && <div className="success-message">{success}</div>}

                  {!resetSent ? (
                    <form onSubmit={handleResetPassword} className="login-form">
                      <div className="form-group">
                        <input
                          type="email"
                          placeholder="Enter your email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          required
                          className="form-input"
                        />
                      </div>
                      <button
                        type="submit"
                        className="btn-login"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                      </button>
                    </form>
                  ) : (
                    <p className="reset-sent-message">
                      ✅ Check your email for the password reset link!
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="login-header">
              <h3>{isSignUp ? 'Create Your Account' : 'Sign In to Your Account'}</h3>
              <p>
                {isSignUp
                  ? 'Join us today to get started'
                  : 'Access your dashboard and manage your data securely'}
              </p>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <form onSubmit={handleEmailAuth} className="login-form">
              {/* Display Name Input (Sign Up Only) */}
              {isSignUp && (
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Full name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required={isSignUp}
                    className="form-input"
                  />
                </div>
              )}

              {/* Email Input */}
              <div className="form-group">
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-input"
                />
              </div>

              {/* Password Input */}
              <div className="form-group">
                <div className="password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '✕' : '◉'}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot (Sign In Only) */}
              {!isSignUp && (
                <div className="form-options">
                  <label className="remember-checkbox">
                    <input type="checkbox" />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="forgot-link"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-login"
                disabled={isLoading}
              >
                {isLoading
                  ? 'Please wait...'
                  : isSignUp
                  ? 'Create Account'
                  : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="divider">
              <span>or continue with</span>
            </div>

            {/* Google Sign-In */}
            <button
              onClick={handleGoogleSignIn}
              className="btn-google"
              disabled={isLoading}
            >
              <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Google</span>
            </button>

            {/* Toggle Sign In / Sign Up */}
            <div className="signup-link">
              {isSignUp ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="toggle-auth-link"
                    onClick={() => {
                      setIsSignUp(false);
                      setError('');
                      setSuccess('');
                      setEmail('');
                      setPassword('');
                      setDisplayName('');
                    }}
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className="toggle-auth-link"
                    onClick={() => {
                      setIsSignUp(true);
                      setError('');
                      setSuccess('');
                      setEmail('');
                      setPassword('');
                      setDisplayName('');
                    }}
                  >
                    Create one
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; 2024 Firebase HuaweiCloud. All rights reserved.</p>
        <div className="footer-links">
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Service</a>
          <a href="#security">Security</a>
        </div>
      </footer>
    </div>
  );
}
