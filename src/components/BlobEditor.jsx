import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Palette } from 'lucide-react';

const COLORS = [
  'var(--sidebar-bg)', // default glass
  'rgba(239, 68, 68, 0.15)', // red
  'rgba(245, 158, 11, 0.15)', // orange
  'rgba(16, 185, 129, 0.15)', // green
  'rgba(59, 130, 246, 0.15)', // blue
  'rgba(139, 92, 246, 0.15)', // purple
];

export default function BlobEditor({ isOpen, nodeId, nodeData, onUpdate, onClose }) {
  const [isEditingData, setIsEditingData] = useState(false);

  // If node changes, reset edit mode
  useEffect(() => {
    setIsEditingData(false);
  }, [nodeId]);

  if (!isOpen || !nodeData) {
    return (
      <div style={{
        position: 'absolute',
        top: 0,
        right: '-400px',
        width: '360px',
        height: '100%',
        transition: 'right 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 20
      }} />
    );
  }

  return (
    <div className="glass" style={{
      position: 'absolute',
      top: 0,
      right: isOpen ? 0 : '-400px',
      width: '360px',
      height: '100%',
      transition: 'right 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      zIndex: 20,
      borderLeft: '1px solid var(--border-color)',
      borderTop: 'none',
      borderRight: 'none',
      borderBottom: 'none',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '-8px 0 32px rgba(0,0,0,0.5)'
    }}>
      <div style={{ 
        padding: '20px', 
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h2 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Edit Blob</h2>
        <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18}/></button>
      </div>

      <div style={{ padding: '20px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Name Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Name</label>
          <input 
            value={nodeData.name || ''} 
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Blob Title..."
            style={{ fontSize: '16px', fontWeight: '500' }}
          />
        </div>

        {/* Color Coding Picker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Palette size={14} /> Color
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {COLORS.map((color) => (
              <div 
                key={color}
                onClick={() => onUpdate({ color })}
                style={{ 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '12px', 
                  background: color,
                  cursor: 'pointer',
                  border: nodeData.color === color ? '2px solid var(--accent-color)' : '1px solid var(--border-color)'
                }}
              />
            ))}
          </div>
        </div>

        {/* Data / Markdown Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Data (Markdown)</label>
            <button 
              onClick={() => setIsEditingData(!isEditingData)}
              style={{ fontSize: '12px', color: 'var(--accent-color)' }}
            >
              {isEditingData ? 'Preview' : 'Edit'}
            </button>
          </div>
          
          {isEditingData ? (
            <textarea 
              value={nodeData.content || ''}
              onChange={(e) => onUpdate({ content: e.target.value })}
              placeholder="Write detailed notes here. Supports markdown syntax..."
              style={{ flex: 1, minHeight: '300px', resize: 'vertical', fontFamily: 'monospace', fontSize: '14px' }}
            />
          ) : (
            <div 
              style={{ 
                flex: 1, 
                minHeight: '300px', 
                background: 'rgba(0,0,0,0.1)', 
                borderRadius: '6px', 
                padding: '12px',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                lineHeight: '1.6',
                color: 'var(--text-main)',
                overflowY: 'auto'
              }}
              onDoubleClick={() => setIsEditingData(true)}
            >
              {nodeData.content ? (
                <ReactMarkdown>{nodeData.content}</ReactMarkdown>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Double-click or click "Edit" to add data.</span>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Tags (comma separated)</label>
          <input 
            value={(nodeData.tags || []).join(', ')} 
            onChange={(e) => {
              const str = e.target.value;
              const tags = str.split(',').map(t => t.trim()).filter(Boolean);
              onUpdate({ tags });
            }}
            placeholder="e.g. priority, frontend, meeting"
          />
        </div>

      </div>
    </div>
  );
}
