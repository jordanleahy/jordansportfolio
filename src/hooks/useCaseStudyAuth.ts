import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const useCaseStudyAuth = () => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const navigate = useNavigate();

  const isAuthenticated = useCallback(() => {
    // Now using server-side authentication through Supabase RLS
    // This function is deprecated but kept for backward compatibility
    return true; // Always return true since we handle auth in the route wrapper
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