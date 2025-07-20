import React from 'react';
import { Handle, Position } from 'reactflow';
import styled from 'styled-components';
import { getStatusColor, getStatusIcon, getComplexityColor } from '../../utils/flowUtils';

const NodeContainer = styled.div`
  background: white;
  border: 2px solid ${props => getStatusColor(props.status)};
  border-radius: 16px;
  padding: 16px;
  width: 270px;
  min-height: 130px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  position: relative;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
    transform: translateY(-2px);
  }

  &.selected {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const MilestoneStripe = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: ${props => props.color};
  border-radius: 14px 14px 0 0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
`;

const LeftHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
`;

const StoryId = styled.div`
  color: #6b7280;
  font-size: 0.7rem;
  font-weight: 600;
  font-family: 'Monaco', 'Menlo', monospace;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  align-self: flex-start;
`;

const MilestoneBadge = styled.div`
  color: ${props => props.color};
  font-size: 0.65rem;
  font-weight: 600;
  background: ${props => props.color}20;
  padding: 2px 6px;
  border-radius: 6px;
  align-self: flex-start;
  border: 1px solid ${props => props.color}40;
  display: flex;
  align-items: center;
  gap: 3px;
`;

const StatusBadge = styled.div`
  background: ${props => getStatusColor(props.status)};
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Title = styled.div`
  font-weight: 600;
  font-size: 0.95rem;
  color: #1f2937;
  margin-bottom: 8px;
  line-height: 1.3;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const MetadataRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 6px 0;
  font-size: 0.75rem;
  color: #6b7280;
`;

const Owner = styled.div`
  color: #4b5563;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f9fafb;
  padding: 2px 6px;
  border-radius: 6px;
`;

const ComplexityBadge = styled.div`
  background: ${props => getComplexityColor(props.score)};
  color: white;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 0.6rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 2px;
`;

const TokenInfo = styled.div`
  color: #6b7280;
  font-size: 0.6rem;
  text-align: right;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
`;

const ProgressSection = styled.div`
  margin-top: 10px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  margin-top: 6px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${props => getStatusColor(props.status)};
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  font-size: 0.6rem;
  color: #6b7280;
  margin-bottom: 2px;
  display: flex;
  justify-content: space-between;
`;

const DependencyCount = styled.div`
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

function StoryNode({ data, selected }) {
  const {
    id,
    objective,
    status,
    owner_id,
    dependencies = [],
    complexity_score,
    estimated_tokens,
    actual_tokens,
    acceptance_criteria = [],
    milestone_info,
    milestone_color
  } = data;

  const progress = acceptance_criteria.length > 0 ?
    Math.round((acceptance_criteria.filter(Boolean).length / acceptance_criteria.length) * 100) :
    (status === 'done' ? 100 : status === 'in_progress' ? 50 : 0);

  const dependencyCount = dependencies.length;

  return (
    <NodeContainer
      status={status}
      className={selected ? 'selected' : ''}
    >
      {milestone_color && <MilestoneStripe color={milestone_color} />}

      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: getStatusColor(status),
          border: '2px solid white',
          width: 12,
          height: 12,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
        }}
      />

      {dependencyCount > 0 && (
        <DependencyCount>{dependencyCount}</DependencyCount>
      )}

      <Header>
        <LeftHeader>
          <StoryId>{id}</StoryId>
          {milestone_info && (
            <MilestoneBadge color={milestone_color}>
              🎯 {milestone_info.name}
            </MilestoneBadge>
          )}
        </LeftHeader>
        <StatusBadge status={status}>
          <span>{getStatusIcon(status)}</span>
          {status.replace('_', ' ')}
        </StatusBadge>
      </Header>

      <Title>{objective}</Title>

      <MetadataRow>
        <Owner>
          👤 {owner_id ? owner_id.replace('AG-', 'Agent ') : 'Unassigned'}
        </Owner>
        <ComplexityBadge score={complexity_score || 1}>
          ⚡ {complexity_score || 1}
        </ComplexityBadge>
      </MetadataRow>

      <MetadataRow>
        <TokenInfo>
          {actual_tokens ?
            `${actual_tokens} tokens used` :
            `${estimated_tokens || 0} estimated`
          }
        </TokenInfo>
      </MetadataRow>

      <ProgressSection>
        <ProgressText>
          <span>Progress</span>
          <span>{progress}%</span>
        </ProgressText>
        <ProgressBar>
          <ProgressFill progress={progress} status={status} />
        </ProgressBar>
      </ProgressSection>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: getStatusColor(status),
          border: '2px solid white',
          width: 12,
          height: 12,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
        }}
      />
    </NodeContainer>
  );
}

export default StoryNode; 