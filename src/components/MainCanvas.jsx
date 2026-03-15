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

const nodeTypes = {
  blobNode: BlobNode
};

function FlowCanvas({ sheetId, isLocalSearchOpen, setLocalSearchOpen, pendingGlobalHighlightId, clearPendingGlobalHighlight }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [showMinimap, setShowMinimap] = useState(false);
  const [connectionMode, setConnectionMode] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  
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
    const selectChange = changes.find(c => c.type === 'select');
    if (selectChange) {
      if (selectChange.selected) setSelectedNodeId(selectChange.id);
      else setSelectedNodeId(prev => prev === selectChange.id ? null : prev);
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Use node selection standard keys (Backspace/Delete automatically handled by React Flow when focused)
      // Custom short cut N for new blob
      if (e.key === 'n' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        handleAddBlob();
      }
      // F to open local search
      if (e.key === 'f' && !e.shiftKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setLocalSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
      />
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        panOnScroll={true}
        zoomOnScroll={true}
        panOnDrag={!connectionMode}
        selectionOnDrag={connectionMode}
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ style: { strokeWidth: 2, stroke: 'var(--text-muted)' } }}
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
        onClose={() => {
          setNodes((nds) => nds.map(n => ({...n, selected: false})));
          setSelectedNodeId(null);
        }}
      />
    </div>
  );
}

// Ensure the wrapper is provided for useReactFlow
export default function MainCanvas({ sheetId, isLocalSearchOpen, setLocalSearchOpen, pendingGlobalHighlightId, clearPendingGlobalHighlight }) {
  return (
    <ReactFlowProvider>
      <FlowCanvas 
        sheetId={sheetId} 
        isLocalSearchOpen={isLocalSearchOpen} 
        setLocalSearchOpen={setLocalSearchOpen} 
        pendingGlobalHighlightId={pendingGlobalHighlightId}
        clearPendingGlobalHighlight={clearPendingGlobalHighlight}
      />
    </ReactFlowProvider>
  );
}
