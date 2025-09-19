import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import styled from 'styled-components';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Panel,
    useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { usePlan } from '../context/PlanContext';
import StoryNode from './nodes/StoryNode';
import CheckpointNode from './nodes/MilestoneNode';
import IntentNode from './nodes/IntentNode';
import NodePropertiesPanel from './panels/NodePropertiesPanel';
import ToolbarPanel from './panels/ToolbarPanel';
import StoryCreationModal from './modals/StoryCreationModal';
import IntentCreationModal from './modals/IntentCreationModal';
import PlanImportModal from './modals/PlanImportModal';
import apiService from '../services/apiService';
import { planDataToApiPlan, submissionPlanToPlanData } from '../utils/planExport';
import ContextMenu from './ContextMenu';
import { createIntentFlowData, createStoryFlowData, getStatusColor, getStatusIcon } from '../utils/flowUtils';

const EditorContainer = styled.div`
  height: 100%;
  display: flex;
  position: relative;
`;

const FlowContainer = styled.div`
  flex: 1;
  height: 100%;
  background-color: #fafafa;
  position: relative;
`;

const SidePanel = styled.div`
  width: ${props => props.$width}px;
  background-color: white;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  z-index: 100;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  min-width: 250px;
  max-width: 600px;
`;

const ResizeHandle = styled.div`
  width: 4px;
  background-color: #e0e0e0;
  cursor: col-resize;
  position: relative;
  transition: background-color 0.2s;
  z-index: 101;

  &:hover {
    background-color: #3498db;
  }

  &:active {
    background-color: #2980b9;
  }

  &::before {
    content: '';
    position: absolute;
    left: -2px;
    right: -2px;
    top: 0;
    bottom: 0;
    background: transparent;
  }
`;

const NavigationOverlay = styled.div`
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.85rem;
  max-width: 400px;
`;

const BackButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const BreadcrumbText = styled.div`
  color: #374151;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SaveIndicator = styled.div`
  position: absolute;
  bottom: ${props => props.$showMiniMap ? '160px' : '24px'};
  right: ${props => props.$sidePanelWidth + 24}px;
  z-index: 1000;
  display: flex;
  gap: 12px;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid ${props => {
        if (props.$status === 'saving') return '#3b82f6';
        if (props.$status === 'saved') return '#10b981';
        if (props.$status === 'error') return '#ef4444';
        return '#e5e7eb';
    }};
  border-radius: 12px;
  padding: 12px 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: ${props => props.$visible ? 'translateY(0)' : 'translateY(100px)'};
  opacity: ${props => props.$visible ? 1 : 0};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.9rem;
  color: #374151;
  font-weight: 500;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const FloatingButtonContainer = styled.div`
  position: absolute;
  top: 24px;
  right: 24px;
  display: flex;
  flex-direction: row;
  gap: 8px;
  z-index: 1000;
`;

const FloatingButton = styled.button`
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 120px;

  &:hover {
    background: #f9fafb;
    border-color: #9ca3af;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const DownloadFloatingButton = styled(FloatingButton)`
  background: #f0f9ff;
  border-color: #bae6fd;
  color: #0369a1;

  &:hover:not(:disabled) {
    background: #e0f2fe;
    border-color: #7dd3fc;
  }
`;

const ReorganizeFloatingButton = styled(FloatingButton)`
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #2563eb;

  &:hover:not(:disabled) {
    background: #dbeafe;
    border-color: #93c5fd;
  }
`;

const ChangeIndicator = styled.div`
  background: #f59e0b;
  color: white;
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
`;

const SaveButton = styled.button`
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: #059669;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const DiscardButton = styled.button`
  background: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f9fafb;
    border-color: #9ca3af;
    color: #374151;
  }
`;

// Component to handle view alignment - must be inside ReactFlow
function ViewManager({ viewLevel, selectedIntentId, forceRefresh }) {
    const { fitView } = useReactFlow();
    const viewKey = `${viewLevel}-${selectedIntentId}-${forceRefresh}`;

    React.useEffect(() => {
        // Delay fitView to ensure nodes are rendered
        const timer = setTimeout(() => {
            fitView({ padding: 0.1, duration: 800 });
        }, 100);

        return () => clearTimeout(timer);
    }, [viewKey, fitView]);

    return null;
}

function PlanEditor() {
    const {
        planData,
        selectedNode,
        dispatch,
        editMode,
        executionView,
        loading,
        error,
        viewLevel,
        selectedIntentId,
        navigateToIntentView,
        navigateToStoryView,
        hasUnsavedChanges,
        pendingChanges,
        saveAllChanges,
        discardChanges,
        isDependencyAffected,
        isDirectlyEdited,
        isNewNode,
        isDeletedNode,
        getNodeState,
        // Undo/Redo
        undo,
        redo,
        canUndo,
        canRedo,
        undoHistory,
        clearUndoHistory,
        // Reset and storage
        resetToOriginal,
        getStorageInfo,
        // File system functions
        loadWorkFileFromDisk,
        saveToFileSystem,
        pushToFile,
        applyRemotePlanData,
        // Data source tracking
        dataSource,
        dataTimestamp,
        sessionTimestamp
    } = usePlan();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);

    // Enhanced node change handler to persist position changes
    const handleNodesChange = useCallback((changes) => {
        onNodesChange(changes);

        // Handle position changes - update the data model
        changes.forEach(change => {
            if (change.type === 'position' && change.position) {
                const node = nodes.find(n => n.id === change.id);
                if (node) {
                    if (node.type === 'story') {
                        // Update story position in data model
                        const story = planData?.stories?.find(s => s.id === change.id);
                        if (story) {
                            story.position = change.position;
                        }
                    } else if (node.type === 'intent') {
                        // Update intent position in data model
                        const intent = planData?.project?.roadmap?.intents?.find(i => i.id === change.id);
                        if (intent) {
                            intent.position = change.position;
                        }
                    }
                }
            }
        });
    }, [onNodesChange, nodes, planData]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Enhanced edge change handler to handle dependency removal
    const handleEdgesChange = useCallback((changes) => {
        onEdgesChange(changes);

        // Handle edge removals - remove corresponding dependencies
        changes.forEach(change => {
            if (change.type === 'remove' && viewLevel === 'story') {
                const edge = edges.find(e => e.id === change.id);
                if (edge && edge.source && edge.target) {
                    const targetStory = planData?.stories?.find(s => s.id === edge.target);
                    if (targetStory) {
                        const updatedDependencies = targetStory.dependencies.filter(dep =>
                            !(dep.type === 'story' && dep.id === edge.source)
                        );

                        if (updatedDependencies.length !== targetStory.dependencies.length) {
                            dispatch({
                                type: 'UPDATE_STORY',
                                payload: {
                                    id: edge.target,
                                    updates: {
                                        dependencies: updatedDependencies
                                    }
                                }
                            });
                        }
                    }
                }
            }
        });
    }, [onEdgesChange, viewLevel, edges, planData, dispatch]);
    // Load preferences from localStorage with defaults
    const loadPreference = (key, defaultValue) => {
        try {
            const saved = localStorage.getItem(`planEditor_${key}`);
            return saved !== null ? JSON.parse(saved) : defaultValue;
        } catch (error) {
            console.warn(`Failed to load preference ${key}:`, error);
            return defaultValue;
        }
    };

    // Save preference to localStorage
    const savePreference = (key, value) => {
        try {
            localStorage.setItem(`planEditor_${key}`, JSON.stringify(value));
        } catch (error) {
            console.warn(`Failed to save preference ${key}:`, error);
        }
    };

    const [sidePanelWidth, setSidePanelWidth] = useState(() => loadPreference('sidePanelWidth', 450));
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(() => loadPreference('sidePanelOpen', true));
    const [isResizing, setIsResizing] = useState(false);
    const [showStoryModal, setShowStoryModal] = useState(false);
    const [showIntentModal, setShowIntentModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);
    const [submissionMessage, setSubmissionMessage] = useState(null);

    useEffect(() => {
        if (!submissionMessage) {
            return;
        }
        const timer = setTimeout(() => setSubmissionMessage(null), 6000);
        return () => clearTimeout(timer);
    }, [submissionMessage]);
    const [showMiniMap, setShowMiniMap] = useState(() => loadPreference('showMiniMap', false));
    const [layoutDirection, setLayoutDirection] = useState(() => loadPreference('layoutDirection', 'TB'));
    const [isToolbarOpen, setIsToolbarOpen] = useState(() => loadPreference('toolbarOpen', false)); // collapsed by default
    const [forceRefresh, setForceRefresh] = useState(0); // Force refresh counter

    // Context menu state
    const [contextMenu, setContextMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        contextType: null, // 'canvas' or 'node'
        nodeData: null,
        position: null // For canvas context menu, store the clicked position
    });

    // Save status tracking for better UX feedback
    const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'

    // Use useRef to store the IntentNode component to ensure stable reference
    const IntentNodeWithExplore = useRef(null);

    // Create stable IntentNode component
    if (!IntentNodeWithExplore.current) {
        IntentNodeWithExplore.current = (props) => (
            <IntentNode
                {...props}
                onExplore={navigateToStoryView}
                onDoubleClick={navigateToStoryView}
            />
        );
    }

    // Memoize nodeTypes with stable references
    const nodeTypes = useMemo(() => ({
        story: StoryNode,
        checkpoint: CheckpointNode,
        milestone: CheckpointNode, // Legacy support
        intent: IntentNodeWithExplore.current,
    }), []); // Empty dependency array since we use ref for stable reference

    // Use a ref to track current nodes without causing re-renders
    const currentNodesRef = useRef([]);

    // Update the ref when nodes change
    React.useEffect(() => {
        currentNodesRef.current = nodes;
    }, [nodes]);

    // Create flow data when planData or view level changes
    const flowData = useMemo(() => {
        if (!planData) {
            return { nodes: [], edges: [] };
        }

        try {
            if (viewLevel === 'story' && selectedIntentId) {
                const result = createStoryFlowData(planData, selectedIntentId, {
                    editMode,
                    pendingChanges,
                    executionView,
                    isDependencyAffected,
                    isDirectlyEdited,
                    isNewNode,
                    isDeletedNode,
                    getNodeState,
                    existingNodes: currentNodesRef.current, // Use ref to avoid circular dependency
                    preservePositions: currentNodesRef.current.length > 0 // Only preserve if we have existing nodes
                });
                return result;
            } else {
                const result = createIntentFlowData(planData, {
                    editMode,
                    pendingChanges,
                    executionView,
                    isDependencyAffected,
                    isDirectlyEdited,
                    isNewNode,
                    isDeletedNode,
                    getNodeState,
                    existingNodes: currentNodesRef.current,
                    preservePositions: currentNodesRef.current.length > 0
                });
                return result;
            }
        } catch (error) {
            console.error('Error creating flow data:', error);
            return { nodes: [], edges: [] };
        }
    }, [planData, editMode, viewLevel, selectedIntentId, pendingChanges, executionView, isDependencyAffected, isDirectlyEdited, isNewNode, isDeletedNode, getNodeState, forceRefresh]);

    // Update nodes and edges when flow data changes
    React.useEffect(() => {
        if (flowData.nodes.length > 0 || flowData.edges.length > 0) {
            setNodes(flowData.nodes);
            setEdges(flowData.edges);
            // Update the current nodes reference for position preservation
            currentNodesRef.current = flowData.nodes;
        }
    }, [flowData, setNodes, setEdges]);

    // Function to force reorganization of the layout
    const forceReorganize = useCallback(() => {
        if (!planData) return;

        try {
            // Clear all stored positions from the data models to force hierarchical layout
            if (viewLevel === 'story' && selectedIntentId) {
                // Clear story positions
                planData.stories?.forEach(story => {
                    if (story.position) {
                        delete story.position;
                    }
                });
            } else {
                // Clear intent positions
                planData.project?.roadmap?.intents?.forEach(intent => {
                    if (intent.position) {
                        delete intent.position;
                    }
                });
            }

            // Clear existing nodes reference to force complete regeneration
            currentNodesRef.current = [];

            const reorganizedData = viewLevel === 'story' && selectedIntentId
                ? createStoryFlowData(planData, selectedIntentId, {
                    editMode,
                    pendingChanges,
                    executionView,
                    isDependencyAffected,
                    isDirectlyEdited,
                    isNewNode,
                    isDeletedNode,
                    getNodeState,
                    preservePositions: false, // Force reorganization
                    existingNodes: [] // No existing nodes to preserve
                })
                : createIntentFlowData(planData, {
                    editMode,
                    pendingChanges,
                    executionView,
                    isDependencyAffected,
                    isDirectlyEdited,
                    isNewNode,
                    isDeletedNode,
                    getNodeState,
                    preservePositions: false,
                    existingNodes: []
                });

            setNodes(reorganizedData.nodes);
            setEdges(reorganizedData.edges);

            // Force immediate refresh to ensure reorganization is visible and view is fitted
            setForceRefresh(prev => prev + 1);

            console.log(`Layout reorganized: ${reorganizedData.nodes.length} nodes positioned hierarchically`);
        } catch (error) {
            console.error('Error reorganizing layout:', error);
        }
    }, [planData, viewLevel, selectedIntentId, editMode, pendingChanges, executionView, isDependencyAffected, isDirectlyEdited, isNewNode, isDeletedNode, getNodeState, setNodes, setEdges, setForceRefresh]);

    const onConnect = useCallback((params) => {
        // Create actual dependency relationship in the data model first
        if (viewLevel === 'story' && params.source && params.target) {
            const sourceNode = nodes.find(n => n.id === params.source);
            const targetNode = nodes.find(n => n.id === params.target);

            if (sourceNode && targetNode && sourceNode.type === 'story' && targetNode.type === 'story') {
                // Add the source story as a dependency of the target story
                const targetStory = planData?.stories?.find(s => s.id === params.target);
                if (targetStory) {
                    const newDependency = {
                        type: 'story',
                        id: params.source
                    };

                    // Check if dependency already exists
                    const existingDep = (targetStory.dependencies || []).find(dep =>
                        dep.type === 'story' && dep.id === params.source
                    );

                    if (!existingDep) {
                        // Update the data model immediately - this will trigger flow data regeneration
                        dispatch({
                            type: 'UPDATE_STORY',
                            payload: {
                                id: params.target,
                                updates: {
                                    dependencies: [...(targetStory.dependencies || []), newDependency]
                                }
                            }
                        });

                        // Force immediate refresh to show the connection
                        setTimeout(() => {
                            setForceRefresh(prev => prev + 1);
                        }, 50);

                        // Note: No need to manually update edges here - the flow data regeneration will handle it
                        return;
                    }
                }
            }
        }

        // For non-story connections or if dependency creation failed, add edge manually
        setEdges((eds) => addEdge({
            ...params,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#94a3b8', strokeWidth: 2 }
        }, eds));
    }, [setEdges, viewLevel, nodes, planData, dispatch, setForceRefresh]);

    const onNodeClick = useCallback((event, node) => {
        // Set as selected (intent navigation is now handled by the explore button)
        dispatch({
            type: 'SET_SELECTED_NODE',
            payload: {
                id: node.id,
                type: node.type,
                data: node.data
            }
        });
    }, [dispatch]);

    const onPaneClick = useCallback(() => {
        dispatch({ type: 'SET_SELECTED_NODE', payload: null });
        setContextMenu(prev => ({ ...prev, visible: false }));
    }, [dispatch]);

    // Context menu handlers  
    const onPaneContextMenu = useCallback((event) => {
        event.preventDefault();

        // Only show context menu in story view for now
        if (viewLevel !== 'story') return;

        // Use DOM coordinates for now - we'll convert them properly in the flow utils
        const reactFlowBounds = event.currentTarget.getBoundingClientRect();
        const position = {
            x: event.clientX - reactFlowBounds.left,
            y: event.clientY - reactFlowBounds.top,
            // Store the raw screen coordinates too for potential conversion
            screenX: event.clientX,
            screenY: event.clientY
        };

        setContextMenu({
            visible: true,
            x: event.clientX,
            y: event.clientY,
            contextType: 'canvas',
            nodeData: null,
            position: position
        });
    }, [viewLevel]);

    const onNodeContextMenu = useCallback((event, node) => {
        event.preventDefault();
        event.stopPropagation();

        setContextMenu({
            visible: true,
            x: event.clientX,
            y: event.clientY,
            contextType: 'node',
            nodeData: node.data,
            position: null
        });
    }, []);

    const closeContextMenu = useCallback(() => {
        setContextMenu(prev => ({ ...prev, visible: false }));
    }, []);

    // Handle panel resizing
    const handleMouseDown = useCallback((e) => {
        setIsResizing(true);
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (!isResizing) return;

        const newWidth = Math.max(250, Math.min(600, window.innerWidth - e.clientX));
        setSidePanelWidth(newWidth);
        savePreference('sidePanelWidth', newWidth);
    }, [isResizing]);

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
    }, []);

    // Get current intent name for breadcrumb
    const currentIntent = viewLevel === 'story' && selectedIntentId && planData
        ? planData.project?.roadmap?.intents?.find(intent => intent.id === selectedIntentId)
        : null;

    React.useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isResizing, handleMouseMove, handleMouseUp]);

    // Enhanced save function with status tracking (applies changes, doesn't save to file)
    const handleSaveAll = useCallback(() => {
        if (!hasUnsavedChanges) return;

        setSaveStatus('saving');
        try {
            saveAllChanges();
            setSaveStatus('saved');
            // Reset to idle after showing success for 2 seconds
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
            console.error('Save failed:', error);
            setSaveStatus('error');
            // Reset to idle after showing error for 3 seconds
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    }, [saveAllChanges, hasUnsavedChanges]);

    // Enhanced push to file function with status tracking
    const handlePushToFile = useCallback(async () => {
        setSaveStatus('saving');
        try {
            const result = await pushToFile();
            if (result.success) {
                setSaveStatus('saved');
                // Reset to idle after showing success for 2 seconds
                setTimeout(() => setSaveStatus('idle'), 2000);
            } else if (!result.cancelled) {
                throw new Error(result.error || 'Push to file failed');
            } else {
                setSaveStatus('idle'); // User cancelled
            }
        } catch (error) {
            console.error('Push to file failed:', error);
            setSaveStatus('error');
            // Reset to idle after showing error for 3 seconds
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    }, [pushToFile]);

    // Clear storage function
    const handleClearStorage = useCallback(() => {
        const confirmed = window.confirm(
            'Are you sure you want to clear all storage? This will remove:\n' +
            '• Work file backup\n' +
            '• Undo/redo history\n' +
            '• Session storage\n' +
            '\nThis action cannot be undone.'
        );

        if (confirmed) {
            try {
                // Clear localStorage items
                localStorage.removeItem('plan-data-work_backup');
                localStorage.removeItem('plan-data-work_lastSaved');
                localStorage.removeItem('plan-data-work_saveLocation');
                localStorage.removeItem('plan-data-work_saveMethod');
                localStorage.removeItem('plan-data-original.json');
                localStorage.removeItem('plan-data-original_timestamp');

                // Clear sessionStorage
                sessionStorage.removeItem('planEditor_undoHistory');

                // Clear undo history in context
                clearUndoHistory();

                console.log('All storage cleared successfully');
                alert('Storage cleared successfully! The page will reload to reset to original data.');

                // Reload the page to start fresh
                window.location.reload();
            } catch (error) {
                console.error('Error clearing storage:', error);
                alert('Error clearing storage. Please try again.');
            }
        }
    }, [clearUndoHistory]);

    // Download current plan data as JSON
    const handleDownload = useCallback(() => {
        try {
            const dataToDownload = JSON.stringify(planData, null, 2);
            const blob = new Blob([dataToDownload], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `plan-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            console.log('Plan data downloaded successfully');
        } catch (error) {
            console.error('Error downloading plan data:', error);
            alert('Error downloading plan data. Please try again.');
        }
    }, [planData]);

    // Enhanced discard function with feedback
    const handleDiscardAll = useCallback(() => {
        const confirmDiscard = window.confirm(
            `Discard ${Object.keys(pendingChanges).length} unsaved changes?`
        );
        if (confirmDiscard) {
            discardChanges();
            setSaveStatus('idle');
        }
    }, [discardChanges, pendingChanges]);

    // Keyboard shortcuts for apply/discard/undo/redo
    React.useEffect(() => {
        const handleKeydown = (e) => {
            // Ctrl/Cmd + S to apply changes
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (hasUnsavedChanges) {
                    handleSaveAll();
                }
            }
            // Ctrl/Cmd + Z to undo (when no text input is focused)
            else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && !e.target.matches('input, textarea')) {
                e.preventDefault();
                if (canUndo) {
                    undo();
                }
            }
            // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z to redo (when no text input is focused)
            else if (((e.ctrlKey || e.metaKey) && e.key === 'y' ||
                (e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z') &&
                !e.target.matches('input, textarea')) {
                e.preventDefault();
                if (canRedo) {
                    redo();
                }
            }
            // Ctrl/Cmd + Shift + Delete to discard changes (when no text input is focused)
            else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Delete' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                if (hasUnsavedChanges) {
                    handleDiscardAll();
                }
            }
        };

        document.addEventListener('keydown', handleKeydown);
        return () => document.removeEventListener('keydown', handleKeydown);
    }, [hasUnsavedChanges, handleSaveAll, handleDiscardAll, canUndo, canRedo, undo, redo]);

    // Save preferences when component unmounts or page unloads
    React.useEffect(() => {
        const handleBeforeUnload = (e) => {
            savePreference('sidePanelWidth', sidePanelWidth);
            savePreference('showMiniMap', showMiniMap);
            savePreference('layoutDirection', layoutDirection);
            savePreference('sidePanelOpen', isSidePanelOpen);
            savePreference('toolbarOpen', isToolbarOpen);
            // Warn user about unapplied changes
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unapplied changes that will be lost. Are you sure you want to leave?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            // Save preferences on component unmount
            savePreference('sidePanelWidth', sidePanelWidth);
            savePreference('showMiniMap', showMiniMap);
            savePreference('layoutDirection', layoutDirection);
            savePreference('sidePanelOpen', isSidePanelOpen);
            savePreference('toolbarOpen', isToolbarOpen);
        };
    }, [sidePanelWidth, showMiniMap, layoutDirection, isSidePanelOpen, isToolbarOpen, hasUnsavedChanges]);

    // Toolbar handlers
    const handleToggleExecutionView = useCallback(() => {
        dispatch({ type: 'SET_EXECUTION_VIEW', payload: !executionView });
    }, [dispatch, executionView]);

    const handleCreateIntent = useCallback(({ intent, checkpoints }) => {
        dispatch({ type: 'ADD_INTENT', payload: { intent, checkpoints } });
        navigateToIntentView();
    }, [dispatch, navigateToIntentView]);

    const handlePlanImport = useCallback((plan) => {
        const timestamp = new Date().toISOString();
        let importedPlan = plan;

        if (!plan?.project && Array.isArray(plan?.intents)) {
            importedPlan = submissionPlanToPlanData(plan);
        }

        if (!importedPlan) {
            alert('Unable to import plan. The file format is not supported.');
            return;
        }

        applyRemotePlanData(importedPlan, {
            source: 'imported',
            dataTimestamp: timestamp,
            markAsChanged: true
        });
    }, [applyRemotePlanData]);

    const buildSubmitPayload = useCallback(() => {
        if (!planData) {
            return null;
        }

        const payload = planDataToApiPlan(planData, {
            autoApprove: false,
            baseRepoUrl: planData.project?.repo_url || '',
            baseBranch: planData.project?.repo_branch || 'main',
            defaultRunMode: planData.project?.default_run_mode || 'shadow'
        });

        if (!payload || !payload.intents?.length) {
            return null;
        }

        return payload;
    }, [planData]);

    const refreshFromBackend = useCallback(async () => {
        try {
            const result = await apiService.getProjectDataTransformed();
            if (result?.success) {
                applyRemotePlanData(result.data, {
                    source: 'api',
                    dataTimestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.warn('Failed to refresh plan after submission:', error);
        }
    }, [applyRemotePlanData]);

    const handleSubmitPlanToBackend = useCallback(async (execute = false) => {
        if (isSubmittingPlan) {
            return;
        }

        const connection = apiService.getConnectionStatus();
        if (!connection.isConnected) {
            alert('Connect to the backend before submitting the plan.');
            return;
        }

        const payload = buildSubmitPayload();
        if (!payload) {
            alert('Plan is empty or malformed. Please add intents and stories before submitting.');
            return;
        }

        setIsSubmittingPlan(true);
        setSubmissionMessage(null);

        try {
            const submission = await apiService.submitPlan(
                { intents: payload.intents },
                {
                    auto_approve: payload.auto_approve,
                    base_repo_url: payload.base_repo_url,
                    base_branch: payload.base_branch,
                    default_run_mode: payload.default_run_mode
                }
            );

            if (!submission?.success) {
                throw new Error(submission?.error || 'Plan submission failed');
            }

            let intentIds = [];
            if (submission.data?.intents) {
                intentIds = submission.data.intents
                    .map((intent) => intent.id)
                    .filter(Boolean);
            }

            if (execute) {
                if (!intentIds.length) {
                    const intentsResponse = await apiService.getIntents();
                    if (intentsResponse?.success) {
                        intentIds = intentsResponse.data
                            .map((intent) => intent.id)
                            .filter(Boolean);
                    }
                }

                if (intentIds.length) {
                    await apiService.approvePlan(intentIds, 'shadow');
                    setSubmissionMessage('Plan submitted and execution triggered.');
                } else {
                    setSubmissionMessage('Plan submitted, but no intents were found to approve.');
                }
            } else {
                setSubmissionMessage('Plan submitted to backend.');
            }

            await refreshFromBackend();
        } catch (error) {
            console.error('Plan submission error:', error);
            setSubmissionMessage(`Submission failed: ${error.message}`);
        } finally {
            setIsSubmittingPlan(false);
        }
    }, [buildSubmitPayload, isSubmittingPlan, refreshFromBackend]);

    const handleToggleMiniMap = useCallback(() => {
        setShowMiniMap(prev => {
            const newValue = !prev;
            savePreference('showMiniMap', newValue);
            return newValue;
        });
    }, []);

    const handleChangeLayout = useCallback((direction) => {
        setLayoutDirection(direction);
        savePreference('layoutDirection', direction);
    }, []);

    const handleDeleteStory = useCallback(() => {
        if (selectedNode && selectedNode.data.type === 'story') {
            const confirmDelete = window.confirm(
                `Are you sure you want to delete story "${selectedNode.data.objective}"?`
            );
            if (confirmDelete) {
                dispatch({ type: 'DELETE_STORY', payload: selectedNode.data.id });
            }
        }
    }, [dispatch, selectedNode]);



    const handleCreateStory = useCallback((storyData) => {
        const newStory = {
            id: `ST-${Date.now().toString(36)}`,
            objective: storyData.objective,
            intent_id: storyData.intent_id || '',
            workstream_id: storyData.workstream_id || '',
            acceptance_criteria: storyData.acceptance_criteria || [],
            dependencies: storyData.dependencies || [],
            implementation_notes: storyData.implementation_notes || [],
            estimated_tokens: storyData.estimated_tokens || null,
            complexity_score: storyData.complexity_score || 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            preferences: {
                preferred_agents: storyData.preferred_agents || [],
                execution_overrides: {
                    max_runtime_seconds: storyData.max_runtime_seconds || 3600,
                    require_manual_approval: storyData.require_manual_approval || false
                }
            },
            execution: {
                current: {
                    status: 'planned',
                    started_at: null,
                    ended_at: null,
                    duration_seconds: null,
                    agent_id: storyData.preferred_agents?.[0] || null,
                    branch: null,
                    commit_sha: null,
                    pr_number: null,
                    pr_url: null,
                    result: null,
                    messages_count: null
                },
                history: []
            }
        };

        dispatch({ type: 'ADD_STORY', payload: newStory });
        setShowStoryModal(false);
    }, [dispatch]);

    // Context menu action handlers
    const handleContextCreateStory = useCallback(() => {
        if (!contextMenu.position || !selectedIntentId) return;

        // Create a story with a default objective and set it to the clicked position
        const newStory = {
            id: `ST-${Date.now().toString(36)}`,
            objective: 'New Story',
            intent_id: selectedIntentId,
            workstream_id: '',
            acceptance_criteria: [],
            dependencies: [],
            implementation_notes: [],
            estimated_tokens: null,
            complexity_score: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            preferences: {
                preferred_agents: [],
                execution_overrides: {
                    max_runtime_seconds: 3600,
                    require_manual_approval: false
                }
            },
            execution: {
                current: {
                    status: 'planned',
                    started_at: null,
                    ended_at: null,
                    duration_seconds: null,
                    agent_id: null,
                    branch: null,
                    commit_sha: null,
                    pr_number: null,
                    pr_url: null,
                    result: null,
                    messages_count: null
                },
                history: []
            },
            // Store position for initial placement
            _tempPosition: contextMenu.position
        };

        dispatch({ type: 'ADD_STORY', payload: newStory });

        // Select the new story for immediate editing
        setTimeout(() => {
            dispatch({
                type: 'SET_SELECTED_NODE',
                payload: {
                    id: newStory.id,
                    type: 'story',
                    data: newStory
                }
            });
        }, 100);
    }, [contextMenu.position, selectedIntentId, dispatch]);

    const handleContextEditNode = useCallback((nodeData) => {
        // Select the node for editing in the properties panel
        dispatch({
            type: 'SET_SELECTED_NODE',
            payload: {
                id: nodeData.id,
                type: nodeData.type,
                data: nodeData
            }
        });
    }, [dispatch]);

    const handleContextDeleteNode = useCallback((nodeData) => {
        if (!nodeData || !nodeData.type || !nodeData.id) {
            console.error('Invalid nodeData for deletion:', nodeData);
            return;
        }

        if (nodeData.type === 'story') {
            const confirmDelete = window.confirm(
                `Are you sure you want to delete story "${nodeData.objective || nodeData.id}"?`
            );
            if (confirmDelete) {
                dispatch({ type: 'DELETE_STORY', payload: nodeData.id });
            }
        } else if (nodeData.type === 'checkpoint' || nodeData.type === 'milestone') {
            const confirmDelete = window.confirm(
                `Are you sure you want to delete checkpoint "${nodeData.name || nodeData.id}"?`
            );
            if (confirmDelete) {
                dispatch({ type: 'DELETE_CHECKPOINT', payload: nodeData.id });
            }
        } else if (nodeData.type === 'intent') {
            const confirmDelete = window.confirm(
                `Are you sure you want to delete intent "${nodeData.name || nodeData.id}"?`
            );
            if (confirmDelete) {
                dispatch({ type: 'DELETE_INTENT', payload: nodeData.id });
            }
        } else {
            console.warn('Unknown node type for deletion:', nodeData.type);
        }
    }, [dispatch]);

    // Debug function to validate dependency integrity
    const validateDependencyIntegrity = useCallback(() => {
        if (!planData || !editMode) return;

        // Check story dependencies
        planData.stories.forEach(story => {
            story.dependencies.forEach(dep => {
                const { type, id } = dep;
                let found = false;

                switch (type) {
                    case 'story':
                        found = planData.stories.some(s => s.id === id);
                        break;
                    case 'checkpoint':
                        found = planData.project.checkpoints.some(c => c.id === id);
                        break;
                    case 'intent':
                        found = planData.project.roadmap.intents.some(i => i.id === id);
                        break;
                    default:
                        console.warn(`Unknown dependency type: ${type}`);
                }

                if (!found) {
                    console.error(`Story ${story.id} has invalid ${type} dependency: ${id}`);
                }
            });
        });

        // Check checkpoint dependencies
        planData.project.checkpoints.forEach(checkpoint => {
            checkpoint.dependencies?.forEach(dep => {
                const { type, id } = dep;
                let found = false;

                switch (type) {
                    case 'story':
                        found = planData.stories.some(s => s.id === id);
                        break;
                    case 'checkpoint':
                        found = planData.project.checkpoints.some(c => c.id === id);
                        break;
                    case 'intent':
                        found = planData.project.roadmap.intents.some(i => i.id === id);
                        break;
                }

                if (!found) {
                    console.error(`Checkpoint ${checkpoint.id} has invalid ${type} dependency: ${id}`);
                }
            });
        });

        // Check intent dependencies
        planData.project.roadmap.intents.forEach(intent => {
            intent.dependencies?.forEach(dep => {
                const { type, id } = dep;
                let found = false;

                switch (type) {
                    case 'intent':
                        found = planData.project.roadmap.intents.some(i => i.id === id);
                        break;
                    case 'checkpoint':
                        found = planData.project.checkpoints.some(c => c.id === id);
                        break;
                }

                if (!found) {
                    console.error(`Intent ${intent.id} has invalid ${type} dependency: ${id}`);
                }
            });
        });
    }, [planData, editMode]);

    if (loading) {
        return (
            <EditorContainer>
                <FlowContainer style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div>Loading plan data...</div>
                </FlowContainer>
            </EditorContainer>
        );
    }

    if (error) {
        return (
            <EditorContainer>
                <FlowContainer style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ color: 'red' }}>Error loading plan: {error}</div>
                </FlowContainer>
            </EditorContainer>
        );
    }

    return (
        <EditorContainer>
            <FlowContainer>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={handleNodesChange}
                    onEdgesChange={handleEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    onPaneContextMenu={onPaneContextMenu}
                    onNodeContextMenu={onNodeContextMenu}
                    nodeTypes={nodeTypes}
                    fitView
                    attributionPosition="bottom-left"
                >
                    <ViewManager viewLevel={viewLevel} selectedIntentId={selectedIntentId} forceRefresh={forceRefresh} />
                    <Background />
                    <Controls />
                    {showMiniMap && (
                        <MiniMap
                            nodeStrokeColor="#3b82f6"
                            nodeColor="#e5e7eb"
                            nodeBorderRadius={8}
                            pannable
                            zoomable
                            position="bottom-right"
                        />
                    )}
                    <Panel position="top-left">
                        {isToolbarOpen ? (
                            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <div style={{ fontWeight: 600, color: '#374151', fontSize: 12 }}>Tools</div>
                                    <button
                                        onClick={() => { setIsToolbarOpen(false); savePreference('toolbarOpen', false); }}
                                        title="Collapse tools"
                                        style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: 6, padding: '2px 6px', cursor: 'pointer', fontSize: 12 }}
                                    >
                                        ⬅️
                                    </button>
                                </div>
                                <ToolbarPanel
                                    executionView={executionView}
                                    onToggleExecutionView={handleToggleExecutionView}
                                    showMiniMap={showMiniMap}
                                    onToggleMiniMap={handleToggleMiniMap}
                                    layoutDirection={layoutDirection}
                                    onChangeLayout={handleChangeLayout}
                                    selectedNode={selectedNode}
                                    onAddStory={() => setShowStoryModal(true)}
                                    onAddIntent={() => setShowIntentModal(true)}
                                    onImportPlan={() => setShowImportModal(true)}
                                    onSubmitPlan={() => handleSubmitPlanToBackend(false)}
                                    onSubmitAndExecute={() => handleSubmitPlanToBackend(true)}
                                    isSubmittingPlan={isSubmittingPlan}
                                    submissionMessage={submissionMessage}
                                    canUndo={canUndo}
                                    canRedo={canRedo}
                                    onUndo={undo}
                                    onRedo={redo}
                                    undoHistory={undoHistory}
                                    onReset={resetToOriginal}
                                    onClearStorage={handleClearStorage}
                                    getStorageInfo={getStorageInfo}
                                    dataSource={dataSource}
                                    dataTimestamp={dataTimestamp}
                                    sessionTimestamp={sessionTimestamp}
                                />
                            </div>
                        ) : (
                            <button
                                onClick={() => { setIsToolbarOpen(true); savePreference('toolbarOpen', true); }}
                                title="Show tools"
                                style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: '6px 10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer', fontSize: 12 }}
                            >
                                ⚙️ Tools
                            </button>
                        )}
                    </Panel>
                </ReactFlow>

                {/* Floating Action Buttons */}
                <FloatingButtonContainer>
                    <ReorganizeFloatingButton onClick={forceReorganize}>
                        🎯 Reorganize
                    </ReorganizeFloatingButton>
                    <DownloadFloatingButton onClick={handleDownload}>
                        📥 Download
                    </DownloadFloatingButton>
                </FloatingButtonContainer>

                {/* Context Menu */}
                <ContextMenu
                    visible={contextMenu.visible}
                    x={contextMenu.x}
                    y={contextMenu.y}
                    contextType={contextMenu.contextType}
                    nodeData={contextMenu.nodeData}
                    onCreateStory={handleContextCreateStory}
                    onEditNode={handleContextEditNode}
                    onDeleteNode={handleContextDeleteNode}
                    onClose={closeContextMenu}
                />

                {/* Navigation Overlay for Story View */}
                {viewLevel === 'story' && currentIntent && (
                    <NavigationOverlay>
                        <BackButton onClick={navigateToIntentView}>
                            ← Back
                        </BackButton>
                        <BreadcrumbText>
                            <span>📖 {currentIntent.name}</span>
                            <span style={{ color: '#6b7280' }}>Stories</span>
                        </BreadcrumbText>
                    </NavigationOverlay>
                )}
            </FlowContainer>

            <ResizeHandle onMouseDown={handleMouseDown} />

            <SidePanel $width={sidePanelWidth}>
                <NodePropertiesPanel selectedNode={selectedNode} />
            </SidePanel>

            <StoryCreationModal
                isOpen={showStoryModal}
                onClose={() => setShowStoryModal(false)}
                onCreateStory={handleCreateStory}
                intents={planData?.project?.roadmap?.intents || []}
                checkpoints={planData?.project?.checkpoints || []}
            />
            <IntentCreationModal
                isOpen={showIntentModal}
                onClose={() => setShowIntentModal(false)}
                onCreate={handleCreateIntent}
            />
            <PlanImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImport={handlePlanImport}
            />

            {/* Global Save Indicator */}
            <SaveIndicator
                $visible={hasUnsavedChanges || saveStatus !== 'idle'}
                $showMiniMap={showMiniMap}
                $sidePanelWidth={sidePanelWidth}
                $status={saveStatus}
            >
                {saveStatus === 'saving' && (
                    <>
                        <div style={{ animation: 'spin 1s linear infinite', fontSize: '1rem' }}>⏳</div>
                        <span>Applying changes...</span>
                    </>
                )}
                {saveStatus === 'saved' && (
                    <>
                        <div style={{ color: '#10b981', fontSize: '1rem' }}>✅</div>
                        <span style={{ color: '#10b981' }}>Changes applied!</span>
                    </>
                )}
                {saveStatus === 'error' && (
                    <>
                        <div style={{ color: '#ef4444', fontSize: '1rem' }}>❌</div>
                        <span style={{ color: '#ef4444' }}>Apply failed. Please try again.</span>
                        <SaveButton onClick={handleSaveAll}>
                            🔄 Retry
                        </SaveButton>
                    </>
                )}
                {saveStatus === 'idle' && hasUnsavedChanges && (
                    <>
                        <ChangeIndicator>
                            {Object.keys(pendingChanges).length}
                        </ChangeIndicator>
                        <span>
                            {Object.keys(pendingChanges).length === 1 ? 'change' : 'changes'} pending
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <SaveButton onClick={handleSaveAll} disabled={saveStatus === 'saving'}>
                                ✅ Apply Changes
                            </SaveButton>
                            <DiscardButton onClick={handleDiscardAll}>
                                Discard
                            </DiscardButton>
                        </div>
                    </>
                )}
            </SaveIndicator>
        </EditorContainer>
    );
}

export default PlanEditor; 
