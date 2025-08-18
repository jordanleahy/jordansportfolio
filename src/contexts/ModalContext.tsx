import React, { createContext, useContext, useState } from 'react';

interface ModalContextType {
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  isCaseStudyPasswordOpen: boolean;
  openCaseStudyPassword: () => void;
  closeCaseStudyPassword: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: React.ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCaseStudyPasswordOpen, setIsCaseStudyPasswordOpen] = useState(false);

  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);
  
  const openCaseStudyPassword = () => setIsCaseStudyPasswordOpen(true);
  const closeCaseStudyPassword = () => setIsCaseStudyPasswordOpen(false);

  const value = {
    isSettingsOpen,
    openSettings,
    closeSettings,
    isCaseStudyPasswordOpen,
    openCaseStudyPassword,
    closeCaseStudyPassword,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};