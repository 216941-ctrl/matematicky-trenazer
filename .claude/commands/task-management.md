---
description: "Management of task files. Use for creating, updating and managing tasks in the tasks/ directory."
---
# Task management

## When to use
- Creating new task files
- Updating status of task files
- Reading and understanding task files

## Format of task files
path: tasks/TASK-XXX-short-description.md

### Mandatory frontmatter:
```yaml
id: TASK-XXX
title: "Short description"
status: planned/in-progress/implemented/in-review/approved/rework
priority: low/medium/high
assignee: developer/tester/planner
created-by: planner/orchestrator
```
### Mandatory sections in task files:
- ## Description: A detailed description of the task and its purpose
- ## Requirements: A list of requirements that need to be fulfilled to complete the task
- ## Acceptance criteria: A list of criteria that will be used to determine if the task is completed successfully with a checklist format (-[] criterion 1)

### Optional sections in task files:
- ## Implementation notes: A description of what was changed during implementation (added by implementor)
- ## Review: A comment describing the review decision (added by reviewer)

## State automation:
```
planned --> in-progress --> implemented --> in-review --> approved
                                                      --> rework --> implemented --> in-review...
```

## Rules for naming:
- ID: TASK-001, TASK-002, etc.
- File: TASK-001-short-description.md (use short description of the task in lowercase with dashes)
- Example: TASK-001-implement-login.md

## Rules for changing status:
- planned --> in-progress: when the task is being worked on by implementor
- in-progress --> implemented: when the implementor finishes the implementation and updates the task file
- implemented --> in-review: when the reviewer starts reviewing the task
- in-review --> approved: when the reviewer approves the task
- in-review --> rework: when the reviewer returns the task for rework with comments
- rework --> implemented: when the implementor finishes the required changes and updates the task file
