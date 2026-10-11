# BrokerOS Documentation Standards (Mintlify)

## Working Relationship
- Always cite sources and explain architectural reasoning when modifying documentation.
- Maintain absolute fidelity to the core BrokerOS domain invariants.
- Never guess or invent API endpoints, schema fields, or CLI flags. Verify against `apps/api`, `packages/prisma`, and `packages/constants`.

## Project Context
- **Engine**: Mintlify documentation platform.
- **Config**: `docs.json` (Navigation tabs, themes, colors, banner, search, navbar).
- **Styles**: `custom.css` (Royal indigo `#4F46E5` theme, glowing search bar, 3-column expanded layout, compact cards/tables).
- **Format**: MDX (`.mdx`) with YAML frontmatter.

## The Inviolable Domain Invariant
- **Brokerage World**: Direct sales team selling properties directly to home buyers (`Project.isCpProject = false`).
- **Channel Partner (CP) World**: External broker network bringing clients to projects (`Project.isCpProject = true`).
- Same database, same units. Separated strictly by `isCpProject`. Never blend these two domains in guides or tutorials.

## 7 Core Documentation Tabs
1. **Overview**: Introduction, How It Works, Who Uses BrokerOS, Brokerage vs CP, Local Setup.
2. **Brokerage CRM**: Leads lifecycle, Pre-Sales telecalling, Site Visits, Negotiations, Bookings, Post-Sales, Inventory.
3. **Channel Partner (CP)**: Sourcing & Closing managers, Broker KYC, BrokerageRecords, Settlements, Inbound Commissions.
4. **Marketing**: AI Voice Campaigns, WhatsApp Cloud API, SMS Gateways, HTML Email Builder, Meta & Google Ad Lead Sync.
5. **Integrations**: Telephony carriers (Vobiz, Exotel, Twilio, Telnyx), AI voice platforms (Vapi, Retell, Sarvam, Bolna, etc.), SMS gateways, Email providers, WhatsApp Meta API.
6. **Mobile App**: React Native Expo app, Native Android Auto-Dialer, GPS-verified selfie visits, Role workspaces, Push notifications.
7. **Developer**: Turborepo monorepo architecture, Prisma ORM, BullMQ async workers, Realtime gateways, Full REST API Reference.

## Frontmatter Requirements
Every MDX page MUST include:
```yaml
---
title: "Clear, Descriptive Page Title"
sidebarTitle: "Short Sidebar Label" # Optional, used when title is long
description: "Concise 1-2 sentence summary for SEO and navigation previews."
---
```

## MDX Syntax Laws (Mintlify Strict Mode)
1. **No HTML Comments**: Never use `<!-- ... -->`. Always use MDX comments `{/* ... */}`.
2. **Escape Raw Angle Brackets**: Never write `<user@domain.com>` or `<placeholder>` directly in text. Escape them as code: `` `user@domain.com` `` or `\<placeholder\>`.
3. **Root-Relative Internal Links**: Always use root-relative paths starting with `/` without `.mdx` extensions: `[Leads Guide](/brokerage/leads/lifecycle)`.
4. **Code Blocks**: Always include explicit language tags on code blocks (`bash`, `typescript`, `json`, `sql`, `python`).
5. **Interactive Mintlify Components**:
   - Use `<CardGroup cols={2}>` or `<CardGroup cols={3}>` for visual navigation grids.
   - Use `<Card title="..." icon="..." href="...">` for links.
   - Use `<Tabs>` and `<Tab title="...">` for multi-language examples.
   - Use `<Note>`, `<Tip>`, `<Warning>`, and `<Info>` for callout boxes.

## Writing Standards
- **Tone**: Professional, authoritative enterprise B2B tone. Second-person voice ("you").
- **Structure**: High-level conceptual overview first, followed by interactive cards/diagrams, followed by step-by-step procedural workflows, finishing with data contracts/parameters.
- **Visual Scannability**: Use tables for fields and statuses, bold lead-ins for bullet points, and callout boxes for gotchas.
