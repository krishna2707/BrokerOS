---
name: doc-sync
description: Synchronize documentation in docs/ whenever features, API endpoints, UI components, mobile screens, workers, database models, or integrations are added or modified in the codebase. Triggers on "sync docs", "update docs", "keep docs updated", "doc sync", or automatically after completing codebase changes.
---

# Documentation Synchronization Skill (`doc-sync`)

In BrokerOS, **documentation is code**. Outdated documentation leads to broken deployments, misconfigured credentials, and operator confusion.

This skill defines the deterministic, step-by-step workflow for inspecting codebase modifications and keeping the Mintlify documentation in `docs/` continuously accurate, complete, and strictly compliant with repository documentation laws.

---

## 1. Documentation Quality Invariants

Every documentation file in `docs/` must satisfy the following non-negotiable laws:

1. **ZERO Em Dashes (`—` or `–`)**:
   Never use em dashes or en dashes anywhere in titles, headers, body text, or tables. Use standard colons, commas, hyphens, or parentheses instead.
2. **ZERO `graph ` Diagrams**:
   Never use Mermaid `graph ` syntax (e.g., `graph TD`, `graph LR`, `graph TB`, `graph RL`). They render opaque bounding boxes that obscure text in dark and light modes. All diagrams must use clean Mermaid `sequenceDiagram` or `erDiagram` syntax.
3. **ZERO `rect rgb(...)` Styling**:
   Never include opaque bounding boxes or custom background rectangles that impair contrast.
4. **Exact In-App UI Paths & Modal Fields**:
   Never document raw `# Root /.env configuration` snippets for settings that operators manage in the UI. Always document the exact in-app route (e.g., `Dashboard -> Marketing -> [Channel] -> Settings`), the active tab, and the exact modal form field names matching the React components.
5. **Navigation Registration (`docs.json`)**:
   Whenever a new `.mdx` file is created, it MUST be registered under the appropriate tab and group in both `docs/docs.json` and the repository root `docs.json`.
6. **Clickable Links**:
   All monorepo file references and code symbols must use clickable `file:///` links formatted with forward slashes (e.g., [`apps/api/src/leads/leads.service.ts`](file:///c:/Users/Sumama/Desktop/enterprise-crm-realtors/apps/api/src/leads/leads.service.ts)).

---

## 2. Codebase to Documentation Mapping Matrix

Use this matrix to identify which documentation subtree must be updated based on the files touched in the codebase:

| Modified Codebase Subtree | Target Documentation Directory | Key Documentation Files |
| :--- | :--- | :--- |
| **`apps/api/src/marketing/voice/`** | `docs/marketing/voice/` & `docs/integrations/voice/` | `overview.mdx`, `vapi.mdx`, `retell.mdx`, `campaign-creator.mdx` |
| **`apps/api/src/marketing/whatsapp/`** | `docs/marketing/whatsapp/` & `docs/integrations/whatsapp/` | `overview.mdx`, `meta-cloud-api.mdx`, `team-inbox.mdx`, `broadcasts.mdx` |
| **`apps/api/src/marketing/sms/`** | `docs/marketing/sms/` & `docs/integrations/sms/` | `overview.mdx`, `twilio.mdx`, `gupshup.mdx`, `sinch.mdx`, `campaigns.mdx` |
| **`apps/api/src/marketing/email/`** | `docs/marketing/email/` & `docs/integrations/mail/` | `overview.mdx`, `brevo.mdx`, `sendgrid.mdx`, `aws-ses.mdx`, `campaigns.mdx` |
| **`apps/api/src/marketing/ads/`** | `docs/marketing/ads/` & `docs/integrations/overview.mdx` | `overview.mdx`, `google-ads.mdx`, `meta-ads.mdx` |
| **`apps/api/src/auth/`** | `docs/developer/auth.mdx` & `docs/api-reference/` | `auth.mdx`, `authentication.mdx` |
| **`apps/api/src/chat/`** | `docs/developer/realtime.mdx` & `docs/mobile/app/chat.mdx` | `realtime.mdx`, `chat.mdx` |
| **`apps/api/src/leads/`, `inventory/`, `brokers/`** | `docs/brokerage/`, `docs/channel-partner/`, `docs/api-reference/` | Lifecycle guides, unit matrices, commission claims |
| **`apps/web/features/` & `apps/web/app/`** | `docs/brokerage/`, `docs/channel-partner/`, `docs/marketing/` | Step-by-step UI setup guides, modal fields, settings |
| **`apps/mobile/`** | `docs/mobile/` | `overview.mdx`, `setup-and-tools.mdx`, `role-workspaces.mdx`, `architecture.mdx` |
| **`apps/workers/`** | `docs/developer/workers.mdx` | `workers.mdx` (BullMQ queues, processors, retries) |
| **`packages/prisma/schema.prisma`** | `docs/developer/database.mdx` | `database.mdx` (models, relations, `isCpProject`, transactions) |
| **`packages/constants/`, `types/`, `validators/`** | `docs/developer/packages.mdx` | `packages.mdx` (Zod schemas, enums, DTOs) |
| **`integrations/`** | `docs/integrations/` | Channel overview and provider adapter documentation |
| **Monorepo root config (`turbo.json`, `package.json`)** | `docs/developer/monorepo.mdx` | `monorepo.mdx` (pipeline tasks, scripts, environment law) |

---

## 3. Step-by-Step Synchronization Workflow

When executing doc-sync, follow this strict sequence:

### Step 1: Discover Codebase Changes
1. Run `git status` or inspect recent file modifications to determine which subtrees were altered.
2. For each modified file, identify:
   - New or modified API endpoints (HTTP method, route, request DTO, response).
   - New or modified database models or fields in `schema.prisma`.
   - New or modified UI forms, input labels, or modals in `apps/web/` or `apps/mobile/`.
   - New or modified BullMQ worker processors or queues.
   - New or modified integration provider adapters.

### Step 2: Locate Target Documentation
1. Match the changed codebase modules against the Mapping Matrix above.
2. Read the existing `.mdx` files using `view_file` to understand the current structure and terminology.

### Step 3: Draft & Apply Updates
1. **Match Reality**:
   - If an API changed, update the parameter table, request example, and response envelope.
   - If a UI modal changed (e.g., new credentials or options), update the table of modal form fields to match the exact placeholder and field label in code.
   - If an architecture changed, update the Mermaid `sequenceDiagram` to accurately depict the execution flow.
2. **Preserve Structure**:
   - Keep Mintlify components (`<Steps>`, `<Step>`, `<CardGroup>`, `<Card>`, `<Note>`, `<Warning>`).
   - Keep descriptive titles and sidebar titles.

### Step 4: Register New Pages in Navigation
If your update created a new `.mdx` documentation page:
1. Open [`docs/docs.json`](file:///c:/Users/Sumama/Desktop/enterprise-crm-realtors/docs/docs.json) and locate the relevant `tab` and `group`.
2. Insert the new page path (without the `.mdx` extension).
3. Mirror the exact change in root [`docs.json`](file:///c:/Users/Sumama/Desktop/enterprise-crm-realtors/docs.json).

### Step 5: Automated Compliance Audit
Run the following automated verification searches before completing the task:

1. **Check for Em/En Dashes**:
   ```bash
   # Must return 0 results
   ripgrep "[—–]" docs/<modified-subtree>
   ```
2. **Check for Invalid Graph Diagrams**:
   ```bash
   # Must return 0 results
   ripgrep "graph\s+(TD|LR|TB|RL)" docs/<modified-subtree>
   ```
3. **Check for Opaque Rectangles**:
   ```bash
   # Must return 0 results
   ripgrep "rect\s+rgb" docs/<modified-subtree>
   ```
4. **Check Clickable Links**:
   Ensure all file references start with `file:///` and point to existing files in the workspace.

---

## 4. Completion Criterion

The documentation synchronization task is complete when:
- Every modified or added feature in the codebase is faithfully documented in `docs/`.
- All tables, forms, and sequence diagrams match active production code.
- Zero em dashes, zero `graph ` diagrams, and zero opaque boxes remain.
- All newly added pages are registered in `docs/docs.json` and `docs.json`.
- All tests and validation greps return zero violations.
