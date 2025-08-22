import React, { useState } from 'react';
import { CofactorPasswordModal } from '../CofactorPasswordModal';

interface CofactorRouteWrapperProps {
  children: React.ReactNode;
}

export const CofactorRouteWrapper: React.FC<CofactorRouteWrapperProps> = ({ children }) => {
  // Initialize state based on current auth status
  const isAuth = sessionStorage.getItem('cofactorAuth') === 'true';
  const [isAuthenticated, setIsAuthenticated] = useState(isAuth);

  const handleAuthentication = () => {
    setIsAuthenticated(true);
  };

  const handleCloseModal = () => {
    // Redirect to home if user cancels
    window.history.back();
  };

  // If authenticated, render the cofactor proposal content
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Show password modal for unauthenticated users
  return (
    <CofactorPasswordModal
      isOpen={true}
      onClose={handleCloseModal}
      onAuthenticate={handleAuthentication}
    />
  );
};