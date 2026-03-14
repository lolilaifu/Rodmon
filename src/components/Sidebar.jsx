import React, { useState, useEffect } from 'react';
import { Plus, Trash2, File, Download, Upload, MoreVertical, Edit2 } from 'lucide-react';
import { getWorksheetsList, createWorksheet, deleteWorksheet, exportWorksheet, importWorksheet } from '../lib/storage';

export default function Sidebar({ activeSheetId, onSelectSheet }) {
  const [worksheets, setWorksheets] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  
  const loadList = async () => {
    const list = await getWorksheetsList();
    // Sort by updated latest first
    list.sort((a, b) => b.updatedAt - a.updatedAt);
    setWorksheets(list);
  };

  useEffect(() => {
    loadList();
    // Setting up a custom event listener so other components can trigger a sidebar refresh
    window.addEventListener('rodmon-worksheets-updated', loadList);
    return () => window.removeEventListener('rodmon-worksheets-updated', loadList);
  }, []);

  const handleCreate = async () => {
    const newSheet = await createWorksheet('New Worksheet');
    await loadList();
    onSelectSheet(newSheet.id);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this worksheet?')) {
      await deleteWorksheet(id);
      if (activeSheetId === id) {
        onSelectSheet(null);
      }
      loadList();
    }
  };

  const startEditing = (id, name, e) => {
    e.stopPropagation();
    setEditingId(id);
    setEditName(name);
  };

  const saveEdit = async (id) => {
    // We update name via saving the worksheet.
    // To do this we need to load the full worksheet first, update name, and save.
    // Since we only want to update the name without loading full data, we should probably 
    // export it as a method in storage.js, but let's just trigger a custom event or do it cleanly.
    // For now we'll import loadWorksheet and saveWorksheet dynamically.
    import('../lib/storage').then(async ({ loadWorksheet, saveWorksheet }) => {
      const sheet = await loadWorksheet(id);
      if (sheet) {
        await saveWorksheet(id, { name: editName });
        setEditingId(null);
        loadList();
      }
    });
  };

  const handleExport = async (id, e) => {
    e.stopPropagation();
    const jsonStr = await exportWorksheet(id);
    if (jsonStr) {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `worksheet-${id.substring(0,8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target.result;
      const imported = await importWorksheet(content);
      if (imported) {
        await loadList();
        onSelectSheet(imported.id);
      } else {
        alert('Failed to import worksheet. Invalid format.');
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="glass" style={{ width: '280px', display: 'flex', flexDirection: 'column', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', background: 'linear-gradient(90deg, #58a6ff, #79c0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Rodmon
        </h1>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px', fontWeight: '600' }}>Worksheets</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }} title="Import Worksheet">
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
            <Upload size={16} />
          </label>
          <button onClick={handleCreate} title="New Worksheet" style={{ color: 'var(--accent-color)' }}>
            <Plus size={18} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {worksheets.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', marginTop: '40px' }}>
            No worksheets yet.<br/>Create one to start mapping.
          </div>
        ) : (
          worksheets.map(ws => (
            <div 
              key={ws.id}
              onClick={() => onSelectSheet(ws.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: activeSheetId === ws.id ? 'rgba(88, 166, 255, 0.15)' : 'transparent',
                border: `1px solid ${activeSheetId === ws.id ? 'rgba(88, 166, 255, 0.3)' : 'transparent'}`,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (activeSheetId !== ws.id) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                if (activeSheetId !== ws.id) e.currentTarget.style.background = 'transparent';
              }}
            >
              <File size={16} color={activeSheetId === ws.id ? 'var(--accent-color)' : 'var(--text-muted)'} style={{ marginRight: '12px', flexShrink: 0 }} />
              
              {editingId === ws.id ? (
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onBlur={() => saveEdit(ws.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') saveEdit(ws.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  style={{ flex: 1, padding: '4px', fontSize: '14px', width: '100%' }}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span style={{ flex: 1, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: activeSheetId === ws.id ? '500' : '400', color: activeSheetId === ws.id ? 'var(--text-main)' : 'var(--text-muted)' }}>
                  {ws.name}
                </span>
              )}
              
              <div style={{ display: 'flex', gap: '6px', opacity: activeSheetId === ws.id ? 1 : 0.4 }} onClick={e => e.stopPropagation()}>
                <button onClick={(e) => handleExport(ws.id, e)} title="Export" style={{ padding: '2px' }}><Download size={14} color="var(--text-muted)" /></button>
                <button onClick={(e) => startEditing(ws.id, ws.name, e)} title="Rename" style={{ padding: '2px' }}><Edit2 size={14} color="var(--text-muted)" /></button>
                <button onClick={(e) => handleDelete(ws.id, e)} title="Delete" style={{ padding: '2px' }}><Trash2 size={14} color="var(--danger-color)" /></button>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
        All data saved locally in your browser.
      </div>
    </div>
  );
}
