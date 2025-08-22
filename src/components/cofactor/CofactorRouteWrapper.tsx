import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CofactorPasswordModal } from '../CofactorPasswordModal';

interface CofactorRouteWrapperProps {
  children: React.ReactNode;
}

export const CofactorRouteWrapper: React.FC<CofactorRouteWrapperProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check if user is already authenticated for this session
    const isAuth = sessionStorage.getItem('cofactorAuth') === 'true';
    
    if (isAuth) {
      setIsAuthenticated(true);
    } else {
      // Show password modal for unauthenticated users
      setShowPasswordModal(true);
    }
  }, [location.pathname]);

  const handleAuthentication = () => {
    setIsAuthenticated(true);
    setShowPasswordModal(false);
  };

  const handleCloseModal = () => {
    setShowPasswordModal(false);
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
      isOpen={showPasswordModal}
      onClose={handleCloseModal}
      onAuthenticate={handleAuthentication}
    />
  );
};