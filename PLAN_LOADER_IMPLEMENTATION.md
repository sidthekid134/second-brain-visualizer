# Plan Loader Implementation

This document describes the implementation of the plan loading, execution, and tracking features added to the Second Brain Visualizer.

## Overview

The implementation adds the ability to:
1. Load and validate plan JSON through a UI
2. Submit plans to the Neuro Coordinator API with configurable options
3. Track execution progress and approve intents
4. Monitor live execution events and status

## Components Added/Modified

### 1. PlanLoader Component (`/src/components/PlanLoader.js`)

A new tab component that provides:

**Features:**
- JSON text area for plan input with syntax highlighting
- Real-time plan validation using API service validation
- Example plan template loading
- Configurable submission options:
  - Execution mode (Shadow/Merge)
  - Auto-approval settings
  - Repository URL and branch configuration
- Connection status monitoring
- Visual feedback for validation and submission results

**Usage:**
```javascript
<PlanLoader onPlanSubmitted={handlePlanSubmitted} />
```

### 2. Enhanced API Service (`/src/services/apiService.js`)

Extended with new methods for plan execution:

**New Methods:**
- `submitPlan(plan, options)` - Submit execution plans to API
- `approveIntent(intentId, mode)` - Approve individual intents
- `approvePlan(intentIds, mode)` - Batch approve multiple intents
- `getIntents()` - Fetch all intents with status
- `getRunEvents(runId, limit, offset)` - Get execution events for a run
- `validatePlanStructure(plan)` - Client-side plan validation

**Plan Structure Validation:**
The service validates plan JSON against the expected API contract:
- Required fields validation
- Intent and story structure checking
- Dependencies array validation
- Scope globs validation

### 3. Enhanced LiveExecution Component (`/src/components/LiveExecution.js`)

Added execution tracking and approval functionality:

**New Features:**
- Intent management panel with approval controls
- Real-time execution event monitoring
- Individual and batch intent approval
- Execution mode selection (Shadow/Merge)
- Live status updates with polling
- Event timeline display

**UI Sections:**
- **Intent Management**: Shows pending intents with approval controls
- **Recent Events**: Displays execution events in real-time
- **Running Stories**: Shows currently executing stories
- **Ready/Completed Stories**: Status overview

### 4. Updated App Component (`/src/App.js`)

**Changes:**
- Added "Plan Loader" tab to main navigation
- Integrated plan submission callback to auto-switch to execution view
- Connected plan loader to overall app state management

## Workflow

### 1. Plan Loading Workflow

```
User Input → Validation → Configuration → Submission → Execution Tracking
```

1. **Input**: User pastes or loads plan JSON in the Plan Loader tab
2. **Validation**: Client-side validation checks plan structure
3. **Configuration**: User configures execution options (mode, repo, etc.)
4. **Submission**: Plan sent to API with auto_approve=false
5. **Redirect**: App automatically switches to Live Execution tab
6. **Tracking**: User can approve intents and monitor progress

### 2. Plan Approval Workflow

```
Plan Submitted → Intents Created → Manual Approval → Execution Starts → Live Monitoring
```

1. **Plan Submission**: Creates intents in "pending" state
2. **Intent Review**: User reviews intents in Live Execution tab
3. **Approval**: User approves intents individually or in batch
4. **Execution**: Approved intents begin execution
5. **Monitoring**: Real-time status updates and event tracking

## API Integration

### Configuration

The app connects to the Neuro Coordinator API (default: `http://localhost:8000`):

- API connection configured via existing API Config modal
- Real-time polling for status updates (5-second intervals)
- Automatic retry with exponential backoff
- Connection status indicators throughout UI

### Plan Submission Format

Plans are submitted in the API's expected format:

```json
{
  "intents": [
    {
      "name": "Intent Name",
      "stories": [
        {
          "title": "Story Title",
          "acceptance": "Acceptance criteria",
          "deps": ["dependency-story-ids"],
          "scope_globs": ["file-patterns"],
          "engineer_kind": "engineer-type",
          "priority": "high|medium|low",
          "owner": "owner-name",
          "estimated_completion_date": "ISO-date",
          "notes": "Additional notes"
        }
      ]
    }
  ],
  "auto_approve": false,
  "base_repo_url": "https://github.com/user/repo",
  "base_branch": "main",
  "default_run_mode": "shadow"
}
```

### Execution Modes

- **Shadow Mode**: Safe testing mode that creates markdown files instead of real code
- **Merge Mode**: Real execution with actual code generation and merging

## Error Handling

### Validation Errors
- Client-side JSON parsing errors
- Plan structure validation errors
- Missing required fields
- Invalid data types

### API Errors
- Connection failures with retry logic
- HTTP error responses with user feedback
- Timeout handling
- Network disconnection recovery

### User Feedback
- Visual indicators for connection status
- Success/error alerts for operations
- Loading states for async operations
- Detailed error messages with context

## Usage Instructions

### 1. Configure API Connection
1. Click "API Config" button in header
2. Set base URL (e.g., `http://localhost:8000`)
3. Test connection

### 2. Load a Plan
1. Navigate to "Plan Loader" tab
2. Paste JSON or click "Load Example"
3. Configure execution options
4. Click "Validate" to check structure
5. Click "Submit Plan" to send to API

### 3. Approve and Monitor Execution
1. App automatically switches to "Live Execution" tab
2. Review intents in the Intent Management panel
3. Select execution mode (Shadow/Merge)
4. Approve intents individually or use "Approve All Pending"
5. Monitor progress in real-time

### 4. Track Execution
- View running stories with progress
- Monitor recent execution events
- See completion status and metrics
- Access execution logs and details

## Development Notes

### Dependencies
- No new external dependencies added
- Leverages existing styled-components and React Flow
- Uses browser's native JSON parsing and validation

### Performance Considerations
- Efficient polling with abort controllers
- Debounced validation to avoid excessive API calls
- Memoized components to prevent unnecessary re-renders
- Limited event history to manage memory usage

### Future Enhancements
- WebSocket support for real-time events
- Plan template library
- Export execution reports
- Advanced filtering and search
- Execution analytics and metrics

## Testing

The implementation includes:
- Plan validation unit tests via API service
- Error boundary handling
- Connection retry logic
- User input sanitization
- Graceful degradation when API unavailable

Build test shows successful compilation with only ESLint warnings for unused variables (not errors).
