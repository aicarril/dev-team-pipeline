# Dev Team Pipeline

Multi-agent development pipeline that builds, deploys, verifies, and generates demo guides for AWS POCs — fully automated.

## What it does

You write a task in `task.md`, run `docker compose up --build`, and the pipeline:

1. **Scoper** breaks your task into ordered subtasks (challenged by reviewer)
2. **Builder** writes code for each subtask (challenged by reviewer)
3. **Deployer** deploys to your AWS account (terraform, CDK, whatever the code uses)
4. **Verifier** hits real endpoints, runs AWS CLI checks, proves it works (challenged by reviewer)
5. **Demo Coach** generates a word-for-word demo script with live URLs
6. Loops automatically if verification fails — builder fixes, redeploys, re-verifies

The **Challenger** agent reviews every step from every agent in real-time via WebSocket.

## Quick Start

```bash
# 1. Clone
git clone https://github.com/aicarril/dev-team-pipeline
cd dev-team-pipeline

# 2. Add your credentials
cp .env.example .env
# Edit .env with your keys

# 3. Write your task
# Edit task.md with what you want to build

# 4. Run
docker compose up --build
```

## Requirements

- Docker
- Kiro Pro API key ([https://app.kiro.dev](https://app.kiro.dev))
- GitHub PAT with `repo` scope
- AWS credentials with permissions for the services your task uses

## Credentials (.env)

```
KIRO_API_KEY=        # Kiro Pro subscription
GITHUB_TOKEN=        # GitHub PAT with repo scope
AWS_ACCESS_KEY_ID=   # AWS IAM credentials
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
```

## How it works

```
task.md
  ↓
Scoper → breaks into subtasks → Challenger reviews
  ↓
For each subtask:
  Builder → Challenger → Deployer → Verifier
    ↑                        |
    └── fix loop if fails ───┘
  ↓
All subtasks pass → Demo Coach → DEMO-GUIDE.md
  ↓
✅ GitHub repo with code + demo guide + verification report
```

### Agents

| Agent | Role |
|-------|------|
| Scoper | Breaks complex tasks into deployable subtasks |
| Builder | Writes code (no AWS access — only writes, doesn't deploy) |
| Challenger | Reviews every step from every agent, pushes back on issues |
| Deployer | Runs terraform/CDK/CloudFormation, waits for resources to be ready |
| Verifier | Hits endpoints, runs AWS CLI, proves everything works |
| Demo Coach | Generates word-for-word demo script with live URLs |

### Communication

Agents communicate via WebSocket through a central orchestrator. The builder reports each step, blocks until the challenger approves, then proceeds. Same pattern for verifier and demo coach.

### Self-Learning

The verifier writes learnings to `.kiro/learnings/{agent}.md` when verification fails due to pipeline process issues. These are injected into agents on the next run so mistakes aren't repeated.

## Architecture

```
docker-compose.yml
├── orchestrator    (Node.js WebSocket server — routes messages)
├── scoper          (Kiro CLI agent — breaks down tasks)
├── builder         (Kiro CLI agent — writes code)
├── challenger      (Kiro CLI agent — reviews everything)
├── deployer        (Kiro CLI agent — deploys to AWS)
├── verifier        (Kiro CLI agent — proves it works)
└── demo-coach      (Kiro CLI agent — generates demo guide)
```

All agents share a Docker volume (`/shared-repo/`) for code and a WebSocket connection for real-time communication.

## Project Structure

```
.kiro/
  agents/           # Agent configs (Kiro CLI format)
    prompts/        # Agent prompts (minimal persona style)
  learnings/        # Per-agent learnings (written by verifier)
  steering/         # Static guardrails and best practices
  settings/
    mcp.json        # MCP server config (AWS docs)
orchestrator/
  server.js         # WebSocket message router
  Dockerfile        # Orchestrator container
Dockerfile          # Agent container (Kiro CLI + tools)
docker-compose.yml  # Full pipeline
ws-client.js        # CLI bridge for agent ↔ WebSocket communication
task.md             # Your task (edit this)
.env.example        # Credential template
```
