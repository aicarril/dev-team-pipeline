# Challenger Learnings

Auto-updated after every pipeline run. Write here when challenges were missed or wrong.

## Format
Each entry: date, what happened, what was learned, what to do differently.

---

### 2026-04-22 — WS Demo POC
- **Issue**: Missed Lambda 512MB over-provisioning on step 3
- **Root cause**: Builder moved to step 4 before challenge could be sent for step 3
- **Learning**: Need to process status updates faster or request builder to wait for ack
- **Action**: Challenger should flag issues immediately and request hold if needed
