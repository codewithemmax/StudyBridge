# 🎓 StudyBridge

> **AI Socratic tutoring on WhatsApp  — personalized to your syllabus.**

StudyBridge transforms WhatsApp into an intelligent AI tutor that helps students **learn, not just get answers**.

Instead of solving homework instantly, StudyBridge guides students through problems using the **Socratic teaching method**, asking carefully designed questions that help them arrive at the solution themselves.

Students simply send:
- 📸 A photo of a homework question
- 📚 A textbook table of contents
- 📝 A course outline

StudyBridge understands the content, builds a personalized syllabus, and delivers tutoring that is tailored to what the student is actually learning.

---

##  The Problem

Millions of students preparing for exams like **WAEC, JAMB, A-Levels, and other structured curricula** struggle to access quality tutoring.

Existing AI learning tools often:
- Require downloading another app
- Assume laptop access
- Give answers instead of teaching
- Ignore each student's actual syllabus

When students get stuck at night or outside school hours, they often have nowhere to turn.

---

##  Our Solution

StudyBridge brings personalized AI tutoring directly into WhatsApp.

Students simply take a picture of a question.

Instead of giving away the answer, StudyBridge:

1. Understands the image using GPT vision.
2. Identifies the underlying concept.
3. Compares it against the student's syllabus.
4. Starts a guided Socratic conversation.
5. Tracks learning progress over time.
6. Generates weekly revision summaries.

The goal isn't faster homework.

The goal is **better understanding**.

---

#  Features

###  Syllabus Digitization

Upload:

- textbook table of contents
- lecture notes
- course outline

StudyBridge converts them into an AI-searchable syllabus.

---

###  Snap-to-Solve

Students send a picture of:

- handwritten assignments
- textbook exercises
- exam questions

The AI understands both handwriting and printed text.

---

###  Socratic Tutoring

Instead of:

> "The answer is 42."

StudyBridge asks:

> "What formula do you think applies here?"

The conversation continues until the student discovers the answer.

---

###  Weakness Tracking

StudyBridge remembers:

- concepts mastered
- repeated mistakes
- difficult topics
- learning progress

---

###  Weekly Revision Digest

Every week students receive:

- topics studied
- weak concepts
- improvement areas
- personalized practice questions

Delivered automatically through WhatsApp.

---

### WhatsApp Native

No installation.

No new accounts.

No learning curve.

If you can send a message on WhatsApp, you can use StudyBridge.

---

#  Architecture

```
Student
    │
    ▼
WhatsApp Business API
    │
    ▼
Webhook Server
    │
    ▼
GPT-5 Vision + Reasoning
    │
    ├── OCR
    ├── Topic Detection
    ├── Socratic Tutor
    └── Syllabus Grounding
    │
    ▼
Supabase
    │
    ├── Students
    ├── Sessions
    ├── Topics
    └── Progress
    │
    ▼
Weekly Digest Generator
    │
    ▼
WhatsApp
```

---

#  How It Works

### Step 1

Upload a textbook table of contents.

StudyBridge builds a personalized syllabus.

---

### Step 2

Take a photo of a homework problem.

---

### Step 3

GPT understands:

- subject
- topic
- difficulty

---

### Step 4

StudyBridge asks the first guiding question.

---

### Step 5

The student replies.

---

### Step 6

StudyBridge continues coaching until the student reaches the answer.

---

### Step 7

The interaction is saved to the student's learning profile.

---

### Step 8

Weekly revision recommendations are generated automatically.

---

#  Tech Stack

### Frontend

- React
- TypeScript
- Tailwind CSS

### Backend

- Node.js
- Express

### AI

- OpenAI GPT
- Vision API
- GPT 5.6
- Structured Outputs

### Database

- Supabase (PostgreSQL)

### Messaging

- WhatsApp Business API

### Deployment

- Vercel
- Railway / Render

---

# 📂 Project Structure

```
studybridge/

├── client/
│   ├── components/
│   ├── pages/
│   └── hooks/
│
├── server/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── prompts/
│   ├── whatsapp/
│   └── openai/
│
├── database/
│
├── docs/
│
└── README.md
```

---

#  Getting Started

## Clone

```bash
git clone https://github.com/yourusername/studybridge.git
```

## Install

```bash
npm install
```

## Environment Variables

Create a `.env` file.

```env
OPENAI_API_KEY=

SUPABASE_URL=

SUPABASE_ANON_KEY=

WHATSAPP_ACCESS_TOKEN=

WHATSAPP_PHONE_NUMBER_ID=

VERIFY_TOKEN=
```

---

## Run

```bash
npm run dev
```

---

## Prototype Step 1: WhatsApp Webhook Intake

This repository now includes a minimal Node.js/TypeScript webhook server for the first prototype milestone. It verifies Meta WhatsApp Cloud API webhooks, accepts inbound image/text messages, downloads WhatsApp media, sends image intake to OpenAI, and replies with a Socratic first question.

```bash
npm install
cp .env.example .env
npm run dev
```

Set the Meta webhook callback URL to `https://<ngrok-host>/whatsapp/webhook` when exposing the local server with Ngrok. See `docs/step-1-webhook-intake.md` for the full setup and prototype risk notes.



## Prototype Step 2: State Handling & Guardrails

The tutoring flow now uses a code-level Socratic state machine. The model can suggest a reply, but the application decides whether the student should receive a question, a small hint, or a worked answer. Early final-answer leaks are blocked before WhatsApp delivery. See `docs/step-2-state-guardrails.md` for the guardrail policy and risks.

#  Target Users

- WAEC students
- JAMB candidates
- Secondary school students
- Universities
- Teachers
- Parents
- Learning centers

---

#  Why StudyBridge?

• Learns your syllabus

• Works on WhatsApp

• Uses Socratic teaching

• Tracks weaknesses

• Builds revision plans

• Requires zero installation

---

#  Future Roadmap

- Voice tutoring
- Local language support
- Parent dashboard
- Teacher analytics
- Gamification
- Offline revision packs
- Group study sessions
- AI-generated mock exams

---

#  Contributing

Contributions are welcome!

Please open an issue before submitting major changes.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request

---

# 📄 License

MIT

---

#  Built For

OpenAI Hackathon 2026  — Education Track

Empowering students everywhere with AI tutoring that teaches **how to think**, not just **what to answer**.

---

## Team

•Ibrahim Ashiah Ajoke

•Emmanuel Olayinka

---


##  Vision

We believe every student deserves access to a world-class tutor.

StudyBridge makes that tutor available through the most familiar app in the world **WhatsApp** turning every homework question into an opportunity to build understanding, confidence, and lifelong learning.
