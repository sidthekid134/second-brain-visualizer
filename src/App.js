import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import FileUpload from './components/FileUpload';
import ProjectSidebar from './components/ProjectSidebar';
import DependencyGraph from './components/DependencyGraph';
import TestGraph from './components/TestGraph';
import { normalizeProjectData, getSchemaDisplayInfo } from './utils/schemaUtils';

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

const DataSourceSelector = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  align-items: center;
`;

const DataSourceButton = styled.button`
  background: ${props => props.$active ? '#007bff' : '#6c757d'};
  color: white;
  border: none;
  padding: 0.35rem 0.7rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background-color 0.2s;

  &:hover {
    background: ${props => props.$active ? '#0056b3' : '#5a6268'};
  }
`;

const SchemaIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  background: ${props => props.$schemaType === 'live-file' ? '#e7f3ff' : '#fff3e0'};
  color: ${props => props.$schemaType === 'live-file' ? '#0056b3' : '#bf6900'};
  border: 1px solid ${props => props.$schemaType === 'live-file' ? '#b3d9ff' : '#ffd699'};
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
    const [rawProjectData, setRawProjectData] = useState(null); // Store raw data before normalization
    const [selectedStory, setSelectedStory] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [autoReloadEnabled, setAutoReloadEnabled] = useState(false);
    const [showTestGraph, setShowTestGraph] = useState(false);
    const [dataSource, setDataSource] = useState('live-file'); // 'live-file' | 'example' | 'custom'

    // Function to load project data from a specific source
    const loadProjectData = useCallback(async (source = dataSource) => {
        setIsLoading(true);
        try {
            const filename = source === 'live-file' ? 'live-file.json' : 'example-plan-1.json';
            const response = await fetch(`/${filename}?t=${Date.now()}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const rawData = await response.json();
            setRawProjectData(rawData);

            // Normalize the data regardless of schema
            const normalizedData = normalizeProjectData(rawData);
            setProjectData(normalizedData);
        } catch (error) {
            console.error('Error loading project data:', error);
            // Show user-friendly error message
            setProjectData(null);
            setRawProjectData(null);
        } finally {
            setIsLoading(false);
        }
    }, [dataSource]);

    // Auto-reload effect (only for live-file)
    useEffect(() => {
        if (autoReloadEnabled && dataSource === 'live-file') {
            const interval = setInterval(() => loadProjectData('live-file'), 2000);
            return () => clearInterval(interval);
        }
    }, [autoReloadEnabled, dataSource, loadProjectData]);

    // Load data when data source changes
    useEffect(() => {
        loadProjectData(dataSource);
    }, [dataSource, loadProjectData]);

    const handleFileUpload = useCallback((data) => {
        try {
            const parsedData = JSON.parse(data);
            setRawProjectData(parsedData);

            // Normalize the uploaded data
            const normalizedData = normalizeProjectData(parsedData);
            setProjectData(normalizedData);
            setSelectedStory(null);
            setDataSource('custom');

            // Disable auto-reload when custom data is uploaded
            setAutoReloadEnabled(false);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            alert('Invalid JSON file. Please check the format.');
        }
    }, []);

    const toggleAutoReload = useCallback(() => {
        if (dataSource !== 'live-file') {
            alert('Auto-reload is only available for the live-file data source');
            return;
        }
        setAutoReloadEnabled(prev => !prev);
    }, [dataSource]);

    const toggleTestGraph = useCallback(() => {
        setShowTestGraph(prev => !prev);
    }, []);

    const handleStorySelect = useCallback((story) => {
        setSelectedStory(story);
    }, []);

    const handleDataSourceChange = useCallback((source) => {
        setDataSource(source);
        setSelectedStory(null);
        // Disable auto-reload when switching away from live-file
        if (source !== 'live-file') {
            setAutoReloadEnabled(false);
        }
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
    const schemaInfo = getSchemaDisplayInfo(projectData);

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
                                        {executionStatus.totalAgents > 0 && (
                                            <StatItem>
                                                🤖 Agents: {executionStatus.totalAgents}
                                            </StatItem>
                                        )}
                                        {executionStatus.totalMessages > 0 && (
                                            <StatItem>
                                                💬 Messages: {executionStatus.totalMessages}
                                            </StatItem>
                                        )}
                                    </ProjectStats>
                                </>
                            )}
                        </ProjectInfo>
                        <StatusIndicators>
                            {schemaInfo && (
                                <SchemaIndicator $schemaType={schemaInfo.schemaType}>
                                    <span>📋</span>
                                    <span>{schemaInfo.schemaLabel}</span>
                                </SchemaIndicator>
                            )}
                            <StatusBadge $active={autoReloadEnabled}>
                                <span>Auto-reload: {autoReloadEnabled ? 'ON' : 'OFF'}</span>
                                <ToggleButton
                                    $active={autoReloadEnabled}
                                    onClick={toggleAutoReload}
                                    disabled={dataSource !== 'live-file'}
                                >
                                    {autoReloadEnabled ? 'Disable' : 'Enable'}
                                </ToggleButton>
                            </StatusBadge>
                            {isLoading && (
                                <LoadingIndicator>
                                    <span>🔄</span>
                                    <span>Loading data...</span>
                                </LoadingIndicator>
                            )}
                            <TestButton onClick={toggleTestGraph}>
                                {showTestGraph ? 'Show Real Graph' : 'Show Test Graph'}
                            </TestButton>
                        </StatusIndicators>
                    </HeaderTop>

                    <DataSourceSelector>
                        <span style={{ fontSize: '0.9rem', color: '#666', marginRight: '0.5rem' }}>
                            Data Source:
                        </span>
                        <DataSourceButton
                            $active={dataSource === 'live-file'}
                            onClick={() => handleDataSourceChange('live-file')}
                        >
                            Live File (Complex Schema)
                        </DataSourceButton>
                        <DataSourceButton
                            $active={dataSource === 'example'}
                            onClick={() => handleDataSourceChange('example')}
                        >
                            Example Plan (Simple Schema)
                        </DataSourceButton>
                        <DataSourceButton
                            $active={dataSource === 'custom'}
                            disabled={true}
                        >
                            Custom Upload {dataSource === 'custom' && '✓'}
                        </DataSourceButton>
                    </DataSourceSelector>

                    <FileUpload onFileUpload={handleFileUpload} />

                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                        💡 <strong>Schema Support:</strong> This visualizer supports both simple project schemas (stories in root) and complex execution schemas (live monitoring data).
                        {schemaInfo?.supportsRealtime && dataSource === 'live-file' && (
                            <span> Real-time monitoring is enabled for this format.</span>
                        )}
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