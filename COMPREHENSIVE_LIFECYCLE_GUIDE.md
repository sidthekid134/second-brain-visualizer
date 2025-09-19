# Comprehensive Plan Lifecycle Management System

## Overview

This document describes the complete implementation of a comprehensive plan lifecycle management system that properly separates staging/editing from live execution tracking in the Second Brain Visualizer.

## 🎯 **Core Architecture Principles**

### **Separation of Concerns**
- **Plan Editor**: Uses staging data, independent of live backend execution
- **Live Execution**: Uses real-time API data, tracks backend execution state
- **Plan Loader**: Bridge between staging and execution through plan submission

### **Data Flow Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Plan Editor   │    │   Plan Loader   │    │ Live Execution  │
│   (Staging)     │    │   (Bridge)      │    │   (Live API)    │
│                 │    │                 │    │                 │
│ • Local files   │──▶ │ • Validation    │──▶ │ • Real-time API │
│ • Session data  │    │ • Submission    │    │ • Polling       │
│ • User edits    │    │ • Configuration │    │ • Status        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        ▲                        │                        │
        │                        ▼                        ▼
        │               ┌─────────────────┐    ┌─────────────────┐
        │               │ Neuro API       │    │ Intent Approval │
        │               │ /plans/full     │    │ & Monitoring    │
        └───────────────┤ (Submit)        │    │                 │
                        └─────────────────┘    └─────────────────┘
```

## 🚀 **Lifecycle States**

### **State Definitions**
1. **`staging`** - Working with local/staged data (default state)
2. **`submitted`** - Plan submitted to backend but not approved
3. **`executing`** - Plan actively running on backend
4. **`completed`** - Plan execution finished
5. **`failed`** - Plan execution failed

### **State Transitions**
```
staging ──[Submit Plan]──▶ submitted ──[Approve Intents]──▶ executing ──[Complete]──▶ completed
   ▲                           │                              │
   │                           │                              ▼
   └─────[Reset to Staging]────┘                           failed
```

## 🔄 **Complete User Workflows**

### **1. Plan Creation & Staging Workflow**
```
Plan Editor Tab:
1. Create new plan or load existing
2. Edit intents, stories, dependencies
3. Stage changes locally
4. Save to files when ready
5. Plan Editor remains independent of backend
```

### **2. Plan Submission Workflow**
```
Plan Loader Tab:
1. Load plan JSON (manual paste or from staging)
2. Validate plan structure
3. Configure execution options:
   - Execution mode (Shadow/Merge)
   - Auto-approval settings
   - Repository configuration
4. Submit to backend (auto_approve: false)
5. Lifecycle state: staging → submitted
```

### **3. Live Execution Workflow**
```
Live Execution Tab:
1. Auto-switch after submission
2. View submitted intents awaiting approval
3. Configure approval mode (Shadow/Merge)
4. Approve intents individually or in batch
5. Monitor real-time execution progress
6. Track events and status updates
7. Lifecycle state: submitted → executing → completed
```

### **4. Iterative Development Workflow**
```
Continuous Development:
1. Plan Editor: Continue staging new changes
2. Live Execution: Monitor current execution
3. Plan Loader: Submit updates when ready
4. Multiple executions can run while staging continues
```

## 📊 **Data Management System**

### **PlanContext State Structure**
```javascript
{
  // Staging Data (Plan Editor)
  planData: { /* staging plan data */ },
  dataSource: 'loading|default|session_storage|work_file',
  dataTimestamp: '2024-01-01T00:00:00Z',
  pendingChanges: { /* staged changes */ },
  hasUnsavedChanges: boolean,
  
  // Live Execution Data (Live Execution Tab)
  liveExecutionData: { /* real-time API data */ },
  liveDataSource: 'disconnected|api|polling',
  liveDataTimestamp: '2024-01-01T00:00:00Z',
  liveDataURL: 'http://localhost:8000',
  
  // Lifecycle Management
  lifecycleState: 'staging|submitted|executing|completed|failed',
  lastSubmission: {
    timestamp: '2024-01-01T00:00:00Z',
    planData: { /* submitted plan */ },
    submissionResult: { /* API response */ },
    config: { /* submission config */ }
  },
  executionMetadata: {
    startedAt: '2024-01-01T00:00:00Z',
    runIds: ['run-123'],
    mode: 'shadow|merge',
    approvedIntents: ['intent-1', 'intent-2']
  }
}
```

### **Context API Methods**
```javascript
// Lifecycle Management
submitPlan(planData, submissionResult, config)
startExecution(runIds, mode, approvedIntents)
completeExecution(status)
resetToStaging()

// Data Management
setLiveExecutionData(data, source, url)
setLiveDataSource(source, url)
getStagingData() // Returns staging data
getLiveExecutionData() // Returns live API data

// State Helpers
isInStagingMode() // Returns true if staging
isExecuting() // Returns true if executing
```

## 🎨 **Visual Indicators**

### **App Header**
- Shows current lifecycle state when not staging
- Displays connection status
- Example: "Project execution planning • Executing"

### **Plan Editor Indicators**
- Always shows "📝 Staging Mode"
- Indicates data source (local files, session storage, etc.)
- Shows pending changes count
- Independent of live execution status

### **Live Execution Indicators**
- Real-time connection status
- Live data source indicators
- Execution progress metrics
- Auto-refresh timing information

### **Tab Behavior**
- Plan Editor: Always uses staging data
- Live Execution: Always uses live API data
- Automatic tab switching after plan submission
- Clear visual separation of data sources

## 🔧 **Technical Implementation**

### **Enhanced API Service**
```javascript
// Plan Management
validatePlanStructure(plan) // Client-side validation
submitPlan(plan, options) // Submit to backend
refreshProjectData() // Immediate API refresh

// Intent Management
getIntents() // Fetch all intents with status
approveIntent(intentId, mode) // Individual approval
approvePlan(intentIds, mode) // Batch approval

// Execution Monitoring
getRunEvents(runId, limit, offset) // Real-time events
startPolling(callback) // Live data updates
```

### **Data Transformation**
- API data automatically transformed to UI schema
- Staging data maintained separately from live data
- Consistent data structures across all tabs
- Real-time updates only affect live execution views

### **Error Handling**
- Connection failures gracefully handled
- Plan validation with detailed error messages
- Retry logic with exponential backoff
- Visual feedback for all operations

## 🛠 **Configuration & Setup**

### **Environment Variables**
```bash
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_API_TIMEOUT=10000
REACT_APP_API_POLLING_FREQUENCY=5000
REACT_APP_API_DEBUG=true
```

### **API Configuration**
- Base URL configuration via UI
- Connection testing and validation
- Polling frequency adjustment
- Real-time status monitoring

## 📋 **Usage Examples**

### **Basic Plan Development**
1. Use Plan Editor to create/edit plans locally
2. Save to files for version control
3. Submit via Plan Loader when ready
4. Monitor execution in Live Execution tab
5. Continue staging new changes in Plan Editor

### **Multiple Plan Management**
1. Stage Plan A in Plan Editor
2. Submit Plan A → starts executing
3. Continue editing Plan B in Plan Editor
4. Monitor Plan A execution in Live Execution
5. Submit Plan B when ready (parallel execution)

### **Collaborative Development**
1. Team member A works on staging
2. Team member B monitors live execution
3. Plan Editor changes don't affect running executions
4. Clear separation prevents conflicts

## 🚦 **Best Practices**

### **Development Workflow**
1. **Stage First**: Always develop in Plan Editor staging mode
2. **Validate Early**: Use Plan Loader validation before submission
3. **Monitor Live**: Keep Live Execution tab open during execution
4. **Iterate Safely**: Staging changes don't affect running plans

### **Data Management**
1. **Save Frequently**: Use Plan Editor save features for staging
2. **Version Control**: Save staged plans to files
3. **API Connection**: Maintain stable API connection for live data
4. **Backup Strategy**: Use both local files and session storage

### **Execution Management**
1. **Test with Shadow**: Always test with Shadow mode first
2. **Approve Gradually**: Approve intents individually when learning
3. **Monitor Events**: Watch execution events for debugging
4. **Handle Failures**: Use retry and rollback strategies

## 🔍 **Troubleshooting**

### **Common Issues**
1. **Data Not Updating**: Check API connection and polling status
2. **Plans Not Submitting**: Validate plan structure and connection
3. **Staging Changes Lost**: Check local storage and session data
4. **Execution Not Starting**: Verify intent approval and API status

### **Debug Tools**
1. Browser console shows detailed logs
2. API Config modal shows connection status
3. Visual indicators show data sources
4. Build warnings indicate unused variables (safe to ignore)

## 🎯 **Key Benefits**

### **Developer Experience**
- ✅ Clear separation of staging vs live execution
- ✅ No accidental overwrites of staging data
- ✅ Real-time monitoring without interference
- ✅ Flexible workflow for different development stages

### **User Workflow**
- ✅ Can develop plans while others execute
- ✅ Visual feedback at every step
- ✅ Robust error handling and recovery
- ✅ Comprehensive lifecycle management

### **System Architecture**
- ✅ Clean data flow separation
- ✅ Scalable to multiple concurrent plans
- ✅ Efficient API usage with polling
- ✅ Maintainable codebase with clear responsibilities

This comprehensive lifecycle system provides the complete workflow you requested: plan creation/loading, staging independence, live execution tracking, and proper separation between development and execution phases.
