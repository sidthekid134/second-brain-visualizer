import React, { useEffect } from 'react';
import styled from 'styled-components';

const ContextMenuContainer = styled.div`
  position: fixed;
  z-index: 1000;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 180px;
  backdrop-filter: blur(10px);
  display: ${props => props.$visible ? 'block' : 'none'};
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
`;

const MenuItem = styled.div`
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background-color: #f3f4f6;
    color: #1f2937;
  }

  &.danger {
    color: #dc2626;
    
    &:hover {
      background-color: #fef2f2;
      color: #dc2626;
    }
  }

  &.disabled {
    color: #9ca3af;
    cursor: not-allowed;
    
    &:hover {
      background-color: transparent;
    }
  }
`;

const MenuDivider = styled.div`
  height: 1px;
  background: #e5e7eb;
  margin: 4px 0;
`;

function ContextMenu({
    visible,
    x,
    y,
    contextType, // 'canvas' or 'node'
    nodeData,
    onCreateStory,
    onCreateIntent,
    onEditNode,
    onDeleteNode,
    onClose
}) {
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (visible) {
                onClose();
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape' && visible) {
                onClose();
            }
        };

        if (visible) {
            document.addEventListener('click', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [visible, onClose]);

    const handleMenuClick = (e) => {
        e.stopPropagation();
    };

    const handleCreateStory = () => {
        if (onCreateStory) {
            onCreateStory();
            onClose();
        }
    };

    const handleCreateIntent = () => {
        if (onCreateIntent) {
            onCreateIntent();
            onClose();
        }
    };

    const handleEditNode = () => {
        onEditNode(nodeData);
        onClose();
    };

    const handleDeleteNode = () => {
        onDeleteNode(nodeData);
        onClose();
    };

    return (
        <ContextMenuContainer
            $visible={visible}
            $x={x}
            $y={y}
            onClick={handleMenuClick}
        >
            {contextType === 'canvas' && (
                <>
                    {onCreateIntent && (
                        <MenuItem onClick={handleCreateIntent}>
                            <span>🎯</span>
                            Add Intent
                        </MenuItem>
                    )}
                    {onCreateStory && (
                        <MenuItem onClick={handleCreateStory}>
                            <span>➕</span>
                            Create New Story
                        </MenuItem>
                    )}
                </>
            )}

            {contextType === 'node' && nodeData && (
                <>
                    <MenuItem onClick={handleEditNode}>
                        <span>✏️</span>
                        Edit Details
                    </MenuItem>
                    {/* Only show delete option for deletable node types */}
                    {(nodeData.type === 'story' || nodeData.type === 'checkpoint' || nodeData.type === 'milestone' || nodeData.type === 'intent') && (
                        <>
                            <MenuDivider />
                            <MenuItem onClick={handleDeleteNode} className="danger">
                                <span>🗑️</span>
                                Delete {nodeData.type === 'story' ? 'Story' :
                                    nodeData.type === 'checkpoint' || nodeData.type === 'milestone' ? 'Checkpoint' :
                                        nodeData.type === 'intent' ? 'Intent' : 'Node'}
                            </MenuItem>
                        </>
                    )}
                </>
            )}
        </ContextMenuContainer>
    );
}

export default ContextMenu; 
