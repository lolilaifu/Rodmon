import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import { performSearch } from '../lib/search';

export default function LocalSearch({ 
  isOpen, 
  onClose, 
  worksheetId, 
  onSelectResult,
  isCaseSensitive,
  setCaseSensitive
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const onSelectResultRef = useRef(onSelectResult);

  // Keep ref synced with latest callback without causing re-renders
  useEffect(() => {
    onSelectResultRef.current = onSelectResult;
  }, [onSelectResult]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      // We do not clear the query or results here, to maintain persistent state 
      // when toggling the search bar visibility.
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (!query.trim()) {
      setResults([]);
      setActiveIndex(-1);
      onSelectResultRef.current(null);
      return;
    }

    const timer = setTimeout(() => {
      const res = performSearch(query, worksheetId, isCaseSensitive);
      setResults(res);
      setActiveIndex(res.length > 0 ? 0 : -1);
      
      if (res.length > 0) {
        onSelectResultRef.current(res[0].blobId);
      } else {
        onSelectResultRef.current(null); // Clear selection if no results
      }
    }, 150); // slight debounce for smooth typing

    return () => clearTimeout(timer);
  }, [query, isOpen, worksheetId, isCaseSensitive]); // REMOVED onSelectResult to fix dependency loop bug

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results.length === 0) return;
        
        let newIndex = activeIndex;
        if (e.shiftKey) {
          // Previous
          newIndex = activeIndex <= 0 ? results.length - 1 : activeIndex - 1;
        } else {
          // Next
          newIndex = activeIndex >= results.length - 1 ? 0 : activeIndex + 1;
        }
        setActiveIndex(newIndex);
        onSelectResultRef.current(results[newIndex].blobId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, activeIndex, onClose, onSelectResult]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '70px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 50,
      width: '400px',
      background: 'var(--toolbar-bg)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid var(--accent-color)',
      borderRadius: '8px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }} className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px' }}>
        <Search size={16} color="var(--text-muted)" style={{ marginRight: '10px' }} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search this worksheet... (#tag to prioritize tags)"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-main)',
            fontSize: '14px',
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

        {results.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {activeIndex + 1} / {results.length}
            </span>
            <div style={{ display: 'flex' }}>
              <button 
                onClick={() => {
                  if (results.length === 0) return;
                  const newIdx = activeIndex <= 0 ? results.length - 1 : activeIndex - 1;
                  setActiveIndex(newIdx);
                  onSelectResultRef.current(results[newIdx].blobId);
                }}
                style={{ padding: '2px', color: 'var(--text-main)' }} title="Previous (Shift+Enter)"
              >
                <ChevronUp size={16} />
              </button>
              <button 
                onClick={() => {
                  if (results.length === 0) return;
                  const newIdx = activeIndex >= results.length - 1 ? 0 : activeIndex + 1;
                  setActiveIndex(newIdx);
                  onSelectResultRef.current(results[newIdx].blobId);
                }}
                style={{ padding: '2px', color: 'var(--text-main)' }} title="Next (Enter)"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
        )}
        
        <button onClick={onClose} style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
