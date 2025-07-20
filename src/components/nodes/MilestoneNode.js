import React from 'react';
import { Handle, Position } from 'reactflow';
import styled from 'styled-components';
import { getStatusColor, getStatusIcon } from '../../utils/flowUtils';
import { usePlan } from '../../context/PlanContext';

const NodeContainer = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 3px solid ${props => props.status === 'neutral' ? '#e5e7eb' : getStatusColor(props.status)};
  border-radius: 16px;
  padding: 16px;
  width: 240px;
  min-height: 80px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  position: relative;
  transition: all 0.2s ease;
  color: white;

  &:hover {
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.3);
    transform: translateY(-3px);
  }

  &.selected {
    border-color: #fbbf24;
    box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.3);
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const MilestoneIcon = styled.div`
  font-size: 1.2rem;
  opacity: 0.9;
`;

const StatusBadge = styled.div`
  background: ${props => getStatusColor(props.status)};
  color: white;
  padding: 4px 10px;
  border-radius: 14px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const Title = styled.div`
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: 8px;
  line-height: 1.2;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`;

const StoryCount = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ManagerInfo = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.7rem;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

function MilestoneNode({ data, selected, isExecutionView = false }) {
  const shouldShowStatus = isExecutionView;

  const {
    id,
    name,
    status,
    stories = [],
    manager_id,
    storyCount
  } = data;

  const actualStoryCount = storyCount || stories.length;

  return (
    <NodeContainer
      status={shouldShowStatus ? status : 'neutral'}
      className={selected ? 'selected' : ''}
    >
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: '#fbbf24',
          border: '3px solid white',
          width: 14,
          height: 14
        }}
      />

      <Header>
        <MilestoneIcon>🎯</MilestoneIcon>
        {shouldShowStatus && (
          <StatusBadge status={status}>
            <span>{getStatusIcon(status)}</span>
            {status.replace('_', ' ')}
          </StatusBadge>
        )}
      </Header>

      <Title>{name}</Title>

      <StoryCount>
        📚 {actualStoryCount} {actualStoryCount === 1 ? 'story' : 'stories'}
      </StoryCount>

      {manager_id && (
        <ManagerInfo>
          👨‍💼 {manager_id.replace('manager-', '').replace(/([A-Z])/g, ' $1').trim()}
        </ManagerInfo>
      )}
    </NodeContainer>
  );
}

export default MilestoneNode; 