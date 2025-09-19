# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Core Development Commands

### Essential Commands
```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage --watchAll=false

# Install dependencies
npm install
```

### Development Workflow
The app runs on `http://localhost:3000` by default and connects to the Neuro Coordinator API at `http://localhost:8000`.

## Architecture Overview

### High-Level Application Structure
This is a React-based project visualization tool that bridges between plan staging/editing and live execution monitoring through a Neuro Coordinator API backend. The application follows a **strict separation of concerns** between staging data and live execution data.

### Core Architecture Patterns

#### 1. **Lifecycle State Management**
The application operates in distinct lifecycle states:
- **`staging`** - Local plan editing and development (default)
- **`submitted`** - Plan submitted to backend but not approved
- **`executing`** - Plan actively running on backend
- **`completed`** - Plan execution finished
- **`failed`** - Plan execution failed

#### 2. **Data Separation Pattern**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Plan Editor   │    │   Plan Loader   │    │ Live Execution  │
│   (Staging)     │    │   (Bridge)      │    │   (Live API)    │
│                 │    │                 │    │                 │
│ • Local files   │──▶ │ • Validation    │──▶ │ • Real-time API │
│ • Session data  │    │ • Submission    │    │ • Polling       │
│ • User edits    │    │ • Configuration │    │ • Status        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### 3. **Context-Driven State Management**
The `PlanContext` provides centralized state management with separate data streams:
- **Staging Data**: `planData`, `pendingChanges`, `hasUnsavedChanges`
- **Live Execution Data**: `liveExecutionData`, `liveDataSource`, `liveDataTimestamp`
- **Lifecycle Management**: `lifecycleState`, `lastSubmission`, `executionMetadata`

### Key Components Architecture

#### Tab-Based Interface
- **Plan Editor**: Visual flow editor for staging plans with React Flow
- **Plan Loader**: Configuration and submission interface
- **Live Execution**: Real-time monitoring of backend execution
- **Idea Builder**: Interactive plan creation interface

#### Flow Visualization System
Built on React Flow with custom node types:
- **IntentNode**: High-level project objectives
- **StoryNode**: Individual development tasks
- **MilestoneNode**: Project checkpoints
- **Dual-level navigation**: Intent view ↔ Story view with breadcrumb navigation

#### API Integration Layer
The `apiService` handles all backend communication with:
- **Connection management**: Health checks, retry logic, timeout handling
- **Data transformation**: API ↔ UI schema conversion
- **Real-time polling**: Live execution status updates
- **Error handling**: Exponential backoff, graceful degradation

## Key Development Patterns

### 1. **State Management in PlanContext**
When working with state, always use the context methods:
```javascript
// Get data based on current lifecycle state
const stagingData = getStagingData();
const liveData = getLiveExecutionData();

// Lifecycle transitions
submitPlan(planData, submissionResult, config);
startExecution(runIds, mode, approvedIntents);
```

### 2. **API Data Transformation**
The application uses a bi-directional transformation pattern:
- **API → UI Schema**: `transformAPIDataToSchema()`
- **UI Schema → API**: `validateAndTransformPlan()`

Always validate data structure when working with API responses.

### 3. **React Flow Integration**
When modifying the visual editor:
- Custom nodes are in `src/components/nodes/`
- Flow utilities are in `src/utils/flowUtils.js`
- Layout algorithms use Dagre for automatic positioning
- State synchronization between React Flow and PlanContext is critical

### 4. **Component Communication**
- Use context for global state (plan data, lifecycle state)
- Use props for component-specific data
- Use callbacks for parent-child communication
- Modal state is managed locally within components

## Testing Strategy

### Test Structure
Tests are located in `src/services/__tests__/` and follow Jest conventions.

### Key Testing Areas
- **API Service**: Connection handling, data transformation, error scenarios
- **Context Operations**: State transitions, data management
- **Component Integration**: Flow editor interactions, modal workflows

### Running Specific Tests
```bash
# Run API service tests
npm test -- apiService.test.js

# Run tests in watch mode
npm test

# Generate coverage report
npm test -- --coverage --watchAll=false
```

## API Integration

### Neuro Coordinator Backend
The app connects to a FastAPI backend running on `http://localhost:8000` with endpoints for:
- **Health**: `/api/v1/health`
- **Project Data**: `/api/v1/project-data`
- **Intent Management**: `/api/v1/intents/*`
- **Plan Operations**: `/api/v1/plans/*`

### Environment Configuration
Configure API connection via environment variables:
```bash
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_API_TIMEOUT=10000
REACT_APP_API_DEBUG=true
REACT_APP_API_POLLING_FREQUENCY=5000
```

### Connection Status Monitoring
The app continuously monitors API connectivity and displays status in the header. Connection failures trigger retry logic with exponential backoff.

## Development Workflow Patterns

### 1. **Plan Development Cycle**
```
Plan Editor → Stage Changes → Plan Loader → Submit → Live Execution → Monitor
     ↑                                                        ↓
     └──────────────── Iterate Based on Results ──────────────┘
```

### 2. **Feature Development**
When adding new features:
1. Add to appropriate component directory (`components/`, `panels/`, `modals/`)
2. Update context if state management is needed
3. Add API integration if backend communication required
4. Update flow utilities for visualization changes
5. Add tests for new functionality

### 3. **Data Flow Debugging**
Use the debug flag in `apiService` and browser DevTools to trace:
- API calls and responses
- State transitions in PlanContext
- React Flow node updates
- Real-time polling behavior

## File Organization Patterns

### Component Structure
```
src/components/
├── modals/          # Dialog components
├── nodes/           # React Flow custom nodes
├── panels/          # Side panel components
└── *.js             # Main UI components
```

### Service Layer
```
src/services/
├── apiService.js    # Backend integration
└── __tests__/       # Service tests
```

### Utilities
```
src/utils/
├── flowUtils.js     # React Flow helpers
└── dateUtils.js     # Date/time utilities
```

## Styling and UI Patterns

The app uses **styled-components** with consistent design patterns:
- **Color Scheme**: Blue primary (`#3498db`), semantic colors for status
- **Layout**: Flexbox-based responsive design
- **Interactive Elements**: Hover effects, transitions, visual feedback
- **Typography**: System font stack with consistent sizing

## Important Development Notes

### React Flow Considerations
- Always use React Flow hooks within the flow context
- Node positioning is handled by Dagre layout algorithm
- Custom node props must be serializable
- Edge animations use CSS for performance

### Context API Usage
- PlanContext provides all global state management
- Use `usePlan()` hook to access context
- State updates trigger re-renders across all consuming components
- History management (undo/redo) is built into the context

### API Error Handling
- All API calls include timeout and retry logic
- Connection status is continuously monitored
- Graceful degradation when backend is unavailable
- User feedback for all API operations

### Performance Considerations
- React Flow rendering is optimized for large graphs
- API polling frequency is configurable
- Session storage is used for persistence
- Debounced save operations prevent excessive writes