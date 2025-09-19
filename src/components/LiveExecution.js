import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import ReactFlow, {
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { usePlan } from '../context/PlanContext';
import StoryNode from './nodes/StoryNode';
import MilestoneNode from './nodes/MilestoneNode';
import IntentNode from './nodes/IntentNode';
import { createIntentFlowData, getStatusColor, getStatusIcon } from '../utils/flowUtils';
import apiService from '../services/apiService';

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

const EventList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const EventsDock = styled.div`
  position: absolute;
  bottom: 24px;
  right: 24px;
  width: 320px;
  max-height: 45%;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1100;
  backdrop-filter: blur(6px);
`;

const EventsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: rgba(248, 250, 252, 0.85);
  font-weight: 600;
  color: #0f172a;
`;

const EventsBody = styled.div`
  padding: 12px 16px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const EventItem = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 12px;
  background: #ffffff;
  font-size: 0.75rem;
  line-height: 1.3;
`;

const EventHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  color: #4b5563;
`;

const EventRun = styled.span`
  font-weight: 600;
  font-size: 0.75rem;
`;

const EventTimestamp = styled.span`
  font-size: 0.7rem;
  color: #6b7280;
`;

const EventKind = styled.div`
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const EventPayload = styled.pre`
  margin: 6px 0 0 0;
  padding: 6px;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 0.7rem;
  max-height: 120px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
`;

const EventEmptyState = styled.div`
  font-size: 0.8rem;
  color: #64748b;
  padding: 16px;
  text-align: center;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px dashed #cbd5f5;
`;

const EventError = styled.div`
  font-size: 0.75rem;
  color: #b91c1c;
  padding: 8px 0;
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
const LaneLabelNode = ({ data }) => (
    <div style={{
        padding: '10px 16px',
        borderRadius: '999px',
        background: 'rgba(15, 23, 42, 0.85)',
        color: 'white',
        fontWeight: 600,
        fontSize: '0.85rem',
        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.3)',
        pointerEvents: 'none'
    }}>
        {data.icon || '🎯'} {data.title}
    </div>
);

const createNodeTypes = (navigateToStoryView) => ({
    story: (props) => <StoryNode {...props} isExecutionView={true} />,
    milestone: (props) => <MilestoneNode {...props} isExecutionView={true} />,
    checkpoint: (props) => <MilestoneNode {...props} isExecutionView={true} />,
    intent: (props) => <IntentNode {...props} isExecutionView={true} onExplore={navigateToStoryView} onDoubleClick={navigateToStoryView} />,
    lane: LaneLabelNode
});

const buildStoryLaneFlow = (planData) => {
    if (!planData) {
        return { nodes: [], edges: [] };
    }

    const intents = planData.project?.roadmap?.intents || [];
    const nodes = [];
    const edges = [];

    const laneSpacing = 380;
    const storySpacing = 200;
    const offsetX = intents.length > 1 ? ((intents.length - 1) * laneSpacing) / 2 : 0;

    intents.forEach((intent, index) => {
        const laneX = index * laneSpacing - offsetX;
        nodes.push({
            id: `lane-${intent.id}`,
            type: 'lane',
            position: { x: laneX, y: -140 },
            data: {
                title: intent.name,
                icon: intent.execution?.current?.status === 'in_progress' ? '⚡' : '🎯'
            },
            draggable: false,
            selectable: false
        });

        const storiesInIntent = intent.stories || [];

        storiesInIntent.forEach((story, storyIndex) => {
            const y = storyIndex * storySpacing;
            nodes.push({
                id: story.id,
                type: 'story',
                position: { x: laneX, y },
                data: {
                    ...story,
                    type: 'story',
                    layoutDirection: 'TB',
                    executionView: true,
                    executionStatus: story.execution?.current?.status || story.status || 'planned',
                    execution: story.execution
                }
            });
        });
    });

    // Process all stories for dependencies
    intents.forEach(intent => {
        if (intent.stories) {
            intent.stories.forEach(story => {
                if (!story.dependencies) return;
                story.dependencies.forEach(dep => {
                    if (dep.type === 'story') {
                        const sourceExists = nodes.some(node => node.id === dep.id);
                        const targetExists = nodes.some(node => node.id === story.id);
                        if (sourceExists && targetExists) {
                            edges.push({
                                id: `${dep.id}->${story.id}`,
                                source: dep.id,
                                target: story.id,
                                type: 'smoothstep',
                                style: {
                                    stroke: '#38bdf8',
                                    strokeWidth: 2
                                },
                                markerEnd: {
                                    type: 'arrowclosed',
                                    color: '#38bdf8'
                                }
                            });
                        }
                    }
                });
            });
        }
    });

    return { nodes, edges };
};

function LiveExecution() {
    const {
        planData,
        navigateToStoryView
    } = usePlan();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [viewMode, setViewMode] = useState('lanes');
    const [eventsByRun, setEventsByRun] = useState({});
    const [eventsError, setEventsError] = useState(null);
    const [isFetchingEvents, setIsFetchingEvents] = useState(false);

    // Create node types with navigation
    const nodeTypes = React.useMemo(() => createNodeTypes(navigateToStoryView), [navigateToStoryView]);

    // Use plan data for live execution view
    const executionData = planData;

    // Create flow data for live execution
    const flowData = React.useMemo(() => {
        if (!executionData) return { nodes: [], edges: [] };

        try {
            if (viewMode === 'intents') {
                return createIntentFlowData(executionData, {
                    editMode: false,
                    executionView: true
                });
            }

            return buildStoryLaneFlow(executionData);
        } catch (error) {
            console.error('Error creating flow data:', error);
            return { nodes: [], edges: [] };
        }
    }, [executionData, viewMode]);

    const runIds = React.useMemo(() => {
        if (!executionData) return [];

        const ids = new Set();

        executionData.project?.roadmap?.intents?.forEach(intent => {
            const runId = intent?.api_raw?.run_id || intent?.api_raw?.runId || intent?.run_id;
            if (runId) ids.add(runId);

            // Also check stories within the intent
            if (intent.stories) {
                intent.stories.forEach(story => {
                    const storyRunId = story?.api_raw?.run_id || story?.run_id;
                    if (storyRunId) ids.add(storyRunId);
                });
            }
        });

        return Array.from(ids);
    }, [executionData]);

    // Update nodes and edges when flow data changes
    React.useEffect(() => {
        setNodes(flowData.nodes);
        setEdges(flowData.edges);
    }, [flowData, setNodes, setEdges]);

    const formatTimestamp = React.useCallback((value) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '—';
        }
        return date.toLocaleTimeString();
    }, []);

    useEffect(() => {
        let isMounted = true;

        if (!runIds.length) {
            setEventsByRun({});
            setEventsError(null);
            return undefined;
        }

        const fetchEvents = async () => {
            const status = apiService.getConnectionStatus();
            if (!status.isConnected) {
                if (isMounted) {
                    setIsFetchingEvents(false);
                    setEventsError('Connect to the API to monitor live execution.');
                }
                return;
            }

            if (isMounted) {
                setIsFetchingEvents(true);
            }

            try {
                const result = await apiService.getRunEventsForRuns(runIds, { limit: 50 });

                if (!isMounted) return;

                if (result.success) {
                    setEventsByRun(result.data || {});
                    setEventsError(null);
                    setLastUpdate(new Date());
                } else if (result.error) {
                    setEventsError(result.error);
                }

                if (result.errors && Object.keys(result.errors).length && isMounted) {
                    setEventsError(prev => prev || 'Some runs failed to return events.');
                }
            } catch (error) {
                if (isMounted) {
                    setEventsError(error.message);
                }
            } finally {
                if (isMounted) {
                    setIsFetchingEvents(false);
                }
            }
        };

        const pollingInterval = Math.max(apiService.pollingFrequency || 5000, 5000);
        fetchEvents();
        const intervalId = setInterval(fetchEvents, pollingInterval);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [runIds]);

    const flattenedEvents = React.useMemo(() => {
        const aggregated = [];

        Object.entries(eventsByRun).forEach(([runId, events]) => {
            if (!Array.isArray(events)) return;
            events.forEach(event => {
                aggregated.push({ ...event, run_id: event.run_id || runId });
            });
        });

        return aggregated.sort((a, b) => {
            const first = new Date(a.ts || 0).getTime();
            const second = new Date(b.ts || 0).getTime();
            return second - first;
        });
    }, [eventsByRun]);

    const displayedEvents = React.useMemo(() => flattenedEvents.slice(0, 20), [flattenedEvents]);

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

    // Extract stories by status from plan data (new schema - stories are within intents)
    const allStories = [];
    if (executionData?.project?.roadmap?.intents) {
        executionData.project.roadmap.intents.forEach(intent => {
            if (intent.stories) {
                intent.stories.forEach(story => {
                    allStories.push({
                        ...story,
                        intent_id: intent.id
                    });
                });
            }
        });
    }
    const runningStories = allStories.filter(s => s.execution?.current?.status === 'in_progress');

    const executionStatus = {
        completion_percentage: executionData?.project?.progress?.completion_percentage || 0,
        total_stories: allStories.length,
        total_agents: executionData?.agents?.length || 0
    };
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
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        nodeTypes={nodeTypes}
                        fitView
                        fitViewOptions={{ duration: 200, padding: 0.1 }}
                        attributionPosition="bottom-left"
                        maxZoom={2}
                        minZoom={0.1}
                        nodesDraggable={false}
                        nodesConnectable={false}
                        elementsSelectable={true}
                    >
                        <Background color="#e2e8f0" size={1} />
                        <Controls />

                        <Panel position="top-right">
                            <div style={{
                                background: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '10px',
                                padding: '8px',
                                boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)',
                                display: 'flex',
                                gap: '6px'
                            }}>
                                <button
                                    onClick={() => setViewMode('lanes')}
                                    style={{
                                        background: viewMode === 'lanes' ? '#3b82f6' : 'white',
                                        color: viewMode === 'lanes' ? 'white' : '#374151',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        padding: '6px 10px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                    title="Show stories grouped by intent"
                                >
                                    🗂️ Lanes
                                </button>
                                <button
                                    onClick={() => setViewMode('intents')}
                                    style={{
                                        background: viewMode === 'intents' ? '#3b82f6' : 'white',
                                        color: viewMode === 'intents' ? 'white' : '#374151',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        padding: '6px 10px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                    title="Show high-level intent dependencies"
                                >
                                    🔭 Overview
                                </button>
                            </div>
                        </Panel>
                    </ReactFlow>
                </FlowContainer>

                <EventsDock>
                    <EventsHeader>
                        <span>📡 Run Events</span>
                        <span style={{ fontSize: '0.75rem', color: '#475569' }}>
                            {isFetchingEvents ? 'Refreshing…' : lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : 'Waiting for data'}
                        </span>
                    </EventsHeader>
                    <EventsBody>
                        {eventsError ? (
                            <EventError>{eventsError}</EventError>
                        ) : displayedEvents.length === 0 ? (
                            <EventEmptyState>
                                {runIds.length
                                    ? 'No recent events yet. Approvals may still be pending.'
                                    : 'Stage a plan and start execution to stream events.'}
                            </EventEmptyState>
                        ) : (
                            <EventList>
                                {displayedEvents.map(event => (
                                    <EventItem key={`${event.run_id}-${event.id || event.ts}`}>
                                        <EventHeader>
                                            <EventRun>Run {event.run_id}</EventRun>
                                            <EventTimestamp>{formatTimestamp(event.ts)}</EventTimestamp>
                                        </EventHeader>
                                        <EventKind>
                                            <span>{getStatusIcon(event.status || event.kind)}</span>
                                            <span>{event.kind?.replace(/_/g, ' ') || 'event'}</span>
                                        </EventKind>
                                        {event.payload && Object.keys(event.payload).length > 0 && (
                                            <EventPayload>{JSON.stringify(event.payload, null, 2)}</EventPayload>
                                        )}
                                    </EventItem>
                                ))}
                            </EventList>
                        )}
                    </EventsBody>
                </EventsDock>
            </MainContent>
        </ExecutionContainer>
    );
}

export default LiveExecution; 
