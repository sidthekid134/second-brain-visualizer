import React, { useState } from 'react';
import styled from 'styled-components';

const BuilderContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const Header = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: white;
  padding: 30px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const Title = styled.h1`
  margin: 0 0 10px 0;
  font-size: 2rem;
  font-weight: 700;
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 1.1rem;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.5;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  gap: 30px;
  padding: 30px;
`;

const FormSection = styled.div`
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const PreviewSection = styled.div`
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const SectionTitle = styled.h2`
  margin: 0 0 20px 0;
  font-size: 1.4rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  background: white;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  background: white;
  min-height: 120px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  background: white;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const TagInput = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 8px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  min-height: 48px;

  &:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Tag = styled.span`
  background: #3b82f6;
  color: white;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const TagRemove = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 0.7rem;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const TagInputField = styled.input`
  border: none;
  outline: none;
  background: transparent;
  flex: 1;
  min-width: 100px;
  padding: 4px;
  font-size: 1rem;
`;

const Button = styled.button`
  background: ${props => props.variant === 'secondary' ? '#6b7280' : '#3b82f6'};
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: ${props => props.variant === 'secondary' ? '#4b5563' : '#2563eb'};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const PreviewCard = styled.div`
  background: #f8fafc;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
`;

const PreviewTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
`;

const PreviewContent = styled.p`
  margin: 0;
  color: #6b7280;
  line-height: 1.5;
`;

const PreviewMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
`;

const MetaTag = styled.span`
  background: #e5e7eb;
  color: #374151;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 500;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #9ca3af;
`;

function IdeaBuilder() {
    const [idea, setIdea] = useState({
        title: '',
        description: '',
        requirements: '',
        constraints: '',
        priority: 'medium',
        complexity: 'medium',
        estimatedTime: '',
        tags: []
    });

    const [tagInput, setTagInput] = useState('');
    const [savedIdeas, setSavedIdeas] = useState([]);

    const handleInputChange = (field, value) => {
        setIdea(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !idea.tags.includes(tagInput.trim())) {
            setIdea(prev => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()]
            }));
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setIdea(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            handleAddTag();
        }
    };

    const handleSaveIdea = () => {
        if (idea.title.trim()) {
            const newIdea = {
                ...idea,
                id: Date.now(),
                createdAt: new Date().toISOString()
            };
            setSavedIdeas(prev => [newIdea, ...prev]);
            setIdea({
                title: '',
                description: '',
                requirements: '',
                constraints: '',
                priority: 'medium',
                complexity: 'medium',
                estimatedTime: '',
                tags: []
            });
        }
    };

    const handleGeneratePlan = () => {
        alert('🚀 Plan generation coming soon! This will use AI to convert your ideas into a structured execution plan.');
    };

    const handleClearForm = () => {
        setIdea({
            title: '',
            description: '',
            requirements: '',
            constraints: '',
            priority: 'medium',
            complexity: 'medium',
            estimatedTime: '',
            tags: []
        });
        setTagInput('');
    };

    return (
        <BuilderContainer>
            <Header>
                <Title>💡 Idea Builder</Title>
                <Subtitle>
                    Transform your ideas into structured execution plans. Describe your project vision,
                    requirements, and constraints, and we'll help you build a comprehensive plan.
                </Subtitle>
            </Header>

            <MainContent>
                <FormSection>
                    <SectionTitle>
                        ✨ Create New Idea
                    </SectionTitle>

                    <FormGroup>
                        <Label>Project Title</Label>
                        <Input
                            type="text"
                            placeholder="e.g., AI-powered task management system"
                            value={idea.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>Description</Label>
                        <TextArea
                            placeholder="Describe your project idea in detail. What problem does it solve? Who is the target audience?"
                            value={idea.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>Technical Requirements</Label>
                        <TextArea
                            placeholder="List technical requirements, features, and functionalities needed..."
                            value={idea.requirements}
                            onChange={(e) => handleInputChange('requirements', e.target.value)}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>Constraints & Limitations</Label>
                        <TextArea
                            placeholder="Budget constraints, time limitations, technical restrictions, team size, etc."
                            value={idea.constraints}
                            onChange={(e) => handleInputChange('constraints', e.target.value)}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>Priority Level</Label>
                        <Select
                            value={idea.priority}
                            onChange={(e) => handleInputChange('priority', e.target.value)}
                        >
                            <option value="low">Low - Nice to have</option>
                            <option value="medium">Medium - Important</option>
                            <option value="high">High - Critical</option>
                            <option value="urgent">Urgent - Immediate attention</option>
                        </Select>
                    </FormGroup>

                    <FormGroup>
                        <Label>Complexity Estimate</Label>
                        <Select
                            value={idea.complexity}
                            onChange={(e) => handleInputChange('complexity', e.target.value)}
                        >
                            <option value="simple">Simple - Few days</option>
                            <option value="medium">Medium - Few weeks</option>
                            <option value="complex">Complex - Few months</option>
                            <option value="enterprise">Enterprise - 6+ months</option>
                        </Select>
                    </FormGroup>

                    <FormGroup>
                        <Label>Estimated Timeline</Label>
                        <Input
                            type="text"
                            placeholder="e.g., 3 months, 6 weeks, Q2 2024"
                            value={idea.estimatedTime}
                            onChange={(e) => handleInputChange('estimatedTime', e.target.value)}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>Tags</Label>
                        <TagInput>
                            {idea.tags.map(tag => (
                                <Tag key={tag}>
                                    {tag}
                                    <TagRemove onClick={() => handleRemoveTag(tag)}>
                                        ×
                                    </TagRemove>
                                </Tag>
                            ))}
                            <TagInputField
                                placeholder="Add tags (press Enter)"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                onBlur={handleAddTag}
                            />
                        </TagInput>
                    </FormGroup>

                    <ButtonGroup>
                        <Button onClick={handleSaveIdea} disabled={!idea.title.trim()}>
                            💾 Save Idea
                        </Button>
                        <Button onClick={handleGeneratePlan} disabled={!idea.title.trim()}>
                            🚀 Generate Plan
                        </Button>
                        <Button variant="secondary" onClick={handleClearForm}>
                            🗑️ Clear
                        </Button>
                    </ButtonGroup>
                </FormSection>

                <PreviewSection>
                    <SectionTitle>
                        📋 Saved Ideas ({savedIdeas.length})
                    </SectionTitle>

                    {savedIdeas.length === 0 ? (
                        <EmptyState>
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💭</div>
                            <div>No ideas saved yet.</div>
                            <div style={{ fontSize: '0.9rem', marginTop: '8px' }}>
                                Start by creating your first project idea!
                            </div>
                        </EmptyState>
                    ) : (
                        savedIdeas.map(savedIdea => (
                            <PreviewCard key={savedIdea.id}>
                                <PreviewTitle>{savedIdea.title}</PreviewTitle>
                                <PreviewContent>
                                    {savedIdea.description || 'No description provided'}
                                </PreviewContent>
                                <PreviewMeta>
                                    <MetaTag>Priority: {savedIdea.priority}</MetaTag>
                                    <MetaTag>Complexity: {savedIdea.complexity}</MetaTag>
                                    {savedIdea.estimatedTime && (
                                        <MetaTag>Timeline: {savedIdea.estimatedTime}</MetaTag>
                                    )}
                                    {savedIdea.tags.map(tag => (
                                        <MetaTag key={tag} style={{ background: '#dbeafe', color: '#1e40af' }}>
                                            {tag}
                                        </MetaTag>
                                    ))}
                                </PreviewMeta>
                            </PreviewCard>
                        ))
                    )}

                    {savedIdeas.length > 0 && (
                        <div style={{
                            fontSize: '0.8rem',
                            color: '#6b7280',
                            textAlign: 'center',
                            marginTop: '20px',
                            padding: '16px',
                            background: '#f8fafc',
                            borderRadius: '12px',
                            border: '1px solid #e5e7eb'
                        }}>
                            💡 <strong>Coming Soon:</strong> AI-powered plan generation will convert these ideas
                            into structured execution plans with milestones, stories, and dependencies.
                        </div>
                    )}
                </PreviewSection>
            </MainContent>
        </BuilderContainer>
    );
}

export default IdeaBuilder; 