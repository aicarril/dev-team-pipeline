# Demo-ability

Everything this pipeline builds must be demo-able by a non-technical person.

## Demo UI is a REQUIRED deliverable
Every POC must include a working HTML demo page. This is not optional. The scoper must include it as an explicit subtask. The verifier must confirm it loads and works.

For every feature you build, the demo UI must let someone interact with it:
- API endpoint → page that calls it and shows the result
- Transcribe/Polly/Rekognition → page with mic button, file upload, or camera input
- DynamoDB → page that writes/reads data and shows it
- Any backend process → page that triggers it and shows the output

The demo interface doesn't need to be pretty. It needs to work. A single HTML page with vanilla JS is fine. Host it on S3+CloudFront or serve it from the API.

## All deliverables must be pushed to GitHub
Before signaling any subtask complete, the builder MUST:
1. `git add -A && git commit -m "subtask N: description" && git push`

This ensures code, demo UI, and demo guide survive container restarts.

## Demo guide
The demo coach generates DEMO-GUIDE.md which must also be pushed to GitHub.
