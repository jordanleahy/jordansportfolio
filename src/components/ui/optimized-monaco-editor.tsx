import React, { memo, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { useMonacoEditor } from '@/contexts/MonacoEditorProvider';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedMonacoEditorProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  language?: string;
  readOnly?: boolean;
  placeholder?: string;
  height?: string | number;
  className?: string;
  options?: any;
}

const OptimizedMonacoEditor = memo<OptimizedMonacoEditorProps>(({
  value,
  onChange,
  language = 'plaintext',
  readOnly = false,
  placeholder,
  height = '400px',
  className,
  options = {}
}) => {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const { isLoaded, preloadEditor } = useMonacoEditor();

  const editorOptions = useMemo(() => ({
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on' as const,
    lineNumbers: 'on' as const,
    automaticLayout: true,
    tabSize: 2,
    insertSpaces: true,
    fontSize: isMobile ? 14 : 16,
    lineHeight: isMobile ? 20 : 24,
    fontFamily: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "Source Code Pro", monospace',
    readOnly,
    renderWhitespace: 'none' as const,
    renderControlCharacters: false,
    lineDecorationsWidth: 10,
    lineNumbersMinChars: 3,
    padding: { top: 12, bottom: 12 },
    contextmenu: !isMobile,
    commandPalette: !isMobile,
    placeholder,
    // Performance optimizations
    quickSuggestions: false,
    suggestOnTriggerCharacters: false,
    acceptSuggestionOnEnter: 'off' as const,
    tabCompletion: 'off' as const,
    parameterHints: { enabled: false },
    occurrencesHighlight: false,
    semanticHighlighting: { enabled: false },
    renderLineHighlight: 'none' as const,
    selectionHighlight: false,
    // Mobile optimizations
    ...(isMobile ? {
      scrollbar: {
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8
      },
      mouseWheelZoom: false,
      folding: false,
      glyphMargin: false
    } : {}),
    ...options
  }), [isMobile, readOnly, placeholder, options]);

  const editorTheme = useMemo(() => {
    return theme === 'dark' ? 'dark-optimized' : 'light-optimized';
  }, [theme]);

  // Show loading skeleton while Monaco is loading
  if (!isLoaded) {
    return (
      <div className={className} style={{ height }}>
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  return (
    <div className={className} style={{ height }}>
      <Editor
        height="100%"
        language={language}
        theme={editorTheme}
        value={value}
        onChange={onChange}
        options={editorOptions}
        loading={<Skeleton className="w-full h-full" />}
        onMount={() => {
          console.log('✅ [OptimizedMonacoEditor] Editor mounted successfully');
        }}
      />
    </div>
  );
});

OptimizedMonacoEditor.displayName = 'OptimizedMonacoEditor';

export { OptimizedMonacoEditor };