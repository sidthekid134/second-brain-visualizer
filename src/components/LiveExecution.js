import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { usePlan } from '../context/PlanContext';
import StoryNode from './nodes/StoryNode';
import MilestoneNode from './nodes/MilestoneNode';
import IntentNode from './nodes/IntentNode';
import { createIntentFlowData, createStoryFlowData, getStatusColor, getStatusIcon } from '../utils/flowUtils';

const ExecutionContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const CompactHeader = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const ProjectInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const ProjectTitle = styled.h2`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const CompactMetrics = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 0.85rem;
`;

const Metric = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.15);
  padding: 4px 10px;
  border-radius: 16px;
  font-weight: 500;
`;

const MetricValue = styled.span`
  font-weight: 700;
  font-size: 0.9rem;
`;

const LiveIndicatorHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(16, 185, 129, 0.2);
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 0.8rem;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
`;

const FlowContainer = styled.div`
  flex: 1;
  height: 100%;
  background-color: #fafafa;
  position: relative;
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

const LivePanel = styled.div`
  width: ${props => props.$width}px;
  background: white;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  min-width: 250px;
  max-width: 500px;
`;

const ExecutionResizeHandle = styled.div`
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

const PanelHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8fafc;
`;

const PanelTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
`;

const PanelContent = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
`;

const ExecutionSection = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.h4`
  margin: 0 0 8px 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StoryItem = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }
`;

const StoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
`;

const StoryId = styled.div`
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.7rem;
  color: #6b7280;
  font-weight: 500;
`;

const StoryStatus = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: ${props => getStatusColor(props.$status)};
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 0.6rem;
  font-weight: 600;
`;

const StoryTitle = styled.div`
  font-size: 0.8rem;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
`;

const StoryMeta = styled.div`
  font-size: 0.7rem;
  color: #6b7280;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  margin: 8px 0;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${props => getStatusColor(props.$status)};
  width: ${props => props.$progress}%;
  transition: width 0.3s ease;
`;

const LiveIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #10b981;
  font-weight: 500;
`;

const Pulse = styled.div`
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
  }
`;

// Custom node types with execution view flag and navigation
const createNodeTypes = (navigateToStoryView) => ({
    story: (props) => <StoryNode {...props} isExecutionView={true} />,
    milestone: (props) => <MilestoneNode {...props} isExecutionView={true} />,
    checkpoint: (props) => <MilestoneNode {...props} isExecutionView={true} />,
    intent: (props) => <IntentNode {...props} isExecutionView={true} onExplore={navigateToStoryView} onDoubleClick={navigateToStoryView} />,
});

function LiveExecution() {
    const {
        planData,
        viewLevel,
        selectedIntentId,
        navigateToIntentView,
        navigateToStoryView
    } = usePlan();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [layoutDirection, setLayoutDirection] = useState('TB');
    const [sidebarWidth, setSidebarWidth] = useState(300);
    const [isResizing, setIsResizing] = useState(false);
    const [showMiniMap, setShowMiniMap] = useState(false);

    // Create node types with navigation
    const nodeTypes = React.useMemo(() => createNodeTypes(navigateToStoryView), [navigateToStoryView]);

    // Use plan data for live execution view
    const executionData = planData;

    // Create flow data for live execution
    const flowData = React.useMemo(() => {
        if (!executionData) return { nodes: [], edges: [] };

        try {
            if (viewLevel === 'story' && selectedIntentId) {
                return createStoryFlowData(executionData, selectedIntentId, { editMode: false });
            } else {
                return createIntentFlowData(executionData, { editMode: false });
            }
        } catch (error) {
            console.error('Error creating flow data:', error);
            return { nodes: [], edges: [] };
        }
    }, [executionData, layoutDirection, viewLevel, selectedIntentId]);

    // Update nodes and edges when flow data changes
    React.useEffect(() => {
        setNodes(flowData.nodes);
        setEdges(flowData.edges);
    }, [flowData, setNodes, setEdges]);

    // Add layout direction change handler
    const changeLayout = React.useCallback((direction) => {
        setLayoutDirection(direction);
    }, []);

    // Add MiniMap toggle handler
    const toggleMiniMap = React.useCallback(() => {
        setShowMiniMap(!showMiniMap);
    }, [showMiniMap]);

    // Sidebar resize handlers
    const handleMouseDown = React.useCallback((e) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const handleMouseMove = React.useCallback((e) => {
        if (!isResizing) return;

        const newWidth = window.innerWidth - e.clientX;
        const minWidth = 250;
        const maxWidth = 500;

        if (newWidth >= minWidth && newWidth <= maxWidth) {
            setSidebarWidth(newWidth);
        }
    }, [isResizing]);

    const handleMouseUp = React.useCallback(() => {
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

    useEffect(() => {
        // Simulate live updates
        const interval = setInterval(() => {
            setLastUpdate(new Date());
        }, 5000); // Update every 5 seconds

        return () => clearInterval(interval);
    }, []);



    if (!executionData) {
        return (
            <ExecutionContainer>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    fontSize: '1.2rem',
                    color: '#666'
                }}>
                    No execution data available...
                </div>
            </ExecutionContainer>
        );
    }

    const projectInfo = executionData?.project;
    const executionStatus = {
        completion_percentage: executionData?.project?.progress?.completion_percentage || 0,
        total_stories: executionData?.stories?.length || 0,
        total_agents: executionData?.agents?.length || 0
    };

    // Get current intent name for breadcrumb
    const currentIntent = viewLevel === 'story' && selectedIntentId && executionData
        ? executionData.project?.roadmap?.intents?.find(intent => intent.id === selectedIntentId)
        : null;

    // Extract stories by status from plan data
    const allStories = executionData?.stories || [];
    const runningStories = allStories.filter(s => s.status === 'in_progress');
    const readyStories = allStories.filter(s => s.status === 'planned');
    const completedStories = allStories.filter(s => s.status === 'done');

    return (
        <ExecutionContainer>
            <CompactHeader>
                <ProjectInfo>
                    <ProjectTitle>{projectInfo?.name || 'Execution Monitor'}</ProjectTitle>
                    <LiveIndicatorHeader>
                        <Pulse />
                        Live Execution
                    </LiveIndicatorHeader>
                </ProjectInfo>

                <CompactMetrics>
                    <Metric>
                        📊 <MetricValue>{Math.round(executionStatus.completion_percentage || 0)}%</MetricValue>
                    </Metric>
                    <Metric>
                        🔄 <MetricValue>{runningStories.length}</MetricValue>
                    </Metric>
                    <Metric>
                        📚 <MetricValue>{executionStatus.total_stories || 0}</MetricValue>
                    </Metric>
                    <Metric>
                        🤖 <MetricValue>{executionStatus.total_agents || 0}</MetricValue>
                    </Metric>
                </CompactMetrics>
            </CompactHeader>

            <MainContent>
                <FlowContainer>
                    {/* Navigation Overlay for Story View */}
                    {viewLevel === 'story' && currentIntent && (
                        <NavigationOverlay>
                            <BackButton onClick={navigateToIntentView}>
                                ← Back
                            </BackButton>
                            <BreadcrumbText>
                                <span>📖 {currentIntent.name}</span>
                                <span style={{ color: '#6b7280' }}>Stories (Live)</span>
                            </BreadcrumbText>
                        </NavigationOverlay>
                    )}

                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        nodeTypes={nodeTypes}
                        fitView
                        fitViewOptions={{ padding: 0.1 }}
                        attributionPosition="bottom-left"
                        maxZoom={2}
                        minZoom={0.1}
                        nodesDraggable={false}
                        nodesConnectable={false}
                        elementsSelectable={true}
                    >
                        <Background color="#e2e8f0" size={1} />
                        <Controls />
                        {showMiniMap && (
                            <MiniMap
                                position="bottom-right"
                                nodeColor={(node) => getStatusColor(node.data.status)}
                                maskColor="rgba(0, 0, 0, 0.1)"
                            />
                        )}

                        <Panel position="top-right">
                            <div style={{
                                background: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                padding: '8px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                display: 'flex',
                                gap: '4px'
                            }}>
                                <button
                                    onClick={() => changeLayout('TB')}
                                    style={{
                                        background: layoutDirection === 'TB' ? '#3b82f6' : 'white',
                                        color: layoutDirection === 'TB' ? 'white' : '#374151',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                    title="Top-Bottom Layout"
                                >
                                    ⬇️
                                </button>
                                <button
                                    onClick={() => changeLayout('LR')}
                                    style={{
                                        background: layoutDirection === 'LR' ? '#3b82f6' : 'white',
                                        color: layoutDirection === 'LR' ? 'white' : '#374151',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                    title="Left-Right Layout"
                                >
                                    ➡️
                                </button>
                                <button
                                    onClick={toggleMiniMap}
                                    style={{
                                        background: showMiniMap ? '#3b82f6' : 'white',
                                        color: showMiniMap ? 'white' : '#374151',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                    title="Toggle MiniMap"
                                >
                                    🗺️
                                </button>
                            </div>
                        </Panel>
                    </ReactFlow>
                </FlowContainer>

                <ExecutionResizeHandle onMouseDown={handleMouseDown} />

                <LivePanel $width={sidebarWidth}>
                    <PanelHeader>
                        <PanelTitle>
                            <LiveIndicator>
                                <Pulse />
                                Live Execution
                            </LiveIndicator>
                        </PanelTitle>
                    </PanelHeader>

                    <PanelContent>
                        {runningStories.length > 0 && (
                            <ExecutionSection>
                                <SectionTitle>
                                    🔄 Currently Running ({runningStories.length})
                                </SectionTitle>
                                {runningStories.map(story => (
                                    <StoryItem key={story.id}>
                                        <StoryHeader>
                                            <StoryId>{story.id}</StoryId>
                                            <StoryStatus $status={story.status}>
                                                {getStatusIcon(story.status)}
                                                {story.status}
                                            </StoryStatus>
                                        </StoryHeader>
                                        <StoryTitle>{story.objective}</StoryTitle>
                                        <ProgressBar>
                                            <ProgressFill $progress={50} $status={story.status} />
                                        </ProgressBar>
                                        <StoryMeta>
                                            <span>👤 {story.owner}</span>
                                            <span>{story.priority} priority</span>
                                        </StoryMeta>
                                    </StoryItem>
                                ))}
                            </ExecutionSection>
                        )}

                        {readyStories.length > 0 && (
                            <ExecutionSection>
                                <SectionTitle>
                                    📋 Ready to Start ({readyStories.length})
                                </SectionTitle>
                                {readyStories.slice(0, 5).map(story => (
                                    <StoryItem key={story.id}>
                                        <StoryHeader>
                                            <StoryId>{story.id}</StoryId>
                                            <StoryStatus status="planned">
                                                📋 planned
                                            </StoryStatus>
                                        </StoryHeader>
                                        <StoryTitle>{story.objective}</StoryTitle>
                                        <StoryMeta>
                                            <span>👤 {story.owner}</span>
                                            <span>{story.estimated_tokens} tokens</span>
                                        </StoryMeta>
                                    </StoryItem>
                                ))}
                            </ExecutionSection>
                        )}

                        {completedStories.length > 0 && (
                            <ExecutionSection>
                                <SectionTitle>
                                    ✅ Complete ({completedStories.length})
                                </SectionTitle>
                                {completedStories.map(story => (
                                    <StoryItem key={story.id}>
                                        <StoryHeader>
                                            <StoryId>{story.id}</StoryId>
                                            <StoryStatus status="done">
                                                ✅ done
                                            </StoryStatus>
                                        </StoryHeader>
                                        <StoryTitle>{story.objective}</StoryTitle>
                                        <ProgressBar>
                                            <ProgressFill progress={100} status="done" />
                                        </ProgressBar>
                                        <StoryMeta>
                                            <span>👤 {story.owner_id || story.owner}</span>
                                            <span>{story.actual_tokens || story.estimated_tokens} tokens</span>
                                        </StoryMeta>
                                    </StoryItem>
                                ))}
                            </ExecutionSection>
                        )}

                        <div style={{
                            fontSize: '0.7rem',
                            color: '#6b7280',
                            textAlign: 'center',
                            marginTop: '20px',
                            padding: '10px',
                            borderTop: '1px solid #e5e7eb'
                        }}>
                            Last updated: {lastUpdate.toLocaleTimeString()}
                        </div>
                    </PanelContent>
                </LivePanel>
            </MainContent>
        </ExecutionContainer>
    );
}

export default LiveExecution; 