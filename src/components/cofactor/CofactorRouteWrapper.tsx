import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { CofactorPasswordModal } from '@/components/CofactorPasswordModal';
import { useAuth } from '@/contexts/AuthContext';
import { useSecureAuth } from '@/hooks/useSecureAuth';

interface CofactorRouteWrapperProps {
  children: React.ReactNode;
}

export const CofactorRouteWrapper: React.FC<CofactorRouteWrapperProps> = ({ children }) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const { user, loading } = useAuth();
  const { hasAccess, checkAccess } = useSecureAuth('cofactor');

  useEffect(() => {
    if (user) {
      checkAccess().then(access => {
        if (!access) {
          setShowPasswordModal(true);
        }
      });
    }
  }, [user, checkAccess]);

  const handleAuthentication = () => {
    setShowPasswordModal(false);
  };

  const handleCloseModal = () => {
    setShowPasswordModal(false);
    // Redirect to home if user cancels
    window.history.back();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  // For non-authenticated users, show password modal immediately
  if (!user) {
    return (
      <CofactorPasswordModal
        isOpen={true}
        onClose={handleCloseModal}
        onAuthenticate={handleAuthentication}
      />
    );
  }

  // If authenticated and has access, render the cofactor content
  if (hasAccess) {
    return <>{children}</>;
  }

  // Show password modal for authenticated users without access
  return (
    <CofactorPasswordModal
      isOpen={showPasswordModal}
      onClose={handleCloseModal}
      onAuthenticate={handleAuthentication}
    />
  );
};