import React, { useState } from 'react';
import styled from 'styled-components';
import apiService from '../services/apiService';
import { usePlan } from '../context/PlanContext';
import ErrorOverlay from './modals/ErrorOverlay';

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
`;

const Header = styled.div`
  background-color: white;
  border-bottom: 1px solid #dee2e6;
  padding: 1.5rem 2rem;
`;

const Title = styled.h2`
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
`;

const Subtitle = styled.p`
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
`;

const Content = styled.div`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
`;

const Section = styled.div`
  background: white;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  margin-bottom: 1.5rem;
  overflow: hidden;
`;

const SectionHeader = styled.div`
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  padding: 1rem 1.5rem;
  font-weight: 600;
  color: #495057;
`;

const SectionContent = styled.div`
  padding: 1.5rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 300px;
  padding: 1rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
  
  &::placeholder {
    color: #6c757d;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled(Button)`
  background-color: #3498db;
  color: white;
  
  &:hover:not(:disabled) {
    background-color: #2980b9;
    transform: translateY(-1px);
  }
`;

const SecondaryButton = styled(Button)`
  background-color: #6c757d;
  color: white;
  
  &:hover:not(:disabled) {
    background-color: #5a6268;
    transform: translateY(-1px);
  }
`;

const SuccessButton = styled(Button)`
  background-color: #27ae60;
  color: white;
  
  &:hover:not(:disabled) {
    background-color: #229954;
    transform: translateY(-1px);
  }
`;


const Alert = styled.div`
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  border: 1px solid;
  
  ${props => {
        switch (props.type) {
            case 'success':
                return `
          background-color: #d4edda;
          border-color: #c3e6cb;
          color: #155724;
        `;
            case 'error':
                return `
          background-color: #f8d7da;
          border-color: #f5c6cb;
          color: #721c24;
        `;
            case 'warning':
                return `
          background-color: #fff3cd;
          border-color: #ffeaa7;
          color: #856404;
        `;
            case 'info':
                return `
          background-color: #d1ecf1;
          border-color: #bee5eb;
          color: #0c5460;
        `;
            default:
                return `
          background-color: #f8f9fa;
          border-color: #dee2e6;
          color: #495057;
        `;
        }
    }}
`;

const ValidationList = styled.ul`
  margin: 0.5rem 0 0 0;
  padding-left: 1.5rem;
`;

const ConfigSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: #495057;
  font-size: 0.875rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 0.875rem;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 0.875rem;
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

const ExampleButton = styled(Button)`
  background-color: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
  
  &:hover:not(:disabled) {
    background-color: #e9ecef;
    border-color: #adb5bd;
  }
`;

const EXAMPLE_PLAN = {
    "project": {
        "id": "example-project",
        "name": "Example Project",
        "description": "An example project to demonstrate the new schema",
        "status": "planned",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "progress": {
            "completion_percentage": 0
        },
        "budget": {
            "limit": 10000,
            "used": 0
        },
        "roadmap": {
            "intents": [
                {
                    "id": "intent-1",
                    "name": "Setup Infrastructure",
                    "description": "Set up the basic infrastructure for the project",
                    "dependencies": [],
                    "stories": [
                        {
                            "id": "story-1",
                            "objective": "Initialize project structure",
                            "workstream_id": "fullstack",
                            "acceptance_criteria": ["Create src/, tests/, docs/ directories with proper setup files"],
                            "dependencies": [],
                            "implementation_notes": ["Foundation for the project"],
                            "estimated_tokens": 1000,
                            "complexity_score": 2,
                            "created_at": "2024-01-01T00:00:00Z",
                            "updated_at": "2024-01-01T00:00:00Z",
                            "preferences": {
                                "preferred_agents": [],
                                "execution_overrides": {
                                    "max_runtime_seconds": 3600,
                                    "require_manual_approval": false
                                }
                            },
                            "execution": {
                                "current": {
                                    "status": "planned"
                                },
                                "history": []
                            }
                        },
                        {
                            "id": "story-2",
                            "objective": "Setup CI/CD pipeline",
                            "workstream_id": "devops",
                            "acceptance_criteria": ["Configure GitHub Actions workflow for testing and deployment"],
                            "dependencies": [{ "type": "story", "id": "story-1" }],
                            "implementation_notes": ["Automated testing and deployment"],
                            "estimated_tokens": 1500,
                            "complexity_score": 3,
                            "created_at": "2024-01-01T00:00:00Z",
                            "updated_at": "2024-01-01T00:00:00Z",
                            "preferences": {
                                "preferred_agents": [],
                                "execution_overrides": {
                                    "max_runtime_seconds": 3600,
                                    "require_manual_approval": false
                                }
                            },
                            "execution": {
                                "current": {
                                    "status": "planned"
                                },
                                "history": []
                            }
                        }
                    ]
                },
                {
                    "id": "intent-2",
                    "name": "Develop Core Features",
                    "description": "Implement the core functionality of the application",
                    "dependencies": [{ "type": "intent", "id": "intent-1" }],
                    "stories": [
                        {
                            "id": "story-3",
                            "objective": "Implement user authentication",
                            "workstream_id": "backend",
                            "acceptance_criteria": ["Users can register, login, and logout securely"],
                            "dependencies": [],
                            "implementation_notes": ["Security foundation"],
                            "estimated_tokens": 2000,
                            "complexity_score": 4,
                            "created_at": "2024-01-01T00:00:00Z",
                            "updated_at": "2024-01-01T00:00:00Z",
                            "preferences": {
                                "preferred_agents": [],
                                "execution_overrides": {
                                    "max_runtime_seconds": 3600,
                                    "require_manual_approval": false
                                }
                            },
                            "execution": {
                                "current": {
                                    "status": "planned"
                                },
                                "history": []
                            }
                        }
                    ]
                }
            ]
        },
        "checkpoints": []
    },
    "agents": []
};

function PlanLoader({ onPlanSubmitted }) {
    const { dispatch } = usePlan();
    const [jsonInput, setJsonInput] = useState('');
    const [validationResult, setValidationResult] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);
    const [submissionError, setSubmissionError] = useState(null);
    const [config, setConfig] = useState({
        auto_approve: false,
        base_repo_url: '',
        base_branch: 'main',
    });
    const [connectionStatus, setConnectionStatus] = useState('disconnected');

    // Check API connection status
    React.useEffect(() => {
        const checkConnection = () => {
            const status = apiService.getConnectionStatus();
            setConnectionStatus(status.isConnected ? 'connected' : 'disconnected');
        };

        checkConnection();
        const interval = setInterval(checkConnection, 3000);
        return () => clearInterval(interval);
    }, []);

    const loadExample = () => {
        setJsonInput(JSON.stringify(EXAMPLE_PLAN, null, 2));
        setValidationResult(null);
        setSubmitResult(null);
    };

    const clearInput = () => {
        setJsonInput('');
        setValidationResult(null);
        setSubmitResult(null);
    };

    const validatePlan = () => {
        try {
            const plan = JSON.parse(jsonInput);
            const result = apiService.validatePlanStructure(plan);
            setValidationResult(result);
            setSubmitResult(null);

            if (result.valid) {
                console.log('Plan validation successful:', plan);

                // Load the valid plan into Plan Editor staging
                dispatch({
                    type: 'SET_PLAN_DATA',
                    payload: plan
                });

                // Update data source to indicate loaded plan
                dispatch({
                    type: 'SET_DATA_SOURCE',
                    payload: {
                        source: 'plan_loader',
                        timestamp: new Date().toISOString()
                    }
                });

                console.log('Plan loaded into Plan Editor staging area');
            }
        } catch (error) {
            setValidationResult({
                valid: false,
                errors: [`Invalid JSON: ${error.message}`]
            });
            setSubmitResult(null);
        }
    };

    const submitPlan = async () => {
        if (!jsonInput.trim()) {
            setSubmitResult({
                success: false,
                error: 'Please enter a plan JSON first'
            });
            return;
        }

        try {
            const plan = JSON.parse(jsonInput);

            // Merge GitHub configuration into the plan's project object
            if (plan.project && (config.base_repo_url || config.base_branch)) {
                plan.project.base_repo_url = config.base_repo_url || null;
                plan.project.base_branch = config.base_branch || 'main';
            }

            const validation = apiService.validatePlanStructure(plan);

            if (!validation.valid) {
                setValidationResult(validation);
                setSubmitResult({
                    success: false,
                    error: 'Plan validation failed. Please fix the errors above.'
                });
                return;
            }

            setIsSubmitting(true);
            setSubmitResult(null);

            const result = await apiService.submitPlan(plan, {
                preserve_existing_ids: true
            });

            if (result.success) {
                setSubmitResult({
                    success: true,
                    data: result.data,
                    message: 'Plan submitted successfully! Switching to execution view and refreshing all data...'
                });

                // Notify parent component with submission result
                if (onPlanSubmitted) {
                    onPlanSubmitted(result.data, plan, config);
                }
            } else {
                // Show error overlay for submission failure
                setSubmissionError({
                    message: result.error || 'Failed to submit plan',
                    details: result.details || JSON.stringify(result, null, 2),
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            // Show error overlay for submission error
            setSubmissionError({
                message: error.message || 'Submission error occurred',
                details: error.stack || JSON.stringify(error, null, 2),
                timestamp: new Date().toISOString()
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfigChange = (field, value) => {
        setConfig(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <Container>
            <Header>
                <Title>Plan Loader</Title>
                <Subtitle>
                    Load and submit execution plans to the Neuro Coordinator API
                </Subtitle>
            </Header>

            <Content>
                {/* Connection Status */}
                <Section>
                    <SectionHeader>API Connection Status</SectionHeader>
                    <SectionContent>
                        <StatusIndicator>
                            <StatusDot status={connectionStatus} />
                            {connectionStatus === 'connected' ? (
                                <span>Connected to API - Ready to submit plans</span>
                            ) : (
                                <span>Not connected to API - Configure connection in API Config</span>
                            )}
                        </StatusIndicator>
                    </SectionContent>
                </Section>

                {/* Plan Input */}
                <Section>
                    <SectionHeader>Plan JSON Input</SectionHeader>
                    <SectionContent>
                        <TextArea
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            placeholder="Paste your plan JSON here..."
                        />

                        <ButtonGroup>
                            <ExampleButton onClick={loadExample}>
                                📋 Load Example
                            </ExampleButton>
                            <SecondaryButton onClick={clearInput}>
                                🗑️ Clear
                            </SecondaryButton>
                            <PrimaryButton
                                onClick={validatePlan}
                                disabled={!jsonInput.trim()}
                            >
                                ✅ Validate
                            </PrimaryButton>
                        </ButtonGroup>

                        {validationResult && (
                            <Alert type={validationResult.valid ? 'success' : 'error'}>
                                {validationResult.valid ? (
                                    'Plan structure is valid! ✅ Loaded into Plan Editor staging area.'
                                ) : (
                                    <>
                                        Plan validation failed:
                                        <ValidationList>
                                            {validationResult.errors.map((error, index) => {
                                                // Safely render error - handle both string and object formats
                                                const errorText = typeof error === 'string'
                                                    ? error
                                                    : error?.msg || error?.message || JSON.stringify(error);
                                                return <li key={index}>{errorText}</li>;
                                            })}
                                        </ValidationList>
                                    </>
                                )}
                            </Alert>
                        )}
                    </SectionContent>
                </Section>

                {/* Submission Configuration */}
                <Section>
                    <SectionHeader>Submission Configuration</SectionHeader>
                    <SectionContent>
                        <ConfigSection>
                            <FormGroup>
                                <Label>Execution Mode</Label>
                                <div style={{
                                    padding: '0.75rem',
                                    background: '#f8f9fa',
                                    border: '1px solid #e9ecef',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    color: '#6c757d'
                                }}>
                                    💡 Execution mode is now controlled globally from the header toggle
                                </div>
                            </FormGroup>

                            <FormGroup>
                                <Label>Auto Approve</Label>
                                <Select
                                    value={config.auto_approve}
                                    onChange={(e) => handleConfigChange('auto_approve', e.target.value === 'true')}
                                >
                                    <option value="false">No - Manual approval required</option>
                                    <option value="true">Yes - Auto-approve for execution</option>
                                </Select>
                            </FormGroup>

                            <FormGroup>
                                <Label>Base Repository URL</Label>
                                <Input
                                    type="text"
                                    value={config.base_repo_url}
                                    onChange={(e) => handleConfigChange('base_repo_url', e.target.value)}
                                    placeholder="https://github.com/user/repo"
                                />
                            </FormGroup>

                            <FormGroup>
                                <Label>Base Branch</Label>
                                <Input
                                    type="text"
                                    value={config.base_branch}
                                    onChange={(e) => handleConfigChange('base_branch', e.target.value)}
                                    placeholder="main"
                                />
                            </FormGroup>
                        </ConfigSection>

                        <ButtonGroup>
                            <SuccessButton
                                onClick={submitPlan}
                                disabled={!jsonInput.trim() || isSubmitting || connectionStatus !== 'connected'}
                            >
                                {isSubmitting ? '⏳ Submitting...' : '🚀 Submit Plan'}
                            </SuccessButton>
                        </ButtonGroup>

                        {submitResult && (
                            <Alert type={submitResult.success ? 'success' : 'error'}>
                                {submitResult.success ? (
                                    <>
                                        {submitResult.message}
                                        {submitResult.data?.intents && (
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                                                Created {submitResult.data.intents.length} intent(s)
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    submitResult.error
                                )}
                            </Alert>
                        )}
                    </SectionContent>
                </Section>

                {/* Instructions */}
                <Section>
                    <SectionHeader>Instructions</SectionHeader>
                    <SectionContent>
                        <div style={{ fontSize: '0.875rem', lineHeight: '1.6', color: '#6c757d' }}>
                            <ol style={{ paddingLeft: '1.5rem' }}>
                                <li>Ensure your API connection is configured and active</li>
                                <li>Paste or load a valid plan JSON structure in the input field</li>
                                <li>Click "Validate" to check the plan structure</li>
                                <li>Configure submission options (execution mode, auto-approval, etc.)</li>
                                <li>Click "Submit Plan" to send to the Neuro Coordinator</li>
                                <li>The app will automatically switch to Live Execution and refresh all tabs with live data</li>
                                <li>Use the Live Execution tab to approve intents and monitor progress</li>
                            </ol>

                            <p><strong>Note:</strong> Plans submitted with auto_approve=false will require manual approval before execution begins. After submission, all tabs (Plan Editor, Live Execution, etc.) will automatically update to show the live data from the backend API.</p>
                        </div>
                    </SectionContent>
                </Section>
            </Content>
            <ErrorOverlay
                isOpen={!!submissionError}
                onClose={() => setSubmissionError(null)}
                onClearDraft={() => {
                    // Clear the JSON input (draft)
                    setJsonInput('');
                    setValidationResult(null);
                    setSubmitResult(null);
                    setSubmissionError(null);
                }}
                title="Plan Submission Failed"
                message={submissionError?.message || 'An error occurred while submitting the plan'}
                details={submissionError?.details}
                showClearDraft={!!jsonInput.trim()}
            />
        </Container>
    );
}

export default PlanLoader;
