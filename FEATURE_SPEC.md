# Project Beacon — Full Feature Specification (Jira-ready backlog)

**Owner:** Wale Koleosho · **Status:** In-house build · **Last updated:** 2026-11-04
**Purpose:** Complete feature breakdown for the team to slice into Jira epics, stories and tasks.

**Roles referenced:** `End User` (person being protected) · `Trusted Contact` · `Operator` · `Supervisor` · `Admin` · `System`

**Story format:** `As a <role>, I want <capability>, so that <benefit>.` Each story carries Acceptance Criteria (AC). IDs (e.g. `BCN-ID-01`) are for traceability into Jira.

**Priority key:** 🔴 Must (pilot-critical) · 🟡 Should · 🟢 Could/Later

---

## 1. Identity & Access  (prefix: ID)

> Real, recoverable accounts. Verified identity gates location-sharing and the ops console. Built on Supabase Auth. Phone-OTP primary, email secondary.

### Epic ID-E1 — End-user account creation & sign-in 🔴
- **BCN-ID-01** — As an End User, I want to sign up with my phone number and an SMS code, so that I can create an account without email.
  - AC: 6-digit OTP sent to a valid number; verifying creates the account; invalid/expired code shows a clear error; resend has a cooldown; max sends per window enforced.
- **BCN-ID-02** — As an End User, I want to sign up with email + password, so that I have an alternative to phone.
  - AC: password strength rules enforced; verification email sent; account inactive until email verified.
- **BCN-ID-03** — As an End User, I want to log in on a returning visit, so that I regain access to my account.
  - AC: phone-OTP or email+password; wrong credentials give a specific, non-leaky message; successful login restores my data.
- **BCN-ID-04** — As an End User, I want to log out, so that my account is secure on a shared device.
  - AC: session ends on this device; returns to login.

### Epic ID-E2 — Password reset & recovery 🔴
- **BCN-ID-05** — As an End User, I want to reset a forgotten password, so that I can regain access.
  - AC: reset link by email; setting a new password invalidates all existing sessions.
- **BCN-ID-06** — As an End User, I want to recover a phone-only account via OTP, so that losing access isn't permanent.
  - AC: re-verify by OTP restores access; rate-limited.

### Epic ID-E3 — Verification & assurance tiers 🔴
- **BCN-ID-07** — As the System, I want to record an assurance tier per account (`unverified` → `verified` → `institutional`), so that access scales with trust.
  - AC: tier stored on profile; enforced in RLS.
- **BCN-ID-08** — As the System, I want to block location-sharing and contact-adding until the account is verified, so that unverified accounts can't access anyone's location.
  - AC: unverified account cannot start sharing, add contacts, or view a contact's location.

### Epic ID-E4 — Operator / dashboard access 🔴
- **BCN-ID-09** — As an Operator, I want to log in to the dashboard with email + password + MFA, so that console access is protected.
  - AC: separate login route; MFA (TOTP or SMS) required; no anonymous access.
- **BCN-ID-10** — As an Admin, I want to invite an operator by email and assign a role, so that staff can be onboarded.
  - AC: invite → set password + MFA → role assigned (`operator` / `supervisor` / `admin`).
- **BCN-ID-11** — As the System, I want operator sessions to time out on inactivity, so that unattended consoles aren't exposed.
  - AC: idle timeout; sensitive actions may re-prompt for auth.

### Epic ID-E5 — Identity platform foundations 🔴
- **BCN-ID-12** — As the System, I want to remove anonymous auth and key all data to real users, so that identity is trustworthy.
  - AC: schema references real `auth.users`; anonymous path removed; RLS rewritten on real identity + role.
- **BCN-ID-13** — As the System, I want brute-force protection and lockout on login/OTP, so that accounts resist attack.
  - AC: throttling + lockout after repeated failures; user sees cooldown.
- **BCN-ID-14** — As the System, I want every auth screen to define all states, so that the UX is complete.
  - AC: loading, success, wrong-code, expired, network-fail, rate-limited, locked — all designed.

---

## 2. Onboarding & Profile  (prefix: ON)

### Epic ON-E1 — First-run onboarding 🔴
- **BCN-ON-01** — As an End User, I want a short guided setup after first verify, so that I understand consent before sharing anything.
  - AC: explains that location is never shared until I add a contact + turn on a state; captures display name + optional phone.
- **BCN-ON-02** — As an End User, I want to set/edit my emergency profile, so that my circle sees who I am.
  - AC: name, phone, optional notes editable; changes reflected to circle.

### Epic ON-E2 — Permissions priming 🔴
- **BCN-ON-03** — As an End User, I want clear prompts for location + notification permissions, so that I know why they're needed.
  - AC: rationale shown before OS prompt; graceful handling of denial with re-enable guidance.

---

## 3. Safety Circle  (prefix: SC)

### Epic SC-E1 — Invitations & double opt-in 🔴
- **BCN-SC-01** — As an End User, I want to invite a trusted contact by link/phone/email, so that they can be alerted in an emergency.
  - AC: invite generates a shareable link / message; recipient must accept.
- **BCN-SC-02** — As a Trusted Contact, I want to accept (or decline) an invitation, so that I consent to the relationship.
  - AC: acceptance creates the membership; no access is granted before acceptance (double opt-in).
- **BCN-SC-03** — As an End User, I want to see pending vs accepted invitations, so that I know who's active.
  - AC: status visible and live-updating.

### Epic SC-E2 — Revocation & control 🔴
- **BCN-SC-04** — As an End User, I want to revoke a contact instantly, so that I control who can ever see me.
  - AC: revoke ends their access at the database within seconds; their live link/token is invalidated.
- **BCN-SC-05** — As an End User, I want to set notification/escalation order for contacts, so that the right person is alerted first.
  - AC: ordering saved; alerts follow it.

### Epic SC-E3 — Protecting others 🟡
- **BCN-SC-06** — As a Trusted Contact, I want to see the people who've added me, so that I know whom I'm protecting.
  - AC: list of accepted "I'm protecting" relationships; view affordance when they're sharing.
- **BCN-SC-07** — As the System, I want to enforce tier-based circle limits, so that plans are respected.
  - AC: free-tier cap enforced; clear message when reached.

---

## 4. Location Sharing & Safety States  (prefix: LOC)

### Epic LOC-E1 — Safety states 🔴
- **BCN-LOC-01** — As an End User, I want three states — Everyday, Journey, SOS — so that I control when I'm sharing.
  - AC: Everyday shares nothing; Journey/SOS share per policy; current state always visible.
- **BCN-LOC-02** — As the System, I want sampling frequency to adapt to state, so that battery and freshness are balanced.
  - AC: higher cadence in SOS than Journey; none in Everyday.

### Epic LOC-E2 — Live location & trail 🔴
- **BCN-LOC-03** — As a Trusted Contact, I want to view a sharing user's live location on a map, so that I can help.
  - AC: visible only while a consented, accepted relationship exists; shows freshness + accuracy.
- **BCN-LOC-04** — As a Trusted Contact, I want to see the user's recent path (breadcrumb trail), so that I understand their movement.
  - AC: trail drawn from persisted breadcrumbs; distance shown; respects retention window.
- **BCN-LOC-05** — As an End User, I want to view my own location + trail, so that I can confirm it's working.
  - AC: self-view shows live position + trail.

### Epic LOC-E3 — Location quality & chrome 🟡
- **BCN-LOC-06** — As any viewer, I want location age, accuracy, battery and network shown, so that I can judge reliability.
  - AC: stale fixes flagged; accuracy and age always displayed; never present low-confidence as exact.

---

## 5. Journey & Check-ins  (prefix: JRN)

### Epic JRN-E1 — Protected journey 🔴
- **BCN-JRN-01** — As an End User, I want to start a journey with a destination and ETA, so that my circle knows my plan.
  - AC: destination + ETA captured; journey state begins sharing; survives temporary network loss.
- **BCN-JRN-02** — As an End User, I want to check in / extend / end a journey, so that I manage it as plans change.
  - AC: check-in resets timer; end stops sharing.

### Epic JRN-E2 — Overdue escalation 🔴
- **BCN-JRN-03** — As the System, I want to raise an incident when a check-in is missed, so that silence triggers help.
  - AC: overdue → incident created + circle alerted; idempotent (no duplicates).

---

## 6. SOS & Emergency Trigger  (prefix: SOS)

### Epic SOS-E1 — Trigger 🔴
- **BCN-SOS-01** — As an End User, I want a prominent SOS action, so that I can raise an alarm fast.
  - AC: single clear action; creates incident; begins alerting immediately.
- **BCN-SOS-02** — As an End User, I want a discreet activation pattern, so that I can trigger without being seen.
  - AC: one defined discreet gesture; same incident outcome; flagged as discreet.
- **BCN-SOS-03** — As an End User, I want a test mode, so that I can try SOS without alarming responders.
  - AC: test incidents visually + technically segregated; never routed to live responders.

### Epic SOS-E2 — Cancellation & duress 🔴
- **BCN-SOS-04** — As an End User, I want to cancel an accidental SOS with a PIN, so that false alarms stop.
  - AC: correct PIN cancels + stops alerting; event logged.
- **BCN-SOS-05** — As an End User under duress, I want a duress PIN that appears to cancel but keeps help coming, so that I'm protected if forced.
  - AC: duress entry sustains alerting; distinguishable in audit; not visible to a coercer.

---

## 7. Incident Lifecycle & Packet  (prefix: INC)

### Epic INC-E1 — Lifecycle 🔴
- **BCN-INC-01** — As the System, I want each incident to have a unique reference and defined states, so that everything ties to one object.
  - AC: states Created → Alerting → Verification → Verified → Escalated → Resolved/Cancelled; every transition logged + attributable.
- **BCN-INC-02** — As the System, I want an immutable event timeline per incident, so that there's a trustworthy record.
  - AC: append-only; shows actor, action, timestamp.

### Epic INC-E2 — Incident packet 🔴
- **BCN-INC-03** — As an Operator/Contact, I want a complete incident packet, so that I can act with full context.
  - AC: ref + timestamps, current/last-known location with age+accuracy, battery/network, trigger method, duress flag, contacts, alert outcomes, verification status.

---

## 8. Alerting & Notifications  (prefix: ALT)

### Epic ALT-E1 — In-app alarm 🔴
- **BCN-ALT-01** — As a Trusted Contact, I want a loud alarm + visual banner when a circle member triggers SOS (app open), so that I react immediately.
  - AC: siren + vibration (Android) + banner with View/Silence; auto-stops when viewed/resolved.

### Epic ALT-E2 — Push 🔴
- **BCN-ALT-02** — As a Trusted Contact, I want a push notification that fires even when the app is closed/locked, so that I don't miss an alert.
  - AC: native push with sound; fires while locked (critical-alert handling where available).

### Epic ALT-E3 — Email 🔴
- **BCN-ALT-03** — As a Trusted Contact, I want an email alert with a map link, so that I'm reachable off-app.
  - AC: branded sender from a verified domain; contains location link, accuracy, incident ref.

### Epic ALT-E4 — SMS 🟡
- **BCN-ALT-04** — As a Trusted Contact, I want an SMS alert, so that I'm reached without data.
  - AC: production aggregator; sender-ID where allowed; delivery receipts logged; failures visible.

### Epic ALT-E5 — Delivery integrity 🔴
- **BCN-ALT-05** — As the System, I want every alert attempt + outcome recorded on the incident, with retries, so that delivery is auditable.
  - AC: attempts/outcomes stored; retry + dead-letter handling; operator-visible failures.

### Epic ALT-E6 — Preferences 🟢
- **BCN-ALT-06** — As a Trusted Contact, I want to set my channel preferences, so that I'm alerted how I prefer.
  - AC: per-channel opt-in; emergencies may override non-critical suppressions.

---

## 9. Operations / Responder Console  (prefix: OPS)

### Epic OPS-E1 — Queue & triage 🔴
- **BCN-OPS-01** — As an Operator, I want a live incident queue, so that I can triage in real time.
  - AC: live updates; sortable by freshness/severity/trigger; shows health signals.
- **BCN-OPS-02** — As an Operator, I want to open an incident and see its full packet + map + trail, so that I can assess it.
  - AC: packet, live map, timeline all visible.

### Epic OPS-E2 — Act on incidents 🔴
- **BCN-OPS-03** — As an Operator, I want to classify an incident (test/accidental/unconfirmed/credible/critical), so that response is proportionate.
  - AC: controlled taxonomy; action stamped to the operator.
- **BCN-OPS-04** — As an Operator, I want to add notes, verify, escalate and close, so that I can run the workflow.
  - AC: each action logged; state transitions enforced; closure records outcome.

### Epic OPS-E3 — Access control 🔴
- **BCN-OPS-05** — As the System, I want least-privilege operator RBAC, so that data isn't over-exposed.
  - AC: operators see only assigned scope; bulk/curiosity browsing blocked; sensitive actions may need supervisor.
- **BCN-OPS-06** — As a Supervisor, I want a quality view of false alarms/latency/adherence, so that I can manage the desk.
  - AC: review metrics available; per-operator activity visible.

---

## 10. Audit, Privacy & Consent  (prefix: PRV)

### Epic PRV-E1 — Audit 🔴
- **BCN-PRV-01** — As the System, I want tamper-evident audit records of privileged access + incident changes, so that misuse is detectable.
  - AC: append-only; who/what/when; reviewable; alerts on anomalous access.

### Epic PRV-E2 — Consent & data rights 🔴
- **BCN-PRV-02** — As an End User, I want to see and withdraw every consent, so that I'm in control.
  - AC: consents listed; withdrawal immediate; no hidden tracking.
- **BCN-PRV-03** — As an End User, I want to delete my account and data, so that I can exercise my rights.
  - AC: profile, locations, breadcrumbs, memberships removed per retention rules; confirmation given.

### Epic PRV-E3 — Retention 🔴
- **BCN-PRV-04** — As the System, I want automated retention/deletion by data class, so that we don't hoard location history.
  - AC: breadcrumbs/journey/incident retention windows enforced + tested; deletion verified.

---

## 11. Native Mobile App  (prefix: APP)

### Epic APP-E1 — Packaging 🔴
- **BCN-APP-01** — As an End User, I want a real Android app, so that I get native capabilities.
  - AC: Capacitor APK builds via CI; installs; loads the live app.
- **BCN-APP-02** — As an End User, I want an iOS app via TestFlight, so that iPhone users can test.
  - AC: Capacitor iOS build; TestFlight distribution (needs Apple Developer account).

### Epic APP-E2 — Background location 🔴
- **BCN-APP-03** — As an End User, I want location to keep updating with the screen off, so that protection continues in my pocket.
  - AC: foreground-service GPS; persistent "Beacon active" notification; records with screen off on target devices.
- **BCN-APP-04** — As an End User, I want guidance to exempt Beacon from battery optimisation, so that aggressive OEMs don't kill it.
  - AC: detect + prompt for exemption on affected devices.

### Epic APP-E3 — Native alerts 🔴
- **BCN-APP-05** — As a Trusted Contact, I want lock-screen alarms via native push, so that I'm woken by an SOS.
  - AC: high-priority channel (Android) / critical alerts (iOS) with sound + vibration.

### Epic APP-E4 — Install experience 🟡
- **BCN-APP-06** — As an End User, I want a branded icon + splash, so that it feels like a real product.
  - AC: Beacon icon across densities; splash; store-ready metadata (later).

---

## 12. Settings & Account Management  (prefix: SET)

### Epic SET-E1 — Account 🟡
- **BCN-SET-01** — As an End User, I want to manage my profile, phone/email, and password, so that my details stay current.
  - AC: edit + re-verify on sensitive changes.
- **BCN-SET-02** — As an End User, I want to manage my devices/sessions, so that I can sign out elsewhere.
  - AC: list active sessions; revoke individually.
- **BCN-SET-03** — As an End User, I want to set my safety PIN + duress PIN, so that cancellation works as designed.
  - AC: PINs set/changed securely; never shown in plaintext.

---

## 13. Admin & Institutional  (prefix: ADM)  🟢 (post-pilot foundation)

### Epic ADM-E1 — Operator & org management
- **BCN-ADM-01** — As an Admin, I want to manage operators and roles, so that the desk is governed.
  - AC: add/remove/suspend operators; change roles; actions audited.
- **BCN-ADM-02** — As an Admin, I want organisation-level settings (escalation policy, hours), so that institutional pilots are configurable.
  - AC: policy stored + applied; scoped to the org.

---

## 14. Resilience & Offline  (prefix: RES)  🔴

- **BCN-RES-01** — As an End User, I want queued updates to sync after a network gap, so that no safety data is lost.
  - AC: offline queue; sync on reconnect; idempotent (no duplicate incidents).
- **BCN-RES-02** — As the System, I want predictable degradation when a provider fails, so that the system fails safely.
  - AC: failover where configured; status surfaced; SMS fallback path for alerts.

---

## 15. Non-functional: Observability, Security, Compliance  (prefix: NFR)

### Epic NFR-E1 — Observability & SLOs 🔴
- **BCN-NFR-01** — As the System, I want SLOs on the safety path, so that reliability is measured not hoped.
  - AC: trigger-to-ack and trigger-to-first-contact latency (P50/P95/P99); alert delivery success; uptime; alerting on breach; no PII in general logs.

### Epic NFR-E2 — Security assurance 🔴
- **BCN-NFR-02** — As the System, I want independent penetration testing + threat-model review before pilot, so that at-risk users aren't exposed.
  - AC: no open critical/high on auth, access control, incident integrity; SIM-swap/account-takeover mitigations in place.

### Epic NFR-E3 — Compliance 🔴
- **BCN-NFR-03** — As the System, I want a completed DPIA + Nigeria data-protection review (NDPA 2023), so that processing is lawful.
  - AC: DPIA signed off; lawful basis + retention documented; no unresolved critical findings.

---

## Dependencies & lead-time items (start early)
- SMS aggregator + **sender-ID registration** (weeks) — needed for OTP (ID) and SMS alerts (ALT).
- **Apple Developer account** (24–48h approval) — needed for iOS/TestFlight (APP).
- **Email domain verification** (Resend) — needed for branded email alerts (ALT).
- **DPIA + legal review** (external) — gates pilot (NFR/PRV).

## Explicitly out of scope (for now)
112/ECC & police dispatch · wearables/panic buttons · USSD/carrier location · payments/subscriptions · multi-language beyond English · full accessibility audit. Revisit post-pilot.
