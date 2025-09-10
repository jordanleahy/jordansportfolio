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
    const access = checkAccess();
    if (!access) {
      setShowPasswordModal(true);
    }
  }, [checkAccess]);

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

  // For non-authenticated users, check access and show modal if needed
  if (!user) {
    return (
      <CofactorPasswordModal
        isOpen={showPasswordModal}
        onClose={handleCloseModal}
        onAuthenticate={handleAuthentication}
      />
    );
  }

  // If has access (authenticated or not), render the cofactor content
  if (hasAccess) {
    return <>{children}</>;
  }

  // Show password modal for users without access
  return (
    <CofactorPasswordModal
      isOpen={showPasswordModal}
      onClose={handleCloseModal}
      onAuthenticate={handleAuthentication}
    />
  );
};