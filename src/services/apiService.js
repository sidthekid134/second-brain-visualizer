// API Service for connecting to Neuro Coordinator

const CONNECTION_STORAGE_KEY = 'sbv_api_connection';

const hasLocalStorage = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        return typeof window.localStorage !== 'undefined';
    } catch (error) {
        return false;
    }
};

class APIService {
    constructor() {
        this.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
        this.timeout = parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000;
        this.debug = false; // Disable debug logging to clean up console
        this.isConnected = false;
        this.connectionError = null;
        this.listeners = new Set();
        this.pollingInterval = null;
        this.pollingFrequency = parseInt(process.env.REACT_APP_API_POLLING_FREQUENCY) || 5000;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.shouldAutoReconnect = false;
        this.lastConnectedAt = null;

        this.loadPersistedState();
    }

    loadPersistedState() {
        if (!hasLocalStorage()) {
            return;
        }

        try {
            const raw = window.localStorage.getItem(CONNECTION_STORAGE_KEY);
            if (!raw) {
                return;
            }

            const savedState = JSON.parse(raw);
            if (savedState.baseURL) {
                this.baseURL = savedState.baseURL;
            }

            if (typeof savedState.pollingFrequency === 'number' && !Number.isNaN(savedState.pollingFrequency)) {
                this.pollingFrequency = savedState.pollingFrequency;
            }

            if (typeof savedState.shouldAutoReconnect === 'boolean') {
                this.shouldAutoReconnect = savedState.shouldAutoReconnect;
            }

            if (savedState.lastConnectedAt) {
                this.lastConnectedAt = savedState.lastConnectedAt;
            }
        } catch (error) {
            if (this.debug) {
                console.warn('Failed to load API connection state:', error);
            }
        }
    }

    persistConnectionState() {
        if (!hasLocalStorage()) {
            return;
        }

        const payload = {
            baseURL: this.baseURL,
            shouldAutoReconnect: this.shouldAutoReconnect,
            pollingFrequency: this.pollingFrequency,
            lastConnectedAt: this.lastConnectedAt,
            lastError: this.connectionError
        };

        try {
            window.localStorage.setItem(CONNECTION_STORAGE_KEY, JSON.stringify(payload));
        } catch (error) {
            if (this.debug) {
                console.warn('Failed to persist API connection state:', error);
            }
        }
    }

    shouldAttemptAutoReconnect() {
        return this.shouldAutoReconnect && Boolean(this.baseURL);
    }

    async restorePersistedConnection() {
        if (!this.shouldAttemptAutoReconnect()) {
            return { attempted: false };
        }

        try {
            const result = await this.testConnection();
            return { attempted: true, ...result };
        } catch (error) {
            return { attempted: true, success: false, error: error.message };
        }
    }

    // Improved fetch with timeout and retry logic
    async fetchWithTimeout(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                // Try to get error details from response body
                let errorDetails = response.statusText;
                try {
                    const errorData = await response.json();
                    if (errorData.detail) {
                        errorDetails = errorData.detail;
                    } else if (errorData.message) {
                        errorDetails = errorData.message;
                    } else if (errorData.error) {
                        errorDetails = errorData.error;
                    } else {
                        errorDetails = JSON.stringify(errorData);
                    }
                } catch (parseError) {
                    // If we can't parse the error response, use the status text
                    errorDetails = response.statusText;
                }

                const error = new Error(`HTTP ${response.status}: ${errorDetails}`);
                error.status = response.status;
                error.statusText = response.statusText;
                error.details = errorDetails;
                throw error;
            }

            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error(`Request timeout after ${this.timeout}ms`);
            }
            throw error;
        }
    }

    async retryFetch(url, options = {}, retries = this.maxRetries) {
        for (let i = 0; i <= retries; i++) {
            try {
                if (this.debug) {
                    console.log(`API call attempt ${i + 1}/${retries + 1}: ${url}`);
                }

                const response = await this.fetchWithTimeout(url, options);
                this.retryCount = 0; // Reset on success
                return { success: true, response };
            } catch (error) {
                if (this.debug) {
                    console.warn(`API call attempt ${i + 1} failed:`, error.message);
                }

                if (i === retries) {
                    return {
                        success: false,
                        error: error.message,
                        status: error.status,
                        details: error.details
                    };
                }

                // Exponential backoff
                const delay = Math.min(1000 * Math.pow(2, i), 5000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // Connection management
    async testConnection() {
        try {
            const result = await this.retryFetch(`${this.baseURL}/api/v1/health`);

            if (!result.success) {
                this.isConnected = false;
                this.connectionError = result.error;
                this.persistConnectionState();
                return { success: false, error: result.error };
            }

            const data = await result.response.json();
            this.isConnected = data.status === 'healthy';
            this.connectionError = null;

            if (this.isConnected) {
                this.shouldAutoReconnect = true;
                this.lastConnectedAt = new Date().toISOString();
            }

            this.persistConnectionState();
            return { success: true, data };
        } catch (error) {
            this.isConnected = false;
            this.connectionError = error.message;
            this.persistConnectionState();
            return { success: false, error: error.message };
        }
    }

    // Core API methods
    async getProjectData() {
        const result = await this.retryFetch(`${this.baseURL}/api/v1/project-data`);

        if (!result.success) {
            return result;
        }

        try {
            const data = await result.response.json();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: `Failed to parse response: ${error.message}` };
        }
    }

    async getSystemStatus() {
        const result = await this.retryFetch(`${this.baseURL}/api/v1/status`);

        if (!result.success) {
            return result;
        }

        try {
            const data = await result.response.json();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: `Failed to parse response: ${error.message}` };
        }
    }

    async getRunEvents(runId, limit = 50, offset = 0) {
        const params = new URLSearchParams({
            limit: limit.toString(),
            offset: offset.toString(),
        });

        const result = await this.retryFetch(`${this.baseURL}/api/v1/runs/${runId}/events?${params.toString()}`);

        if (!result.success) {
            return result;
        }

        try {
            const data = await result.response.json();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: `Failed to parse response: ${error.message}` };
        }
    }

    async getIntentDetails(intentId) {
        const result = await this.retryFetch(`${this.baseURL}/api/v1/intents/${intentId}`);

        if (!result.success) {
            return result;
        }

        try {
            const data = await result.response.json();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: `Failed to parse response: ${error.message}` };
        }
    }

    async getProjectDataTransformed() {
        console.log('🔄 Getting project data transformed...');

        // First get all projects to see what's available
        const projectsResult = await this.getProjects();
        if (!projectsResult.success) {
            return projectsResult;
        }

        console.log('🔄 Projects list:', projectsResult.data);

        // If no projects, return empty data
        if (!Array.isArray(projectsResult.data) || projectsResult.data.length === 0) {
            console.log('🔄 No projects found');
            return { success: true, data: { project: null, agents: [] } };
        }

        // If multiple projects, use the first one (or implement project selection logic)
        const firstProject = projectsResult.data[0];
        const projectId = firstProject.id;

        console.log('🔄 Loading full data for project:', projectId);

        // Get the full project data
        const fullProjectResult = await this.getPlan(projectId);
        if (!fullProjectResult.success) {
            return fullProjectResult;
        }

        // Validate the data is in the correct new API format
        if (this.validateNewSchemaData(fullProjectResult.data)) {
            console.log('🔄 Successfully loaded and validated project data');
            return { success: true, data: fullProjectResult.data };
        } else {
            return { success: false, error: 'Invalid data format received from API' };
        }
    }

    async getRunEventsForRuns(runIds = [], options = {}) {
        const { limit = 50, offset = 0 } = options;
        const eventsByRun = {};
        const errors = {};

        for (const runId of runIds) {
            const result = await this.getRunEvents(runId, limit, offset);
            if (result?.success) {
                eventsByRun[runId] = result.data;
            } else if (runId) {
                errors[runId] = result?.error || 'Failed to fetch events';
            }
        }

        if (Object.keys(eventsByRun).length === 0) {
            return { success: false, error: 'No events retrieved', errors };
        }

        return { success: true, data: eventsByRun, errors: Object.keys(errors).length ? errors : null };
    }

    // Data validation for new API format (plan_id, intents)
    validateNewSchemaData(apiData) {
        if (!apiData) {
            console.warn('validateNewSchemaData: No API data provided');
            return false;
        }

        if (typeof apiData !== 'object') {
            console.error('validateNewSchemaData: Invalid API data format');
            return false;
        }

        // Handle empty data (no plans) - this is valid
        if (Object.keys(apiData).length === 0) {
            console.log('validateNewSchemaData: Empty data received (no plans) - valid');
            return true;
        }

        // Check for new nested API format (project + agents)
        const hasProject = apiData.project && typeof apiData.project === 'object';
        const hasAgents = Array.isArray(apiData.agents);
        const hasProjectIntents = hasProject &&
            apiData.project.roadmap &&
            Array.isArray(apiData.project.roadmap.intents);

        if (hasProject && hasAgents && hasProjectIntents) {
            console.log('validateNewSchemaData: Valid nested API format with project and agents');
            return true;
        }

        // Also check for legacy flat format - check for plan_id and intents at top level
        const hasPlanId = apiData.plan_id && typeof apiData.plan_id === 'string';
        const hasIntents = Array.isArray(apiData.intents);

        if (hasPlanId && hasIntents) {
            console.log('validateNewSchemaData: Valid legacy API format with plan_id and intents');
            return true;
        }

        // Also accept data with just intents (for cases where plan_id might be missing)
        if (hasIntents) {
            console.log('validateNewSchemaData: Valid legacy API format with intents (plan_id may be missing)');
            return true;
        }

        console.error('validateNewSchemaData: Data does not match new API format', {
            hasProject,
            hasAgents,
            hasProjectIntents,
            hasPlanId,
            hasIntents,
            dataKeys: Object.keys(apiData),
            sampleData: JSON.stringify(apiData, null, 2).substring(0, 500) + '...'
        });
        return false;
    }

    // Helper methods
    parseJSONSafe(jsonString) {
        if (!jsonString || typeof jsonString !== 'string') return null;
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            console.warn('Failed to parse JSON:', jsonString, error);
            return null;
        }
    }


    // Real-time updates
    startPolling(callback) {
        if (this.pollingInterval) {
            this.stopPolling();
        }

        // Store callback for reuse
        this.currentCallback = callback;

        this.pollingInterval = setInterval(async () => {
            if (!this.isConnected) {
                const connectionResult = await this.testConnection();
                if (!connectionResult.success) {
                    callback({ type: 'connection_error', error: connectionResult.error });
                    return;
                }
            }

            try {
                const result = await this.getProjectData();
                if (result.success) {
                    if (this.validateNewSchemaData(result.data)) {
                        callback({ type: 'data_update', data: result.data });
                    } else {
                        callback({ type: 'fetch_error', error: 'Invalid data format received from API' });
                    }
                } else {
                    callback({ type: 'fetch_error', error: result.error });
                }
            } catch (error) {
                callback({ type: 'fetch_error', error: error.message });
            }
        }, this.pollingFrequency);

        console.log(`Started polling API every ${this.pollingFrequency}ms`);
        this.persistConnectionState();
    }

    // Trigger immediate data refresh
    async refreshProjectData() {
        if (!this.isConnected) {
            const connectionResult = await this.testConnection();
            if (!connectionResult.success) {
                throw new Error(connectionResult.error);
            }
        }

        const result = await this.getProjectDataTransformed();
        if (result.success) {
            if (this.validateNewSchemaData(result.data)) {
                return result.data;
            } else {
                throw new Error('Invalid data format received from API');
            }
        } else {
            throw new Error(result.error);
        }
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            console.log('Stopped polling API');
            this.persistConnectionState();
        }
    }

    setPollingFrequency(frequency) {
        this.pollingFrequency = frequency;
        if (this.pollingInterval) {
            // Restart polling with new frequency
            const callback = this.currentCallback;
            this.stopPolling();
            if (callback) {
                this.startPolling(callback);
            }
        }
        this.persistConnectionState();
    }

    // Connection status
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            error: this.connectionError,
            baseURL: this.baseURL,
            pollingActive: !!this.pollingInterval,
            pollingFrequency: this.pollingFrequency
        };
    }

    setBaseURL(url) {
        this.baseURL = url;
        this.isConnected = false;
        this.connectionError = null;
        this.shouldAutoReconnect = false;
        this.persistConnectionState();
    }

    manualDisconnect() {
        this.stopPolling();
        this.isConnected = false;
        this.connectionError = null;
        this.shouldAutoReconnect = false;
        this.persistConnectionState();
    }

    // Plan execution methods
    async submitPlan(plan, options = {}) {
        // Validate that plan uses new API format
        if (!this.isValidNewSchemaPlan(plan)) {
            return {
                success: false,
                error: 'Plan must use new API format (plan_id/intents)'
            };
        }

        // For new API format, submit as-is (plan already contains the nested structure)
        const payload = plan;

        const result = await this.retryFetch(`${this.baseURL}/api/v1/plans`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (!result.success) {
            return result;
        }

        try {
            const data = await result.response.json();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: `Failed to parse response: ${error.message}` };
        }
    }

    // Validate that plan uses new API format (plan_id, intents)
    isValidNewSchemaPlan(plan) {
        if (!plan || typeof plan !== 'object') {
            return false;
        }

        // Check for new API format (nested plan with project and agents)
        if (plan.plan && plan.plan.project && plan.plan.project.roadmap &&
            Array.isArray(plan.plan.project.roadmap.intents) &&
            Array.isArray(plan.plan.agents)) {
            return true;
        }

        // Also support legacy format for backward compatibility (plan_id, intents)
        if (plan.plan_id && plan.intents && Array.isArray(plan.intents)) {
            return true;
        }

        return false;
    }

    // Story execution methods (New Schema)
    async executeStory(storyId, options = {}) {
        const result = await this.retryFetch(`${this.baseURL}/api/v1/stories/${storyId}/execute`, {
            method: 'POST',
            body: JSON.stringify(options)
        });

        if (!result.success) {
            return result;
        }

        try {
            const data = await result.response.json();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: `Failed to parse response: ${error.message}` };
        }
    }

    async getStoryExecutionStatus(storyId) {
        const result = await this.retryFetch(`${this.baseURL}/api/v1/stories/${storyId}/execution`);

        if (!result.success) {
            return result;
        }

        try {
            const data = await result.response.json();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: `Failed to parse response: ${error.message}` };
        }
    }

    // Get all projects (New Schema)
    async getProjects() {
        const result = await this.retryFetch(`${this.baseURL}/api/v1/projects`);

        if (!result.success) {
            return result;
        }

        try {
            const data = await result.response.json();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: `Failed to parse response: ${error.message}` };
        }
    }

    // New Schema Endpoints

    // Project Management
    async createProject(projectData) {
        const result = await this.retryFetch(`${this.baseURL}/api/v1/projects`, {
            method: 'POST',
            body: JSON.stringify(projectData)
        });

        if (!result.success) {
            return result;
        }

        try {
            const data = await result.response.json();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: `Failed to parse response: ${error.message}` };
        }
    }

    async getAllProjects() {
        const result = await this.retryFetch(`${this.baseURL}/api/v1/projects`);

        if (!result.success) {
            return result;
        }

        try {
            const data = await result.response.json();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: `Failed to parse response: ${error.message}` };
        }
    }

    async getProjectDetails(projectId) {
        const result = await this.retryFetch(`${this.baseURL}/api/v1/projects/${projectId}`);

        if (!result.success) {
            return result;
        }

        try {
            const data = await result.response.json();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: `Failed to parse response: ${error.message}` };
        }
    }

    // Intent Management (New Schema)
    async createIntent(projectId, intentData) {
        const result = await this.retryFetch(`${this.baseURL}/api/v1/projects/${projectId}/intents`, {
            method: 'POST',
            body: JSON.stringify(intentData)
        });

        if (!result.success) {
            return result;
        }

        try {
            const data = await result.response.json();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: `Failed to parse response: ${error.message}` };
        }
    }

    // Story Management
    async createStory(storyData) {
        const result = await this.retryFetch(`${this.baseURL}/api/v1/stories`, {
            method: 'POST',
            body: JSON.stringify(storyData)
        });

        if (!result.success) {
            return result;
        }

        try {
            const data = await result.response.json();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: `Failed to parse response: ${error.message}` };
        }
    }

    // Agent Management
    async createAgent(agentData) {
        const result = await this.retryFetch(`${this.baseURL}/api/v1/agents`, {
            method: 'POST',
            body: JSON.stringify(agentData)
        });

        if (!result.success) {
            return result;
        }

        try {
            const data = await result.response.json();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: `Failed to parse response: ${error.message}` };
        }
    }

    // Checkpoint Management
    async createCheckpoint(checkpointData) {
        const result = await this.retryFetch(`${this.baseURL}/api/v1/checkpoints`, {
            method: 'POST',
            body: JSON.stringify(checkpointData)
        });

        if (!result.success) {
            return result;
        }

        try {
            const data = await result.response.json();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: `Failed to parse response: ${error.message}` };
        }
    }

    // Get complete plan (New Schema)
    async getPlan(projectId) {
        const url = `${this.baseURL}/api/v1/plans/${projectId}`;
        console.log('🌐 getPlan calling URL:', url);
        const result = await this.retryFetch(url);

        if (!result.success) {
            console.log('🌐 getPlan request failed:', result);
            return result;
        }

        try {
            const data = await result.response.json();
            console.log('🌐 getPlan response data:', data);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: `Failed to parse response: ${error.message}` };
        }
    }




    // Validate plan structure (new API format only)
    validatePlanStructure(plan) {
        const errors = [];

        if (!plan) {
            errors.push('Plan is required');
            return { valid: false, errors };
        }

        // Check if this is the new nested API format (has plan.project and plan.agents)
        if (plan.plan && plan.plan.project && plan.plan.agents) {
            return this.validateNestedApiFormat(plan);
        }

        // Check if this is the legacy API format (has plan_id and intents at top level)
        if (plan.plan_id && plan.intents) {
            return this.validateNewApiFormat(plan);
        }

        // If no valid format is detected
        errors.push('Plan must be in valid API format (nested plan structure or legacy plan_id/intents)');
        return { valid: false, errors };
    }

    // Validate new API format (plan_id, intents, etc.)
    validateNewApiFormat(plan) {
        const errors = [];

        // Validate plan_id
        if (!plan.plan_id || typeof plan.plan_id !== 'string') {
            errors.push('plan_id is required and must be a string');
        }

        // Validate intents
        if (!Array.isArray(plan.intents)) {
            errors.push('intents array is required');
            return { valid: false, errors };
        }

        if (plan.intents.length === 0) {
            errors.push('Plan must have at least one intent');
        }

        plan.intents.forEach((intent, intentIndex) => {
            if (!intent.id || typeof intent.id !== 'string') {
                errors.push(`Intent ${intentIndex + 1}: id is required and must be a string`);
            }

            if (!intent.name || typeof intent.name !== 'string') {
                errors.push(`Intent ${intentIndex + 1}: name is required and must be a string`);
            }

            // Validate stories within intent
            if (!Array.isArray(intent.stories)) {
                errors.push(`Intent ${intentIndex + 1}: stories array is required`);
            } else {
                intent.stories.forEach((story, storyIndex) => {
                    if (!story.id || typeof story.id !== 'string') {
                        errors.push(`Intent ${intentIndex + 1}, Story ${storyIndex + 1}: id is required and must be a string`);
                    }

                    if (!story.title || typeof story.title !== 'string') {
                        errors.push(`Intent ${intentIndex + 1}, Story ${storyIndex + 1}: title is required and must be a string`);
                    }

                    if (!story.acceptance || typeof story.acceptance !== 'string') {
                        errors.push(`Intent ${intentIndex + 1}, Story ${storyIndex + 1}: acceptance is required and must be a string`);
                    }

                    // Validate deps array
                    if (!Array.isArray(story.deps)) {
                        errors.push(`Intent ${intentIndex + 1}, Story ${storyIndex + 1}: deps must be an array`);
                    }

                    // Validate scope_globs array
                    if (!Array.isArray(story.scope_globs)) {
                        errors.push(`Intent ${intentIndex + 1}, Story ${storyIndex + 1}: scope_globs must be an array`);
                    }

                    // Validate engineer_kind
                    if (!story.engineer_kind || typeof story.engineer_kind !== 'string') {
                        errors.push(`Intent ${intentIndex + 1}, Story ${storyIndex + 1}: engineer_kind is required and must be a string`);
                    }

                    // Validate priority
                    if (!story.priority || !['high', 'medium', 'low'].includes(story.priority)) {
                        errors.push(`Intent ${intentIndex + 1}, Story ${storyIndex + 1}: priority must be one of: high, medium, low`);
                    }
                });
            }
        });

        // Validate optional fields
        if (plan.auto_approve !== undefined && typeof plan.auto_approve !== 'boolean') {
            errors.push('auto_approve must be a boolean');
        }

        if (plan.base_repo_url !== undefined && typeof plan.base_repo_url !== 'string') {
            errors.push('base_repo_url must be a string');
        }

        if (plan.base_branch !== undefined && typeof plan.base_branch !== 'string') {
            errors.push('base_branch must be a string');
        }

        if (plan.default_run_mode !== undefined && !['shadow', 'merge'].includes(plan.default_run_mode)) {
            errors.push('default_run_mode must be one of: shadow, merge');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Validate nested API format (plan.project, plan.agents)
    validateNestedApiFormat(plan) {
        const errors = [];
        const project = plan.plan.project;
        const agents = plan.plan.agents;

        // Validate project structure
        if (!project.id || typeof project.id !== 'string') {
            errors.push('plan.project.id is required and must be a string');
        }

        if (!project.name || typeof project.name !== 'string') {
            errors.push('plan.project.name is required and must be a string');
        }

        if (!project.status || !['planned', 'executing', 'completed', 'on_hold', 'cancelled'].includes(project.status)) {
            errors.push('plan.project.status must be one of: planned, executing, completed, on_hold, cancelled');
        }

        // Validate roadmap and intents
        if (!project.roadmap || !Array.isArray(project.roadmap.intents)) {
            errors.push('plan.project.roadmap.intents array is required');
            return { valid: false, errors };
        }

        if (project.roadmap.intents.length === 0) {
            errors.push('Plan must have at least one intent');
        }

        // Validate each intent and its stories
        project.roadmap.intents.forEach((intent, intentIndex) => {
            if (!intent.id || typeof intent.id !== 'string') {
                errors.push(`Intent ${intentIndex + 1}: id is required and must be a string`);
            }

            if (!intent.name || typeof intent.name !== 'string') {
                errors.push(`Intent ${intentIndex + 1}: name is required and must be a string`);
            }

            if (!Array.isArray(intent.stories)) {
                errors.push(`Intent ${intentIndex + 1}: stories array is required`);
            } else {
                intent.stories.forEach((story, storyIndex) => {
                    if (!story.id || typeof story.id !== 'string') {
                        errors.push(`Intent ${intentIndex + 1}, Story ${storyIndex + 1}: id is required and must be a string`);
                    }

                    if (!story.objective || typeof story.objective !== 'string') {
                        errors.push(`Intent ${intentIndex + 1}, Story ${storyIndex + 1}: objective is required and must be a string`);
                    }

                    if (!story.workstream_id || typeof story.workstream_id !== 'string') {
                        errors.push(`Intent ${intentIndex + 1}, Story ${storyIndex + 1}: workstream_id is required and must be a string`);
                    }
                });
            }
        });

        // Validate agents array
        if (!Array.isArray(agents)) {
            errors.push('plan.agents must be an array');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

}

// Create singleton instance
const apiService = new APIService();

export default apiService;
