# Requirement — Product Slice #2: Payment (Tuition)

> **Status: APPROVED FOR BUSINESS ANALYSIS — Founder, 2026-07-08.**
> All business decisions FINAL (Q1–Q12, D13–D16). No open business questions remain.
> Next: handoff to Claude CLI (Delivery Manager) for Business Analysis per RFC-001 A2.
> Per `playbook/templates/requirement-template.md`, extended with the ratified slice sections.
> Drafted by AI Co-Architect (Stage 1). Business language only — no architecture, no schema.

- **Feature:** Payment (Product Slice #2)
- **Date:** 2026-07-08
- **Requested by:** Founder

---

## Business Capability Mapping

**Capability: Revenue Collection & Balance Settlement** — turning participation evidence
(Reference Slice: Participation Management) into money owed, collected, and accounted for.
Future reuse: POS (order → payment), Membership (dues), Booking (reservation payment),
CRM (deal → invoice).

## Customer Journey (resolved — full text in CUSTOMER_JOURNEY.md)

Owner escapes revenue blindness (real-time revenue + outstanding). Accountant/Receptionist stop
hand-counting: the system computes what each student owes from attendance evidence, and
collecting a payment takes under one minute with a receipt. Parents get accurate balances and
proof of payment (direct parent-facing views arrive with Parent Portal — this slice creates the
data they will read).

## Founder Decisions (FINAL, 2026-07-08 — the business law of this slice)

| #   | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Q1  | **Prepaid Package.** Students purchase N sessions in advance. Package sold → debt.                                                                                                                                                                                                                                                                                                                                                                                                               |
| Q2  | **Debt is created when the package is sold.** Attendance NEVER creates debt — it only consumes lessons; Payment consumes Attendance.                                                                                                                                                                                                                                                                                                                                                             |
| Q3  | **Renewal:** when remaining lessons reach zero, the next billing cycle is auto-created with status **PENDING**; it becomes **ACTIVE only after payment**; never auto-activate.                                                                                                                                                                                                                                                                                                                   |
| Q4  | **Full payment is the default; installment plan is the exception.** Students MAY continue studying while debt exists. No debt limit for MVP.                                                                                                                                                                                                                                                                                                                                                     |
| Q5  | **Mid-cycle enrollment:** default = automatic **pro-rata** on remaining sessions (20-session package, joins after 10 → charged 10). Exception = Receptionist/Manager manual price override. Enrollment stores the **Snapshot Price**, immutable after approval.                                                                                                                                                                                                                                  |
| Q6  | **Refund:** unused value becomes **Credit** (status NOT_REFUNDED; → REFUNDED on parent request). Credit history must never be lost.                                                                                                                                                                                                                                                                                                                                                              |
| Q7  | **Manual recording only** (cash, bank transfer). No online payment.                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Q8  | **Receipt, not Vietnamese e-invoice.** Receipt data MUST be reusable later by Parent Portal and Email Notification without redesigning Payment.                                                                                                                                                                                                                                                                                                                                                  |
| Q9  | **Receptionist and Accountant record payments. Teacher does not.** Future RBAC may expand.                                                                                                                                                                                                                                                                                                                                                                                                       |
| Q10 | **Success metrics:** collect payment < 1 minute; Owner sees real-time revenue.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Q11 | **Enrollment owns Snapshot Price.** Course price changes NEVER affect existing enrollments.                                                                                                                                                                                                                                                                                                                                                                                                      |
| Q12 | **Discount is stored as an Enrollment snapshot.** Never read dynamically.                                                                                                                                                                                                                                                                                                                                                                                                                        |
| D13 | **Only ONE ACTIVE billing cycle per enrollment.**                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| D14 | **Snapshot Price MUST NOT change after any receipt has been issued.**                                                                                                                                                                                                                                                                                                                                                                                                                            |
| D15 | **(OQ1 resolved)** A PENDING cycle **may consume lessons** if Organization Policy allows studying while in debt. Attendance records normally, consumption meters against the PENDING cycle, its debt stands as sold. **PENDING is a financial status, not a learning status — Attendance is never blocked by Payment.** A no-debt center changes Policy, never Attendance.                                                                                                                       |
| D16 | **(OQ2 resolved)** Credit has exactly two functions in MVP: **Refund Ledger** (default: NOT_REFUNDED → REFUNDED) and **Offset** (credit reduces the amount due on a new package purchase). Credit arises from exactly two sources: **mid-cycle withdrawal** (unused value) and **overpayment**. No other sources in MVP (voucher/scholarship/promotion are future). **Business Principle: Credit is Organization Liability** — it is never revenue; it is the center's obligation to the parent. |

## Problem

Tuition is tracked in Excel: the owner cannot see who paid or what is owed, lessons are counted
by hand, and forgotten balances leak revenue (BUSINESS.md Problem #1, ⭐⭐⭐⭐⭐ — highest
priority). Slice #1 made lesson consumption trustworthy; this slice makes the money side equally
trustworthy.

## Who benefits

Owner (real-time revenue, zero silent leakage), Accountant/Receptionist (no manual counting,
<1-minute collection), Parents (accurate balances, receipts), the company (Payment data feeds
Reports, Notifications, Parent Portal).

## Business value

Increase/protect revenue (debt is never forgotten — it is created at sale and tracked to zero),
save time (collection < 1 min; no hand-counting), reduce mistakes (snapshot prices, immutable
receipts), improve satisfaction (proof + accuracy).

## Desired outcome

A receptionist sells a package (system computes pro-rata or accepts an authorized override),
records full or installment payments against it, and hands over a receipt — in under a minute.
When a package runs out, the next cycle appears as PENDING by itself. The owner opens the
dashboard and sees revenue and outstanding debt that are true right now.

## Business Rules (operational restatement of the decisions)

1. Selling a package creates the debt; nothing else creates debt (Q1/Q2).
2. Attendance and Payment stay separated: attendance = evidence of consumption; payment =
   settlement of debt. Neither writes the other's records (Q2; Reference Slice architecture).
3. Renewal is automatic but never self-activating: remaining=0 → next cycle PENDING; payment →
   ACTIVE (Q3). Exactly one ACTIVE cycle per enrollment at any time (D13).
4. Payments: full by default; installments allowed; attending while owing allowed; no MVP debt
   cap (Q4).
5. Pricing at enrollment: pro-rata default, authorized manual override; the agreed price +
   discount become immutable snapshots on the Enrollment (Q5/Q11/Q12); frozen permanently once
   any receipt exists (D14).
6. Withdrawal/unused value → Credit ledger; append-only history; NOT_REFUNDED → REFUNDED only
   (Q6).
7. Recording is manual (cash/bank transfer), by Receptionist or Accountant only (Q7/Q9).
8. Every payment produces a Receipt whose data is consumable by future Parent Portal / Email
   Notification without Payment redesign (Q8).
9. A PENDING cycle consumes lessons when Organization Policy permits studying in debt (D15);
   the policy is configurable — Attendance behavior never changes with it.
10. Credit: refund ledger + purchase offset; born only from withdrawal or overpayment; always a
    liability, never revenue (D16).

## Business Invariants (must be enforced and test-covered — the money-safety list)

- **BI-1:** Debt exists if and only if a package sale created it; no attendance write path can
  create, increase, or reduce debt.
- **BI-2:** At most one ACTIVE billing cycle per enrollment (D13) — under concurrency and retry.
- **BI-3:** Snapshot Price (and discount) never change after approval; hard-frozen after the
  first receipt (D14).
- **BI-4:** Auto-renewal is idempotent: repeated evaluation of remaining=0 creates exactly one
  PENDING cycle, never duplicates.
- **BI-5:** Receipts are never deleted or silently mutated — corrections are new, audited
  records.
- **BI-6:** Credit history is append-only; a refund changes status, never erases value history.
- **BI-7:** Outstanding amounts and revenue are **derived** from sale/payment evidence — no
  stored counters to drift (company-default Derived Balance architecture; same rule that made
  Slice #1's balances trustworthy).
- **BI-8:** Course price changes affect zero existing enrollments (Q11).
- **BI-9:** Credit is created by exactly two events — withdrawal (unused value) and overpayment —
  and by nothing else; every credit unit is traceable to its source event (D16).
- **BI-10:** Credit never appears as revenue. Revenue views count settled payments;
  credit balances are liability. Offsetting credit against a purchase reduces the amount due and
  the liability by the same amount — value is conserved, never double-counted (D16).
- **BI-11 (Founder, 2026-07-09 — Execution Authorization):** **The ledger must balance.** At any
  point in time, every unit of value is fully accounted for: per cycle,
  `CHARGE = Σ PAYMENT + Σ CREDIT_OFFSET + outstanding`; per student,
  `Σ CREDIT_GRANT = Σ CREDIT_OFFSET + Σ REFUND + credit balance`. Value never disappears and is
  never created from nothing.

## Slice Success Metrics (Product KPIs)

| Stakeholder             | Metric                                                                            |
| ----------------------- | --------------------------------------------------------------------------------- |
| Receptionist/Accountant | Record a payment end-to-end in **< 1 minute**                                     |
| Owner                   | **Real-time** revenue + outstanding view (no refresh lag beyond normal page load) |
| Parent                  | Receipt issued for every payment; balance always explainable from history         |
| Company                 | Zero manual lesson-counting in any money calculation                              |

## Definition of Done

- [ ] Package sale flow: creates billing cycle + debt with snapshot price — pro-rata computed by
      default, manual override available to authorized roles, snapshot immutable per D14.
- [ ] Payment recording: full and installment, cash/bank transfer, receipt generated with
      reusable data shape (Q8), roles enforced (Q9).
- [ ] Auto-renewal: remaining=0 → exactly one PENDING next cycle (BI-4); activation only via
      payment (Q3).
- [ ] Credit: creation on withdrawal AND on overpayment; NOT_REFUNDED → REFUNDED transition;
      **offset flow** (credit reduces amount due on a new package); history preserved (BI-6,
      BI-9, BI-10).
- [ ] PENDING-cycle consumption honored per Organization Policy (D15); Attendance untouched.
- [ ] Owner views: real-time revenue and outstanding debt, derived from evidence (BI-7).
- [ ] All eight Business Invariants (BI-1…BI-8) enforced in the service layer and covered by
      Business Invariant Tests; CI green.
- [ ] RBAC seeded: payment permissions for Receptionist/Accountant tiers; Teacher excluded.
- [ ] Docs updated before Done; Reflection + LESSON.md recorded; Knowledge Gain scored (A10).
- [ ] Collect-in-<1-minute measured on a realistic flow before release.

## In scope

Billing cycles (sale, PENDING/ACTIVE lifecycle, auto-renewal), snapshot pricing (pro-rata +
override), payment recording (full/installment, cash/transfer), receipts (reusable data),
credit ledger with refund status, owner revenue/outstanding views, RBAC for money roles,
Business Invariant Tests.

## Out of scope (deliberately)

Online payment gateways (Phase 5); Vietnamese e-invoice compliance (Q8); parent-facing screens
(Parent Portal slice); payment reminders/notifications (Communication slice); payroll; per-
organization policy configuration surface (inherited constraint — do not hardcode deeper);
makeup/leave interactions beyond what EXCUSED already means; credit sources beyond withdrawal +
overpayment (voucher/scholarship/promotion — future, D16).

## Constraints

- Consumes Slice #1 evidence as-is: lesson consumption is already metered and invariant-tested —
  Payment must not re-meter or duplicate it (Q2).
- Inherited from Reference Slice (LESSON.md P7): deduction policy stays a configurable
  Organization Policy; PII/retention model before parent-facing exposure.
- Lifecycle: Business Analysis next; CLI drafts BA/TA/Plan per RFC-001 A2; no code before
  Execution Authorization (stage 4b); CLI implements end-to-end (A8); run orders end with push (A7).

## Priority

Highest — BUSINESS.md Problem #1; ROADMAP "Next: Payment (Tuition)"; the revenue side of the
product's core value proposition.

## Open questions

- _(none — OQ1 and OQ2 resolved by Founder, 2026-07-08, recorded as D15 and D16 above)_
