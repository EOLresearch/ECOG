# ECOG and Outcomes

Caregiver-facing decision-support tablet web application for a Weill Cornell Medicine research study involving hospitalized solid-tumor cancer patients.

**Status:** Requirements definition / planning. Application not built yet.

## Quick links

- [Architecture proposal](docs/ARCHITECTURE.md)
- [Implementation plan & open decisions](docs/IMPLEMENTATION_PLAN.md)

## Intended stack (proposed)

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | React (Vite) SPA | Simple tablet UI, static hosting |
| Backend | API Gateway + Lambda | Minimal HIPAA-friendly API surface |
| Study data | REDCap (system of record) | No unnecessary PHI storage in the app |
| Config | S3 JSON (or SSM) | NCCN/ASCO text without frontend rebuilds |
| IaC | Terraform | Deploy via AWS CloudShell |
| Monorepo | `apps/` + `infra/` | One repo, simplest possible layout |

## Local layout

```
ecog-and-outcomes/
├── apps/
│   ├── web/          # React tablet SPA (demo running)
│   └── api/          # Lambda handlers (not built yet)
├── infra/            # Terraform (CloudShell-friendly)
├── docs/             # Architecture & plans
└── README.md
```

## Run the tablet demo

```bash
npm install
npm run dev
```

Open the local URL Vite prints (default `http://localhost:5173`).

The demo walks through the full caregiver flow with **mock instruments** clearly labeled. It does **not** call REDCap or store PHI.

## Non-goals (for now)

- Do not treat demo instrument text as study requirements
- Do not store PHI unless a resolved requirement forces it
- Do not wire production REDCap until open decisions are resolved
