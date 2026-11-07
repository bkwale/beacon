# Project Beacon — Phased Product Delivery Plan

**Owner:** Wale Koleosho · **Status:** In-house build · **Last updated:** 2026-11-04
**Prepared by:** Purple Team (Product / BA lens)

> **How to read this:** Each phase has a **Goal**, the **Epics** inside it, the **Stories** (what we actually build), and **Acceptance Criteria** (how we know it's done). Phases ship in order — each one makes the next easier. Phase 1 is detailed because that's the foundation; later phases are outlined and will be detailed as we approach them.

---

## Phase map (one screen)

| Phase | Name | Goal | Status |
|---|---|---|---|
| **0** | Foundation (built) | Working MVP to prove the loop | ✅ Done (demo-grade) |
| **1** | **Identity & Access** | Real accounts replace anonymous auth; login for app + dashboard | ⏳ **Next** |
| **2** | Safety Circle | Consent-based trusted contacts on real identity | Planned |
| **3** | Location & Journey | Productionised live location + background GPS | Planned |
| **4** | SOS & Incident | Full incident lifecycle, duress, cancellation | Planned |
| **5** | Ops / Responder Console | Role-gated operator workflows + audit | Planned |
| **6** | Alerting Channels | Email, SMS, push that reach people reliably | Planned |
| **7** | Hardening & Compliance | DPIA, pen test, observability, SLOs, pilot-ready | Planned |

**Guiding principle (settled by the council):** verified identity **gates location-sharing and the ops console** — but *entry* stays low-friction. A person can create an account and be protected quickly; they cannot *see someone's location* or *act as an operator* until properly verified.

---

## Phase 0 — Foundation (already built, demo-grade)

So the team knows the baseline we're productionising:
- Web PWA + native Android app (Capacitor) loading the live web app
- Supabase backend: Postgres, realtime, **row-level security that enforces consent**
- **Anonymous** auth (to be replaced in Phase 1)
- Safety circle (invite/accept/revoke), live location + breadcrumb trail, SOS + incident, ops console, SOS alarm (siren/notification), background GPS on Android (foreground service)

**What Phase 0 is NOT:** real accounts, password reset, operator roles, verified identity, production alerting, compliance sign-off. That's Phases 1–7.

---

## Phase 1 — Identity & Access  ⏳ NEXT

**Goal:** Replace anonymous auth with real, recoverable accounts. Ship a proper **login experience for the end-user app** and a separate **login for the ops dashboard**, with everything "login" actually requires: signup, verification, password reset, sessions, roles, and all the error states.

**Decision locked:** use **Supabase Auth** (don't build auth from scratch). **Phone-OTP is the primary identity** (Nigeria-first); email is secondary. SMS provider is chosen and wired *in this phase*.

### Epic 1.1 — End-user account creation & sign-in
| Story | Acceptance criteria |
|---|---|
| Sign up with **phone number + OTP** | User enters phone → receives 6-digit SMS code → verifies → account created. Invalid/expired code shows a clear error. Resend with cooldown. |
| Sign up with **email + password** (secondary) | Email + password (min strength rules) → verification email → account active only after verify. |
| **Log in** (returning user) | Phone-OTP or email+password. Wrong credentials → specific, non-leaky error ("code incorrect" / "check your details"). |
| Set a **display name + emergency profile** | Name + optional phone shown to circle. Captured right after first verify. |
| **Logout** | Ends session on this device; returns to login. |
| **Account deletion** | User can delete account → their data (profile, location, breadcrumbs, memberships) removed per retention rules. |

### Epic 1.2 — Password reset & recovery
| Story | Acceptance criteria |
|---|---|
| **Forgot password** (email) | Request reset → email link → set new password → old sessions invalidated. |
| **Phone account recovery** | Lost access → re-verify via OTP to regain entry. |
| **Resend / rate-limited codes** | Max N sends per window; abuse throttled; user sees cooldown timer. |

### Epic 1.3 — Verification & assurance
| Story | Acceptance criteria |
|---|---|
| **Phone verification** | A location-sharing or contact action is blocked until phone is verified. |
| **Email verification** (if email signup) | Unverified email accounts cannot add contacts or share location. |
| **Assurance tiers** | `unverified` → `verified` → (later) `institutional`. Tier recorded on the account and enforced in RLS. |

### Epic 1.4 — Ops / dashboard login (separate from end-user)
| Story | Acceptance criteria |
|---|---|
| **Operator login** | Separate login route for staff. Email + password **+ MFA** (TOTP or SMS). No anonymous access ever. |
| **Roles**: `operator`, `supervisor`, `admin` | Role stored per user; dashboard shows only what the role permits. |
| **Invite operators** (admin) | Admin invites a teammate by email → they set password + MFA → assigned a role. |
| **Session timeout** | Operator sessions expire after inactivity; sensitive actions may re-prompt. |
| **Operator audit** | Every login and sensitive action attributable to a named operator (feeds Phase 5 audit). |

### Epic 1.5 — Platform foundations for identity
| Story | Acceptance criteria |
|---|---|
| **Migrate off anonymous auth** | New schema keys everything to real `auth.users`; anonymous path removed. |
| **Account/role data model** | `profiles` (identity, tier), `operator_roles` (role per user). |
| **RLS rewritten on real identity** | Location/incident/circle policies enforce verified identity + role, not an anon token. |
| **SMS/OTP provider wired** | Chosen aggregator (e.g. Termii / Africa's Talking / Twilio) connected for OTP. Sender-ID registration **started** (lead time is weeks). |
| **Rate limiting & lockout** | Brute-force protection on login and OTP; lockout after repeated failures. |
| **Error-state design** | Every auth screen has defined states: loading, success, wrong-code, expired, network-fail, rate-limited, account-locked. |

**Phase 1 "Done" means:** a real person signs up with their phone, verifies, logs in, resets a forgotten password, and an operator logs into the dashboard with MFA — and **nobody can see anyone's location without a verified account**.

---

## Phase 2 — Safety Circle (on real identity)

**Goal:** Trusted-contact relationships built on verified accounts, with consent and revocation enforced server-side.

- **Epic 2.1 — Invitations:** invite by phone/email → double opt-in → accepted membership. *AC:* no contact gains access from being added alone; both sides consented.
- **Epic 2.2 — Revocation:** revoke a contact → location access ends immediately at the database. *AC:* revoked contact's reads return nothing within seconds.
- **Epic 2.3 — Roles within a circle:** notification/escalation order; contact vs guardian. *AC:* alerts follow configured order.
- **Epic 2.4 — Circle limits & tiers:** free tier contact cap; higher tiers more. *AC:* cap enforced.

---

## Phase 3 — Location & Journey

**Goal:** Productionise live location + the journey model, including **background GPS** on native.

- **Epic 3.1 — Safety states:** Everyday (no sharing), Journey, SOS. *AC:* Everyday shares nothing; state visible to user.
- **Epic 3.2 — Live location + breadcrumb trail:** consented, revocable, freshness/accuracy shown. *AC:* contacts see live position only while consented.
- **Epic 3.3 — Background location (native):** foreground-service GPS, screen-off, battery-optimisation exemption prompts. *AC:* trail records with screen off on target devices.
- **Epic 3.4 — Journey & check-ins:** destination, ETA, overdue → auto-incident. *AC:* missed check-in raises an incident.
- **Epic 3.5 — Degraded connectivity:** queue + sync on reconnect. *AC:* no data loss across a network gap.

---

## Phase 4 — SOS & Incident

**Goal:** The full incident lifecycle as the canonical safety object.

- **Epic 4.1 — SOS trigger:** visible + one discreet pattern; test mode. *AC:* SOS creates an incident with reference ID and starts alerting.
- **Epic 4.2 — Incident lifecycle:** Created → Alerting → Verification → Verified → Escalated → Resolved/Cancelled. *AC:* state transitions logged, attributable.
- **Epic 4.3 — Duress & cancellation:** duress PIN vs genuine cancel. *AC:* duress distinguishable in audit; genuine cancel stops alerting.
- **Epic 4.4 — Incident packet:** location+age+accuracy, battery, trigger, contacts, timeline. *AC:* packet complete and consistent across channels.

---

## Phase 5 — Ops / Responder Console

**Goal:** Role-gated operator workflows with full auditability (builds on Phase 1 roles).

- **Epic 5.1 — Live incident queue:** triage by freshness, severity, trigger. *AC:* operators see live incidents in real time.
- **Epic 5.2 — Classify / verify / escalate / close:** controlled taxonomy. *AC:* every action stamped to a named operator.
- **Epic 5.3 — Operator RBAC:** least-privilege; no "curiosity browsing." *AC:* access limited to assigned scope; bulk access blocked.
- **Epic 5.4 — Immutable audit timeline:** who saw/did what, when. *AC:* tamper-evident, reviewable.

---

## Phase 6 — Alerting Channels

**Goal:** Alerts that reach people whether or not the app is open.

- **Epic 6.1 — Email alerts (Resend):** branded sender, verified domain. *AC:* alert emails deliver to any contact.
- **Epic 6.2 — SMS alerts:** production aggregator, sender-ID, delivery receipts. *AC:* SMS delivers with logged outcomes; failures visible.
- **Epic 6.3 — Push (native):** lock-screen alerts, critical-alert handling. *AC:* contact's phone alerts while locked.
- **Epic 6.4 — Delivery tracking & retries:** attempts/outcomes on the incident. *AC:* every attempt recorded; retries + dead-letter handled.

---

## Phase 7 — Hardening & Compliance (pilot gate)

**Goal:** Make it safe and lawful to run with real at-risk users.

- **Epic 7.1 — DPIA + Nigeria data-protection review (NDPA 2023).** *AC:* DPIA complete, no unresolved critical findings.
- **Epic 7.2 — Independent penetration test + threat-model review.** *AC:* no open critical/high on auth, access control, incident integrity.
- **Epic 7.3 — Observability & SLOs:** trigger-to-alert latency P95, delivery success, uptime. *AC:* SLOs defined, measured, alerting on breach.
- **Epic 7.4 — Retention & deletion jobs:** breadcrumb/journey/incident retention enforced + tested. *AC:* data auto-deletes per policy; deletion verified.
- **Epic 7.5 — Pilot readiness review:** go/no-go with Product, Eng, Security, Ops. *AC:* signed off.

---

## Dependencies & lead-time items (start early)
- **SMS aggregator + sender-ID registration** — weeks of lead time; start in Phase 1.
- **Apple Developer account** — 24–48h approval; needed before any iOS/TestFlight (parallel track).
- **DPIA + legal review** — external, start well before Phase 7.
- **Domain for email (Resend)** — needed for branded alerts in Phase 6.

## Out of scope (for now — explicit)
112/ECC & police dispatch integration · wearables/panic buttons · USSD/carrier location · payments/subscriptions · multi-language beyond English · full accessibility audit. These are post-pilot.
