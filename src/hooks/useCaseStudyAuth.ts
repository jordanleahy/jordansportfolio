import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const useCaseStudyAuth = () => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const navigate = useNavigate();

  const isAuthenticated = useCallback(() => {
    return sessionStorage.getItem('caseStudyAuth') === 'true';
  }, []);

  const handleCaseStudyNavigation = useCallback((path: string) => {
    if (isAuthenticated()) {
      navigate(path);
    } else {
      setPendingNavigation(path);
      setShowPasswordModal(true);
    }
  }, [isAuthenticated, navigate]);

  const handleAuthentication = useCallback(() => {
    setShowPasswordModal(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  }, [navigate, pendingNavigation]);

  const handleCloseModal = useCallback(() => {
    setShowPasswordModal(false);
    setPendingNavigation(null);
  }, []);

  return {
    showPasswordModal,
    handleCaseStudyNavigation,
    handleAuthentication,
    handleCloseModal,
    isAuthenticated: isAuthenticated()
  };
};