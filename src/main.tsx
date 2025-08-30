import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/debugControls'
import { MonacoEditorProvider } from '@/contexts/MonacoEditorProvider'

createRoot(document.getElementById("root")!).render(
  <MonacoEditorProvider>
    <App />
  </MonacoEditorProvider>
);
