# Architecture proposal — ECOG and Outcomes

**Goal:** Smallest sensible HIPAA-aligned architecture for a tablet SPA that walks a caregiver through assessments, shows conditional guidance, and saves responses to REDCap.

**Principle:** REDCap is the system of record. The AWS app is a thin, audited collection + guidance layer. Do not store PHI in DynamoDB/S3/logs unless a concrete requirement demands it.

---

## Recommended shape

```
iPad Safari
    │  HTTPS
    ▼
CloudFront + S3  ─── static React SPA (no secrets)
    │
    │  HTTPS (API calls only)
    ▼
API Gateway (HTTP API) + Lambda
    │
    ├──► REDCap API  (write study responses; token only in Lambda / Secrets Manager)
    ├──► Config store (S3 object or SSM Parameter)  (NCCN/ASCO copy — not PHI)
    └──► CloudWatch Logs (audit / operational events — no PHI payloads)
```

**DynamoDB:** omit by default. Add only if we later need app-side draft recovery, anti-double-submit tokens, or non-REDCap session state that REDCap cannot provide.

---

## Why this is the smallest sensible design

| Concern | Choice | Rationale |
| --- | --- | --- |
| Tablet UX | Static SPA | Fast, offline-tolerant for the session UI; no server-rendered complexity |
| Secrets | Backend only | REDCap API token never ships to the browser |
| PHI | Prefer write-through to REDCap | Avoid duplicating study data in AWS |
| Configurable guidance text | External config fetched by API or SPA at runtime | Change NCCN/ASCO wording without rebuilding frontend |
| Deploy | Terraform via CloudShell | Matches WCM ops constraint; one `terraform apply` path |
| HIPAA posture | HTTPS everywhere, minimal data plane, audit logs, private secrets | Fits “no unnecessary PHI storage” |

---

## How REDCap should fit

### Role

- **Authoritative store** for all study responses (ECOG items, ECOG score, expectation-change answer, SARC-F, remaining baseline questions, completion metadata).
- **Not** a CMS for guidance copy (keep that in app config).
- **Not** a real-time auth provider unless the study already uses REDCap survey links / tokens that way (**unknown — see open decisions**).

### Integration pattern (recommended)

1. Caregiver completes the flow in the SPA (client-held draft state in memory; optional `sessionStorage` only if we accept that risk — **decision needed**).
2. On final submit (and optionally at fewer checkpoints if required), SPA calls our API with:
   - a **study/record identifier** (how this is obtained is an open decision), and
   - response payload mapped to REDCap field names.
3. Lambda:
   - validates payload shape,
   - maps to REDCap fields,
   - calls REDCap `record` import (or survey/response API as appropriate),
   - writes an **audit event** (timestamp, record id if non-PHI or hashed, success/failure — **not** full answer dumps),
   - returns success/failure to the SPA.
4. SPA shows completion screen only after confirmed save (or clearly defined retry path).

### What stays out of REDCap

- NCCN/ASCO recommendation text (versioned config in AWS).
- App static assets.
- Infrastructure secrets (Secrets Manager / SSM SecureString).

### What must not live in the browser

- REDCap API token
- Any AWS credentials
- Broad ability to query other participants’ records

### PHI minimization

- Prefer study-assigned IDs over names/MRNs in the app.
- Do not log request bodies containing answers.
- Do not mirror REDCap data into DynamoDB “just in case.”
- CloudWatch retention + access controls per institutional policy (**confirm with WCM InfoSec**).

---

## Frontend responsibilities

Ordered flow (product goal):

1. Welcome / instructions  
2. ECOG Performance Status assessment  
3. Calculate ECOG score (0–4)  
4. Conditional NCCN/ASCO guidance (0–2 vs 3–4)  
5. Ask whether information changed treatment expectations  
6. SARC-F assessment  
7. Remaining baseline study questions  
8. Save to REDCap via API  
9. Completion screen  

UX constraints: large touch targets, linear navigation, minimal chrome, iPad Safari first.

Guidance text is **data**, not hard-coded copy in components (load from config).

---

## Backend responsibilities

Keep the API tiny. Suggested endpoints (names illustrative):

| Endpoint | Purpose |
| --- | --- |
| `GET /config/guidance` | Return current NCCN/ASCO text + version |
| `POST /submissions` | Validate + write responses to REDCap |
| `GET /health` | Deploy/ops check |

Optional later (only if requirements demand):

- `POST /submissions/draft` — only if partial save to REDCap or another store is required  
- Auth exchange endpoint — only if access model needs it  

---

## Configurability (NCCN/ASCO)

Recommended v1:

- Versioned JSON in S3 (e.g. `guidance/current.json`), read by Lambda and returned via `GET /config/guidance`.
- Update = replace object + bump `version` field; no frontend rebuild.
- SPA displays `version` for study documentation if needed.

Alternative: SSM Parameter Store string/JSON — fine for small text; S3 is easier to edit/review in CloudShell.

---

## Security & compliance (baseline assumptions — confirm with WCM)

- App hosted only in WCM HIPAA AWS account / approved VPC patterns.
- TLS everywhere (CloudFront + API Gateway).
- REDCap token in Secrets Manager; Lambda IAM role retrieve-only.
- No public write access except authenticated/authorized study access path (**access model TBD**).
- Audit log of submissions (success/fail, correlation id, record id strategy TBD).
- No PHI in frontend analytics; prefer no third-party trackers.

---

## Explicitly deferred / rejected for v1

| Idea | Status |
| --- | --- |
| DynamoDB session store | Deferred unless required |
| Cognito user pools for caregivers | Likely unnecessary if device is staff-supervised — **confirm** |
| ECS/EKS | Too heavy |
| Direct browser → REDCap | Rejected (token exposure) |
| Server-side rendered multi-page app | Unnecessary for this flow |

---

## Deploy model (Terraform + CloudShell)

- All AWS resources declared under `infra/`.
- Operators: clone/upload repo → CloudShell → `terraform init/plan/apply` with approved credentials.
- Frontend build artifacts uploaded to S3 (script or Terraform null/local-exec — prefer a simple `scripts/deploy-web.sh` invoked from CloudShell after `npm run build`).
- Keep modules flat; avoid deep Terraform abstractions until a second environment forces it.

Suggested environments: `dev` and `prod` (or whatever WCM naming requires — **confirm**).
