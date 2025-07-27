import React from 'react';
import styled from 'styled-components';
import { Handle, Position } from 'reactflow';

const NodeContainer = styled.div`
  background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%);
  border: 3px solid ${props => props.$hasChanges ? '#dc2626' : '#f59e0b'};
  border-radius: 16px;
  padding: 20px;
  min-width: 300px;
  max-width: 350px;
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.2);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
  transition: all 0.3s ease;

  ${props => props.$hasChanges && `
    box-shadow: 0 8px 32px rgba(220, 38, 38, 0.4);
  `}

  &:hover {
    box-shadow: 0 12px 32px rgba(245, 158, 11, 0.3);
    transform: translateY(-2px);
  }

  &.selected {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
`;

const CheckpointIcon = styled.div`
  font-size: 1.5rem;
  margin-right: 8px;
`;

const Title = styled.div`
  font-weight: 700;
  font-size: 1.1rem;
  color: #92400e;
  margin-bottom: 8px;
  line-height: 1.3;
`;

const Description = styled.div`
  font-size: 0.85rem;
  color: #a16207;
  margin-bottom: 16px;
  line-height: 1.4;
  font-style: italic;
`;

const StoryCount = styled.div`
  background: rgba(146, 64, 14, 0.1);
  color: #92400e;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
`;

const DependencyCount = styled.div`
  background: rgba(139, 92, 246, 0.1);
  color: #7c3aed;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const MetadataRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
`;

const ChangeIndicator = styled.div`
  position: absolute;
  top: -8px;
  right: ${props => props.$hasDependencyIndicator ? '20px' : '-8px'};
  width: 24px;
  height: 24px;
  background: #dc2626;
  border: 3px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: white;
  z-index: 10;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
`;

const DependencyReloadIndicator = styled.div`
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  background: #3b82f6;
  border: 3px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: bold;
  color: white;
  z-index: 10;
  line-height: 1;
  text-align: center;
`;

function CheckpointNode({ data, selected }) {
  const {
    id,
    name,
    description,
    story_ids = [],
    dependencies = [],
    layoutDirection = 'TB', // Default to top-bottom if not provided
    hasChanges = false,
    dependencyAffected = false,
    directlyEdited = false
  } = data;

  // Determine handle position based on layout direction
  const isHorizontalLayout = layoutDirection === 'LR' || layoutDirection === 'RL';
  const sourcePosition = isHorizontalLayout ? Position.Right : Position.Bottom;
  const targetPosition = isHorizontalLayout ? Position.Left : Position.Top;

  const storyCount = story_ids.length;
  const dependencyCount = dependencies.length;

  return (
    <NodeContainer className={selected ? 'selected' : ''} $hasChanges={hasChanges}>
      {hasChanges && <ChangeIndicator $hasDependencyIndicator={dependencyAffected}>✏️</ChangeIndicator>}
      {dependencyAffected && <DependencyReloadIndicator>⟳</DependencyReloadIndicator>}
      {dependencies.length > 0 && (
        <Handle
          type="target"
          position={targetPosition}
          id={`${id}-target`}
          style={{
            background: '#8b5cf6',
            border: '3px solid white',
            width: 16,
            height: 16,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}
        />
      )}

      <Header>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <CheckpointIcon>🏁</CheckpointIcon>
          <div>
            <Title>{name}</Title>
          </div>
        </div>
      </Header>

      {description && (
        <Description>{description}</Description>
      )}

      <StoryCount>
        📚 {storyCount} {storyCount === 1 ? 'story' : 'stories'}
      </StoryCount>

      {dependencyCount > 0 && (
        <MetadataRow>
          <DependencyCount>
            🔗 {dependencyCount} {dependencyCount === 1 ? 'dependency' : 'dependencies'}
          </DependencyCount>
        </MetadataRow>
      )}

      <Handle
        type="source"
        position={sourcePosition}
        id={`${id}-source`}
        style={{
          background: '#fbbf24',
          border: '3px solid white',
          width: 16,
          height: 16,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
        }}
      />
    </NodeContainer>
  );
}

export default CheckpointNode; 