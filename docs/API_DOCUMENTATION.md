# Neuro Coordinator API Documentation

## Overview

The Neuro Coordinator API is a FastAPI-based service that manages AI agent coordination for software development tasks. It provides endpoints for creating projects, managing intents, stories, agents, and executing plans with comprehensive dependency tracking and execution monitoring.

**Base URL**: `http://localhost:8000` (development)  
**API Version**: v1  
**Content-Type**: `application/json`

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

## CORS Configuration

The API is configured to allow requests from:
- `http://localhost:3000` (React/Next.js dev server)
- `http://127.0.0.1:3000` (Alternative localhost format)
- `http://localhost:3001` (Additional port if needed)

## New Schema (v1.1) - Nested Stories Structure

The API now supports a comprehensive project execution and roadmap schema with **stories nested within intents**. This new schema provides:

- **Project Management**: Complete project lifecycle with progress tracking, budget management, and status monitoring
- **Hierarchical Structure**: Stories are nested within their parent intents for better organization
- **Dependency Management**: Structured dependencies between intents, workstreams, checkpoints, and stories
- **Agent Coordination**: Role-based agent management with hierarchical reporting structures
- **Execution Tracking**: Detailed execution history and status monitoring for all stories
- **Checkpoint System**: Milestone-based project tracking with story grouping
- **Simplified API**: Single endpoint for plan operations with historical execution tracking

### ⚠️ IMPORTANT: API Usage Pattern

**For listing projects:** Use `/api/v1/projects` (returns summaries with counts)
**For plan operations:** Use `/api/v1/plans` (create/update/get individual plans)

**All `/api/v1/plans` requests must have `project` and `agents` at the root level:**

✅ **CORRECT:**
```json
{
  "project": { ... },
  "agents": [ ... ]
}
```

❌ **INCORRECT:**
```json
{
  "plan": {
    "project": { ... },
    "agents": [ ... ]
  }
}
```

The backend validation expects `project` and `agents` as top-level fields in the request body.

### Schema Structure

The new schema follows this hierarchical structure:
```json
{
  "project": {
    "id": "string",
    "name": "string", 
    "description": "string",
    "status": "planned|executing|completed|on_hold|cancelled",
    "created_at": "ISO 8601 datetime",
    "updated_at": "ISO 8601 datetime",
    "progress": {
      "completion_percentage": 0-100
    },
    "budget": {
      "limit": 0,
      "used": 0
    },
    "roadmap": {
      "intents": [
        {
          "id": "string",
          "name": "string",
          "description": "string",
          "dependencies": [...],
          "stories": [
            {
              "id": "string",
              "objective": "string",
              "workstream_id": "string",
              "acceptance_criteria": [...],
              "dependencies": [...],
              "implementation_notes": [...],
              "estimated_tokens": 0,
              "complexity_score": 0,
              "created_at": "ISO 8601 datetime",
              "updated_at": "ISO 8601 datetime",
              "preferences": {...},
              "execution": {...}
            }
          ]
        }
      ]
    },
    "checkpoints": [...]
  },
  "agents": [...]
}
```

### Key Changes from Previous Schema

1. **Stories Nested in Intents**: Stories are now contained within their parent intent objects
2. **No Top-Level Stories Array**: Stories are accessed through intents, not as a separate array
3. **No Intent ID in Stories**: Stories implicitly belong to their parent intent (no `intent_id` field)
4. **Required Stories Array**: Each intent must contain at least one story (`minItems: 1`)
5. **Simplified API Flow**: Single endpoint handles all plan operations with overwrite behavior

## Data Models

### Enums

#### ProjectStatus
- `planned`: Project is in planning phase
- `executing`: Project is currently being executed
- `completed`: Project has been completed
- `on_hold`: Project execution is paused
- `cancelled`: Project has been cancelled

#### RunMode
- `shadow`: Execute in shadow mode (safe, non-destructive)
  - Creates markdown documentation files instead of actual code
  - Uses Shadow Engineer for testing workflows without real changes
  - Files generated in `run_outputs/{execution_id}/` directory
  - Ideal for testing, planning, and development validation
- `merge`: Execute in merge mode (production-ready changes)
  - Uses Claude Code CLI for AI-powered code generation
  - Creates actual implementation files and code changes
  - Uses Claude Engineer with full context understanding
  - Can automatically merge PRs when used with GitHub integration

#### StoryStatus
- `blocked`: Story cannot be executed due to dependencies
- `ready`: Story is ready for execution
- `in_progress`: Story is currently being executed
- `done`: Story has been completed successfully
- `failed`: Story execution failed

#### ExecutionStatus
- `planned`: Execution is planned but not started
- `in_progress`: Execution is currently running
- `done`: Execution completed successfully
- `failed`: Execution failed

#### AgentRole
- `conductor`: Top-level conductor agent
- `manager`: Manager agent that reports to conductor
- `engineer`: Engineer agent that reports to manager

#### DependencyType
- `intent`: Dependency on another intent
- `workstream`: Dependency on a workstream
- `checkpoint`: Dependency on a checkpoint
- `story`: Dependency on another story

### Core Models

#### New Schema Models

##### Project
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "status": "planned|executing|completed|on_hold|cancelled",
  "created_at": "ISO 8601 datetime",
  "updated_at": "ISO 8601 datetime",
  "progress": {
    "completion_percentage": 0-100
  },
  "budget": {
    "limit": 0,
    "used": 0
  },
  "roadmap": {
    "intents": [...]
  },
  "checkpoints": [...]
}
```

##### Intent
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "dependencies": [
    {
      "type": "intent|workstream|checkpoint|story",
      "id": "string"
    }
  ],
  "stories": [
    {
      "id": "string",
      "objective": "string",
      "workstream_id": "string",
      "acceptance_criteria": ["string"],
      "dependencies": [
        {
          "type": "intent|workstream|checkpoint|story",
          "id": "string"
        }
      ],
      "implementation_notes": ["string"],
      "estimated_tokens": 0,
      "complexity_score": 0,
      "created_at": "ISO 8601 datetime",
      "updated_at": "ISO 8601 datetime",
      "preferences": {
        "preferred_agents": ["string"],
        "execution_overrides": {}
      },
      "execution": {
        "current": {
          "status": "planned|in_progress|done|failed",
          "started_at": "ISO 8601 datetime (optional)",
          "ended_at": "ISO 8601 datetime (optional)",
          "duration_seconds": 0 (optional),
          "agent_id": "string (optional)",
          "branch": "string (optional)",
          "commit_sha": "string (optional)",
          "pr_number": 0 (optional),
          "pr_url": "string (optional)",
          "result": "string (optional)",
          "messages_count": 0 (optional)
        },
        "history": [...]
      }
    }
  ]
}
```

##### Story
```json
{
  "id": "string",
  "objective": "string",
  "workstream_id": "string",
  "acceptance_criteria": ["string"],
  "dependencies": [
    {
      "type": "intent|workstream|checkpoint|story",
      "id": "string"
    }
  ],
  "implementation_notes": ["string"],
  "estimated_tokens": 0,
  "complexity_score": 0,
  "created_at": "ISO 8601 datetime",
  "updated_at": "ISO 8601 datetime",
  "preferences": {
    "preferred_agents": ["string"],
    "execution_overrides": {}
  },
  "execution": {
    "current": {
      "status": "planned|in_progress|done|failed",
      "started_at": "ISO 8601 datetime (optional)",
      "ended_at": "ISO 8601 datetime (optional)",
      "duration_seconds": 0 (optional),
      "agent_id": "string (optional)",
      "branch": "string (optional)",
      "commit_sha": "string (optional)",
      "pr_number": 0 (optional),
      "pr_url": "string (optional)",
      "result": "string (optional)",
      "messages_count": 0 (optional)
    },
    "history": [...]
  }
}
```

**Note**: Stories no longer have an `intent_id` field as they are nested within their parent intent and the relationship is implicit.

##### Agent
```json
{
  "id": "string",
  "name": "string",
  "role": "conductor|manager|engineer",
  "manager_id": "string (optional)",
  "reports": ["string"],
  "assigned_story_ids": ["string"]
}
```

##### Checkpoint
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "story_ids": ["string"],
  "dependencies": [
    {
      "type": "intent|workstream|checkpoint|story",
      "id": "string"
    }
  ]
}
```

#### IntentPlan
```json
{
  "id": "string" (optional),
  "name": "string",
  "stories": [StoryPlan],
  "run_mode": "shadow" | "merge" (optional)
}
```

## API Endpoints

### New Schema Endpoints

#### Project Management

##### Create Project
**POST** `/api/v1/projects`

Create a new project.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "budget_limit": 0
}
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "status": "planned"
}
```

##### Get All Projects
**GET** `/api/v1/projects`

Get all projects with summary information.

**Response:**
```json
[
  {
    "id": "string",
    "name": "string",
    "status": "planned|executing|completed|on_hold|cancelled",
    "story_count": 0,
    "agent_count": 0,
    "checkpoint_count": 0,
    "progress_percentage": 0
  }
]
```

##### Get Project Details
**GET** `/api/v1/projects/{project_id}`

Get detailed project information including roadmap and checkpoints.

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "status": "planned|executing|completed|on_hold|cancelled",
  "created_at": "ISO 8601 datetime",
  "updated_at": "ISO 8601 datetime",
  "progress": {
    "completion_percentage": 0-100
  },
  "budget": {
    "limit": 0,
    "used": 0
  },
  "roadmap": {
    "intents": [...]
  },
  "checkpoints": [...]
}
```

#### Intent Management

##### Create Intent
**POST** `/api/v1/projects/{project_id}/intents`

Create a new intent for a project.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "dependencies": [
    {
      "type": "intent|workstream|checkpoint|story",
      "id": "string"
    }
  ]
}
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "project_id": "string"
}
```

#### Story Management

##### Create Story
**POST** `/api/v1/stories`

Create a new story.

**Request Body:**
```json
{
  "objective": "string",
  "intent_id": "string",
  "workstream_id": "string",
  "acceptance_criteria": ["string"],
  "dependencies": [
    {
      "type": "intent|workstream|checkpoint|story",
      "id": "string"
    }
  ],
  "implementation_notes": ["string"],
  "estimated_tokens": 0,
  "complexity_score": 0,
  "preferences": {
    "preferred_agents": ["string"],
    "execution_overrides": {}
  }
}
```

**Response:**
```json
{
  "id": "string",
  "objective": "string",
  "intent_id": "string",
  "workstream_id": "string"
}
```

#### Agent Management

##### Create Agent
**POST** `/api/v1/agents`

Create a new agent.

**Request Body:**
```json
{
  "name": "string",
  "role": "conductor|manager|engineer",
  "manager_id": "string (optional)",
  "reports": ["string"]
}
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "role": "conductor|manager|engineer",
  "manager_id": "string (optional)"
}
```

#### Checkpoint Management

##### Create Checkpoint
**POST** `/api/v1/checkpoints`

Create a new checkpoint.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "project_id": "string",
  "story_ids": ["string"],
  "dependencies": [
    {
      "type": "intent|workstream|checkpoint|story",
      "id": "string"
    }
  ]
}
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "project_id": "string"
}
```

#### Plan Management (Simplified API)

The new API uses a single endpoint for all plan operations with automatic create/update detection and historical execution tracking.

**Endpoint Usage:**
- **Listing projects**: `GET /api/v1/projects` (returns project summaries with agent_count, checkpoint_count)
- **Plan operations**: `POST /api/v1/plans` (create/update), `GET /api/v1/plans/{project_id}` (get plan)

**Critical Note:** All plan requests must send `project` and `agents` at the root level of the request body, not nested within a `plan` wrapper.

##### Create or Update Plan
**POST** `/api/v1/plans`

Create or update a complete plan with project, intents (containing stories), and agents. The API automatically detects whether to create or update based on project existence.

**Request Body Format:**
The request body must have `project` and `agents` at the top level (not nested in a `plan` wrapper):

```json
{
  "project": {
    "id": "string",
    "name": "string",
    "description": "string",
    "status": "planned|executing|completed|on_hold|cancelled",
    "created_at": "ISO 8601 datetime",
    "updated_at": "ISO 8601 datetime",
    "progress": {
      "completion_percentage": 0-100
    },
    "budget": {
      "limit": 0,
      "used": 0
    },
    "roadmap": {
      "intents": [
        {
          "id": "string",
          "name": "string",
          "description": "string",
          "dependencies": [...],
          "stories": [...]
        }
      ]
    },
    "checkpoints": [...]
  },
  "agents": [...]
}
```

**Important:** Do NOT wrap the request in a `plan` object. The `project` and `agents` fields must be at the root level of the request body.

**Response:**
```json
{
  "status": "success",
  "message": "Plan created/updated successfully with X stories and Y agents",
  "project_id": "string",
  "total_stories": 0,
  "total_agents": 0
}
```

**Behavior:**
- **Create**: If project doesn't exist, creates new plan
- **Update**: If project exists, overwrites existing plan data
- **Overwrite**: Each update completely replaces the plan data
- **Stories**: Stories are nested within intents in the request

##### Get Plan
**GET** `/api/v1/plans/{project_id}`

Get complete plan data for a project with stories nested within intents.

**Response Format:**
The response returns the plan data with `project` and `agents` at the root level:

```json
{
  "project": {
    "id": "string",
    "name": "string",
    "description": "string",
    "status": "planned|executing|completed|on_hold|cancelled",
    "created_at": "ISO 8601 datetime",
    "updated_at": "ISO 8601 datetime",
    "progress": {
      "completion_percentage": 0-100
    },
    "budget": {
      "limit": 0,
      "used": 0
    },
    "roadmap": {
      "intents": [
        {
          "id": "string",
          "name": "string",
          "description": "string",
          "dependencies": [...],
          "stories": [
            {
              "id": "string",
              "objective": "string",
              "workstream_id": "string",
              "acceptance_criteria": [...],
              "dependencies": [...],
              "implementation_notes": [...],
              "estimated_tokens": 0,
              "complexity_score": 0,
              "created_at": "ISO 8601 datetime",
              "updated_at": "ISO 8601 datetime",
              "preferences": {...},
              "execution": {...}
            }
          ]
        }
      ]
    },
    "checkpoints": [...]
  },
  "agents": [...]
}
```

**Note**: Stories are returned nested within their parent intents, not as a separate array.

##### Execute Plan
**POST** `/api/v1/plans/{project_id}/execute?mode=shadow|merge`

Execute a plan and save it to historical storage for reference. The execution mode determines which engineer type processes the stories and how output is generated.

**Query Parameters:**
- `mode`: `shadow` or `merge` (required)
  - `shadow`: Creates markdown documentation using Shadow Engineer (safe, non-destructive testing)
  - `merge`: Generates real code using Claude Engineer with Claude Code CLI (production implementation)

**Response:**
```json
{
  "status": "execution_started",
  "project_id": "string",
  "historical_plan_id": "string",
  "mode": "shadow|merge",
  "intent_count": 0,
  "message": "Plan execution started and saved to historical storage as {historical_plan_id}"
}
```

**Execution Flow:**
1. **Plan Snapshot**: Current plan state saved to historical storage with timestamped ID
2. **Mode Assignment**: Selected mode stored in each intent's `run_mode` field
3. **Coordinator**: Starts full plan execution, queuing intents for processing
4. **Manager Assignment**: Available managers pick up intents from queue
5. **Engineer Selection**: Engineer Pool automatically selects appropriate engineer type:
   - Shadow mode → Shadow Engineer → Markdown files
   - Merge mode → Claude Engineer → Real code implementation
6. **Story Processing**: Engineers execute stories according to their mode-specific behavior
7. **Output Generation**: Results saved to `run_outputs/{execution_id}/` (Local) or GitHub PRs

**Behavior:**
- Saves current plan state to historical storage before execution
- Generates timestamped historical plan ID for audit trail
- Starts execution asynchronously with background task processing
- Returns historical plan ID for reference and tracking
- Automatically assigns appropriate engineer types based on execution mode
- Creates execution summary files documenting the process

##### Get Plan History
**GET** `/api/v1/plans/{project_id}/history`

Get all historical plans for a project.

**Response:**
```json
{
  "project_id": "string",
  "historical_plans": [
    {
      "historical_plan_id": "string",
      "timestamp": "string",
      "file_path": "string",
      "project_name": "string",
      "story_count": 0,
      "agent_count": 0,
      "intent_count": 0
    }
  ],
  "total_count": 0
}
```

##### Get Historical Plan
**GET** `/api/v1/plans/{project_id}/history/{historical_plan_id}`

Get a specific historical plan.

**Response:**
```json
{
  "historical_plan_id": "string",
  "project_id": "string",
  "plan_data": {
    "project": {...},
    "agents": [...]
  }
}
```


#### Request Body
```json
{
  "name": "string"
}
```

#### Response
```json
{
  "id": "string",
  "slug": "string", 
  "run_id": "string"
}
```

#### UI Interaction
- **Form Input**: User enters intent name in a text field
- **Action**: Submit button triggers intent creation
- **Feedback**: Success message with generated IDs, error message on failure
- **Next Step**: User can then add stories to the intent

---

### 2. Get All Intents

**GET** `/api/v1/intents`

Retrieves a summary of all intents with their story counts and status.

#### Response
```json
[
  {
    "id": "string",
    "name": "string",
    "slug": "string",
    "run_id": "string",
    "run_mode": "shadow" | "merge" | null,
    "story_count": 0,
    "ready_stories": 0,
    "blocked_stories": 0
  }
]
```

#### UI Interaction
- **Dashboard View**: Display cards/list of all intents
- **Status Indicators**: Show ready vs blocked story counts
- **Actions**: Each intent card should have "View Details" and "Approve" buttons
- **Filtering**: Allow filtering by run_mode, story status

---

### 3. Update Intent Plan

**PUT** `/api/v1/intents/{intent_id}/plan`

Updates an intent with a list of stories (user stories/tasks).

#### Path Parameters
- `intent_id`: The ID of the intent to update

#### Request Body
```json
{
  "stories": [StoryPlan]
}
```

#### Response
```json
{
  "status": "success",
  "intent_id": "string",
  "story_count": 0
}
```

#### UI Interaction
- **Story Editor**: Drag-and-drop interface for story management
- **Dependency Visualization**: Show story dependencies as a graph
- **Validation**: Real-time validation of story structure
- **Save Action**: "Save Plan" button to persist changes

---

### 4. Get Intent Details

**GET** `/api/v1/intents/{intent_id}`

Retrieves detailed information about a specific intent including all its stories.

#### Path Parameters
- `intent_id`: The ID of the intent to retrieve

#### Response
```json
{
  "id": "string",
  "name": "string",
  "slug": "string",
  "run_id": "string",
  "run_mode": "shadow" | "merge" | null,
  "stories": [
    {
      "id": "string",
      "title": "string",
      "acceptance": "string",
      "deps": ["string"],
      "scope_globs": ["string"],
      "engineer_kind": "string",
      "status": "blocked" | "ready" | "in_progress" | "done" | "failed"
    }
  ],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### UI Interaction
- **Detail View**: Full-screen or modal showing intent details
- **Story List**: Expandable/collapsible story items
- **Status Badges**: Color-coded status indicators for each story
- **Dependency Graph**: Visual representation of story dependencies
- **Actions**: Edit, Delete, Approve buttons

---

### 5. Approve Intent

**POST** `/api/v1/intents/{intent_id}/approve`

Approves a single intent for execution with specified run mode.

#### Path Parameters
- `intent_id`: The ID of the intent to approve

#### Query Parameters
- `mode`: `shadow` or `merge` (required)

#### Response
```json
{
  "status": "approved",
  "intent_id": "string",
  "mode": "shadow" | "merge"
}
```

#### UI Interaction
- **Approval Modal**: Confirmation dialog with mode selection
- **Mode Toggle**: Radio buttons or toggle for shadow/merge mode
- **Warning Messages**: Clear warnings about merge mode implications
- **Progress Indicator**: Show execution status after approval

---

### 6. Approve Plan (Multiple Intents)

**POST** `/api/v1/plans/approve`

Approves multiple intents for execution in a single operation.

#### Request Body
```json
{
  "intent_ids": ["string"],
  "mode": "shadow" | "merge"
}
```

#### Response
```json
{
  "status": "success" | "partial_success" | "failed",
  "message": "string",
  "approved_intents": ["string"],
  "failed_approvals": [
    {
      "intent_id": "string",
      "reason": "string"
    }
  ]
}
```

#### UI Interaction
- **Bulk Selection**: Checkboxes to select multiple intents
- **Bulk Actions**: "Approve Selected" button
- **Results Summary**: Show success/failure counts
- **Error Details**: Expandable error messages for failed approvals

---

### 7. Create Full Plan

**POST** `/api/v1/plans/full`

Creates or updates multiple intents with their stories in a single operation. Supports plan overwriting, auto-approval and Git workflow integration.

**Plan Overwriting Behavior:**
- If `plan_id` is provided and intents have IDs, updates existing intents/stories
- If no `plan_id` or intent IDs provided, creates new intents/stories
- Preserves execution history (events, run data) while allowing plan updates
- Updates `updated_at` timestamp for modified intents and stories

#### Request Body
```json
{
  "plan_id": "string" (optional),
  "intents": [IntentPlan],
  "auto_approve": false,
  "default_run_mode": "shadow" | "merge",
  "base_repo_url": "https://github.com/user/repo" (optional),
  "base_branch": "main"
}
```

#### Response
```json
{
  "status": "success",
  "message": "string",
  "intents": [IntentSummary],
  "total_intents": 0,
  "total_stories": 0,
  "final_pr_url": "string" (optional),
  "work_branch": "string" (optional)
}
```

#### UI Interaction
- **Plan Builder**: Multi-step wizard for creating/updating complex plans
- **Intent Templates**: Pre-built templates for common patterns
- **Git Integration**: Repository URL input and branch selection
- **Auto-approval Toggle**: Option to automatically approve all intents
- **Preview**: Show plan summary before creation/update
- **Progress Tracking**: Real-time updates during plan execution
- **Update Mode**: When editing existing plans, show current state and changes
- **ID Management**: Handle existing IDs for updates, generate new ones for creation

---

### 8. Get Run Events

**GET** `/api/v1/runs/{run_id}/events`

Retrieves events for a specific run with pagination support.

#### Path Parameters
- `run_id`: The ID of the run to get events for

#### Query Parameters
- `limit`: Maximum number of events (default: 50)
- `offset`: Number of events to skip (default: 0)

#### Response
```json
[
  {
    "id": "string",
    "run_id": "string",
    "kind": "string",
    "payload": {},
    "ts": "2024-01-01T00:00:00Z"
  }
]
```

#### UI Interaction
- **Event Timeline**: Chronological list of events
- **Event Filtering**: Filter by event type/kind
- **Pagination**: Load more events as needed
- **Real-time Updates**: WebSocket or polling for live updates
- **Event Details**: Expandable event payloads

---

### 9. Get System Status

**GET** `/api/v1/status`

Retrieves the current status of the system including manager and engineer pools.

#### Response
```json
{
  "service": "neuro-coordinator",
  "status": "running",
  "manager_pool": {
    "status": "running",
    "active_managers": 1,
    "total_managers": 1
  },
  "engineer_pool": {
    "status": "running", 
    "active_engineers": 1,
    "total_engineers": 1
  },
  "coordinator": {
    "status": "running",
    "active_runs": 0
  }
}
```

#### UI Interaction
- **Status Dashboard**: System health overview
- **Pool Status**: Visual indicators for manager/engineer availability
- **Health Checks**: Periodic status updates
- **Alert System**: Notifications for system issues

---

### 10. Get Project Data

**GET** `/api/v1/project-data`

Retrieves all intents and stories in the system for data export or analysis.

#### Response
```json
{
  "intents": [
    {
      "id": "string",
      "name": "string",
      "slug": "string",
      "run_id": "string",
      "run_mode": "shadow" | "merge" | null,
      "created_at": "2024-01-01T00:00:00Z",
      "priority": "medium",
      "owner": "string" (optional),
      "estimated_completion_date": "2024-01-01T00:00:00Z" (optional),
      "notes": "string" (optional)
    }
  ],
  "stories": [
    {
      "id": "string",
      "intent_id": "string",
      "title": "string",
      "acceptance": "string",
      "status": "blocked" | "ready" | "in_progress" | "done" | "failed",
      "deps": ["string"],
      "scope_globs": ["string"],
      "engineer_kind": "string",
      "order_idx": 0,
      "created_at": "2024-01-01T00:00:00Z",
      "priority": "medium",
      "owner": "string" (optional),
      "estimated_completion_date": "2024-01-01T00:00:00Z" (optional),
      "notes": "string" (optional)
    }
  ],
  "total_intents": 0,
  "total_stories": 0
}
```

#### UI Interaction
- **Data Export**: Export to JSON/CSV formats
- **Analytics Dashboard**: Charts and metrics based on project data
- **Search/Filter**: Advanced filtering capabilities
- **Bulk Operations**: Mass updates to intents/stories

---

### 11. Health Check

**GET** `/api/v1/health`

Simple health check endpoint.

#### Response
```json
{
  "status": "healthy",
  "service": "neuro-coordinator"
}
```

#### UI Interaction
- **Health Indicator**: Simple green/red status indicator
- **Monitoring**: Used by monitoring systems and load balancers

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `404`: Resource not found
- `500`: Internal server error

Error responses follow this format:
```json
{
  "detail": "Error message describing what went wrong"
}
```

## UI Interaction Patterns

### 1. Simplified Plan Management Flow (New Schema)
1. **Create/Edit Plan** → **View Plan** → **Execute Plan** → **Monitor History**

**Key Changes:**
- Single API call for all plan operations
- Stories nested within intents in UI
- Automatic create/update detection
- Historical execution tracking

### 2. Plan Creation Workflow
1. **Project Setup** → **Add Intents with Stories** → **Configure Agents** → **Set Checkpoints** → **Save Plan**

**UI Structure:**
```
Project
├── Project Details (name, description, budget)
├── Intents
│   ├── Intent 1
│   │   ├── Intent Details (name, description, dependencies)
│   │   └── Stories
│   │       ├── Story 1 (objective, criteria, etc.)
│   │       └── Story 2 (objective, criteria, etc.)
│   └── Intent 2
│       └── Stories...
├── Agents
└── Checkpoints
```

### 3. Plan Execution Flow
1. **Review Plan** → **Execute with Mode** → **Monitor Progress** → **View Historical Versions**

**Execution Features:**
- Automatic historical plan saving
- Real-time execution monitoring
- Historical plan reference
- Mode selection (shadow/merge)

### 4. Plan Updates
1. **Load Current Plan** → **Modify Structure** → **Save Changes** → **Verify Updates**

**Update Behavior:**
- Complete plan overwrite
- Preserves execution history
- Automatic create/update detection
- Immediate validation feedback

## Simplified Plan Management System

The new API uses a simplified approach with automatic create/update detection and historical execution tracking:

### How It Works
1. **Single Endpoint**: All plan operations go through `/api/v1/plans`
2. **Automatic Detection**: API detects create vs update based on project existence
3. **Complete Overwrite**: Each update completely replaces the plan data
4. **Historical Tracking**: Every execution saves a timestamped snapshot
5. **Nested Structure**: Stories are nested within intents for better organization

### Key Features
- **Simplified API**: One endpoint for all plan operations
- **Overwrite Behavior**: Each update completely replaces existing data
- **Historical Storage**: Every execution creates a historical snapshot
- **Nested Stories**: Stories are contained within their parent intents
- **Automatic Validation**: Schema validation ensures data integrity

### Use Cases
- **Rapid Iteration**: Quickly update plans with complete data replacement
- **Version Control**: Historical snapshots for every execution
- **Simplified UI**: Single API call for all plan operations
- **Data Consistency**: Overwrite behavior ensures data integrity

### Best Practices
- Send complete plan data for each update
- Use historical plan IDs to reference previous executions
- Structure stories within intents for better organization
- Monitor execution history for audit trails

## Execution Flow Architecture

### Shadow/Merge Mode System

The Neuro system provides a sophisticated execution architecture that allows users to choose between different execution strategies based on their needs.

#### System Flow Overview

1. **UI Mode Selection**: User selects execution mode (`shadow` or `merge`) via the `/api/v1/plans/{project_id}/execute` endpoint
2. **Intent Storage**: The selected mode is stored in the `Intent.run_mode` field in the database
3. **Manager Processing**: Managers receive intents and pass the `run_mode` along with story events
4. **Engineer Selection**: The Engineer Pool dynamically selects the appropriate engineer type based on the run mode
5. **Story Execution**: Engineers execute stories according to their mode-specific behavior
6. **Output Generation**: Results are generated according to the integration option (Local vs GitHub)

#### Engineer Selection Logic

The system automatically selects the appropriate engineer type based on the execution mode:

- **Shadow Mode** → `shadow-engineer` → Creates markdown documentation
- **Merge Mode** → `claude-engineer` → Uses Claude Code CLI for real implementation

```python
# Engineer selection logic in EngineerPool
if run_mode == "shadow":
    required_engineer_type = "shadow-engineer"
else:
    required_engineer_type = "claude-engineer"  # Default for merge/claude modes
```

#### Integration Options

The system supports two integration patterns that work with both execution modes:

1. **Local Execution**: 
   - Files created in `run_outputs/{execution_id}/` directory
   - No version control integration
   - Direct file generation

2. **GitHub Integration**: 
   - Creates branches and PRs on GitHub
   - Full version control workflow
   - Team collaboration support

#### Mode + Integration Matrix

| Mode + Integration | Engineer Type | Output Location | Behavior |
|-------------------|---------------|-----------------|----------|
| `shadow` + Local | Shadow Engineer | `run_outputs/` | Markdown documentation files |
| `shadow` + GitHub | Shadow Engineer | GitHub PRs | Markdown files in pull requests |
| `merge` + Local | Claude Engineer | `run_outputs/` | AI-generated code files |
| `merge` + GitHub | Claude Engineer | GitHub PRs | AI-generated code with auto-merge |

#### Execution Workflow

**Shadow Mode Workflow:**
1. Story assigned to Shadow Engineer
2. Engineer creates markdown documentation with:
   - Story title and ID
   - Intent information
   - Acceptance criteria
   - Test documentation
3. Files saved to workspace with naming pattern: `{title}_{story_id}.md`

**Merge Mode Workflow:**
1. Story assigned to Claude Engineer
2. Engineer uses Claude Code CLI with:
   - Full codebase context
   - Intelligent code generation
   - Framework-specific guidelines
3. Real implementation files created
4. PRs auto-merged if GitHub integration enabled

## Development Notes

- The API clears the database on startup for fresh state
- All timestamps are in ISO 8601 format with UTC timezone
- The system supports both shadow and merge execution modes with automatic engineer selection
- Git workflow integration is available for auto-approved plans
- CORS is configured for local development with React/Next.js frontends
- **New Schema**: Stories are nested within intents for better organization
- **Simplified API**: Single endpoint handles all plan operations with overwrite behavior
- **Historical Tracking**: Every execution creates a timestamped snapshot for reference
- **Schema Validation**: JSON schema validation ensures data integrity
- **Automatic Detection**: API automatically detects create vs update operations
- **Engineer Pool**: Dynamic engineer allocation based on execution mode requirements

## API Flow Examples

### Basic Plan Creation Flow

1. **Create Plan**
   ```bash
   POST /api/v1/plans
   {
     "project": {
       "id": "proj-123",
       "name": "My Project",
       "description": "A sample project",
       "status": "planned",
       "created_at": "2024-01-01T00:00:00Z",
       "updated_at": "2024-01-01T00:00:00Z",
       "progress": {"completion_percentage": 0},
       "budget": {"limit": 10000, "used": 0},
       "roadmap": {
         "intents": [
           {
             "id": "intent-1",
             "name": "Backend Setup",
             "description": "Set up backend infrastructure",
             "dependencies": [],
             "stories": [
               {
                 "id": "story-1",
                 "objective": "Create database schema",
                 "workstream_id": "backend",
                 "acceptance_criteria": ["Database tables created"],
                 "dependencies": [],
                 "implementation_notes": ["Use SQLAlchemy"],
                 "estimated_tokens": 1000,
                 "complexity_score": 3,
                 "created_at": "2024-01-01T00:00:00Z",
                 "updated_at": "2024-01-01T00:00:00Z",
                 "preferences": {"preferred_agents": [], "execution_overrides": {}},
                 "execution": {"current": {"status": "planned"}, "history": []}
               }
             ]
           }
         ]
       },
       "checkpoints": []
     },
     "agents": [
       {
         "id": "agent-1",
         "name": "Backend Engineer",
         "role": "engineer",
         "manager_id": null,
         "reports": [],
         "assigned_story_ids": ["story-1"]
       }
     ]
   }
   ```

2. **Get Plan**
   ```bash
   GET /api/v1/plans/proj-123
   ```

3. **Execute Plan (Shadow Mode)**
   ```bash
   POST /api/v1/plans/proj-123/execute?mode=shadow
   ```
   
   **Response:**
   ```json
   {
     "status": "execution_started",
     "project_id": "proj-123",
     "historical_plan_id": "proj-123-20241219-143022",
     "mode": "shadow",
     "intent_count": 1,
     "message": "Plan execution started and saved to historical storage as proj-123-20241219-143022"
   }
   ```
   
   **Files Generated** (in `run_outputs/plan-proj-123/`):
   ```
   run_outputs/
   └── plan-proj-123/
       ├── _execution_summary.md
       └── Create_login_API_story123.md
   ```

4. **Execute Plan (Merge Mode)**
   ```bash
   POST /api/v1/plans/proj-123/execute?mode=merge
   ```
   
   **Response:**
   ```json
   {
     "status": "execution_started",
     "project_id": "proj-123",
     "historical_plan_id": "proj-123-20241219-143045",
     "mode": "merge",
     "intent_count": 1,
     "message": "Plan execution started and saved to historical storage as proj-123-20241219-143045"
   }
   ```
   
   **Files Generated** (with actual code implementation):
   ```
   run_outputs/
   └── plan-proj-123/
       ├── _execution_summary.md
       ├── src/
       │   ├── auth/
       │   │   ├── login.py
       │   │   └── models.py
       │   └── routes/
       │       └── auth_routes.py
       └── tests/
           └── test_auth.py
   ```

5. **View History**
   ```bash
   GET /api/v1/plans/proj-123/history
   ```

### Plan Update Flow

1. **Update Plan** (same endpoint, overwrites existing data)
   ```bash
   POST /api/v1/plans
   {
     "project": {
       "id": "proj-123",  # Same project ID
       "name": "Updated Project Name",
       // ... rest of updated plan data
     },
     "agents": [...]
   }
   ```

### Key Benefits of New Schema

- **Simplified API**: One endpoint for all operations
- **Better Organization**: Stories nested within intents
- **Historical Tracking**: Every execution creates a snapshot
- **Automatic Detection**: Create vs update handled automatically
- **Data Consistency**: Overwrite behavior ensures clean state

## Environment Variables

- `DATABASE_URL`: Database connection string (default: `sqlite:///neuro.db`)
- `ENGINEER_POOL_SIZE`: Number of engineer agents (default: 1)
- `MANAGER_POOL_SIZE`: Number of manager agents (default: 1)
- `PORT`: API server port (default: 8000)
- `NEURO_FORCE_DB_RESET`: Force database reset on startup (default: 0)
