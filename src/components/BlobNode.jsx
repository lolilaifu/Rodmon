import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

export default memo(function BlobNode({ data, selected }) {
  const color = data.color || 'var(--sidebar-bg)';
  const border = selected ? 'var(--accent-color)' : 'var(--blob-border)';
  const shadow = selected ? '0 0 0 2px rgba(88, 166, 255, 0.3), var(--blob-shadow)' : 'var(--blob-shadow)';

  return (
    <div 
      className="animate-fade-in"
      style={{
        width: '320px',
        background: color,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${border}`,
        borderRadius: '16px',
        boxShadow: shadow,
        cursor: 'grab',
        transition: 'all 0.2s',
        overflow: 'hidden'
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: 'var(--accent-color)', width: '8px', height: '8px', border: 'none' }} />
      <Handle type="target" position={Position.Left} style={{ background: 'var(--accent-color)', width: '8px', height: '8px', border: 'none' }} />
      
      <div style={{
        padding: '12px 16px',
        borderBottom: data.content ? '1px solid var(--border-color)' : 'none',
        background: 'rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '15px', 
          fontWeight: '600', 
          color: 'var(--text-main)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {data.name || 'Untitled Blob'}
        </h3>
        
        {data.tags && data.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '4px' }}>
            {data.tags.slice(0, 2).map((tag, i) => (
              <span key={i} style={{ 
                fontSize: '10px', 
                background: 'rgba(255,255,255,0.1)', 
                padding: '2px 6px', 
                borderRadius: '4px',
                color: 'var(--text-muted)'
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {data.content && (
        <div style={{
          padding: '16px',
          fontSize: '14px',
          color: 'var(--text-muted)',
          lineHeight: '1.5',
          maxHeight: data.expanded ? 'none' : '100px',
          overflow: 'hidden',
          maskImage: data.expanded ? 'none' : 'linear-gradient(to bottom, black 50%, transparent 100%)',
          WebkitMaskImage: data.expanded ? 'none' : 'linear-gradient(to bottom, black 50%, transparent 100%)'
        }}>
          {data.content.substring(0, 300)}
          {!data.expanded && data.content.length > 300 && '...'}
        </div>
      )}
      
      <Handle type="source" position={Position.Right} style={{ background: 'var(--accent-color)', width: '8px', height: '8px', border: 'none' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: 'var(--accent-color)', width: '8px', height: '8px', border: 'none' }} />
    </div>
  );
});
