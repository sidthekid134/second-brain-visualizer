# Second Brain Visualizer

A real-time React-based visualization tool for project management and task dependency tracking. This application provides an interactive flowchart interface to visualize project stories, their dependencies, status, and execution progress.

![Project Visualizer Screenshot](https://via.placeholder.com/800x400?text=Project+Visualizer+Interface)

## Features

- **Interactive Dependency Graph**: Visualize project stories and their relationships using React Flow
- **Real-time Updates**: Auto-refreshes every 30 seconds to show live project status
- **Status Tracking**: Color-coded nodes showing story status (Ready, In Progress, Done, Blocked, etc.)
- **Milestone Organization**: Stories grouped by milestones with distinct background colors
- **Detailed Tooltips**: Hover over nodes to see comprehensive story information
- **Execution Monitoring**: Live progress tracking with budget and completion metrics
- **Responsive Layout**: Sidebar with project information and main visualization area

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)

You can check your versions with:
```bash
node --version
npm --version
```

## Installation

1. **Clone the repository** (or download the project files):
```bash
git clone <your-repository-url>
cd second-brain-visualizer
```

2. **Install root dependencies**:
```bash
npm install
```

3. **Install UI dependencies**:
```bash
cd ui
npm install
cd ..
```

## Quick Start

1. **Navigate to the UI directory**:
```bash
cd ui
```

2. **Start the development server**:
```bash
npm start
```

3. **Open your browser** and navigate to:
```
http://localhost:3000
```

The application will automatically open in your default browser and display the project visualization.

## Data Setup

The application reads project data from `ui/public/live-file.json`. This file should contain your project structure in the following format:

### Required Data Structure

```json
{
  "snapshot_timestamp": "2025-01-01T12:00:00.000000",
  "project_info": {
    "id": "PR-12345678",
    "name": "Your Project Name",
    "description": "Project description",
    "status": "executing"
  },
  "execution_status": {
    "completion_percentage": 75.5,
    "budget_used": 1500,
    "budget_limit": 8000,
    "total_stories": 10,
    "execution_running": true
  },
  "project_structure": {
    "stories": [
      {
        "id": "ST-12345678",
        "objective": "Story description",
        "status": "done",
        "milestone": "Milestone Name",
        "work_type": "feature_work",
        "priority": "high",
        "owner": "developer-name",
        "dependencies": ["ST-87654321"],
        "dependents": [],
        "acceptance_criteria": ["Criterion 1", "Criterion 2"],
        "estimated_tokens": 200,
        "complexity_score": 3.0
      }
    ]
  },
  "statistics": {
    "completed_stories": 5,
    "blocked_stories": 1,
    "ready_stories": 2
  }
}
```

### Updating Live Data

To update the visualization with new data:

1. **Replace the content** of `ui/public/live-file.json` with your project data
2. **Save the file** - the application will automatically refresh within 30 seconds
3. **Or refresh manually** by reloading the browser page

## Status Color Legend

The application uses color-coded status indicators:

- 🟢 **Green (Done)**: Completed stories
- 🟢 **Light Green (Ready)**: Available to start
- 🟠 **Orange (In Progress)**: Currently executing
- 🔴 **Red (Blocked)**: Waiting for dependencies
- 🔴 **Dark Red (Failed)**: Execution failed
- ⚪ **Gray (Cancelled)**: Cancelled stories
- 🟣 **Purple (Paused)**: Temporarily paused
- 🔵 **Blue (Other)**: Unknown status

## Using the Interface

### Navigation
- **Zoom**: Use mouse wheel or zoom controls
- **Pan**: Click and drag the background
- **Fit View**: Use the fit view button in controls
- **Minimap**: Navigate large graphs using the minimap

### Information Panels
- **Left Sidebar**: Shows project info, execution status, and legend
- **Top-left Summary**: Expandable plan summary with key metrics
- **Tooltips**: Hover over any story node for detailed information

### Story Dependencies
- **Arrows**: Show dependency relationships (A → B means B depends on A)
- **Layout**: Stories are automatically positioned based on dependency depth
- **Milestones**: Background colors group stories by milestone

## Project Structure

```
second-brain-visualizer/
├── package.json              # Root dependencies
├── README.md                 # This file
├── ui/                       # React application
│   ├── package.json          # UI dependencies
│   ├── public/
│   │   ├── live-file.json    # Your project data
│   │   └── index.html        # HTML template
│   └── src/
│       ├── App.tsx           # Main application component
│       ├── App.css           # Application styles
│       └── index.tsx         # React entry point
```

## Development

### Available Scripts

In the `ui` directory, you can run:

- `npm start`: Runs the app in development mode
- `npm run build`: Builds the app for production
- `npm test`: Launches the test runner
- `npm run eject`: Ejects from Create React App (not recommended)

### Customization

You can customize the visualization by modifying:

- **Colors**: Update the `getNodeColor()` function in `App.tsx`
- **Layout**: Modify positioning logic in the `nodes` useMemo
- **Styling**: Edit `App.css` or inline styles
- **Data Processing**: Adjust the `fetchLiveData()` function

### Adding New Features

The application is built with React and TypeScript. Key technologies:

- **React Flow**: For the interactive graph visualization
- **React Hooks**: For state management
- **TypeScript**: For type safety
- **CSS**: For styling

## Troubleshooting

### Common Issues

1. **"Failed to load live project data"**
   - Ensure `ui/public/live-file.json` exists and is valid JSON
   - Check browser console for detailed error messages

2. **Dependencies not loading**
   - Run `npm install` in both root and `ui` directories
   - Delete `node_modules` and `package-lock.json`, then reinstall

3. **Port already in use**
   - The app runs on port 3000 by default
   - Use `PORT=3001 npm start` to run on a different port

4. **TypeScript errors**
   - Ensure all dependencies are installed
   - Check that Node.js version is 16 or higher

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify your `live-file.json` format matches the expected structure
3. Ensure all dependencies are properly installed

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE). 