# Implementation plan & open decisions

This document proposes build order and **flags unknowns**. Do not invent study requirements; resolve the decisions below before coding instruments or REDCap mappings.

---

## Open decisions (must resolve before / early in development)

### Study & product

| ID | Question | Why it blocks | Notes |
| --- | --- | --- | --- |
| D1 | Exact ECOG item wording, response options, and scoring rules for *this* study? | UI + REDCap fields + score logic | Do not assume standard ECOG text until provided |
| D2 | Exact SARC-F items, options, and scoring (if scored in-app)? | Same | Unknown whether score is computed client-side or only stored raw |
| D3 | Full list of “remaining baseline study questions”? | Form schema | Explicitly unknown |
| D4 | Exact NCCN/ASCO caregiver-facing language for ECOG 0–2 and 3–4? | Guidance config | Must be IRB/clinician-approved copy |
| D5 | Wording for “does this change treatment expectations?” (options: yes/no/other)? | Instrument | Unknown |
| D6 | Welcome/instructions content, consent language on device (if any)? | First screen | May be staff-handled offline — unknown |
| D7 | Can caregivers go back/edit prior steps after seeing guidance? | Navigation + audit | Affects UX and what is saved |
| D8 | Offline / mid-survey abandonment behavior? | Persistence decision | Relates to DynamoDB vs memory-only |
| D9 | Multilingual support? | Scope | Assume English-only until stated |
| D10 | Accessibility / font-size requirements beyond “tablet simple”? | UI | Unknown institutional standards |

### REDCap & identity

| ID | Question | Why it blocks | Notes |
| --- | --- | --- | --- |
| R1 | REDCap project exists? API enabled? Base URL? | Integration | Need non-prod project for testing |
| R2 | How is a participant/record identified on the tablet? | AuthZ + import | e.g. staff enters Study ID; QR/code; REDCap survey hash; kiosk mode |
| R3 | Create new REDCap record vs update existing? | API call shape | Unknown enrollment workflow |
| R4 | Field names / instrument structure for all captured data? | Mapping layer | Prefer data dictionary export from REDCap |
| R5 | Is ECOG score stored as a calculated field in REDCap, or sent from the app? | Logic ownership | Avoid double-calculation drift |
| R6 | Partial saves to REDCap allowed/required, or one final submit? | API design + UX | Final-only is simplest |
| R7 | Who holds the API token; rotation policy? | Secrets + ops | Secrets Manager assumed |
| R8 | Any REDCap branching/required fields that affect submit validation? | Client validation | Unknown |

### Access, HIPAA, ops

| ID | Question | Why it blocks | Notes |
| --- | --- | --- | --- |
| H1 | Is the iPad staff-supervised kiosk, or caregiver opens a link on their own device? | Auth model | Kiosk ⇒ simpler (shared device + study ID) |
| H2 | Network path: public CloudFront vs VPN/private only? | Networking Terraform | WCM standard unknown |
| H3 | Required audit log contents and retention? | Logging design | Must avoid PHI in logs |
| H4 | BAA / approved services list for this account (CloudFront, S3, APIGW, Lambda, Secrets Manager, SSM)? | Architecture sign-off | Confirm before locking stack |
| H5 | Environment names and AWS account(s) for dev/prod? | Terraform workspaces/state | Unknown |
| H6 | Domain name / TLS cert process (ACM)? | Front door | Unknown |
| H7 | Who may edit guidance JSON in prod? | Ops runbook | Clinical + informatics ownership |
| H8 | IRB / Privacy review needed for UI screenshots and data flow diagram? | Compliance gate | Assume yes; confirm process |

### Engineering preferences (defaults if unanswered)

| ID | Topic | Proposed default |
| --- | --- | --- |
| E1 | Language | TypeScript for `web` and `api` |
| E2 | Frontend tooling | Vite + React |
| E3 | UI library | Minimal custom CSS; avoid heavy component kits unless requested |
| E4 | API style | Single Lambda router or 2–3 functions; HTTP API |
| E5 | Terraform state | S3 backend + DynamoDB lock **if** WCM already has a pattern; else confirm |
| E6 | Package manager | npm workspaces in monorepo |
| E7 | Tests | Unit tests for ECOG scoring + REDCap payload mapping first |

---

## Proposed monorepo structure

```
ecog-and-outcomes/
├── README.md
├── package.json                 # npm workspaces root
├── .gitignore
├── docs/
│   ├── ARCHITECTURE.md
│   └── IMPLEMENTATION_PLAN.md
├── apps/
│   ├── web/                     # React SPA (tablet)
│   │   ├── package.json
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── flows/           # step screens (welcome → complete)
│   │       ├── components/      # shared UI primitives
│   │       ├── lib/             # scoring helpers, api client
│   │       └── config/          # types for guidance config (not prod copy)
│   └── api/                     # Lambda source
│       ├── package.json
│       └── src/
│           ├── handlers/        # health, guidance, submit
│           ├── redcap/          # client + field mapping
│           └── audit/           # structured log helpers
├── infra/
│   ├── README.md                # CloudShell apply instructions
│   ├── versions.tf
│   ├── providers.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── main.tf                  # or flat files: s3_web.tf, api.tf, secrets.tf
│   └── environments/            # tfvars only if needed (dev.tfvars, prod.tfvars)
└── scripts/
    ├── build.sh
    └── deploy-web.sh            # build web → sync to S3 → CloudFront invalidate
```

Folders under `apps/` are **placeholders until build starts**. Do not scaffold full Vite/Lambda apps until D1–D4 and R1–R4 are at least partially resolved (or explicitly stubbed for a UI prototype).

---

## Phased implementation (after decisions)

### Phase 0 — Requirements lock (no app code)

- Collect IRB-approved copy for welcome, ECOG, guidance, expectation question, SARC-F, baseline items.
- Export REDCap data dictionary; map each UI field → REDCap field.
- Confirm access model (H1/H2) and approved AWS services (H4).
- Confirm final-submit vs partial-save (R6).

**Exit criteria:** Written instrument spec + REDCap mapping sheet + access decision.

### Phase 1 — Skeleton & infra shell

- Initialize npm workspaces; empty `web`/`api` packages.
- Terraform: S3+CloudFront (or approved static host), HTTP API, Lambda stub, Secrets Manager placeholder, IAM, CloudWatch.
- CloudShell README: init/plan/apply + web deploy script.
- `GET /health` live in dev.

**Exit criteria:** Empty page loads over HTTPS; health check green.

### Phase 2 — Flow UI (mock data, no REDCap)

- Linear step wizard optimized for iPad.
- ECOG scoring pure function + unit tests (once D1 known).
- Guidance screen reads **mock** config JSON shaped like prod.
- Expectation question + SARC-F + baseline placeholders only for **known** items; leave stubs labeled UNKNOWN for unresolved questions.
- Client-side validation; no PHI logging.

**Exit criteria:** Full click-through with mock submit.

### Phase 3 — Config + REDCap write path

- `GET /config/guidance` from S3/SSM.
- `POST /submissions` → REDCap import; secret from Secrets Manager.
- Mapping module driven by dictionary; audit logs without answer bodies.
- Retry/error UX on save failure.
- Completion screen after confirmed write.

**Exit criteria:** End-to-end save into REDCap non-prod project.

### Phase 4 — Hardening

- Threat check: token exposure, IDOR on record id, log redaction.
- Terraform for prod; guidance update runbook.
- Tablet UA testing (iPad Safari); large tap targets; back-navigation rules per D7.
- Operational runbook (rotate token, update guidance, redeploy).

**Exit criteria:** InfoSec/IRB checklist satisfied for pilot.

### Phase 5 — Pilot support (only if needed)

- Add DynamoDB **only** if Phase 0 required draft recovery or submit idempotency that REDCap cannot cover.
- Any analytics only if approved and PHI-free.

---

## What we will not do yet

- Build complete production UI/API.
- Hard-code invented ECOG/SARC-F/baseline items.
- Add Cognito/DynamoDB/VPN wiring without H1/H2/H4 answers.
- Store PHI in CloudWatch, S3 (except static assets + non-PHI config), or localStorage without an explicit decision.

---

## Suggested next meeting agenda

1. Walk architecture (this repo’s `docs/ARCHITECTURE.md`) with informatics + investigator.  
2. Answer **R2, R3, R6, H1, H2** (access + REDCap write model) — these unlock API shape.  
3. Provide instrument PDFs / REDCap dictionary for **D1–D6, R4**.  
4. Confirm Terraform state backend + CloudShell deploy account (**H5**).  
5. After that: start Phase 1 scaffolding only.
