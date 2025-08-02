import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { loader } from '@monaco-editor/react';

interface MonacoEditorContextType {
  isLoaded: boolean;
  monacoInstance: any | null;
  preloadEditor: () => Promise<void>;
}

const MonacoEditorContext = createContext<MonacoEditorContextType | undefined>(undefined);

interface MonacoEditorProviderProps {
  children: React.ReactNode;
}

export const MonacoEditorProvider: React.FC<MonacoEditorProviderProps> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [monacoInstance, setMonacoInstance] = useState<any | null>(null);
  const preloadPromise = useRef<Promise<void> | null>(null);

  const preloadEditor = async (): Promise<void> => {
    if (preloadPromise.current) {
      return preloadPromise.current;
    }

    preloadPromise.current = (async () => {
      try {
        const monaco = await loader.init();
        
        // Configure Monaco with performance optimizations
        monaco.editor.defineTheme('light-optimized', {
          base: 'vs',
          inherit: true,
          rules: [],
          colors: {
            'editor.background': '#ffffff',
            'editor.foreground': '#000000'
          }
        });

        monaco.editor.defineTheme('dark-optimized', {
          base: 'vs-dark', 
          inherit: true,
          rules: [],
          colors: {
            'editor.background': '#1e1e1e',
            'editor.foreground': '#d4d4d4'
          }
        });

        // Set default model options for better performance
        monaco.editor.setModelLanguage(
          monaco.editor.createModel('', 'plaintext'),
          'plaintext'
        );

        setMonacoInstance(monaco);
        setIsLoaded(true);
      } catch (error) {
        console.error('❌ [Monaco] Failed to pre-load editor:', error);
      }
    })();

    return preloadPromise.current;
  };

  useEffect(() => {
    // Pre-load Monaco immediately when provider mounts
    preloadEditor();
  }, []);

  const value: MonacoEditorContextType = {
    isLoaded,
    monacoInstance,
    preloadEditor
  };

  return (
    <MonacoEditorContext.Provider value={value}>
      {children}
    </MonacoEditorContext.Provider>
  );
};

export const useMonacoEditor = (): MonacoEditorContextType => {
  const context = useContext(MonacoEditorContext);
  if (context === undefined) {
    throw new Error('useMonacoEditor must be used within a MonacoEditorProvider');
  }
  return context;
};