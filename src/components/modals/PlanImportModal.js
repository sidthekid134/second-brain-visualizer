import React, { useState, useRef } from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
`;

const Container = styled.div`
  background: #ffffff;
  border-radius: 18px;
  width: 640px;
  max-width: 92vw;
  max-height: 92vh;
  overflow: hidden;
  box-shadow: 0 28px 72px rgba(15, 23, 42, 0.26);
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: 22px 28px 16px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
`;

const CloseButton = styled.button`
  border: none;
  background: transparent;
  font-size: 1.5rem;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;

  &:hover {
    background: #f1f5f9;
    color: #0f172a;
  }
`;

const Body = styled.div`
  padding: 20px 28px 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
`;

const Section = styled.div`
  border: 1px dashed #cbd5f5;
  border-radius: 14px;
  padding: 16px 18px;
  background: #f8fafc;
`;

const SectionTitle = styled.h3`
  margin: 0 0 10px 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1f2937;
`;

const Description = styled.p`
  margin: 0 0 14px 0;
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.5;
`;

const UploadInput = styled.input`
  display: none;
`;

const UploadButton = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #2563eb;
  color: white;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 8px;

  &:hover {
    background: #1d4ed8;
  }
`;

const FileInfo = styled.div`
  font-size: 0.8rem;
  color: #475569;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 160px;
  font-size: 0.9rem;
  line-height: 1.45;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 12px 14px;
  resize: vertical;
  font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', monospace;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
  }
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 0 28px 24px 28px;
`;

const Button = styled.button`
  border-radius: 10px;
  border: none;
  padding: 10px 18px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
`;

const SecondaryButton = styled(Button)`
  background: #f1f5f9;
  color: #1e293b;

  &:hover {
    background: #e2e8f0;
  }
`;

const PrimaryButton = styled(Button)`
  background: #059669;
  color: white;

  &:hover:not(:disabled) {
    background: #047857;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.div`
  color: #dc2626;
  font-size: 0.83rem;
  margin-top: 8px;
`;

function PlanImportModal({ isOpen, onClose, onImport }) {
  const [fileName, setFileName] = useState(null);
  const [rawText, setRawText] = useState('');
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleClose = () => {
    setError(null);
    setFileName(null);
    setRawText('');
    if (onClose) {
      onClose();
    }
  };

  const parseAndImport = (content) => {
    try {
      const parsed = JSON.parse(content);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Plan must be a JSON object.');
      }
      if (onImport) {
        onImport(parsed);
      }
      setError(null);
      setFileName(null);
      setRawText('');
      handleClose();
    } catch (parseError) {
      setError(parseError.message || 'Failed to parse plan JSON.');
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const text = loadEvent.target?.result;
      if (typeof text === 'string') {
        parseAndImport(text);
        setFileName(file.name || 'plan.json');
      } else {
        setError('Unsupported file format.');
      }
    };
    reader.onerror = () => {
      setError('Unable to read file.');
    };
    reader.readAsText(file);
  };

  const handlePasteImport = () => {
    parseAndImport(rawText);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Overlay>
      <Container>
        <Header>
          <Title>Import Plan</Title>
          <CloseButton onClick={handleClose} aria-label="Close import modal">×</CloseButton>
        </Header>

        <Body>
          <Section>
            <SectionTitle>Upload Plan File</SectionTitle>
            <Description>
              Provide a JSON file that matches the project schema. The file will be staged locally and can be edited before submitting to the backend.
            </Description>
            <UploadButton htmlFor="plan-file-input">📁 Choose File</UploadButton>
            <UploadInput
              id="plan-file-input"
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChange}
            />
            {fileName && <FileInfo>Loaded: {fileName}</FileInfo>}
          </Section>

          <Section>
            <SectionTitle>Paste JSON</SectionTitle>
            <Description>
              Paste a JSON payload to stage it directly. Helpful when copying from another environment.
            </Description>
            <TextArea
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              placeholder={'{\n  "project": { ... },\n  "stories": [ ... ]\n}'}
            />
          </Section>

          {error && <ErrorText>{error}</ErrorText>}
        </Body>

        <ButtonRow>
          <SecondaryButton type="button" onClick={handleClose}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={handlePasteImport}
            disabled={!rawText.trim()}
          >
            Import from Text
          </PrimaryButton>
        </ButtonRow>
      </Container>
    </Overlay>
  );
}

export default PlanImportModal;
