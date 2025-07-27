import React, { useState, useEffect } from 'react';
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
  background: ${props => props.$active ? '#3b82f6' : 'white'};
  color: ${props => props.$active ? 'white' : '#374151'};
  border: 1px solid ${props => props.$active ? '#3b82f6' : '#d1d5db'};
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
    background: ${props => props.$active ? '#2563eb' : '#f9fafb'};
    border-color: ${props => props.$active ? '#2563eb' : '#9ca3af'};
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
  background: ${props => props.$active ? '#10b981' : '#fef3c7'};
  color: ${props => props.$active ? 'white' : '#92400e'};
  border-color: ${props => props.$active ? '#10b981' : '#fbbf24'};

  &:hover {
    background: ${props => props.$active ? '#059669' : '#fef3c7'};
    border-color: ${props => props.$active ? '#059669' : '#f59e0b'};
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

const StorageInfo = styled.div`
  font-size: 0.7rem;
  color: #6b7280;
  padding: 4px 8px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 6px;
  line-height: 1.2;
`;

const ResetButton = styled(ToolbarButton)`
  background: #f59e0b;
  color: white;
  border-color: #f59e0b;

  &:hover {
    background: #d97706;
    border-color: #d97706;
  }
`;

const LoadButton = styled(ToolbarButton)`
  background: #8b5cf6;
  color: white;
  border-color: #8b5cf6;

  &:hover {
    background: #7c3aed;
    border-color: #7c3aed;
  }
`;

const PushButton = styled(ToolbarButton)`
  background: #059669;
  color: white;
  border-color: #059669;

  &:hover {
    background: #047857;
    border-color: #047857;
  }
`;

const DataSourceIndicator = styled.div`
  background: ${props => {
    switch (props.$source) {
      case 'session_storage': return 'rgba(245, 158, 11, 0.1)';
      case 'work_file': return 'rgba(139, 92, 246, 0.1)';
      case 'default': return 'rgba(107, 114, 128, 0.1)';
      default: return 'rgba(107, 114, 128, 0.1)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.$source) {
      case 'session_storage': return '#f59e0b';
      case 'work_file': return '#8b5cf6';
      case 'default': return '#6b7280';
      default: return '#6b7280';
    }
  }};
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 0.75rem;
  line-height: 1.2;
  color: #374151;
`;

const DataSourceIcon = styled.span`
  font-size: 0.9rem;
  margin-right: 6px;
  color: ${props => {
    switch (props.$source) {
      case 'session_storage': return '#f59e0b';
      case 'work_file': return '#8b5cf6';
      case 'default': return '#6b7280';
      default: return '#6b7280';
    }
  }};
`;

const DataSourceText = styled.div`
  font-weight: 500;
  margin-bottom: 2px;
`;

const DataSourceTime = styled.div`
  font-size: 0.65rem;
  color: #6b7280;
  opacity: 0.8;
`;

function ToolbarPanel({
  executionView,
  onToggleExecutionView,
  showMiniMap,
  onToggleMiniMap,
  layoutDirection,
  onChangeLayout,
  selectedNode,
  onAddStory,
  // Undo/Redo props
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  undoHistory,
  // Reset and storage props
  onReset,
  onClearStorage,
  getStorageInfo,

  // Data source props
  dataSource,
  dataTimestamp,
  sessionTimestamp
}) {
  const layoutOptions = [
    { value: 'TB', label: '⬇️ Top-Bottom', icon: '⬇️' },
    { value: 'LR', label: '➡️ Left-Right', icon: '➡️' }
  ];

  const [storageInfo, setStorageInfo] = useState(null);

  // Update storage info periodically
  useEffect(() => {
    const updateStorageInfo = () => {
      if (getStorageInfo) {
        setStorageInfo(getStorageInfo());
      }
    };

    // Initial update
    updateStorageInfo();

    // Update every 2 seconds
    const interval = setInterval(updateStorageInfo, 2000);

    return () => clearInterval(interval);
  }, [getStorageInfo, undoHistory.length]); // Re-run when undo history changes

  // Format data source information
  const getDataSourceInfo = () => {
    if (!dataSource || dataSource === 'loading') return null;

    const getIcon = (source) => {
      switch (source) {
        case 'session_storage': return '🔄';
        case 'work_file': return '💾';
        case 'default': return '📄';
        default: return '📄';
      }
    };

    const getLabel = (source) => {
      switch (source) {
        case 'session_storage': return 'Session Storage';
        case 'work_file': return 'Work File';
        case 'default': return 'Original File';
        default: return 'Unknown';
      }
    };

    const formatTime = (timestamp) => {
      if (!timestamp) return 'Unknown';
      const date = new Date(typeof timestamp === 'number' ? timestamp : timestamp);
      return date.toLocaleString();
    };

    return {
      source: dataSource,
      icon: getIcon(dataSource),
      label: getLabel(dataSource),
      timestamp: dataTimestamp,
      formattedTime: formatTime(dataTimestamp),
      hasSessionChanges: sessionTimestamp && sessionTimestamp > dataTimestamp
    };
  };

  const dataSourceInfo = getDataSourceInfo();

  const handleReset = async () => {
    const confirmReset = window.confirm(
      'This will reset to the original file data and clear all saved changes and undo history. Are you sure?'
    );
    if (confirmReset && onReset) {
      await onReset();
      // Update storage info after reset
      setTimeout(() => {
        if (getStorageInfo) {
          setStorageInfo(getStorageInfo());
        }
      }, 100);
    }
  };



  return (
    <ToolbarContainer>
      <ToolbarSection>
        <SectionTitle>Execution Status</SectionTitle>
        <ToolbarButton
          $active={executionView}
          onClick={onToggleExecutionView}
        >
          📊 Show Execution
        </ToolbarButton>
      </ToolbarSection>

      <ToolbarSection>
        <SectionTitle>Undo/Redo ({undoHistory.length})</SectionTitle>
        <ButtonGroup>
          <ToolbarButton
            onClick={onUndo}
            disabled={!canUndo}
            title={`Undo (Ctrl+Z) - ${undoHistory.length > 0 ?
              undoHistory[undoHistory.length - 1].operationType + ' ' +
              undoHistory[undoHistory.length - 1].entityType : 'No operations'}`}
          >
            ↶ Undo
          </ToolbarButton>
          <ToolbarButton
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            ↷ Redo
          </ToolbarButton>
        </ButtonGroup>
      </ToolbarSection>

      <ToolbarSection>
        <SectionTitle>Story Management</SectionTitle>
        <ButtonGroup>
          <AddButton onClick={onAddStory}>
            ➕ Add Story
          </AddButton>
        </ButtonGroup>
      </ToolbarSection>

      <ToolbarSection>
        <SectionTitle>View Options</SectionTitle>
        <ToolbarButton
          $active={showMiniMap}
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
              $active={layoutDirection === option.value}
              onClick={() => onChangeLayout(option.value)}
              title={option.label}
            >
              {option.icon}
            </LayoutButton>
          ))}
        </ButtonGroup>
      </ToolbarSection>

      <ToolbarSection>
        <SectionTitle>Data Source</SectionTitle>
        {dataSourceInfo && (
          <DataSourceIndicator $source={dataSourceInfo.source}>
            <DataSourceText>
              <DataSourceIcon $source={dataSourceInfo.source}>
                {dataSourceInfo.icon}
              </DataSourceIcon>
              Loaded from {dataSourceInfo.label}
            </DataSourceText>
            <DataSourceTime>
              {dataSourceInfo.formattedTime}
              {dataSourceInfo.hasSessionChanges && (
                <span style={{ color: '#f59e0b', marginLeft: '4px' }}>
                  • Unsaved changes in session
                </span>
              )}
            </DataSourceTime>
          </DataSourceIndicator>
        )}
      </ToolbarSection>

      <ToolbarSection>
        <SectionTitle>Actions & Storage</SectionTitle>
        {storageInfo && (
          <StorageInfo>
            📊 Total Storage: {storageInfo.formattedTotal}
            <br />
            {storageInfo.hasWorkBackup && (
              <>
                💾 Last Pushed: {storageInfo.formattedWorkBackup}<br />
                📍 Location: {storageInfo.saveLocation}<br />
                🕒 When: {storageInfo.lastSaved}<br />
              </>
            )}
            {!storageInfo.hasWorkBackup && (
              <>🚫 No file pushed yet<br /></>
            )}
            {storageInfo.hasOriginalFile && (
              <>📄 Original: {storageInfo.formattedOriginalFile}<br /></>
            )}
            ↶ Undo History: {storageInfo.formattedUndoHistory}
            <br />
            {storageInfo.fileSystemSupported ? '✅' : '❌'} File System API
          </StorageInfo>
        )}
        <ButtonGroup>
          <ResetButton onClick={handleReset}>
            🔄 Reset to File
          </ResetButton>
          <ResetButton onClick={onClearStorage}>
            🧹 Clear Storage
          </ResetButton>
        </ButtonGroup>
      </ToolbarSection>
    </ToolbarContainer>
  );
}

export default ToolbarPanel; 