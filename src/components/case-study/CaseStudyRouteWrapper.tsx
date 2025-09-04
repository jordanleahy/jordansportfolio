import React, { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { CaseStudyPasswordModal } from './CaseStudyPasswordModal';
import { useAuth } from '@/contexts/AuthContext';
import { useSecureAuth } from '@/hooks/useSecureAuth';

interface CaseStudyRouteWrapperProps {
  children: React.ReactNode;
}

export const CaseStudyRouteWrapper: React.FC<CaseStudyRouteWrapperProps> = ({ children }) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const { user, loading } = useAuth();
  const { hasAccess, checkAccess } = useSecureAuth('case_study');
  const location = useLocation();

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

  // Redirect to auth if not logged in
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If authenticated and has access, render the case study content
  if (hasAccess) {
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