import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { usePlan } from '../context/PlanContext';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const BuilderContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
`;

const Header = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: white;
  padding: 30px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  animation: ${fadeIn} 0.6s ease-out;
`;

const Title = styled.h1`
  margin: 0 0 10px 0;
  font-size: 2.2rem;
  font-weight: 700;
  background: linear-gradient(45deg, #fff, #e0e7ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 1.1rem;
  opacity: 0.9;
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.6;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  gap: 30px;
  padding: 30px;
  animation: ${fadeIn} 0.8s ease-out 0.2s both;
`;

const LeftPanel = styled.div`
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Section = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: ${slideIn} 0.6s ease-out;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
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

const StepIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 30px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
`;

const Step = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => props.active ? '#3b82f6' : props.completed ? '#10b981' : '#e5e7eb'};
  color: ${props => props.active || props.completed ? 'white' : '#6b7280'};
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: scale(1.1);
  }
`;

const StepConnector = styled.div`
  flex: 1;
  height: 2px;
  background: ${props => props.completed ? '#10b981' : '#e5e7eb'};
  transition: all 0.3s ease;
`;

const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 20px;
`;

const TemplateCard = styled.div`
  padding: 20px;
  border: 2px solid ${props => props.selected ? '#3b82f6' : '#e5e7eb'};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.selected ? '#eff6ff' : 'white'};

  &:hover {
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }
`;

const TemplateIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 12px;
`;

const TemplateTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
`;

const TemplateDescription = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: #6b7280;
  line-height: 1.4;
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
  animation: ${pulse} 0.3s ease-out;
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
  background: ${props => {
    if (props.variant === 'secondary') return '#6b7280';
    if (props.variant === 'success') return '#10b981';
    if (props.variant === 'warning') return '#f59e0b';
    return '#3b82f6';
  }};
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
    background: ${props => {
    if (props.variant === 'secondary') return '#4b5563';
    if (props.variant === 'success') return '#059669';
    if (props.variant === 'warning') return '#d97706';
    return '#2563eb';
  }};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
  flex-wrap: wrap;
`;

const ValidationMessage = styled.div`
  color: ${props => props.type === 'error' ? '#dc2626' : '#059669'};
  font-size: 0.8rem;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin: 16px 0;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  border-radius: 4px;
  transition: width 0.3s ease;
  width: ${props => props.progress}%;
`;

const QuickSuggestions = styled.div`
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  margin-top: 12px;
`;

const SuggestionTitle = styled.h4`
  margin: 0 0 8px 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
`;

const SuggestionList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const SuggestionChip = styled.button`
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 0.8rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #9ca3af;
`;

const IdeaCard = styled.div`
  background: #f8fafc;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }
`;

const IdeaTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
`;

const IdeaContent = styled.p`
  margin: 0 0 12px 0;
  color: #6b7280;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const IdeaMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const MetaTag = styled.span`
  background: #e5e7eb;
  color: #374151;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 500;
`;

const templates = [
  {
    id: 'web-app',
    icon: '🌐',
    title: 'Web Application',
    description: 'Full-stack web application with frontend and backend components',
    fields: {
      title: 'Web Application Project',
      description: 'A modern web application that provides...',
      requirements: 'Frontend: React/Vue/Angular\nBackend: Node.js/Python/Java\nDatabase: PostgreSQL/MongoDB\nAuthentication: JWT/OAuth',
      constraints: 'Budget: $X\nTimeline: X months\nTeam size: X developers',
      priority: 'high',
      complexity: 'complex',
      estimatedTime: '3-6 months',
      tags: ['web', 'frontend', 'backend', 'database']
    }
  },
  {
    id: 'mobile-app',
    icon: '📱',
    title: 'Mobile Application',
    description: 'Cross-platform or native mobile application',
    fields: {
      title: 'Mobile Application Project',
      description: 'A mobile application that allows users to...',
      requirements: 'Platform: iOS/Android/Cross-platform\nFramework: React Native/Flutter/Swift/Kotlin\nFeatures: Push notifications, offline sync',
      constraints: 'App store guidelines\nDevice compatibility\nPerformance requirements',
      priority: 'medium',
      complexity: 'complex',
      estimatedTime: '4-8 months',
      tags: ['mobile', 'ios', 'android', 'app']
    }
  },
  {
    id: 'api-service',
    icon: '🔌',
    title: 'API Service',
    description: 'RESTful API or microservice backend',
    fields: {
      title: 'API Service Project',
      description: 'A robust API service that provides...',
      requirements: 'RESTful endpoints\nAuthentication & authorization\nRate limiting\nDocumentation\nTesting suite',
      constraints: 'Scalability requirements\nSecurity standards\nPerformance benchmarks',
      priority: 'high',
      complexity: 'medium',
      estimatedTime: '2-4 months',
      tags: ['api', 'backend', 'microservice', 'rest']
    }
  },
  {
    id: 'data-analysis',
    icon: '📊',
    title: 'Data Analysis',
    description: 'Data processing and analytics project',
    fields: {
      title: 'Data Analysis Project',
      description: 'Analysis of data to uncover insights about...',
      requirements: 'Data collection and cleaning\nStatistical analysis\nVisualization dashboards\nReporting tools',
      constraints: 'Data privacy compliance\nProcessing time limits\nStorage requirements',
      priority: 'medium',
      complexity: 'medium',
      estimatedTime: '1-3 months',
      tags: ['data', 'analytics', 'visualization', 'insights']
    }
  },
  {
    id: 'ai-ml',
    icon: '🤖',
    title: 'AI/ML Project',
    description: 'Machine learning or artificial intelligence solution',
    fields: {
      title: 'AI/ML Project',
      description: 'An AI-powered solution that uses machine learning to...',
      requirements: 'Data collection and preprocessing\nModel training and validation\nModel deployment\nMonitoring and maintenance',
      constraints: 'Training data availability\nCompute resources\nAccuracy requirements',
      priority: 'high',
      complexity: 'enterprise',
      estimatedTime: '6-12 months',
      tags: ['ai', 'machine-learning', 'data-science', 'automation']
    }
  },
  {
    id: 'custom',
    icon: '✨',
    title: 'Custom Project',
    description: 'Start from scratch with your own specifications',
    fields: {
      title: '',
      description: '',
      requirements: '',
      constraints: '',
      priority: 'medium',
      complexity: 'medium',
      estimatedTime: '',
      tags: []
    }
  }
];

const suggestionsByField = {
  requirements: [
    'User authentication', 'Database integration', 'API development',
    'Responsive design', 'Real-time features', 'Payment processing',
    'File upload/download', 'Search functionality', 'Admin dashboard',
    'Email notifications', 'Mobile optimization', 'Security measures'
  ],
  constraints: [
    'Limited budget', 'Tight timeline', 'Small team',
    'Legacy system integration', 'Compliance requirements', 'Performance constraints',
    'Scalability needs', 'Third-party dependencies', 'Platform limitations'
  ],
  tags: [
    'react', 'javascript', 'python', 'node.js', 'database',
    'api', 'frontend', 'backend', 'mobile', 'web',
    'ai', 'ml', 'data', 'analytics', 'security'
  ]
};

function IdeaBuilder() {
  const { planData, dispatch } = usePlan();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
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
  const [validation, setValidation] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Load saved ideas from localStorage
    const stored = localStorage.getItem('second-brain-ideas');
    if (stored) {
      setSavedIdeas(JSON.parse(stored));
    }
  }, []);

  const validateStep = (step) => {
    const errors = {};

    switch (step) {
      case 2:
        if (!idea.title.trim()) errors.title = 'Title is required';
        if (!idea.description.trim()) errors.description = 'Description is required';
        break;
      case 3:
        if (!idea.requirements.trim()) errors.requirements = 'Requirements are required';
        break;
      case 4:
        if (!idea.estimatedTime.trim()) errors.estimatedTime = 'Timeline estimate is required';
        break;
    }

    setValidation(errors);
    return Object.keys(errors).length === 0;
  };

  const getProgress = () => {
    let progress = 0;
    if (currentStep >= 1) progress += 20; // Template selection
    if (currentStep >= 2 && idea.title && idea.description) progress += 20; // Basic info
    if (currentStep >= 3 && idea.requirements) progress += 20; // Requirements
    if (currentStep >= 4 && idea.estimatedTime) progress += 20; // Timeline
    if (currentStep >= 5) progress += 20; // Review
    return progress;
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setIdea(template.fields);
    setCurrentStep(2);
  };

  const handleInputChange = (field, value) => {
    setIdea(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear validation error for this field
    if (validation[field]) {
      setValidation(prev => {
        const newValidation = { ...prev };
        delete newValidation[field];
        return newValidation;
      });
    }
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

  const handleSuggestionClick = (field, suggestion) => {
    if (field === 'tags') {
      if (!idea.tags.includes(suggestion)) {
        setIdea(prev => ({
          ...prev,
          tags: [...prev.tags, suggestion]
        }));
      }
    } else {
      const currentValue = idea[field];
      const newValue = currentValue ? `${currentValue}\n${suggestion}` : suggestion;
      handleInputChange(field, newValue);
    }
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(5, prev + 1));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSaveIdea = () => {
    if (!idea.title.trim()) return;

    const newIdea = {
      ...idea,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      template: selectedTemplate?.id || 'custom'
    };

    const updatedIdeas = [newIdea, ...savedIdeas];
    setSavedIdeas(updatedIdeas);
    localStorage.setItem('second-brain-ideas', JSON.stringify(updatedIdeas));

    // Reset form
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
    setCurrentStep(1);
    setSelectedTemplate(null);
  };

  const handleGeneratePlan = async () => {
    if (!idea.title.trim()) return;

    setIsGenerating(true);

    try {
      // Simulate AI generation delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create a basic project structure from the idea
      const projectId = `proj_${Date.now()}`;
      const milestoneId = `milestone_${Date.now()}`;
      const storyId = `story_${Date.now()}`;

      const newProject = {
        project: {
          id: projectId,
          name: idea.title,
          description: idea.description,
          status: 'planned',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          progress: {
            completion_percentage: 0
          },
          budget: {
            limit: 10000, // Default budget
            used: 0
          },
          milestones: [{
            id: milestoneId,
            name: 'Initial Development',
            status: 'planned',
            stories: [storyId],
            manager_id: null
          }]
        },
        stories: [{
          id: storyId,
          objective: idea.title,
          milestone: milestoneId,
          acceptance_criteria: idea.requirements.split('\n').filter(req => req.trim()),
          status: 'planned',
          owner_id: 'agent_1',
          dependencies: [],
          implementation_notes: idea.constraints.split('\n').filter(note => note.trim()),
          estimated_tokens: null,
          actual_tokens: null,
          complexity_score: idea.complexity === 'simple' ? 1 : idea.complexity === 'medium' ? 2 : idea.complexity === 'complex' ? 3 : 4,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          execution: {
            current: {
              status: 'planned',
              started_at: null,
              ended_at: null,
              duration_seconds: null,
              agent_id: 'agent_1',
              result: null,
              messages_count: null
            },
            history: []
          }
        }],
        agents: [{
          id: 'agent_1',
          name: 'Development Agent',
          role: 'engineer',
          manager_id: null,
          reports: [],
          milestone_ids: [milestoneId],
          assigned_story_ids: [storyId]
        }]
      };

      // Update the plan context
      dispatch({ type: 'SET_PLAN_DATA', payload: newProject });

      // Save the idea as well
      handleSaveIdea();

      alert('🎉 Plan generated successfully! Check the Plan Editor tab to see your project structure.');

    } catch (error) {
      console.error('Error generating plan:', error);
      alert('Error generating plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadIdea = (savedIdea) => {
    setIdea(savedIdea);
    setSelectedTemplate(templates.find(t => t.id === savedIdea.template) || null);
    setCurrentStep(5); // Go to review step
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Section>
            <SectionTitle>🎯 Choose a Template</SectionTitle>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>
              Select a template to get started quickly, or choose custom to build from scratch.
            </p>
            <TemplateGrid>
              {templates.map(template => (
                <TemplateCard
                  key={template.id}
                  selected={selectedTemplate?.id === template.id}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <TemplateIcon>{template.icon}</TemplateIcon>
                  <TemplateTitle>{template.title}</TemplateTitle>
                  <TemplateDescription>{template.description}</TemplateDescription>
                </TemplateCard>
              ))}
            </TemplateGrid>
          </Section>
        );

      case 2:
        return (
          <Section>
            <SectionTitle>📝 Basic Information</SectionTitle>

            <FormGroup>
              <Label>Project Title *</Label>
              <Input
                type="text"
                placeholder="e.g., AI-powered task management system"
                value={idea.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
              {validation.title && (
                <ValidationMessage type="error">⚠️ {validation.title}</ValidationMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label>Project Description *</Label>
              <TextArea
                placeholder="Describe your project idea in detail. What problem does it solve? Who is the target audience?"
                value={idea.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
              {validation.description && (
                <ValidationMessage type="error">⚠️ {validation.description}</ValidationMessage>
              )}
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
          </Section>
        );

      case 3:
        return (
          <Section>
            <SectionTitle>⚙️ Requirements & Features</SectionTitle>

            <FormGroup>
              <Label>Technical Requirements *</Label>
              <TextArea
                placeholder="List technical requirements, features, and functionalities needed..."
                value={idea.requirements}
                onChange={(e) => handleInputChange('requirements', e.target.value)}
              />
              {validation.requirements && (
                <ValidationMessage type="error">⚠️ {validation.requirements}</ValidationMessage>
              )}

              <QuickSuggestions>
                <SuggestionTitle>💡 Quick Add</SuggestionTitle>
                <SuggestionList>
                  {suggestionsByField.requirements.map(suggestion => (
                    <SuggestionChip
                      key={suggestion}
                      onClick={() => handleSuggestionClick('requirements', suggestion)}
                    >
                      {suggestion}
                    </SuggestionChip>
                  ))}
                </SuggestionList>
              </QuickSuggestions>
            </FormGroup>

            <FormGroup>
              <Label>Constraints & Limitations</Label>
              <TextArea
                placeholder="Budget constraints, time limitations, technical restrictions, team size, etc."
                value={idea.constraints}
                onChange={(e) => handleInputChange('constraints', e.target.value)}
              />

              <QuickSuggestions>
                <SuggestionTitle>💡 Common Constraints</SuggestionTitle>
                <SuggestionList>
                  {suggestionsByField.constraints.map(suggestion => (
                    <SuggestionChip
                      key={suggestion}
                      onClick={() => handleSuggestionClick('constraints', suggestion)}
                    >
                      {suggestion}
                    </SuggestionChip>
                  ))}
                </SuggestionList>
              </QuickSuggestions>
            </FormGroup>
          </Section>
        );

      case 4:
        return (
          <Section>
            <SectionTitle>📅 Timeline & Tags</SectionTitle>

            <FormGroup>
              <Label>Estimated Timeline *</Label>
              <Input
                type="text"
                placeholder="e.g., 3 months, 6 weeks, Q2 2024"
                value={idea.estimatedTime}
                onChange={(e) => handleInputChange('estimatedTime', e.target.value)}
              />
              {validation.estimatedTime && (
                <ValidationMessage type="error">⚠️ {validation.estimatedTime}</ValidationMessage>
              )}
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

              <QuickSuggestions>
                <SuggestionTitle>🏷️ Popular Tags</SuggestionTitle>
                <SuggestionList>
                  {suggestionsByField.tags.map(suggestion => (
                    <SuggestionChip
                      key={suggestion}
                      onClick={() => handleSuggestionClick('tags', suggestion)}
                    >
                      {suggestion}
                    </SuggestionChip>
                  ))}
                </SuggestionList>
              </QuickSuggestions>
            </FormGroup>
          </Section>
        );

      case 5:
        return (
          <Section>
            <SectionTitle>👀 Review & Generate</SectionTitle>

            <IdeaCard>
              <IdeaTitle>{idea.title}</IdeaTitle>
              <IdeaContent>{idea.description}</IdeaContent>
              <div style={{ marginBottom: '12px' }}>
                <strong>Requirements:</strong>
                <div style={{ marginTop: '4px', color: '#6b7280' }}>
                  {idea.requirements || 'No requirements specified'}
                </div>
              </div>
              {idea.constraints && (
                <div style={{ marginBottom: '12px' }}>
                  <strong>Constraints:</strong>
                  <div style={{ marginTop: '4px', color: '#6b7280' }}>
                    {idea.constraints}
                  </div>
                </div>
              )}
              <IdeaMeta>
                <MetaTag>Priority: {idea.priority}</MetaTag>
                <MetaTag>Complexity: {idea.complexity}</MetaTag>
                {idea.estimatedTime && (
                  <MetaTag>Timeline: {idea.estimatedTime}</MetaTag>
                )}
                {idea.tags.map(tag => (
                  <MetaTag key={tag} style={{ background: '#dbeafe', color: '#1e40af' }}>
                    {tag}
                  </MetaTag>
                ))}
              </IdeaMeta>
            </IdeaCard>

            <div style={{
              background: '#f0f9ff',
              border: '1px solid #0ea5e9',
              borderRadius: '12px',
              padding: '16px',
              marginTop: '20px'
            }}>
              <strong style={{ color: '#0c4a6e' }}>🚀 Ready to Generate!</strong>
              <p style={{ margin: '8px 0 0 0', color: '#075985' }}>
                Your idea will be converted into a structured project plan with milestones,
                stories, and execution details that you can view in the Plan Editor.
              </p>
            </div>

            <ButtonGroup>
              <Button
                variant="success"
                onClick={handleGeneratePlan}
                disabled={!idea.title.trim() || isGenerating}
              >
                {isGenerating ? '⏳ Generating...' : '🚀 Generate Plan'}
              </Button>
              <Button onClick={handleSaveIdea} disabled={!idea.title.trim()}>
                💾 Save Idea Only
              </Button>
            </ButtonGroup>
          </Section>
        );

      default:
        return null;
    }
  };

  return (
    <BuilderContainer>
      <Header>
        <Title>💡 Idea Builder</Title>
        <Subtitle>
          Transform your ideas into structured execution plans with our step-by-step wizard.
          Choose a template, define requirements, and generate a complete project plan.
        </Subtitle>
      </Header>

      <MainContent>
        <LeftPanel>
          {currentStep > 1 && (
            <Section style={{ padding: '20px' }}>
              <StepIndicator>
                {[1, 2, 3, 4, 5].map((step, index) => (
                  <React.Fragment key={step}>
                    <Step
                      active={currentStep === step}
                      completed={currentStep > step}
                      onClick={() => setCurrentStep(step)}
                    >
                      {currentStep > step ? '✓' : step}
                    </Step>
                    {index < 4 && <StepConnector completed={currentStep > step} />}
                  </React.Fragment>
                ))}
              </StepIndicator>

              <ProgressBar>
                <ProgressFill progress={getProgress()} />
              </ProgressBar>

              <div style={{ fontSize: '0.9rem', color: '#6b7280', textAlign: 'center' }}>
                Step {currentStep} of 5 - {getProgress()}% Complete
              </div>
            </Section>
          )}

          {renderStepContent()}

          {currentStep > 1 && (
            <Section style={{ padding: '20px' }}>
              <ButtonGroup style={{ margin: 0 }}>
                <Button variant="secondary" onClick={handlePrevStep}>
                  ← Previous
                </Button>
                {currentStep < 5 && (
                  <Button onClick={handleNextStep}>
                    Next →
                  </Button>
                )}
              </ButtonGroup>
            </Section>
          )}
        </LeftPanel>

        <RightPanel>
          <Section>
            <SectionTitle>
              💾 Saved Ideas ({savedIdeas.length})
            </SectionTitle>

            {savedIdeas.length === 0 ? (
              <EmptyState>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💭</div>
                <div>No ideas saved yet.</div>
                <div style={{ fontSize: '0.9rem', marginTop: '8px' }}>
                  Complete the wizard to create your first idea!
                </div>
              </EmptyState>
            ) : (
              <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {savedIdeas.map(savedIdea => (
                  <IdeaCard key={savedIdea.id} onClick={() => handleLoadIdea(savedIdea)}>
                    <IdeaTitle>{savedIdea.title}</IdeaTitle>
                    <IdeaContent>
                      {savedIdea.description || 'No description provided'}
                    </IdeaContent>
                    <IdeaMeta>
                      <MetaTag>Priority: {savedIdea.priority}</MetaTag>
                      <MetaTag>Complexity: {savedIdea.complexity}</MetaTag>
                      {savedIdea.estimatedTime && (
                        <MetaTag>Timeline: {savedIdea.estimatedTime}</MetaTag>
                      )}
                      {savedIdea.tags.slice(0, 3).map(tag => (
                        <MetaTag key={tag} style={{ background: '#dbeafe', color: '#1e40af' }}>
                          {tag}
                        </MetaTag>
                      ))}
                      {savedIdea.tags.length > 3 && (
                        <MetaTag>+{savedIdea.tags.length - 3} more</MetaTag>
                      )}
                    </IdeaMeta>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#9ca3af',
                      marginTop: '8px',
                      borderTop: '1px solid #e5e7eb',
                      paddingTop: '8px'
                    }}>
                      Created: {new Date(savedIdea.createdAt).toLocaleDateString()}
                      {savedIdea.template && ` • Template: ${templates.find(t => t.id === savedIdea.template)?.title || savedIdea.template}`}
                    </div>
                  </IdeaCard>
                ))}
              </div>
            )}
          </Section>

          <Section>
            <SectionTitle>
              💡 Tips & Best Practices
            </SectionTitle>
            <div style={{ fontSize: '0.9rem', color: '#6b7280', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '12px' }}>
                <strong>📋 Be Specific:</strong> Clear requirements lead to better plans
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>🎯 Set Priorities:</strong> Help the AI understand what's most important
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>⏰ Realistic Timelines:</strong> Consider complexity and resources
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>🏷️ Use Tags:</strong> Organize and categorize your ideas
              </div>
              <div>
                <strong>🚀 Generate Plans:</strong> Convert ideas into actionable project structures
              </div>
            </div>
          </Section>
        </RightPanel>
      </MainContent>
    </BuilderContainer>
  );
}

export default IdeaBuilder; 