import React from 'react';
import styled from 'styled-components';

const ToolbarContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
`;

const ToolbarSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SectionTitle = styled.div`
  font-size: 0.7rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const ToolbarButton = styled.button`
  background: ${props => props.active ? '#3b82f6' : 'white'};
  color: ${props => props.active ? 'white' : '#374151'};
  border: 1px solid ${props => props.active ? '#3b82f6' : '#d1d5db'};
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: ${props => props.active ? '#2563eb' : '#f9fafb'};
    border-color: ${props => props.active ? '#2563eb' : '#9ca3af'};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ModeToggle = styled(ToolbarButton)`
  background: ${props => props.active ? '#10b981' : '#fef3c7'};
  color: ${props => props.active ? 'white' : '#92400e'};
  border-color: ${props => props.active ? '#10b981' : '#fbbf24'};

  &:hover {
    background: ${props => props.active ? '#059669' : '#fef3c7'};
    border-color: ${props => props.active ? '#059669' : '#f59e0b'};
  }
`;

const AddButton = styled(ToolbarButton)`
  background: #10b981;
  color: white;
  border-color: #10b981;

  &:hover {
    background: #059669;
    border-color: #059669;
  }
`;

const DeleteButton = styled(ToolbarButton)`
  background: #ef4444;
  color: white;
  border-color: #ef4444;

  &:hover {
    background: #dc2626;
    border-color: #dc2626;
  }

  &:disabled {
    background: #9ca3af;
    border-color: #9ca3af;
  }
`;

const LayoutButton = styled(ToolbarButton)`
  min-width: 60px;
  justify-content: center;
`;

function ToolbarPanel({
  editMode,
  onToggleEditMode,
  showMiniMap,
  onToggleMiniMap,
  layoutDirection,
  onChangeLayout,
  selectedNode,
  onAddStory,
  onDeleteStory
}) {
  const layoutOptions = [
    { value: 'TB', label: '⬇️ Top-Bottom', icon: '⬇️' },
    { value: 'BT', label: '⬆️ Bottom-Top', icon: '⬆️' },
    { value: 'LR', label: '➡️ Left-Right', icon: '➡️' },
    { value: 'RL', label: '⬅️ Right-Left', icon: '⬅️' }
  ];

  return (
    <ToolbarContainer>
      <ToolbarSection>
        <SectionTitle>Mode</SectionTitle>
        <ModeToggle
          active={editMode}
          onClick={onToggleEditMode}
        >
          {editMode ? '✏️' : '👁️'}
          {editMode ? 'Edit Mode' : 'View Mode'}
        </ModeToggle>
      </ToolbarSection>

      {editMode && (
        <ToolbarSection>
          <SectionTitle>Story Management</SectionTitle>
          <ButtonGroup>
            <AddButton onClick={onAddStory}>
              ➕ Add Story
            </AddButton>
            <DeleteButton
              onClick={onDeleteStory}
              disabled={!selectedNode || selectedNode.data.type !== 'story'}
            >
              🗑️ Delete
            </DeleteButton>
          </ButtonGroup>
        </ToolbarSection>
      )}

      <ToolbarSection>
        <SectionTitle>View Options</SectionTitle>
        <ToolbarButton
          active={showMiniMap}
          onClick={onToggleMiniMap}
        >
          🗺️ Mini Map
        </ToolbarButton>
      </ToolbarSection>

      <ToolbarSection>
        <SectionTitle>Layout</SectionTitle>
        <ButtonGroup>
          {layoutOptions.map(option => (
            <LayoutButton
              key={option.value}
              active={layoutDirection === option.value}
              onClick={() => onChangeLayout(option.value)}
              title={option.label}
            >
              {option.icon}
            </LayoutButton>
          ))}
        </ButtonGroup>
      </ToolbarSection>

      {editMode && (
        <ToolbarSection>
          <SectionTitle>Actions</SectionTitle>
          <ButtonGroup>
            <ToolbarButton onClick={() => window.location.reload()}>
              🔄 Reset
            </ToolbarButton>
            <ToolbarButton onClick={() => console.log('Save action')}>
              💾 Save
            </ToolbarButton>
          </ButtonGroup>
        </ToolbarSection>
      )}
    </ToolbarContainer>
  );
}

export default ToolbarPanel; 