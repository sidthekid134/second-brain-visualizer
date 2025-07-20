import React, { createContext, useContext, useReducer, useEffect } from 'react';
import planSchema from '../data/plan-schema.json';

const PlanContext = createContext();

const initialState = {
    planData: null,
    liveData: null,
    schema: planSchema,
    loading: false,
    error: null,
    selectedNode: null,
    editMode: false
};

// Helper function to ensure dependency integrity
function ensureDependencyIntegrity(stories) {
    const storyMap = new Map(stories.map(story => [story.id, story]));

    return stories.map(story => {
        // Clean up invalid dependencies
        const validDependencies = story.dependencies.filter(depId => storyMap.has(depId));
        const validDependents = story.dependents.filter(depId => storyMap.has(depId));

        // Remove duplicates
        const uniqueDependencies = [...new Set(validDependencies)];
        const uniqueDependents = [...new Set(validDependents)];

        return {
            ...story,
            dependencies: uniqueDependencies,
            dependents: uniqueDependents
        };
    });
}

// Helper function to validate and fix bidirectional dependencies
function validateBidirectionalDependencies(stories) {
    const storyMap = new Map(stories.map(story => [story.id, { ...story }]));

    // First pass: ensure all dependencies have corresponding dependents
    stories.forEach(story => {
        story.dependencies.forEach(depId => {
            const dependencyStory = storyMap.get(depId);
            if (dependencyStory && !dependencyStory.dependents.includes(story.id)) {
                dependencyStory.dependents = [...dependencyStory.dependents, story.id];
            }
        });
    });

    // Second pass: ensure all dependents have corresponding dependencies
    stories.forEach(story => {
        story.dependents.forEach(depId => {
            const dependentStory = storyMap.get(depId);
            if (dependentStory && !dependentStory.dependencies.includes(story.id)) {
                dependentStory.dependencies = [...dependentStory.dependencies, story.id];
            }
        });
    });

    return Array.from(storyMap.values());
}

function planReducer(state, action) {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: action.payload };

        case 'SET_ERROR':
            return { ...state, error: action.payload, loading: false };

        case 'SET_PLAN_DATA':
            return { ...state, planData: action.payload, loading: false, error: null };

        case 'SET_LIVE_DATA':
            return { ...state, liveData: action.payload, loading: false, error: null };

        case 'UPDATE_STORY':
            if (!state.planData) return state;

            const updatedStories = state.planData.stories.map(story =>
                story.id === action.payload.id ? {
                    ...story,
                    ...action.payload.updates,
                    updated_at: new Date().toISOString()
                } : story
            );

            return {
                ...state,
                planData: {
                    ...state.planData,
                    stories: ensureDependencyIntegrity(updatedStories)
                }
            };

        case 'UPDATE_MILESTONE':
            if (!state.planData) return state;
            return {
                ...state,
                planData: {
                    ...state.planData,
                    project: {
                        ...state.planData.project,
                        milestones: state.planData.project.milestones.map(milestone =>
                            milestone.id === action.payload.id ? {
                                ...milestone,
                                ...action.payload.updates
                            } : milestone
                        )
                    }
                }
            };

        case 'ADD_STORY':
            if (!state.planData) return state;

            const newStory = action.payload;
            let updatedMilestones = state.planData.project.milestones;

            // Add story to milestone if specified
            if (newStory.milestone) {
                updatedMilestones = state.planData.project.milestones.map(milestone => {
                    if (milestone.id === newStory.milestone) {
                        const existingStories = milestone.stories || [];
                        return {
                            ...milestone,
                            stories: existingStories.includes(newStory.id) ?
                                existingStories :
                                [...existingStories, newStory.id]
                        };
                    }
                    return milestone;
                });
            }

            const storiesWithNew = [...state.planData.stories, newStory];

            return {
                ...state,
                planData: {
                    ...state.planData,
                    stories: ensureDependencyIntegrity(storiesWithNew),
                    project: {
                        ...state.planData.project,
                        milestones: updatedMilestones
                    }
                }
            };

        case 'DELETE_STORY':
            if (!state.planData) return state;

            const storyIdToDelete = action.payload;
            const storyToDelete = state.planData.stories.find(s => s.id === storyIdToDelete);

            // Remove story from milestone
            let milestonesAfterDelete = state.planData.project.milestones;
            if (storyToDelete && storyToDelete.milestone) {
                milestonesAfterDelete = state.planData.project.milestones.map(milestone => {
                    if (milestone.id === storyToDelete.milestone) {
                        return {
                            ...milestone,
                            stories: (milestone.stories || []).filter(id => id !== storyIdToDelete)
                        };
                    }
                    return milestone;
                });
            }

            // Remove the story and clean up all dependencies
            const remainingStories = state.planData.stories.filter(story => story.id !== storyIdToDelete);

            // Clean up all references to the deleted story
            const cleanedStories = remainingStories.map(story => {
                const hadReference = story.dependencies.includes(storyIdToDelete) ||
                    story.dependents.includes(storyIdToDelete);

                return {
                    ...story,
                    dependencies: story.dependencies.filter(id => id !== storyIdToDelete),
                    dependents: story.dependents.filter(id => id !== storyIdToDelete),
                    updated_at: hadReference ? new Date().toISOString() : story.updated_at
                };
            });

            return {
                ...state,
                planData: {
                    ...state.planData,
                    stories: ensureDependencyIntegrity(cleanedStories),
                    project: {
                        ...state.planData.project,
                        milestones: milestonesAfterDelete
                    }
                }
            };

        case 'UPDATE_DEPENDENCIES':
            if (!state.planData) return state;

            const updatedStoriesWithDeps = state.planData.stories.map(story => {
                if (story.id === action.payload.storyId) {
                    return {
                        ...story,
                        dependencies: [...new Set(action.payload.dependencies)], // Remove duplicates
                        dependents: [...new Set(action.payload.dependents)], // Remove duplicates
                        updated_at: new Date().toISOString()
                    };
                }
                return story;
            });

            // Validate bidirectional dependencies
            const validatedStories = validateBidirectionalDependencies(updatedStoriesWithDeps);

            return {
                ...state,
                planData: {
                    ...state.planData,
                    stories: ensureDependencyIntegrity(validatedStories)
                }
            };

        case 'VALIDATE_AND_FIX_DEPENDENCIES':
            if (!state.planData) return state;

            console.log('Validating and fixing dependencies...');
            const fixedStories = validateBidirectionalDependencies(state.planData.stories);

            return {
                ...state,
                planData: {
                    ...state.planData,
                    stories: ensureDependencyIntegrity(fixedStories)
                }
            };

        case 'SET_SELECTED_NODE':
            return { ...state, selectedNode: action.payload };

        case 'SET_EDIT_MODE':
            return { ...state, editMode: action.payload };

        default:
            return state;
    }
}

export function PlanProvider({ children }) {
    const [state, dispatch] = useReducer(planReducer, initialState);

    // Load initial data
    useEffect(() => {
        loadPlanData();
        loadLiveData();
    }, []);

    // Validate dependencies periodically in development mode
    useEffect(() => {
        if (process.env.NODE_ENV === 'development' && state.planData) {
            const validateInterval = setInterval(() => {
                dispatch({ type: 'VALIDATE_AND_FIX_DEPENDENCIES' });
            }, 30000); // Every 30 seconds

            return () => clearInterval(validateInterval);
        }
    }, [state.planData]);

    const loadPlanData = async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            // For now, we'll create a sample plan based on the schema
            const samplePlan = createSamplePlan();
            dispatch({ type: 'SET_PLAN_DATA', payload: samplePlan });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
        }
    };

    const loadLiveData = async () => {
        try {
            const response = await fetch('/live-file.json');
            const liveData = await response.json();
            dispatch({ type: 'SET_LIVE_DATA', payload: liveData });
        } catch (error) {
            console.warn('Could not load live data:', error);
            // Don't set error for live data as it's optional
        }
    };

    const createSamplePlan = () => {
        return {
            project: {
                id: "PRJ-001",
                name: "Sample Project",
                description: "A sample project for demonstration",
                status: "executing",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                progress: {
                    completion_percentage: 25
                },
                budget: {
                    limit: 1000,
                    used: 250
                },
                milestones: [
                    {
                        id: "MS-001",
                        name: "Planning Phase",
                        status: "completed",
                        stories: ["ST-001", "ST-002"],
                        manager_id: "manager-planning"
                    },
                    {
                        id: "MS-002",
                        name: "Development Phase",
                        status: "in_progress",
                        stories: ["ST-003", "ST-004"],
                        manager_id: "manager-development"
                    },
                    {
                        id: "MS-003",
                        name: "Testing Phase",
                        status: "planned",
                        stories: ["ST-005"],
                        manager_id: "manager-testing"
                    }
                ]
            },
            stories: [
                {
                    id: "ST-001",
                    objective: "Project Setup",
                    milestone: "MS-001",
                    acceptance_criteria: ["Setup development environment", "Create project structure"],
                    status: "done",
                    owner_id: "AG-001",
                    dependencies: [],
                    dependents: ["ST-002"],
                    implementation_notes: ["Use React and Node.js"],
                    blocking_issues: [],
                    estimated_tokens: 100,
                    actual_tokens: 95,
                    complexity_score: 2,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    execution: {
                        current: {
                            status: "done",
                            agent_id: "AG-001",
                            started_at: new Date(Date.now() - 86400000).toISOString(),
                            ended_at: new Date(Date.now() - 82800000).toISOString(),
                            duration_seconds: 3600,
                            result: "Successfully completed project setup",
                            messages_count: 15
                        },
                        history: []
                    }
                },
                {
                    id: "ST-002",
                    objective: "Requirements Analysis",
                    milestone: "MS-001",
                    acceptance_criteria: ["Document all requirements", "Create user stories"],
                    status: "done",
                    owner_id: "AG-002",
                    dependencies: ["ST-001"],
                    dependents: ["ST-003"],
                    implementation_notes: ["Focus on core features first"],
                    blocking_issues: [],
                    estimated_tokens: 150,
                    actual_tokens: 140,
                    complexity_score: 3,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    execution: {
                        current: {
                            status: "done",
                            agent_id: "AG-002",
                            started_at: new Date(Date.now() - 82800000).toISOString(),
                            ended_at: new Date(Date.now() - 79200000).toISOString(),
                            duration_seconds: 3600,
                            result: "Requirements documented",
                            messages_count: 22
                        },
                        history: []
                    }
                },
                {
                    id: "ST-003",
                    objective: "Core Feature Development",
                    milestone: "MS-002",
                    acceptance_criteria: ["Implement main functionality", "Add unit tests"],
                    status: "in_progress",
                    owner_id: "AG-003",
                    dependencies: ["ST-002"],
                    dependents: ["ST-004"],
                    implementation_notes: ["Use TDD approach"],
                    blocking_issues: [],
                    estimated_tokens: 300,
                    actual_tokens: null,
                    complexity_score: 5,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    execution: {
                        current: {
                            status: "in_progress",
                            agent_id: "AG-003",
                            started_at: new Date(Date.now() - 3600000).toISOString(),
                            ended_at: null,
                            duration_seconds: null,
                            result: null,
                            messages_count: 8
                        },
                        history: []
                    }
                },
                {
                    id: "ST-004",
                    objective: "API Integration",
                    milestone: "MS-002",
                    acceptance_criteria: ["Connect to external APIs", "Handle error cases"],
                    status: "planned",
                    owner_id: "AG-003",
                    dependencies: ["ST-003"],
                    dependents: ["ST-005"],
                    implementation_notes: ["Use REST APIs"],
                    blocking_issues: [],
                    estimated_tokens: 200,
                    actual_tokens: null,
                    complexity_score: 4,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    execution: {
                        current: {
                            status: "planned",
                            agent_id: "AG-003"
                        },
                        history: []
                    }
                },
                {
                    id: "ST-005",
                    objective: "End-to-End Testing",
                    milestone: "MS-003",
                    acceptance_criteria: ["Create test scenarios", "Run automated tests"],
                    status: "planned",
                    owner_id: "AG-004",
                    dependencies: ["ST-004"],
                    dependents: [],
                    implementation_notes: ["Use Cypress for E2E testing"],
                    blocking_issues: [],
                    estimated_tokens: 150,
                    actual_tokens: null,
                    complexity_score: 3,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    execution: {
                        current: {
                            status: "planned",
                            agent_id: "AG-004"
                        },
                        history: []
                    }
                }
            ],
            agents: [
                {
                    id: "AG-001",
                    name: "Setup Engineer",
                    role: "engineer",
                    manager_id: null,
                    reports: [],
                    milestone_ids: ["MS-001"],
                    assigned_story_ids: ["ST-001"]
                },
                {
                    id: "AG-002",
                    name: "Business Analyst",
                    role: "engineer",
                    manager_id: null,
                    reports: [],
                    milestone_ids: ["MS-001"],
                    assigned_story_ids: ["ST-002"]
                },
                {
                    id: "AG-003",
                    name: "Full Stack Developer",
                    role: "engineer",
                    manager_id: null,
                    reports: [],
                    milestone_ids: ["MS-002"],
                    assigned_story_ids: ["ST-003", "ST-004"]
                },
                {
                    id: "AG-004",
                    name: "QA Engineer",
                    role: "engineer",
                    manager_id: null,
                    reports: [],
                    milestone_ids: ["MS-003"],
                    assigned_story_ids: ["ST-005"]
                }
            ]
        };
    };

    const savePlan = async (planData) => {
        // In a real app, this would save to a backend
        dispatch({ type: 'SET_PLAN_DATA', payload: planData });
        localStorage.setItem('planData', JSON.stringify(planData));
    };

    const value = {
        ...state,
        dispatch,
        loadPlanData,
        loadLiveData,
        savePlan
    };

    return (
        <PlanContext.Provider value={value}>
            {children}
        </PlanContext.Provider>
    );
}

export function usePlan() {
    const context = useContext(PlanContext);
    if (!context) {
        throw new Error('usePlan must be used within a PlanProvider');
    }
    return context;
} 