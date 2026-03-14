import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import Sidebar from './components/Sidebar';
import MainCanvas from './components/MainCanvas';

function App() {
  const [activeSheetId, setActiveSheetId] = useState(null);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar activeSheetId={activeSheetId} onSelectSheet={setActiveSheetId} />
      
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {activeSheetId ? (
          <MainCanvas sheetId={activeSheetId} />
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
    </div>
  );
}

export default App;
