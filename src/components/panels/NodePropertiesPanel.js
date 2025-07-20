import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { usePlan } from '../../context/PlanContext';
import { getStatusColor, getStatusIcon } from '../../utils/flowUtils';

const PanelContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
`;

const PanelHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;
`;

const PanelTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NodeType = styled.span`
  background: #3b82f6;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
`;

const PanelContent = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

const PropertySection = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h4`
  margin: 0 0 12px 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 6px;
`;

const PropertyRow = styled.div`
  margin-bottom: 16px;
`;

const PropertyLabel = styled.label`
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 4px;
`;

const PropertyValue = styled.div`
  font-size: 0.9rem;
  color: #1f2937;
  padding: 8px 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  min-height: 20px;
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: ${props => getStatusColor(props.status)};
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 600;
`;

const ListItem = styled.div`
  padding: 6px 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.85rem;
  color: #4b5563;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:last-child {
    border-bottom: none;
  }
`;

const RemoveButton = styled.button`
  background: #ef4444;
  color: white;
  border: none;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.6rem;
  cursor: pointer;
  
  &:hover {
    background: #dc2626;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #9ca3af;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EditInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const EditTextarea = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  min-height: 80px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const EditNumber = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const SelectInput = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ArrayInput = styled.div`
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  padding: 8px;
`;

const ArrayItem = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
`;

const AddButton = styled.button`
  background: #10b981;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  cursor: pointer;
  
  &:hover {
    background: #059669;
  }
`;

const SaveButton = styled.button`
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 12px;

  &:hover {
    background: #059669;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  }
`;

function NodePropertiesPanel({ selectedNode }) {
    const { dispatch, editMode, schema, planData } = usePlan();
    const [editData, setEditData] = useState({});
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (selectedNode) {
            setEditData(selectedNode.data || {});
            setIsEditing(false);
        }
    }, [selectedNode]);

    if (!selectedNode) {
        return (
            <PanelContainer>
                <PanelHeader>
                    <PanelTitle>Properties</PanelTitle>
                </PanelHeader>
                <PanelContent>
                    <EmptyState>
                        <EmptyIcon>🎯</EmptyIcon>
                        <div>Select a story to view its properties</div>
                    </EmptyState>
                </PanelContent>
            </PanelContainer>
        );
    }

    const { data } = selectedNode;
    const isStory = data.type === 'story';

    const handleSave = () => {
        if (isStory) {
            dispatch({
                type: 'UPDATE_STORY',
                payload: {
                    id: data.id,
                    updates: editData
                }
            });
        }
        setIsEditing(false);
    };

    const handleArrayChange = (field, index, value) => {
        const newArray = [...(editData[field] || [])];
        newArray[index] = value;
        setEditData({ ...editData, [field]: newArray });
    };

    const handleArrayAdd = (field, defaultValue = '') => {
        const newArray = [...(editData[field] || []), defaultValue];
        setEditData({ ...editData, [field]: newArray });
    };

    const handleArrayRemove = (field, index) => {
        const newArray = (editData[field] || []).filter((_, i) => i !== index);
        setEditData({ ...editData, [field]: newArray });
    };

    const statusOptions = ['planned', 'in_progress', 'blocked', 'done', 'cancelled'];
    const milestoneOptions = planData?.project?.milestones?.map(m => m.id) || [];

    const renderEditableField = (field, value, type = 'text') => {
        if (!editMode || !isEditing) {
            if (field === 'status') {
                return (
                    <StatusBadge status={value}>
                        {getStatusIcon(value)}
                        {value?.replace('_', ' ')}
                    </StatusBadge>
                );
            }
            return <PropertyValue>{value || 'Not set'}</PropertyValue>;
        }

        switch (type) {
            case 'select':
                return (
                    <SelectInput
                        value={editData[field] || value || ''}
                        onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
                    >
                        {field === 'status' && statusOptions.map(status => (
                            <option key={status} value={status}>
                                {status.replace('_', ' ')}
                            </option>
                        ))}
                        {field === 'milestone' && (
                            <>
                                <option value="">No milestone</option>
                                {milestoneOptions.map(milestone => (
                                    <option key={milestone} value={milestone}>
                                        {milestone}
                                    </option>
                                ))}
                            </>
                        )}
                    </SelectInput>
                );
            case 'number':
                return (
                    <EditNumber
                        type="number"
                        value={editData[field] ?? value ?? ''}
                        onChange={(e) => setEditData({ ...editData, [field]: Number(e.target.value) || null })}
                    />
                );
            case 'textarea':
                return (
                    <EditTextarea
                        value={editData[field] ?? value ?? ''}
                        onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
                    />
                );
            case 'array':
                return (
                    <ArrayInput>
                        {(editData[field] || value || []).map((item, index) => (
                            <ArrayItem key={index}>
                                <EditInput
                                    value={item}
                                    onChange={(e) => handleArrayChange(field, index, e.target.value)}
                                    placeholder={`${field} item`}
                                />
                                <RemoveButton onClick={() => handleArrayRemove(field, index)}>
                                    ×
                                </RemoveButton>
                            </ArrayItem>
                        ))}
                        <AddButton onClick={() => handleArrayAdd(field)}>
                            + Add {field.replace('_', ' ')}
                        </AddButton>
                    </ArrayInput>
                );
            default:
                return (
                    <EditInput
                        type="text"
                        value={editData[field] ?? value ?? ''}
                        onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
                    />
                );
        }
    };

    return (
        <PanelContainer>
            <PanelHeader>
                <PanelTitle>
                    📝 Story Properties
                    <NodeType>{data.type}</NodeType>
                </PanelTitle>
            </PanelHeader>

            <PanelContent>
                <PropertySection>
                    <SectionTitle>Basic Information</SectionTitle>

                    <PropertyRow>
                        <PropertyLabel>ID</PropertyLabel>
                        <PropertyValue>{data.id}</PropertyValue>
                    </PropertyRow>

                    <PropertyRow>
                        <PropertyLabel>Objective</PropertyLabel>
                        {renderEditableField('objective', data.objective, 'textarea')}
                    </PropertyRow>

                    <PropertyRow>
                        <PropertyLabel>Status</PropertyLabel>
                        {renderEditableField('status', data.status, 'select')}
                    </PropertyRow>

                    <PropertyRow>
                        <PropertyLabel>Milestone</PropertyLabel>
                        {renderEditableField('milestone', data.milestone, 'select')}
                    </PropertyRow>
                </PropertySection>

                <PropertySection>
                    <SectionTitle>Assignment & Ownership</SectionTitle>

                    <PropertyRow>
                        <PropertyLabel>Owner ID</PropertyLabel>
                        {renderEditableField('owner_id', data.owner_id)}
                    </PropertyRow>
                </PropertySection>

                <PropertySection>
                    <SectionTitle>Dependencies</SectionTitle>

                    <PropertyRow>
                        <PropertyLabel>Dependencies ({data.dependencies?.length || 0})</PropertyLabel>
                        {renderEditableField('dependencies', data.dependencies, 'array')}
                    </PropertyRow>

                    <PropertyRow>
                        <PropertyLabel>Dependents ({data.dependents?.length || 0})</PropertyLabel>
                        {renderEditableField('dependents', data.dependents, 'array')}
                    </PropertyRow>
                </PropertySection>

                <PropertySection>
                    <SectionTitle>Acceptance Criteria</SectionTitle>
                    <PropertyRow>
                        <PropertyLabel>Criteria</PropertyLabel>
                        {renderEditableField('acceptance_criteria', data.acceptance_criteria, 'array')}
                    </PropertyRow>
                </PropertySection>

                <PropertySection>
                    <SectionTitle>Implementation Details</SectionTitle>

                    <PropertyRow>
                        <PropertyLabel>Implementation Notes</PropertyLabel>
                        {renderEditableField('implementation_notes', data.implementation_notes, 'array')}
                    </PropertyRow>
                </PropertySection>

                <PropertySection>
                    <SectionTitle>Metrics & Estimation</SectionTitle>

                    <PropertyRow>
                        <PropertyLabel>Complexity Score (1-10)</PropertyLabel>
                        {renderEditableField('complexity_score', data.complexity_score, 'number')}
                    </PropertyRow>

                    <PropertyRow>
                        <PropertyLabel>Estimated Tokens</PropertyLabel>
                        {renderEditableField('estimated_tokens', data.estimated_tokens, 'number')}
                    </PropertyRow>

                    <PropertyRow>
                        <PropertyLabel>Actual Tokens</PropertyLabel>
                        {renderEditableField('actual_tokens', data.actual_tokens, 'number')}
                    </PropertyRow>
                </PropertySection>

                {editMode && (
                    <PropertySection>
                        <SectionTitle>Actions</SectionTitle>
                        {!isEditing ? (
                            <SaveButton onClick={() => setIsEditing(true)}>
                                ✏️ Edit Properties
                            </SaveButton>
                        ) : (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <SaveButton onClick={handleSave}>
                                    💾 Save Changes
                                </SaveButton>
                                <SaveButton
                                    onClick={() => setIsEditing(false)}
                                    style={{ background: '#6b7280' }}
                                >
                                    ❌ Cancel
                                </SaveButton>
                            </div>
                        )}
                    </PropertySection>
                )}
            </PanelContent>
        </PanelContainer>
    );
}

export default NodePropertiesPanel; 