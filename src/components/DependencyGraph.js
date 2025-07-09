import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    ConnectionLineType,
    Position,
    Handle
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import 'reactflow/dist/base.css';
import styled from 'styled-components';

const GraphContainer = styled.div`
    width: 100%;
    height: 100vh;
    background: #f8f9fa;
    position: relative;
    flex: 1;
    display: flex;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
`;

// Dagre graph configuration
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

// Increase node dimensions and spacing
const NODE_WIDTH = 280;
const NODE_HEIGHT = 160;
const RANK_SPACING = 200;  // Horizontal spacing between levels
const NODE_SPACING = 100;  // Vertical spacing between nodes

const getLayoutedElements = (nodes, edges, direction = 'LR') => {
    const isHorizontal = direction === 'LR';

    // Clear the graph before adding new nodes
    dagreGraph.setGraph({
        rankdir: direction,
        nodesep: NODE_SPACING,
        ranksep: RANK_SPACING,
        rankwidth: NODE_WIDTH,
        edgesep: 50,
        marginx: 50,
        marginy: 50,
        acyclicer: 'greedy',     // Handle cycles in the graph
        ranker: 'network-simplex' // Use network simplex algorithm for better layout
    });

    // Add nodes to the dagre graph
    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    // Add edges to the dagre graph
    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    // Calculate the layout
    dagre.layout(dagreGraph);

    // Get the positioned nodes from dagre
    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - NODE_WIDTH / 2,
                y: nodeWithPosition.y - NODE_HEIGHT / 2,
            },
            // Ensure consistent port positions for edges
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
        };
    });

    return {
        nodes: layoutedNodes,
        edges: edges.map(edge => ({
            ...edge,
            type: 'smoothstep',
            animated: false,
            style: {
                stroke: getBorderColor(nodes.find(n => n.id === edge.source)?.data?.story?.status || 'default'),
                strokeWidth: 3,  // Thicker edges
                cursor: 'pointer'
            }
        }))
    };
};

// Color scheme for milestones
const milestoneColors = {
    'Project Setup': '#e3f2fd',
    'Component Creation': '#f3e5f5',
    'Feature Implementation': '#e8f5e8',
    'Styling': '#fff3e0',
    'Testing': '#fce4ec',
    'Documentation': '#f1f8e9',
    'default': '#f8f9fa'
};

const getStatusColor = (status) => {
    switch (status) {
        case 'done': return '#d4edda';      // Light green background for completed
        case 'pending': return '#cce5ff';    // Light blue background for pending
        case 'failed': return '#fff3cd';     // Light yellow background for failed
        default: return '#f8f9fa';
    }
};

const getStatusTextColor = (status) => {
    switch (status) {
        case 'done': return '#155724';      // Dark green text for completed
        case 'pending': return '#004085';    // Dark blue text for pending
        case 'failed': return '#856404';     // Dark yellow text for failed
        default: return '#333';
    }
};

const getBorderColor = (status) => {
    switch (status) {
        case 'done': return '#2ecc71';      // Bright green for completed
        case 'pending': return '#3498db';    // Bright blue for pending
        case 'failed': return status === 'critical_fail' ? '#e74c3c' : '#f1c40f';  // Red for critical fail, yellow for regular fail
        default: return '#95a5a6';          // Gray for unknown status
    }
};

const getPriorityColor = (priority) => {
    switch (priority) {
        case 'high': return '#ffebee';
        case 'medium': return '#fff3e0';
        case 'low': return '#e8f5e8';
        default: return '#f5f5f5';
    }
};

const getPriorityTextColor = (priority) => {
    switch (priority) {
        case 'high': return '#c62828';
        case 'medium': return '#ef6c00';
        case 'low': return '#2e7d32';
        default: return '#333';
    }
};

const CustomNode = ({ data }) => {
    const story = data?.story || {};
    const milestone = story.milestone || 'default';
    const bgColor = milestoneColors[milestone] || milestoneColors.default;
    const borderColor = getBorderColor(story.status);

    if (!story.id) {
        console.error('Invalid story data:', data);
        return null;
    }

    return (
        <div
            style={{
                padding: '12px',
                borderRadius: '8px',
                border: `4px solid ${data.selected ? '#2196f3' : borderColor}`, // Increased border width
                background: bgColor,
                minWidth: '200px',
                maxWidth: '250px',
                cursor: 'pointer',
                boxShadow: data.selected
                    ? '0 6px 16px rgba(33,150,243,0.4)'
                    : `0 4px 12px ${borderColor}55`,  // Increased shadow and opacity
                fontSize: '0.9rem',
                position: 'relative',
                transition: 'all 0.2s ease-in-out', // Smooth transition for hover effects
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: data.selected
                        ? '0 8px 20px rgba(33,150,243,0.5)'
                        : `0 6px 16px ${borderColor}77`
                }
            }}
            onClick={() => data.onSelect && data.onSelect(story)}
        >
            <Handle
                type="target"
                position={Position.Left}
                id={`target-${story.id}`}
                style={{
                    background: borderColor,
                    width: '12px',          // Increased handle size
                    height: '12px',
                    border: `2px solid ${borderColor}`,
                    borderRadius: '50%'
                }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id={`source-${story.id}`}
                style={{
                    background: borderColor,
                    width: '12px',          // Increased handle size
                    height: '12px',
                    border: `2px solid ${borderColor}`,
                    borderRadius: '50%'
                }}
            />

            {/* Rest of the node content */}
            <div style={{
                fontSize: '0.8rem',          // Slightly larger font
                color: '#666',
                marginBottom: '4px',
                fontFamily: 'monospace',
                fontWeight: '600'           // Made ID bolder
            }}>
                {story.id}
            </div>
            <div style={{
                fontWeight: '700',          // Made title bolder
                color: '#333',
                marginBottom: '6px',
                lineHeight: '1.2',
                fontSize: '1rem'            // Slightly larger font
            }}>
                {story.objective || 'No objective'}
            </div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '8px'
            }}>
                <span style={{
                    padding: '4px 8px',      // Larger padding
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '700',       // Bolder text
                    textTransform: 'uppercase',
                    background: getStatusColor(story.status),
                    color: getStatusTextColor(story.status),
                    border: `1px solid ${borderColor}` // Added border to badges
                }}>
                    {story.status || 'unknown'}
                </span>
                <span style={{
                    padding: '4px 8px',      // Larger padding
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '700',       // Bolder text
                    background: getPriorityColor(story.priority),
                    color: getPriorityTextColor(story.priority),
                    border: `1px solid ${getPriorityTextColor(story.priority)}` // Added border to badges
                }}>
                    {story.priority || 'none'}
                </span>
            </div>
            {milestone !== 'default' && (
                <div style={{
                    fontSize: '0.75rem',
                    color: '#666',
                    marginTop: '6px',
                    fontStyle: 'italic',
                    fontWeight: '600'        // Made milestone text bolder
                }}>
                    {milestone}
                </div>
            )}
        </div>
    );
};

const nodeTypes = {
    storyNode: CustomNode,
};

const DependencyGraph = ({ projectData, selectedStory, onStorySelect }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep' }, eds)),
        [setEdges]
    );

    // Process the data into nodes and edges
    useMemo(() => {
        if (!projectData?.project_structure?.stories) {
            setNodes([]);
            setEdges([]);
            return;
        }

        const stories = projectData.project_structure.stories;
        const currentExecution = projectData.current_execution || {};
        const { currently_running_stories = {}, ready_stories = [], blocked_stories = [], completed_stories = [] } = currentExecution;

        // Create nodes from all stories
        const newNodes = stories.map(story => ({
            id: story.id,
            type: 'storyNode',
            data: {
                story,
                selected: selectedStory?.id === story.id,
                onSelect: onStorySelect
            },
            position: { x: 0, y: 0 } // Initial position, will be calculated by dagre
        }));

        // Create edges from dependencies
        const newEdges = [];
        stories.forEach(story => {
            if (story.dependencies) {
                story.dependencies.forEach(dependencyId => {
                    newEdges.push({
                        id: `${dependencyId}-${story.id}`,
                        source: dependencyId,
                        target: story.id,
                        type: 'smoothstep',
                        animated: false
                    });
                });
            }
        });

        // Apply layout
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges);

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
    }, [projectData, selectedStory, setNodes, setEdges, onStorySelect]);

    if (!projectData) {
        return (
            <GraphContainer>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    color: '#666'
                }}>
                    No project data loaded
                </div>
            </GraphContainer>
        );
    }

    return (
        <GraphContainer>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-right"
                minZoom={0.1}
                maxZoom={1.5}
                defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
                connectionLineType={ConnectionLineType.SmoothStep}
                connectionLineStyle={{ stroke: '#333', strokeWidth: 2 }}
                snapToGrid={true}
                snapGrid={[16, 16]}
            >
                <Background color="#aaa" gap={16} />
                <Controls />
            </ReactFlow>
        </GraphContainer>
    );
};

export default DependencyGraph; 