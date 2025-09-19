import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import PlanEditor from './components/PlanEditor';
import LiveExecution from './components/LiveExecution';
import IdeaBuilder from './components/IdeaBuilder';
import { PlanProvider, usePlan } from './context/PlanContext';
import ConnectionConfigModal from './components/modals/ConnectionConfigModal';
import GitHubConfigModal from './components/modals/GitHubConfigModal';
import { getGitHubConfig } from './utils/githubConfig';
import apiService from './services/apiService';

const AppContainer = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
`;

const Header = styled.div`
  background-color: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
`;

const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 0.9rem;
  margin: 0;
  opacity: 0.8;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const RunModeToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 500;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const ToggleSwitch = styled.div`
  position: relative;
  width: 60px;
  height: 32px;
  background: ${props => props.$isActive ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid ${props => props.$isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.3)'};
  box-shadow: ${props => props.$isActive
    ? '0 4px 12px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
    : '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'};

  &:hover {
    transform: scale(1.05);
    box-shadow: ${props => props.$isActive
    ? '0 6px 16px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
    : '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'};
  }

  &:active {
    transform: scale(0.98);
  }
`;

const ToggleKnob = styled.div`
  position: absolute;
  top: 2px;
  left: ${props => props.$isActive ? '30px' : '2px'};
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #ffffff, #f8fafc);
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: ${props => props.$isActive ? '#10b981' : '#6b7280'};
  font-weight: 600;
`;

const ToggleLabel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  color: white;
  font-size: 0.8rem;
  font-weight: 500;
  min-width: 60px;
`;

const ModeText = styled.span`
  font-size: 0.75rem;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const HeaderButton = styled.button`
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
  min-width: 120px;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #2980b9, #1f618d);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(52, 152, 219, 0.4);

    &::before {
      left: 100%;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const SecondaryHeaderButton = styled.button`
  background: ${props => props.$connected
    ? 'linear-gradient(135deg, #10b981, #059669)'
    : 'rgba(255, 255, 255, 0.1)'};
  color: white;
  border: 1px solid ${props => props.$connected
    ? 'rgba(16, 185, 129, 0.3)'
    : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 12px;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  min-width: 120px;
  box-shadow: ${props => props.$connected
    ? '0 4px 12px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
    : '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'};

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  &:hover:not(:disabled) {
    background: ${props => props.$connected
    ? 'linear-gradient(135deg, #059669, #047857)'
    : 'rgba(255, 255, 255, 0.2)'};
    border-color: ${props => props.$connected
    ? 'rgba(16, 185, 129, 0.5)'
    : 'rgba(255, 255, 255, 0.4)'};
    transform: translateY(-1px);
    box-shadow: ${props => props.$connected
    ? '0 6px 16px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
    : '0 4px 12px rgba(0, 0, 0, 0.15)'};

    &::before {
      left: 100%;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StageActionButton = styled.button`
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #059669, #047857);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);

    &::before {
      left: 100%;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ExecuteActionButton = styled.button`
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #4f46e5, #4338ca);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);

    &::before {
      left: 100%;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const HeaderBadge = styled.span`
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #f97316;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6);
`;

const TabContainer = styled.div`
  background-color: #34495e;
  padding: 0 2rem;
  display: flex;
  gap: 0;
`;

const Tab = styled.button`
  background: ${props => props.$active ? '#3498db' : 'transparent'};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 0;
  transition: background-color 0.2s;
  border-bottom: 3px solid ${props => props.$active ? '#3498db' : 'transparent'};

  &:hover {
    background-color: ${props => props.$active ? '#3498db' : 'rgba(52, 152, 219, 0.3)'};
  }

  &:focus {
    outline: none;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const StatusBar = styled.div`
  background-color: #ecf0f1;
  padding: 0.5rem 2rem;
  border-top: 1px solid #bdc3c7;
  font-size: 0.8rem;
  color: #7f8c8d;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`;

const StatusGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const StatusIndicator = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => {
    switch (props.$status) {
      case 'connected':
        return '#27ae60';
      case 'loading':
      case 'connecting':
        return '#f39c12';
      case 'error':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  }};
`;

const StatusNote = styled.span`
  color: #e74c3c;
`;

function AppShell() {
  const { dataSource, dataTimestamp, applyRemotePlanData, planData, setRunMode } = usePlan();
  const [activeTab, setActiveTab] = useState('editor');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionError, setConnectionError] = useState(null);
  const [baseURL, setBaseURL] = useState(apiService.baseURL);
  const [isPolling, setIsPolling] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isGitHubConfigOpen, setIsGitHubConfigOpen] = useState(false);
  const [gitHubConnected, setGitHubConnected] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [editorActions, setEditorActions] = useState(null);

  const tabs = useMemo(() => ([
    { id: 'editor', label: 'Plan Editor' },
    { id: 'execution', label: 'Live Execution' },
    { id: 'ideas', label: 'Idea Builder' }
  ]), []);

  const renderActiveTab = useMemo(() => {
    switch (activeTab) {
      case 'editor':
        return (
          <PlanEditor
            onRequestTabChange={setActiveTab}
            onRegisterActions={setEditorActions}
          />
        );
      case 'execution':
        return <LiveExecution />;
      case 'ideas':
        return (
          <IdeaBuilder
            onNavigateToPlanEditor={() => setActiveTab('editor')}
          />
        );
      default:
        return null;
    }
  }, [activeTab, setActiveTab, setEditorActions]);

  const syncStatusFromService = useCallback(() => {
    const status = apiService.getConnectionStatus();
    setBaseURL(status.baseURL || apiService.baseURL);
    setIsPolling(!!status.pollingActive);
    setConnectionError(status.error || null);
    setConnectionStatus(prev => {
      if (prev === 'connecting' && !status.isConnected && !status.error) {
        return prev;
      }
      if (status.isConnected) return 'connected';
      if (status.error) return 'error';
      return 'disconnected';
    });
  }, []);

  const handleDataUpdate = useCallback((transformedData) => {
    if (!transformedData) {
      return;
    }

    const timestamp = new Date().toISOString();
    applyRemotePlanData(transformedData, {
      source: 'api',
      dataTimestamp: timestamp
    });
    setLastSynced(new Date(timestamp));
  }, [applyRemotePlanData]);

  const handleManualRefresh = useCallback(async () => {
    const status = apiService.getConnectionStatus();
    if (!status.isConnected) {
      setConnectionError(status.error || 'Connect to the API before refreshing.');
      setConnectionStatus(status.error ? 'error' : 'disconnected');
      return;
    }

    setConnectionStatus('loading');
    try {
      const result = await apiService.getProjectDataTransformed();
      if (result.success) {
        const now = new Date();
        applyRemotePlanData(result.data, {
          source: 'api',
          dataTimestamp: now.toISOString()
        });
        setLastSynced(now);
        setConnectionError(null);
        setConnectionStatus('connected');
      } else {
        setConnectionError(result.error || 'Failed to refresh project data.');
        setConnectionStatus('error');
      }
    } catch (error) {
      setConnectionError(error.message);
      setConnectionStatus('error');
    } finally {
      syncStatusFromService();
    }
  }, [applyRemotePlanData, syncStatusFromService]);

  const handleGitHubModalClose = useCallback(() => {
    setIsGitHubConfigOpen(false);
    // Re-check GitHub configuration when modal closes
    const config = getGitHubConfig();
    setGitHubConnected(!!config.repositoryUrl);
  }, []);

  const handleConnectionChange = useCallback(({ connected, url, error }) => {
    if (url) {
      setBaseURL(url);
    }

    if (connected) {
      setConnectionStatus('connected');
      setConnectionError(null);
      syncStatusFromService();
      handleManualRefresh();
    } else if (error) {
      setConnectionStatus('error');
      setConnectionError(error);
    } else {
      setConnectionStatus('disconnected');
      setConnectionError(null);
    }
  }, [handleManualRefresh, syncStatusFromService]);

  useEffect(() => {
    let cancelled = false;

    const attemptRestore = async () => {
      if (!apiService.shouldAttemptAutoReconnect()) {
        return;
      }

      setConnectionStatus(current => {
        if (current === 'connected' || current === 'loading') {
          return current;
        }
        return 'connecting';
      });

      const result = await apiService.restorePersistedConnection();

      if (cancelled || !result.attempted) {
        return;
      }

      if (result.success) {
        setConnectionError(null);
        try {
          await handleManualRefresh();
        } catch (error) {
          // Errors are handled inside handleManualRefresh
        }
      } else if (result.error) {
        setConnectionError(result.error);
        setConnectionStatus('error');
      } else {
        setConnectionStatus('disconnected');
      }

      if (!cancelled) {
        syncStatusFromService();
      }
    };

    attemptRestore();

    return () => {
      cancelled = true;
    };
  }, [handleManualRefresh, syncStatusFromService]);

  // Check GitHub configuration status
  useEffect(() => {
    const checkGitHubConfig = () => {
      const config = getGitHubConfig();
      setGitHubConnected(!!config.repositoryUrl);
    };

    checkGitHubConfig();

    // Listen for localStorage changes (when config is saved in modal)
    const handleStorageChange = (e) => {
      if (e.key === 'github_config') {
        checkGitHubConfig();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    syncStatusFromService();
    const interval = setInterval(syncStatusFromService, 10000);
    return () => clearInterval(interval);
  }, [syncStatusFromService]);

  const statusDotValue = connectionStatus;

  const lastUpdateLabel = useMemo(() => {
    if (lastSynced) {
      return lastSynced.toLocaleString();
    }
    if (dataTimestamp) {
      const date = new Date(dataTimestamp);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleString();
      }
    }
    return '—';
  }, [lastSynced, dataTimestamp]);

  return (
    <AppContainer>
      <Header>
        <HeaderContent>
          <Title>Second Brain Visualizer</Title>
          <Subtitle>Project execution planning and monitoring platform</Subtitle>
        </HeaderContent>

        <HeaderActions>
          {connectionStatus === 'connected' && (
            <RunModeToggle>
              <ToggleLabel>
                <span>Execution Mode</span>
                <ModeText>
                  {dataSource === 'loading' ? 'Loading...' : (planData?.project?.default_run_mode || 'shadow') === 'shadow' ? 'Shadow' : 'Merge'}
                </ModeText>
              </ToggleLabel>
              <ToggleSwitch
                $isActive={dataSource === 'loading' ? false : (planData?.project?.default_run_mode || 'shadow') === 'merge'}
                onClick={() => {
                  if (dataSource !== 'loading') {
                    const currentMode = planData?.project?.default_run_mode || 'shadow';
                    setRunMode(currentMode === 'shadow' ? 'merge' : 'shadow');
                  }
                }}
              >
                <ToggleKnob $isActive={dataSource === 'loading' ? false : (planData?.project?.default_run_mode || 'shadow') === 'merge'}>
                  {dataSource === 'loading' ? '⏳' : (planData?.project?.default_run_mode || 'shadow') === 'merge' ? '🚀' : '🛡️'}
                </ToggleKnob>
              </ToggleSwitch>
            </RunModeToggle>
          )}
          {activeTab === 'editor' && editorActions && editorActions.stage && editorActions.execute && (
            <>
              <StageActionButton
                onClick={editorActions.stage.onClick}
                disabled={editorActions.stage.disabled}
              >
                <span>{editorActions.stage.icon}</span>
                <span>{editorActions.stage.busy ? editorActions.stage.busyLabel : editorActions.stage.label}</span>
                {editorActions.stage.badge > 0 && (
                  <HeaderBadge>{Math.min(editorActions.stage.badge, 99)}</HeaderBadge>
                )}
              </StageActionButton>
              <ExecuteActionButton
                onClick={editorActions.execute.onClick}
                disabled={editorActions.execute.disabled}
              >
                <span>{editorActions.execute.icon}</span>
                <span>{editorActions.execute.busy ? editorActions.execute.busyLabel : editorActions.execute.label}</span>
              </ExecuteActionButton>
            </>
          )}
          <SecondaryHeaderButton
            $connected={connectionStatus === 'connected'}
            onClick={() => setIsConfigOpen(true)}
          >
            {connectionStatus === 'connected' ? '✅ Second Brain Connected' : '⚙️ Connect Second Brain'}
          </SecondaryHeaderButton>
          <SecondaryHeaderButton
            $connected={gitHubConnected}
            onClick={() => setIsGitHubConfigOpen(true)}
          >
            {gitHubConnected ? '✅ Github Connected' : '🐙 Configure Github'}
          </SecondaryHeaderButton>
        </HeaderActions>
      </Header>

      <TabContainer>
        {tabs.map(tab => (
          <Tab
            key={tab.id}
            $active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Tab>
        ))}
      </TabContainer>

      <ContentArea>
        {renderActiveTab}
      </ContentArea>

      <StatusBar>
        <StatusGroup>
          <StatusIndicator>
            <StatusDot $status={statusDotValue} />
            Status: {connectionStatus}
          </StatusIndicator>
          <span>API: {baseURL || '—'}</span>
          <span>Polling: {isPolling ? `${apiService.pollingFrequency / 1000}s` : 'off'}</span>
        </StatusGroup>

        <StatusGroup>
          <span>Data source: {dataSource}</span>
          <span>Last sync: {lastUpdateLabel}</span>
          {connectionError && <StatusNote>{connectionError}</StatusNote>}
        </StatusGroup>
      </StatusBar>

      <ConnectionConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onDataUpdate={handleDataUpdate}
        onConnectionChange={handleConnectionChange}
      />

      <GitHubConfigModal
        isOpen={isGitHubConfigOpen}
        onClose={handleGitHubModalClose}
      />
    </AppContainer>
  );
}

function App() {
  return (
    <PlanProvider>
      <AppShell />
    </PlanProvider>
  );
}

export default App;
