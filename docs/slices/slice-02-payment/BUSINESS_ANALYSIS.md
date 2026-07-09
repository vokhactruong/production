# Business Analysis — Product Slice #2: Payment (Tuition)

> **Status: DRAFT — recommendation GO. Prepared by Delivery Manager (Claude CLI, Stage 2 per
> RFC-001 A2), 2026-07-09. Awaiting Stage 3 cross-review (Desktop) → Founder go/no-go.**
> Per `playbook/templates/business-analysis-template.md`, extended with the ratified slice
> sections (format benchmark: slice-01 BUSINESS_ANALYSIS.md). Business language only — no schema,
> no architecture, no code. All Founder decisions (Q1–Q12, D13–D16) are FINAL and are treated
> here as binding inputs, not re-opened.

- **Feature:** Payment (Product Slice #2 — Revenue Collection & Balance Settlement capability)
- **Linked requirement:** `docs/slices/slice-02-payment/REQUIREMENT.md` (APPROVED FOR BUSINESS
  ANALYSIS, 2026-07-08; decisions Q1–Q12, D13–D16 FINAL; invariants BI-1…BI-10)
- **Analyst:** Delivery Manager (Claude CLI)

## Value test

- [x] **What problem does this solve?** → Tuition lives in Excel: the owner cannot see who has
      paid or what is owed, lessons are counted by hand, and forgotten balances leak revenue —
      **BUSINESS.md Problem #1 (Tuition Management, ⭐⭐⭐⭐⭐, highest priority).** Slice #1 made
      lesson _consumption_ trustworthy; this slice makes the _money_ side equally trustworthy.
- [x] **Who benefits?** → Owner (real-time revenue + outstanding, zero silent leakage),
      Accountant/Receptionist (no hand-counting, collection in <1 min), Parents (accurate
      balances + receipts), the company (Payment data feeds Reports, Notifications, Parent Portal).
- [x] **Does it reduce manual work?** → Yes — removes hand-counting of lessons from every money
      calculation and ends Excel reconciliation; supports the ≥50% admin-work-reduction success
      metric (BUSINESS.md §Success Metrics).
- [x] **Does it increase revenue (or protect it)?** → Directly protects it: debt is created at
      sale and tracked to zero, so outstanding payments are never forgotten — the exact leak named
      in Problem #1. This is the revenue-collection half of the product's core value proposition.
- [x] **Does it improve customer/parent satisfaction?** → Yes — every payment yields a receipt and
      balances are always explainable from history, so billing disputes fall. Direct parent-facing
      views arrive with Parent Portal; this slice creates the trustworthy data they will read.
- [x] **Can it be simpler?** → It is already the minimal money slice: sell package → record
      payment → receipt → derived revenue/outstanding, plus credit for withdrawal/overpayment.
      Online gateways, e-invoice, parent screens, and reminders are all deferred. Removing more
      (e.g. dropping snapshot pricing or credit-as-liability) would reintroduce the revenue leak
      and accounting drift the slice exists to prevent.

**Verdict: passes the value test on every dimension — this is the company's highest-priority
business problem.**

## Business rules affected

**New rules (from Founder decisions, all FINAL 2026-07-08):**

- Debt originates **only** at package sale; attendance never creates debt (Q1/Q2 → BI-1).
- Auto-renewal creates the next cycle **PENDING** at remaining = 0; activation only via payment;
  at most **one ACTIVE cycle per enrollment** (Q3/D13 → BI-2, BI-4).
- Payment: full is default, installments allowed, studying while owing allowed, no MVP debt cap
  (Q4).
- Snapshot pricing: pro-rata by default + authorized manual override; agreed price and discount
  become **immutable snapshots** on the enrollment, hard-frozen once any receipt exists
  (Q5/Q11/Q12/D14 → BI-3, BI-8).
- Credit: arises **only** from withdrawal (unused value) or overpayment; serves as refund ledger
  (NOT_REFUNDED → REFUNDED) and as purchase offset; append-only history; **always a liability,
  never revenue** (Q6/D16 → BI-6, BI-9, BI-10).
- Recording is manual (cash / bank transfer) by **Receptionist or Accountant only**; Teacher
  excluded (Q7/Q9).
- Every payment produces a **Receipt** whose data is reusable by Parent Portal / Email
  Notification later, without redesigning Payment (Q8 → BI-5).
- A **PENDING** cycle may consume lessons when Organization Policy permits studying in debt (D15)
  — a financial status, never a learning gate.

**Existing rules touched (cited):**

- "Attendance deducts remaining lessons" / lesson consumption (Slice #1; DATABASE.md, API.md) —
  **consumed as-is; Payment must not re-meter or duplicate it** (Q2; §Constraints).
- Attendance ↔ Payment separation — attendance is _evidence of consumption_, payment is
  _settlement of debt_; neither writes the other's records (Reference Slice architecture).
- **Derived Balance** company default — outstanding and revenue are derived from sale/payment
  evidence with no stored counters to drift (BI-7; the same principle that made Slice #1 balances
  trustworthy).
- Snapshot / one-ACTIVE conventions extend Slice #1's enrollment model — consumed, not changed.
- Soft delete + audit on critical actions (CLAUDE.md / CONVENTIONS.md) — money writes and receipts
  are critical business actions.

**Rule changes required in docs:** none. Payment adds rules and consumes Slice #1's; it
contradicts nothing existing. (The three pre-existing DATABASE.md/API.md contradictions were
already fixed at Reflection Meeting #1.)

## Stakeholders & impact

| Stakeholder      | Impact                                                                                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Owner            | First real-time revenue + outstanding-debt view; ends revenue blindness — the slice's headline value.                                                                                                                    |
| Accountant       | Primary user. Stops hand-counting and Excel reconciliation; records payments, issues receipts, manages credit and refunds.                                                                                               |
| Receptionist     | Sells packages (pro-rata or authorized override), records payments, hands over receipts — the <1-minute flow. Gains the first operational **money** permissions (an RBAC expansion, mirroring Slice #1's Teacher grant). |
| Student / Parent | Balances become system-computed and explainable; a receipt exists for every payment. No direct screens yet (Parent Portal slice).                                                                                        |
| Teacher          | Explicitly **excluded** from money actions (Q9); attendance stays their only write path — reinforces the Attendance/Payment separation.                                                                                  |
| Company / AI org | Second full lifecycle run; first **Rule-of-Three** evidence for Pattern Candidates P3/P4 and RFC-001 ratification; first CLI **end-to-end** implementation (A8).                                                         |

## Priority vs. roadmap

No queue-jumping — **this is the roadmap.** ROADMAP names "Next: Payment (Tuition)"; BUSINESS.md
ranks Tuition #1 ⭐⭐⭐⭐⭐. Slice #1 was explicitly the revenue _enabler_ (attendance as the
metering sensor); Payment is the revenue _collector_ it unblocked. Building it now is the intended
sequence, not a jump.

## Business risks

**Of building:**

- **Money-correctness is the central risk.** A mis-priced snapshot, a double-charged renewal, or
  credit counted as revenue is a direct financial and trust failure. Mitigated by the mandated
  Business Invariant Tests (BI-1…BI-10) — non-negotiable, the same discipline that gave Slice #1
  zero in-contract defects.
- **Credit-as-liability accounting.** Treating credit as revenue would overstate income and
  mishandle refunds — a genuine accounting/trust risk. D16/BI-10 make it a liability by rule; this
  analysis flags it as the single highest-value invariant to get right.
- **Collection-speed adoption.** If recording exceeds ~1 minute or fails mid-flow, staff revert to
  Excel and the money data degrades (partial data is worse than none). The <1-minute KPI is a
  **launch gate**, not a nice-to-have — the direct analogue of Slice #1's ≤10s teacher lesson.
- **Study-while-in-debt policy variance.** Centers differ; D15 makes this an Organization Policy,
  not a hardcoded rule — protecting the SaaS ambition — but the shipped default must be
  conservative and clearly surfaced.
- **Minors' financial + behavioral PII deepens.** Payment ties money to children's participation.
  Inherited constraint (Slice #1 LESSON.md §P7): a PII/retention model must be resolved before
  Parent Portal exposes any of this externally. Acceptable to defer _within_ this slice; must not
  be forgotten.

**Of not building:** the product's #1 problem stays unsolved; revenue keeps leaking through
forgotten balances; Slice #1's trustworthy attendance data has no money system to feed; and the
roadmap stalls at its single highest-value step.

## Decision

- **Outcome:** ☑ Build (recommended) ☐ Defer ☐ Drop
- **Approved by:** _pending — Stage 3 cross-review (Desktop) → Founder go/no-go_
- **Rationale (analyst recommendation):** Payment is the revenue-collection half of the product's
  core value proposition and its highest-priority problem. The business decisions are already
  FINAL and mutually coherent, the money-safety invariants are specified and testable, and scope
  is minimal and correctly bounded. Business grounds strongly favor **Build**. The formal go/no-go
  remains the Founder's.

## Escalations / open questions

- **No business questions are open** — OQ1/OQ2 were resolved as D15/D16; Q1–Q12 and D13–D16 are
  FINAL and are not re-opened at this stage.
- **Watch-items carried to Stage 3 and later stages** (surfaced, not re-litigated, non-blocking):
  1. The **<1-minute collection KPI** needs a live-measurement gate before release (Slice #1's
     ≤10s KPI is still pending live confirmation — the same class of obligation, A10).
  2. **Credit-as-liability (BI-10)** is the highest-consequence invariant — Technical Analysis
     should keep revenue and liability as strictly separated views from the outset.
  3. The inherited **PII/retention constraint** (LESSON.md §P7) remains unresolved company-wide —
     flag before any parent-facing exposure.
  4. **Organization Policy configuration** stays out of scope (inherited constraint); the
     study-in-debt default (D15) must ship conservative and must not be hardcoded deeper.
