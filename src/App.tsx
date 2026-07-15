import React from 'react';
import { useAppStore } from './hooks/useAppStore';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LiveDetection } from './pages/LiveDetection';
import { Conversation } from './pages/Conversation';
import { GestureDictionary } from './pages/GestureDictionary';
import { Training } from './pages/Training';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Help } from './pages/Help';
import { Toaster } from 'sonner';

function App() {
  const { currentPage } = useAppStore();

  // Route selector
  const renderActivePage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <LiveDetection />;
      case 'conversation':
        return <Conversation />;
      case 'dictionary':
        return <GestureDictionary />;
      case 'training':
        return <Training />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      case 'help':
        return <Help />;
      default:
        return <LiveDetection />;
    }
  };

  return (
    <>
      <DashboardLayout>
        {renderActivePage()}
      </DashboardLayout>
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          style: {
            background: 'rgba(16, 23, 38, 0.9)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#fff',
            borderRadius: '16px'
          }
        }}
      />
    </>
  );
}

export default App;
