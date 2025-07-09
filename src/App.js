import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import FileUpload from './components/FileUpload';
import ProjectSidebar from './components/ProjectSidebar';
import DependencyGraph from './components/DependencyGraph';
import TestGraph from './components/TestGraph';

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  background-color: #f5f5f5;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100vh;
`;

const Header = styled.div`
  background: white;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
`;

const ProjectInfo = styled.div`
  flex: 1;
`;

const StatusIndicators = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
`;

const StatusBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  background: ${props => props.$active ? '#d4edda' : '#f8d7da'};
  color: ${props => props.$active ? '#155724' : '#721c24'};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  margin-top: 0.5rem;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  width: ${props => props.$progress}%;
  height: 100%;
  background: #28a745;
  transition: width 0.3s ease;
`;

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: #666;
`;

const ToggleButton = styled.button`
  background: ${props => props.$active ? '#dc3545' : '#28a745'};
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background-color 0.2s;

  &:hover {
    background: ${props => props.$active ? '#c82333' : '#218838'};
  }
`;

const TestButton = styled.button`
  background: #6f42c1;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background-color 0.2s;

  &:hover {
    background: #5a359a;
  }
`;

const GraphContainer = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  min-height: 0;
`;

const ProjectStats = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #666;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

function App() {
    const [projectData, setProjectData] = useState(null);
    const [selectedStory, setSelectedStory] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [autoReloadEnabled, setAutoReloadEnabled] = useState(false);
    const [showTestGraph, setShowTestGraph] = useState(false);

    // Function to load the project plan
    const loadProjectPlan = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/live-file.json?t=${Date.now()}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setProjectData(data);
        } catch (error) {
            console.error('Error loading project plan:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Auto-reload effect
    useEffect(() => {
        if (autoReloadEnabled) {
            const interval = setInterval(loadProjectPlan, 2000);
            return () => clearInterval(interval);
        }
    }, [autoReloadEnabled, loadProjectPlan]);

    // Initial load
    useEffect(() => {
        loadProjectPlan();
    }, [loadProjectPlan]);

    const handleFileUpload = useCallback((data) => {
        try {
            const parsedData = JSON.parse(data);
            setProjectData(parsedData);
            setSelectedStory(null);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            alert('Invalid JSON file. Please check the format.');
        }
    }, []);

    const toggleAutoReload = useCallback(() => {
        setAutoReloadEnabled(prev => !prev);
    }, []);

    const toggleTestGraph = useCallback(() => {
        setShowTestGraph(prev => !prev);
    }, []);

    const handleStorySelect = useCallback((story) => {
        setSelectedStory(story);
    }, []);

    const getExecutionStatus = () => {
        if (!projectData?.execution_status) return null;
        return {
            running: projectData.execution_status.running,
            progress: projectData.execution_status.completion_percentage,
            totalStories: projectData.execution_status.total_stories,
            totalAgents: projectData.execution_status.total_agents,
            totalMessages: projectData.execution_status.total_messages
        };
    };

    const executionStatus = getExecutionStatus();

    return (
        <AppContainer>
            <ProjectSidebar
                projectData={projectData}
                selectedStory={selectedStory}
                onStorySelect={handleStorySelect}
            />
            <MainContent>
                <Header>
                    <HeaderTop>
                        <ProjectInfo>
                            <h1>{projectData?.project_info?.name || 'Project Visualizer'}</h1>
                            <p>{projectData?.project_info?.description || 'Load a project plan to visualize dependencies'}</p>
                            {executionStatus && (
                                <>
                                    <ProgressBar>
                                        <ProgressFill $progress={executionStatus.progress} />
                                    </ProgressBar>
                                    <ProjectStats>
                                        <StatItem>
                                            📊 Progress: {executionStatus.progress.toFixed(1)}%
                                        </StatItem>
                                        <StatItem>
                                            📝 Stories: {executionStatus.totalStories}
                                        </StatItem>
                                        <StatItem>
                                            🤖 Agents: {executionStatus.totalAgents}
                                        </StatItem>
                                        <StatItem>
                                            💬 Messages: {executionStatus.totalMessages}
                                        </StatItem>
                                    </ProjectStats>
                                </>
                            )}
                        </ProjectInfo>
                        <StatusIndicators>
                            <StatusBadge $active={autoReloadEnabled}>
                                <span>Auto-reload: {autoReloadEnabled ? 'ON' : 'OFF'}</span>
                                <ToggleButton
                                    $active={autoReloadEnabled}
                                    onClick={toggleAutoReload}
                                >
                                    {autoReloadEnabled ? 'Disable' : 'Enable'}
                                </ToggleButton>
                            </StatusBadge>
                            {isLoading && (
                                <LoadingIndicator>
                                    <span>🔄</span>
                                    <span>Checking for updates...</span>
                                </LoadingIndicator>
                            )}
                            <TestButton onClick={toggleTestGraph}>
                                {showTestGraph ? 'Show Real Graph' : 'Show Test Graph'}
                            </TestButton>
                        </StatusIndicators>
                    </HeaderTop>
                    <FileUpload onFileUpload={handleFileUpload} />
                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                        💡 <strong>Real-time monitoring:</strong> Enable auto-reload above to automatically check for updates to <code>public/live-file.json</code> every 2 seconds.
                    </div>
                </Header>
                <GraphContainer>
                    {isLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            Loading project data...
                        </div>
                    ) : showTestGraph ? (
                        <TestGraph />
                    ) : (
                        <DependencyGraph
                            projectData={projectData}
                            selectedStory={selectedStory}
                            onStorySelect={handleStorySelect}
                        />
                    )}
                </GraphContainer>
            </MainContent>
        </AppContainer>
    );
}

export default App; 