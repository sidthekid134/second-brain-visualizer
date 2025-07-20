import React, { useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { usePlan } from '../context/PlanContext';
import StoryNode from './nodes/StoryNode';
import NodePropertiesPanel from './panels/NodePropertiesPanel';
import ToolbarPanel from './panels/ToolbarPanel';
import MilestonesPanel from './panels/MilestonesPanel';
import StoryCreationModal from './modals/StoryCreationModal';
import { createFlowData } from '../utils/flowUtils';

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
  width: ${props => props.width}px;
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

const MilestoneOverlay = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  max-width: 300px;
  ${props => props.collapsed && `
    width: auto;
  `}
`;

const nodeTypes = {
    story: StoryNode,
};

function PlanEditor() {
    const { planData, selectedNode, dispatch, editMode } = usePlan();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [showMiniMap, setShowMiniMap] = useState(false);
    const [layoutDirection, setLayoutDirection] = useState('TB'); // Top-Bottom
    const [milestonesCollapsed, setMilestonesCollapsed] = useState(false);
    const [showStoryModal, setShowStoryModal] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(350);
    const [isResizing, setIsResizing] = useState(false);

    // Create flow data when plan data changes
    const flowData = useMemo(() => {
        if (!planData) return { nodes: [], edges: [], milestones: [] };
        return createFlowData(planData, layoutDirection);
    }, [planData, layoutDirection]);

    // Update nodes and edges when flow data changes
    React.useEffect(() => {
        setNodes(flowData.nodes);
        setEdges(flowData.edges);
    }, [flowData, setNodes, setEdges]);

    // Comprehensive dependency update function
    const updateAllStoryDependencies = useCallback((sourceId, targetId, action) => {
        if (!planData || !sourceId || !targetId || sourceId === targetId) return;

        const sourceStory = planData.stories.find(s => s.id === sourceId);
        const targetStory = planData.stories.find(s => s.id === targetId);

        if (!sourceStory || !targetStory) {
            console.warn(`Story not found: source=${sourceId}, target=${targetId}`);
            return;
        }

        if (action === 'add') {
            // Add dependency: sourceId -> targetId means targetId depends on sourceId
            const sourceAlreadyDependent = targetStory.dependencies.includes(sourceId);

            if (!sourceAlreadyDependent) {
                dispatch({
                    type: 'UPDATE_DEPENDENCIES',
                    payload: {
                        storyId: targetId,
                        dependencies: [...targetStory.dependencies, sourceId]
                    }
                });
            }

            // Verify the connection was successful
            console.log(`Added dependency: ${sourceId} -> ${targetId}`);

        } else if (action === 'remove') {
            // Remove dependency
            dispatch({
                type: 'UPDATE_DEPENDENCIES',
                payload: {
                    storyId: targetId,
                    dependencies: targetStory.dependencies.filter(id => id !== sourceId)
                }
            });

            console.log(`Removed dependency: ${sourceId} -> ${targetId}`);
        }
    }, [planData, dispatch]);

    // Clean up all dependencies for a story that's being deleted
    const cleanupStoryDependencies = useCallback((storyIdToDelete) => {
        if (!planData) return;

        console.log(`Cleaning up dependencies for story: ${storyIdToDelete}`);

        // Find all stories that depend on this story
        planData.stories.forEach(story => {
            if (story.id === storyIdToDelete) return;

            const hasDependencyOnDeleted = story.dependencies.includes(storyIdToDelete);

            if (hasDependencyOnDeleted) {
                dispatch({
                    type: 'UPDATE_DEPENDENCIES',
                    payload: {
                        storyId: story.id,
                        dependencies: story.dependencies.filter(id => id !== storyIdToDelete)
                    }
                });
                console.log(`Cleaned up story ${story.id} dependencies`);
            }
        });
    }, [planData, dispatch]);

    const onConnect = useCallback(
        (params) => {
            if (!editMode) return;

            // Check if connection already exists
            const existingEdge = edges.find(
                edge => edge.source === params.source && edge.target === params.target
            );

            if (existingEdge) {
                console.warn(`Connection already exists: ${params.source} -> ${params.target}`);
                return;
            }

            // Prevent self-loops
            if (params.source === params.target) {
                console.warn('Cannot create self-loop');
                return;
            }

            const newEdge = {
                ...params,
                type: 'smoothstep',
                animated: false,
                style: { stroke: '#3498db', strokeWidth: 2 },
                markerEnd: {
                    type: 'arrowclosed',
                    color: '#3498db'
                }
            };

            setEdges((eds) => addEdge(newEdge, eds));

            // Update dependencies in the plan data
            updateAllStoryDependencies(params.source, params.target, 'add');
        },
        [editMode, edges, setEdges, updateAllStoryDependencies]
    );

    const onEdgesChangeHandler = useCallback(
        (changes) => {
            // Handle edge deletions before applying changes
            const edgesToDelete = changes.filter(change => change.type === 'remove');

            edgesToDelete.forEach(change => {
                const edge = edges.find(e => e.id === change.id);
                if (edge && editMode) {
                    console.log(`Removing edge: ${edge.source} -> ${edge.target}`);
                    updateAllStoryDependencies(edge.source, edge.target, 'remove');
                }
            });

            // Apply the changes to the edges
            onEdgesChange(changes);
        },
        [editMode, edges, onEdgesChange, updateAllStoryDependencies]
    );

    const onNodeClick = useCallback((event, node) => {
        dispatch({ type: 'SET_SELECTED_NODE', payload: node });
    }, [dispatch]);

    const onPaneClick = useCallback(() => {
        dispatch({ type: 'SET_SELECTED_NODE', payload: null });
    }, [dispatch]);

    const toggleEditMode = useCallback(() => {
        dispatch({ type: 'SET_EDIT_MODE', payload: !editMode });
    }, [editMode, dispatch]);

    const toggleMiniMap = useCallback(() => {
        setShowMiniMap(!showMiniMap);
    }, [showMiniMap]);

    const changeLayout = useCallback((direction) => {
        setLayoutDirection(direction);
    }, []);

    const handleAddStory = useCallback(() => {
        setShowStoryModal(true);
    }, []);

    const handleDeleteStory = useCallback(() => {
        if (selectedNode && selectedNode.data.type === 'story') {
            const storyId = selectedNode.data.id;

            console.log(`Deleting story: ${storyId}`);

            // Clean up all dependencies first
            cleanupStoryDependencies(storyId);

            // Then remove the story
            dispatch({ type: 'DELETE_STORY', payload: storyId });

            // Clear selection
            dispatch({ type: 'SET_SELECTED_NODE', payload: null });
        }
    }, [selectedNode, dispatch, cleanupStoryDependencies]);

    // Sidebar resize handlers
    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (!isResizing) return;

        const newWidth = window.innerWidth - e.clientX;
        const minWidth = 250;
        const maxWidth = 600;

        if (newWidth >= minWidth && newWidth <= maxWidth) {
            setSidebarWidth(newWidth);
        }
    }, [isResizing]);

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
    }, []);

    // Add/remove global mouse event listeners for resizing
    React.useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, handleMouseMove, handleMouseUp]);

    const handleCreateStory = useCallback((storyData) => {
        const newStory = {
            id: `ST-${Date.now().toString(36)}`,
            objective: storyData.objective,
            milestone: storyData.milestone || '',
            acceptance_criteria: storyData.acceptance_criteria || [],
            status: 'planned',
            owner_id: storyData.owner_id || '',
            dependencies: [],
            implementation_notes: storyData.implementation_notes || [],
            estimated_tokens: storyData.estimated_tokens || null,
            actual_tokens: null,
            complexity_score: storyData.complexity_score || 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            execution: {
                current: {
                    status: 'planned',
                    agent_id: storyData.owner_id || ''
                },
                history: []
            }
        };

        console.log(`Creating new story: ${newStory.id}`);
        dispatch({ type: 'ADD_STORY', payload: newStory });
        setShowStoryModal(false);
    }, [dispatch]);

    // Debug function to validate dependency integrity
    const validateDependencyIntegrity = useCallback(() => {
        if (!planData || !editMode) return;

        console.log('=== DEPENDENCY INTEGRITY CHECK ===');

        planData.stories.forEach(story => {
            // Check if all dependencies exist
            story.dependencies.forEach(depId => {
                const depStory = planData.stories.find(s => s.id === depId);
                if (!depStory) {
                    console.error(`Story ${story.id} has invalid dependency: ${depId}`);
                }
            });
        });

        console.log('=== END INTEGRITY CHECK ===');
    }, [planData, editMode]);

    // Run integrity check when plan data changes (in development)
    React.useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            validateDependencyIntegrity();
        }
    }, [planData, validateDependencyIntegrity]);

    if (!planData) {
        return (
            <EditorContainer>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    fontSize: '1.2rem',
                    color: '#666'
                }}>
                    Loading plan data...
                </div>
            </EditorContainer>
        );
    }

    return (
        <EditorContainer>
            <FlowContainer>
                <MilestoneOverlay collapsed={milestonesCollapsed}>
                    <MilestonesPanel
                        milestones={flowData.milestones || []}
                        collapsed={milestonesCollapsed}
                        onToggleCollapsed={() => setMilestonesCollapsed(!milestonesCollapsed)}
                    />
                </MilestoneOverlay>

                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChangeHandler}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    nodeTypes={nodeTypes}
                    connectionMode="loose"
                    fitView
                    fitViewOptions={{ padding: 0.1 }}
                    attributionPosition="bottom-left"
                    maxZoom={2}
                    minZoom={0.1}
                    deleteKeyCode={editMode ? ['Backspace', 'Delete'] : null}
                    defaultEdgeOptions={{
                        type: 'smoothstep',
                        animated: false,
                        style: { stroke: '#94a3b8', strokeWidth: 2 }
                    }}
                >
                    <Background color="#e2e8f0" size={1} />
                    <Controls />
                    {showMiniMap && (
                        <MiniMap
                            position="bottom-right"
                            nodeColor={(node) => {
                                switch (node.data.status) {
                                    case 'done':
                                    case 'completed':
                                        return '#10b981';
                                    case 'in_progress':
                                        return '#f59e0b';
                                    case 'planned':
                                        return '#6b7280';
                                    default:
                                        return '#94a3b8';
                                }
                            }}
                            maskColor="rgba(0, 0, 0, 0.1)"
                        />
                    )}

                    <Panel position="top-right">
                        <ToolbarPanel
                            editMode={editMode}
                            onToggleEditMode={toggleEditMode}
                            showMiniMap={showMiniMap}
                            onToggleMiniMap={toggleMiniMap}
                            layoutDirection={layoutDirection}
                            onChangeLayout={changeLayout}
                            selectedNode={selectedNode}
                            onAddStory={handleAddStory}
                            onDeleteStory={handleDeleteStory}
                        />
                    </Panel>
                </ReactFlow>
            </FlowContainer>

            <ResizeHandle onMouseDown={handleMouseDown} />

            <SidePanel width={sidebarWidth}>
                <NodePropertiesPanel selectedNode={selectedNode} />
            </SidePanel>

            {showStoryModal && (
                <StoryCreationModal
                    isOpen={showStoryModal}
                    onClose={() => setShowStoryModal(false)}
                    onCreateStory={handleCreateStory}
                    milestones={flowData.milestones || []}
                />
            )}
        </EditorContainer>
    );
}

export default PlanEditor; 