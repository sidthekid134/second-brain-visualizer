export function planDataToApiPlan(planData = {}, options = {}) {
  if (!planData.project || !Array.isArray(planData.project?.roadmap?.intents)) {
    return null;
  }

  const {
    autoApprove = false,
    baseRepoUrl = '',
    baseBranch = 'main',
    defaultRunMode = 'shadow',
    planId = null,
    preserveExistingIds = true
  } = options;

  const timestamp = new Date().toISOString();

  const intentsPayload = planData.project.roadmap.intents.map((intent) => {
    // Get stories directly from the intent in the new schema
    const intentStories = Array.isArray(intent.stories) ? intent.stories : [];
    const sortedStories = intentStories.slice().sort((a, b) => {
      if (typeof a.order_idx === 'number' && typeof b.order_idx === 'number') {
        return a.order_idx - b.order_idx;
      }
      return 0;
    });

    return {
      id: preserveExistingIds && intent.id ? intent.id : intent.id || `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: intent.name || 'Untitled Intent',
      description: intent.description || '',
      dependencies: Array.isArray(intent.dependencies) ? intent.dependencies : [],
      stories: sortedStories.map((story) => {
        // Transform dependencies for nested API format
        const dependencies = Array.isArray(story.dependencies)
          ? story.dependencies
          : [];

        // Transform acceptance criteria to array format
        const acceptance_criteria = Array.isArray(story.acceptance_criteria)
          ? story.acceptance_criteria
          : (story.acceptance ? [story.acceptance] : []);

        return {
          id: preserveExistingIds && story.id ? story.id : story.id || `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          objective: story.objective || story.title || 'Untitled Story',
          workstream_id: story.workstream_id || story.engineer_kind || 'generalist',
          acceptance_criteria,
          dependencies,
          implementation_notes: Array.isArray(story.implementation_notes) ? story.implementation_notes : [],
          estimated_tokens: story.estimated_tokens || 5000,
          complexity_score: story.complexity_score || 3,
          created_at: story.created_at || timestamp,
          updated_at: story.updated_at || timestamp,
          preferences: story.preferences || {
            preferred_agents: [],
            execution_overrides: {
              max_runtime_seconds: 3600,
              require_manual_approval: false
            }
          },
          execution: story.execution || {
            current: {
              status: 'planned'
            },
            history: []
          }
        };
      }),
      created_at: intent.created_at || timestamp,
      updated_at: intent.updated_at || timestamp
    };
  });

  // Return in the format expected by the API: nested under "plan" key with "project" and "agents"
  return {
    plan: {
      project: {
        id: planId || planData.project?.id || `plan_${Date.now()}`,
        name: planData.project?.name || 'Untitled Project',
        description: planData.project?.description || '',
        status: planData.project?.status || 'planned',
        created_at: planData.project?.created_at || timestamp,
        updated_at: planData.project?.updated_at || timestamp,
        progress: planData.project?.progress || { completion_percentage: 0 },
        budget: planData.project?.budget || { limit: 0, used: 0 },
        roadmap: {
          intents: intentsPayload
        },
        checkpoints: planData.project?.checkpoints || []
      },
      agents: planData.agents || []
    }
  };
}

export function submissionPlanToPlanData(plan = {}) {
  if (!Array.isArray(plan.intents)) {
    return null;
  }

  const timestamp = new Date().toISOString();
  const projectId = plan.name
    ? plan.name.toLowerCase().replace(/\s+/g, '-')
    : `imported-${Date.now()}`;

  const projectIntents = [];
  const checkpoints = [];
  const storyIdLookup = new Map();

  plan.intents.forEach((intent, intentIndex) => {
    const intentId = intent.id || `intent-${intentIndex + 1}-${Date.now()}`;
    const intentStories = [];

    if (Array.isArray(intent.stories)) {
      intent.stories.forEach((story, storyIndex) => {
        const storyId = story.id || `story-${intentIndex + 1}-${storyIndex + 1}-${Date.now()}`;
        storyIdLookup.set(`${intentId}:${story.title || storyId}`, storyId);
        const acceptanceCriteria = story.acceptance
          ? story.acceptance.split(/\n|\r/).map((item) => item.trim()).filter(Boolean)
          : Array.isArray(story.acceptance_criteria)
            ? story.acceptance_criteria
            : [];

        intentStories.push({
          id: storyId,
          objective: story.title || `Story ${storyIndex + 1}`,
          workstream_id: story.engineer_kind || 'generalist',
          acceptance_criteria: acceptanceCriteria,
          dependencies: [],
          implementation_notes: [],
          estimated_tokens: null,
          actual_tokens: null,
          complexity_score: 1,
          created_at: timestamp,
          updated_at: timestamp,
          status: 'planned',
          priority: story.priority || 'medium',
          owner_id: story.owner || null,
          estimated_completion_date: story.estimated_completion_date || null,
          notes: story.notes || null,
          scope_globs: Array.isArray(story.scope_globs) ? story.scope_globs : [],
          engineer_kind: story.engineer_kind || null,
          order_idx: storyIndex,
          executionStatus: 'planned',
          execution: {
            current: {
              status: 'planned',
              started_at: null,
              ended_at: null,
              duration_seconds: null,
              agent_id: null,
              result: null,
              messages_count: null
            },
            history: []
          },
          preferences: {
            preferred_agents: [],
            execution_overrides: {
              max_runtime_seconds: 3600,
              require_manual_approval: false
            }
          }
        });
      });
    }

    projectIntents.push({
      id: intentId,
      name: intent.name || `Intent ${intentIndex + 1}`,
      description: intent.description || '',
      status: 'planned',
      dependencies: [],
      stories: intentStories, // Stories are now nested within the intent
      created_at: timestamp,
      updated_at: timestamp,
      priority: intent.priority || 'medium',
      owner: intent.owner || null,
      notes: intent.notes || null
    });

    checkpoints.push({
      id: `checkpoint-${intentId}`,
      name: `${intent.name || `Intent ${intentIndex + 1}`} Checkpoint`,
      description: `Completion checkpoint for ${intent.name || `Intent ${intentIndex + 1}`}`,
      status: 'planned',
      story_ids: intentStories.map(story => story.id),
      dependencies: intentIndex > 0 ? [{ type: 'checkpoint', id: `checkpoint-${projectIntents[intentIndex - 1].id}` }] : [],
      created_at: timestamp,
      updated_at: timestamp
    });
  });

  // Map dependencies now that all stories have IDs
  if (Array.isArray(plan.intents)) {
    plan.intents.forEach((intent, intentIndex) => {
      const intentId = projectIntents[intentIndex]?.id;
      if (!intentId) return;

      const intentStories = projectIntents[intentIndex]?.stories || [];

      intentStories.forEach((story, storyIndex) => {
        const originalStory = intent.stories?.[storyIndex];
        if (!originalStory) return;

        // Handle both 'deps' (legacy) and 'dependencies' (current) formats
        const originalDeps = originalStory.dependencies || originalStory.deps;
        if (!Array.isArray(originalDeps)) return;

        const deps = originalDeps
          .map((dep) => {
            if (typeof dep === 'string') {
              const depId = storyIdLookup.get(`${intentId}:${dep}`) || storyIdLookup.get(dep);
              return depId ? { type: 'story', id: depId } : null;
            } else if (dep && typeof dep === 'object' && dep.type && dep.id) {
              // Handle object format dependencies directly
              return dep;
            }
            return null;
          })
          .filter(Boolean);

        story.dependencies = deps;
      });
    });
  }

  const planData = {
    project: {
      id: projectId,
      name: plan.name || 'Imported Plan',
      description: plan.description || '',
      status: 'planned',
      created_at: timestamp,
      updated_at: timestamp,
      progress: {
        completion_percentage: 0
      },
      budget: {
        limit: 0,
        used: 0
      },
      roadmap: {
        intents: projectIntents
      },
      checkpoints
    },
    agents: [],
    // Note: New schema doesn't use _metadata, stats are calculated from the data structure
  };

  return planData;
}
