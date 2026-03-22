import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge,
  useReactFlow,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import { loadWorksheet, saveWorksheet } from '../lib/storage';
import Toolbar from './Toolbar';
import BlobNode from './BlobNode';
import BlobEditor from './BlobEditor';
import LocalSearch from './LocalSearch';
import DeleteModal from './DeleteModal';
import ContextMenu from './ContextMenu';

const nodeTypes = {
  blobNode: BlobNode
};

function FlowCanvas({ sheetId, isLocalSearchOpen, setLocalSearchOpen, pendingGlobalHighlightId, clearPendingGlobalHighlight, isCaseSensitiveSearch, setCaseSensitiveSearch, isFuzzySearch, setFuzzySearch }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [showMinimap, setShowMinimap] = useState(false);
  const [connectionMode, setConnectionMode] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  
  // Deletion state
  const [blobToDelete, setBlobToDelete] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  // Search state
  const [activeSearchBlobId, setActiveSearchBlobId] = useState(null);

  const reactFlowWrapper = useRef(null);
  const { project, setViewport } = useReactFlow();
  
  // Load sheet data on mount or sheetId change
  useEffect(() => {
    let active = true;
    const fetchSheet = async () => {
      const data = await loadWorksheet(sheetId);
      if (active && data) {
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        if (data.viewport) {
          setViewport(data.viewport);
        }
        setSelectedNodeId(null);
      }
    };
    fetchSheet();
    return () => { active = false; };
  }, [sheetId, setViewport]);

  // Handle saving data debounced
  const saveTimeout = useRef(null);
  useEffect(() => {
    if (!sheetId) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      // In a real app we'd also save viewport, but skipping here to prevent jitter
      saveWorksheet(sheetId, { nodes, edges });
    }, 1000); // 1s auto-save
    return () => clearTimeout(saveTimeout.current);
  }, [nodes, edges, sheetId]);

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
    // Check if selection changed to update local state for the editor
    const selectChanges = changes.filter(c => c.type === 'select');
    if (selectChanges.length > 0) {
      const newlySelected = selectChanges.find(c => c.selected);
      if (newlySelected) {
        setSelectedNodeId(newlySelected.id);
      } else {
        setSelectedNodeId(prev => {
          const deselected = selectChanges.find(c => !c.selected && c.id === prev);
          return deselected ? null : prev;
        });
      }
    }
    // Check for remove
    const removeChange = changes.find(c => c.type === 'remove');
    if (removeChange && removeChange.id === selectedNodeId) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId]);
  
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  
  const onConnect = useCallback((params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: 'var(--accent-color)', strokeWidth: 2 } }, eds)), []);

  const handleAddBlob = () => {
    const newNode = {
      id: `blob-${uuidv4()}`,
      type: 'blobNode',
      position: { x: window.innerWidth / 2 - 160, y: window.innerHeight / 2 - 100 },
      data: { name: 'New Idea', content: '', color: 'var(--sidebar-bg)' }
    };
    setNodes((nds) => [...nds, newNode]);
    
    // Auto select new node
    setTimeout(() => {
      setNodes((nds) => nds.map(n => ({...n, selected: n.id === newNode.id})));
      setSelectedNodeId(newNode.id);
    }, 10);
  };

  const confirmDeleteBlob = useCallback((ids) => {
    const idSet = new Set(Array.isArray(ids) ? ids : [ids]);
    setNodes(nds => nds.filter(n => !idSet.has(n.id)));
    setEdges(eds => eds.filter(e => !idSet.has(e.source) && !idSet.has(e.target)));
    if (idSet.has(selectedNodeId)) setSelectedNodeId(null);
    setBlobToDelete(null);
  }, [selectedNodeId]);

  const handleDeleteAction = useCallback((specificType = null, specificId = null) => {
    if (specificType && specificId) {
      if (specificType === 'node') {
        const skipConfirm = localStorage.getItem('skipBlobDeleteConfirm') === 'true';
        if (skipConfirm) confirmDeleteBlob([specificId]);
        else setBlobToDelete([specificId]);
      } else if (specificType === 'edge') {
        setEdges(eds => eds.filter(e => e.id !== specificId));
      }
      return;
    }

    const selectedNodes = nodes.filter(n => n.selected);
    const selectedEdges = edges.filter(e => e.selected);

    if (selectedNodes.length > 0) {
      const skipConfirm = localStorage.getItem('skipBlobDeleteConfirm') === 'true';
      const ids = selectedNodes.map(n => n.id);
      if (skipConfirm) {
        confirmDeleteBlob(ids);
      } else {
        setBlobToDelete(ids);
      }
    } else if (selectedEdges.length > 0) {
      const edgeIds = new Set(selectedEdges.map(e => e.id));
      setEdges(eds => eds.filter(e => !edgeIds.has(e.id)));
    }
  }, [nodes, edges, confirmDeleteBlob]);

  const latestHandleDeleteRef = useRef(handleDeleteAction);
  useEffect(() => { latestHandleDeleteRef.current = handleDeleteAction; }, [handleDeleteAction]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
      
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
        e.preventDefault();
        latestHandleDeleteRef.current();
      }
      
      if (e.key === 'Escape' && !isInput) {
        setNodes(nds => nds.map(n => ({...n, selected: false})));
        setEdges(eds => eds.map(e => ({...e, selected: false})));
        setSelectedNodeId(null);
        setContextMenu(null);
        setBlobToDelete(null);
      }

      if (e.key === 'n' && !isInput) {
        handleAddBlob();
      }

      if (e.key === 'f' && !e.shiftKey && !isInput) {
        e.preventDefault();
        setLocalSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, id: node.id, type: 'node' });
  }, []);

  const onEdgeContextMenu = useCallback((event, edge) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, id: edge.id, type: 'edge' });
  }, []);

  const selectedNodeData = selectedNodeId ? nodes.find(n => n.id === selectedNodeId)?.data : null;

  const updateNodeData = (id, newData) => {
    setNodes(nds => nds.map(n => {
      if (n.id === id) {
        return { ...n, data: { ...n.data, ...newData } };
      }
      return n;
    }));
  };

  // When a search result is selected, center on it and highlight it
  const handleSelectSearchResult = useCallback((blobId) => {
    setActiveSearchBlobId(blobId);
    if (!blobId) {
      setNodes(nds => {
        let changed = false;
        const newNds = nds.map(n => {
          if (n.data?.isHighlighted) {
            changed = true;
            return { ...n, data: { ...n.data, isHighlighted: false } };
          }
          return n;
        });
        return changed ? newNds : nds; // Bail out if nothing changed
      });
      return;
    }

    const targetNode = nodes.find(n => n.id === blobId);
    
    setNodes(nds => {
      let changed = false;
      const newNds = nds.map(n => {
        const shouldBeHighlighted = n.id === blobId;
        if (n.data?.isHighlighted !== shouldBeHighlighted) {
          changed = true;
          return { ...n, data: { ...n.data, isHighlighted: shouldBeHighlighted } };
        }
        return n;
      });
      return changed ? newNds : nds; // Bail out if nothing changed
    });

    if (targetNode) {
      // Center Viewport
      const x = targetNode.position.x + 160; // offset width
      const y = targetNode.position.y + 100; // offset height
      setViewport({ x: window.innerWidth/2 - x, y: window.innerHeight/2 - y, zoom: 1 }, { duration: 400 });
    }
  }, [nodes, setViewport]);

  // Check if we need to jump to a global search result
  useEffect(() => {
    if (pendingGlobalHighlightId && nodes.length > 0) {
      handleSelectSearchResult(pendingGlobalHighlightId);
      clearPendingGlobalHighlight();
    }
  }, [pendingGlobalHighlightId, nodes, handleSelectSearchResult, clearPendingGlobalHighlight]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }} ref={reactFlowWrapper}>
      <Toolbar 
        onAddBlob={handleAddBlob} 
        showMinimap={showMinimap}
        onToggleMinimap={() => setShowMinimap(!showMinimap)}
        connectionMode={connectionMode}
        setConnectionMode={setConnectionMode}
        onToggleSearch={() => setLocalSearchOpen(!isLocalSearchOpen)}
      />

      <LocalSearch 
        isOpen={isLocalSearchOpen} 
        onClose={() => setLocalSearchOpen(false)} 
        worksheetId={sheetId}
        onSelectResult={handleSelectSearchResult}
        isCaseSensitive={isCaseSensitiveSearch}
        setCaseSensitive={setCaseSensitiveSearch}
        isFuzzySearch={isFuzzySearch}
        setFuzzySearch={setFuzzySearch}
      />
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneClick={() => setContextMenu(null)}
        nodeTypes={nodeTypes}
        panOnScroll={true}
        zoomOnScroll={true}
        panOnDrag={!connectionMode}
        selectionOnDrag={connectionMode}
        deleteKeyCode={null} // We intercept delete keys manually 
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ style: { strokeWidth: 2, stroke: 'var(--text-muted)' }, interactionWidth: 20 }}
      >
        <Background color="rgba(255,255,255,0.05)" gap={24} size={2} />
        <Controls position="bottom-left" />
        {showMinimap && (
          <MiniMap 
            nodeColor={(n) => n.data.color || 'var(--sidebar-bg)'}
            maskColor="rgba(0, 0, 0, 0.4)"
            style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
          />
        )}
      </ReactFlow>

      {/* Slide-out editor panel */}
      <BlobEditor 
        isOpen={!!selectedNodeId} 
        nodeId={selectedNodeId}
        nodeData={selectedNodeData}
        onUpdate={(newData) => updateNodeData(selectedNodeId, newData)}
        onDeleteRequest={() => handleDeleteAction('node', selectedNodeId)}
        onClose={() => {
          setNodes((nds) => nds.map(n => ({...n, selected: false})));
          setSelectedNodeId(null);
        }}
      />

      <DeleteModal 
        isOpen={!!blobToDelete} 
        onClose={() => setBlobToDelete(null)} 
        onConfirm={() => confirmDeleteBlob(blobToDelete)} 
      />

      <ContextMenu 
        menu={contextMenu} 
        onClose={() => setContextMenu(null)} 
        onDelete={(type, id) => handleDeleteAction(type, id)} 
      />
    </div>
  );
}

// Ensure the wrapper is provided for useReactFlow
export default function MainCanvas({ sheetId, isLocalSearchOpen, setLocalSearchOpen, pendingGlobalHighlightId, clearPendingGlobalHighlight, isCaseSensitiveSearch, setCaseSensitiveSearch, isFuzzySearch, setFuzzySearch }) {
  return (
    <ReactFlowProvider>
      <FlowCanvas 
        sheetId={sheetId} 
        isLocalSearchOpen={isLocalSearchOpen} 
        setLocalSearchOpen={setLocalSearchOpen} 
        pendingGlobalHighlightId={pendingGlobalHighlightId}
        clearPendingGlobalHighlight={clearPendingGlobalHighlight}
        isCaseSensitiveSearch={isCaseSensitiveSearch}
        setCaseSensitiveSearch={setCaseSensitiveSearch}
        isFuzzySearch={isFuzzySearch}
        setFuzzySearch={setFuzzySearch}
      />
    </ReactFlowProvider>
  );
}
