import React, { useState, useMemo } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
`;

const ModalContent = styled.div`
  background: #ffffff;
  border-radius: 16px;
  width: 520px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px 28px;
  box-shadow: 0 24px 72px rgba(15, 23, 42, 0.25);
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
`;

const CloseButton = styled.button`
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
`;

const Input = styled.input`
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.95rem;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }
`;

const TextArea = styled.textarea`
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.95rem;
  min-height: 90px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }
`;

const Select = styled.select`
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.95rem;
  background: #ffffff;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
`;

const Button = styled.button`
  border-radius: 10px;
  border: none;
  padding: 10px 18px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
`;

const SecondaryButton = styled(Button)`
  background: #f3f4f6;
  color: #374151;

  &:hover {
    background: #e5e7eb;
  }
`;

const PrimaryButton = styled(Button)`
  background: #2563eb;
  color: white;

  &:hover:not(:disabled) {
    background: #1d4ed8;
  }

  &:disabled {
    background: #93c5fd;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.div`
  color: #dc2626;
  font-size: 0.8rem;
`;

function IntentCreationModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [owner, setOwner] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);

  const isValid = useMemo(() => name.trim().length > 0, [name]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isValid) {
      setError('Intent name is required.');
      return;
    }

    const timestamp = new Date().toISOString();
    const id = `intent-${Date.now()}`;

    const newIntent = {
      id,
      name: name.trim(),
      description: description.trim() || '',
      status: 'planned',
      dependencies: [],
      created_at: timestamp,
      updated_at: timestamp,
      priority,
      owner: owner.trim() || null,
      notes: notes.trim() || null
    };

    const checkpoint = {
      id: `checkpoint-${id}`,
      name: `${newIntent.name} Checkpoint`,
      description: `Completion checkpoint for ${newIntent.name}`,
      status: 'planned',
      story_ids: [],
      dependencies: [],
      created_at: timestamp,
      updated_at: timestamp
    };

    if (onCreate) {
      onCreate({ intent: newIntent, checkpoints: [checkpoint] });
    }

    setName('');
    setDescription('');
    setPriority('medium');
    setOwner('');
    setNotes('');
    setError(null);
    if (onClose) {
      onClose();
    }
  };

  const handleClose = () => {
    setError(null);
    if (onClose) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <Title>Create Intent</Title>
          <CloseButton onClick={handleClose} aria-label="Close intent modal">×</CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          <Field>
            <Label htmlFor="intent-name">Name *</Label>
            <Input
              id="intent-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g., Authentication Foundation"
              autoFocus
            />
          </Field>

          <Field>
            <Label htmlFor="intent-description">Description</Label>
            <TextArea
              id="intent-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="High-level vision for the workstream"
            />
          </Field>

          <Field>
            <Label htmlFor="intent-priority">Priority</Label>
            <Select
              id="intent-priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
          </Field>

          <Field>
            <Label htmlFor="intent-owner">Owner</Label>
            <Input
              id="intent-owner"
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
              placeholder="Optional owner or lead"
            />
          </Field>

          <Field>
            <Label htmlFor="intent-notes">Notes</Label>
            <TextArea
              id="intent-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Any additional context or guardrails"
            />
          </Field>

          {error && <ErrorText>{error}</ErrorText>}

          <Footer>
            <SecondaryButton type="button" onClick={handleClose}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={!isValid}>
              Create Intent
            </PrimaryButton>
          </Footer>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
}

export default IntentCreationModal;
