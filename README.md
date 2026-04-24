# Dev Team Pipeline

An autonomous AI dev team that builds, deploys, and verifies AWS POCs for you.

## How to use

### 1. Install Docker Desktop

[docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)

### 2. Install Kiro CLI

```bash
curl -fsSL https://cli.kiro.dev/install | bash
```

### 3. Clone this repo and open it

```bash
git clone https://github.com/aicarril/dev-team-pipeline
cd dev-team-pipeline
kiro-cli
```

### 4. Tell Kiro to set things up

You'll need these credentials ready:
- **Kiro API Key** — from [kiro.dev](https://kiro.dev)
- **GitHub PAT** — with `repo` scope, from [github.com/settings/tokens](https://github.com/settings/tokens)
- **AWS credentials** — access key + secret with permissions for the services your task needs

Tell Kiro to add them to the `.env` file for you.

### 5. Write your task (or use the demo)

Edit `task.md` with what you want built, or leave it as-is to run the medical spa transcription POC from the offsite.

### 6. Tell Kiro to run the pipeline

Just say something like:

> "Spin up the dev team pipeline and let it run until everything is deployed and verified."

Then sit back. The pipeline will:
1. Break your task into subtasks
2. Write the code
3. Deploy to your AWS account
4. Verify everything works
5. Generate a demo guide

You'll end up with a working POC deployed in your AWS account and a step-by-step demo guide.
