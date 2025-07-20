import React, { useState } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid #e5e7eb;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
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

  &::placeholder {
    color: #9ca3af;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
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
`;

const NumberInput = styled(Input)`
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  &[type=number] {
    -moz-appearance: textfield;
  }
`;

const ArrayInput = styled.div`
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px;
  background: white;
`;

const ArrayItem = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ArrayItemInput = styled(Input)`
  margin: 0;
`;

const RemoveButton = styled.button`
  background: #ef4444;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #dc2626;
  }
`;

const AddButton = styled.button`
  background: #10b981;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
  
  &:hover {
    background: #059669;
  }
`;

const ModalFooter = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;

  ${props => props.variant === 'primary' ? `
    background: #3b82f6;
    color: white;
    
    &:hover {
      background: #2563eb;
    }
    
    &:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
  ` : `
    background: #f3f4f6;
    color: #374151;
    
    &:hover {
      background: #e5e7eb;
    }
  `}
`;

function StoryCreationModal({ isOpen, onClose, onCreateStory, milestones = [] }) {
    const [formData, setFormData] = useState({
        objective: '',
        milestone: '',
        owner_id: '',
        acceptance_criteria: [''],
        implementation_notes: [''],
        estimated_tokens: '',
        complexity_score: 1
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleArrayChange = (field, index, value) => {
        const newArray = [...formData[field]];
        newArray[index] = value;
        setFormData(prev => ({
            ...prev,
            [field]: newArray
        }));
    };

    const handleArrayAdd = (field) => {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], '']
        }));
    };

    const handleArrayRemove = (field, index) => {
        const newArray = formData[field].filter((_, i) => i !== index);
        setFormData(prev => ({
            ...prev,
            [field]: newArray
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.objective.trim()) return;

        const cleanedData = {
            ...formData,
            acceptance_criteria: formData.acceptance_criteria.filter(item => item.trim()),
            implementation_notes: formData.implementation_notes.filter(item => item.trim()),
            estimated_tokens: formData.estimated_tokens ? Number(formData.estimated_tokens) : null,
            complexity_score: Number(formData.complexity_score)
        };

        onCreateStory(cleanedData);
    };

    const handleCancel = () => {
        setFormData({
            objective: '',
            milestone: '',
            owner_id: '',
            acceptance_criteria: [''],
            implementation_notes: [''],
            estimated_tokens: '',
            complexity_score: 1
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <ModalOverlay onClick={handleCancel}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle>
                        ➕ Create New Story
                    </ModalTitle>
                    <CloseButton onClick={handleCancel}>
                        ×
                    </CloseButton>
                </ModalHeader>

                <form onSubmit={handleSubmit}>
                    <FormGroup>
                        <Label>Objective *</Label>
                        <TextArea
                            placeholder="Describe what this story aims to accomplish..."
                            value={formData.objective}
                            onChange={(e) => handleInputChange('objective', e.target.value)}
                            required
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>Milestone</Label>
                        <Select
                            value={formData.milestone}
                            onChange={(e) => handleInputChange('milestone', e.target.value)}
                        >
                            <option value="">No milestone</option>
                            {milestones.map(milestone => (
                                <option key={milestone.id} value={milestone.id}>
                                    {milestone.name}
                                </option>
                            ))}
                        </Select>
                    </FormGroup>

                    <FormGroup>
                        <Label>Owner ID</Label>
                        <Input
                            type="text"
                            placeholder="e.g., AG-001 or agent-name"
                            value={formData.owner_id}
                            onChange={(e) => handleInputChange('owner_id', e.target.value)}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>Acceptance Criteria</Label>
                        <ArrayInput>
                            {formData.acceptance_criteria.map((criteria, index) => (
                                <ArrayItem key={index}>
                                    <ArrayItemInput
                                        placeholder={`Acceptance criteria ${index + 1}`}
                                        value={criteria}
                                        onChange={(e) => handleArrayChange('acceptance_criteria', index, e.target.value)}
                                    />
                                    {formData.acceptance_criteria.length > 1 && (
                                        <RemoveButton onClick={() => handleArrayRemove('acceptance_criteria', index)}>
                                            ×
                                        </RemoveButton>
                                    )}
                                </ArrayItem>
                            ))}
                            <AddButton onClick={() => handleArrayAdd('acceptance_criteria')}>
                                + Add Criteria
                            </AddButton>
                        </ArrayInput>
                    </FormGroup>

                    <FormGroup>
                        <Label>Implementation Notes</Label>
                        <ArrayInput>
                            {formData.implementation_notes.map((note, index) => (
                                <ArrayItem key={index}>
                                    <ArrayItemInput
                                        placeholder={`Implementation note ${index + 1}`}
                                        value={note}
                                        onChange={(e) => handleArrayChange('implementation_notes', index, e.target.value)}
                                    />
                                    {formData.implementation_notes.length > 1 && (
                                        <RemoveButton onClick={() => handleArrayRemove('implementation_notes', index)}>
                                            ×
                                        </RemoveButton>
                                    )}
                                </ArrayItem>
                            ))}
                            <AddButton onClick={() => handleArrayAdd('implementation_notes')}>
                                + Add Note
                            </AddButton>
                        </ArrayInput>
                    </FormGroup>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <FormGroup style={{ flex: 1 }}>
                            <Label>Complexity Score (1-10)</Label>
                            <NumberInput
                                type="number"
                                min="1"
                                max="10"
                                value={formData.complexity_score}
                                onChange={(e) => handleInputChange('complexity_score', e.target.value)}
                            />
                        </FormGroup>

                        <FormGroup style={{ flex: 1 }}>
                            <Label>Estimated Tokens</Label>
                            <NumberInput
                                type="number"
                                min="0"
                                placeholder="e.g., 500"
                                value={formData.estimated_tokens}
                                onChange={(e) => handleInputChange('estimated_tokens', e.target.value)}
                            />
                        </FormGroup>
                    </div>

                    <ModalFooter>
                        <Button type="button" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={!formData.objective.trim()}
                        >
                            Create Story
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </ModalOverlay>
    );
}

export default StoryCreationModal; 