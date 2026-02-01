#!/usr/bin/env bash
# Ralph Loop for OpenClaw Kanban
# Usage: ./ralph.sh [planning|building]

set -euo pipefail

MODE="${1:-planning}"
MAX_ITERS=20
PLAN_SENTINEL='STATUS: COMPLETE'
LOG_FILE=".ralph/ralph.log"

# Ensure we're in the project directory
cd "$(dirname "$0")"

# Ensure git repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "⚠️  Not a git repo. Initializing..."
  git init
  git add -A
  git commit -m "chore: initial commit"
fi

mkdir -p .ralph

# Select prompt based on mode
if [[ "$MODE" == "planning" ]]; then
  PROMPT=$(cat <<'EOF'
You are running a Ralph PLANNING loop for OpenClaw Kanban.

Read these files:
- PROMPT.md (context)
- AGENTS.md (build instructions)
- specs/*.md (feature specifications)
- IMPLEMENTATION_PLAN.md (current plan)

Your task:
1. Analyze the specs and codebase
2. Update IMPLEMENTATION_PLAN.md with refined tasks
3. Prioritize tasks by dependency and importance
4. Add any missing tasks you discover
5. Do NOT implement anything
6. Do NOT commit

When the plan is complete and ready for building, add this line:
STATUS: READY_TO_BUILD
EOF
)
elif [[ "$MODE" == "building" ]]; then
  PROMPT=$(cat <<'EOF'
You are running a Ralph BUILDING loop for OpenClaw Kanban.

Read these files:
- PROMPT.md (context)
- AGENTS.md (build instructions + backpressure commands)
- specs/*.md (feature specifications)
- IMPLEMENTATION_PLAN.md (task list)

Your task:
1. Pick the highest priority uncompleted task from IMPLEMENTATION_PLAN.md
2. Investigate relevant code before implementing
3. Implement the task
4. Run backpressure commands: pnpm typecheck && pnpm lint && pnpm build
5. Mark the task as done in IMPLEMENTATION_PLAN.md
6. Update AGENTS.md with any operational learnings
7. Commit with a descriptive message

When all tasks in the current phase are done, add this line:
STATUS: COMPLETE
EOF
)
else
  echo "Usage: ./ralph.sh [planning|building]"
  exit 1
fi

echo "🔄 Starting Ralph Loop ($MODE mode)"
echo "   Max iterations: $MAX_ITERS"
echo "   Log: $LOG_FILE"
echo ""

for i in $(seq 1 "$MAX_ITERS"); do
  echo -e "\n=== Ralph iteration $i/$MAX_ITERS ($MODE) ===" | tee -a "$LOG_FILE"
  
  # Run Claude Code with the prompt
  # Note: Using --dangerously-skip-permissions for auto-approve
  # Remove this flag for interactive mode
  claude "$PROMPT" 2>&1 | tee -a "$LOG_FILE"
  
  # Check for completion
  if grep -Fq "$PLAN_SENTINEL" IMPLEMENTATION_PLAN.md 2>/dev/null; then
    echo "✅ Completion detected in IMPLEMENTATION_PLAN.md" | tee -a "$LOG_FILE"
    exit 0
  fi
  
  if grep -Fq "STATUS: READY_TO_BUILD" IMPLEMENTATION_PLAN.md 2>/dev/null; then
    echo "✅ Planning complete. Run './ralph.sh building' to start implementation." | tee -a "$LOG_FILE"
    exit 0
  fi
  
  echo "Iteration $i complete. Continuing..." | tee -a "$LOG_FILE"
  sleep 2
done

echo "❌ Max iterations ($MAX_ITERS) reached without completion." | tee -a "$LOG_FILE"
exit 1
