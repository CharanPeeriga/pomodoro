# agents/ — project context for AI agents (and humans)

This folder is the source of truth for **what we're building, why, and where we are**.
Any agent picking up work on this repo should read these files first, in this order:

| File | Purpose | Update when… |
|---|---|---|
| `PROJECT_SCOPE.md` | Product vision, definitions, features, UX flows | Scope changes or a feature is added/cut |
| `ARCHITECTURE.md` | Tech stack, window model, state machine, data model | Any structural/technical decision changes |
| `DECISIONS.md` | Log of decisions (proposed → confirmed) with rationale | A decision is made or reversed |
| `OPEN_QUESTIONS.md` | Unresolved questions for the user | A question is asked/answered (move answers to DECISIONS) |
| `ROADMAP.md` | Milestones and their task checklists | Work is planned or completed |
| `PROGRESS.md` | Dated, append-only log of what happened each session | End of every working session |

## Rules for agents
- **Don't implement anything marked `PROPOSED` without the user confirming it.**
- Keep these docs short and current. Prefer editing over appending (except `PROGRESS.md`).
- Dates are absolute (YYYY-MM-DD).
- Remote: private repo https://github.com/CharanPeeriga/pomodoro (`origin`). Push only when the user asks.
