import React, { createContext, useContext, useReducer, useEffect } from 'react';
import uiSchema from '../schemas/ui-schema.json';

const PlanContext = createContext();

const initialState = {
    planData: null,
    uiSchema: uiSchema, // UI structure and field definitions
    loading: false,
    error: null,
    selectedNode: null,
    editMode: true
};

// Helper function to compute dependents dynamically from dependencies
function computeDependents(stories) {
    const storyMap = new Map(stories.map(story => [story.id, { ...story }]));

    // Initialize empty dependents for all stories
    storyMap.forEach(story => {
        story.dependents = [];
    });

    // Compute dependents from dependencies
    storyMap.forEach(story => {
        story.dependencies.forEach(depId => {
            const dependencyStory = storyMap.get(depId);
            if (dependencyStory && !dependencyStory.dependents.includes(story.id)) {
                dependencyStory.dependents.push(story.id);
            }
        });
    });

    return Array.from(storyMap.values());
}

// Helper function to ensure dependency integrity
function ensureDependencyIntegrity(stories) {
    const storyMap = new Map(stories.map(story => [story.id, story]));

    return stories.map(story => {
        // Clean up invalid dependencies
        const validDependencies = story.dependencies.filter(depId => storyMap.has(depId));

        // Remove duplicates
        const uniqueDependencies = [...new Set(validDependencies)];

        return {
            ...story,
            dependencies: uniqueDependencies
        };
    });
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

            // Clean up all references to the deleted story from dependencies
            const cleanedStories = remainingStories.map(story => {
                const hadReference = story.dependencies.includes(storyIdToDelete);

                return {
                    ...story,
                    dependencies: story.dependencies.filter(id => id !== storyIdToDelete),
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
                        updated_at: new Date().toISOString()
                    };
                }
                return story;
            });

            return {
                ...state,
                planData: {
                    ...state.planData,
                    stories: ensureDependencyIntegrity(updatedStoriesWithDeps)
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

    // Load initial plan data from public directory
    useEffect(() => {
        loadPlanData();
    }, []);

    const loadPlanData = async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            // Load plan data from public directory
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

    // Helper function to get computed dependents for a story
    const getDependentsForStory = (storyId) => {
        if (!state.planData?.stories) return [];

        return state.planData.stories
            .filter(story => story.dependencies.includes(storyId))
            .map(story => story.id);
    };

    // Helper function to get story with computed dependents
    const getStoryWithDependents = (storyId) => {
        const story = state.planData?.stories.find(s => s.id === storyId);
        if (!story) return null;

        return {
            ...story,
            dependents: getDependentsForStory(storyId)
        };
    };

    // Helper function to get all stories with computed dependents
    const getStoriesWithDependents = () => {
        if (!state.planData?.stories) return [];
        return computeDependents(state.planData.stories);
    };

    const value = {
        ...state,
        dispatch,
        loadPlanData,
        getDependentsForStory,
        getStoryWithDependents,
        getStoriesWithDependents
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
        throw new Error('usePlan must be used within PlanProvider');
    }
    return context;
} 