import dagre from 'dagre';

export function createFlowData(planData, direction = 'TB') {
    if (!planData || !planData.stories) {
        return { nodes: [], edges: [] };
    }

    const { stories, project } = planData;
    const milestones = project?.milestones || [];

    // Create a milestone lookup for color coding and visual indicators
    const milestoneMap = {};
    milestones.forEach(milestone => {
        milestoneMap[milestone.id] = milestone;
    });

    // Create nodes for stories only (no separate milestone nodes)
    const storyNodes = stories.map((story, index) => {
        const milestone = milestoneMap[story.milestone];
        const milestoneColor = getMilestoneColor(milestone?.status || 'planned', index);

        return {
            id: story.id,
            type: 'story',
            position: { x: 0, y: 0 }, // Will be calculated by layout
            data: {
                ...story,
                type: 'story',
                milestone_info: milestone,
                milestone_color: milestoneColor
            },
            draggable: true,
            selectable: true,
            className: `status-${story.status.replace('_', '-')}`
        };
    });

    // Create edges for dependencies only
    const dependencyEdges = [];
    stories.forEach(story => {
        story.dependencies.forEach(depId => {
            dependencyEdges.push({
                id: `${depId}-${story.id}`,
                source: depId,
                target: story.id,
                type: 'smoothstep',
                animated: story.status === 'in_progress',
                style: {
                    stroke: story.status === 'in_progress' ? '#f59e0b' : '#64748b',
                    strokeWidth: story.status === 'in_progress' ? 3 : 2,
                    strokeDasharray: story.status === 'blocked' ? '5,5' : 'none'
                },
                markerEnd: {
                    type: 'arrowclosed',
                    color: story.status === 'in_progress' ? '#f59e0b' : '#64748b'
                }
            });
        });
    });

    // Apply automatic layout
    const layoutedElements = getLayoutedElements(storyNodes, dependencyEdges, direction);

    return {
        nodes: layoutedElements.nodes,
        edges: layoutedElements.edges,
        milestones: milestones // Include milestones for sidebar
    };
}

export function getLayoutedElements(nodes, edges, direction = 'TB') {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const nodeWidth = 280;
    const nodeHeight = 140;

    dagreGraph.setGraph({
        rankdir: direction,
        nodesep: 60,
        ranksep: 120,
        marginx: 50,
        marginy: 50
    });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);

        return {
            ...node,
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
}

export function getMilestoneColor(status, index = 0) {
    const colors = [
        '#3b82f6', // Blue
        '#8b5cf6', // Purple  
        '#06b6d4', // Cyan
        '#10b981', // Emerald
        '#f59e0b', // Amber
        '#ef4444', // Red
        '#84cc16', // Lime
        '#ec4899'  // Pink
    ];

    const baseColor = colors[index % colors.length];

    // Adjust opacity based on status
    switch (status) {
        case 'completed':
            return baseColor;
        case 'in_progress':
            return baseColor + 'CC'; // 80% opacity
        case 'planned':
            return baseColor + '66'; // 40% opacity
        default:
            return baseColor + '80'; // 50% opacity
    }
}

export function getStatusColor(status) {
    switch (status) {
        case 'done':
        case 'completed':
            return '#10b981';
        case 'in_progress':
            return '#f59e0b';
        case 'blocked':
            return '#ef4444';
        case 'planned':
            return '#6b7280';
        case 'cancelled':
            return '#9ca3af';
        case 'on_hold':
            return '#ec4899';
        case 'failed':
            return '#dc2626';
        default:
            return '#94a3b8';
    }
}

export function getStatusIcon(status) {
    switch (status) {
        case 'done':
        case 'completed':
            return '✅';
        case 'in_progress':
            return '🔄';
        case 'blocked':
            return '🚫';
        case 'planned':
            return '📋';
        case 'cancelled':
            return '❌';
        case 'on_hold':
            return '⏸️';
        case 'failed':
            return '💥';
        default:
            return '📝';
    }
}

export function calculateProgress(stories) {
    if (!stories || stories.length === 0) return 0;

    const completedStories = stories.filter(story =>
        story.status === 'done' || story.status === 'completed'
    );

    return Math.round((completedStories.length / stories.length) * 100);
}

export function getComplexityColor(score) {
    if (score <= 2) return '#10b981'; // Green - Easy
    if (score <= 4) return '#f59e0b'; // Orange - Medium
    return '#ef4444'; // Red - Hard
} 