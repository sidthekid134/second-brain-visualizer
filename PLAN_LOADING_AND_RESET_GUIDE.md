# Plan Loading and Reset Features

## Overview

This document describes the new plan loading and reset functionality that enables seamless workflow between plan loading, editing, and live execution tracking.

## 🚀 **New Features Implemented**

### **1. Plan Loader → Plan Editor Integration**

When you validate a plan in the Plan Loader:
- ✅ Plan is automatically loaded into Plan Editor staging area
- ✅ Visual confirmation: "Plan structure is valid! ✅ Loaded into Plan Editor staging area."
- ✅ Data source updated to indicate `plan_loader` origin
- ✅ Plan immediately available for editing in Plan Editor tab

**Workflow:**
```
Plan Loader Tab:
1. Paste plan JSON
2. Click "Validate Plan" 
3. → Plan automatically loads to Plan Editor staging
4. Switch to Plan Editor tab to see and edit the loaded plan
```

### **2. Plan Editor Reset Controls**

Two new floating action buttons added to Plan Editor:

#### **🔄 Reset from Backend**
- **Purpose**: Load live execution data from backend into staging area
- **Behavior**: 
  - Fetches current live data from API
  - Overwrites staging area with live data
  - Clears all pending changes
  - Requires confirmation dialog
- **Availability**: Only enabled when connected to API
- **Use Case**: Sync staging area with current backend execution state

#### **🗑️ Discard Changes**
- **Purpose**: Discard all pending staging changes
- **Behavior**:
  - Reverts to last loaded/saved state
  - Clears all pending modifications
  - Requires confirmation dialog
- **Availability**: Only enabled when there are unsaved changes
- **Use Case**: Reset to clean state without affecting backend

## 🔄 **Complete User Workflows**

### **Workflow 1: Load and Edit Plan**
```
1. Plan Loader: Load/paste plan JSON → Validate
2. Plan Editor: Automatically loaded, ready for editing
3. Plan Editor: Make changes, stage modifications
4. Plan Loader: Submit when ready for execution
5. Live Execution: Monitor real-time execution
```

### **Workflow 2: Reset from Backend**
```
1. Live Execution: Running plan execution
2. Plan Editor: Want to sync staging with current backend state
3. Plan Editor: Click "🔄 Reset from Backend"
4. Plan Editor: Staging area now has live backend data
5. Plan Editor: Continue editing from current live state
```

### **Workflow 3: Discard Staging Changes**
```
1. Plan Editor: Made experimental changes
2. Plan Editor: Decide changes aren't wanted
3. Plan Editor: Click "🗑️ Discard Changes"
4. Plan Editor: Back to clean state before experimental changes
5. Plan Editor: Start fresh editing
```

## 🎯 **Technical Implementation**

### **Plan Loader Changes**
```javascript
const validatePlan = () => {
    try {
        const plan = JSON.parse(jsonInput);
        const result = apiService.validatePlanStructure(plan);
        
        if (result.valid) {
            // Load valid plan into Plan Editor staging
            dispatch({ type: 'SET_PLAN_DATA', payload: plan });
            dispatch({ 
                type: 'SET_DATA_SOURCE', 
                payload: { source: 'plan_loader', timestamp: new Date().toISOString() }
            });
        }
    } catch (error) {
        // Handle validation errors
    }
};
```

### **Plan Editor Reset Functions**
```javascript
// Reset from backend
const handleResetFromBackend = async () => {
    const confirmed = window.confirm('Reset staging area with live data from backend?');
    if (!confirmed) return;
    
    try {
        const liveData = getLiveExecutionData() || await apiService.refreshProjectData();
        dispatch({ type: 'SET_PLAN_DATA', payload: liveData });
        dispatch({ type: 'DISCARD_ALL_CHANGES' });
    } catch (error) {
        console.error('Reset failed:', error);
    }
};

// Discard staging changes
const handleDiscardChanges = () => {
    const confirmed = window.confirm('Discard all staging changes?');
    if (!confirmed) return;
    
    dispatch({ type: 'DISCARD_ALL_CHANGES' });
};
```

### **UI Controls**
```jsx
<FloatingButtonContainer>
    <ResetFloatingButton 
        onClick={handleResetFromBackend}
        disabled={liveDataSource === 'disconnected'}
        title="Reset staging area with live backend data"
    >
        🔄 Reset from Backend
    </ResetFloatingButton>
    
    <DiscardFloatingButton 
        onClick={handleDiscardChanges}
        disabled={!hasUnsavedChanges}
        title="Discard all staging changes"
    >
        🗑️ Discard Changes
    </DiscardFloatingButton>
</FloatingButtonContainer>
```

## 📋 **Visual Indicators**

### **Plan Loader Feedback**
- ✅ **Success**: "Plan structure is valid! ✅ Loaded into Plan Editor staging area."
- ❌ **Error**: Validation errors listed with clear descriptions

### **Plan Editor Button States**
- **Reset from Backend**: 
  - Enabled when API connected
  - Disabled with tooltip when disconnected
- **Discard Changes**:
  - Enabled when pending changes exist
  - Disabled with tooltip when no changes

### **Data Source Tracking**
- Plan Editor shows staging mode indicator
- Data source tracking shows origin (`plan_loader`, `reset_from_backend`, etc.)
- Clear separation between staging and live data

## 🛠 **Configuration & Setup**

### **No Additional Setup Required**
- Features work with existing API configuration
- Uses existing connection management
- Leverages existing context state management

### **Browser Compatibility**
- Confirmation dialogs use standard `window.confirm()`
- Tooltips use standard HTML `title` attribute
- No additional dependencies required

## ⚡ **Performance Considerations**

### **Efficient Data Loading**
- Plan validation happens client-side first
- Backend reset only fetches when needed
- Discard operations are local and instant

### **Memory Management**
- Old plan data replaced, not accumulated
- Pending changes cleared appropriately
- No memory leaks from event handlers

## 🔍 **Error Handling**

### **Plan Loading Errors**
- JSON parsing errors caught and displayed
- Validation errors listed clearly
- No plan loaded if validation fails

### **Reset Errors**
- Network failures handled gracefully
- User notified of API connection issues
- Fallback to cached live data when available

### **Confirmation Dialogs**
- All destructive actions require confirmation
- User can cancel any reset/discard operation
- Clear messaging about what will be lost

## 🚦 **Best Practices**

### **Plan Development Workflow**
1. **Load Plans**: Use Plan Loader to import existing plans
2. **Stage Changes**: Edit freely in Plan Editor staging area
3. **Reset When Needed**: Sync with backend when development diverges
4. **Discard Experiments**: Clean up unwanted changes easily
5. **Submit When Ready**: Use Plan Loader to submit polished plans

### **Data Management**
1. **Save Frequently**: Use existing file save features for backups
2. **Confirm Resets**: Always read confirmation dialogs carefully
3. **Test Connections**: Ensure API connectivity before reset operations
4. **Version Control**: Save major plan versions to files

## 🎉 **Benefits**

### **Improved Workflow**
- ✅ Seamless plan loading from JSON to editor
- ✅ Easy sync between staging and live data
- ✅ Quick recovery from experimental changes
- ✅ Clear separation of concerns

### **User Experience**
- ✅ Visual feedback for all operations
- ✅ Confirmation dialogs prevent accidental data loss
- ✅ Intuitive button placement and tooltips
- ✅ Consistent with existing UI patterns

### **Development Efficiency**
- ✅ Faster iteration cycles
- ✅ Less context switching between tabs
- ✅ Clear data flow management
- ✅ Robust error handling

This implementation completes the plan lifecycle with comprehensive loading, editing, and reset capabilities while maintaining data integrity and user safety through confirmation dialogs and clear visual feedback.
