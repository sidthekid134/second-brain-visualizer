import React, { useState } from 'react';
import styled from 'styled-components';
import { getStatusColor, getStatusIcon, getMilestoneColor } from '../../utils/flowUtils';
import { usePlan } from '../../context/PlanContext';

const PanelContainer = styled.div`
  padding: ${props => props.$collapsed ? '12px' : '16px'};
  ${props => props.$collapsed && `
    padding: 8px 12px;
  `}
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.$collapsed ? '0' : '12px'};
  cursor: pointer;
  user-select: none;
`;

const PanelTitle = styled.h3`
  margin: 0;
  font-size: ${props => props.$collapsed ? '0.8rem' : '0.9rem'};
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ActionButton = styled.button`
  background: ${props => props.$primary ? '#3b82f6' : 'none'};
  border: ${props => props.$primary ? '1px solid #3b82f6' : '1px solid #d1d5db'};
  color: ${props => props.$primary ? 'white' : '#6b7280'};
  cursor: pointer;
  font-size: 0.7rem;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 3px;

  &:hover {
    background: ${props => props.$primary ? '#2563eb' : '#f3f4f6'};
    color: ${props => props.$primary ? 'white' : '#374151'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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
  border-left: 4px solid ${props => props.$color};
  border-radius: 8px;
  padding: 10px;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: #f1f5f9;
    border-color: #d1d5db;
    transform: translateX(2px);
  }

  ${props => props.$editing && `
    border: 1px solid #3b82f6;
    background: #eff6ff;
  `}
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

const MilestoneActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
`;

const StatusBadge = styled.div`
  background: ${props => getStatusColor(props.$status)};
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 0.6rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 3px;
`;

const StatusSelect = styled.select`
  background: ${props => getStatusColor(props.$value)};
  color: white;
  border: none;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 0.6rem;
  font-weight: 600;
  cursor: pointer;

  option {
    background: white;
    color: #1f2937;
  }
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
  background: ${props => props.$color};
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
`;

const EditForm = styled.div`
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FormInput = styled.input`
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.8rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const FormActions = styled.div`
  display: flex;
  gap: 4px;
  justify-content: flex-end;
`;

const AddMilestoneForm = styled.div`
  background: #f0f9ff;
  border: 1px solid #3b82f6;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
`;

const AddMilestoneTitle = styled.div`
  font-weight: 600;
  font-size: 0.8rem;
  color: #1f2937;
  margin-bottom: 8px;
`;

function MilestonesPanel({ milestones = [], collapsed, onToggleCollapsed, isExecutionView = false }) {
  const { dispatch, editMode } = usePlan();
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [addForm, setAddForm] = useState({ name: '', status: 'planned' });

  const shouldShowStatus = isExecutionView;
  const canEdit = editMode;

  const handleStartEdit = (milestone) => {
    setEditingId(milestone.id);
    setEditForm({
      name: milestone.name,
      status: milestone.status,
      manager_id: milestone.manager_id || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = () => {
    if (!editingId || !editForm.name.trim()) return;

    dispatch({
      type: 'UPDATE_MILESTONE',
      payload: {
        id: editingId,
        updates: {
          name: editForm.name.trim(),
          status: editForm.status,
          manager_id: editForm.manager_id || null
        }
      }
    });

    setEditingId(null);
    setEditForm({});
  };

  const handleDeleteMilestone = (milestoneId) => {
    if (window.confirm('Are you sure you want to delete this milestone? Stories assigned to it will be unassigned.')) {
      dispatch({
        type: 'DELETE_MILESTONE',
        payload: milestoneId
      });
    }
  };

  const handleAddMilestone = () => {
    if (!addForm.name.trim()) return;

    const newMilestone = {
      id: `MS-${Date.now().toString(36)}`,
      name: addForm.name.trim(),
      status: addForm.status,
      stories: [],
      manager_id: null
    };

    dispatch({
      type: 'ADD_MILESTONE',
      payload: newMilestone
    });

    setAddForm({ name: '', status: 'planned' });
    setShowAddForm(false);
  };

  const handleCancelAdd = () => {
    setAddForm({ name: '', status: 'planned' });
    setShowAddForm(false);
  };

  if (collapsed) {
    return (
      <PanelContainer $collapsed>
        <PanelHeader $collapsed onClick={onToggleCollapsed}>
          <PanelTitle $collapsed>
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
              $color={getMilestoneColor(milestone.status, index)}
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
      <PanelHeader onClick={!canEdit ? onToggleCollapsed : undefined}>
        <PanelTitle>
          🎯 Milestones ({milestones.length})
        </PanelTitle>
        <HeaderActions>
          {canEdit && (
            <ActionButton
              $primary
              onClick={(e) => {
                e.stopPropagation();
                setShowAddForm(!showAddForm);
              }}
              title="Add milestone"
            >
              ➕ Add
            </ActionButton>
          )}
          <CollapseButton onClick={onToggleCollapsed}>
            ⬆️
          </CollapseButton>
        </HeaderActions>
      </PanelHeader>

      {showAddForm && (
        <AddMilestoneForm>
          <AddMilestoneTitle>Add New Milestone</AddMilestoneTitle>
          <EditForm>
            <FormInput
              type="text"
              placeholder="Milestone name"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              autoFocus
            />
            <StatusSelect
              $value={addForm.status}
              onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
            >
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </StatusSelect>
            <FormActions>
              <ActionButton onClick={handleCancelAdd}>
                Cancel
              </ActionButton>
              <ActionButton
                $primary
                onClick={handleAddMilestone}
                disabled={!addForm.name.trim()}
              >
                Add
              </ActionButton>
            </FormActions>
          </EditForm>
        </AddMilestoneForm>
      )}

      <MilestonesList>
        {milestones.map((milestone, index) => (
          <MilestoneItem
            key={milestone.id}
            $color={getMilestoneColor(milestone.status, index)}
            $editing={editingId === milestone.id}
          >
            <MilestoneHeader>
              {editingId === milestone.id ? (
                <FormInput
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={{ flex: 1, marginRight: 8 }}
                />
              ) : (
                <MilestoneName>{milestone.name}</MilestoneName>
              )}

              {editingId === milestone.id ? (
                <StatusSelect
                  $value={editForm.status || milestone.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </StatusSelect>
              ) : shouldShowStatus && (
                <StatusBadge $status={milestone.status}>
                  {getStatusIcon(milestone.status)}
                  {milestone.status}
                </StatusBadge>
              )}

              {canEdit && (
                <MilestoneActions>
                  {editingId === milestone.id ? (
                    <>
                      <ActionButton onClick={handleCancelEdit}>
                        ✕
                      </ActionButton>
                      <ActionButton
                        $primary
                        onClick={handleSaveEdit}
                        disabled={!editForm.name?.trim()}
                      >
                        ✓
                      </ActionButton>
                    </>
                  ) : (
                    <>
                      <ActionButton
                        onClick={() => handleStartEdit(milestone)}
                        title="Edit milestone"
                      >
                        ✏️
                      </ActionButton>
                      <ActionButton
                        onClick={() => handleDeleteMilestone(milestone.id)}
                        title="Delete milestone"
                        style={{ color: '#ef4444' }}
                      >
                        🗑️
                      </ActionButton>
                    </>
                  )}
                </MilestoneActions>
              )}
            </MilestoneHeader>

            {editingId === milestone.id && (
              <EditForm>
                <FormInput
                  type="text"
                  placeholder="Manager ID (optional)"
                  value={editForm.manager_id || ''}
                  onChange={(e) => setEditForm({ ...editForm, manager_id: e.target.value })}
                />
              </EditForm>
            )}

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
            {canEdit ? 'No milestones defined. Click "Add" to create one.' : 'No milestones defined'}
          </div>
        )}
      </MilestonesList>
    </PanelContainer>
  );
}

export default MilestonesPanel; 