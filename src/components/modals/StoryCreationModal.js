import React, { useState } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  min-width: 500px;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 16px;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: #111827;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 4px;
  
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
  margin-bottom: 6px;
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  min-height: 80px;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const NumberInput = styled(Input)`
  width: 100%;
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
`;

const ArrayInput = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  background: #f9fafb;
`;

const ArrayItem = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
  
  &:last-child {
    margin-bottom: 8px;
  }
`;

const ArrayItemInput = styled(Input)`
  flex: 1;
  margin: 0;
`;

const RemoveButton = styled.button`
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 0.8rem;
  
  &:hover {
    background: #dc2626;
  }
`;

const AddButton = styled.button`
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  
  &:hover {
    background: #059669;
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 20px 0 12px 0;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 8px;
`;

function StoryCreationModal({ isOpen, onClose, onCreateStory, intents = [], checkpoints = [] }) {
  const [formData, setFormData] = useState({
    objective: '',
    intent_id: '',
    workstream_id: '',
    acceptance_criteria: [''],
    implementation_notes: [''],
    estimated_tokens: '',
    complexity_score: 1,
    preferred_agents: [''],
    max_runtime_seconds: 3600,
    require_manual_approval: false,
    dependencies: []
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
      preferred_agents: formData.preferred_agents.filter(item => item.trim()),
      estimated_tokens: formData.estimated_tokens ? Number(formData.estimated_tokens) : null,
      complexity_score: Number(formData.complexity_score),
      max_runtime_seconds: Number(formData.max_runtime_seconds)
    };

    onCreateStory(cleanedData);
  };

  const handleCancel = () => {
    setFormData({
      objective: '',
      intent_id: '',
      workstream_id: '',
      acceptance_criteria: [''],
      implementation_notes: [''],
      estimated_tokens: '',
      complexity_score: 1,
      preferred_agents: [''],
      max_runtime_seconds: 3600,
      require_manual_approval: false,
      dependencies: []
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
          <SectionTitle>📋 Basic Information</SectionTitle>

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
            <Label>Intent *</Label>
            <Select
              value={formData.intent_id}
              onChange={(e) => handleInputChange('intent_id', e.target.value)}
              required
            >
              <option value="">Select an intent...</option>
              {intents.map(intent => (
                <option key={intent.id} value={intent.id}>
                  🎯 {intent.name}
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Workstream *</Label>
            <Input
              type="text"
              placeholder="e.g., workstream-auth-backend"
              value={formData.workstream_id}
              onChange={(e) => handleInputChange('workstream_id', e.target.value)}
              required
            />
          </FormGroup>

          <SectionTitle>✅ Acceptance Criteria</SectionTitle>

          <FormGroup>
            <Label>Acceptance Criteria *</Label>
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

          <SectionTitle>📝 Implementation Details</SectionTitle>

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

          <SectionTitle>👤 Preferences</SectionTitle>

          <FormGroup>
            <Label>Preferred Agents (in priority order)</Label>
            <ArrayInput>
              {formData.preferred_agents.map((agent, index) => (
                <ArrayItem key={index}>
                  <ArrayItemInput
                    placeholder={`e.g., eng-auth1`}
                    value={agent}
                    onChange={(e) => handleArrayChange('preferred_agents', index, e.target.value)}
                  />
                  {formData.preferred_agents.length > 1 && (
                    <RemoveButton onClick={() => handleArrayRemove('preferred_agents', index)}>
                      ×
                    </RemoveButton>
                  )}
                </ArrayItem>
              ))}
              <AddButton onClick={() => handleArrayAdd('preferred_agents')}>
                + Add Agent
              </AddButton>
            </ArrayInput>
          </FormGroup>

          <FormGroup>
            <Label>Max Runtime (seconds)</Label>
            <NumberInput
              type="number"
              min="60"
              value={formData.max_runtime_seconds}
              onChange={(e) => handleInputChange('max_runtime_seconds', e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <CheckboxContainer>
              <Checkbox
                type="checkbox"
                checked={formData.require_manual_approval}
                onChange={(e) => handleInputChange('require_manual_approval', e.target.checked)}
              />
              <Label style={{ margin: 0 }}>Require manual approval before execution</Label>
            </CheckboxContainer>
          </FormGroup>

          <ModalFooter>
            <Button type="button" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!formData.objective.trim() || !formData.intent_id || !formData.workstream_id}
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