import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Sidebar from './components/Sidebar';
import MainCanvas from './components/MainCanvas';
import GlobalSearch from './components/GlobalSearch';
import { initializeSearchIndex } from './lib/search';

function App() {
  const [activeSheetId, setActiveSheetId] = useState(null);
  const [isLocalSearchOpen, setLocalSearchOpen] = useState(false);
  const [isGlobalSearchOpen, setGlobalSearchOpen] = useState(false);

  // When jumping from global search, we need to instruct the canvas to highlight a specific blob across renders
  const [pendingGlobalHighlightId, setPendingGlobalHighlightId] = useState(null);

  useEffect(() => {
    initializeSearchIndex();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F' && e.shiftKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setGlobalSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleGlobalSearchResult = (worksheetId, blobId) => {
    setGlobalSearchOpen(false);
    
    // Switch worksheet if needed
    if (activeSheetId !== worksheetId) {
      setActiveSheetId(worksheetId);
    }
    
    // Set the target blob ID to jump to when canvas handles it
    setPendingGlobalHighlightId(blobId);
    
    // Auto open local search on the new canvas purely for UI consistency / persistent highlights
    setLocalSearchOpen(true);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar activeSheetId={activeSheetId} onSelectSheet={setActiveSheetId} />
      
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {activeSheetId ? (
          <MainCanvas 
            sheetId={activeSheetId} 
            isLocalSearchOpen={isLocalSearchOpen} 
            setLocalSearchOpen={setLocalSearchOpen} 
            pendingGlobalHighlightId={pendingGlobalHighlightId}
            clearPendingGlobalHighlight={() => setPendingGlobalHighlightId(null)}
          />
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%', 
            width: '100%',
            flexDirection: 'column',
            gap: '16px',
            color: 'var(--text-muted)'
          }}>
            <div style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '60px', 
              background: 'rgba(255,255,255,0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)'
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 2v20M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '300', color: 'var(--text-main)' }}>Rodmon Explorer</h2>
            <p>Select a worksheet from the sidebar or click <strong style={{color: 'var(--accent-color)'}}><Plus size={14}/></strong> to create a new one.</p>
          </div>
        )}
      </div>

      <GlobalSearch 
        isOpen={isGlobalSearchOpen} 
        onClose={() => setGlobalSearchOpen(false)} 
        onSelectResult={handleGlobalSearchResult} 
      />
    </div>
  );
}

export default App;
