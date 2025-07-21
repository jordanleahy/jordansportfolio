import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useAuthGuard = () => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const guardedAction = (action: () => void) => {
    if (!user) {
      setShowAuthModal(true);
      return false;
    }
    action();
    return true;
  };

  const closeAuthModal = () => setShowAuthModal(false);

  return {
    user,
    showAuthModal,
    guardedAction,
    closeAuthModal,
  };
};