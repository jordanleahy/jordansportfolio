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

  // For non-authenticated users, always show modal if no access
  if (!user) {
    return (
      <CaseStudyPasswordModal
        isOpen={!hasAccess}
        onClose={handleCloseModal}
        onAuthenticate={handleAuthentication}
      />
    );
  }

  // If has access (authenticated or not), render the case study content
  if (hasAccess) {
    return <>{children}</>;
  }

  // Show password modal for users without access
  return (
    <CaseStudyPasswordModal
      isOpen={showPasswordModal}
      onClose={handleCloseModal}
      onAuthenticate={handleAuthentication}
    />
  );
};