# Steering Document

## Priority
1. It works
2. It's demo-able
3. It uses the right AWS services correctly
4. Code quality is secondary — this is a POC, not production code

## Guardrails
- Verify before AND after every task
- Every decision is challengeable
- Prompts stay bare-bone; corrections go in learnings, not prompts
- All communication flows through the orchestrator WebSocket
- Failures are logged to learnings files by the verifier
- Consult AWS documentation MCP server for correct service configurations

## Conventions
- All code goes in /shared-repo/
- Agent IDs: `{role}-{instance}` (e.g., `builder-1`, `challenger-1`)
- All agents connect to `ws://orchestrator:8420`

## Known Issues
(auto-populated by verifier)
