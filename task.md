# Task: Build Architecture 1 — Transcribe + Custom Vocabulary + Chart Agent

Build a working POC for MSI (Meevo), a medical spa platform. The customer has agreed to this approach.
Create a GitHub repo: aicarril/msi-transcribe-poc

## What it does
A medical spa provider is with their client during an appointment. The provider opens the Meevo app (web-based), taps a button, and the system:
1. Streams audio in real-time to Amazon Transcribe Streaming with Custom Vocabulary for medical spa terminology
2. Shows live transcription on screen as the provider speaks
3. When the session ends, sends the full transcript to a Bedrock LLM (Claude) to extract structured chart fields
4. Returns a filled-out chart in JSON matching the spa's chart template
5. Stores the raw transcript and extracted chart
6. Provider reviews the auto-filled chart, makes any corrections, and saves

The system supports two modes:
- **Live session**: Real-time transcription while provider is with the patient
- **Post-session dictation**: Provider records a quick summary after the appointment

Both modes produce the same output: a structured chart from the transcript.

## Customer context
- MSI is expanding their Meevo platform into the medical spa vertical
- HIPAA compliant — all data must stay within AWS (Bedrock provides this)
- English only for now
- Accuracy is most important, latency is not critical (2s vs 10s is fine)
- Chart templates are configurable with ~15-20 dynamic fields stored as JSON
- State-by-state compliance varies — chart definitions differ per state
- 100 med spas, 2.5 providers each, 20 appointments/day, 5 days/week
- Dictation is ~2 minutes per appointment

## Architecture: Transcribe + Custom Vocabulary + Chart Agent

Flow:
```
Provider taps "Start Session" in browser
  → Browser captures mic audio via WebSocket
  → API Gateway WebSocket API → Lambda → Amazon Transcribe Streaming
  → Live transcript fragments streamed back to browser in real-time
  → Provider sees text appearing as they speak
  → Provider taps "End Session"
  → Full transcript sent to Bedrock Claude (Haiku 4.5 or Sonnet)
  → LLM extracts structured fields into chart template JSON
  → Chart saved to DynamoDB
  → Raw transcript + audio reference saved to S3
  → Provider sees filled chart on screen, can review and edit
```

Key components:
- Amazon Transcribe Standard batch: $0.024/min
- Custom Vocabulary (CLM) add-on: +$0.006/min (required for med spa terminology like Botox, dermal fillers, microneedling, etc.)
- Bedrock Claude for chart extraction: dual-pass for confidence scoring
- S3 for audio storage
- DynamoDB or similar for chart storage

## Custom Vocabulary examples (medical spa terms)
Botox, Dysport, Juvederm, Restylane, microneedling, dermaplaning, chemical peel, IPL, laser resurfacing, hyaluronic acid, platelet-rich plasma, PRP, subcutaneous, intramuscular, erythema, edema, contraindication, informed consent, pre-treatment, post-treatment

## Real chart templates from the customer (in context/Chart Examples.zip)
The customer uses these treatment form templates. The POC should support at least 2-3 of these:
- Neuromodulator Treatment Form (Botox, Dysport — most common)
- Filler Treatment Form (Juvederm, Restylane)
- Aesthetic Treatment Form (general)
- Microneedling Treatment Form
- CoolSculpting Treatment Form
- Skin Laser Treatment Form
- PDO Thread Treatment Form
- Wellness Injection Treatment Form
- General Consult
- General Follow-Up
- Treatment Plan Form

For the POC, focus on the Neuromodulator Treatment Form as the primary demo — it's the most common procedure at med spas.

## Sample chart template (the LLM should fill this from the transcript)
```json
{
  "patientId": "",
  "providerId": "",
  "date": "",
  "chiefComplaint": "",
  "treatmentPerformed": "",
  "areasOfTreatment": [],
  "productsUsed": [{"name": "", "units": "", "lot": ""}],
  "dosage": "",
  "technique": "",
  "skinAssessment": "",
  "adverseReactions": "",
  "postTreatmentInstructions": "",
  "followUpDate": "",
  "providerNotes": "",
  "consentObtained": true,
  "photographsTaken": false
}
```

## What the demo should show
1. Open a web page that looks like a provider's charting interface
2. Click "Start Session" — mic activates, live transcription appears on screen as you speak
3. Speak a sample dictation (e.g., "Patient received 20 units of Botox in the forehead and glabella region...")
4. Watch the transcript build in real-time on the left side of the screen
5. Click "End Session" — the transcript is sent to the LLM
6. Watch the chart fields auto-populate on the right side (treatment, products, areas, notes)
7. Show the stored data in DynamoDB — both raw transcript and extracted chart
8. Bonus: show the Custom Vocabulary working by using medical spa terms that would normally be mis-transcribed
