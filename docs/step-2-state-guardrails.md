# Step 2: State Handling & Guardrails

## What changed

The prototype now has a code-level Socratic state machine instead of relying only on prompt wording. Each active WhatsApp session tracks:

- current stage
- topic ID and label
- number of nudges sent
- number of student attempts
- number of direct answer requests
- number of blocked answer leaks
- recent message history

## Guardrail policy

The model receives the state decision, but the application still post-processes the model response before sending it to WhatsApp.

| Stage | Allowed output | Final answer allowed? |
| --- | --- | --- |
| `nudge_1` | one guiding question | No |
| `nudge_2` | one guiding question | No |
| `hint_allowed` | one short hint + one question | No |
| `final_answer_allowed` | concise worked answer | Yes |

The final answer is only allowed after the student has made at least two attempts and received enough guided nudges. If the model leaks an answer early, the application replaces it with a safe redirect question and increments `answerLeakBlockCount`.

## Prototype risk notes

- The answer-leak detector is intentionally conservative and regex-based. It catches obvious leaks but will not catch every semantic equivalent.
- This still uses an in-memory store; Step 3 must persist the session state in Supabase before any live demo with restarts.
- The current policy favors safety over helpfulness. Some legitimate algebra hints may be over-filtered until we add topic-aware validators.
