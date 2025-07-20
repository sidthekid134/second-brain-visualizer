import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { usePlan } from '../../context/PlanContext';
import { getStatusColor, getStatusIcon } from '../../utils/flowUtils';
import { renderSchemaField, getNestedValue, setNestedValue } from '../../utils/schemaRenderer';

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
    const { dispatch, editMode, uiSchema, planData } = usePlan();
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





    // Get the schema definition for this entity type
    const entitySchema = uiSchema?.[data.type];

    if (!entitySchema) {
        return (
            <PanelContainer>
                <PanelHeader>
                    <PanelTitle>Properties</PanelTitle>
                </PanelHeader>
                <PanelContent>
                    <div style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>
                        No schema found for {data.type}
                    </div>
                </PanelContent>
            </PanelContainer>
        );
    }

    const handleFieldChange = (fieldKey, value) => {
        if (fieldKey.includes('.')) {
            // Handle nested field updates
            setEditData(prevData => setNestedValue(prevData, fieldKey, value));
        } else {
            setEditData(prevData => ({ ...prevData, [fieldKey]: value }));
        }
    };

    return (
        <PanelContainer>
            <PanelHeader>
                <PanelTitle>
                    {entitySchema.title} Properties
                    <NodeType>{data.type}</NodeType>
                </PanelTitle>
                {editMode && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleSave}
                                    style={{
                                        background: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditData(data);
                                    }}
                                    style={{
                                        background: '#6b7280',
                                        color: 'white',
                                        border: 'none',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                style={{
                                    background: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.7rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Edit
                            </button>
                        )}
                    </div>
                )}
            </PanelHeader>

            <PanelContent>
                {entitySchema.sections?.map(section => (
                    <PropertySection key={section.id}>
                        <SectionTitle>{section.title}</SectionTitle>

                        {section.fields.map(fieldDef => {
                            const fieldValue = getNestedValue(isEditing ? editData : data, fieldDef.key);

                            return (
                                <PropertyRow key={fieldDef.key}>
                                    <PropertyLabel>
                                        {fieldDef.label}
                                        {fieldDef.required && <span style={{ color: '#ef4444' }}>*</span>}
                                    </PropertyLabel>
                                    <div style={{ flex: 1 }}>
                                        {renderSchemaField(
                                            fieldDef,
                                            fieldValue,
                                            (value) => handleFieldChange(fieldDef.key, value),
                                            {
                                                planData,
                                                uiSchema,
                                                editMode,
                                                isEditing
                                            }
                                        )}
                                        {fieldDef.description && (
                                            <div style={{
                                                fontSize: '0.7rem',
                                                color: '#6b7280',
                                                marginTop: '2px'
                                            }}>
                                                {fieldDef.description}
                                            </div>
                                        )}
                                    </div>
                                </PropertyRow>
                            );
                        })}
                    </PropertySection>
                ))}
            </PanelContent>
        </PanelContainer>
    );
}

export default NodePropertiesPanel; 