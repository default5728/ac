import React from 'react';
import { DatabaseProvider, useDatabase } from './context/DatabaseContext';
import { StaffAuthScreen } from './components/auth/StaffAuthScreen';
import { StaffPortalView } from './components/staff/StaffPortalView';
import { SyncIndicator } from './components/common/SyncIndicator';
import { NotificationToastContainer } from './components/common/NotificationToastContainer';
import { ArchitectureExplainerModal } from './components/common/ArchitectureExplainerModal';

const AppContent: React.FC = () => {
  const { currentUser } = useDatabase();

  return (
    <div className="min-h-screen bg-[#050608] text-[#e7ebf0] grid-bg flex flex-col justify-between selection:bg-cyan-400 selection:text-black">
      {!currentUser ? <StaffAuthScreen /> : <StaffPortalView />}

      {/* System Overlays */}
      <SyncIndicator />
      <NotificationToastContainer />
      <ArchitectureExplainerModal />
    </div>
  );
};

export default function App() {
  return (
    <DatabaseProvider>
      <AppContent />
    </DatabaseProvider>
  );
}
