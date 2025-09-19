import React from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const Modal = styled.div`
  background: #ffffff;
  border-radius: 16px;
  width: 500px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  padding: 0;
  box-shadow: 0 24px 72px rgba(15, 23, 42, 0.3);
  position: relative;
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px 20px;
  border-bottom: 1px solid #f1f5f9;
  background: linear-gradient(135deg, #fef2f2 0%, #fdf2f8 100%);
  border-radius: 16px 16px 0 0;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: #dc2626;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ErrorIcon = styled.span`
  font-size: 1.5rem;
  filter: drop-shadow(0 2px 4px rgba(220, 38, 38, 0.2));
`;

const CloseButton = styled.button`
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #f1f5f9;
    color: #64748b;
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const Body = styled.div`
  padding: 24px 28px;
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #991b1b;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const Details = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
  margin-top: 16px;
  font-size: 0.85rem;
  color: #64748b;
`;

const DetailTitle = styled.div`
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
`;

const DetailText = styled.div`
  font-family: 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', Consolas, 'Courier New', monospace;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px 12px;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 200px;
  overflow-y: auto;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 28px 24px;
  border-top: 1px solid #f1f5f9;
  background: #fafafa;
  border-radius: 0 0 16px 16px;
`;

const Button = styled.button`
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:active {
    transform: scale(0.98);
  }
`;

const DismissButton = styled(Button)`
  background: #f1f5f9;
  color: #64748b;

  &:hover {
    background: #e2e8f0;
    color: #475569;
  }
`;

const ClearDraftButton = styled(Button)`
  background: #dc2626;
  color: white;

  &:hover {
    background: #b91c1c;
  }
`;

function ErrorOverlay({
  isOpen,
  onClose,
  onClearDraft,
  title = "Submission Error",
  message,
  details,
  showClearDraft = true
}) {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleClearDraft = () => {
    if (onClearDraft) {
      onClearDraft();
    }
    onClose();
  };

  return (
    <Overlay onClick={handleOverlayClick}>
      <Modal>
        <Header>
          <Title>
            <ErrorIcon>⚠️</ErrorIcon>
            {typeof title === 'string'
              ? title
              : JSON.stringify(title, null, 2)
            }
          </Title>
          <CloseButton onClick={onClose} aria-label="Close error dialog">
            ×
          </CloseButton>
        </Header>

        <Body>
          <ErrorMessage>
            {typeof message === 'string'
              ? message
              : JSON.stringify(message, null, 2)
            }
          </ErrorMessage>

          {details && (
            <Details>
              <DetailTitle>Error Details:</DetailTitle>
              <DetailText>
                {typeof details === 'string'
                  ? details
                  : JSON.stringify(details, null, 2)
                }
              </DetailText>
            </Details>
          )}
        </Body>

        <Footer>
          <DismissButton onClick={onClose}>
            Continue Editing
          </DismissButton>
          {showClearDraft && (
            <ClearDraftButton onClick={handleClearDraft}>
              🗑️ Clear Draft
            </ClearDraftButton>
          )}
        </Footer>
      </Modal>
    </Overlay>
  );
}

export default ErrorOverlay;
