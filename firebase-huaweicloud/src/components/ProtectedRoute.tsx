import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isUserVerified } from '../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const checkVerification = async () => {
      if (user) {
        const isVerified = await isUserVerified();
        setVerified(isVerified);
      }
    };

    checkVerification();
  }, [user]);

  if (loading || verified === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!verified) {
    return <Navigate to="/verify-email" replace />;
  }

  return <>{children}</>;
};
