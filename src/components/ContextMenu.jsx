import React, { useEffect } from 'react';
import { Trash2 } from 'lucide-react';

export default function ContextMenu({ menu, onClose, onDelete }) {
  useEffect(() => {
    const handleGlobalClick = () => onClose();
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (menu) {
      window.addEventListener('click', handleGlobalClick);
      window.addEventListener('keydown', handleGlobalKeyDown);
    }

    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [menu, onClose]);

  if (!menu) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: menu.y,
        left: menu.x,
        zIndex: 500,
        backgroundColor: 'var(--toolbar-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        padding: '6px',
        minWidth: '160px',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.15s ease-out forwards' // from common css
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          onDelete(menu.type, menu.id);
          onClose();
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 12px',
          background: 'transparent',
          border: 'none',
          color: '#ff6b6b',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          borderRadius: '4px',
          textAlign: 'left',
          transition: 'background 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <Trash2 size={16} /> 
        Delete {menu.type === 'node' ? 'Blob' : 'Connection'}
      </button>
    </div>
  );
}
