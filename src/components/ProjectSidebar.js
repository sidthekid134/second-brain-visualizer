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
            case 'ready': return '#e8f5e8';
            case 'blocked': return '#e9ecef';
            case 'in_progress': return '#cce5ff';
            case 'pending': return '#e7f3ff';
            case 'done': return '#d4edda';
            case 'failed': return '#f8d7da';
            case 'error': return '#f8d7da';
            default: return '#f8f9fa';
        }
    }};
  color: ${props => {
        switch (props.$status) {
            case 'ready': return '#2e7d32';
            case 'blocked': return '#6c757d';
            case 'in_progress': return '#004085';
            case 'pending': return '#0056b3';
            case 'done': return '#155724';
            case 'failed': return '#721c24';
            case 'error': return '#721c24';
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

    const { project_info, execution_status, current_execution, project_structure, phase_completion, statistics } = projectData;
    const stories = project_structure?.stories || [];
    const schemaType = projectData.schema_type;

    return (
        <SidebarContainer>
            <Section>
                <SectionTitle>Project Overview</SectionTitle>
                <InfoItem>
                    <Label>Schema:</Label>
                    <Value>{schemaType === 'live-file' ? 'Live Execution' : 'Simple Project'}</Value>
                </InfoItem>
                <InfoItem>
                    <Label>ID:</Label>
                    <Value>{project_info?.id || 'N/A'}</Value>
                </InfoItem>
                <InfoItem>
                    <Label>Name:</Label>
                    <Value>{project_info?.name || 'Unnamed Project'}</Value>
                </InfoItem>
                <InfoItem>
                    <Label>Status:</Label>
                    <Value>{project_info?.status || 'Unknown'}</Value>
                </InfoItem>
                {execution_status && (
                    <>
                        <InfoItem>
                            <Label>Budget:</Label>
                            <Value>{execution_status.budget_used || 0} / {execution_status.budget_limit || 0} tokens</Value>
                        </InfoItem>
                        <InfoItem>
                            <Label>Stories:</Label>
                            <Value>{execution_status.total_stories || stories.length}</Value>
                        </InfoItem>
                        {execution_status.total_agents > 0 && (
                            <InfoItem>
                                <Label>Agents:</Label>
                                <Value>{execution_status.total_agents}</Value>
                            </InfoItem>
                        )}
                        {execution_status.total_messages > 0 && (
                            <InfoItem>
                                <Label>Messages:</Label>
                                <Value>{execution_status.total_messages}</Value>
                            </InfoItem>
                        )}
                    </>
                )}
                <InfoItem>
                    <Label>Created:</Label>
                    <Value>{project_info?.created_at ? new Date(project_info.created_at).toLocaleDateString() : 'N/A'}</Value>
                </InfoItem>
            </Section>

            {/* Phase Progress - Support both formats */}
            {((current_execution?.current_phase?.phase_progress) || phase_completion) && (
                <Section>
                    <SectionTitle>Phase Progress</SectionTitle>
                    <PhaseProgress>
                        {(() => {
                            // Handle live-file format
                            if (current_execution?.current_phase?.phase_progress) {
                                return Object.entries(current_execution.current_phase.phase_progress).map(([phase, data]) => (
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
                                ));
                            }

                            // Handle simple format
                            if (phase_completion) {
                                return Object.entries(phase_completion).map(([phase, percentage]) => (
                                    <PhaseItem key={phase}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                            <span>{phase.replace('_', ' ').toUpperCase()}</span>
                                            <span>{percentage.toFixed(1)}%</span>
                                        </div>
                                        <PhaseBar>
                                            <PhaseBarFill
                                                $progress={percentage}
                                                $active={percentage > 0 && percentage < 100}
                                            />
                                        </PhaseBar>
                                    </PhaseItem>
                                ));
                            }

                            return null;
                        })()}
                    </PhaseProgress>
                </Section>
            )}

            {/* Enhanced Statistics Section */}
            {(statistics || project_structure?.dependency_analysis) && (
                <Section>
                    <SectionTitle>Analysis</SectionTitle>

                    {statistics && (
                        <>
                            <InfoItem>
                                <Label>Completed:</Label>
                                <Value>{statistics.completed_stories || 0} / {statistics.total_stories || stories.length}</Value>
                            </InfoItem>
                            <InfoItem>
                                <Label>Ready:</Label>
                                <Value>{statistics.ready_stories || 0}</Value>
                            </InfoItem>
                            <InfoItem>
                                <Label>Blocked:</Label>
                                <Value>{statistics.blocked_stories || 0}</Value>
                            </InfoItem>
                            {statistics.graph_density !== undefined && (
                                <InfoItem>
                                    <Label>Avg Dependencies:</Label>
                                    <Value>{statistics.graph_density.toFixed(2)}</Value>
                                </InfoItem>
                            )}
                        </>
                    )}

                    {project_structure?.dependency_analysis && (
                        <>
                            {project_structure.dependency_analysis.estimated_phases && (
                                <InfoItem>
                                    <Label>Estimated Phases:</Label>
                                    <Value>{project_structure.dependency_analysis.estimated_phases}</Value>
                                </InfoItem>
                            )}
                            {project_structure.dependency_analysis.parallelization_score !== undefined && (
                                <InfoItem>
                                    <Label>Parallelization:</Label>
                                    <Value>{(project_structure.dependency_analysis.parallelization_score * 100).toFixed(1)}%</Value>
                                </InfoItem>
                            )}
                            {project_structure.dependency_analysis.critical_path && project_structure.dependency_analysis.critical_path.length > 0 && (
                                <>
                                    <Label>Critical Path ({project_structure.dependency_analysis.critical_path.length} stories):</Label>
                                    <CriticalPath>
                                        {project_structure.dependency_analysis.critical_path.slice(0, 5).map(storyId => (
                                            <PathItem key={storyId}>{storyId}</PathItem>
                                        ))}
                                        {project_structure.dependency_analysis.critical_path.length > 5 && (
                                            <PathItem>+{project_structure.dependency_analysis.critical_path.length - 5} more</PathItem>
                                        )}
                                    </CriticalPath>
                                </>
                            )}
                        </>
                    )}
                </Section>
            )}

            {/* Stories Section with better status handling */}
            <Section>
                <SectionTitle>Stories ({stories.length})</SectionTitle>
                <StoryList>
                    {stories.map(story => (
                        <StoryItem
                            key={story.id}
                            selected={selectedStory?.id === story.id}
                            onClick={() => onStorySelect(story)}
                        >
                            <StoryId>{story.id}</StoryId>
                            <StoryTitle>{story.objective || 'No objective'}</StoryTitle>
                            <div>
                                <StoryStatus $status={story.status || 'unknown'}>
                                    {story.status || 'unknown'}
                                </StoryStatus>
                                {story.priority && (
                                    <span style={{
                                        marginLeft: '0.5rem',
                                        fontSize: '0.7rem',
                                        color: story.priority === 'high' ? '#d73527' : story.priority === 'medium' ? '#f57c00' : '#388e3c',
                                        fontWeight: 'bold'
                                    }}>
                                        {story.priority.toUpperCase()}
                                    </span>
                                )}
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

            {/* Enhanced Selected Story Section */}
            {selectedStory && (
                <Section>
                    <SectionTitle>Selected Story</SectionTitle>
                    <InfoItem>
                        <Label>ID:</Label>
                        <Value>{selectedStory.id}</Value>
                    </InfoItem>
                    <InfoItem>
                        <Label>Objective:</Label>
                        <Value style={{ fontSize: '0.85rem', lineHeight: '1.3' }}>
                            {selectedStory.objective || 'No objective specified'}
                        </Value>
                    </InfoItem>
                    {selectedStory.status && (
                        <InfoItem>
                            <Label>Status:</Label>
                            <Value>
                                <StoryStatus $status={selectedStory.status}>
                                    {selectedStory.status}
                                </StoryStatus>
                            </Value>
                        </InfoItem>
                    )}
                    {selectedStory.priority && (
                        <InfoItem>
                            <Label>Priority:</Label>
                            <Value>{selectedStory.priority}</Value>
                        </InfoItem>
                    )}
                    {selectedStory.complexity_score && (
                        <InfoItem>
                            <Label>Complexity:</Label>
                            <Value>{selectedStory.complexity_score}/5</Value>
                        </InfoItem>
                    )}
                    {selectedStory.work_type && (
                        <InfoItem>
                            <Label>Work Type:</Label>
                            <Value>{selectedStory.work_type.replace('_', ' ')}</Value>
                        </InfoItem>
                    )}
                    <InfoItem>
                        <Label>Dependencies:</Label>
                        <Value>{selectedStory.dependencies?.length || 0}</Value>
                    </InfoItem>
                    <InfoItem>
                        <Label>Dependents:</Label>
                        <Value>{selectedStory.dependents?.length || 0}</Value>
                    </InfoItem>
                    {selectedStory.milestone && (
                        <InfoItem>
                            <Label>Milestone:</Label>
                            <Value>{selectedStory.milestone}</Value>
                        </InfoItem>
                    )}
                    {selectedStory.owner && (
                        <InfoItem>
                            <Label>Owner:</Label>
                            <Value>{selectedStory.owner}</Value>
                        </InfoItem>
                    )}

                    {selectedStory.acceptance_criteria && selectedStory.acceptance_criteria.length > 0 && (
                        <>
                            <Label>Acceptance Criteria:</Label>
                            <ul style={{ margin: '0.5rem 0', paddingLeft: '1rem' }}>
                                {selectedStory.acceptance_criteria.map((criteria, index) => (
                                    <li key={index} style={{ fontSize: '0.8rem', margin: '0.25rem 0', lineHeight: '1.3' }}>
                                        {criteria}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}

                    {selectedStory.implementation_notes && selectedStory.implementation_notes.length > 0 && (
                        <>
                            <Label>Implementation Notes:</Label>
                            <ul style={{ margin: '0.5rem 0', paddingLeft: '1rem' }}>
                                {selectedStory.implementation_notes.map((note, index) => (
                                    <li key={index} style={{ fontSize: '0.8rem', margin: '0.25rem 0', lineHeight: '1.3' }}>
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