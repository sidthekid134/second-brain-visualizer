import React from 'react';
import styled from 'styled-components';
import { getStatusColor, getStatusIcon, getMilestoneColor } from '../../utils/flowUtils';

const PanelContainer = styled.div`
  padding: ${props => props.collapsed ? '12px' : '16px'};
  ${props => props.collapsed && `
    padding: 8px 12px;
  `}
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.collapsed ? '0' : '12px'};
  cursor: pointer;
  user-select: none;
`;

const PanelTitle = styled.h3`
  margin: 0;
  font-size: ${props => props.collapsed ? '0.8rem' : '0.9rem'};
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const CollapseButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const MilestonesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
`;

const MilestoneItem = styled.div`
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-left: 4px solid ${props => props.color};
  border-radius: 8px;
  padding: 10px;
  transition: all 0.2s ease;

  &:hover {
    background: #f1f5f9;
    border-color: #d1d5db;
    transform: translateX(2px);
  }
`;

const MilestoneHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
`;

const MilestoneName = styled.div`
  font-weight: 600;
  font-size: 0.8rem;
  color: #1f2937;
  flex: 1;
`;

const StatusBadge = styled.div`
  background: ${props => getStatusColor(props.status)};
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 0.6rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 3px;
`;

const MilestoneStats = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.7rem;
  color: #6b7280;
`;

const StoryCount = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
`;

const Manager = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CompactView = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  color: #6b7280;
`;

const ColorIndicator = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.color};
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
`;

function MilestonesPanel({ milestones = [], collapsed, onToggleCollapsed }) {
    if (collapsed) {
        return (
            <PanelContainer collapsed>
                <PanelHeader collapsed onClick={onToggleCollapsed}>
                    <PanelTitle collapsed>
                        🎯 {milestones.length} Milestones
                    </PanelTitle>
                    <CollapseButton>
                        ⬇️
                    </CollapseButton>
                </PanelHeader>
                <CompactView>
                    {milestones.slice(0, 3).map((milestone, index) => (
                        <ColorIndicator
                            key={milestone.id}
                            color={getMilestoneColor(milestone.status, index)}
                            title={milestone.name}
                        />
                    ))}
                    {milestones.length > 3 && (
                        <span style={{ fontSize: '0.6rem' }}>+{milestones.length - 3}</span>
                    )}
                </CompactView>
            </PanelContainer>
        );
    }

    return (
        <PanelContainer>
            <PanelHeader onClick={onToggleCollapsed}>
                <PanelTitle>
                    🎯 Milestones ({milestones.length})
                </PanelTitle>
                <CollapseButton>
                    ⬆️
                </CollapseButton>
            </PanelHeader>

            <MilestonesList>
                {milestones.map((milestone, index) => (
                    <MilestoneItem
                        key={milestone.id}
                        color={getMilestoneColor(milestone.status, index)}
                    >
                        <MilestoneHeader>
                            <MilestoneName>{milestone.name}</MilestoneName>
                            <StatusBadge status={milestone.status}>
                                {getStatusIcon(milestone.status)}
                                {milestone.status}
                            </StatusBadge>
                        </MilestoneHeader>

                        <MilestoneStats>
                            <StoryCount>
                                📚 {milestone.stories?.length || 0} stories
                            </StoryCount>
                            {milestone.manager_id && (
                                <Manager title={milestone.manager_id}>
                                    👨‍💼 {milestone.manager_id.replace('manager-', '').replace(/([A-Z])/g, ' $1').trim()}
                                </Manager>
                            )}
                        </MilestoneStats>
                    </MilestoneItem>
                ))}

                {milestones.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        color: '#9ca3af',
                        fontSize: '0.8rem',
                        padding: '20px 0'
                    }}>
                        No milestones defined
                    </div>
                )}
            </MilestonesList>
        </PanelContainer>
    );
}

export default MilestonesPanel; 