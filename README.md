# Second Brain Project Visualizer

A React application that visualizes project plan data with real-time monitoring, interactive dependency graphs, and comprehensive project insights.

## 🚀 Features

### Real-time File Monitoring
- **Auto-reload**: Can monitor `public/live-file.json` for changes every 2 seconds (disabled by default)
- **Live Updates**: Instantly refreshes the visualization when the file is updated
- **Visual Feedback**: Shows loading indicators and success notifications
- **Toggle Control**: Enable/disable auto-reload as needed

### Interactive Dependency Graph
- **Draggable Nodes**: All story nodes can be repositioned
- **Milestone Color Coding**: Different colors for each project milestone
- **Critical Path Highlighting**: Red animated edges show the critical path
- **Status & Priority Badges**: Quick visual indicators for story status and priority
- **Zoom & Pan Controls**: Navigate large project graphs easily

### Comprehensive Sidebar
- **Project Overview**: Key metrics and information
- **Dependency Analysis**: Critical path, parallelization scores, and phase estimates
- **Story Details**: Complete information about selected stories
- **Story List**: Clickable overview of all project stories

## 🛠️ Setup and Usage

### Installation
```bash
npm install
npm start
```

The app will start at `http://localhost:3000` and automatically load the project plan.

### Real-time Monitoring

1. Enable auto-reload by clicking the toggle button in the app header
2. The app will monitor `public/live-file.json` for changes
3. When the file changes, the visualization will automatically update

### Custom Project Plans
- Click "Upload Custom Project Plan" to load your own JSON files
- The app will switch to the uploaded plan and stop monitoring the live file

## 📁 Project Structure

```
src/
├── App.js                    # Main application with real-time monitoring
├── components/
│   ├── DependencyGraph.js    # React Flow visualization
│   ├── ProjectSidebar.js     # Project details and story information
│   └── FileUpload.js         # File upload functionality
```

## 🎨 Color Coding

### Milestones
- **Project Setup**: Light Blue
- **Component Creation**: Light Purple
- **Feature Implementation**: Light Green
- **Styling**: Light Orange
- **Testing**: Light Pink
- **Documentation**: Light Lime

### Status Badges
- **Ready**: Green
- **Blocked**: Red
- **In Progress**: Yellow
- **Completed**: Blue

### Priority Badges
- **High**: Red
- **Medium**: Orange
- **Low**: Green

## ⚡ Real-time Monitoring Details

The application uses a polling mechanism to check for file updates:
- **Polling Interval**: 2 seconds
- **Cache Busting**: Timestamp query parameters prevent browser caching
- **Change Detection**: Compares file modification timestamps
- **Efficient Updates**: Only re-renders when content actually changes
- **Error Handling**: Graceful handling of file read errors

## 📊 Data Format

The application expects JSON files in the following format:
```json
{
  "id": "project-id",
  "name": "Project Name",
  "description": "Project Description",
  "stories": {
    "STORY-ID": {
      "id": "STORY-ID",
      "objective": "Story objective",
      "dependencies": ["OTHER-STORY-ID"],
      "status": "ready|blocked|in_progress|completed",
      "priority": "high|medium|low",
      "milestone": "Milestone Name"
    }
  },
  "dependency_analysis": {
    "critical_path": ["STORY-1", "STORY-2"],
    "dependency_depth": {
      "STORY-ID": 0
    }
  }
}
```

## 🔧 Development

- Built with React 18, React Flow, and Styled Components
- Real-time file monitoring with polling
- Responsive design with modern UI components
- Comprehensive error handling and user feedback

## 📝 License

This project is open source and available under the MIT License. 