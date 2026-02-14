# Task-CLI v2

A beautiful CLI task manager with arrow key navigation.

## Features

- **Arrow Key Navigation** - Use ↑↓ to navigate, Enter to select, Space to toggle
- **Multi-select** - Select multiple tasks at once
- **Task Properties** - Title, description, priority, category, due date
- **Statistics** - View task completion rates and breakdowns
- **Search** - Find tasks by title or description
- **Persistent Storage** - Tasks saved locally

## Installation

```bash
npm install -g @friday2su/task-cli
```

## Usage

```bash
task
```

### Keyboard Controls

- ↑↓ - Navigate menu
- ↵ - Select / Confirm
- ⎵ - Toggle selection
- esc - Cancel / Go back

### Menu Options

- List Tasks - View all tasks
- Add Task - Create new task
- Complete Task - Mark tasks done
- Edit Task - Modify task
- Delete Task - Remove tasks
- Statistics - View stats
- Search Tasks - Find tasks
- Clear Completed - Remove done tasks
- Help - Show controls

## Data Storage

Tasks are stored at: `~/.task-cli/tasks.json`

## Dependencies

- chalk - Terminal styling
- date-fns - Date formatting
- keypress - Keyboard input
- uuid - Unique IDs

## License

MIT
