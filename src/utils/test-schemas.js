/**
 * Simple test utility to verify schema normalization
 * This can be used in the browser console to test the schema utils
 */

import { normalizeProjectData, detectSchema, getSchemaDisplayInfo } from './schemaUtils';

// Test data samples
const liveFileExample = {
    project_info: {
        id: "PR-test",
        name: "Test Live Project",
        status: "running"
    },
    execution_status: {
        completion_percentage: 75,
        total_stories: 5
    },
    project_structure: {
        stories: [
            { id: "ST-1", objective: "Setup", status: "done", dependencies: [] },
            { id: "ST-2", objective: "Feature", status: "in_progress", dependencies: ["ST-1"] }
        ]
    }
};

const simpleExample = {
    id: "PR-simple",
    name: "Simple Project",
    status: "planning",
    stories: {
        "ST-A": { id: "ST-A", objective: "Task A", status: "ready", dependencies: [] },
        "ST-B": { id: "ST-B", objective: "Task B", status: "blocked", dependencies: ["ST-A"] }
    }
};

export const testSchemas = () => {
    console.log('=== Testing Schema Detection ===');
    console.log('Live file schema:', detectSchema(liveFileExample));
    console.log('Simple schema:', detectSchema(simpleExample));

    console.log('\n=== Testing Normalization ===');
    const normalizedLive = normalizeProjectData(liveFileExample);
    const normalizedSimple = normalizeProjectData(simpleExample);

    console.log('Normalized live file:', normalizedLive);
    console.log('Normalized simple:', normalizedSimple);

    console.log('\n=== Testing Display Info ===');
    console.log('Live file display info:', getSchemaDisplayInfo(normalizedLive));
    console.log('Simple display info:', getSchemaDisplayInfo(normalizedSimple));

    return {
        liveFileExample,
        simpleExample,
        normalizedLive,
        normalizedSimple
    };
};

// Auto-run in development
if (process.env.NODE_ENV === 'development') {
    window.testSchemas = testSchemas;
    console.log('Schema test utility loaded. Run testSchemas() in console to test.');
} 