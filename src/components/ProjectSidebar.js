import React from 'react';
import styled from 'styled-components';

const SidebarContainer = styled.div`
  width: 350px;
  background: white;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
  height: 100vh;
`;

const Section = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
`;

const SectionTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.1rem;
`;

const InfoItem = styled.div`
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
`;

const Label = styled.span`
  font-weight: bold;
  color: #666;
`;

const Value = styled.span`
  color: #333;
  margin-left: 0.5rem;
`;

const StoryList = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

const StoryItem = styled.div`
  padding: 0.5rem;
  margin: 0.25rem 0;
  background: ${props => props.selected ? '#e3f2fd' : '#f8f9fa'};
  border: 1px solid ${props => props.selected ? '#2196f3' : '#e0e0e0'};
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.selected ? '#e3f2fd' : '#e9ecef'};
  }
`;

const StoryId = styled.div`
  font-weight: bold;
  color: #333;
  margin-bottom: 0.25rem;
`;

const StoryTitle = styled.div`
  color: #666;
  margin-bottom: 0.25rem;
`;

const StoryStatus = styled.span`
  padding: 0.2rem 0.4rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: bold;
  text-transform: uppercase;
  background: ${props => {
        switch (props.$status) {
            case 'ready': return '#d4edda';
            case 'blocked': return '#f8d7da';
            case 'in_progress': return '#fff3cd';
            case 'done': return '#d1ecf1';
            default: return '#f8f9fa';
        }
    }};
  color: ${props => {
        switch (props.$status) {
            case 'ready': return '#155724';
            case 'blocked': return '#721c24';
            case 'in_progress': return '#856404';
            case 'done': return '#0c5460';
            default: return '#333';
        }
    }};
`;

const CriticalPath = styled.div`
  background: #fff3cd;
  padding: 0.5rem;
  border-radius: 4px;
  margin-top: 0.5rem;
`;

const PathItem = styled.span`
  display: inline-block;
  background: #ffc107;
  color: #212529;
  padding: 0.2rem 0.4rem;
  margin: 0.1rem;
  border-radius: 3px;
  font-size: 0.8rem;
`;

const PhaseProgress = styled.div`
  margin-top: 1rem;
`;

const PhaseItem = styled.div`
  margin-bottom: 0.5rem;
`;

const PhaseBar = styled.div`
  width: 100%;
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  margin-top: 0.25rem;
  overflow: hidden;
`;

const PhaseBarFill = styled.div`
  width: ${props => props.$progress}%;
  height: 100%;
  background: ${props => props.$active ? '#28a745' : '#6c757d'};
  transition: width 0.3s ease;
`;

const ProjectSidebar = ({ projectData, selectedStory, onStorySelect }) => {
    if (!projectData) {
        return (
            <SidebarContainer>
                <Section>
                    <SectionTitle>No Project Loaded</SectionTitle>
                    <p>Upload a project plan to see details here.</p>
                </Section>
            </SidebarContainer>
        );
    }

    const { project_info, execution_status, current_execution, project_structure } = projectData;
    const stories = project_structure?.stories || [];
    const currentPhase = current_execution?.current_phase;

    return (
        <SidebarContainer>
            <Section>
                <SectionTitle>Project Overview</SectionTitle>
                <InfoItem>
                    <Label>ID:</Label>
                    <Value>{project_info.id}</Value>
                </InfoItem>
                <InfoItem>
                    <Label>Name:</Label>
                    <Value>{project_info.name}</Value>
                </InfoItem>
                <InfoItem>
                    <Label>Status:</Label>
                    <Value>{project_info.status}</Value>
                </InfoItem>
                <InfoItem>
                    <Label>Budget:</Label>
                    <Value>{execution_status.budget_used} / {execution_status.budget_limit} tokens</Value>
                </InfoItem>
                <InfoItem>
                    <Label>Stories:</Label>
                    <Value>{execution_status.total_stories}</Value>
                </InfoItem>
                <InfoItem>
                    <Label>Created:</Label>
                    <Value>{new Date(project_info.created_at).toLocaleDateString()}</Value>
                </InfoItem>
            </Section>

            {currentPhase && (
                <Section>
                    <SectionTitle>Phase Progress</SectionTitle>
                    <PhaseProgress>
                        {Object.entries(currentPhase.phase_progress).map(([phase, data]) => (
                            <PhaseItem key={phase}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                    <span>{phase.replace('_', ' ').toUpperCase()}</span>
                                    <span>{data.completion_percentage.toFixed(1)}%</span>
                                </div>
                                <PhaseBar>
                                    <PhaseBarFill
                                        $progress={data.completion_percentage}
                                        $active={data.is_active}
                                    />
                                </PhaseBar>
                            </PhaseItem>
                        ))}
                    </PhaseProgress>
                </Section>
            )}

            {project_structure.dependency_analysis && (
                <Section>
                    <SectionTitle>Dependency Analysis</SectionTitle>
                    <InfoItem>
                        <Label>Total Dependencies:</Label>
                        <Value>{project_structure.dependency_analysis.total_dependencies}</Value>
                    </InfoItem>
                    <InfoItem>
                        <Label>Estimated Phases:</Label>
                        <Value>{project_structure.dependency_analysis.estimated_phases}</Value>
                    </InfoItem>
                    <InfoItem>
                        <Label>Parallelization Score:</Label>
                        <Value>{(project_structure.dependency_analysis.parallelization_score * 100).toFixed(1)}%</Value>
                    </InfoItem>

                    {project_structure.dependency_analysis.critical_path && (
                        <>
                            <Label>Critical Path:</Label>
                            <CriticalPath>
                                {project_structure.dependency_analysis.critical_path.map(storyId => (
                                    <PathItem key={storyId}>{storyId}</PathItem>
                                ))}
                            </CriticalPath>
                        </>
                    )}
                </Section>
            )}

            <Section>
                <SectionTitle>Stories</SectionTitle>
                <StoryList>
                    {stories.map(story => (
                        <StoryItem
                            key={story.id}
                            selected={selectedStory?.id === story.id}
                            onClick={() => onStorySelect(story)}
                        >
                            <StoryId>{story.id}</StoryId>
                            <StoryTitle>{story.objective}</StoryTitle>
                            <div>
                                <StoryStatus $status={story.status}>{story.status}</StoryStatus>
                                {story.milestone && (
                                    <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: '#666' }}>
                                        {story.milestone}
                                    </span>
                                )}
                            </div>
                        </StoryItem>
                    ))}
                </StoryList>
            </Section>

            {selectedStory && (
                <Section>
                    <SectionTitle>Selected Story</SectionTitle>
                    <InfoItem>
                        <Label>ID:</Label>
                        <Value>{selectedStory.id}</Value>
                    </InfoItem>
                    <InfoItem>
                        <Label>Objective:</Label>
                        <Value>{selectedStory.objective}</Value>
                    </InfoItem>
                    <InfoItem>
                        <Label>Priority:</Label>
                        <Value>{selectedStory.priority}</Value>
                    </InfoItem>
                    <InfoItem>
                        <Label>Complexity:</Label>
                        <Value>{selectedStory.complexity_score}/5</Value>
                    </InfoItem>
                    <InfoItem>
                        <Label>Work Type:</Label>
                        <Value>{selectedStory.work_type}</Value>
                    </InfoItem>
                    <InfoItem>
                        <Label>Dependencies:</Label>
                        <Value>{selectedStory.dependencies?.length || 0}</Value>
                    </InfoItem>
                    <InfoItem>
                        <Label>Dependents:</Label>
                        <Value>{selectedStory.dependents?.length || 0}</Value>
                    </InfoItem>

                    {selectedStory.acceptance_criteria && (
                        <>
                            <Label>Acceptance Criteria:</Label>
                            <ul style={{ margin: '0.5rem 0', paddingLeft: '1rem' }}>
                                {selectedStory.acceptance_criteria.map((criteria, index) => (
                                    <li key={index} style={{ fontSize: '0.8rem', margin: '0.25rem 0' }}>
                                        {criteria}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}

                    {selectedStory.implementation_notes && (
                        <>
                            <Label>Implementation Notes:</Label>
                            <ul style={{ margin: '0.5rem 0', paddingLeft: '1rem' }}>
                                {selectedStory.implementation_notes.map((note, index) => (
                                    <li key={index} style={{ fontSize: '0.8rem', margin: '0.25rem 0' }}>
                                        {note}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </Section>
            )}
        </SidebarContainer>
    );
};

export default ProjectSidebar; 