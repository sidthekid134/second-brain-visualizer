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
import { planDataToApiPlan } from '../utils/planExport';
import StoryNode from './nodes/StoryNode';
import CheckpointNode from './nodes/MilestoneNode';
import IntentNode from './nodes/IntentNode';
import NodePropertiesPanel from './panels/NodePropertiesPanel';
import StoryCreationModal from './modals/StoryCreationModal';
import IntentCreationModal from './modals/IntentCreationModal';
import ErrorOverlay from './modals/ErrorOverlay';
import apiService from '../services/apiService';
import ContextMenu from './ContextMenu';
import { createIntentFlowData, createStoryFlowData } from '../utils/flowUtils';

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
  background: rgba(255, 255, 255, 0.5);
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
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: flex-start;
  gap: 8px;
  z-index: 1000;
  max-width: 300px;
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
  position: relative;

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
  min-width: auto;
  padding: 10px;
  width: 40px;
  height: 40px;
  justify-content: center;

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

const FlowCanvas = styled.div`
  height: 100%;
  box-sizing: border-box;
  padding-top: ${props => props.$topPadding}px;
  position: relative;
`;

const SubmissionToast = styled.div`
  position: absolute;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.9);
  color: white;
  padding: 12px 18px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.3);
  z-index: 1100;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  animation: fadeInUp 0.3s ease;

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translate(-50%, -10px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
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
            fitView({ padding: 0.1, duration: 300 });
        }, 50);

        return () => clearTimeout(timer);
    }, [viewKey, fitView]);

    return null;
}

function PlanEditor({ onRequestTabChange, onRegisterActions }) {
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
        getEntityWithPendingChanges,
        stageChanges,
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
                        // Update story position in data model (new schema)
                        for (const intent of (planData?.project?.roadmap?.intents || [])) {
                            if (intent.stories) {
                                const story = intent.stories.find(s => s.id === change.id);
                                if (story) {
                                    story.position = change.position;
                                    break;
                                }
                            }
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
            if (change.type === 'remove') {
                const edge = edges.find(e => e.id === change.id);
                if (edge && edge.source && edge.target) {

                    // Handle story-to-story dependency removal
                    if (viewLevel === 'story') {
                        // Find the target story in the new schema (within intents)
                        let targetStory = null;
                        for (const intent of (planData?.project?.roadmap?.intents || [])) {
                            if (intent.stories) {
                                const story = intent.stories.find(s => s.id === edge.target);
                                if (story) {
                                    targetStory = story;
                                    break;
                                }
                            }
                        }

                        if (targetStory) {
                            const updatedDependencies = targetStory.dependencies.filter(dep =>
                                !(dep.type === 'story' && dep.id === edge.source)
                            );

                            if (updatedDependencies.length !== targetStory.dependencies.length) {
                                // Use staging system for dependency updates to ensure proper change tracking
                                stageChanges('story', edge.target, {
                                    dependencies: updatedDependencies,
                                    updated_at: new Date().toISOString()
                                }, targetStory);
                            }
                        }
                    }

                    // Handle intent-to-intent dependency removal
                    if (viewLevel === 'intent') {
                        const targetIntent = planData?.project?.roadmap?.intents?.find(intent => intent.id === edge.target);

                        if (targetIntent) {
                            const updatedDependencies = (targetIntent.dependencies || []).filter(dep =>
                                !(dep.type === 'intent' && dep.id === edge.source)
                            );

                            if (updatedDependencies.length !== (targetIntent.dependencies || []).length) {
                                // Use staging system for dependency updates to ensure proper change tracking
                                stageChanges('intent', edge.target, {
                                    dependencies: updatedDependencies,
                                    updated_at: new Date().toISOString()
                                }, targetIntent);
                            }
                        }
                    }
                }
            }
        });
    }, [onEdgesChange, viewLevel, edges, planData, stageChanges]);
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
    const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);
    const [submissionMode, setSubmissionMode] = useState(null);
    const [submissionMessage, setSubmissionMessage] = useState(null);
    const [submissionError, setSubmissionError] = useState(null);

    useEffect(() => {
        if (!submissionMessage) {
            setSubmissionMode(null);
            return;
        }
        const timer = setTimeout(() => {
            setSubmissionMessage(null);
            setSubmissionMode(null);
        }, 6000);
        return () => clearTimeout(timer);
    }, [submissionMessage]);
    const [showMiniMap, setShowMiniMap] = useState(() => loadPreference('showMiniMap', false));
    const [layoutDirection, setLayoutDirection] = useState(() => loadPreference('layoutDirection', 'TB'));
    const [forceRefresh, setForceRefresh] = useState(0); // Force refresh counter

    // Context menu state
    const [contextMenu, setContextMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        contextType: null, // 'canvas' or 'node'
        nodeData: null,
        position: null, // For canvas context menu, store the clicked position
        canvasMode: 'intent'
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
            if (viewLevel === 'story') {
                if (!selectedIntentId) {
                    const placeholder = {
                        nodes: [],
                        edges: []
                    };
                    return placeholder;
                }
                const result = createStoryFlowData(planData, selectedIntentId, {
                    editMode,
                    pendingChanges,
                    executionView,
                    isDependencyAffected,
                    isDirectlyEdited,
                    isNewNode,
                    isDeletedNode,
                    getNodeState,
                    getEntityWithPendingChanges,
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
                    getEntityWithPendingChanges,
                    existingNodes: currentNodesRef.current,
                    preservePositions: currentNodesRef.current.length > 0
                });
                return result;
            }
        } catch (error) {
            console.error('Error creating flow data:', error);
            return { nodes: [], edges: [] };
        }
    }, [planData, editMode, viewLevel, selectedIntentId, pendingChanges, executionView, isDependencyAffected, isDirectlyEdited, isNewNode, isDeletedNode, getNodeState, getEntityWithPendingChanges, forceRefresh]);

    // Update nodes and edges when flow data changes
    React.useEffect(() => {
        setNodes(flowData.nodes);
        setEdges(flowData.edges);
        currentNodesRef.current = flowData.nodes;
    }, [flowData, setNodes, setEdges]);

    // Function to force reorganization of the layout
    const forceReorganize = useCallback(() => {
        if (!planData) return;

        try {
            // Clear all stored positions from the data models to force hierarchical layout
            if (viewLevel === 'story' && selectedIntentId) {
                // Clear story positions in the new schema
                const intent = planData.project?.roadmap?.intents?.find(i => i.id === selectedIntentId);
                if (intent && intent.stories) {
                    intent.stories.forEach(story => {
                        if (story.position) {
                            delete story.position;
                        }
                    });
                }
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
                    getEntityWithPendingChanges,
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
                    getEntityWithPendingChanges,
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
    }, [planData, viewLevel, selectedIntentId, editMode, pendingChanges, executionView, isDependencyAffected, isDirectlyEdited, isNewNode, isDeletedNode, getNodeState, getEntityWithPendingChanges, setNodes, setEdges, setForceRefresh]);

    const onConnect = useCallback((params) => {
        // Create actual dependency relationship in the data model first
        if (viewLevel === 'story' && params.source && params.target) {
            const sourceNode = nodes.find(n => n.id === params.source);
            const targetNode = nodes.find(n => n.id === params.target);

            if (sourceNode && targetNode && sourceNode.type === 'story' && targetNode.type === 'story') {
                // Find the target story in the new schema (within intents)
                let targetStory = null;
                for (const intent of (planData?.project?.roadmap?.intents || [])) {
                    if (intent.stories) {
                        const story = intent.stories.find(s => s.id === params.target);
                        if (story) {
                            targetStory = story;
                            break;
                        }
                    }
                }

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

        // Handle intent-to-intent connections when in intent view
        if (viewLevel === 'intent' && params.source && params.target) {
            const sourceNode = nodes.find(n => n.id === params.source);
            const targetNode = nodes.find(n => n.id === params.target);

            if (sourceNode && targetNode && sourceNode.type === 'intent' && targetNode.type === 'intent') {
                // Find the target intent
                const targetIntent = planData?.project?.roadmap?.intents?.find(intent => intent.id === params.target);

                if (targetIntent) {
                    const newDependency = {
                        type: 'intent',
                        id: params.source
                    };

                    // Check if dependency already exists
                    const existingDep = (targetIntent.dependencies || []).find(dep =>
                        dep.type === 'intent' && dep.id === params.source
                    );

                    if (!existingDep) {
                        // Update the data model immediately - this will trigger flow data regeneration
                        dispatch({
                            type: 'UPDATE_INTENT',
                            payload: {
                                id: params.target,
                                updates: {
                                    dependencies: [...(targetIntent.dependencies || []), newDependency]
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

        // For non-matching connections or if dependency creation failed, add edge manually
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
            position: position,
            canvasMode: viewLevel
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

    const pendingChangeCount = Object.keys(pendingChanges).length;

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

    const buildSubmitPayload = useCallback(() => {
        if (!planData) {
            return null;
        }

        const payload = planDataToApiPlan(planData, {
            autoApprove: false,
            baseRepoUrl: planData.project?.repo_url || '',
            baseBranch: planData.project?.repo_branch || 'main',
            defaultRunMode: planData.project?.default_run_mode || 'shadow',
            planId: planData.project?.id || `plan_${Date.now()}`,
            preserveExistingIds: true
        });

        if (!payload || !payload.plan?.project?.roadmap?.intents?.length) {
            return null;
        }

        return payload;
    }, [planData]);

    // Enhanced save function with status tracking (applies changes and auto-stages to backend)
    const handleSaveAll = useCallback(async () => {
        console.log('🔄 handleSaveAll called, hasUnsavedChanges:', hasUnsavedChanges);
        if (!hasUnsavedChanges) return;

        setSaveStatus('saving');
        let hasSubmissionError = false;

        try {
            // DON'T apply changes locally yet - wait for successful backend submission
            console.log('📤 Preparing to submit changes to backend...');

            // Auto-stage to backend first
            const connection = apiService.getConnectionStatus();
            console.log('🔗 Backend connection status:', connection);

            if (connection.isConnected) {
                // Build payload with updated data after applying changes
                const updatedPlanData = { ...planData };

                // Apply pending changes to get the most up-to-date data
                Object.values(pendingChanges).forEach(pendingChange => {
                    const { entityType, entityId, changes } = pendingChange;

                    if (entityType === 'plan') {
                        return;
                    }

                    if (entityType === 'story') {
                        if (changes._deleted) {
                            // Actually delete the story from intents (new schema)
                            updatedPlanData.project.roadmap.intents = updatedPlanData.project.roadmap.intents.map(intent => {
                                if (intent.stories) {
                                    return {
                                        ...intent,
                                        stories: intent.stories.filter(story => story.id !== entityId)
                                    };
                                }
                                return intent;
                            });
                            // Remove dependencies on the deleted story from all remaining stories
                            updatedPlanData.project.roadmap.intents = updatedPlanData.project.roadmap.intents.map(intent => {
                                if (intent.stories) {
                                    return {
                                        ...intent,
                                        stories: intent.stories.map(story => ({
                                            ...story,
                                            dependencies: (story.dependencies || []).filter(dep =>
                                                !(dep.type === 'story' && dep.id === entityId)
                                            )
                                        }))
                                    };
                                }
                                return intent;
                            });
                            // Also clean up checkpoint story_ids
                            if (updatedPlanData.project?.checkpoints) {
                                updatedPlanData.project.checkpoints = updatedPlanData.project.checkpoints.map(checkpoint => ({
                                    ...checkpoint,
                                    story_ids: (checkpoint.story_ids || []).filter(id => id !== entityId)
                                }));
                            }
                        } else {
                            // Regular update - find and update story in intents
                            updatedPlanData.project.roadmap.intents = updatedPlanData.project.roadmap.intents.map(intent => {
                                if (intent.stories) {
                                    return {
                                        ...intent,
                                        stories: intent.stories.map(story =>
                                            story.id === entityId ? {
                                                ...story,
                                                ...changes,
                                                updated_at: new Date().toISOString()
                                            } : story
                                        )
                                    };
                                }
                                return intent;
                            });
                        }
                    } else if (entityType === 'checkpoint') {
                        if (changes._deleted) {
                            // Actually delete the checkpoint
                            updatedPlanData.project.checkpoints = updatedPlanData.project.checkpoints.filter(
                                checkpoint => checkpoint.id !== entityId
                            );
                            // Remove dependencies on the deleted checkpoint from stories (new schema)
                            updatedPlanData.project.roadmap.intents = updatedPlanData.project.roadmap.intents.map(intent => {
                                if (intent.stories) {
                                    return {
                                        ...intent,
                                        stories: intent.stories.map(story => ({
                                            ...story,
                                            dependencies: (story.dependencies || []).filter(dep =>
                                                !(dep.type === 'checkpoint' && dep.id === entityId)
                                            )
                                        }))
                                    };
                                }
                                return intent;
                            });
                        } else {
                            // Regular update
                            updatedPlanData.project.checkpoints = updatedPlanData.project.checkpoints.map(checkpoint =>
                                checkpoint.id === entityId ? {
                                    ...checkpoint,
                                    ...changes
                                } : checkpoint
                            );
                        }
                    } else if (entityType === 'intent') {
                        if (changes._deleted) {
                            // Actually delete the intent
                            updatedPlanData.project.roadmap.intents = updatedPlanData.project.roadmap.intents.filter(
                                intent => intent.id !== entityId
                            );
                            // Remove dependencies from stories within remaining intents (new schema)
                            updatedPlanData.project.roadmap.intents = updatedPlanData.project.roadmap.intents.map(intent => {
                                if (intent.stories) {
                                    return {
                                        ...intent,
                                        stories: intent.stories.map(story => ({
                                            ...story,
                                            dependencies: (story.dependencies || []).filter(dep =>
                                                !(dep.type === 'intent' && dep.id === entityId)
                                            )
                                        }))
                                    };
                                }
                                return intent;
                            });
                        } else {
                            // Regular update
                            updatedPlanData.project.roadmap.intents = updatedPlanData.project.roadmap.intents.map(intent =>
                                intent.id === entityId ? {
                                    ...intent,
                                    ...changes
                                } : intent
                            );
                        }
                    }
                });

                const payload = planDataToApiPlan(updatedPlanData, {
                    autoApprove: false,
                    baseRepoUrl: updatedPlanData.project?.repo_url || '',
                    baseBranch: updatedPlanData.project?.repo_branch || 'main',
                    defaultRunMode: updatedPlanData.project?.default_run_mode || 'shadow',
                    planId: updatedPlanData.project?.id || `plan_${Date.now()}`,
                    preserveExistingIds: true
                });
                console.log('📦 Built payload:', payload);

                if (payload && payload.plan?.project?.roadmap?.intents?.length > 0) {
                    try {
                        console.log('🚀 Submitting to backend...');
                        const submission = await apiService.submitPlan(
                            payload,
                            {
                                auto_approve: false,
                                base_repo_url: payload.base_repo_url,
                                base_branch: payload.base_branch,
                                default_run_mode: payload.default_run_mode,
                                plan_id: payload.plan_id,
                                preserve_existing_ids: true
                            }
                        );

                        console.log('📤 Backend submission result:', submission);

                        if (submission?.success) {
                            // Only now apply changes locally after successful backend submission
                            console.log('💾 Backend submission successful, applying changes locally...');
                            saveAllChanges();
                            setSaveStatus('saved');
                            setSubmissionMessage('Changes applied and staged to backend');
                            console.log('✅ Successfully saved and staged changes');
                        } else {
                            console.warn('❌ Failed to stage changes to backend:', submission?.error);
                            // Don't save locally when staging fails - show error instead
                            setSaveStatus('error');

                            // Show detailed error overlay for validation failures
                            const isValidationError = submission?.status === 422;
                            setSubmissionError({
                                message: isValidationError
                                    ? 'Plan Validation Failed'
                                    : 'Backend Staging Failed',
                                details: submission?.details || submission?.error || 'Unknown error occurred',
                                timestamp: new Date().toISOString(),
                                allowRetry: true
                            });
                            hasSubmissionError = true;
                            return; // Don't proceed with timeout reset
                        }
                    } catch (backendError) {
                        console.error('💥 Backend staging failed:', backendError);
                        // For network/connection errors, save locally but show warning
                        console.log('💾 Backend error, applying changes locally...');
                        saveAllChanges();
                        setSaveStatus('saved');
                        setSubmissionMessage('Changes saved locally (backend unavailable)');

                        // Show a less severe notification for network issues
                        console.warn('⚠️ Backend unavailable - changes saved locally only');
                    }
                } else {
                    console.log('⚠️ No valid payload to submit');
                    console.log('💾 No backend payload, applying changes locally...');
                    saveAllChanges();
                    setSaveStatus('saved');
                    setSubmissionMessage('Changes applied locally');
                }
            } else {
                console.log('🔌 Backend not connected');
                console.log('💾 Backend not connected, applying changes locally...');
                saveAllChanges();
                setSaveStatus('saved');
                setSubmissionMessage('Changes applied locally (backend not connected)');
            }

            // Only reset timeout if we don't have submission errors
            if (!hasSubmissionError) {
                // Reset to idle after showing success for 3 seconds
                console.log('⏰ Setting timeout to reset status...');
                setTimeout(() => {
                    console.log('🔄 Resetting save status to idle');
                    setSaveStatus('idle');
                    setSubmissionMessage(null);
                }, 3000);
            }
        } catch (error) {
            console.error('💥 Save failed:', error);
            setSaveStatus('error');
            // Reset to idle after showing error for 3 seconds
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    }, [saveAllChanges, hasUnsavedChanges, planData, pendingChanges]);

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
        };
    }, [sidePanelWidth, showMiniMap, layoutDirection, isSidePanelOpen, hasUnsavedChanges]);

    const handleCreateIntent = useCallback(({ intent, checkpoints }) => {
        dispatch({ type: 'ADD_INTENT', payload: { intent, checkpoints } });
        navigateToIntentView();
    }, [dispatch, navigateToIntentView]);

    const refreshFromBackend = useCallback(async () => {
        try {
            const result = await apiService.getProjectDataTransformed();
            if (result?.success) {
                applyRemotePlanData(result.data, {
                    source: 'api',
                    dataTimestamp: new Date().toISOString()
                });
                return result.data;
            }
        } catch (error) {
            console.warn('Failed to refresh plan after submission:', error);
        }
        return null;
    }, [applyRemotePlanData]);

    const refreshFromBackendWithProjectId = useCallback(async (projectId) => {
        console.log('🔄 Refreshing with project ID:', projectId);
        try {
            const result = await apiService.getPlan(projectId);
            console.log('🔄 getPlan result:', result);

            if (result?.success) {
                // Validate the data format before applying
                const isValid = apiService.validateNewSchemaData(result.data);
                console.log('🔄 Data validation result:', isValid);

                if (isValid) {
                    console.log('🔄 Applying remote plan data:', result.data);
                    applyRemotePlanData(result.data, {
                        source: 'api',
                        dataTimestamp: new Date().toISOString()
                    });
                    return result.data;
                } else {
                    console.error('🔄 Invalid data format received from getPlan:', result.data);
                    return null;
                }
            } else {
                console.error('🔄 getPlan failed:', result.error);
            }
        } catch (error) {
            console.warn('Failed to refresh plan after submission:', error);
        }
        return null;
    }, [applyRemotePlanData]);

    const handlePlanSubmission = useCallback(async ({ execute = false } = {}) => {
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

        setSubmissionMode(execute ? 'execute' : 'stage');
        setIsSubmittingPlan(true);
        setSubmissionMessage(null);
        let submissionSucceeded = false;

        try {
            const submission = await apiService.submitPlan(
                payload,
                {
                    auto_approve: payload.auto_approve,
                    base_repo_url: payload.base_repo_url,
                    base_branch: payload.base_branch,
                    default_run_mode: payload.default_run_mode,
                    plan_id: payload.plan_id,
                    preserve_existing_ids: true
                }
            );

            if (!submission?.success) {
                throw new Error(submission?.error || 'Plan submission failed');
            }

            console.log('📝 Plan submission response:', submission);

            let intentIds = [];
            // Extract project ID from the submission response
            // The API returns a project summary with an 'id' field
            let projectId = submission.data?.id ||
                submission.data?.project_id ||
                payload.plan?.project?.id ||
                planData?.project?.id;

            console.log('📋 Submission response structure:', {
                hasId: !!submission.data?.id,
                hasProjectId: !!submission.data?.project_id,
                submissionData: submission.data
            });
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

                // For new schema, we execute stories directly rather than approving intents
                // This is a placeholder - in the new schema, story execution is handled differently
                setSubmissionMessage('Plan submitted successfully. Story execution can be managed individually.');
            } else {
                setSubmissionMessage('Changes staged with backend.');
            }

            // Refresh with the specific project ID from submission response
            console.log('🔄 Project ID extracted:', projectId);
            console.log('🔄 Current plan data before refresh:', planData);

            const refreshed = projectId ? await refreshFromBackendWithProjectId(projectId) : await refreshFromBackend();
            console.log('🔄 Refresh result:', refreshed ? 'success' : 'failed');

            if (refreshed) {
                console.log('🔄 Plan data after refresh:', refreshed);
                navigateToIntentView();
            } else {
                console.log('🔄 Refresh failed, keeping current data');
            }
            submissionSucceeded = true;
        } catch (error) {
            console.error('Plan submission error:', error);

            // Show error overlay instead of submission message
            setSubmissionError({
                message: error.message || 'Plan submission failed',
                details: error.stack || JSON.stringify(error, null, 2),
                timestamp: new Date().toISOString()
            });
        } finally {
            setIsSubmittingPlan(false);
            if (submissionSucceeded && execute && typeof onRequestTabChange === 'function') {
                onRequestTabChange('execution');
            }
        }
    }, [buildSubmitPayload, isSubmittingPlan, refreshFromBackend, refreshFromBackendWithProjectId, navigateToIntentView, onRequestTabChange, planData]);

    useEffect(() => {
        if (!onRegisterActions) {
            return;
        }

        const actions = {
            execute: {
                label: 'Start Execution',
                busyLabel: 'Starting…',
                icon: '🚀',
                onClick: () => handlePlanSubmission({ execute: true }),
                disabled: isSubmittingPlan || hasUnsavedChanges, // Disable if there are unsaved changes
                busy: isSubmittingPlan && submissionMode === 'execute'
            }
        };

        onRegisterActions(actions);
    }, [onRegisterActions, handlePlanSubmission, isSubmittingPlan, submissionMode, hasUnsavedChanges, pendingChangeCount]);

    useEffect(() => {
        if (!onRegisterActions) {
            return undefined;
        }

        return () => {
            onRegisterActions(null);
        };
    }, [onRegisterActions]);

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
            },
            intent_id: storyData.intent_id || selectedIntentId || '' // Add intent_id for backward compatibility
        };

        dispatch({ type: 'ADD_STORY', payload: newStory });
        setShowStoryModal(false);
    }, [dispatch, selectedIntentId]);

    // Context menu action handlers
    const handleContextCreateStory = useCallback(() => {
        if (!contextMenu.position || !selectedIntentId) return;

        // Create a story with a default objective and set it to the clicked position
        const newStory = {
            id: `ST-${Date.now().toString(36)}`,
            objective: 'New Story',
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
            intent_id: selectedIntentId, // Add intent_id for backward compatibility
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

    const handleContextCreateIntent = useCallback(() => {
        setShowIntentModal(true);
    }, []);

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

        // Check story dependencies (new schema - stories are within intents)
        planData.project?.roadmap?.intents?.forEach(intent => {
            if (intent.stories) {
                intent.stories.forEach(story => {
                    story.dependencies.forEach(dep => {
                        const { type, id } = dep;
                        let found = false;

                        switch (type) {
                            case 'story':
                                // Check if story exists in any intent
                                found = planData.project?.roadmap?.intents?.some(i =>
                                    i.stories && i.stories.some(s => s.id === id)
                                );
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
            }
        });

        // Check checkpoint dependencies
        planData.project.checkpoints.forEach(checkpoint => {
            checkpoint.dependencies?.forEach(dep => {
                const { type, id } = dep;
                let found = false;

                switch (type) {
                    case 'story':
                        // Check if story exists in any intent (new schema)
                        found = planData.project?.roadmap?.intents?.some(i =>
                            i.stories && i.stories.some(s => s.id === id)
                        );
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
                    case 'story':
                        // Check if story exists in any intent (new schema)
                        found = planData.project?.roadmap?.intents?.some(i =>
                            i.stories && i.stories.some(s => s.id === id)
                        );
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

    const topPadding = viewLevel === 'story' && currentIntent ? 96 : 32;

    return (
        <EditorContainer>
            <FlowContainer>
                {submissionMessage && (
                    <SubmissionToast>
                        <span>
                            {submissionMessage.toLowerCase().includes('failed')
                                ? '⚠️'
                                : submissionMode === 'execute'
                                    ? '🚀'
                                    : submissionMode === 'stage'
                                        ? '📤'
                                        : 'ℹ️'}
                        </span>
                        <span>{submissionMessage}</span>
                    </SubmissionToast>
                )}
                <FlowCanvas $topPadding={topPadding}>
                    <ReactFlow
                        style={{ height: '100%' }}
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
                        fitViewOptions={{ duration: 200, padding: 0.1 }}
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
                    </ReactFlow>
                </FlowCanvas>

                {/* Floating Action Buttons */}
                <FloatingButtonContainer>
                    <ReorganizeFloatingButton onClick={forceReorganize}>
                        🎯 Reorganize
                    </ReorganizeFloatingButton>
                    <DownloadFloatingButton
                        onClick={handleDownload}
                        title="Download plan"
                        aria-label="Download plan"
                    >
                        📥
                    </DownloadFloatingButton>
                </FloatingButtonContainer>

                {/* Context Menu */}
                <ContextMenu
                    visible={contextMenu.visible}
                    x={contextMenu.x}
                    y={contextMenu.y}
                    contextType={contextMenu.contextType}
                    nodeData={contextMenu.nodeData}
                    onCreateStory={viewLevel === 'story' && selectedIntentId ? handleContextCreateStory : null}
                    onCreateIntent={viewLevel === 'intent' ? handleContextCreateIntent : null}
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
            <ErrorOverlay
                isOpen={!!submissionError}
                onClose={() => {
                    setSubmissionError(null);
                    // Reset save status to allow retry
                    setSaveStatus('idle');
                }}
                onClearDraft={() => {
                    // Clear all pending changes and drafts
                    discardChanges();
                    setSubmissionError(null);
                    setSaveStatus('idle');
                }}
                title={submissionError?.message || "Staging Failed"}
                message={submissionError?.message === 'Plan Validation Failed'
                    ? 'The plan contains validation errors that prevent staging. Please fix the issues in your plan and try saving again. Your changes have been preserved.'
                    : 'Failed to stage changes to the backend. Your changes have been preserved - you can continue editing and try saving again, or check your connection and retry.'
                }
                details={submissionError?.details}
                showClearDraft={hasUnsavedChanges}
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
                        <span>Saving & staging changes...</span>
                    </>
                )}
                {saveStatus === 'saved' && (
                    <>
                        <div style={{ color: '#10b981', fontSize: '1rem' }}>✅</div>
                        <span style={{ color: '#10b981' }}>Changes saved & staged!</span>
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
                                {saveStatus === 'saving' ? '⏳ Saving & Staging...' : '✅ Save & Stage Changes'}
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
