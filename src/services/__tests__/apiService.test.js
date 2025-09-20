import apiService from '../apiService';

describe('APIService', () => {
    // Mock fetch globally
    global.fetch = jest.fn();

    beforeEach(() => {
        fetch.mockClear();
    });

    describe('Data Validation', () => {
        test('should validate new schema data correctly', () => {
            const validNewSchemaData = {
                project: {
                    id: 'project-1',
                    name: 'Test Project',
                    description: 'Test Description',
                    roadmap: {
                        intents: [
                            {
                                id: 'intent-1',
                                name: 'Test Intent',
                                description: 'Test Intent Description',
                                stories: [
                                    {
                                        id: 'story-1',
                                        objective: 'Test Story',
                                        workstream_id: 'frontend',
                                        acceptance_criteria: ['Criterion 1', 'Criterion 2'],
                                        dependencies: [{ type: 'story', id: 'story-0' }],
                                        implementation_notes: [],
                                        estimated_tokens: 1000,
                                        complexity_score: 2,
                                        created_at: '2024-01-01T00:00:00Z',
                                        updated_at: '2024-01-01T00:00:00Z',
                                        preferences: {
                                            preferred_agents: [],
                                            execution_overrides: {}
                                        },
                                        execution: {
                                            current: { status: 'planned' },
                                            history: []
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                },
                agents: [
                    {
                        id: 'agent-1',
                        name: 'Test Agent',
                        role: 'engineer'
                    }
                ]
            };

            const result = apiService.validateNewSchemaData(validNewSchemaData);
            expect(result).toBe(true);
        });

        test('should reject invalid schema data', () => {
            const invalidData = {
                project: {
                    id: 'project-1',
                    name: 'Test Project'
                    // Missing roadmap and intents
                },
                agents: []
            };

            const result = apiService.validateNewSchemaData(invalidData);
            expect(result).toBe(false);
        });

        test('should reject null or undefined data', () => {
            expect(apiService.validateNewSchemaData(null)).toBe(false);
            expect(apiService.validateNewSchemaData(undefined)).toBe(false);
            expect(apiService.validateNewSchemaData('invalid')).toBe(false);
        });

    });

    describe('Connection Management', () => {
        test('should handle connection test success', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ status: 'healthy' })
            });

            const result = await apiService.testConnection();

            expect(result.success).toBe(true);
            expect(apiService.isConnected).toBe(true);
            expect(apiService.connectionError).toBe(null);
        });

        test('should handle connection test failure', async () => {
            // Mock the retryFetch method directly to avoid timeout issues
            jest.spyOn(apiService, 'retryFetch').mockResolvedValueOnce({
                success: false,
                error: 'Network error'
            });

            const result = await apiService.testConnection();

            expect(result.success).toBe(false);
            expect(apiService.isConnected).toBe(false);
            expect(apiService.connectionError).toBe('Network error');

            // Restore the mock
            apiService.retryFetch.mockRestore();
        });

        test('should set base URL correctly', () => {
            const newUrl = 'http://example.com:8080';
            apiService.setBaseURL(newUrl);

            expect(apiService.baseURL).toBe(newUrl);
            expect(apiService.isConnected).toBe(false);
            expect(apiService.connectionError).toBe(null);
        });
    });

    describe('Utility Methods', () => {
        test('should parse JSON safely', () => {
            expect(apiService.parseJSONSafe('["a", "b"]')).toEqual(['a', 'b']);
            expect(apiService.parseJSONSafe('invalid')).toBe(null);
            expect(apiService.parseJSONSafe(null)).toBe(null);
            expect(apiService.parseJSONSafe(123)).toBe(null);
        });

        test('should get connection status correctly', () => {
            apiService.isConnected = true;
            apiService.connectionError = null;
            apiService.pollingInterval = 123;

            const status = apiService.getConnectionStatus();

            expect(status.isConnected).toBe(true);
            expect(status.error).toBe(null);
            expect(status.pollingActive).toBe(true);
        });
    });

    describe('Plan Execution', () => {
        test('should execute plan successfully', async () => {
            const mockExecutionResponse = {
                status: 'execution_started',
                project_id: 'proj-123',
                historical_plan_id: 'proj-123-20241219-143022',
                mode: 'shadow',
                intent_count: 2,
                message: 'Plan execution started and saved to historical storage'
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue(mockExecutionResponse)
            });

            const result = await apiService.executePlan('proj-123', 'shadow');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/v1/plans/proj-123/execute?mode=shadow'),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json'
                    })
                })
            );
            expect(result).toEqual({
                success: true,
                data: mockExecutionResponse
            });
        });

        test.skip('should handle execution failure', async () => {
            // TODO: Fix mock handling for error responses in retryFetch
            const errorResponse = {
                detail: 'Project not found'
            };

            fetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: jest.fn().mockResolvedValue(errorResponse)
            });

            const result = await apiService.executePlan('invalid-project', 'shadow');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Project not found');
        }, 10000);

        test('should default to shadow mode', async () => {
            const mockResponse = { status: 'execution_started' };
            fetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue(mockResponse)
            });

            await apiService.executePlan('proj-123');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/v1/plans/proj-123/execute?mode=shadow'),
                expect.any(Object)
            );
        });
    });
});
