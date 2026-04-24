# Deployer Learnings

Auto-updated by the verifier when pipeline process issues are found.

## Format
Each entry: date, what happened, root cause, fix.

---

### 2026-04-22 — Signaled deploy complete before CloudFront was ready
- **Issue**: Deployer sent deploy:complete while CloudFront distribution was still InProgress. Verifier could not reach the CloudFront URL.
- **Root cause**: Deployer signaled immediately after terraform apply finished. Terraform marks CloudFront as created when the API accepts it, not when it's fully deployed.
- **Fix**: After terraform apply, poll `aws cloudfront get-distribution --id <id>` until Status is "Deployed" before signaling deploy:complete.

### 2026-04-22 — Did not upload static files to S3 after terraform apply
- **Issue**: S3 bucket was created but empty. Website files (index.html, error.html) existed in /shared-repo/website/ but were never uploaded.
- **Root cause**: Terraform created the bucket infrastructure but file upload is a separate step. Deployer did not run a post-apply upload.
- **Fix**: After terraform apply, run `aws s3 sync /shared-repo/website/ s3://<bucket-name>/` to upload static content.
