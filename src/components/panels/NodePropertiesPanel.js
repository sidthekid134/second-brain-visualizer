import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes } from 'styled-components';
import { usePlan } from '../../context/PlanContext';
import { getStatusColor, getStatusIcon, getComplexityColor } from '../../utils/flowUtils';
import { renderSchemaField, getNestedValue, setNestedValue } from '../../utils/schemaRenderer';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;

const PanelContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  animation: ${slideIn} 0.3s ease-out;
`;

const PanelHeader = styled.div`
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const PanelTitle = styled.h2`
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const NodeTypeChip = styled.span`
  background: rgba(255, 255, 255, 0.25);
  color: white;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  backdrop-filter: blur(10px);
`;

const QuickActions = styled.div`
  display: flex;
  gap: 6px;
`;

const ActionButton = styled.button`
  background: ${props => props.$variant === 'primary' ? 'rgba(16, 185, 129, 0.9)' :
        props.$variant === 'danger' ? 'rgba(239, 68, 68, 0.9)' :
            'rgba(255, 255, 255, 0.2)'};
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0);
  }
`;

const CompactStatusRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const StatusBadge = styled.div`
  background: ${props => getStatusColor(props.$status)}CC;
  color: white;
  padding: 4px 12px;
  border-radius: 14px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  backdrop-filter: blur(10px);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
`;

const CompactMetrics = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.9);
`;

const MetricItem = styled.span`
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  white-space: nowrap;
`;

const PanelContent = styled.div`
  flex: 1;
  padding: 0;
  overflow-y: auto;
  overflow-x: visible;
  background: white;
  color: #1f2937;
`;

const Section = styled.div`
  margin-bottom: 0;
  border-bottom: 1px solid #f3f4f6;
  animation: ${fadeIn} 0.4s ease-out;
  animation-delay: ${props => props.$delay || '0s'};
  animation-fill-mode: both;
`;

const SectionHeader = styled.div`
  background: ${props => props.$expanded ? '#f8fafc' : 'white'};
  padding: 20px 24px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
  border-left: 4px solid ${props => props.$expanded ? '#3b82f6' : 'transparent'};

  &:hover {
    background: #f8fafc;
  }
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SectionIcon = styled.span`
  font-size: 1.2rem;
`;

const ExpandIcon = styled.span`
  font-size: 1rem;
  transition: transform 0.2s ease;
  transform: ${props => props.$expanded ? 'rotate(180deg)' : 'rotate(0deg)'};
  color: #6b7280;
`;

const SectionContent = styled.div`
  padding: ${props => props.$expanded ? '0 24px 24px 24px' : '0'};
  max-height: ${props => props.$expanded ? '1000px' : '0'};
  overflow: ${props => props.$expanded ? 'visible' : 'hidden'};
  transition: all 0.3s ease;
`;

const PropertyGrid = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: 1fr;
`;

const PropertyCard = styled.div`
  background: ${props => props.$isChanged ? '#fef3c7' : '#f9fafb'};
  border: 1px solid ${props => props.$isChanged ? '#f59e0b' : '#e5e7eb'};
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s ease;
  position: relative;

  ${props => props.$isChanged && `
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
  `}

  &:hover {
    border-color: ${props => props.$isChanged ? '#f59e0b' : '#d1d5db'};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
`;

const PropertyLabel = styled.label`
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${props => props.$isChanged ? '#92400e' : '#374151'};
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  
  ${props => props.$isChanged && `
    &::after {
      content: '●';
      color: #f59e0b;
      font-size: 0.6rem;
      margin-left: 4px;
    }
  `}
`;

const PropertyDescription = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 4px;
  font-style: italic;
`;

const ReadOnlyValue = styled.div`
  font-size: 0.9rem;
  color: #1f2937;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  min-height: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EditInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:hover {
    border-color: #d1d5db;
  }
`;

const EditTextarea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  min-height: 100px;
  resize: vertical;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:hover {
    border-color: #d1d5db;
  }
`;

const SelectInput = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:hover {
    border-color: #d1d5db;
  }
`;

const ListContainer = styled.div`
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
`;

const ListItem = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f9fafb;
  }
`;

const ListItemContent = styled.div`
  flex: 1;
  font-size: 0.9rem;
  color: #374151;
`;

const RemoveButton = styled.button`
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #dc2626;
    color: white;
  }
`;

const AddItemContainer = styled.div`
  padding: 12px 16px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 8px;
  align-items: center;
`;

const AddInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.85rem;
`;

const AddButton = styled.button`
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #059669;
  }
`;

const ProgressBarContainer = styled.div`
  margin-top: 8px;
`;

const ProgressBarTrack = styled.div`
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressBarFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, ${props => getStatusColor(props.$status)}, ${props => getStatusColor(props.$status)}CC);
  width: ${props => props.$progress}%;
  transition: width 0.3s ease;
  border-radius: 4px;
`;

const ProgressText = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 4px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  animation: ${fadeIn} 0.6s ease-out;
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 24px;
  opacity: 0.6;
`;

const EmptyTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 8px;
`;

const EmptyDescription = styled.p`
  font-size: 0.9rem;
  opacity: 0.8;
  max-width: 240px;
`;

const ComplexityIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: ${props => getComplexityColor(props.$score)}22;
  color: ${props => getComplexityColor(props.$score)};
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid ${props => getComplexityColor(props.$score)}44;
`;

const TokenDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #6b7280;
`;

const TokenBar = styled.div`
  flex: 1;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  position: relative;
`;

const TokenProgress = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  width: ${props => Math.min((props.$actual / props.$estimated) * 100, 100)}%;
  transition: width 0.3s ease;
`;

const AutocompleteContainer = styled.div`
  position: relative;
  flex: 1;
`;

const AutocompleteInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.85rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    border-radius: 6px 6px 0 0;
  }

  &:hover {
    border-color: #d1d5db;
  }
`;

const AutocompleteDropdown = styled.div`
  position: fixed;
  top: ${props => props.$top || 0}px;
  left: ${props => props.$left || 0}px;
  width: ${props => props.$width || 200}px;
  background: white;
  border: 2px solid #3b82f6;
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 999999;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
`;

const AutocompleteOption = styled.div`
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f3f4f6;

  &:hover {
    background: #f8fafc;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const OptionTitle = styled.div`
  font-size: 0.85rem;
  color: #1f2937;
  font-weight: 500;
`;

const OptionId = styled.div`
  font-size: 0.7rem;
  color: #6b7280;
  font-family: 'Monaco', 'Menlo', monospace;
`;

const DependencyItem = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f9fafb;
  }
`;

const DependencyContent = styled.div`
  flex: 1;
`;

const DependencyTitle = styled.div`
  font-size: 0.9rem;
  color: #374151;
  font-weight: 500;
  margin-bottom: 2px;
`;

const DependencyId = styled.div`
  font-size: 0.7rem;
  color: #6b7280;
  font-family: 'Monaco', 'Menlo', monospace;
`;

const StatusIndicator = styled.span`
  background: ${props => getStatusColor(props.$status)}22;
  color: ${props => getStatusColor(props.$status)};
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-left: 8px;
`;

function NodePropertiesPanel({ selectedNode }) {
    const {
        dispatch,
        editMode,
        executionView,
        uiSchema,
        planData,
        getDependentsForStory,
        stageChanges,
        getPendingChangesForEntity,
        getEntityWithPendingChanges,
        hasChangesForEntity,
        discardChanges
    } = usePlan();
    const [editData, setEditData] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        basic: true,
        assignment: false,
        criteria: false,
        dependencies: false,
        notes: false,
        execution: false
    });
    const [newItemInputs, setNewItemInputs] = useState({});
    const [autocompleteStates, setAutocompleteStates] = useState({});
    const [dropdownPositions, setDropdownPositions] = useState({});
    const inputRefs = useRef({});

    useEffect(() => {
        if (selectedNode) {
            // Get entity data with any pending changes applied
            const entityWithChanges = getEntityWithPendingChanges(
                selectedNode.data.type,
                selectedNode.data.id
            ) || selectedNode.data;

            setEditData(entityWithChanges);
            setIsEditing(false);

            // Auto-expand relevant sections based on content
            const hasContent = {
                basic: true,
                assignment: entityWithChanges?.owner_id || entityWithChanges?.complexity_score,
                criteria: entityWithChanges?.acceptance_criteria?.length > 0,
                dependencies: entityWithChanges?.dependencies?.length > 0 || getDependentsForStory(entityWithChanges?.id)?.length > 0,
                notes: entityWithChanges?.implementation_notes?.length > 0,
                execution: entityWithChanges?.execution?.history?.length > 0
            };
            setExpandedSections(hasContent);
        }
    }, [selectedNode, getDependentsForStory, getEntityWithPendingChanges]);

    // Exit editing mode when global edit mode is disabled
    useEffect(() => {
        if (!editMode && isEditing) {
            setIsEditing(false);
        }
    }, [editMode, isEditing]);

    // Auto-enable editing when global edit mode is on
    useEffect(() => {
        if (editMode && selectedNode && !isEditing) {
            setIsEditing(true);
        }
    }, [editMode, selectedNode, isEditing]);

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const handleFieldChange = (fieldPath, value) => {
        if (!isEditing) return;

        const newEditData = setNestedValue({ ...editData }, fieldPath, value);
        setEditData(newEditData);

        // Stage the changes immediately
        if (selectedNode) {
            // Calculate the diff between original and edited data
            const originalData = selectedNode.data;
            const changes = {};

            // Deep comparison to find what changed
            const findChanges = (original, edited) => {
                for (const key in edited) {
                    if (JSON.stringify(edited[key]) !== JSON.stringify(original[key])) {
                        changes[key] = edited[key];
                    }
                }
            };

            findChanges(originalData, newEditData);

            // Stage the changes
            stageChanges(
                selectedNode.data.type,
                selectedNode.data.id,
                changes,
                originalData
            );
        }
    };

    const handleArrayAdd = (fieldKey, value) => {
        if (!value.trim()) return;

        const currentArray = getNestedValue(editData, fieldKey) || [];
        const newArray = [...currentArray, value.trim()];
        handleFieldChange(fieldKey, newArray);
        setNewItemInputs(prev => ({ ...prev, [fieldKey]: '' }));
    };

    const handleArrayRemove = (fieldKey, index) => {
        const currentArray = getNestedValue(editData, fieldKey) || [];
        const newArray = currentArray.filter((_, i) => i !== index);
        handleFieldChange(fieldKey, newArray);
    };

    const calculateDropdownPosition = (fieldKey) => {
        const input = inputRefs.current[fieldKey];
        if (!input) return;

        const rect = input.getBoundingClientRect();
        setDropdownPositions(prev => ({
            ...prev,
            [fieldKey]: {
                top: rect.bottom,
                left: rect.left,
                width: rect.width
            }
        }));
    };

    const PortalDropdown = ({ fieldKey, children }) => {
        const position = dropdownPositions[fieldKey];
        if (!position) return null;

        return createPortal(
            <AutocompleteDropdown
                $top={position.top}
                $left={position.left}
                $width={position.width}
            >
                {children}
            </AutocompleteDropdown>,
            document.body
        );
    };

    const getStoryById = (storyId) => {
        return planData?.stories?.find(story => story.id === storyId);
    };

    const getAvailableStories = (fieldKey, currentDependencies = []) => {
        const currentStoryId = data.id;
        return planData?.stories?.filter(story =>
            story.id !== currentStoryId &&
            !currentDependencies.includes(story.id)
        ) || [];
    };



    const handleAutocompleteChange = (fieldKey, value) => {
        setAutocompleteStates(prev => ({
            ...prev,
            [fieldKey]: {
                ...prev[fieldKey],
                inputValue: value,
                showDropdown: true // Always show when typing
            }
        }));
    };

    const handleDependencyAdd = (fieldKey, storyId) => {
        if (!storyId) return; // Don't add undefined/null story IDs

        const currentArray = getNestedValue(editData, fieldKey) || [];
        if (!currentArray.includes(storyId)) {
            const newArray = [...currentArray, storyId];
            handleFieldChange(fieldKey, newArray);
        }
        setAutocompleteStates(prev => ({
            ...prev,
            [fieldKey]: {
                inputValue: '',
                showDropdown: false
            }
        }));
    };

    const handleDependencyRemove = (fieldKey, storyId) => {
        const currentArray = getNestedValue(editData, fieldKey) || [];
        const newArray = currentArray.filter(id => id !== storyId);
        handleFieldChange(fieldKey, newArray);
    };

    const renderStoryMultiselect = (fieldDef) => {
        const fieldValue = getNestedValue(isEditing ? editData : data, fieldDef.key) || [];
        const isReadonly = fieldDef.readonly || !editMode;
        const isChanged = isFieldChanged(fieldDef.key);
        const autocompleteState = autocompleteStates[fieldDef.key] || { inputValue: '', showDropdown: false };

        const availableStories = getAvailableStories(fieldDef.key, fieldValue);
        const searchTerm = (autocompleteState.inputValue || '').toLowerCase();
        const filteredStories = availableStories.filter(story => {
            const objective = (story?.objective || '').toLowerCase();
            const storyId = (story?.id || '').toLowerCase();
            return objective.includes(searchTerm) || storyId.includes(searchTerm);
        });

        return (
            <PropertyCard key={fieldDef.key} $isChanged={isChanged}>
                <PropertyLabel $isChanged={isChanged}>
                    {fieldDef.label}
                    {fieldDef.required && <span style={{ color: '#ef4444' }}>*</span>}
                </PropertyLabel>
                <ListContainer>
                    {fieldValue.length === 0 ? (
                        <ListItem style={{ justifyContent: 'center', fontStyle: 'italic', color: '#9ca3af' }}>
                            No {fieldDef.label.toLowerCase()} set
                        </ListItem>
                    ) : (
                        fieldValue.map((storyId) => {
                            const story = getStoryById(storyId);
                            return (
                                <DependencyItem key={storyId}>
                                    <DependencyContent>
                                        <DependencyTitle>
                                            {story?.objective || `Unknown Story (${storyId})`}
                                            {story?.status && (
                                                <StatusIndicator $status={story.status}>
                                                    {story.status}
                                                </StatusIndicator>
                                            )}
                                        </DependencyTitle>
                                        <DependencyId>{storyId}</DependencyId>
                                    </DependencyContent>
                                    {!isReadonly && (
                                        <RemoveButton onClick={() => handleDependencyRemove(fieldDef.key, storyId)}>
                                            Remove
                                        </RemoveButton>
                                    )}
                                </DependencyItem>
                            );
                        })
                    )}
                    {!isReadonly && (
                        <AddItemContainer>
                            <AutocompleteContainer>
                                <AutocompleteInput
                                    ref={(el) => {
                                        if (el) inputRefs.current[fieldDef.key] = el;
                                    }}
                                    placeholder={`Search and add ${fieldDef.label.toLowerCase()}...`}
                                    value={autocompleteState.inputValue}
                                    onChange={(e) => handleAutocompleteChange(fieldDef.key, e.target.value)}
                                    onFocus={() => {
                                        calculateDropdownPosition(fieldDef.key);
                                        setAutocompleteStates(prev => ({
                                            ...prev,
                                            [fieldDef.key]: {
                                                ...prev[fieldDef.key],
                                                showDropdown: true,
                                                inputValue: prev[fieldDef.key]?.inputValue || ''
                                            }
                                        }));
                                    }}
                                    onClick={() => {
                                        calculateDropdownPosition(fieldDef.key);
                                    }}
                                    onBlur={() => setTimeout(() => setAutocompleteStates(prev => ({
                                        ...prev,
                                        [fieldDef.key]: { ...prev[fieldDef.key], showDropdown: false }
                                    })), 300)}
                                />
                            </AutocompleteContainer>
                        </AddItemContainer>
                    )}
                </ListContainer>

                {/* Portal dropdown rendered at document body level */}
                {autocompleteState.showDropdown && (
                    <PortalDropdown fieldKey={fieldDef.key}>
                        {filteredStories.length === 0 ? (
                            <AutocompleteOption style={{ fontStyle: 'italic', color: '#9ca3af', cursor: 'default' }}>
                                {autocompleteState.inputValue ? 'No matching stories found' : 'Start typing to search stories...'}
                            </AutocompleteOption>
                        ) : (
                            filteredStories.slice(0, 5).map(story => (
                                <AutocompleteOption
                                    key={story?.id || Math.random()}
                                    onClick={() => handleDependencyAdd(fieldDef.key, story?.id)}
                                >
                                    <OptionTitle>
                                        {story?.objective || 'Untitled Story'}
                                        {story?.status && (
                                            <StatusIndicator $status={story.status}>
                                                {story.status}
                                            </StatusIndicator>
                                        )}
                                    </OptionTitle>
                                    <OptionId>{story?.id || 'No ID'}</OptionId>
                                </AutocompleteOption>
                            ))
                        )}
                    </PortalDropdown>
                )}
                {fieldDef.description && (
                    <PropertyDescription>{fieldDef.description}</PropertyDescription>
                )}
            </PropertyCard>
        );
    };

    const renderDependencyMultiselect = (fieldDef) => {
        const fieldValue = getNestedValue(isEditing ? editData : data, fieldDef.key) || [];
        const isReadonly = fieldDef.readonly || !editMode;
        const isChanged = isFieldChanged(fieldDef.key);

        return (
            <PropertyCard key={fieldDef.key} $isChanged={isChanged}>
                <PropertyLabel $isChanged={isChanged}>
                    {fieldDef.label}
                    {fieldDef.required && <span style={{ color: '#ef4444' }}>*</span>}
                </PropertyLabel>

                {isReadonly ? (
                    <ListContainer>
                        {fieldValue.length === 0 ? (
                            <ListItem style={{ justifyContent: 'center', fontStyle: 'italic', color: '#9ca3af' }}>
                                No dependencies
                            </ListItem>
                        ) : (
                            fieldValue.map((dep, index) => (
                                <ListItem key={index} style={{ background: getDependencyTypeColor(dep.type) }}>
                                    <ListItemContent>
                                        {getDependencyTypeIcon(dep.type)} {dep.type}: {dep.id}
                                    </ListItemContent>
                                </ListItem>
                            ))
                        )}
                    </ListContainer>
                ) : (
                    <div>
                        <ListContainer>
                            {fieldValue.map((dep, index) => (
                                <ListItem key={index} style={{ background: getDependencyTypeColor(dep.type) }}>
                                    <ListItemContent>
                                        {getDependencyTypeIcon(dep.type)} {dep.type}: {dep.id}
                                    </ListItemContent>
                                    <RemoveButton onClick={() => {
                                        const newDeps = fieldValue.filter((_, i) => i !== index);
                                        handleFieldChange(fieldDef.key, newDeps);
                                    }}>
                                        Remove
                                    </RemoveButton>
                                </ListItem>
                            ))}
                        </ListContainer>
                        <div style={{ marginTop: '8px', padding: '8px', background: '#f9fafb', borderRadius: '6px' }}>
                            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>
                                Add dependency (format: type:id)
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <input
                                    type="text"
                                    placeholder="e.g., story:story-auth-db"
                                    style={{
                                        flex: 1,
                                        padding: '6px 8px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem'
                                    }}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            const value = e.target.value.trim();
                                            const [type, id] = value.split(':');
                                            if (type && id && ['intent', 'checkpoint', 'story'].includes(type)) {
                                                const newDep = { type, id };
                                                const exists = fieldValue.some(dep => dep.type === type && dep.id === id);
                                                if (!exists) {
                                                    handleFieldChange(fieldDef.key, [...fieldValue, newDep]);
                                                    e.target.value = '';
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {fieldDef.description && (
                    <PropertyDescription>{fieldDef.description}</PropertyDescription>
                )}
            </PropertyCard>
        );
    };

    const renderAgentMultiselect = (fieldDef) => {
        const fieldValue = getNestedValue(isEditing ? editData : data, fieldDef.key) || [];
        const isReadonly = fieldDef.readonly || !editMode;
        const isChanged = isFieldChanged(fieldDef.key);

        return (
            <PropertyCard key={fieldDef.key} $isChanged={isChanged}>
                <PropertyLabel $isChanged={isChanged}>
                    {fieldDef.label}
                    {fieldDef.required && <span style={{ color: '#ef4444' }}>*</span>}
                </PropertyLabel>

                {isReadonly ? (
                    <ListContainer>
                        {fieldValue.length === 0 ? (
                            <ListItem style={{ justifyContent: 'center', fontStyle: 'italic', color: '#9ca3af' }}>
                                No agents selected
                            </ListItem>
                        ) : (
                            fieldValue.map((agentId, index) => (
                                <ListItem key={index}>
                                    <ListItemContent>
                                        👤 {agentId}
                                    </ListItemContent>
                                </ListItem>
                            ))
                        )}
                    </ListContainer>
                ) : (
                    <div>
                        <ListContainer>
                            {fieldValue.map((agentId, index) => (
                                <ListItem key={index}>
                                    <ListItemContent>
                                        👤 {agentId}
                                    </ListItemContent>
                                    <RemoveButton onClick={() => {
                                        const newAgents = fieldValue.filter((_, i) => i !== index);
                                        handleFieldChange(fieldDef.key, newAgents);
                                    }}>
                                        Remove
                                    </RemoveButton>
                                </ListItem>
                            ))}
                        </ListContainer>
                        <div style={{ marginTop: '8px' }}>
                            <input
                                type="text"
                                placeholder="e.g., eng-auth1"
                                style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    fontSize: '0.8rem'
                                }}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        const value = e.target.value.trim();
                                        if (value && !fieldValue.includes(value)) {
                                            handleFieldChange(fieldDef.key, [...fieldValue, value]);
                                            e.target.value = '';
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}

                {fieldDef.description && (
                    <PropertyDescription>{fieldDef.description}</PropertyDescription>
                )}
            </PropertyCard>
        );
    };

    const getDependencyTypeColor = (type) => {
        switch (type) {
            case 'intent': return '#f3e8ff';
            case 'checkpoint': return '#e0f2fe';
            case 'story': return '#fff7ed';
            default: return '#f3f4f6';
        }
    };

    const getDependencyTypeIcon = (type) => {
        switch (type) {
            case 'intent': return '🎯';
            case 'checkpoint': return '🏁';
            case 'story': return '📝';
            default: return '🔗';
        }
    };

    if (!selectedNode) {
        return (
            <PanelContainer>
                <PanelContent>
                    <EmptyState>
                        <EmptyIcon>🎯</EmptyIcon>
                        <EmptyTitle>No Selection</EmptyTitle>
                        <EmptyDescription>
                            Select a story or milestone to view its properties. Enable edit mode to make changes.
                        </EmptyDescription>
                    </EmptyState>
                </PanelContent>
            </PanelContainer>
        );
    }

    const { data } = selectedNode;
    const entitySchema = uiSchema?.[data.type];

    if (!entitySchema) {
        return (
            <PanelContainer>
                <PanelHeader>
                    <PanelTitle>Properties</PanelTitle>
                </PanelHeader>
                <PanelContent>
                    <EmptyState>
                        <EmptyIcon>⚠️</EmptyIcon>
                        <EmptyTitle>Schema Not Found</EmptyTitle>
                        <EmptyDescription>
                            No schema definition found for {data.type}
                        </EmptyDescription>
                    </EmptyState>
                </PanelContent>
            </PanelContainer>
        );
    }

    // Calculate metrics for header
    const isStory = data.type === 'story';
    const acceptanceCriteria = data.acceptance_criteria || [];
    const completedCriteria = acceptanceCriteria.filter(Boolean).length;
    const progress = acceptanceCriteria.length > 0 ?
        Math.round((completedCriteria / acceptanceCriteria.length) * 100) :
        (data.status === 'done' ? 100 : data.status === 'in_progress' ? 50 : 0);

    // Helper function to check if a field has been changed
    const isFieldChanged = (fieldKey) => {
        if (!editMode || !selectedNode) return false;
        const originalValue = getNestedValue(selectedNode.data, fieldKey);
        const currentValue = getNestedValue(editData, fieldKey);
        return JSON.stringify(originalValue) !== JSON.stringify(currentValue);
    };

    const renderField = (fieldDef, sectionId) => {
        const fieldValue = getNestedValue(isEditing ? editData : data, fieldDef.key);
        // When global edit mode is enabled, fields are editable unless explicitly readonly
        const isReadonly = fieldDef.readonly || !editMode;
        const isChanged = isFieldChanged(fieldDef.key);

        // Handle story_multiselect type with autocomplete
        if (fieldDef.type === 'story_multiselect') {
            return renderStoryMultiselect(fieldDef);
        }

        if (fieldDef.type === 'dependency_multiselect') {
            return renderDependencyMultiselect(fieldDef);
        }

        if (fieldDef.type === 'agent_multiselect') {
            return renderAgentMultiselect(fieldDef);
        }

        if (fieldDef.type === 'boolean') {
            const booleanValue = getNestedValue(isEditing ? editData : data, fieldDef.key);
            return (
                <PropertyCard key={fieldDef.key} $isChanged={isChanged}>
                    <PropertyLabel $isChanged={isChanged}>
                        {fieldDef.label}
                        {fieldDef.required && <span style={{ color: '#ef4444' }}>*</span>}
                    </PropertyLabel>
                    {isReadonly ? (
                        <ReadOnlyValue>
                            {booleanValue ? 'Yes' : 'No'}
                        </ReadOnlyValue>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                checked={booleanValue || false}
                                onChange={(e) => handleFieldChange(fieldDef.key, e.target.checked)}
                                style={{ width: '16px', height: '16px' }}
                            />
                            <span style={{ fontSize: '0.9rem', color: '#374151' }}>
                                {booleanValue ? 'Yes' : 'No'}
                            </span>
                        </div>
                    )}
                    {fieldDef.description && (
                        <PropertyDescription>{fieldDef.description}</PropertyDescription>
                    )}
                </PropertyCard>
            );
        }

        if (fieldDef.type === 'datetime') {
            const datetimeValue = getNestedValue(isEditing ? editData : data, fieldDef.key);
            const displayValue = datetimeValue ? new Date(datetimeValue).toLocaleString() : 'Not set';

            return (
                <PropertyCard key={fieldDef.key} $isChanged={isChanged}>
                    <PropertyLabel $isChanged={isChanged}>
                        {fieldDef.label}
                        {fieldDef.required && <span style={{ color: '#ef4444' }}>*</span>}
                    </PropertyLabel>
                    <ReadOnlyValue>{displayValue}</ReadOnlyValue>
                    {fieldDef.description && (
                        <PropertyDescription>{fieldDef.description}</PropertyDescription>
                    )}
                </PropertyCard>
            );
        }

        if (fieldDef.type === 'url') {
            const urlValue = getNestedValue(isEditing ? editData : data, fieldDef.key);

            return (
                <PropertyCard key={fieldDef.key} $isChanged={isChanged}>
                    <PropertyLabel $isChanged={isChanged}>
                        {fieldDef.label}
                        {fieldDef.required && <span style={{ color: '#ef4444' }}>*</span>}
                    </PropertyLabel>
                    <ReadOnlyValue>
                        {urlValue ? (
                            <a href={urlValue} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                                {urlValue}
                            </a>
                        ) : 'Not set'}
                    </ReadOnlyValue>
                    {fieldDef.description && (
                        <PropertyDescription>{fieldDef.description}</PropertyDescription>
                    )}
                </PropertyCard>
            );
        }

        if (fieldDef.type === 'array') {
            const arrayValue = fieldValue || [];
            return (
                <PropertyCard key={fieldDef.key} $isChanged={isChanged}>
                    <PropertyLabel $isChanged={isChanged}>
                        {fieldDef.label}
                        {fieldDef.required && <span style={{ color: '#ef4444' }}>*</span>}
                    </PropertyLabel>
                    <ListContainer>
                        {arrayValue.length === 0 ? (
                            <ListItem style={{ justifyContent: 'center', fontStyle: 'italic', color: '#9ca3af' }}>
                                No items added yet
                            </ListItem>
                        ) : (
                            arrayValue.map((item, index) => (
                                <ListItem key={index}>
                                    <ListItemContent>{item}</ListItemContent>
                                    {!isReadonly && (
                                        <RemoveButton onClick={() => handleArrayRemove(fieldDef.key, index)}>
                                            Remove
                                        </RemoveButton>
                                    )}
                                </ListItem>
                            ))
                        )}
                        {!isReadonly && (
                            <AddItemContainer>
                                <AddInput
                                    placeholder={fieldDef.placeholder || `Add ${fieldDef.label.toLowerCase()}...`}
                                    value={newItemInputs[fieldDef.key] || ''}
                                    onChange={(e) => setNewItemInputs(prev => ({
                                        ...prev,
                                        [fieldDef.key]: e.target.value
                                    }))}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleArrayAdd(fieldDef.key, newItemInputs[fieldDef.key] || '');
                                        }
                                    }}
                                />
                                <AddButton
                                    onClick={() => handleArrayAdd(fieldDef.key, newItemInputs[fieldDef.key] || '')}
                                >
                                    Add
                                </AddButton>
                            </AddItemContainer>
                        )}
                    </ListContainer>
                    {fieldDef.description && (
                        <PropertyDescription>{fieldDef.description}</PropertyDescription>
                    )}
                </PropertyCard>
            );
        }

        return (
            <PropertyCard key={fieldDef.key} $isChanged={isChanged}>
                <PropertyLabel $isChanged={isChanged}>
                    {fieldDef.label}
                    {fieldDef.required && <span style={{ color: '#ef4444' }}>*</span>}
                    {fieldDef.key === 'complexity_score' && fieldValue && (
                        <ComplexityIndicator $score={fieldValue}>
                            ⚡ {fieldValue}
                        </ComplexityIndicator>
                    )}
                </PropertyLabel>

                {isReadonly ? (
                    <ReadOnlyValue>
                        {fieldDef.key === 'status' && fieldValue ? (
                            <StatusBadge $status={fieldValue}>
                                <span>{getStatusIcon(fieldValue)}</span>
                                {fieldValue.replace('_', ' ')}
                            </StatusBadge>
                        ) : fieldDef.type === 'select' && fieldDef.options ? (
                            fieldDef.options.find(opt => opt.value === fieldValue)?.label || fieldValue
                        ) : (
                            fieldValue || 'Not set'
                        )}

                        {fieldDef.key === 'estimated_tokens' && data.actual_tokens && (
                            <TokenDisplay>
                                <TokenBar>
                                    <TokenProgress $actual={data.actual_tokens} $estimated={fieldValue} />
                                </TokenBar>
                                <span>{data.actual_tokens} used</span>
                            </TokenDisplay>
                        )}
                    </ReadOnlyValue>
                ) : (
                    <>
                        {fieldDef.type === 'textarea' ? (
                            <EditTextarea
                                value={fieldValue || ''}
                                onChange={(e) => handleFieldChange(fieldDef.key, e.target.value)}
                                placeholder={fieldDef.placeholder}
                            />
                        ) : fieldDef.type === 'select' ? (
                            <SelectInput
                                value={fieldValue || ''}
                                onChange={(e) => handleFieldChange(fieldDef.key, e.target.value)}
                            >
                                <option value="">Select {fieldDef.label.toLowerCase()}...</option>
                                {fieldDef.options?.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </SelectInput>
                        ) : (
                            <EditInput
                                type={fieldDef.type === 'number' ? 'number' : 'text'}
                                value={fieldValue || ''}
                                onChange={(e) => handleFieldChange(fieldDef.key,
                                    fieldDef.type === 'number' ? Number(e.target.value) : e.target.value
                                )}
                                placeholder={fieldDef.placeholder}
                                min={fieldDef.min}
                                max={fieldDef.max}
                            />
                        )}
                    </>
                )}

                {fieldDef.description && (
                    <PropertyDescription>{fieldDef.description}</PropertyDescription>
                )}

                {fieldDef.key === 'acceptance_criteria' && fieldValue?.length > 0 && (
                    <ProgressBarContainer>
                        <ProgressText>
                            <span>Progress</span>
                            <span>{progress}%</span>
                        </ProgressText>
                        <ProgressBarTrack>
                            <ProgressBarFill $progress={progress} $status={data.status} />
                        </ProgressBarTrack>
                    </ProgressBarContainer>
                )}
            </PropertyCard>
        );
    };

    return (
        <PanelContainer>
            <PanelHeader>
                <HeaderTop>
                    <PanelTitle>
                        <SectionIcon>{isStory ? '📝' : '🎯'}</SectionIcon>
                        {entitySchema.title}
                        <NodeTypeChip>{data.type}</NodeTypeChip>
                        {hasChangesForEntity(data.type, data.id) && (
                            <NodeTypeChip style={{ background: '#f59e0b', animation: 'pulse 2s infinite' }}>
                                MODIFIED
                            </NodeTypeChip>
                        )}
                    </PanelTitle>

                    <QuickActions>
                        {/* Global edit controls handled by main save indicator */}
                    </QuickActions>
                </HeaderTop>

                <CompactStatusRow>
                    <StatusBadge $status={data.status}>
                        <span>{getStatusIcon(data.status)}</span>
                        {data.status?.replace('_', ' ') || 'No Status'}
                    </StatusBadge>

                    <CompactMetrics>
                        {isStory && (
                            <>
                                <MetricItem>{progress}% done</MetricItem>
                                {data.complexity_score && (
                                    <MetricItem>⚡{data.complexity_score}</MetricItem>
                                )}
                                {data.estimated_tokens && (
                                    <MetricItem>🔢{data.actual_tokens || data.estimated_tokens}</MetricItem>
                                )}
                            </>
                        )}
                        {!isStory && data.stories && (
                            <MetricItem>📚{data.stories.length} stories</MetricItem>
                        )}
                    </CompactMetrics>
                </CompactStatusRow>
            </PanelHeader>

            <PanelContent>
                {entitySchema.sections?.map((section, index) => (
                    <Section key={section.id} $delay={`${index * 0.1}s`}>
                        <SectionHeader
                            $expanded={expandedSections[section.id]}
                            onClick={() => toggleSection(section.id)}
                        >
                            <SectionTitle>
                                <SectionIcon>
                                    {section.id === 'basic' ? '📋' :
                                        section.id === 'assignment' ? '👤' :
                                            section.id === 'criteria' ? '✅' :
                                                section.id === 'dependencies' ? '🔗' :
                                                    section.id === 'notes' ? '📝' :
                                                        section.id === 'execution' ? '⚡' : '📂'}
                                </SectionIcon>
                                {section.title}
                            </SectionTitle>
                            <ExpandIcon $expanded={expandedSections[section.id]}>
                                ▼
                            </ExpandIcon>
                        </SectionHeader>

                        <SectionContent $expanded={expandedSections[section.id]}>
                            <PropertyGrid>
                                {section.fields.map(fieldDef => renderField(fieldDef, section.id))}
                            </PropertyGrid>
                        </SectionContent>
                    </Section>
                ))}

                {/* Execution Details Section - Only show in execution view */}
                {executionView && data.execution && (
                    <Section>
                        <SectionHeader
                            $expanded={expandedSections.execution_details || false}
                            onClick={() => toggleSection('execution_details')}
                        >
                            <SectionTitle>
                                <SectionIcon>📊</SectionIcon>
                                Live Execution Details
                            </SectionTitle>
                            <ExpandIcon $expanded={expandedSections.execution_details || false}>
                                ▼
                            </ExpandIcon>
                        </SectionHeader>

                        <SectionContent $expanded={expandedSections.execution_details !== false}>
                            <PropertyGrid>
                                <PropertyCard>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <strong>Current Status</strong>
                                        <StatusBadge $status={data.execution.current?.status || 'planned'}>
                                            {getStatusIcon(data.execution.current?.status || 'planned')}
                                            {data.execution.current?.status || 'planned'}
                                        </StatusBadge>
                                    </div>

                                    {data.execution.current?.agent_id && (
                                        <div style={{ marginBottom: '8px' }}>
                                            <strong>Assigned Agent:</strong> {data.execution.current.agent_id}
                                        </div>
                                    )}

                                    {data.execution.current?.started_at && (
                                        <div style={{ marginBottom: '8px' }}>
                                            <strong>Started At:</strong> {new Date(data.execution.current.started_at).toLocaleString()}
                                        </div>
                                    )}

                                    {data.execution.current?.duration_seconds && (
                                        <div style={{ marginBottom: '8px' }}>
                                            <strong>Duration:</strong> {Math.round(data.execution.current.duration_seconds / 60)} minutes
                                        </div>
                                    )}

                                    {data.execution.current?.pr_url && (
                                        <div style={{ marginBottom: '8px' }}>
                                            <strong>Pull Request:</strong>{' '}
                                            <a
                                                href={data.execution.current.pr_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: '#3b82f6', textDecoration: 'underline' }}
                                            >
                                                PR #{data.execution.current.pr_number}
                                            </a>
                                        </div>
                                    )}

                                    {data.execution.current?.commit_sha && (
                                        <div style={{ marginBottom: '8px' }}>
                                            <strong>Commit:</strong>{' '}
                                            <code style={{
                                                backgroundColor: 'rgba(0,0,0,0.1)',
                                                padding: '2px 4px',
                                                borderRadius: '4px',
                                                fontSize: '0.8em'
                                            }}>
                                                {data.execution.current.commit_sha.substring(0, 8)}
                                            </code>
                                        </div>
                                    )}

                                    {data.execution.current?.messages_count && (
                                        <div style={{ marginBottom: '8px' }}>
                                            <strong>Messages Count:</strong> {data.execution.current.messages_count}
                                        </div>
                                    )}

                                    {data.execution.history && data.execution.history.length > 0 && (
                                        <div style={{ fontSize: '0.9em', color: '#6b7280' }}>
                                            <strong>Execution History:</strong> {data.execution.history.length} previous runs
                                        </div>
                                    )}
                                </PropertyCard>
                            </PropertyGrid>
                        </SectionContent>
                    </Section>
                )}
            </PanelContent>
        </PanelContainer>
    );
}

export default NodePropertiesPanel; 