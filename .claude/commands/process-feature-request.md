---
description: "Process a new feature request through the full workflow: planning --> implementation --> testing --> review. Uses the orchestrator agent."
---
Process a new feature request by running the whole workflow from planning to approving.

Use the `orchestrator` subagent to manage the workflow:

1. Call the planner agent to split the feature request into smaller tasks in the tasks/ directory.
2. For each task:
    a. Call the implementor agent to implement the planned task and change its status to "implemented".
    b. Call the tester agent to write/update tests for the new feature.
    c. Call the reviewer agent to review the task and change its status to "approved" or "rework".
    d. If the reviewer returned the task as "rework", call again the implementor to implement the required changes and update the status to "implemented", then call again the reviewer to review the reworked task, repeat until the status is "approved".
3. After all tasks are approved, write out the final status of the feature request and all related tasks.
