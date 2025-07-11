/**
 * Utility functions for handling different project data schemas
 */

/**
 * Detects the schema type of the project data
 * @param {Object} data - The project data
 * @returns {string} - 'live-file' | 'simple' | 'unknown'
 */
export const detectSchema = (data) => {
    if (!data || typeof data !== 'object') {
        return 'unknown';
    }

    // Check for live-file schema indicators
    if (data.project_structure?.stories || data.execution_status || data.current_execution) {
        return 'live-file';
    }

    // Check for simple schema indicators (stories directly in root)
    if (data.stories && typeof data.stories === 'object') {
        return 'simple';
    }

    return 'unknown';
};

/**
 * Normalizes project data from either schema to a common format
 * @param {Object} data - The raw project data
 * @returns {Object} - Normalized project data
 */
export const normalizeProjectData = (data) => {
    if (!data) return null;

    const schemaType = detectSchema(data);

    switch (schemaType) {
        case 'live-file':
            return normalizeLiveFileSchema(data);
        case 'simple':
            return normalizeSimpleSchema(data);
        default:
            console.warn('Unknown schema detected, attempting to normalize as simple schema');
            return normalizeSimpleSchema(data);
    }
};

/**
 * Normalizes the live-file schema to common format
 * @param {Object} data - Live-file schema data
 * @returns {Object} - Normalized data
 */
const normalizeLiveFileSchema = (data) => {
    const stories = data.project_structure?.stories || [];

    return {
        schema_type: 'live-file',
        project_info: {
            id: data.project_info?.id || 'unknown',
            name: data.project_info?.name || 'Unnamed Project',
            description: data.project_info?.description || 'No description',
            status: data.project_info?.status || 'unknown',
            created_at: data.project_info?.created_at || new Date().toISOString(),
            updated_at: data.project_info?.updated_at || new Date().toISOString()
        },
        execution_status: data.execution_status || {
            running: false,
            execution_running: false,
            completion_percentage: 0,
            budget_used: 0,
            budget_limit: 1000,
            total_stories: stories.length,
            total_agents: 0,
            total_messages: 0
        },
        current_execution: data.current_execution || {
            currently_running_stories: {},
            ready_stories: [],
            blocked_stories: [],
            completed_stories: []
        },
        project_structure: {
            stories: stories,
            agents: data.project_structure?.agents || [],
            milestones: data.project_structure?.milestones || {},
            dependency_analysis: data.project_structure?.dependency_analysis || null
        },
        statistics: data.statistics || calculateBasicStatistics(stories),
        phase_completion: data.phase_completion || {}
    };
};

/**
 * Normalizes the simple schema to common format
 * @param {Object} data - Simple schema data
 * @returns {Object} - Normalized data
 */
const normalizeSimpleSchema = (data) => {
    // Convert stories object to array format
    const storiesArray = data.stories ? Object.values(data.stories) : [];

    // Calculate completion stats
    const completedStories = storiesArray.filter(story => story.status === 'done' || story.status === 'completed');
    const completionPercentage = storiesArray.length > 0 ? (completedStories.length / storiesArray.length) * 100 : 0;

    return {
        schema_type: 'simple',
        project_info: {
            id: data.id || 'unknown',
            name: data.name || 'Unnamed Project',
            description: data.description || 'No description',
            status: data.status || 'planning',
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString()
        },
        execution_status: {
            running: false,
            execution_running: false,
            completion_percentage: completionPercentage,
            budget_used: data.budget_used || 0,
            budget_limit: data.budget_limit || 1000,
            total_stories: storiesArray.length,
            total_agents: data.agents ? Object.keys(data.agents).length : 0,
            total_messages: data.messages ? data.messages.length : 0
        },
        current_execution: {
            currently_running_stories: {},
            ready_stories: storiesArray.filter(story => story.status === 'ready'),
            blocked_stories: storiesArray.filter(story => story.status === 'blocked'),
            completed_stories: completedStories
        },
        project_structure: {
            stories: storiesArray,
            agents: data.agents ? Object.values(data.agents) : [],
            milestones: data.milestones || {},
            dependency_analysis: data.dependency_analysis || calculateDependencyAnalysis(storiesArray)
        },
        statistics: calculateBasicStatistics(storiesArray),
        phase_completion: calculatePhaseCompletion(storiesArray)
    };
};

/**
 * Calculates basic statistics for stories
 * @param {Array} stories - Array of story objects
 * @returns {Object} - Statistics object
 */
const calculateBasicStatistics = (stories) => {
    const totalStories = stories.length;
    const completedStories = stories.filter(story =>
        story.status === 'done' || story.status === 'completed'
    ).length;
    const blockedStories = stories.filter(story => story.status === 'blocked').length;
    const readyStories = stories.filter(story => story.status === 'ready').length;

    return {
        total_stories: totalStories,
        completed_stories: completedStories,
        blocked_stories: blockedStories,
        ready_stories: readyStories,
        // Add more statistics as needed
        has_cycles: false, // Could implement cycle detection
        graph_density: totalStories > 0 ? stories.reduce((sum, story) => sum + (story.dependencies?.length || 0), 0) / totalStories : 0
    };
};

/**
 * Calculates dependency analysis
 * @param {Array} stories - Array of story objects
 * @returns {Object} - Dependency analysis object
 */
const calculateDependencyAnalysis = (stories) => {
    // Simple critical path calculation (could be enhanced)
    const storyMap = new Map(stories.map(story => [story.id, story]));
    const criticalPath = [];

    // Find stories with no dependencies (starting points)
    const rootStories = stories.filter(story => !story.dependencies || story.dependencies.length === 0);

    if (rootStories.length > 0) {
        criticalPath.push(rootStories[0].id);
    }

    return {
        critical_path: criticalPath,
        parallel_groups: [stories.map(story => story.id)], // Simplified
        base_work_stories: stories.filter(story => story.work_type === 'base_work').map(story => story.id),
        estimated_phases: Math.max(1, Math.ceil(stories.length / 3)), // Rough estimate
        parallelization_score: 0.5, // Default value
        circular_dependencies: []
    };
};

/**
 * Calculates phase completion
 * @param {Array} stories - Array of story objects
 * @returns {Object} - Phase completion object
 */
const calculatePhaseCompletion = (stories) => {
    const phases = ['base_work', 'feature_work', 'integration_work', 'testing_work', 'deployment_work'];
    const phaseCompletion = {};

    phases.forEach(phase => {
        const phaseStories = stories.filter(story => story.work_type === phase);
        const completedPhaseStories = phaseStories.filter(story =>
            story.status === 'done' || story.status === 'completed'
        );

        phaseCompletion[phase] = phaseStories.length > 0
            ? (completedPhaseStories.length / phaseStories.length) * 100
            : 0;
    });

    return phaseCompletion;
};

/**
 * Gets schema-specific display information
 * @param {Object} normalizedData - Normalized project data
 * @returns {Object} - Display information
 */
export const getSchemaDisplayInfo = (normalizedData) => {
    if (!normalizedData) return null;

    return {
        schemaType: normalizedData.schema_type,
        schemaLabel: normalizedData.schema_type === 'live-file' ? 'Live Execution Format' : 'Simple Project Format',
        hasExecutionData: normalizedData.schema_type === 'live-file',
        hasAgents: (normalizedData.project_structure?.agents || []).length > 0,
        supportsRealtime: normalizedData.schema_type === 'live-file'
    };
}; 