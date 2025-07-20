import React, { createContext, useContext, useReducer, useEffect } from 'react';
import uiSchema from '../schemas/ui-schema.json';

const PlanContext = createContext();

const initialState = {
    planData: null,
    uiSchema: uiSchema, // UI structure and field definitions
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

        case 'ADD_MILESTONE':
            if (!state.planData) return state;
            return {
                ...state,
                planData: {
                    ...state.planData,
                    project: {
                        ...state.planData.project,
                        milestones: [...state.planData.project.milestones, action.payload]
                    }
                }
            };

        case 'DELETE_MILESTONE':
            if (!state.planData) return state;

            const milestoneIdToDelete = action.payload;

            // Remove milestone from project
            const updatedMilestonesAfterDelete = state.planData.project.milestones.filter(
                milestone => milestone.id !== milestoneIdToDelete
            );

            // Update stories that were assigned to this milestone
            const updatedStoriesAfterMilestoneDelete = state.planData.stories.map(story => {
                if (story.milestone === milestoneIdToDelete) {
                    return {
                        ...story,
                        milestone: '', // Unassign from milestone
                        updated_at: new Date().toISOString()
                    };
                }
                return story;
            });

            return {
                ...state,
                planData: {
                    ...state.planData,
                    project: {
                        ...state.planData.project,
                        milestones: updatedMilestonesAfterDelete
                    },
                    stories: updatedStoriesAfterMilestoneDelete
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
            // Load plan data dynamically from public directory
            const response = await fetch('/plan-data.json');
            if (!response.ok) {
                throw new Error(`Failed to load plan data: ${response.status}`);
            }
            const planData = await response.json();
            dispatch({ type: 'SET_PLAN_DATA', payload: planData });
        } catch (error) {
            console.error('Error loading plan data:', error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
        }
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