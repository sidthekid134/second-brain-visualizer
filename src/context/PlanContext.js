import React, { createContext, useContext, useReducer, useEffect } from 'react';
import uiSchema from '../schemas/ui-schema.json';

const PlanContext = createContext();

const initialState = {
    planData: null,
    uiSchema: uiSchema, // UI structure and field definitions
    loading: false,
    error: null,
    selectedNode: null,
    editMode: true, // Always in edit mode now
    executionView: false, // Toggle to show/hide execution status
    // Navigation state for dual-level view
    viewLevel: 'intent', // 'intent' or 'story'
    selectedIntentId: null, // When in story view, which intent to show
    // Global change tracking
    pendingChanges: {}, // Map of entity_type:entity_id -> changes
    hasUnsavedChanges: false,
    // Dependency cascade tracking
    dependencyAffected: {}, // Map of entity_type:entity_id -> true for nodes affected by dependency changes
    editedNodes: {}, // Map of entity_type:entity_id -> true for nodes that have been directly edited
    newNodes: {}, // Map of entity_type:entity_id -> true for nodes that are newly created
    deletedNodes: {}, // Map of entity_type:entity_id -> true for nodes marked for deletion
    // Undo/Redo system
    undoHistory: [], // Array of operations that can be undone
    redoHistory: [], // Array of operations that can be redone
    canUndo: false,
    canRedo: false,
    // Data source tracking
    dataSource: 'loading', // 'loading', 'default', 'session_storage', 'work_file'
    dataTimestamp: null, // When the current data was last updated
    sessionTimestamp: null // When session storage was last updated
};

// Undo/Redo Helper Functions
function createOperationDiff(operationType, entityType, entityId, beforeData, afterData) {
    return {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        operationType, // 'update', 'create', 'delete'
        entityType,   // 'story', 'checkpoint', 'intent'
        entityId,
        beforeData: beforeData ? JSON.parse(JSON.stringify(beforeData)) : null,
        afterData: afterData ? JSON.parse(JSON.stringify(afterData)) : null
    };
}

function saveHistoryToSession(undoHistory, redoHistory) {
    try {
        const historyData = {
            undoHistory: undoHistory.slice(-50), // Keep last 50 operations
            redoHistory: redoHistory.slice(-50),
            timestamp: Date.now()
        };
        sessionStorage.setItem('planEditor_undoHistory', JSON.stringify(historyData));
    } catch (error) {
        console.warn('Failed to save undo history to sessionStorage:', error);
    }
}

function loadHistoryFromSession() {
    try {
        const saved = sessionStorage.getItem('planEditor_undoHistory');
        if (saved) {
            const historyData = JSON.parse(saved);
            // Check if it's not too old (session should be reasonably fresh)
            const hourAgo = Date.now() - (60 * 60 * 1000);
            if (historyData.timestamp > hourAgo) {
                return {
                    undoHistory: historyData.undoHistory || [],
                    redoHistory: historyData.redoHistory || []
                };
            }
        }
    } catch (error) {
        console.warn('Failed to load undo history from sessionStorage:', error);
    }
    return { undoHistory: [], redoHistory: [] };
}

function clearHistoryFromSession() {
    try {
        sessionStorage.removeItem('planEditor_undoHistory');
    } catch (error) {
        console.warn('Failed to clear undo history from sessionStorage:', error);
    }
}

// Helper function to compute dependents dynamically from dependencies
function computeDependents(stories) {
    if (!stories || !Array.isArray(stories)) return [];

    const storyMap = new Map(stories.map(story => [story.id, { ...story }]));

    // Initialize empty dependents for all stories
    storyMap.forEach(story => {
        story.dependents = [];
    });

    // Compute dependents from dependencies
    storyMap.forEach(story => {
        (story.dependencies || []).forEach(dep => {
            if (dep.type === 'story') {
                const dependencyStory = storyMap.get(dep.id);
                if (dependencyStory && !dependencyStory.dependents.includes(story.id)) {
                    dependencyStory.dependents.push(story.id);
                }
            }
        });
    });

    return Array.from(storyMap.values());
}

// Helper function to get all stories from intents in the new schema
function getAllStoriesFromIntents(planData) {
    if (!planData?.project?.roadmap?.intents) return [];

    const allStories = [];
    planData.project.roadmap.intents.forEach(intent => {
        if (intent.stories && Array.isArray(intent.stories)) {
            // Add intent_id to each story for backward compatibility
            intent.stories.forEach(story => {
                allStories.push({
                    ...story,
                    intent_id: intent.id
                });
            });
        }
    });
    return allStories;
}

// Helper function to get stories for a specific intent
function getStoriesForIntent(planData, intentId) {
    if (!planData?.project?.roadmap?.intents) return [];

    const intent = planData.project.roadmap.intents.find(i => i.id === intentId);
    if (!intent || !intent.stories) return [];

    return intent.stories.map(story => ({
        ...story,
        intent_id: intentId
    }));
}

// Helper function to ensure dependency integrity across the plan
function ensureDependencyIntegrity(stories) {
    if (!stories || !Array.isArray(stories)) return [];

    return stories.map(story => ({
        ...story,
        dependencies: (story.dependencies || []).filter(dep => {
            // For now, only validate story dependencies
            // TODO: Add validation for intent and checkpoint dependencies
            if (dep.type === 'story') {
                return stories.some(s => s.id === dep.id);
            }
            return true; // Keep non-story dependencies as-is for now
        })
    }));
}

// Helper function to recursively find all dependents of a node
function findAllDependents(planData, entityType, entityId, visited = new Set()) {
    if (visited.has(`${entityType}:${entityId}`)) {
        return new Set(); // Avoid circular dependencies
    }

    visited.add(`${entityType}:${entityId}`);
    const dependents = new Set();

    if (!planData) return dependents;

    // Find direct dependents in stories
    if (planData.stories) {
        planData.stories.forEach(story => {
            if ((story.dependencies || []).some(dep =>
                dep.type === entityType && dep.id === entityId
            )) {
                dependents.add(`story:${story.id}`);
                // Recursively find dependents of this story
                const nestedDependents = findAllDependents(planData, 'story', story.id, visited);
                nestedDependents.forEach(dep => dependents.add(dep));
            }
        });
    }

    // Find direct dependents in checkpoints
    if (planData.project?.checkpoints) {
        planData.project.checkpoints.forEach(checkpoint => {
            if ((checkpoint.dependencies || []).some(dep =>
                dep.type === entityType && dep.id === entityId
            )) {
                dependents.add(`checkpoint:${checkpoint.id}`);
                // Recursively find dependents of this checkpoint
                const nestedDependents = findAllDependents(planData, 'checkpoint', checkpoint.id, visited);
                nestedDependents.forEach(dep => dependents.add(dep));
            }

            // Also check if stories in checkpoint depend on this entity
            if (entityType === 'story' && (checkpoint.story_ids || []).includes(entityId)) {
                dependents.add(`checkpoint:${checkpoint.id}`);
                const nestedDependents = findAllDependents(planData, 'checkpoint', checkpoint.id, visited);
                nestedDependents.forEach(dep => dependents.add(dep));
            }
        });
    }

    // Find direct dependents in intents
    if (planData.project?.roadmap?.intents) {
        planData.project.roadmap.intents.forEach(intent => {
            if ((intent.dependencies || []).some(dep =>
                dep.type === entityType && dep.id === entityId
            )) {
                dependents.add(`intent:${intent.id}`);
                // Recursively find dependents of this intent
                const nestedDependents = findAllDependents(planData, 'intent', intent.id, visited);
                nestedDependents.forEach(dep => dependents.add(dep));
            }

            // Also check if stories in intent depend on this entity
            if (entityType === 'story' && planData.stories) {
                const intentStories = planData.stories.filter(story => story.intent_id === intent.id);
                if (intentStories.some(story => (story.dependencies || []).some(dep =>
                    dep.type === entityType && dep.id === entityId
                ))) {
                    dependents.add(`intent:${intent.id}`);
                    const nestedDependents = findAllDependents(planData, 'intent', intent.id, visited);
                    nestedDependents.forEach(dep => dependents.add(dep));
                }
            }
        });
    }

    visited.delete(`${entityType}:${entityId}`);
    return dependents;
}

function planReducer(state, action) {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: action.payload };

        case 'SET_ERROR':
            return { ...state, error: action.payload, loading: false };

        case 'SET_PLAN_DATA':
            return { ...state, planData: action.payload, loading: false, error: null };

        case 'REPLACE_PLAN_DATA':
            clearHistoryFromSession();
            return {
                ...state,
                planData: action.payload.planData,
                loading: false,
                error: null,
                pendingChanges: action.payload.markAsChanged ? {
                    '__plan_import__': {
                        entityType: 'plan',
                        entityId: 'root',
                        changes: action.payload.planData,
                        originalData: null
                    }
                } : {},
                hasUnsavedChanges: !!action.payload.markAsChanged,
                dependencyAffected: {},
                editedNodes: {},
                newNodes: {},
                deletedNodes: {},
                undoHistory: [],
                redoHistory: [],
                canUndo: false,
                canRedo: false,
                selectedNode: null,
                dataSource: action.payload.dataSource ?? state.dataSource,
                dataTimestamp: action.payload.dataTimestamp ?? new Date().toISOString(),
                sessionTimestamp: action.payload.sessionTimestamp ?? null
            };

        case 'UPDATE_STORY':
            if (!state.planData) return state;

            // Find the story in the new schema (within intents)
            let storyToUpdate = null;
            let updatedPlanData = { ...state.planData };

            // Find the story in intents
            for (const intent of (state.planData.project?.roadmap?.intents || [])) {
                if (intent.stories) {
                    const story = intent.stories.find(s => s.id === action.payload.id);
                    if (story) {
                        storyToUpdate = { ...story };
                        break;
                    }
                }
            }

            // Update the story in the intent
            updatedPlanData.project.roadmap.intents = updatedPlanData.project.roadmap.intents.map(intent => {
                if (intent.stories) {
                    return {
                        ...intent,
                        stories: intent.stories.map(story =>
                            story.id === action.payload.id ? {
                                ...story,
                                ...action.payload.updates,
                                updated_at: new Date().toISOString()
                            } : story
                        )
                    };
                }
                return intent;
            });

            const baseState = {
                ...state,
                planData: updatedPlanData
            };

            // Track operation for undo/redo
            if (storyToUpdate) {
                // Find the updated story in the new plan data
                let updatedStory = null;
                for (const intent of updatedPlanData.project?.roadmap?.intents || []) {
                    if (intent.stories) {
                        const story = intent.stories.find(s => s.id === action.payload.id);
                        if (story) {
                            updatedStory = story;
                            break;
                        }
                    }
                }

                const operation = createOperationDiff(
                    'update',
                    'story',
                    action.payload.id,
                    storyToUpdate,
                    updatedStory
                );

                const stateWithHistory = {
                    ...baseState,
                    undoHistory: [...state.undoHistory, operation],
                    redoHistory: [], // Clear redo history when new operation is performed
                    canUndo: true,
                    canRedo: false,
                    hasUnsavedChanges: true
                };

                // Save to sessionStorage
                saveHistoryToSession(stateWithHistory.undoHistory, stateWithHistory.redoHistory);
                return stateWithHistory;
            }

            return {
                ...baseState,
                hasUnsavedChanges: true
            };

        case 'ADD_INTENT':
            if (!state.planData) return state;

            const newIntent = action.payload.intent;
            const checkpointsToAppend = action.payload.checkpoints || [];

            const currentIntents = state.planData.project?.roadmap?.intents || [];
            const currentCheckpoints = state.planData.project?.checkpoints || [];

            const baseIntentState = {
                ...state,
                planData: {
                    ...state.planData,
                    project: {
                        ...state.planData.project,
                        roadmap: {
                            ...state.planData.project.roadmap,
                            intents: [...currentIntents, newIntent]
                        },
                        checkpoints: [...currentCheckpoints, ...checkpointsToAppend]
                    }
                }
            };

            {
                const operation = createOperationDiff(
                    'create',
                    'intent',
                    newIntent.id,
                    null,
                    newIntent
                );

                const stateWithHistory = {
                    ...baseIntentState,
                    undoHistory: [...state.undoHistory, operation],
                    redoHistory: [],
                    canUndo: true,
                    canRedo: false,
                    newNodes: {
                        ...state.newNodes,
                        [`intent:${newIntent.id}`]: true
                    },
                    pendingChanges: {
                        ...state.pendingChanges,
                        [`intent:${newIntent.id}`]: {
                            entityType: 'intent',
                            entityId: newIntent.id,
                            changes: newIntent,
                            originalData: null
                        }
                    },
                    hasUnsavedChanges: true
                };

                saveHistoryToSession(stateWithHistory.undoHistory, stateWithHistory.redoHistory);
                return stateWithHistory;
            }

        case 'ADD_STORY':
            if (!state.planData) return state;

            const newStory = action.payload;
            const intentId = newStory.intent_id;

            // Add the story to the appropriate intent
            const addStoryPlanData = {
                ...state.planData,
                project: {
                    ...state.planData.project,
                    roadmap: {
                        ...state.planData.project.roadmap,
                        intents: state.planData.project.roadmap.intents.map(intent => {
                            if (intent.id === intentId) {
                                return {
                                    ...intent,
                                    stories: [...(intent.stories || []), newStory]
                                };
                            }
                            return intent;
                        })
                    }
                }
            };

            const baseAddState = {
                ...state,
                planData: addStoryPlanData
            };

            // Track operation for undo/redo and mark as new
            {
                const operation = createOperationDiff(
                    'create',
                    'story',
                    newStory.id,
                    null, // No before data for creation
                    newStory
                );

                const stateWithCreateHistory = {
                    ...baseAddState,
                    undoHistory: [...state.undoHistory, operation],
                    redoHistory: [], // Clear redo history when new operation is performed
                    canUndo: true,
                    canRedo: false,
                    // Mark as new node
                    newNodes: {
                        ...state.newNodes,
                        [`story:${newStory.id}`]: true
                    },
                    hasUnsavedChanges: true
                };

                // Save to sessionStorage
                saveHistoryToSession(stateWithCreateHistory.undoHistory, stateWithCreateHistory.redoHistory);
                return stateWithCreateHistory;
            }

            return {
                ...baseAddState,
                hasUnsavedChanges: true
            };

        case 'DELETE_STORY':
            if (!state.planData) return state;

            const storyIdToDelete = action.payload;
            let storyToDelete = null;

            // Find the story in intents
            for (const intent of (state.planData.project?.roadmap?.intents || [])) {
                if (intent.stories) {
                    const story = intent.stories.find(s => s.id === storyIdToDelete);
                    if (story) {
                        storyToDelete = { ...story };
                        break;
                    }
                }
            }

            if (!storyToDelete) return state;

            // Stage the deletion instead of immediately deleting
            const deleteChangeKey = `story:${storyIdToDelete}`;

            // Track operation for undo/redo and mark as deleted
            const deleteOperation = createOperationDiff(
                'delete',
                'story',
                storyIdToDelete,
                storyToDelete, // Store the story data for potential restoration
                null // No after data for deletion
            );

            // Find all dependent nodes that will be affected
            const deleteDependents = findAllDependents(state.planData, 'story', storyIdToDelete);
            const deleteDependencyAffected = { ...state.dependencyAffected };
            deleteDependents.forEach(depKey => {
                deleteDependencyAffected[depKey] = true;
            });

            const stateWithDeleteStaging = {
                ...state,
                undoHistory: [...state.undoHistory, deleteOperation],
                redoHistory: [], // Clear redo history when new operation is performed
                canUndo: true,
                canRedo: false,
                // Mark as deleted node (staged for deletion)
                deletedNodes: {
                    ...state.deletedNodes,
                    [deleteChangeKey]: true
                },
                // Remove from new nodes if it was newly created
                newNodes: {
                    ...state.newNodes,
                    [deleteChangeKey]: undefined
                },
                // Mark dependent nodes as affected
                dependencyAffected: deleteDependencyAffected,
                // Track the pending deletion
                pendingChanges: {
                    ...state.pendingChanges,
                    [deleteChangeKey]: {
                        entityType: 'story',
                        entityId: storyIdToDelete,
                        changes: { _deleted: true }, // Special marker for deletion
                        originalData: storyToDelete
                    }
                },
                hasUnsavedChanges: true
            };

            // Save to sessionStorage
            saveHistoryToSession(stateWithDeleteStaging.undoHistory, stateWithDeleteStaging.redoHistory);
            return stateWithDeleteStaging;

        case 'UPDATE_CHECKPOINT':
            if (!state.planData) return state;
            return {
                ...state,
                planData: {
                    ...state.planData,
                    project: {
                        ...state.planData.project,
                        checkpoints: (state.planData.project?.checkpoints || []).map(checkpoint =>
                            checkpoint.id === action.payload.id ? {
                                ...checkpoint,
                                ...action.payload.updates
                            } : checkpoint
                        )
                    }
                },
                hasUnsavedChanges: true
            };

        case 'ADD_CHECKPOINT':
            if (!state.planData) return state;
            return {
                ...state,
                planData: {
                    ...state.planData,
                    project: {
                        ...state.planData.project,
                        checkpoints: [...(state.planData.project?.checkpoints || []), action.payload]
                    }
                },
                hasUnsavedChanges: true
            };

        case 'DELETE_CHECKPOINT':
            if (!state.planData) return state;

            const checkpointIdToDelete = action.payload;
            const checkpointToDelete = (state.planData.project?.checkpoints || []).find(
                checkpoint => checkpoint.id === checkpointIdToDelete
            );

            if (!checkpointToDelete) return state;

            // Stage the deletion instead of immediately deleting
            const deleteCheckpointChangeKey = `checkpoint:${checkpointIdToDelete}`;

            // Track operation for undo/redo and mark as deleted
            const deleteCheckpointOperation = createOperationDiff(
                'delete',
                'checkpoint',
                checkpointIdToDelete,
                checkpointToDelete, // Store the checkpoint data for potential restoration
                null // No after data for deletion
            );

            // Find all dependent nodes that will be affected
            const deleteCheckpointDependents = findAllDependents(state.planData, 'checkpoint', checkpointIdToDelete);
            const deleteCheckpointDependencyAffected = { ...state.dependencyAffected };
            deleteCheckpointDependents.forEach(depKey => {
                deleteCheckpointDependencyAffected[depKey] = true;
            });

            const stateWithDeleteCheckpointStaging = {
                ...state,
                undoHistory: [...state.undoHistory, deleteCheckpointOperation],
                redoHistory: [], // Clear redo history when new operation is performed
                canUndo: true,
                canRedo: false,
                // Mark as deleted node (staged for deletion)
                deletedNodes: {
                    ...state.deletedNodes,
                    [deleteCheckpointChangeKey]: true
                },
                // Remove from new nodes if it was newly created
                newNodes: {
                    ...state.newNodes,
                    [deleteCheckpointChangeKey]: undefined
                },
                // Mark dependent nodes as affected
                dependencyAffected: deleteCheckpointDependencyAffected,
                // Track the pending deletion
                pendingChanges: {
                    ...state.pendingChanges,
                    [deleteCheckpointChangeKey]: {
                        entityType: 'checkpoint',
                        entityId: checkpointIdToDelete,
                        changes: { _deleted: true }, // Special marker for deletion
                        originalData: checkpointToDelete
                    }
                },
                hasUnsavedChanges: true
            };

            // Save to sessionStorage
            saveHistoryToSession(stateWithDeleteCheckpointStaging.undoHistory, stateWithDeleteCheckpointStaging.redoHistory);
            return stateWithDeleteCheckpointStaging;

        case 'UPDATE_INTENT':
            if (!state.planData) return state;
            return {
                ...state,
                planData: {
                    ...state.planData,
                    project: {
                        ...state.planData.project,
                        roadmap: {
                            ...state.planData.project.roadmap,
                            intents: (state.planData.project?.roadmap?.intents || []).map(intent =>
                                intent.id === action.payload.id ? {
                                    ...intent,
                                    ...action.payload.updates
                                } : intent
                            )
                        }
                    }
                },
                hasUnsavedChanges: true
            };

        case 'DELETE_INTENT':
            if (!state.planData) return state;

            const intentIdToDelete = action.payload;
            const intentToDelete = (state.planData.project?.roadmap?.intents || []).find(
                intent => intent.id === intentIdToDelete
            );

            if (!intentToDelete) return state;

            // Stage the deletion instead of immediately deleting
            const deleteIntentChangeKey = `intent:${intentIdToDelete}`;

            // Track operation for undo/redo and mark as deleted
            const deleteIntentOperation = createOperationDiff(
                'delete',
                'intent',
                intentIdToDelete,
                intentToDelete, // Store the intent data for potential restoration
                null // No after data for deletion
            );

            // Find all dependent nodes that will be affected
            const deleteIntentDependents = findAllDependents(state.planData, 'intent', intentIdToDelete);
            const deleteIntentDependencyAffected = { ...state.dependencyAffected };
            deleteIntentDependents.forEach(depKey => {
                deleteIntentDependencyAffected[depKey] = true;
            });

            const stateWithDeleteIntentStaging = {
                ...state,
                undoHistory: [...state.undoHistory, deleteIntentOperation],
                redoHistory: [], // Clear redo history when new operation is performed
                canUndo: true,
                canRedo: false,
                // Mark as deleted node (staged for deletion)
                deletedNodes: {
                    ...state.deletedNodes,
                    [deleteIntentChangeKey]: true
                },
                // Remove from new nodes if it was newly created
                newNodes: {
                    ...state.newNodes,
                    [deleteIntentChangeKey]: undefined
                },
                // Mark dependent nodes as affected
                dependencyAffected: deleteIntentDependencyAffected,
                // Track the pending deletion
                pendingChanges: {
                    ...state.pendingChanges,
                    [deleteIntentChangeKey]: {
                        entityType: 'intent',
                        entityId: intentIdToDelete,
                        changes: { _deleted: true }, // Special marker for deletion
                        originalData: intentToDelete
                    }
                },
                hasUnsavedChanges: true
            };

            // Save to sessionStorage
            saveHistoryToSession(stateWithDeleteIntentStaging.undoHistory, stateWithDeleteIntentStaging.redoHistory);
            return stateWithDeleteIntentStaging;

        case 'UPDATE_DEPENDENCIES':
            if (!state.planData) return state;

            const updatedStoriesWithDeps = (state.planData.stories || []).map(story => {
                if (story.id === action.payload.storyId) {
                    return {
                        ...story,
                        dependencies: action.payload.dependencies,
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
                },
                hasUnsavedChanges: true
            };

        case 'SET_SELECTED_NODE':
            return { ...state, selectedNode: action.payload };

        case 'SET_EDIT_MODE':
            return { ...state, editMode: action.payload };

        case 'SET_EXECUTION_VIEW':
            return { ...state, executionView: action.payload };

        case 'SET_VIEW_LEVEL':
            return {
                ...state,
                viewLevel: action.payload.level,
                selectedIntentId: action.payload.intentId || null
            };

        case 'NAVIGATE_TO_INTENT_VIEW':
            return {
                ...state,
                viewLevel: 'intent',
                selectedIntentId: null,
                selectedNode: null
            };

        case 'NAVIGATE_TO_STORY_VIEW':
            return {
                ...state,
                viewLevel: 'story',
                selectedIntentId: action.payload.intentId,
                selectedNode: null
            };

        case 'STAGE_CHANGES':
            const { entityType, entityId, changes } = action.payload;
            const changeKey = `${entityType}:${entityId}`;
            const newPendingChanges = { ...state.pendingChanges };
            if (newPendingChanges['__plan_import__']) {
                delete newPendingChanges['__plan_import__'];
            }
            let newEditedNodes = { ...state.editedNodes };
            let newDependencyAffected = { ...state.dependencyAffected };

            if (Object.keys(changes).length === 0) {
                // Remove from pending changes if no changes
                delete newPendingChanges[changeKey];
                delete newEditedNodes[changeKey];

                // Recalculate dependency affected nodes for all remaining edited nodes
                newDependencyAffected = {};
                Object.keys(newEditedNodes).forEach(editedKey => {
                    const [editedType, editedId] = editedKey.split(':');
                    const dependents = findAllDependents(state.planData, editedType, editedId);
                    dependents.forEach(depKey => {
                        newDependencyAffected[depKey] = true;
                    });
                });
            } else {
                newPendingChanges[changeKey] = {
                    entityType,
                    entityId,
                    changes,
                    originalData: action.payload.originalData
                };

                // Mark this node as directly edited
                newEditedNodes[changeKey] = true;

                // Find all nodes that depend on this edited node and mark them as dependency affected
                const dependents = findAllDependents(state.planData, entityType, entityId);
                dependents.forEach(depKey => {
                    newDependencyAffected[depKey] = true;
                });
            }

            return {
                ...state,
                pendingChanges: newPendingChanges,
                hasUnsavedChanges: Object.keys(newPendingChanges).length > 0,
                editedNodes: newEditedNodes,
                dependencyAffected: newDependencyAffected
            };

        case 'SAVE_ALL_CHANGES':
            let saveChangesPlanData = { ...state.planData };

            // Apply all pending changes directly to the plan data
            Object.values(state.pendingChanges).forEach(pendingChange => {
                const { entityType, entityId, changes } = pendingChange;

                if (entityType === 'plan') {
                    return;
                }

                if (entityType === 'story') {
                    if (changes._deleted) {
                        // Actually delete the story from its intent
                        saveChangesPlanData.project.roadmap.intents = saveChangesPlanData.project.roadmap.intents.map(intent => {
                            if (intent.stories) {
                                return {
                                    ...intent,
                                    stories: intent.stories.filter(story => story.id !== entityId)
                                };
                            }
                            return intent;
                        });

                        // Remove dependencies on the deleted story from all remaining stories
                        saveChangesPlanData.project.roadmap.intents = saveChangesPlanData.project.roadmap.intents.map(intent => {
                            if (intent.stories) {
                                return {
                                    ...intent,
                                    stories: intent.stories.map(story => ({
                                        ...story,
                                        dependencies: (story.dependencies || []).filter(dep =>
                                            !(dep.type === 'story' && dep.id === entityId)
                                        )
                                    }))
                                };
                            }
                            return intent;
                        });

                        // Also clean up checkpoint story_ids
                        if (saveChangesPlanData.project?.checkpoints) {
                            saveChangesPlanData.project.checkpoints = saveChangesPlanData.project.checkpoints.map(checkpoint => ({
                                ...checkpoint,
                                story_ids: (checkpoint.story_ids || []).filter(id => id !== entityId)
                            }));
                        }
                    } else {
                        // Regular update - find and update the story in its intent
                        saveChangesPlanData.project.roadmap.intents = saveChangesPlanData.project.roadmap.intents.map(intent => {
                            if (intent.stories) {
                                return {
                                    ...intent,
                                    stories: intent.stories.map(story =>
                                        story.id === entityId ? {
                                            ...story,
                                            ...changes,
                                            updated_at: new Date().toISOString()
                                        } : story
                                    )
                                };
                            }
                            return intent;
                        });
                    }
                } else if (entityType === 'checkpoint') {
                    if (changes._deleted) {
                        // Actually delete the checkpoint
                        saveChangesPlanData.project.checkpoints = saveChangesPlanData.project.checkpoints.filter(
                            checkpoint => checkpoint.id !== entityId
                        );
                        // Remove dependencies on the deleted checkpoint from all stories
                        saveChangesPlanData.project.roadmap.intents = saveChangesPlanData.project.roadmap.intents.map(intent => {
                            if (intent.stories) {
                                return {
                                    ...intent,
                                    stories: intent.stories.map(story => ({
                                        ...story,
                                        dependencies: (story.dependencies || []).filter(dep =>
                                            !(dep.type === 'checkpoint' && dep.id === entityId)
                                        )
                                    }))
                                };
                            }
                            return intent;
                        });
                    } else {
                        // Regular update
                        saveChangesPlanData.project.checkpoints = saveChangesPlanData.project.checkpoints.map(checkpoint =>
                            checkpoint.id === entityId ? {
                                ...checkpoint,
                                ...changes
                            } : checkpoint
                        );
                    }
                } else if (entityType === 'intent') {
                    if (changes._deleted) {
                        // Actually delete the intent
                        saveChangesPlanData.project.roadmap.intents = saveChangesPlanData.project.roadmap.intents.filter(
                            intent => intent.id !== entityId
                        );
                        // Remove dependencies on the deleted intent from all stories
                        saveChangesPlanData.project.roadmap.intents = saveChangesPlanData.project.roadmap.intents.map(intent => {
                            if (intent.stories) {
                                return {
                                    ...intent,
                                    stories: intent.stories.map(story => ({
                                        ...story,
                                        dependencies: (story.dependencies || []).filter(dep =>
                                            !(dep.type === 'intent' && dep.id === entityId)
                                        )
                                    }))
                                };
                            }
                            return intent;
                        });
                    } else {
                        // Regular update
                        saveChangesPlanData.project.roadmap.intents = saveChangesPlanData.project.roadmap.intents.map(intent =>
                            intent.id === entityId ? {
                                ...intent,
                                ...changes
                            } : intent
                        );
                    }
                }
            });

            // Sanitize all stories across all intents
            const allStories = getAllStoriesFromIntents(saveChangesPlanData);
            const sanitizedStories = ensureDependencyIntegrity(allStories);

            // Update the plan data with sanitized stories
            saveChangesPlanData.project.roadmap.intents = saveChangesPlanData.project.roadmap.intents.map(intent => {
                if (intent.stories) {
                    const intentStories = intent.stories.map(story => {
                        const sanitizedStory = sanitizedStories.find(s => s.id === story.id);
                        return sanitizedStory || story;
                    });
                    return {
                        ...intent,
                        stories: intentStories
                    };
                }
                return intent;
            });

            // Clear all pending changes and UI indicators
            return {
                ...state,
                planData: saveChangesPlanData,
                pendingChanges: {},
                hasUnsavedChanges: false,
                editedNodes: {},
                dependencyAffected: {},
                newNodes: {},
                deletedNodes: {}
            };

        case 'DISCARD_CHANGES':
            if (action.payload.all) {
                return {
                    ...state,
                    pendingChanges: {},
                    hasUnsavedChanges: false,
                    editedNodes: {},
                    dependencyAffected: {}
                };
            } else {
                const { entityType, entityId } = action.payload;
                const changeKey = `${entityType}:${entityId}`;
                const updatedPendingChanges = { ...state.pendingChanges };
                const updatedEditedNodes = { ...state.editedNodes };
                delete updatedPendingChanges[changeKey];
                delete updatedEditedNodes[changeKey];

                // Recalculate dependency affected nodes for remaining edited nodes
                const newDependencyAffected = {};
                Object.keys(updatedEditedNodes).forEach(editedKey => {
                    const [editedType, editedId] = editedKey.split(':');
                    const dependents = findAllDependents(state.planData, editedType, editedId);
                    dependents.forEach(depKey => {
                        newDependencyAffected[depKey] = true;
                    });
                });

                return {
                    ...state,
                    pendingChanges: updatedPendingChanges,
                    hasUnsavedChanges: Object.keys(updatedPendingChanges).length > 0,
                    editedNodes: updatedEditedNodes,
                    dependencyAffected: newDependencyAffected
                };
            }

        case 'CLEAR_PENDING_CHANGES':
            return {
                ...state,
                pendingChanges: {},
                hasUnsavedChanges: false,
                editedNodes: {},
                dependencyAffected: {}
            };

        case 'LOAD_UNDO_HISTORY':
            const loadedHistory = loadHistoryFromSession();
            return {
                ...state,
                undoHistory: loadedHistory.undoHistory,
                redoHistory: loadedHistory.redoHistory,
                canUndo: loadedHistory.undoHistory.length > 0,
                canRedo: loadedHistory.redoHistory.length > 0
            };

        case 'UNDO':
            if (state.undoHistory.length === 0) return state;

            const operationToUndo = state.undoHistory[state.undoHistory.length - 1];
            const remainingUndoHistory = state.undoHistory.slice(0, -1);

            // Apply the undo operation directly to the state
            let undoState = { ...state };

            if (operationToUndo.operationType === 'update' && operationToUndo.beforeData) {
                if (operationToUndo.entityType === 'story') {
                    undoState.planData = {
                        ...undoState.planData,
                        stories: undoState.planData.stories.map(story =>
                            story.id === operationToUndo.entityId
                                ? { ...operationToUndo.beforeData, updated_at: new Date().toISOString() }
                                : story
                        )
                    };
                } else if (operationToUndo.entityType === 'checkpoint') {
                    undoState.planData = {
                        ...undoState.planData,
                        project: {
                            ...undoState.planData.project,
                            checkpoints: undoState.planData.project.checkpoints.map(checkpoint =>
                                checkpoint.id === operationToUndo.entityId
                                    ? operationToUndo.beforeData
                                    : checkpoint
                            )
                        }
                    };
                } else if (operationToUndo.entityType === 'intent') {
                    undoState.planData = {
                        ...undoState.planData,
                        project: {
                            ...undoState.planData.project,
                            roadmap: {
                                ...undoState.planData.project.roadmap,
                                intents: undoState.planData.project.roadmap.intents.map(intent =>
                                    intent.id === operationToUndo.entityId
                                        ? operationToUndo.beforeData
                                        : intent
                                )
                            }
                        }
                    };
                }
            } else if (operationToUndo.operationType === 'create') {
                const changeKey = `${operationToUndo.entityType}:${operationToUndo.entityId}`;

                if (operationToUndo.entityType === 'story') {
                    undoState.planData = {
                        ...undoState.planData,
                        stories: undoState.planData.stories.filter(story => story.id !== operationToUndo.entityId)
                    };
                } else if (operationToUndo.entityType === 'intent') {
                    const checkpointId = `checkpoint-${operationToUndo.entityId}`;
                    const updatedIntents = (undoState.planData.project?.roadmap?.intents || []).filter(
                        intent => intent.id !== operationToUndo.entityId
                    );
                    const updatedCheckpoints = (undoState.planData.project?.checkpoints || []).filter(
                        checkpoint => checkpoint.id !== checkpointId
                    );

                    undoState.planData = {
                        ...undoState.planData,
                        project: {
                            ...undoState.planData.project,
                            roadmap: {
                                ...undoState.planData.project.roadmap,
                                intents: updatedIntents
                            },
                            checkpoints: updatedCheckpoints
                        }
                    };
                }

                if (operationToUndo.entityType === 'intent') {
                    const updatedPending = { ...undoState.pendingChanges };
                    if (updatedPending[changeKey]) {
                        delete updatedPending[changeKey];
                        undoState.pendingChanges = updatedPending;
                    }

                    const updatedNewNodes = { ...undoState.newNodes };
                    if (updatedNewNodes[changeKey]) {
                        delete updatedNewNodes[changeKey];
                        undoState.newNodes = updatedNewNodes;
                    }

                    undoState.hasUnsavedChanges = Object.keys(undoState.pendingChanges).length > 0;
                }
            } else if (operationToUndo.operationType === 'delete' && operationToUndo.beforeData) {
                // For undo of delete, restore the entity
                if (operationToUndo.entityType === 'story') {
                    undoState.planData = {
                        ...undoState.planData,
                        stories: [...undoState.planData.stories, operationToUndo.beforeData]
                    };
                }
            }

            const finalUndoState = {
                ...undoState,
                undoHistory: remainingUndoHistory,
                redoHistory: [...state.redoHistory, operationToUndo],
                canUndo: remainingUndoHistory.length > 0,
                canRedo: true
            };

            // Save to sessionStorage
            saveHistoryToSession(finalUndoState.undoHistory, finalUndoState.redoHistory);
            return finalUndoState;

        case 'REDO':
            if (state.redoHistory.length === 0) return state;

            const operationToRedo = state.redoHistory[state.redoHistory.length - 1];
            const remainingRedoHistory = state.redoHistory.slice(0, -1);

            // Apply the redo operation directly to the state
            let redoState = { ...state };

            if (operationToRedo.operationType === 'update' && operationToRedo.afterData) {
                if (operationToRedo.entityType === 'story') {
                    redoState.planData = {
                        ...redoState.planData,
                        stories: redoState.planData.stories.map(story =>
                            story.id === operationToRedo.entityId
                                ? { ...operationToRedo.afterData, updated_at: new Date().toISOString() }
                                : story
                        )
                    };
                } else if (operationToRedo.entityType === 'checkpoint') {
                    redoState.planData = {
                        ...redoState.planData,
                        project: {
                            ...redoState.planData.project,
                            checkpoints: redoState.planData.project.checkpoints.map(checkpoint =>
                                checkpoint.id === operationToRedo.entityId
                                    ? operationToRedo.afterData
                                    : checkpoint
                            )
                        }
                    };
                } else if (operationToRedo.entityType === 'intent') {
                    redoState.planData = {
                        ...redoState.planData,
                        project: {
                            ...redoState.planData.project,
                            roadmap: {
                                ...redoState.planData.project.roadmap,
                                intents: redoState.planData.project.roadmap.intents.map(intent =>
                                    intent.id === operationToRedo.entityId
                                        ? operationToRedo.afterData
                                        : intent
                                )
                            }
                        }
                    };
                }
            } else if (operationToRedo.operationType === 'create' && operationToRedo.afterData) {
                const changeKey = `${operationToRedo.entityType}:${operationToRedo.entityId}`;

                if (operationToRedo.entityType === 'story') {
                    redoState.planData = {
                        ...redoState.planData,
                        stories: [...redoState.planData.stories, operationToRedo.afterData]
                    };
                } else if (operationToRedo.entityType === 'intent') {
                    const checkpointId = `checkpoint-${operationToRedo.entityId}`;
                    const timestamp = operationToRedo.afterData?.created_at || new Date().toISOString();
                    const checkpoint = {
                        id: checkpointId,
                        name: `${operationToRedo.afterData.name} Checkpoint`,
                        description: `Completion checkpoint for ${operationToRedo.afterData.name}`,
                        status: 'planned',
                        story_ids: [],
                        dependencies: [],
                        created_at: timestamp,
                        updated_at: timestamp
                    };

                    const existingIntents = redoState.planData.project?.roadmap?.intents || [];
                    const existingCheckpoints = redoState.planData.project?.checkpoints || [];

                    redoState.planData = {
                        ...redoState.planData,
                        project: {
                            ...redoState.planData.project,
                            roadmap: {
                                ...redoState.planData.project.roadmap,
                                intents: [...existingIntents.filter(intent => intent.id !== operationToRedo.entityId), operationToRedo.afterData]
                            },
                            checkpoints: [...existingCheckpoints.filter(checkpoint => checkpoint.id !== checkpointId), checkpoint]
                        }
                    };
                }

                if (operationToRedo.entityType === 'intent') {
                    redoState.pendingChanges = {
                        ...redoState.pendingChanges,
                        [changeKey]: {
                            entityType: operationToRedo.entityType,
                            entityId: operationToRedo.entityId,
                            changes: operationToRedo.afterData,
                            originalData: null
                        }
                    };

                    redoState.newNodes = {
                        ...redoState.newNodes,
                        [changeKey]: true
                    };

                    redoState.hasUnsavedChanges = true;
                }
            } else if (operationToRedo.operationType === 'delete') {
                // For redo of delete, remove the entity
                if (operationToRedo.entityType === 'story') {
                    redoState.planData = {
                        ...redoState.planData,
                        stories: redoState.planData.stories.filter(story => story.id !== operationToRedo.entityId)
                    };
                }
            }

            const finalRedoState = {
                ...redoState,
                undoHistory: [...state.undoHistory, operationToRedo],
                redoHistory: remainingRedoHistory,
                canUndo: true,
                canRedo: remainingRedoHistory.length > 0
            };

            // Save to sessionStorage
            saveHistoryToSession(finalRedoState.undoHistory, finalRedoState.redoHistory);
            return finalRedoState;

        case 'CLEAR_UNDO_HISTORY':
            clearHistoryFromSession();
            return {
                ...state,
                undoHistory: [],
                redoHistory: [],
                canUndo: false,
                canRedo: false
            };

        case 'SET_DATA_SOURCE':
            return {
                ...state,
                dataSource: action.payload.source,
                dataTimestamp: action.payload.dataTimestamp,
                sessionTimestamp: action.payload.sessionTimestamp
            };

        case 'SET_RUN_MODE':
            if (!state.planData) return state;
            return {
                ...state,
                planData: {
                    ...state.planData,
                    project: {
                        ...state.planData.project,
                        default_run_mode: action.payload
                    }
                }
            };

        default:
            return state;
    }
}

export function PlanProvider({ children }) {
    const [state, dispatch] = useReducer(planReducer, initialState);

    // Load initial plan data from public directory
    useEffect(() => {
        loadPlanData();
        // Load undo/redo history from sessionStorage
        dispatch({ type: 'LOAD_UNDO_HISTORY' });
    }, []);

    // File system utilities
    const saveToFileSystem = React.useCallback(async (data, suggestedName = 'plan-data-work.json') => {
        try {
            // Check if File System Access API is supported
            if ('showSaveFilePicker' in window) {
                // Modern browsers - let user choose location
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName,
                    types: [{
                        description: 'JSON files',
                        accept: { 'application/json': ['.json'] }
                    }]
                });

                const writable = await fileHandle.createWritable();
                await writable.write(JSON.stringify(data, null, 2));
                await writable.close();

                // Store the file handle for future saves
                localStorage.setItem('workFileHandle', JSON.stringify({
                    name: fileHandle.name,
                    timestamp: Date.now()
                }));

                console.log(`Work file saved to: ${fileHandle.name}`);
                return { success: true, location: fileHandle.name, method: 'filesystem' };
            } else {
                // Fallback - download the file
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = suggestedName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                console.log(`Work file downloaded as: ${suggestedName}`);
                return { success: true, location: `Downloads/${suggestedName}`, method: 'download' };
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Save cancelled by user');
                return { success: false, cancelled: true };
            }
            console.error('Error saving to file system:', error);
            throw error;
        }
    }, []);

    const loadFromFileSystem = React.useCallback(async () => {
        try {
            if ('showOpenFilePicker' in window) {
                const [fileHandle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'JSON files',
                        accept: { 'application/json': ['.json'] }
                    }],
                    multiple: false
                });

                const file = await fileHandle.getFile();
                const contents = await file.text();
                const data = JSON.parse(contents);

                // Store the file handle for future saves
                localStorage.setItem('workFileHandle', JSON.stringify({
                    name: fileHandle.name,
                    timestamp: Date.now()
                }));

                console.log(`Work file loaded from: ${fileHandle.name}`);
                return { success: true, data, location: fileHandle.name };
            } else {
                throw new Error('File System Access API not supported');
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Load cancelled by user');
                return { success: false, cancelled: true };
            }
            console.error('Error loading from file system:', error);
            return { success: false, error: error.message };
        }
    }, []);

    // Apply all pending changes to current state (but don't save to file)
    const saveAllChanges = React.useCallback(() => {
        // Just apply pending changes to the UI state and clear indicators
        dispatch({ type: 'SAVE_ALL_CHANGES' });
        console.log('Applied all pending changes to current state');
    }, []);

    // Push current state to file system
    const pushToFile = React.useCallback(async () => {
        if (!state.planData) return { success: false, error: 'No data to save' };

        try {
            const saveResult = await saveToFileSystem(state.planData, 'plan-data-work.json');
            if (saveResult.success) {
                // Update backup and metadata
                localStorage.setItem('plan-data-work_backup', JSON.stringify(state.planData));
                localStorage.setItem('plan-data-work_lastSaved', new Date().toISOString());
                localStorage.setItem('plan-data-work_saveLocation', saveResult.location);
                localStorage.setItem('plan-data-work_saveMethod', saveResult.method);
                console.log(`Plan data pushed to file system: ${saveResult.location}`);
                return saveResult;
            } else if (!saveResult.cancelled) {
                throw new Error('Save failed');
            }
            return saveResult;
        } catch (error) {
            console.error('Failed to push to file system:', error);
            // Fallback to localStorage
            try {
                localStorage.setItem('plan-data-work_backup', JSON.stringify(state.planData));
                localStorage.setItem('plan-data-work_lastSaved', new Date().toISOString());
                console.log('Saved to localStorage as fallback');
                return { success: true, location: 'localStorage (fallback)', method: 'localStorage' };
            } catch (fallbackError) {
                console.error('Fallback save also failed:', fallbackError);
                return { success: false, error: fallbackError.message };
            }
        }
    }, [state.planData, saveToFileSystem]);

    // Auto-apply functionality with debouncing
    useEffect(() => {
        if (!state.hasUnsavedChanges) return;

        // Auto-apply changes after 30 seconds of inactivity
        const autoApplyTimeout = setTimeout(() => {
            console.log('Auto-applying changes...');
            saveAllChanges();
        }, 30000);

        return () => clearTimeout(autoApplyTimeout);
    }, [state.hasUnsavedChanges, state.pendingChanges, saveAllChanges]); // Re-trigger when changes update

    const loadPlanData = async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const dataSources = [];

            // Check if session storage has recent changes (we'll load them after setting base data)
            let hasRecentSessionChanges = false;
            let sessionTimestamp = null;
            try {
                const sessionData = sessionStorage.getItem('planEditor_undoHistory');
                if (sessionData) {
                    const parsed = JSON.parse(sessionData);
                    sessionTimestamp = parsed.timestamp;
                    if (parsed.undoHistory && parsed.undoHistory.length > 0) {
                        hasRecentSessionChanges = true;
                        console.log(`Found session storage with ${parsed.undoHistory.length} operations (timestamp: ${new Date(sessionTimestamp).toISOString()})`);
                    }
                }
            } catch (error) {
                console.warn('Failed to check session storage:', error);
            }

            // Check work file backup in localStorage
            try {
                const workBackup = localStorage.getItem('plan-data-work_backup');
                const lastSaved = localStorage.getItem('plan-data-work_lastSaved');
                const saveLocation = localStorage.getItem('plan-data-work_saveLocation');

                if (workBackup && lastSaved) {
                    const planData = JSON.parse(workBackup);
                    dataSources.push({
                        data: planData,
                        timestamp: new Date(lastSaved).getTime(),
                        source: 'work_file',
                        description: `Work file backup (${saveLocation || 'file system'})`
                    });
                }
            } catch (error) {
                console.warn('Failed to load work backup:', error);
                // Clean up corrupted data
                localStorage.removeItem('plan-data-work_backup');
                localStorage.removeItem('plan-data-work_lastSaved');
                localStorage.removeItem('plan-data-work_saveLocation');
                localStorage.removeItem('plan-data-work_saveMethod');
            }

            // Load original file with caching safeguards for 304 responses
            const response = await fetch('/plan-data.json', { cache: 'no-cache' });
            if (!response.ok && response.status !== 304) {
                throw new Error(`Failed to load plan data: ${response.status}`);
            }

            let originalData = null;
            let usedCachedOriginal = false;

            if (response.status === 304) {
                const cachedOriginal = localStorage.getItem('plan-data-original.json');
                if (cachedOriginal) {
                    try {
                        originalData = JSON.parse(cachedOriginal);
                        usedCachedOriginal = true;
                    } catch (parseError) {
                        console.warn('Failed to parse cached original, fetching fresh copy:', parseError);
                        localStorage.removeItem('plan-data-original.json');
                        localStorage.removeItem('plan-data-original_timestamp');
                    }
                }

                if (!originalData) {
                    const retryResponse = await fetch(`/plan-data.json?cb=${Date.now()}`, { cache: 'no-store' });
                    if (!retryResponse.ok) {
                        throw new Error(`Failed to load plan data after cache validation: ${retryResponse.status}`);
                    }
                    originalData = await retryResponse.json();
                }
            } else {
                originalData = await response.json();
            }

            if (!originalData) {
                throw new Error('Plan data is unavailable');
            }

            if (!usedCachedOriginal) {
                localStorage.setItem('plan-data-original.json', JSON.stringify(originalData));
                localStorage.setItem('plan-data-original_timestamp', new Date().toISOString());
            } else if (!localStorage.getItem('plan-data-original_timestamp')) {
                localStorage.setItem('plan-data-original_timestamp', new Date().toISOString());
            }

            const cachedTimestamp = localStorage.getItem('plan-data-original_timestamp');
            const originalTimestamp = cachedTimestamp ? new Date(cachedTimestamp).getTime() : Date.now();

            dataSources.push({
                data: originalData,
                timestamp: originalTimestamp,
                source: 'default',
                description: 'Original plan file'
            });
            // Choose the most recent data source (between work file and original file)
            const mostRecent = dataSources.reduce((latest, current) =>
                current.timestamp > latest.timestamp ? current : latest
            );

            // Determine final data source based on session storage timestamp
            let finalSource = mostRecent.source;
            let finalDescription = mostRecent.description;

            if (hasRecentSessionChanges && sessionTimestamp && sessionTimestamp > mostRecent.timestamp) {
                finalSource = 'session_storage';
                finalDescription = 'Session storage (with unsaved changes)';
                console.log(`Session storage is newer (${new Date(sessionTimestamp).toISOString()}) than ${mostRecent.description} (${new Date(mostRecent.timestamp).toISOString()})`);
            }

            console.log(`Loading base data from ${mostRecent.description}, final source: ${finalDescription}`);

            // Set the plan data (base data from file)
            dispatch({ type: 'SET_PLAN_DATA', payload: mostRecent.data });

            // Set data source information
            dispatch({
                type: 'SET_DATA_SOURCE',
                payload: {
                    source: finalSource,
                    dataTimestamp: finalSource === 'session_storage' ? sessionTimestamp : mostRecent.timestamp,
                    sessionTimestamp: sessionTimestamp
                }
            });

        } catch (error) {
            console.error('Error loading plan data:', error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
        }
    };

    const loadWorkFileFromDisk = React.useCallback(async () => {
        try {
            const loadResult = await loadFromFileSystem();
            if (loadResult.success) {
                dispatch({ type: 'SET_PLAN_DATA', payload: loadResult.data });
                // Update backup
                localStorage.setItem('plan-data-work_backup', JSON.stringify(loadResult.data));
                localStorage.setItem('plan-data-work_lastSaved', new Date().toISOString());
                localStorage.setItem('plan-data-work_saveLocation', loadResult.location);
                console.log(`Loaded work file from: ${loadResult.location}`);
                return { success: true, location: loadResult.location };
            }
            return loadResult;
        } catch (error) {
            console.error('Error loading work file from disk:', error);
            return { success: false, error: error.message };
        }
    }, [loadFromFileSystem]);

    // Helper function to get computed dependents for a story
    const getDependentsForStory = (storyId) => {
        const allStories = getAllStoriesFromIntents(state.planData);
        if (!allStories.length) return [];

        return allStories
            .filter(story => story.dependencies.some(dep => dep.type === 'story' && dep.id === storyId))
            .map(story => story.id);
    };

    // Helper function to get story with computed dependents
    const getStoryWithDependents = (storyId) => {
        const allStories = getAllStoriesFromIntents(state.planData);
        const story = allStories.find(s => s.id === storyId);
        if (!story) return null;

        return {
            ...story,
            dependents: getDependentsForStory(storyId)
        };
    };

    // Helper function to get all stories with computed dependents
    const getStoriesWithDependents = () => {
        const allStories = getAllStoriesFromIntents(state.planData);
        return computeDependents(allStories);
    };

    // Helper function to get stories by workstream
    const getStoriesByWorkstream = () => {
        const allStories = getAllStoriesFromIntents(state.planData);
        if (!allStories.length) return {};

        const workstreams = {};
        allStories.forEach(story => {
            if (story.workstream_id) {
                if (!workstreams[story.workstream_id]) {
                    workstreams[story.workstream_id] = [];
                }
                workstreams[story.workstream_id].push(story);
            }
        });

        return workstreams;
    };

    // Helper function to get stories by intent
    const getStoriesByIntent = () => {
        if (!state.planData?.project?.roadmap?.intents) return {};

        const intents = {};
        state.planData.project.roadmap.intents.forEach(intent => {
            if (intent.stories && Array.isArray(intent.stories)) {
                intents[intent.id] = intent.stories.map(story => ({
                    ...story,
                    intent_id: intent.id
                }));
            } else {
                intents[intent.id] = [];
            }
        });

        return intents;
    };

    // Helper function to validate all dependencies
    const validateAllDependencies = () => {
        if (!state.planData) return { valid: true, errors: [] };

        const errors = [];
        const allStories = getAllStoriesFromIntents(state.planData);

        // Validate story dependencies
        allStories.forEach(story => {
            story.dependencies.forEach(dep => {
                let found = false;
                switch (dep.type) {
                    case 'story':
                        found = allStories.some(s => s.id === dep.id);
                        break;
                    case 'checkpoint':
                        found = state.planData.project.checkpoints.some(c => c.id === dep.id);
                        break;
                    case 'intent':
                        found = state.planData.project.roadmap.intents.some(i => i.id === dep.id);
                        break;
                }

                if (!found) {
                    errors.push(`Story ${story.id} has invalid ${dep.type} dependency: ${dep.id}`);
                }
            });
        });

        // Validate checkpoint dependencies
        state.planData.project.checkpoints.forEach(checkpoint => {
            checkpoint.dependencies?.forEach(dep => {
                let found = false;
                switch (dep.type) {
                    case 'story':
                        found = allStories.some(s => s.id === dep.id);
                        break;
                    case 'checkpoint':
                        found = state.planData.project.checkpoints.some(c => c.id === dep.id);
                        break;
                    case 'intent':
                        found = state.planData.project.roadmap.intents.some(i => i.id === dep.id);
                        break;
                }

                if (!found) {
                    errors.push(`Checkpoint ${checkpoint.id} has invalid ${dep.type} dependency: ${dep.id}`);
                }
            });
        });

        // Validate intent dependencies
        state.planData.project.roadmap.intents.forEach(intent => {
            intent.dependencies?.forEach(dep => {
                let found = false;
                switch (dep.type) {
                    case 'intent':
                        found = state.planData.project.roadmap.intents.some(i => i.id === dep.id);
                        break;
                    case 'checkpoint':
                        found = state.planData.project.checkpoints.some(c => c.id === dep.id);
                        break;
                }

                if (!found) {
                    errors.push(`Intent ${intent.id} has invalid ${dep.type} dependency: ${dep.id}`);
                }
            });
        });

        return { valid: errors.length === 0, errors };
    };

    // Navigation helper functions
    const navigateToIntentView = () => {
        dispatch({ type: 'NAVIGATE_TO_INTENT_VIEW' });
    };

    const navigateToStoryView = (intentId) => {
        dispatch({ type: 'NAVIGATE_TO_STORY_VIEW', payload: { intentId } });
    };

    // Global change tracking helper functions
    const stageChanges = (entityType, entityId, changes, originalData) => {
        // Only stage the changes - don't apply optimistically
        // Changes will be applied when saved
        dispatch({
            type: 'STAGE_CHANGES',
            payload: { entityType, entityId, changes, originalData }
        });
    };



    const discardChanges = (entityType = null, entityId = null) => {
        if (entityType && entityId) {
            dispatch({
                type: 'DISCARD_CHANGES',
                payload: { entityType, entityId }
            });
        } else {
            dispatch({
                type: 'DISCARD_CHANGES',
                payload: { all: true }
            });
        }
    };

    const getPendingChangesForEntity = (entityType, entityId) => {
        const changeKey = `${entityType}:${entityId}`;
        return state.pendingChanges[changeKey]?.changes || {};
    };

    const getEntityWithPendingChanges = React.useCallback((entityType, entityId) => {
        let originalEntity = null;

        // Find the original entity
        if (entityType === 'story') {
            // Stories are now nested within intents
            if (state.planData?.project?.roadmap?.intents) {
                for (const intent of state.planData.project.roadmap.intents) {
                    if (intent.stories) {
                        const story = intent.stories.find(s => s.id === entityId);
                        if (story) {
                            originalEntity = { ...story, intent_id: intent.id };
                            break;
                        }
                    }
                }
            }
        } else if (entityType === 'checkpoint') {
            originalEntity = state.planData?.project?.checkpoints?.find(c => c.id === entityId);
        } else if (entityType === 'intent') {
            originalEntity = state.planData?.project?.roadmap?.intents?.find(i => i.id === entityId);
        }

        if (!originalEntity) return null;

        // Apply pending changes if they exist
        const pendingChanges = getPendingChangesForEntity(entityType, entityId);
        return { ...originalEntity, ...pendingChanges };
    }, [state.planData, state.pendingChanges]);

    const hasChangesForEntity = (entityType, entityId) => {
        const changeKey = `${entityType}:${entityId}`;
        return !!state.pendingChanges[changeKey];
    };

    const isDependencyAffected = (entityType, entityId) => {
        const changeKey = `${entityType}:${entityId}`;
        return !!state.dependencyAffected[changeKey];
    };

    const isDirectlyEdited = (entityType, entityId) => {
        const changeKey = `${entityType}:${entityId}`;
        return !!state.editedNodes[changeKey];
    };

    const isNewNode = (entityType, entityId) => {
        const changeKey = `${entityType}:${entityId}`;
        return !!state.newNodes[changeKey];
    };

    const isDeletedNode = (entityType, entityId) => {
        const changeKey = `${entityType}:${entityId}`;
        return !!state.deletedNodes[changeKey];
    };

    const getNodeState = (entityType, entityId) => {
        const changeKey = `${entityType}:${entityId}`;
        return {
            isNew: !!state.newNodes[changeKey],
            isEdited: !!state.editedNodes[changeKey],
            isDeleted: !!state.deletedNodes[changeKey],
            isDependencyAffected: !!state.dependencyAffected[changeKey],
            hasPendingChanges: !!state.pendingChanges[changeKey]
        };
    };

    // Undo/Redo functions
    const undo = React.useCallback(() => {
        if (state.canUndo) {
            dispatch({ type: 'UNDO' });
        }
    }, [state.canUndo]);

    const redo = React.useCallback(() => {
        if (state.canRedo) {
            dispatch({ type: 'REDO' });
        }
    }, [state.canRedo]);

    const clearUndoHistory = React.useCallback(() => {
        dispatch({ type: 'CLEAR_UNDO_HISTORY' });
    }, []);

    // Reset to original file data and clear all storage
    const resetToOriginal = React.useCallback(async () => {
        try {
            // Clear work file and related storage
            localStorage.removeItem('plan-data-work_backup');
            localStorage.removeItem('plan-data-work_lastSaved');
            localStorage.removeItem('plan-data-work_saveLocation');
            localStorage.removeItem('plan-data-work_saveMethod');
            localStorage.removeItem('workFileHandle');
            clearHistoryFromSession();

            // Clear pending changes and undo history
            dispatch({ type: 'CLEAR_PENDING_CHANGES' });
            dispatch({ type: 'CLEAR_UNDO_HISTORY' });

            // Try to load from cached original first, then fetch if needed
            let planData = null;
            const cachedOriginal = localStorage.getItem('plan-data-original.json');

            if (cachedOriginal) {
                try {
                    planData = JSON.parse(cachedOriginal);
                    console.log('Reset to cached original plan data');
                } catch (parseError) {
                    console.warn('Failed to parse cached original, fetching fresh:', parseError);
                    localStorage.removeItem('plan-data-original.json');
                }
            }

            // If no cached original or parsing failed, fetch fresh
            if (!planData) {
                dispatch({ type: 'SET_LOADING', payload: true });
                const response = await fetch('/plan-data.json', { cache: 'no-cache' });
                if (!response.ok && response.status !== 304) {
                    throw new Error(`Failed to load plan data: ${response.status}`);
                }

                if (response.status === 304) {
                    const retryResponse = await fetch(`/plan-data.json?cb=${Date.now()}`, { cache: 'no-store' });
                    if (!retryResponse.ok) {
                        throw new Error(`Failed to load plan data after cache validation: ${retryResponse.status}`);
                    }
                    planData = await retryResponse.json();
                } else {
                    planData = await response.json();
                }

                if (!planData) {
                    throw new Error('Plan data is unavailable');
                }

                // Update the cached original
                localStorage.setItem('plan-data-original.json', JSON.stringify(planData));
                localStorage.setItem('plan-data-original_timestamp', new Date().toISOString());
                console.log('Reset to fresh original plan data from file');
            }

            dispatch({ type: 'SET_PLAN_DATA', payload: planData });
        } catch (error) {
            console.error('Error resetting to original data:', error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
        }
    }, []);

    // Get session storage usage info
    const getStorageInfo = React.useCallback(() => {
        try {
            let totalSize = 0;
            let workBackupSize = 0;
            let originalFileSize = 0;
            let undoHistorySize = 0;

            // Calculate sizes
            const workBackup = localStorage.getItem('plan-data-work_backup');
            if (workBackup) {
                workBackupSize = new Blob([workBackup]).size;
                totalSize += workBackupSize;
            }

            const originalData = localStorage.getItem('plan-data-original.json');
            if (originalData) {
                originalFileSize = new Blob([originalData]).size;
                totalSize += originalFileSize;
            }

            const undoHistory = sessionStorage.getItem('planEditor_undoHistory');
            if (undoHistory) {
                undoHistorySize = new Blob([undoHistory]).size;
                totalSize += undoHistorySize;
            }

            // Get file system info
            const saveLocation = localStorage.getItem('plan-data-work_saveLocation');
            const saveMethod = localStorage.getItem('plan-data-work_saveMethod');
            const lastSaved = localStorage.getItem('plan-data-work_lastSaved');

            return {
                totalSize,
                workBackupSize,
                originalFileSize,
                undoHistorySize,
                formattedTotal: formatBytes(totalSize),
                formattedWorkBackup: formatBytes(workBackupSize),
                formattedOriginalFile: formatBytes(originalFileSize),
                formattedUndoHistory: formatBytes(undoHistorySize),
                hasWorkBackup: !!workBackup,
                hasOriginalFile: !!originalData,
                saveLocation: saveLocation || 'Not saved',
                saveMethod: saveMethod || 'none',
                lastSaved: lastSaved ? new Date(lastSaved).toLocaleString() : 'Never',
                fileSystemSupported: 'showSaveFilePicker' in window
            };
        } catch (error) {
            console.warn('Error calculating storage size:', error);
            return {
                totalSize: 0,
                workBackupSize: 0,
                originalFileSize: 0,
                undoHistorySize: 0,
                formattedTotal: '0 B',
                formattedWorkBackup: '0 B',
                formattedOriginalFile: '0 B',
                formattedUndoHistory: '0 B',
                hasWorkBackup: false,
                hasOriginalFile: false,
                saveLocation: 'Not saved',
                saveMethod: 'none',
                lastSaved: 'Never',
                fileSystemSupported: false
            };
        }
    }, []);

    // Helper function to format bytes
    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    const applyRemotePlanData = React.useCallback((planData, options = {}) => {
        if (!planData) {
            console.warn('applyRemotePlanData called without plan data');
            return;
        }

        const {
            source = 'api',
            dataTimestamp = new Date().toISOString(),
            sessionTimestamp = null,
            markAsChanged = false
        } = options;

        dispatch({
            type: 'REPLACE_PLAN_DATA',
            payload: {
                planData,
                dataSource: source,
                dataTimestamp,
                sessionTimestamp,
                markAsChanged
            }
        });
    }, [dispatch]);

    const setRunMode = React.useCallback((runMode) => {
        dispatch({
            type: 'SET_RUN_MODE',
            payload: runMode
        });
    }, []);

    const value = {
        ...state,
        dispatch,
        loadPlanData,
        applyRemotePlanData,
        getDependentsForStory,
        getStoryWithDependents,
        getStoriesWithDependents,
        getStoriesByWorkstream,
        getStoriesByIntent,
        validateAllDependencies,
        // Navigation functions
        navigateToIntentView,
        navigateToStoryView,
        // Global change tracking functions
        stageChanges,
        saveAllChanges,
        discardChanges,
        getPendingChangesForEntity,
        getEntityWithPendingChanges,
        hasChangesForEntity,
        // Dependency tracking functions
        isDependencyAffected,
        isDirectlyEdited,
        isNewNode,
        isDeletedNode,
        getNodeState,
        // Undo/Redo functions and state
        undo,
        redo,
        clearUndoHistory,
        canUndo: state.canUndo,
        canRedo: state.canRedo,
        undoHistory: state.undoHistory,
        redoHistory: state.redoHistory,
        // Reset and storage functions
        resetToOriginal,
        getStorageInfo,
        // File system functions
        loadWorkFileFromDisk,
        saveToFileSystem,
        pushToFile,
        // Data source tracking
        dataSource: state.dataSource,
        dataTimestamp: state.dataTimestamp,
        sessionTimestamp: state.sessionTimestamp,
        // Run mode management
        setRunMode
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
