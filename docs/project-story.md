# StudyBridge Project Story

## What inspired us

StudyBridge was inspired by a simple observation: many students already have WhatsApp, but many do not have reliable access to laptops, paid tutoring apps, or always-available teachers. When a student is stuck on homework at night, the lowest-friction action is not installing a new app. It is taking a photo and sending a message.

We wanted to turn that familiar behavior into a learning loop. The goal is not to build another answer machine. The goal is to build a WhatsApp-native tutor that helps students reason their way forward, one question at a time.

That is why StudyBridge uses a Socratic flow. If a student sends a quadratic equation, the system should not immediately say:

> The answer is \(x = 2\) and \(x = 3\).

It should first ask something like:

> What two numbers multiply to \(6\) and add up to \(-5\)?

The difference matters. Giving the answer may finish the assignment, but guiding the student builds recall, confidence, and exam readiness.

## What we learned

We learned that the hard part is not simply connecting WhatsApp to an AI model. The hard part is controlling the learning experience after the model responds.

A tutoring system needs product-level rules, not only prompt instructions. For example, if the model is allowed to answer freely, it may reveal the full solution too early. StudyBridge therefore uses a code-level state machine to decide whether the student should receive:

1. one guiding question;
2. a small hint plus a question; or
3. a concise worked answer.

We also learned that syllabus grounding is essential. A generic answer like “this is algebra” is too broad to support revision planning. The system needs to anchor each session to a scaffold such as:

\[
\text{Student struggle} \rightarrow \text{Topic ID} \rightarrow \text{Weekly practice plan}
\]

For the prototype, we seeded a WAEC/JAMB scaffold with topics such as quadratic equations, simultaneous equations, trigonometry, motion, and mole concept.

## How we built it

We built StudyBridge as a zero-budget prototype using free-tier and local-development tools:

- **Twilio Sandbox for WhatsApp number** for receiving and sending student messages.
- **Node.js, TypeScript, and Express** for the webhook server.
- **Ngrok free tier** to expose the local webhook during testing.
- **OpenAI vision and reasoning calls** to parse homework images and generate Socratic replies.
- **Supabase free tier** for PostgreSQL persistence.
- **PostgREST calls through `fetch`** instead of adding a heavier database SDK.

The main flow is:

1. A student sends a homework image on WhatsApp.
2. Twilio sends the webhook event to the local server.
3. The server downloads the image from Twilio MediaUrl0.
4. The image is passed to the vision intake layer.
5. The model returns a problem summary, topic ID, topic label, and first Socratic question.
6. The app creates a tutoring session and logs it to Supabase.
7. Follow-up student replies pass through the state machine and guardrails.
8. Topic struggle snapshots are stored for weekly revision.
9. A digest job ranks weak topics and sends three targeted practice questions.

A simple scoring idea powers the weak-topic ranking:

\[
\text{weakness score} = d + o + n + 2b
\]

Where:

- \(d\) is the difficulty score;
- \(o\) is the outcome score;
- \(n\) is the number of nudges needed;
- \(b\) is the number of blocked answer leaks.

This is intentionally simple for the prototype. It gives us enough signal to produce a useful demo digest without pretending we have a mature learning analytics model.

## Challenges we faced

### 1. Preventing answer leakage

The biggest product risk is that the model may reveal the final answer too early. We addressed this with two layers:

- prompt-level instructions that tell the model what kind of reply is allowed;
- code-level guardrails that inspect and rewrite unsafe replies before they reach WhatsApp.

This is still imperfect. Regex-based leak detection can miss subtle answer-giving, and it may over-block legitimate hints. For a prototype, we chose safety over smoothness.

### 2. WhatsApp media handling

Twilio sends WhatsApp media as `MediaUrl0` plus `MediaContentType0` in a form-encoded webhook. The server must acknowledge Twilio immediately, fetch the media with Twilio credentials, convert it, and then pass it to the vision layer. That adds latency and failure points.

### 3. Staying within a 0 Naira budget

The budget constraint shaped the architecture. We avoided paid hosting and used:

- local server execution;
- Ngrok free tunnels;
- Supabase free tier;
- WhatsApp test number;
- fallback mode when OpenAI or Supabase credentials are missing.

This makes the demo affordable, but it also means the system is not production-hosted yet.

### 4. Turning tutoring history into revision

A single tutoring session is useful, but the real value is longitudinal. We needed to log enough information to answer:

- Which topics keep causing friction?
- How many nudges does the student need?
- Did they ask for the direct answer?
- Which topics should appear in the weekly digest?

The prototype logs this data in Supabase and converts it into a weekly digest with three targeted practice questions.

## What is next

The next version should focus on reliability and learning quality:

1. Persist and restore active sessions fully from Supabase after server restarts.
2. Add idempotency keys so WhatsApp webhook retries do not duplicate messages.
3. Replace simple regex answer-leak detection with topic-aware validators.
4. Add true WhatsApp interactive list messages for digest question selection.
5. Expand the WAEC/JAMB syllabus scaffold.
6. Add automated tests for state transitions, digest ranking, and webhook parsing.

## Why it matters

StudyBridge is built around one belief: access matters. If tutoring lives inside WhatsApp, students do not need a new device, a new app, or a complicated onboarding flow.

The prototype proves the core loop:

\[
\text{homework photo} \rightarrow \text{syllabus-grounded Socratic help} \rightarrow \text{tracked struggle} \rightarrow \text{weekly revision}
\]

That loop is the foundation for a tutor that does not just answer questions, but helps students learn how to think.
