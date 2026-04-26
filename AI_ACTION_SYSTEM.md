# AI Action System

A comprehensive AI-powered action execution system that allows users to perform any action in ScholarForge AI through natural language commands in the AI chat interface.

## Overview

The AI Action System enables the AI to:
- **Create** workspaces, projects, tasks, labels, views
- **Read** and retrieve information about any entity
- **Update** and modify existing content
- **Delete** items with confirmation
- **Navigate** to different pages
- **Execute** multi-step workflows

## Architecture

### Backend Components

#### 1. **Prisma Schema** (`backend/prisma/schema.prisma`)
- New `AIAction` model tracks all AI-executed actions
- Stores intent, parameters, results, and audit trail

#### 2. **AI Intent Parser** (`backend/src/services/aiIntentParser.ts`)
- Parses user messages using pattern matching and AI
- Extracts action type, target entity, and parameters
- Resolves entity references by name
- Returns structured intent with confidence scores

#### 3. **AI Action Executor** (`backend/src/services/aiActionExecutor.ts`)
- Executes 25+ different action types
- Handles confirmation flows
- Manages transactions and rollback data
- Tracks execution time and results

#### 4. **AI Action Service** (`backend/src/services/aiActionService.ts`)
- Main coordinator between parser and executor
- Handles general chat vs action differentiation
- Builds natural language responses
- Suggests next actions

#### 5. **API Routes**
- `POST /api/ai/actions` - Process messages and execute actions
- `GET /api/ai/actions?type=pending` - Get pending actions
- `GET /api/ai/actions?type=history` - Get action history
- `POST /api/ai/actions/confirm` - Confirm pending action
- `POST /api/ai/actions/cancel` - Cancel pending action

### Frontend Components

#### 1. **AI Action Service** (`frontend/app/lib/utils/aiActionService.ts`)
- Client-side service for API communication
- Action confirmation management
- Navigation handling
- Utility functions for formatting and icons

#### 2. **Enhanced AI Chat** (`frontend/app/components/ai-chat/AIChat.tsx`)
- Integrated action execution flow
- Confirmation dialog UI
- Navigation handling
- Suggested actions display

## Supported Actions

### Workspace Actions
| Action | Description | Confirmation |
|--------|-------------|--------------|
| `create_workspace` | Create new workspace | Yes |
| `update_workspace` | Update workspace details | Yes |
| `delete_workspace` | Delete workspace | Yes (destructive) |
| `invite_workspace_member` | Invite member | Yes |
| `list_workspaces` | Show all workspaces | No |

### Project Actions
| Action | Description | Confirmation |
|--------|-------------|--------------|
| `create_project` | Create new project | Yes |
| `update_project` | Update project | Yes |
| `delete_project` | Delete project | Yes (destructive) |
| `archive_project` | Archive project | Yes |
| `open_project` | Open in editor | No |
| `list_projects` | Show all projects | No |
| `get_project_details` | Get project info | No |

### Task Actions
| Action | Description | Confirmation |
|--------|-------------|--------------|
| `create_task` | Create task | No |
| `update_task` | Update task | No |
| `delete_task` | Delete task | Yes (destructive) |
| `complete_task` | Mark complete | No |
| `create_subtask` | Add subtask | No |
| `list_tasks` | Show tasks | No |

### Label & View Actions
| Action | Description | Confirmation |
|--------|-------------|--------------|
| `create_label` | Create label | No |
| `assign_label` | Assign to task | No |
| `create_view` | Create workspace view | No |

### Document Actions
| Action | Description | Confirmation |
|--------|-------------|--------------|
| `edit_document` | AI-powered editing | Yes |
| `summarize_document` | Generate summary | No |

### Navigation Actions
| Action | Description | Confirmation |
|--------|-------------|--------------|
| `navigate_to_page` | Go to page | No |
| `open_project` | Open project editor | No |

### Notification Actions
| Action | Description | Confirmation |
|--------|-------------|--------------|
| `mark_notifications_read` | Clear notifications | No |

### Multi-step Actions
| Action | Description | Confirmation |
|--------|-------------|--------------|
| `create_project_with_tasks` | Create project + tasks | Yes |

## Usage Examples

### Creating a Workspace
```
User: "Create a new workspace called Research Projects"
AI: "I'll create a workspace called 'Research Projects'."
[Confirmation dialog appears]
[After confirm]: "Created workspace 'Research Projects' successfully!"
```

### Creating a Project
```
User: "Create a thesis project about climate change"
AI: "I'll create a new thesis project titled 'Climate Change'."
[Confirmation dialog appears]
[After confirm]: "Created project 'Climate Change' successfully!"
```

### Managing Tasks
```
User: "Create a task called 'Review literature' in my Research workspace"
AI: "Created task 'Review literature' successfully!"
[No confirmation needed for create_task]
```

### Navigation
```
User: "Show me all my projects"
AI: "Found 5 projects. [Lists projects]"

User: "Open the Climate Change project"
AI: "Opening 'Climate Change' in the editor."
[Navigates to editor]
```

### Document Editing
```
User: "Add an introduction to this document"
AI: "Please confirm: edit this document to add an introduction."
[After confirm]: "I've edited the document based on your instructions."
```

## Confirmation Flow

1. User sends message
2. AI parses intent
3. If action requires confirmation:
   - AI creates pending action record
   - Returns confirmation request to frontend
   - Frontend displays confirmation dialog
   - User confirms or cancels
   - If confirmed, action executes and result returned

## Security & Permissions

- All actions are executed with authenticated user's permissions
- Workspace actions check ownership/membership
- Destructive actions (delete) require explicit confirmation
- Action history is tracked for audit purposes

## Database Schema

### AIAction Model
```prisma
model AIAction {
  id              String    @id @default(uuid())
  user_id         String
  action_type     String    // e.g., "create_workspace"
  action_category String    // "create", "read", "update", "delete"
  status          String    // "pending", "confirmed", "executing", "completed", "failed"
  user_intent     String    // Original user message
  parsed_params   Json?     // Extracted parameters
  target_entity   String?   // "workspace", "project", "task"
  target_id       String?   // Affected entity ID
  confirmation_required Boolean @default(true)
  confirmed_at    DateTime?
  confirmed_by    String?
  executed_at     DateTime?
  completed_at    DateTime?
  failed_at       DateTime?
  error_message   String?
  result_data     Json?
  execution_duration_ms Int?
  page_context    String?   // Page where action was triggered
  session_id      String?   // AI chat session
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  user            User      @relation(fields: [user_id], references: [id])
  
  @@index([user_id])
  @@index([action_type])
  @@index([status])
  @@index([created_at])
}
```

## Integration Points

### AI Chat Panel
- Replace existing `appendMessage` with AI action-aware version
- Add confirmation dialog UI component
- Handle navigation from AI actions
- Display suggested next actions

### Dashboard Layout
- Listen for AI-triggered navigation events
- Refresh data after AI modifications

### Editor
- Handle document edit actions from AI
- Apply AI-generated content modifications

## Testing

Test the system by sending these commands in the AI chat:

1. "Create a workspace called Test Workspace"
2. "Show me my workspaces"
3. "Create a project called Demo Project"
4. "Create a task called Test Task"
5. "Complete the task called Test Task"
6. "Delete the project called Demo Project"
7. "Take me to my dashboard"

## Future Enhancements

- Batch actions (execute multiple actions in sequence)
- Scheduled actions (execute at specific time)
- Conditional actions (if/then logic)
- AI-suggested workflows based on user patterns
- Voice command integration
- Custom action definitions by users
