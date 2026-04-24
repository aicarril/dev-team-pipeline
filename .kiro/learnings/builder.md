# Builder Learnings

Written by the verifier when verification failures trace back to the builder.

---

### 2026-04-22 — Website deployed with empty S3 bucket and missing bucket policy
- **Issue**: S3 bucket was created but static files (index.html, error.html) were never uploaded. Bucket policy for CloudFront OAC was not applied. CloudFront returned 403/404.
- **Root cause**: Terraform created the bucket infrastructure but the builder did not include file upload resources (aws_s3_object) or ensure the bucket policy was part of the terraform config.
- **Fix**: When building websites, ensure terraform includes: file upload to S3 (aws_s3_object or null_resource with aws s3 sync), and bucket policy granting CloudFront OAC read access.

### 2026-04-22 — Demo UI not built, demo guide not pushed to GitHub
- **Issue**: Pipeline completed but no demo HTML page was created. Demo guide was written to shared volume but never pushed to GitHub. Both lost when containers stopped.
- **Root cause**: Scoper did not create an explicit subtask for the demo UI. Demo coach wrote the guide but the builder never committed/pushed it.
- **Fix**: Always git push all files (code, demo guide, verification report) before signaling subtask complete. Demo UI is a non-negotiable deliverable.

### 2026-04-23 — Browser-side Transcribe Streaming WebSocket failed silently
- **Issue**: Demo UI loaded but live transcription didn't work. WebSocket to Transcribe closed immediately with "Your request completed with an exception." No transcript was captured.
- **Root cause**: Two issues: (1) SigV4 signing for the Transcribe WebSocket pre-signed URL was implemented from scratch in vanilla JS with custom SHA-256/HMAC — the crypto was buggy. (2) The canonical request host header was missing the port `:8443` which Transcribe requires.
- **Fix**: Never implement SigV4 signing in browser-side JavaScript. Generate the pre-signed Transcribe WebSocket URL server-side (in a Lambda) using Node.js `crypto` module, and return it to the browser via the credentials endpoint. The browser just connects to the URL directly. Also: the host in the canonical request MUST include `:8443` for Transcribe Streaming.
