import React from 'react';
import { PlusCircle, Search, Map, MousePointer2 } from 'lucide-react';

export default function Toolbar({ 
  onAddBlob, 
  onToggleSearch, 
  onToggleMinimap, 
  showMinimap,
  connectionMode,
  setConnectionMode
}) {
  return (
    <div style={{ 
      position: 'absolute', 
      top: '20px', 
      left: '50%', 
      transform: 'translateX(-50%)', 
      zIndex: 10,
      display: 'flex',
      gap: '8px',
      padding: '8px',
      borderRadius: '12px'
    }} className="glass-panel animate-fade-in">
      
      <button 
        onClick={onAddBlob}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'var(--accent-color)',
          color: '#000',
          borderRadius: '8px',
          fontWeight: '500',
          fontSize: '14px',
          transition: 'all 0.2s',
          boxShadow: '0 2px 8px rgba(88, 166, 255, 0.4)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-hover)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent-color)'}
        title="Add new Blob (N)"
      >
        <PlusCircle size={18} /> Add Blob
      </button>
      
      <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 4px' }} />
      
      <button 
        onClick={() => setConnectionMode(!connectionMode)}
        style={{ 
          padding: '8px 12px',
          borderRadius: '8px',
          background: connectionMode ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          color: connectionMode ? 'var(--text-main)' : 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          transition: 'all 0.2s'
        }}
        title="Toggle Selection Mode"
      >
        <MousePointer2 size={18} /> Select
      </button>

      <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 4px' }} />

      <button 
        onClick={onToggleSearch}
        style={{ 
          padding: '8px 12px',
          borderRadius: '8px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-main)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        title="Search Blobs (Ctrl+F)"
      >
        <Search size={18} />
      </button>

      <button 
        onClick={onToggleMinimap}
        style={{ 
          padding: '8px 12px',
          borderRadius: '8px',
          background: showMinimap ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          color: showMinimap ? 'var(--text-main)' : 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-main)'}
        onMouseLeave={(e) => e.currentTarget.style.color = showMinimap ? 'var(--text-main)' : 'var(--text-muted)'}
        title="Toggle Minimap"
      >
        <Map size={18} />
      </button>

    </div>
  );
}
