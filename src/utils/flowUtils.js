// Layout and flow generation utilities for the plan editor

// Status colors for visual consistency
export const getStatusColor = (status) => {
    switch (status) {
        case 'in_progress': return '#f59e0b';
        case 'done': return '#10b981';
        case 'failed': return '#ef4444';
        case 'planned': return '#6b7280';
        case 'cancelled': return '#ef4444';
        case 'completed': return '#10b981'; // for checkpoints
        case 'on_hold': return '#f59e0b';
        default: return '#94a3b8';
    }
};

export const getStatusIcon = (status) => {
    switch (status) {
        case 'planned': return '📋';
        case 'in_progress': return '🔄';
        case 'done': return '✅';
        case 'failed': return '❌';
        case 'cancelled': return '❌';
        case 'completed': return '✅';
        case 'on_hold': return '⏸️';
        default: return '📋';
    }
};

export const getComplexityColor = (score) => {
    if (score <= 2) return '#10b981';
    if (score <= 4) return '#f59e0b';
    if (score <= 6) return '#ef4444';
    if (score <= 8) return '#dc2626';
    return '#7c2d12';
};

// Generate workstream-based color for visual grouping
export const getWorkstreamColor = (workstreamId) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    let hash = 0;
    for (let i = 0; i < workstreamId.length; i++) {
        hash = workstreamId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

// Generate milestone/checkpoint color based on status and index for visual differentiation
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

// Create positioning for hierarchical layout with integrated checkpoints and stories
function createHierarchicalLayout(nodes, edges) {
    const levels = new Map();
    const visited = new Set();
    const calculating = new Set();

    // Calculate depth for each node based on dependencies
    function calculateDepth(nodeId) {
        if (calculating.has(nodeId)) {
            // Circular dependency detected, assign level 0
            console.warn(`Circular dependency detected involving ${nodeId}`);
            return 0;
        }

        if (visited.has(nodeId)) {
            return levels.get(nodeId) || 0;
        }

        calculating.add(nodeId);

        const node = nodes.find(n => n.id === nodeId);
        if (!node) {
            calculating.delete(nodeId);
            return 0;
        }

        let maxDependencyDepth = -1;

        // Find dependencies for this node
        if (node.data.dependencies && node.data.dependencies.length > 0) {
            node.data.dependencies.forEach(dep => {
                const depDepth = calculateDepth(dep.id);
                maxDependencyDepth = Math.max(maxDependencyDepth, depDepth);
            });
        }

        // For stories, also consider checkpoint relationships
        if (node.type === 'story') {
            // Find any checkpoint that includes this story
            const parentCheckpoints = nodes.filter(n =>
                n.type === 'checkpoint' &&
                n.data.story_ids &&
                n.data.story_ids.includes(nodeId)
            );

            parentCheckpoints.forEach(checkpoint => {
                const checkpointDepth = calculateDepth(checkpoint.id);
                // Stories should be positioned before their checkpoints
                maxDependencyDepth = Math.max(maxDependencyDepth, checkpointDepth - 1);
            });
        }

        const depth = maxDependencyDepth + 1;
        levels.set(nodeId, depth);
        visited.add(nodeId);
        calculating.delete(nodeId);

        return depth;
    }

    // Calculate depth for all nodes
    nodes.forEach(node => {
        if (!visited.has(node.id)) {
            calculateDepth(node.id);
        }
    });

    // Adjust checkpoint positions to be after their constituent stories
    nodes.filter(n => n.type === 'checkpoint').forEach(checkpoint => {
        const storyLevels = (checkpoint.data.story_ids || [])
            .map(storyId => levels.get(storyId) || 0)
            .filter(level => level !== undefined);

        if (storyLevels.length > 0) {
            const maxStoryLevel = Math.max(...storyLevels);
            const currentCheckpointLevel = levels.get(checkpoint.id) || 0;
            const newCheckpointLevel = Math.max(currentCheckpointLevel, maxStoryLevel + 1);
            levels.set(checkpoint.id, newCheckpointLevel);
        }
    });

    // Group nodes by level and type
    const levelGroups = new Map();
    nodes.forEach(node => {
        const level = levels.get(node.id) || 0;
        if (!levelGroups.has(level)) {
            levelGroups.set(level, { stories: [], checkpoints: [], intents: [] });
        }

        if (node.type === 'checkpoint') {
            levelGroups.get(level).checkpoints.push(node);
        } else if (node.type === 'intent') {
            levelGroups.get(level).intents.push(node);
        } else {
            levelGroups.get(level).stories.push(node);
        }
    });

    // Position nodes with better spacing
    const LEVEL_HEIGHT = 250;
    const NODE_SPACING = 320;
    const CHECKPOINT_OFFSET = 150; // Offset checkpoints from stories

    levelGroups.forEach((nodesAtLevel, level) => {
        const { stories, checkpoints, intents } = nodesAtLevel;
        const y = level * LEVEL_HEIGHT;

        // Position stories first
        if (stories.length > 0) {
            const totalStoryWidth = (stories.length - 1) * NODE_SPACING;
            const startX = -totalStoryWidth / 2;

            stories.forEach((node, index) => {
                node.position = {
                    x: startX + (index * NODE_SPACING),
                    y: y
                };
            });
        }

        // Position checkpoints after stories at the same level
        if (checkpoints.length > 0) {
            const totalCheckpointWidth = (checkpoints.length - 1) * NODE_SPACING;
            const startX = -totalCheckpointWidth / 2;

            checkpoints.forEach((node, index) => {
                node.position = {
                    x: startX + (index * NODE_SPACING),
                    y: y + CHECKPOINT_OFFSET
                };
            });
        }

        // Position intents after checkpoints
        if (intents.length > 0) {
            const totalIntentWidth = (intents.length - 1) * NODE_SPACING;
            const startX = -totalIntentWidth / 2;

            intents.forEach((node, index) => {
                node.position = {
                    x: startX + (index * NODE_SPACING),
                    y: y + CHECKPOINT_OFFSET + 150 // Extra offset for intents
                };
            });
        }
    });

    return nodes;
}

// Create simpler hierarchical layout for stories within an intent
function createStoryHierarchicalLayout(nodes, edges) {
    const levels = new Map();
    const visited = new Set();
    const calculating = new Set();

    // Calculate depth for each story node based on dependencies
    function calculateDepth(nodeId) {
        if (calculating.has(nodeId)) {
            console.warn(`Circular dependency detected involving ${nodeId}`);
            return 0;
        }

        if (visited.has(nodeId)) {
            return levels.get(nodeId) || 0;
        }

        calculating.add(nodeId);

        const node = nodes.find(n => n.id === nodeId);
        if (!node) {
            calculating.delete(nodeId);
            return 0;
        }

        let maxDependencyDepth = -1;

        // Find dependencies for this node
        if (node.data.dependencies && node.data.dependencies.length > 0) {
            node.data.dependencies.forEach(dep => {
                if (dep.type === 'story') {
                    const depDepth = calculateDepth(dep.id);
                    maxDependencyDepth = Math.max(maxDependencyDepth, depDepth);
                }
            });
        }

        const depth = maxDependencyDepth + 1;
        levels.set(nodeId, depth);
        visited.add(nodeId);
        calculating.delete(nodeId);

        return depth;
    }

    // Calculate depth for all nodes
    nodes.forEach(node => {
        if (!visited.has(node.id)) {
            calculateDepth(node.id);
        }
    });

    // Group nodes by level
    const levelGroups = new Map();
    nodes.forEach(node => {
        const level = levels.get(node.id) || 0;
        if (!levelGroups.has(level)) {
            levelGroups.set(level, []);
        }
        levelGroups.get(level).push(node);
    });

    // Position nodes with appropriate spacing
    const LEVEL_HEIGHT = 200;
    const NODE_SPACING = 250;

    levelGroups.forEach((nodesAtLevel, level) => {
        const y = level * LEVEL_HEIGHT;
        const totalWidth = (nodesAtLevel.length - 1) * NODE_SPACING;
        const startX = -totalWidth / 2;

        nodesAtLevel.forEach((node, index) => {
            node.position = {
                x: startX + (index * NODE_SPACING),
                y: y
            };
        });
    });

    return nodes;
}

// Create Intent-Level Flow (High-level view showing intent dependencies)
export function createIntentFlowData(planData, options = {}) {
    if (!planData) {
        return { nodes: [], edges: [] };
    }

    const {
        pendingChanges = {},
        executionView = false,
        isDependencyAffected,
        isDirectlyEdited,
        isNewNode,
        isDeletedNode,
        getNodeState,
        getEntityWithPendingChanges
    } = options;
    const nodes = [];
    const edges = [];

    // Create intent nodes (filter out deleted ones)
    if (planData.project?.roadmap?.intents) {
        const filteredIntents = planData.project.roadmap.intents.filter(intent => {
            const isDeleted = isDeletedNode ? isDeletedNode('intent', intent.id) : false;
            return !isDeleted;
        });

        filteredIntents.forEach((intent, index) => {
            // Get intent with pending changes applied
            const intentWithChanges = getEntityWithPendingChanges ?
                getEntityWithPendingChanges('intent', intent.id) : intent;

            // Use the updated intent data (with pending changes)
            const finalIntentData = intentWithChanges || intent;

            // Calculate story count for this intent from the new schema
            const story_count = finalIntentData.stories ? finalIntentData.stories.length : 0;

            // Check if this intent has pending changes
            const hasChanges = pendingChanges[`intent:${intent.id}`] !== undefined;

            // Get comprehensive node state
            const nodeState = getNodeState ? getNodeState('intent', intent.id) : {
                isNew: false,
                isEdited: false,
                isDeleted: false,
                isDependencyAffected: false,
                hasPendingChanges: false
            };

            // Backwards compatibility
            const dependencyAffected = isDependencyAffected ? isDependencyAffected('intent', intent.id) : nodeState.isDependencyAffected;
            const directlyEdited = isDirectlyEdited ? isDirectlyEdited('intent', intent.id) : nodeState.isEdited;

            // Get execution status if in execution view
            const executionStatus = executionView ? (finalIntentData.execution?.current?.status || 'planned') : null;

            nodes.push({
                id: finalIntentData.id,
                type: 'intent',
                position: { x: 0, y: 0 }, // Will be positioned by layout algorithm
                data: {
                    ...finalIntentData, // Use the data with pending changes applied
                    story_count: story_count,
                    type: 'intent',
                    hasChanges: hasChanges,
                    dependencyAffected: dependencyAffected,
                    directlyEdited: directlyEdited,
                    // New visual state indicators
                    isNew: nodeState.isNew,
                    isDeleted: nodeState.isDeleted,
                    nodeState: nodeState,
                    executionView: executionView,
                    executionStatus: executionStatus,
                    execution: executionView ? finalIntentData.execution : null
                }
            });
        });
    }

    // Create edges for intent dependencies with simpler styling
    planData.project?.roadmap?.intents?.forEach(intent => {
        if (intent.dependencies && intent.dependencies.length > 0) {
            intent.dependencies.forEach(dep => {
                if (dep.type === 'intent') {
                    edges.push({
                        id: `${dep.id}-to-${intent.id}`,
                        source: dep.id,
                        target: intent.id,
                        type: 'smoothstep',
                        style: {
                            stroke: '#8b5cf6',
                            strokeWidth: 2
                        },
                        markerEnd: {
                            type: 'arrowclosed',
                            color: '#8b5cf6'
                        }
                    });
                }
            });
        }
    });

    // Apply hierarchical layout
    const levels = new Map();
    const visited = new Set();
    const calculating = new Set();

    // Calculate depth for each intent based on dependencies
    function calculateDepth(nodeId) {
        if (calculating.has(nodeId)) {
            console.warn(`Circular dependency detected involving ${nodeId}`);
            return 0;
        }

        if (visited.has(nodeId)) {
            return levels.get(nodeId) || 0;
        }

        calculating.add(nodeId);

        const node = nodes.find(n => n.id === nodeId);
        if (!node) {
            calculating.delete(nodeId);
            return 0;
        }

        let maxDependencyDepth = -1;

        // Find dependencies for this node
        if (node.data.dependencies && node.data.dependencies.length > 0) {
            node.data.dependencies.forEach(dep => {
                if (dep.type === 'intent') {
                    const depDepth = calculateDepth(dep.id);
                    maxDependencyDepth = Math.max(maxDependencyDepth, depDepth);
                }
            });
        }

        const depth = maxDependencyDepth + 1;
        levels.set(nodeId, depth);
        visited.add(nodeId);
        calculating.delete(nodeId);

        return depth;
    }

    // Calculate depth for all nodes
    nodes.forEach(node => {
        if (!visited.has(node.id)) {
            calculateDepth(node.id);
        }
    });

    // Group nodes by level
    const levelGroups = new Map();
    nodes.forEach(node => {
        const level = levels.get(node.id) || 0;
        if (!levelGroups.has(level)) {
            levelGroups.set(level, []);
        }
        levelGroups.get(level).push(node);
    });

    // Position nodes - preserve existing positions unless reorganizing
    const LEVEL_HEIGHT = 300; // Increased vertical spacing
    const NODE_SPACING = 400; // Increased horizontal spacing

    // Check if we should preserve existing positions (avoid reorganizing unless needed)
    const shouldPreservePositions = options.preservePositions !== false;
    const existingPositions = new Map();

    // Store existing positions if we should preserve them
    if (shouldPreservePositions && options.existingNodes) {
        options.existingNodes.forEach(existingNode => {
            existingPositions.set(existingNode.id, existingNode.position);
        });
    }

    levelGroups.forEach((nodesAtLevel, level) => {
        const y = level * LEVEL_HEIGHT;
        const totalWidth = (nodesAtLevel.length - 1) * NODE_SPACING;
        const startX = -totalWidth / 2;

        nodesAtLevel.forEach((node, index) => {
            const intent = planData.project?.roadmap?.intents?.find(i => i.id === node.id);

            // Priority order for positioning:
            // 1. Existing position (if preserving)
            // 2. Stored position from intent data
            // 3. Hierarchical layout

            if (shouldPreservePositions && existingPositions.has(node.id)) {
                // Preserve existing position
                node.position = existingPositions.get(node.id);
            } else if (intent && intent.position) {
                // Use stored position from intent data
                node.position = intent.position;
            } else {
                // Use hierarchical positioning for new nodes
                node.position = {
                    x: startX + (index * NODE_SPACING),
                    y: y
                };
                // Store this position in the intent data
                if (intent) {
                    intent.position = { ...node.position };
                }
            }
        });
    });

    return { nodes, edges };
}

// Create Story-Level Flow (Detailed view within a specific intent)
export function createStoryFlowData(planData, intentId, options = {}) {
    if (!planData || !intentId) {
        return { nodes: [], edges: [] };
    }

    const {
        pendingChanges = {},
        executionView = false,
        isDependencyAffected,
        isDirectlyEdited,
        isNewNode,
        isDeletedNode,
        getNodeState,
        getEntityWithPendingChanges
    } = options;
    const nodes = [];
    const edges = [];

    // Get stories from the intent in the new schema
    const intent = planData.project?.roadmap?.intents?.find(i => i.id === intentId);
    if (!intent || !intent.stories) {
        return { nodes: [], edges: [] };
    }

    // Filter stories for this intent, excluding deleted ones
    const storiesInIntent = intent.stories.filter(story => {
        const isDeleted = isDeletedNode ? isDeletedNode('story', story.id) : false;
        return !isDeleted;
    }).map(story => ({
        ...story,
        intent_id: intentId // Ensure intent_id is set for backward compatibility
    }));

    // Create story nodes
    storiesInIntent.forEach(story => {
        // Get story with pending changes applied
        const storyWithChanges = getEntityWithPendingChanges ?
            getEntityWithPendingChanges('story', story.id) : story;

        // Use the updated story data (with pending changes)
        const finalStoryData = storyWithChanges || story;

        // Check if this story has pending changes
        const hasChanges = pendingChanges[`story:${story.id}`] !== undefined;

        // Get comprehensive node state
        const nodeState = getNodeState ? getNodeState('story', story.id) : {
            isNew: false,
            isEdited: false,
            isDeleted: false,
            isDependencyAffected: false,
            hasPendingChanges: false
        };

        // Backwards compatibility
        const dependencyAffected = isDependencyAffected ? isDependencyAffected('story', story.id) : nodeState.isDependencyAffected;
        const directlyEdited = isDirectlyEdited ? isDirectlyEdited('story', story.id) : nodeState.isEdited;

        // Get execution status if in execution view
        const executionStatus = executionView ? (finalStoryData.execution?.current?.status || 'planned') : null;

        nodes.push({
            id: finalStoryData.id,
            type: 'story',
            position: { x: 0, y: 0 }, // Will be positioned later
            data: {
                ...finalStoryData, // Use the data with pending changes applied
                type: 'story',
                hasChanges: hasChanges,
                dependencyAffected: dependencyAffected,
                directlyEdited: directlyEdited,
                // New visual state indicators
                isNew: nodeState.isNew,
                isDeleted: nodeState.isDeleted,
                nodeState: nodeState,
                executionView: executionView,
                executionStatus: executionStatus,
                execution: executionView ? finalStoryData.execution : null
            }
        });
    });

    // Create edges for story dependencies within this intent
    const createStoryDependencyEdges = (fromNode, dependencies) => {
        dependencies.forEach(dep => {
            if (dep.type === 'story') {
                const targetNode = nodes.find(n => n.id === dep.id);
                if (targetNode) {
                    edges.push({
                        id: `${dep.id}-to-${fromNode.id}`,
                        source: dep.id,
                        target: fromNode.id,
                        type: 'smoothstep',
                        style: {
                            stroke: '#f59e0b',
                            strokeWidth: 2
                        },
                        markerEnd: {
                            type: 'arrowclosed',
                            color: '#f59e0b'
                        }
                    });
                }
            }
        });
    };

    // Create edges for story dependencies
    nodes.forEach(storyNode => {
        if (storyNode.data.dependencies && storyNode.data.dependencies.length > 0) {
            createStoryDependencyEdges(storyNode, storyNode.data.dependencies);
        }
    });

    // Apply hierarchical layout for stories with increased spacing
    const levels = new Map();
    const visited = new Set();
    const calculating = new Set();

    // Calculate depth for each story based on dependencies
    function calculateDepth(nodeId) {
        if (calculating.has(nodeId)) {
            console.warn(`Circular dependency detected involving ${nodeId}`);
            return 0;
        }

        if (visited.has(nodeId)) {
            return levels.get(nodeId) || 0;
        }

        calculating.add(nodeId);

        const node = nodes.find(n => n.id === nodeId);
        if (!node) {
            calculating.delete(nodeId);
            return 0;
        }

        let maxDependencyDepth = -1;

        // Find dependencies for this node
        if (node.data.dependencies && node.data.dependencies.length > 0) {
            node.data.dependencies.forEach(dep => {
                if (dep.type === 'story') {
                    const depDepth = calculateDepth(dep.id);
                    maxDependencyDepth = Math.max(maxDependencyDepth, depDepth);
                }
            });
        }

        const depth = maxDependencyDepth + 1;
        levels.set(nodeId, depth);
        visited.add(nodeId);
        calculating.delete(nodeId);

        return depth;
    }

    // Calculate depth for all nodes
    nodes.forEach(node => {
        if (!visited.has(node.id)) {
            calculateDepth(node.id);
        }
    });

    // Group nodes by level
    const levelGroups = new Map();
    nodes.forEach(node => {
        const level = levels.get(node.id) || 0;
        if (!levelGroups.has(level)) {
            levelGroups.set(level, []);
        }
        levelGroups.get(level).push(node);
    });

    // Position nodes - preserve existing positions unless reorganizing
    const LEVEL_HEIGHT = 250; // Increased vertical spacing
    const NODE_SPACING = 350; // Increased horizontal spacing

    // Check if we should preserve existing positions (avoid reorganizing unless needed)
    const shouldPreservePositions = options.preservePositions !== false;
    const existingPositions = new Map();

    // Store existing positions if we should preserve them
    if (shouldPreservePositions && options.existingNodes) {
        options.existingNodes.forEach(existingNode => {
            existingPositions.set(existingNode.id, existingNode.position);
        });
    }

    levelGroups.forEach((nodesAtLevel, level) => {
        const y = level * LEVEL_HEIGHT;
        const totalWidth = (nodesAtLevel.length - 1) * NODE_SPACING;
        const startX = -totalWidth / 2;

        nodesAtLevel.forEach((node, index) => {
            // Find the story in the new schema (within intents)
            let story = null;
            for (const intent of (planData.project?.roadmap?.intents || [])) {
                if (intent.stories) {
                    const foundStory = intent.stories.find(s => s.id === node.id);
                    if (foundStory) {
                        story = foundStory;
                        break;
                    }
                }
            }

            // Priority order for positioning:
            // 1. New temporary position (from context menu)
            // 2. Existing position (if preserving)
            // 3. Hierarchical layout

            if (story && story._tempPosition) {
                // Use the custom position from context menu
                // Center the node on the click position (story nodes are ~280-320px wide, ~120px tall)
                node.position = {
                    x: story._tempPosition.x - 140, // Center horizontally (half of ~280px)
                    y: story._tempPosition.y - 60   // Center vertically (half of ~120px)
                };
                // Clean up the temporary position and make it permanent
                story.position = { ...node.position };
                delete story._tempPosition;
            } else if (shouldPreservePositions && existingPositions.has(node.id)) {
                // Preserve existing position
                node.position = existingPositions.get(node.id);
            } else if (story && story.position) {
                // Use stored position from story data
                node.position = story.position;
            } else {
                // Use hierarchical positioning for new nodes without custom position
                node.position = {
                    x: startX + (index * NODE_SPACING),
                    y: y
                };
                // Store this position in the story data
                if (story) {
                    story.position = { ...node.position };
                }
            }
        });
    });

    return {
        nodes: nodes,
        edges: edges
    };
}

// Legacy function for backward compatibility - now defaults to intent level
export function createFlowData(planData, options = {}) {
    const { viewLevel = 'intent', intentId } = options;

    if (viewLevel === 'story' && intentId) {
        return createStoryFlowData(planData, intentId, options);
    } else {
        return createIntentFlowData(planData, options);
    }
}

// Get color for dependency type
function getDependencyColor(dependencyType) {
    switch (dependencyType) {
        case 'intent': return '#8b5cf6';
        case 'checkpoint': return '#06b6d4';
        case 'workstream': return '#10b981';
        case 'story': return '#f59e0b';
        default: return '#94a3b8';
    }
}

// Workstream-based layout (alternative layout option)
export function createWorkstreamLayout(planData) {
    if (!planData) return { nodes: [], edges: [] };

    const workstreams = {};
    const nodes = [];
    const edges = [];

    // Get all stories from intents
    const allStories = [];
    if (planData.project?.roadmap?.intents) {
        planData.project.roadmap.intents.forEach(intent => {
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

    // Group stories by workstream
    allStories.forEach(story => {
        const workstreamId = story.workstream_id || 'unassigned';
        if (!workstreams[workstreamId]) {
            workstreams[workstreamId] = [];
        }
        workstreams[workstreamId].push(story);
    });

    // Position stories within workstreams
    const WORKSTREAM_WIDTH = 400;
    const WORKSTREAM_SPACING = 50;
    const STORY_SPACING = 150;

    let workstreamIndex = 0;
    Object.entries(workstreams).forEach(([workstreamId, stories]) => {
        const workstreamX = workstreamIndex * (WORKSTREAM_WIDTH + WORKSTREAM_SPACING);

        stories.forEach((story, storyIndex) => {
            const executionData = story.execution?.current || {};

            nodes.push({
                id: story.id,
                type: 'story',
                position: {
                    x: workstreamX,
                    y: storyIndex * STORY_SPACING
                },
                data: {
                    ...story,
                    status: executionData.status || 'planned',
                    agent_id: executionData.agent_id,
                    type: 'story'
                }
            });
        });

        workstreamIndex++;
    });

    // Create dependency edges
    planData.stories.forEach(story => {
        if (story.dependencies) {
            story.dependencies.forEach(dep => {
                if (dep.type === 'story') {
                    const sourceNode = nodes.find(n => n.id === dep.id);
                    const targetNode = nodes.find(n => n.id === story.id);

                    if (sourceNode && targetNode) {
                        edges.push({
                            id: `${dep.id}->${story.id}`,
                            source: dep.id,
                            target: story.id,
                            sourceHandle: `${dep.id}-source`,
                            targetHandle: `${story.id}-target`,
                            type: 'smoothstep',
                            style: { stroke: '#94a3b8', strokeWidth: 2 }
                        });
                    }
                }
            });
        }
    });

    return { nodes, edges };
}

// Intent-based layout (another alternative)
export function createIntentLayout(planData) {
    if (!planData) return { nodes: [], edges: [] };

    const intents = {};
    const nodes = [];
    const edges = [];

    // Group stories by intent from the new schema
    if (planData.project?.roadmap?.intents) {
        planData.project.roadmap.intents.forEach(intent => {
            if (intent.stories) {
                intents[intent.id] = intent.stories.map(story => ({
                    ...story,
                    intent_id: intent.id
                }));
            } else {
                intents[intent.id] = [];
            }
        });
    }

    // Create intent nodes
    if (planData.project?.roadmap?.intents) {
        planData.project.roadmap.intents.forEach((intent, index) => {
            nodes.push({
                id: intent.id,
                type: 'intent',
                position: {
                    x: index * 500,
                    y: 0
                },
                data: {
                    ...intent,
                    type: 'intent'
                }
            });
        });
    }

    // Position stories under their intents
    Object.entries(intents).forEach(([intentId, stories]) => {
        const intentNode = nodes.find(n => n.id === intentId);
        if (intentNode) {
            stories.forEach((story, index) => {
                const executionData = story.execution?.current || {};

                nodes.push({
                    id: story.id,
                    type: 'story',
                    position: {
                        x: intentNode.position.x + (index % 3) * 150 - 150,
                        y: intentNode.position.y + Math.floor(index / 3) * 150 + 200
                    },
                    data: {
                        ...story,
                        status: executionData.status || 'planned',
                        agent_id: executionData.agent_id,
                        type: 'story'
                    }
                });
            });
        }
    });

    return { nodes, edges };
}

// Utility to validate flow data integrity
export function validateFlowIntegrity(flowData) {
    const { nodes, edges } = flowData;
    const nodeIds = new Set(nodes.map(n => n.id));
    const errors = [];

    // Check for orphaned edges
    edges.forEach(edge => {
        if (!nodeIds.has(edge.source)) {
            errors.push(`Edge ${edge.id} references unknown source node: ${edge.source}`);
        }
        if (!nodeIds.has(edge.target)) {
            errors.push(`Edge ${edge.id} references unknown target node: ${edge.target}`);
        }
    });

    // Check for circular dependencies
    const visited = new Set();
    const recursionStack = new Set();

    function hasCycle(nodeId) {
        if (recursionStack.has(nodeId)) return true;
        if (visited.has(nodeId)) return false;

        visited.add(nodeId);
        recursionStack.add(nodeId);

        const outgoingEdges = edges.filter(e => e.source === nodeId);
        for (const edge of outgoingEdges) {
            if (hasCycle(edge.target)) return true;
        }

        recursionStack.delete(nodeId);
        return false;
    }

    nodes.forEach(node => {
        if (!visited.has(node.id) && hasCycle(node.id)) {
            errors.push(`Circular dependency detected involving node: ${node.id}`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
} 