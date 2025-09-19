import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getGitHubConfig, setGitHubConfig, clearGitHubConfig, isValidGitHubUrl, isValidBranchName } from '../../utils/githubConfig';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  animation: modalSlideIn 0.3s ease-out;

  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

const ModalHeader = styled.div`
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 6px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const ModalBody = styled.div`
  padding: 2rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  background-color: #fafbfc;

  &:focus {
    outline: none;
    border-color: #3498db;
    background-color: white;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }

  &::placeholder {
    color: #95a5a6;
  }
`;

const Description = styled.p`
  font-size: 0.8rem;
  color: #7f8c8d;
  margin: 0.5rem 0 0 0;
  line-height: 1.4;
`;

const ModalFooter = styled.div`
  background-color: #f8f9fa;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  border-top: 1px solid #e1e8ed;
`;

const FooterLeft = styled.div`
  display: flex;
  gap: 1rem;
`;

const FooterRight = styled.div`
  display: flex;
  gap: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  min-width: 80px;

  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background-color: #3498db;
          color: white;
          
          &:hover:not(:disabled) {
            background-color: #2980b9;
            transform: translateY(-1px);
          }
        `;
      case 'secondary':
        return `
          background-color: #95a5a6;
          color: white;
          
          &:hover:not(:disabled) {
            background-color: #7f8c8d;
          }
        `;
      case 'danger':
        return `
          background-color: #e74c3c;
          color: white;
          
          &:hover:not(:disabled) {
            background-color: #c0392b;
            transform: translateY(-1px);
          }
        `;
      default:
        return `
          background-color: #ecf0f1;
          color: #2c3e50;
          
          &:hover:not(:disabled) {
            background-color: #d5dbdb;
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-top: 1rem;
  
  ${props => {
    if (props.$saved) {
      return `
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      `;
    }
    return `
      background-color: #fff3cd;
      color: #856404;
      border: 1px solid #ffeaa7;
    `;
  }}
`;

function GitHubConfigModal({ isOpen, onClose }) {
  const [config, setConfig] = useState({
    repositoryUrl: '',
    defaultBranch: 'main'
  });
  const [saved, setSaved] = useState(false);

  // Load saved configuration on mount
  useEffect(() => {
    const savedConfig = getGitHubConfig();
    setConfig(savedConfig);
  }, []);

  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setSaved(false);
  };

  const handleSave = () => {
    const success = setGitHubConfig(config);
    if (success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000); // Hide saved indicator after 3 seconds
      console.log('GitHub configuration saved:', config);
    }
  };

  const handleClear = () => {
    const confirmClear = window.confirm(
      'Are you sure you want to clear your GitHub configuration? This will remove all saved repository settings.'
    );

    if (confirmClear) {
      // Reset to default values
      const defaultConfig = { repositoryUrl: '', defaultBranch: 'main' };
      setConfig(defaultConfig);

      // Clear the config from localStorage
      const success = clearGitHubConfig();
      if (success) {
        setSaved(false);
        console.log('GitHub configuration cleared');
      }
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  const canSave = isValidGitHubUrl(config.repositoryUrl) && isValidBranchName(config.defaultBranch);

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={handleClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <ModalHeader>
          <ModalTitle>
            <span>🐙</span>
            GitHub Configuration
          </ModalTitle>
          <CloseButton onClick={handleClose}>×</CloseButton>
        </ModalHeader>

        <ModalBody>
          <FormGroup>
            <Label htmlFor="repository-url">Repository URL</Label>
            <Input
              id="repository-url"
              type="text"
              placeholder="https://github.com/username/repository"
              value={config.repositoryUrl}
              onChange={(e) => handleInputChange('repositoryUrl', e.target.value)}
              style={{
                borderColor: config.repositoryUrl && !isValidGitHubUrl(config.repositoryUrl) ? '#e74c3c' : undefined
              }}
            />
            <Description>
              The GitHub repository URL where your project code is hosted.
              Leave empty if not using GitHub integration.
            </Description>
            {config.repositoryUrl && !isValidGitHubUrl(config.repositoryUrl) && (
              <Description style={{ color: '#e74c3c' }}>
                Please enter a valid GitHub repository URL
              </Description>
            )}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="default-branch">Default Branch</Label>
            <Input
              id="default-branch"
              type="text"
              placeholder="main"
              value={config.defaultBranch}
              onChange={(e) => handleInputChange('defaultBranch', e.target.value)}
              style={{
                borderColor: !isValidBranchName(config.defaultBranch) ? '#e74c3c' : undefined
              }}
            />
            <Description>
              The default branch to use for new pull requests and commits.
              Common values are "main" or "master".
            </Description>
            {!isValidBranchName(config.defaultBranch) && (
              <Description style={{ color: '#e74c3c' }}>
                Please enter a valid branch name
              </Description>
            )}
          </FormGroup>

          {saved && (
            <StatusIndicator $saved={true}>
              <span>✅</span>
              Configuration saved successfully!
            </StatusIndicator>
          )}
        </ModalBody>

        <ModalFooter>
          <FooterLeft>
            <Button
              $variant="danger"
              onClick={handleClear}
              disabled={!config.repositoryUrl && config.defaultBranch === 'main'}
            >
              🗑️ Clear All
            </Button>
          </FooterLeft>
          <FooterRight>
            <Button onClick={handleClose}>
              Cancel
            </Button>
            <Button
              $variant="primary"
              onClick={handleSave}
              disabled={!canSave}
            >
              Save Configuration
            </Button>
          </FooterRight>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
}

export default GitHubConfigModal;
