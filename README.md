# Dev Team Pipeline

An autonomous AI dev team that builds, deploys, and verifies AWS POCs for you.

## How to use

### 1. Install Kiro CLI

```bash
curl -fsSL https://cli.kiro.dev/install | bash
```

### 2. Tell Kiro what to do

```bash
kiro-cli
```

Then say something like:

> "Clone https://github.com/aicarril/dev-team-pipeline and help me set up the credentials I need. Then spin up the dev team pipeline and let it run until everything is deployed and verified in my AWS account."

Kiro will walk you through getting your AWS credentials, GitHub token, and API key — then run the pipeline for you.

You'll end up with a working POC deployed in your AWS account and a step-by-step demo guide.

### Want to build something different?

Edit `task.md` with your own task before running the pipeline, or leave it as-is to run the medical spa transcription POC from the offsite.
