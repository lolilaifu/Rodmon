import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function DeleteModal({ isOpen, onClose, onConfirm }) {
  const [skipNextTime, setSkipNextTime] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (skipNextTime) {
      localStorage.setItem('skipBlobDeleteConfirm', 'true');
    }
    onConfirm();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }} className="animate-fade-in" onClick={onClose}>
      
      <div 
        style={{
          width: '400px',
          background: 'var(--toolbar-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ff6b6b', fontWeight: '600' }}>
            <AlertTriangle size={20} />
            <span>Delete Blob{Array.isArray(isOpen) && isOpen.length > 1 ? 's' : ''}?</span>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px', color: 'var(--text-main)', fontSize: '14px', lineHeight: '1.5' }}>
          Are you sure you want to delete {Array.isArray(isOpen) && isOpen.length > 1 ? `these ${isOpen.length} blobs` : 'this blob'}? <br/><br/>
          <strong style={{ color: '#ff6b6b' }}>All connected links will also be removed automatically.</strong> This action cannot be undone.
        </div>

        <div style={{ 
          padding: '16px 20px', 
          borderTop: '1px solid var(--border-color)', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(0,0,0,0.2)'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={skipNextTime} 
              onChange={e => setSkipNextTime(e.target.checked)} 
              style={{ cursor: 'pointer', accentColor: 'var(--accent-color)' }}
            />
            Don't show this again
          </label>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={onClose}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-main)',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirm}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                border: 'none',
                background: '#ff6b6b',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: '600',
                boxShadow: '0 2px 8px rgba(255, 107, 107, 0.4)'
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
