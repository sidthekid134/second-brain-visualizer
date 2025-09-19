import React from 'react';
import styled from 'styled-components';
import { Handle, Position } from 'reactflow';

const IntentContainer = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 2px solid ${props => {
    if (props.$hasChanges) return '#f59e0b';
    if (props.$executionView && props.$executionStatus) {
      switch (props.$executionStatus) {
        case 'in_progress': return '#3b82f6';
        case 'done': return '#10b981';
        case 'failed': return '#ef4444';
        case 'blocked': return '#f59e0b';
        default: return '#8b5cf6';
      }
    }
    return '#8b5cf6';
  }};
  border-radius: 12px;
  padding: 16px;
  min-width: 280px;
  max-width: 320px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  color: white;
  position: relative;
  transition: all 0.2s ease;
  cursor: pointer;

  ${props => props.$hasChanges && `
    box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
  `}

  ${props => props.$executionView && props.$executionStatus && `
    box-shadow: 0 4px 16px ${() => {
      switch (props.$executionStatus) {
        case 'in_progress': return 'rgba(59, 130, 246, 0.4)';
        case 'done': return 'rgba(16, 185, 129, 0.4)';
        case 'failed': return 'rgba(239, 68, 68, 0.4)';
        case 'blocked': return 'rgba(245, 158, 11, 0.4)';
        default: return 'rgba(139, 92, 246, 0.4)';
      }
    }};
  `}

  ${props => props.$selected && `
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.4);
    transform: scale(1.02);
  `}

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const IntentTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Description = styled.p`
  margin: 0 0 12px 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
`;

const IntentBadge = styled.div`
  position: absolute;
  top: -8px;
  left: 12px;
  background: #f59e0b;
  color: white;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const ExploreButton = styled.button`
  width: 100%;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  padding: 8px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 8px;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ChangeIndicator = styled.div`
  position: absolute;
  top: -8px;
  right: ${props => props.$hasDependencyIndicator ? '16px' : '-8px'};
  width: 20px;
  height: 20px;
  background: #f59e0b;
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
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
  width: 20px;
  height: 20px;
  background: #3b82f6;
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
  color: white;
  z-index: 10;
  line-height: 1;
  text-align: center;
`;

const NewNodeIndicator = styled.div`
  position: absolute;
  top: -8px;
  left: ${props => props.$hasExecutionIndicator ? '16px' : '-8px'};
  width: 20px;
  height: 20px;
  background: #10b981;
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  color: white;
  z-index: 10;
  animation: bounce 1s infinite;

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-2px); }
  }
`;

const DeletedNodeOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(239, 68, 68, 0.9);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  font-size: 48px;
  color: white;
  backdrop-filter: blur(2px);
`;

const ExecutionStatusIndicator = styled.div`
  position: absolute;
  top: -8px;
  left: -8px;
  width: 20px;
  height: 20px;
  background: ${props => {
    switch (props.$status) {
      case 'in_progress': return '#3b82f6';
      case 'done': return '#10b981';
      case 'failed': return '#ef4444';
      case 'blocked': return '#f59e0b';
      default: return '#94a3b8';
    }
  }};
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  color: white;
  z-index: 10;
  ${props => props.$status === 'in_progress' && `
    animation: pulse 2s infinite;
  `}
`;

function IntentNode({ data, selected, onExplore, onDoubleClick }) {
  const {
    id,
    name,
    description,
    story_count = 0,
    stories = [], // Stories array from new schema
    hasChanges = false,
    dependencyAffected = false,
    directlyEdited = false,
    // New visual state indicators
    isNew = false,
    isDeleted = false,
    nodeState = {},
    executionView = false,
    executionStatus = null,
    execution = null
  } = data;

  // Calculate actual story count from stories array
  const actualStoryCount = stories ? stories.length : story_count;

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (onDoubleClick) {
      onDoubleClick(id);
    }
  };

  // Get execution status icon
  const getExecutionIcon = (status) => {
    switch (status) {
      case 'in_progress': return '⚡';
      case 'done': return '✅';
      case 'failed': return '❌';
      case 'blocked': return '🚫';
      default: return '📋';
    }
  };

  return (
    <IntentContainer
      $selected={selected}
      $hasStories={actualStoryCount > 0}
      $hasChanges={hasChanges}
      $executionView={executionView}
      $executionStatus={executionStatus}
      onDoubleClick={handleDoubleClick}
      title={actualStoryCount > 0 ? "Double-click to explore stories" : "Double-click to add the first story"}
    >
      <IntentBadge>Intent</IntentBadge>

      {/* Change indicators */}
      {hasChanges && <ChangeIndicator $hasDependencyIndicator={dependencyAffected}>✏️</ChangeIndicator>}
      {dependencyAffected && <DependencyReloadIndicator>⟳</DependencyReloadIndicator>}

      {/* New node indicator */}
      {isNew && <NewNodeIndicator $hasExecutionIndicator={executionView && executionStatus}>✨</NewNodeIndicator>}

      {/* Execution status */}
      {executionView && executionStatus && (
        <ExecutionStatusIndicator $status={executionStatus}>
          {getExecutionIcon(executionStatus)}
        </ExecutionStatusIndicator>
      )}

      {/* Deleted node overlay - shows over everything */}
      {isDeleted && <DeletedNodeOverlay>🗑️</DeletedNodeOverlay>}

      <Handle
        type="target"
        position={Position.Top}
        id={`${id}-target`}
        style={{
          background: '#8b5cf6',
          border: '2px solid white',
          width: 12,
          height: 12
        }}
      />

      <Header>
        <IntentTitle>{name}</IntentTitle>
      </Header>

      <Description>{description}</Description>

      <ExploreButton
        onClick={() => onExplore && onExplore(id)}
        disabled={actualStoryCount === 0}
        style={{
          opacity: actualStoryCount === 0 ? 0.5 : 1,
          cursor: actualStoryCount === 0 ? 'not-allowed' : 'pointer'
        }}
      >
        📖 Explore Stories ({actualStoryCount})
        <span>→</span>
      </ExploreButton>

      <Handle
        type="source"
        position={Position.Bottom}
        id={`${id}-source`}
        style={{
          background: '#8b5cf6',
          border: '2px solid white',
          width: 12,
          height: 12
        }}
      />
    </IntentContainer>
  );
}

export default IntentNode; 
