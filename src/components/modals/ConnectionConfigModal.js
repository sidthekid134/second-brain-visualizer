import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import apiService from '../../services/apiService';
import { formatRelativeTime } from '../../utils/dateUtils';

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const Modal = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  padding: 24px 24px 0 24px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h2`
  margin: 0 0 8px 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ModalSubtitle = styled.p`
  margin: 0 0 16px 0;
  color: #6b7280;
  font-size: 0.9rem;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  
  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const ModalBody = styled.div`
  padding: 0 24px 24px 24px;
`;

const ConnectionContainer = styled.div`
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
`;

const ConnectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ConnectionTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${props => {
        switch (props.$status) {
            case 'connected': return '#dcfce7';
            case 'connecting': return '#fef3c7';
            case 'error': return '#fecaca';
            default: return '#f3f4f6';
        }
    }};
  color: ${props => {
        switch (props.$status) {
            case 'connected': return '#166534';
            case 'connecting': return '#92400e';
            case 'error': return '#dc2626';
            default: return '#6b7280';
        }
    }};
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
        switch (props.$status) {
            case 'connected': return '#22c55e';
            case 'connecting': return '#f59e0b';
            case 'error': return '#ef4444';
            default: return '#9ca3af';
        }
    }};
  ${props => props.$status === 'connecting' && css`
    animation: ${pulse} 1.5s infinite;
  `}
`;

const ConfigSection = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: end;
  margin-bottom: 16px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.label`
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
`;

const Input = styled.input`
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:disabled {
    background: #f9fafb;
    color: #6b7280;
  }
`;

const Button = styled.button`
  background: ${props => {
        if (props.$variant === 'danger') return '#ef4444';
        if (props.$variant === 'success') return '#10b981';
        if (props.$variant === 'secondary') return '#6b7280';
        return '#3b82f6';
    }};
  color: white;
  border: none;
  border-radius: 8px;
  padding: ${props => props.$size === 'large' ? '12px 24px' : '8px 16px'};
  font-size: ${props => props.$size === 'large' ? '0.9rem' : '0.8rem'};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover:not(:disabled) {
    background: ${props => {
        if (props.$variant === 'danger') return '#dc2626';
        if (props.$variant === 'success') return '#059669';
        if (props.$variant === 'secondary') return '#4b5563';
        return '#2563eb';
    }};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
`;

const StatusCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
`;

const StatusCardTitle = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 4px;
`;

const StatusCardValue = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 12px;
  color: #dc2626;
  font-size: 0.9rem;
  margin-top: 12px;
`;

const PollingControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  flex-wrap: wrap;
`;

const Select = styled.select`
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 0.8rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const ModalFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

function ConnectionConfigModal({ isOpen, onClose, onDataUpdate, onConnectionChange }) {
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [apiURL, setApiURL] = useState('http://localhost:8000');
    const [isPolling, setIsPolling] = useState(false);
    const [pollingFrequency, setPollingFrequency] = useState(5000);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [stats, setStats] = useState({
        totalIntents: 0,
        totalStories: 0,
        uptime: 'N/A'
    });
    const [error, setError] = useState(null);
    const [systemStatus, setSystemStatus] = useState(null);

    useEffect(() => {
        if (isOpen) {
            // Initialize with current service state when modal opens
            const status = apiService.getConnectionStatus();
            setConnectionStatus(status.isConnected ? 'connected' : 'disconnected');
            setApiURL(status.baseURL);
            setIsPolling(status.pollingActive);
            setPollingFrequency(status.pollingFrequency);
            setError(status.error);
        }
    }, [isOpen]);

    const handleConnect = async () => {
        setConnectionStatus('connecting');
        setError(null);

        // Update API service URL
        apiService.setBaseURL(apiURL);

        // Test connection
        const result = await apiService.testConnection();

        if (result.success) {
            setConnectionStatus('connected');

            // Fetch initial data
            await fetchSystemStatus();
            await fetchProjectData();

            // Notify parent component
            if (onConnectionChange) {
                onConnectionChange({ connected: true, url: apiURL });
            }
        } else {
            setConnectionStatus('error');
            setError(result.error);

            if (onConnectionChange) {
                onConnectionChange({ connected: false, error: result.error });
            }
        }
    };

    const handleDisconnect = () => {
        apiService.manualDisconnect();
        setConnectionStatus('disconnected');
        setIsPolling(false);
        setError(null);
        setSystemStatus(null);

        if (onConnectionChange) {
            onConnectionChange({ connected: false });
        }
    };

    const fetchSystemStatus = async () => {
        const result = await apiService.getSystemStatus();
        if (result.success) {
            setSystemStatus(result.data);
        }
    };

    const fetchProjectData = async () => {
        const result = await apiService.getProjectDataTransformed();
        if (result.success) {
            if (apiService.validateNewSchemaData(result.data)) {
                // Calculate stats from new schema data
                const totalIntents = result.data.project?.roadmap?.intents?.length || 0;
                const totalStories = result.data.project?.roadmap?.intents?.reduce((total, intent) => {
                    return total + (intent.stories?.length || 0);
                }, 0) || 0;
                const uptime = result.data.project?.created_at || new Date().toISOString();

                setStats({
                    totalIntents,
                    totalStories,
                    uptime: formatRelativeTime(uptime)
                });
                setLastUpdate(new Date());

                if (onDataUpdate) {
                    onDataUpdate(result.data);
                }
            } else {
                console.error('Invalid data format received from API');
            }
        }
    };

    const handleStartPolling = () => {
        apiService.setPollingFrequency(pollingFrequency);
        apiService.startPolling((update) => {
            switch (update.type) {
                case 'data_update':
                    if (update.data) {
                        setStats({
                            totalIntents: update.data.project?.roadmap?.intents?.length || 0,
                            totalStories: update.data.stories?.length || 0,
                            uptime: formatRelativeTime(update.data.project?.created_at || new Date().toISOString())
                        });
                        setLastUpdate(new Date());

                        if (onDataUpdate) {
                            onDataUpdate(update.data);
                        }
                    }
                    break;
                case 'connection_error':
                    setConnectionStatus('error');
                    setError(update.error);
                    setIsPolling(false);
                    break;
                case 'fetch_error':
                    setError(update.error);
                    break;
                default:
                    console.warn('Unknown update type:', update.type);
                    break;
            }
        });

        setIsPolling(true);
    };

    const handleStopPolling = () => {
        apiService.stopPolling();
        setIsPolling(false);
    };

    const handlePollingFrequencyChange = (newFrequency) => {
        setPollingFrequency(newFrequency);
        if (isPolling) {
            // Restart polling with new frequency
            handleStopPolling();
            setTimeout(() => {
                apiService.setPollingFrequency(newFrequency);
                handleStartPolling();
            }, 100);
        }
    };

    if (!isOpen) return null;

    return (
        <Overlay onClick={(e) => e.target === e.currentTarget && onClose()}>
            <Modal>
                <ModalHeader>
                    <ModalTitle>
                        🔌 API Connection Configuration
                    </ModalTitle>
                    <ModalSubtitle>
                        Configure your connection to the Neuro Coordinator API server for live execution monitoring.
                    </ModalSubtitle>
                    <CloseButton onClick={onClose}>×</CloseButton>
                </ModalHeader>

                <ModalBody>
                    <ConnectionContainer>
                        <ConnectionHeader>
                            <ConnectionTitle>
                                Connection Status
                            </ConnectionTitle>
                            <StatusIndicator $status={connectionStatus}>
                                <StatusDot $status={connectionStatus} />
                                {connectionStatus === 'connected' && 'Connected'}
                                {connectionStatus === 'connecting' && 'Connecting...'}
                                {connectionStatus === 'error' && 'Error'}
                                {connectionStatus === 'disconnected' && 'Disconnected'}
                            </StatusIndicator>
                        </ConnectionHeader>

                        <ConfigSection>
                            <InputGroup>
                                <Label>API Base URL</Label>
                                <Input
                                    type="url"
                                    value={apiURL}
                                    onChange={(e) => setApiURL(e.target.value)}
                                    disabled={connectionStatus === 'connected' || connectionStatus === 'connecting'}
                                    placeholder="http://localhost:8000"
                                />
                            </InputGroup>

                            {connectionStatus === 'connected' ? (
                                <Button $variant="danger" onClick={handleDisconnect}>
                                    🔌 Disconnect
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleConnect}
                                    disabled={connectionStatus === 'connecting' || !apiURL.trim()}
                                >
                                    {connectionStatus === 'connecting' ? '⏳ Connecting...' : '🔌 Connect'}
                                </Button>
                            )}
                        </ConfigSection>

                        {connectionStatus === 'connected' && (
                            <>
                                <StatusGrid>
                                    <StatusCard>
                                        <StatusCardTitle>Total Intents</StatusCardTitle>
                                        <StatusCardValue>{stats.totalIntents}</StatusCardValue>
                                    </StatusCard>
                                    <StatusCard>
                                        <StatusCardTitle>Total Stories</StatusCardTitle>
                                        <StatusCardValue>{stats.totalStories}</StatusCardValue>
                                    </StatusCard>
                                    <StatusCard>
                                        <StatusCardTitle>Last Update</StatusCardTitle>
                                        <StatusCardValue>
                                            {lastUpdate ? formatRelativeTime(lastUpdate) : 'Never'}
                                        </StatusCardValue>
                                    </StatusCard>
                                    {systemStatus && (
                                        <StatusCard>
                                            <StatusCardTitle>System Status</StatusCardTitle>
                                            <StatusCardValue>
                                                {systemStatus.status || 'Unknown'}
                                            </StatusCardValue>
                                        </StatusCard>
                                    )}
                                </StatusGrid>

                                <PollingControls>
                                    <Label>Auto-refresh:</Label>
                                    {isPolling ? (
                                        <Button $variant="danger" onClick={handleStopPolling}>
                                            ⏸️ Stop
                                        </Button>
                                    ) : (
                                        <Button $variant="success" onClick={handleStartPolling}>
                                            ▶️ Start
                                        </Button>
                                    )}

                                    <Label>Frequency:</Label>
                                    <Select
                                        value={pollingFrequency}
                                        onChange={(e) => handlePollingFrequencyChange(Number(e.target.value))}
                                    >
                                        <option value={1000}>1 second</option>
                                        <option value={5000}>5 seconds</option>
                                        <option value={10000}>10 seconds</option>
                                        <option value={30000}>30 seconds</option>
                                        <option value={60000}>1 minute</option>
                                    </Select>

                                    <Button onClick={fetchProjectData} disabled={connectionStatus !== 'connected'}>
                                        🔄 Refresh Now
                                    </Button>
                                </PollingControls>
                            </>
                        )}

                        {error && (
                            <ErrorMessage>
                                ⚠️ {error}
                            </ErrorMessage>
                        )}
                    </ConnectionContainer>
                </ModalBody>

                <ModalFooter>
                    <Button $variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                </ModalFooter>
            </Modal>
        </Overlay>
    );
}

export default ConnectionConfigModal;
