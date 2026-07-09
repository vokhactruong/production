# Customer Journey — Product Slice #2: Payment (Tuition)

> **Status: RESOLVED — Founder decisions applied, 2026-07-08.**
> Stage: PRODUCT DISCOVERY. Second run of Pattern Candidate P3 (Journey → Capability →
> Requirement). All 10 original [Q]s answered and FINAL (+Q11, Q12, D13, D14) — recorded in
> `REQUIREMENT.md` §Founder Decisions. Two genuinely unresolved questions remain (OQ1, OQ2
> below); everything else is decided.

## Business Capability Mapping (opens the slice — Founder directive, Slice #1 precedent)

**Capability: Revenue Collection & Balance Settlement** — turning participation evidence into
money owed, collected, and accounted for. Consumes the Reference Slice's capability
(Participation Management). Future reuse: **POS** (order → payment), **Membership** (dues),
**Booking** (reservation payment), **CRM** (deal → invoice).

## The journeys (personas from PRD; pains from BUSINESS.md Problem #1 — ⭐⭐⭐⭐⭐, highest priority)

**Owner** — today: tuition in Excel, cannot answer "who has paid, who owes, how much revenue
this month"; revenue leaks silently (forgotten balances). Desired: real-time revenue and
outstanding view; nothing forgotten, ever.

**Accountant / Receptionist** — today: counts lessons by hand, cross-references notebooks,
chases parents from memory; multiple tuition plans multiply the errors. Desired: the system
computes what each student owes from actual attendance (Slice #1 gives lesson consumption);
collecting a payment takes **< 1 minute** (BUSINESS.md success metric) and prints/records proof.

**Parent** — today: pays cash at the desk, gets little proof, doesn't know how many lessons
remain until someone calls asking for money. Desired: knows the balance, pays before it runs
out, has payment history. _(Direct parent-facing view belongs to Parent Portal — a later slice;
this slice creates the data it will read.)_

**Student** — largely passive here; their enrollment balance (Slice #1, derived) is the meter.

**Pain → this slice removes:** the Owner's blindness to money and the Accountant's manual
counting/chasing. Everything else consumes what this slice creates.

## What Slice #1 already gives Payment (evidence, not plan)

- Lesson consumption per enrollment = **derived, invariant-tested, trustworthy** — the metering
  unit of tuition already exists.
- `billingCycleSessions` snapshot per enrollment (the "package size").
- Session/attendance audit trail for dispute resolution.

## Known Constraints inherited (LESSON.md P7 — must be answered inside this slice)

1. **Mid-cycle enrollment:** how are remaining lessons / money owed computed for a student who
   joins mid-cycle? (Deferred from Slice #1 by design — now it is due.)
2. Deduction policy is a default Organization Policy — Payment must not hardcode it deeper.
3. PII/retention model before any parent-facing exposure.

## Founder decisions (2026-07-08) — all original questions RESOLVED

Q1–Q12 + D13/D14 are FINAL and recorded in full in `REQUIREMENT.md` §Founder Decisions.
Summary: prepaid packages; debt created at package sale (attendance never creates debt);
auto-renewal creates the next cycle as PENDING, ACTIVE only after payment; full payment default
with installment exception and study-while-owing allowed (no MVP debt limit); mid-cycle =
automatic pro-rata with manual override, price snapshotted immutably on Enrollment; unused value
→ Credit (NOT_REFUNDED → REFUNDED), history never lost; manual cash/bank-transfer recording
only; Receipt (no VN e-invoice) with reusable data shape; Receptionist + Accountant record,
Teacher never; success = collect < 1 min + real-time revenue; one ACTIVE cycle per enrollment;
snapshot immutable after any receipt.

## Open questions

- _(none — OQ1 and OQ2 resolved by Founder, 2026-07-08 → REQUIREMENT.md D15, D16.)_
  OQ1: PENDING cycles consume lessons when Organization Policy allows studying in debt —
  PENDING is a financial status, not a learning status; Attendance is never blocked by Payment.
  OQ2: Credit = refund ledger + purchase offset; sources = withdrawal + overpayment only;
  **Credit is Organization Liability, never revenue.**

## Next (per lifecycle)

REQUIREMENT.md is **APPROVED FOR BUSINESS ANALYSIS** → Claude CLI drafts Business Analysis
onward (RFC-001 A2) → Execution Authorization (4b) → CLI implements end-to-end (A8).
