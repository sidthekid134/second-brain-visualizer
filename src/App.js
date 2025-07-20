import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import PlanEditor from './components/PlanEditor';
import LiveExecution from './components/LiveExecution';
import IdeaBuilder from './components/IdeaBuilder';
import { PlanProvider } from './context/PlanContext';

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
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 0.9rem;
  margin: 0.25rem 0 0 0;
  opacity: 0.8;
`;

const TabContainer = styled.div`
  background-color: #34495e;
  padding: 0 2rem;
  display: flex;
  gap: 0;
`;

const Tab = styled.button`
  background: ${props => props.active ? '#3498db' : 'transparent'};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 0;
  transition: background-color 0.2s;
  border-bottom: 3px solid ${props => props.active ? '#3498db' : 'transparent'};

  &:hover {
    background-color: ${props => props.active ? '#3498db' : 'rgba(52, 152, 219, 0.3)'};
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
    switch (props.status) {
      case 'connected': return '#27ae60';
      case 'loading': return '#f39c12';
      case 'error': return '#e74c3c';
      default: return '#95a5a6';
    }
  }};
`;

function App() {
  const [activeTab, setActiveTab] = useState('execution');
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Simulate live updates
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'editor', label: 'Plan Editor', component: PlanEditor },
    { id: 'execution', label: 'Live Execution', component: LiveExecution },
    { id: 'ideas', label: 'Idea Builder', component: IdeaBuilder }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <PlanProvider>
      <AppContainer>
        <Header>
          <Title>Second Brain Visualizer</Title>
          <Subtitle>Project execution planning and monitoring platform</Subtitle>
        </Header>

        <TabContainer>
          {tabs.map(tab => (
            <Tab
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </Tab>
          ))}
        </TabContainer>

        <ContentArea>
          {ActiveComponent && <ActiveComponent />}
        </ContentArea>

        <StatusBar>
          <StatusIndicator>
            <StatusDot status={connectionStatus} />
            Status: {connectionStatus}
          </StatusIndicator>
          <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
        </StatusBar>
      </AppContainer>
    </PlanProvider>
  );
}

export default App; 