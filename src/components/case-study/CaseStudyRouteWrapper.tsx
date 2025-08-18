import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CaseStudyPasswordModal } from './CaseStudyPasswordModal';

interface CaseStudyRouteWrapperProps {
  children: React.ReactNode;
}

export const CaseStudyRouteWrapper: React.FC<CaseStudyRouteWrapperProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check if user is already authenticated for this session
    const isAuth = sessionStorage.getItem('caseStudyAuth') === 'true';
    
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

  // If authenticated, render the case study content
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Show password modal for unauthenticated users
  return (
    <CaseStudyPasswordModal
      isOpen={showPasswordModal}
      onClose={handleCloseModal}
      onAuthenticate={handleAuthentication}
    />
  );
};