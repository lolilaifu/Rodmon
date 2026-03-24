import React, { useState, useEffect, useRef } from 'react';
import { Search, X, File, Tag } from 'lucide-react';
import { performSearch } from '../lib/search';

export default function GlobalSearch({ isOpen, onClose, onSelectResult, isCaseSensitive, setCaseSensitive, isFuzzySearch, setFuzzySearch }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const tId = setTimeout(() => {
        inputRef.current?.focus();
        setQuery('');
        setResults([]);
        setActiveIndex(-1);
      }, 50);
      return () => clearTimeout(tId);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !query.trim()) {
      const tId = setTimeout(() => setResults([]), 0);
      return () => clearTimeout(tId);
    }

    const timer = setTimeout(() => {
      // Global search doesn't restrict to a worksheetId
      const res = performSearch(query, null, isCaseSensitive, isFuzzySearch);
      setResults(res);
      setActiveIndex(res.length > 0 ? 0 : -1);
    }, 150);

    return () => clearTimeout(timer);
  }, [query, isOpen, isCaseSensitive, isFuzzySearch]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => prev >= results.length - 1 ? 0 : prev + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => prev <= 0 ? results.length - 1 : prev - 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results.length > 0 && activeIndex >= 0 && activeIndex < results.length) {
          const selected = results[activeIndex];
          onSelectResult(selected.worksheetId, selected.blobId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, activeIndex, onClose, onSelectResult]);

  if (!isOpen) return null;

  // Group results by worksheet
  const groupedResults = results.reduce((acc, curr) => {
    if (!acc[curr.worksheetId]) {
      acc[curr.worksheetId] = {
        name: curr.worksheetName,
        items: []
      };
    }
    acc[curr.worksheetId].items.push(curr);
    return acc;
  }, {});

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '10vh'
    }} className="animate-fade-in" onClick={onClose}>
      
      <div 
        style={{
          width: '600px',
          maxHeight: '80vh',
          background: 'var(--toolbar-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }} 
        onClick={e => e.stopPropagation()} // Prevent close on modal click
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <Search size={20} color="var(--accent-color)" style={{ marginRight: '16px' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all worksheets... (#tag for tags)"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              fontSize: '18px',
              outline: 'none',
              boxShadow: 'none',
              padding: 0
            }}
          />

          <button 
            onClick={() => setCaseSensitive(!isCaseSensitive)}
            title={isCaseSensitive ? "Case Sensitive Search Enabled" : "Enable Case Sensitive Search"}
            style={{
              marginLeft: '8px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: isCaseSensitive ? 'rgba(88, 166, 255, 0.2)' : 'transparent',
              color: isCaseSensitive ? 'var(--accent-color)' : 'var(--text-muted)',
              border: isCaseSensitive ? '1px solid var(--accent-color)' : '1px solid transparent',
              fontSize: '13px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              cursor: 'pointer',
              transition: 'all 0.2s',
              outline: 'none'
            }}
          >
            Aa
          </button>

          <button 
            onClick={() => setFuzzySearch(!isFuzzySearch)}
            title={isFuzzySearch ? "Fuzzy Search Enabled" : "Enable Fuzzy Search"}
            style={{
              marginLeft: '8px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: isFuzzySearch ? 'rgba(88, 166, 255, 0.2)' : 'transparent',
              color: isFuzzySearch ? 'var(--accent-color)' : 'var(--text-muted)',
              border: isFuzzySearch ? '1px solid var(--accent-color)' : '1px solid transparent',
              fontSize: '13px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              cursor: 'pointer',
              transition: 'all 0.2s',
              outline: 'none'
            }}
          >
            ~
          </button>
          
          <button onClick={onClose} style={{ marginLeft: '12px', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {query.trim() && Object.keys(groupedResults).length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No results found for "{query}"
            </div>
          )}

          {Object.entries(groupedResults).map(([wsId, group]) => (
            <div key={wsId} style={{ marginBottom: '16px' }}>
              <div style={{ 
                padding: '4px 20px', 
                fontSize: '12px', 
                fontWeight: '600', 
                textTransform: 'uppercase', 
                color: 'var(--text-muted)',
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <File size={12} /> {group.name}
              </div>
              
              {group.items.map((res) => {
                const isSelected = results[activeIndex]?.blobId === res.blobId;
                return (
                  <div 
                    key={res.blobId}
                    onClick={() => onSelectResult(wsId, res.blobId)}
                    style={{
                      padding: '12px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      background: isSelected ? 'rgba(88, 166, 255, 0.15)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--accent-color)' : '3px solid transparent',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                  >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '15px', color: 'var(--text-main)', fontWeight: '500' }}>
                      {res.blobName || 'Untitled Blob'}
                    </span>
                    {res.matchedField === 'tag' && (
                      <span style={{ fontSize: '12px', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Tag size={10} /> Matched in tags
                      </span>
                    )}
                    {res.matchedField === 'content' && (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Matched in description/content
                      </span>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          ))}
        </div>
        
        <div style={{ 
          padding: '12px 20px', 
          borderTop: '1px solid var(--border-color)', 
          fontSize: '12px', 
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span><strong>↑↓</strong> to navigate • <strong>Enter</strong> to select • <strong>ESC</strong> to close</span>
          <span>Searching {Object.keys(groupedResults).length} worksheets</span>
        </div>
      </div>
    </div>
  );
}
