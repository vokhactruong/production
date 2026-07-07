# FOUNDER & ORGANIZATION BLUEPRINT

> **AOS (AI Organization System) — Sprint 1 deliverable.**
> Purpose: define the _organization_ — its mission, philosophy, culture, decision-making,
> and human/AI operating model — before any AI Constitution, Knowledge Engine, Workflow
> Engine, Memory, or Standards are written.
>
> This is an **organization blueprint**, not project documentation. It describes the company
> that builds the product, not the product's features.
>
> **Method / evidentiary discipline.** Nothing here is invented. Every substantive claim is tagged:
>
> - **[Observed]** — directly present in the repository or `/docs`.
> - **[Inferred]** — reasoned from observed evidence; a defensible reading, not a fact.
> - **[Suggested]** — a recommendation from the Lead Implementation Engineer; requires approval.
> - **[Assumption]** — a gap filled provisionally; must be confirmed by the Founder/Architect.
>
> Source of truth for this blueprint: `docs/AI/PROJECT_ANALYSIS.md` (reviewed & approved),
> the `/docs` corpus, `CLAUDE.md`, and the codebase as of the Sprint 0 pass.
>
> Authored by: Lead Implementation Engineer. Awaiting Founder / System Architect review.
> This document does not decide anything — it structures what must be decided.

---

## 1. Founder Mission

### Why this company exists

**[Observed]** The stated mission is to _"Help education centers replace Excel, paper records, and manual operations with a simple, modern, and automated management platform"_ (BUSINESS.md). The company exists to remove manual, error-prone administration from the daily life of small and medium education centers.

**[Observed]** A binding test governs every feature (BUSINESS.md): it must _save time, reduce mistakes, increase revenue, improve parent satisfaction, or reduce operational cost_ — otherwise it is not built. The company's reason to exist is therefore explicitly **operational value delivery**, not technology for its own sake.

### The problems it wants to solve

**[Observed]** The core pains the product targets, in the Founder's own priority order (BUSINESS.md):
tuition tracked in spreadsheets and revenue lost to forgotten balances; slow, mistake-prone attendance; fragile scheduling and substitutions; untracked makeup classes; manual one-by-one parent communication; invisible student progress; manual teacher workload/payroll; leads lost in admissions; and owners flying blind without real-time numbers.

### Long-term vision

**[Observed]** The vision is a _"modern, scalable, and automated"_ SaaS that runs an education center's entire daily operation from a single dashboard, explicitly _"Support future multi-tenant SaaS deployment"_ and eventually _"Support hundreds of education centers from one platform"_ (PRD.md, ROADMAP.md Phase 7).

**[Inferred]** The trajectory is a deliberate climb: **replace Excel → give owners decisions → improve the parent experience → automate the repetitive → differentiate with AI → scale as a multi-tenant platform** (the ordered ROADMAP phases). Value precedes scale; scale is the destination, not the starting point.

### Why this product matters

**[Inferred]** Education centers run on thin administrative margins and high trust with parents. Every hour lost to spreadsheets, every forgotten payment, every attendance mistake erodes both margin and trust. **[Observed]** The Founder frames each capability against a concrete human outcome ("save teacher time," "increase trust with parents," "prevent revenue loss"). The product matters because it converts invisible administrative friction into recovered time, recovered revenue, and parental confidence.

> **[Assumption]** The company is early-stage and product-led (a small team, possibly founder-plus-engineer). Evidence: single-tenant reality, seeded demo data, no billing/tenancy code, and a roadmap that still calls the MVP unfinished. This should be confirmed — it changes how much process the organization can afford.

---

## 2. Product Philosophy

**[Observed]** The philosophy is declared plainly and repeatedly: _"Business first"_ (BUSINESS.md), and a fixed product priority order in `CLAUDE.md`:

> **Business Value → Simplicity → Consistency → Maintainability → Security → Performance.**

The philosophy's pillars, all textually grounded:

- **Business-first.** _"Every feature must solve a real business problem."_ Six qualifying questions gate every feature; _"If the answer is 'No', do not build it."_ **[Observed]**
- **Long-term thinking.** _"Database design should prioritize long-term maintainability over short-term convenience"_ (DATABASE.md). Historical business data must never disappear; soft-delete and audit are defaults. **[Observed]**
- **Scalability, deferred not ignored.** _"Future-ready… Avoid assumptions that only one center will exist forever"_ — yet _"Never optimize prematurely… Measure first. Optimize later."_ Scalability is designed _for_, not built _early_. **[Observed]**
- **Maintainability.** Strong, uniform conventions; _"Change only what is necessary. Do not refactor unrelated modules"_ (CLAUDE.md). **[Observed]**
- **Simplicity.** _"Keep solutions simple… Avoid unnecessary abstractions… Do not introduce abstractions unless they solve a real problem"_ (CLAUDE.md, CONVENTIONS.md). **[Observed]**
- **Customer value over cleverness.** Success is measured in the customer's terms — register a student < 2 min, attendance < 10 s, tuition < 1 min, ≥ 50% less manual work (BUSINESS.md). **[Observed]**

**[Inferred]** The through-line: **the product is a means to a business outcome, and the codebase is a means to a maintainable product.** Elegance is only valuable when it serves those ends.

---

## 3. Organization Vision

_What kind of company the evidence says this wants to become. Only traits with repository support are listed; no future plans are invented._

- **Documentation-first.** **[Observed]** A ten-document `/docs` corpus governs the project, with an explicit precedence order (BUSINESS → PRD → ROADMAP → CONVENTIONS → technical docs) and a hard rule in `CLAUDE.md`: _"Before implementing any feature, read the relevant documentation in /docs."_ Decisions and rationale are written down before and alongside code (e.g., the scheduling-engine rationale in BUSINESS/DATABASE). This is already an organizational habit, not an aspiration.
- **Knowledge-driven.** **[Inferred]** The docs encode not just _what_ but _why_ (why `sessionNumber` is permanent, why partial unique indexes, why Employee ≠ User). The organization values captured reasoning over tribal memory — though that knowledge currently lives in prose, not yet in a formal engine (PROJECT_ANALYSIS §15).
- **AI-first (emerging).** **[Observed]** `CLAUDE.md` contains a dedicated "AI RULES" section and an "AI Development Rules" block appears in CONVENTIONS, DATABASE, API, QUERY_KEYS — the docs were written to be consumed by an AI engineer. **[Inferred]** The very existence of this AOS initiative signals intent to make AI a first-class member of the organization, not a bolt-on tool.
- **Convention-over-configuration / consistency-driven.** **[Observed]** Uniform module patterns, query-key factories, cache strategies, naming rules. The organization scales by making the _next_ module look like the _last_ one.
- **Automation-first (aspirational, partial).** **[Observed]** Husky + lint-staged + commitlint + CI (lint/type-check/build) exist. **[Inferred]** The ambition is broader (ROADMAP Phase 5 "Automation"), but automation today stops at formatting and static checks — no test automation, no generation automation (PROJECT_ANALYSIS §17). This is a _direction_, not yet a _state_.

> **[Suggested]** Treat "AI-first" and "Automation-first" as **intended** organizational traits to be ratified by the Founder — the evidence shows intent and scaffolding, but not yet a mature practice. The blueprint should not overstate them as achieved.

---

## 4. Decision Principles

_The organization's decision-making philosophy, extracted from written priority orders. Where the source is a document, it is Observed; connective reasoning is Inferred._

**Ratified priority orders already in the repository — the backbone of all decisions:**

| Context          | Ordered principle                                                                    | Source                        |
| ---------------- | ------------------------------------------------------------------------------------ | ----------------------------- |
| Product features | Business Value → Simplicity → Consistency → Maintainability → Security → Performance | `CLAUDE.md` **[Observed]**    |
| Coding           | Simplicity → Readability → Consistency → Maintainability → Scalability               | CONVENTIONS.md **[Observed]** |
| Roadmap          | Stability > Business Value > New Features                                            | ROADMAP.md **[Observed]**     |
| Development      | Business Value → Customer Feedback → Simplicity → Stability → Scalability            | ROADMAP.md **[Observed]**     |
| Doc conflicts    | BUSINESS → PRD → ROADMAP → CONVENTIONS → technical docs                              | `CLAUDE.md` **[Observed]**    |

**Distilled decision principles [Inferred from the above]:**

- **Business > Features.** A feature with no measurable business value is not built.
- **Stability > New Features.** _"Never build future features before the current phase is stable"_ (ROADMAP).
- **Architecture > Speed.** _"Never redesign the architecture without approval"_; _"Do not refactor unrelated modules"_ — correctness of structure outranks velocity.
- **Documentation > Conversation.** Rules live in `/docs`, not in chat; the doc precedence order exists precisely to resolve disputes by reference, not by memory.
- **Knowledge > Memory.** Rationale is written down (the "why" comments and design docs) so decisions survive the people who made them.
- **Maintainability > Cleverness.** _"Write code that explains itself"_; _"Avoid over-engineering."_
- **Consistency > Novelty.** _"Follow existing project patterns before introducing new ones"_ (CLAUDE.md AI RULES).
- **Verify > Guess.** _"Ask ONE clarifying question if requirements are unclear"_; _"If unsure, ask one clarifying question before coding"_ (CLAUDE.md, CONVENTIONS.md). **[Observed]**

**Meta-principle governing _how_ decisions are reached:**

- **Never guess; always verify.** **[Observed]** Encoded as an explicit instruction. **[Suggested]** The AOS should make this operational: an AI or engineer that cannot cite evidence for a decision must ask, not assume.

**Authority of decisions [Observed]:** _"Every important decision requires Founder/System Architect approval"_ — architecture, company direction, and product scope are **not** delegated to the implementation layer (human or AI).

---

## 5. Product Strategy

### Current product **[Observed]**

A working, mid-build **Education Center Management SaaS** on a TurboRepo monorepo: NestJS API, React/Vite admin portal, Next.js public site. Implemented: Auth + RBAC, Users/Roles/Permissions, Audit, Upload, Dashboard, CMS (Categories/Articles), and the core operational spine — Students, Subjects, Courses, Employees (+ optional User linking), Classrooms, Classes, Enrollments, and the Scheduling Engine v1 (ClassSchedule → ClassSession). **[Observed]** Not yet built: Attendance, Tuition/Payment/Invoice, Notifications, CRM.

### Future product **[Observed]** (ROADMAP phases, no invention)

- **Phase 2 tail:** Attendance → Tuition/Payment → Notifications (replace Excel completely).
- **Phase 3:** Business management — revenue reports, financial dashboard, statistics, teacher performance, CRM/admissions pipeline.
- **Phase 3.9:** Guardian as a first-class entity (foundational for Parent Portal).
- **Phase 4:** Parent & Student portals, progress, teacher comments.
- **Phase 5:** Automation — auto reminders, QR attendance, online payments, payroll.
- **Phase 6:** AI — student comments, progress summaries, chatbot, admissions assistant, risk prediction.
- **Phase 7:** Enterprise — multi-tenancy, subscription billing, mobile, public API, white-label.

### Expansion strategy **[Inferred]**

Expansion is **sequential and value-gated**: deepen the single-center product until a center can run entirely without spreadsheets, _then_ broaden (business intelligence → parent experience → automation → AI), _then_ multiply (multi-tenant, hundreds of centers). Breadth is earned by depth.

### Reusable-platform strategy **[Observed + Inferred]**

- **[Observed]** A recurring, deliberately reusable design pattern: **Business Profile ↔ optional User account**. Established for Employee ↔ User, and _explicitly_ slated to repeat for Guardian ↔ User and Student ↔ User (DATABASE.md, PRD, ROADMAP 3.9/4). Identity and business data are kept separate so new personas attach to the same auth core.
- **[Observed]** **Planning-layer vs execution-layer** separation (ClassSchedule vs ClassSession) is described as a general engine designed to extend additively (teacher/classroom replacement per session) _"without a redesign."_
- **[Observed]** Shared `packages/*` (types, constants, auth, validators, ui) and a uniform module template make each new capability a repeat of a known shape.
- **[Inferred]** The platform strategy is to invest in **a small number of reusable spines** (identity-linking, planning/execution, RBAC, audit, the module template) so that future modules are compositions, not inventions. **[Suggested]** Protecting and formalizing these spines should be a first-order concern of the AOS, because they are where reuse compounds — or drifts (see the permission-source drift, PROJECT_ANALYSIS §11/§18).

---

## 6. Organization Principles

_How the company works. Grounded in written rules and observed practice; culture recommendations flagged as Suggested._

- **Documentation.** **[Observed]** Read the docs before coding; docs have precedence; capture the _why_, not just the _what_ ("Only add comments when explaining Why, not What"). Documentation is a first-class deliverable, not an afterthought.
- **Code quality.** **[Observed]** A hard, pre-completion gate: _build passes, lint passes, type-check passes, existing functionality intact_ (`CLAUDE.md`, CONVENTIONS "Testing Mindset"). Code must be _small, predictable, testable, reusable_; no dead code, no magic values, no duplicated logic.
- **Ownership.** **[Observed]** Feature isolation is a rule: _"Each feature owns its API, Hooks, Query Keys, Mutations"_; _"Never reference another module's query keys unless the mutation affects that module"_ (QUERY_KEYS.md). Clear boundaries, clear owners.
- **Reviews & change discipline.** **[Observed]** _"Change only what is necessary. Do not refactor unrelated modules."_ Migrations require _"Migration, Review, Testing"_ and existing migrations are immutable once applied (DATABASE.md). **[Inferred]** The organization favors small, reviewable, additive change over sweeping rewrites.
- **Reuse before build.** **[Observed]** _"Never duplicate code when an existing implementation can be reused"_; _"Before writing new code ask: Can this be reused?"_
- **Architecture is authored, not improvised.** **[Observed]** Architecture and important decisions are reserved to Founder/System Architect; the implementation layer follows and asks when unclear.
- **Knowledge sharing.** **[Inferred]** Currently achieved through the docs corpus and dense rationale comments. **[Suggested]** As the team/AI grows, this should be formalized (decision records, glossary) — see §8 and PROJECT_ANALYSIS §14–15.

> **[Suggested]** Two cultural gaps are worth naming as principles to _adopt_, not to claim as existing: (a) a **definition-of-done that includes tests** (today there are none — PROJECT_ANALYSIS §18), and (b) a **single-source-of-truth rule** for cross-cutting data like permissions/types (today they drift across three places). Both are organizational, not merely technical.

---

## 7. Engineering Philosophy

_The engineering culture, as evidenced._

- **Layered / clean architecture.** **[Observed]** Backend: `Controller → Service → Repository → Prisma`; frontend: `Feature → API → Hooks → Components → Pages`. _"Business logic must never exist inside controllers or UI components"_ (CLAUDE.md). Each layer has one responsibility.
- **Repository pattern.** **[Observed]** Repositories do data access only; services hold all business logic; `select`-projections and typed record shapes (e.g., `CoursesRepository`) are the norm. **[Observed caveat]** The pattern is applied _inconsistently_ — several newer modules lack a repository (PROJECT_ANALYSIS §5/§18); the _philosophy_ is clear even where practice lags.
- **Business rules live in services.** **[Observed]** e.g., Course→Class snapshotting, session-number permanence, enrollment uniqueness, transactional create-with-audit and code-collision retry (EmployeesService).
- **RBAC everywhere.** **[Observed]** Permission codes guard every protected endpoint server-side; UI gating is explicitly _cosmetic only_ (_"Never hide security behind UI… Always verify permissions"_).
- **Data integrity as a first principle.** **[Observed]** Soft-delete for business data, audit logs on critical actions, transactions for multi-entity/financial operations, DB constraints as _"the final line of defense,"_ Decimal (never Float) for money, UTC storage.
- **Consistency & anti-over-engineering.** **[Observed]** Convention-driven uniformity; _"Do not introduce abstractions unless they solve a real problem."_
- **Testing & refactoring.** **[Observed]** CONVENTIONS advocates a testing _mindset_ and disciplined, minimal refactoring — but **[Observed]** there are **no automated tests** in the repo and CI runs no test step (PROJECT_ANALYSIS §17/§18). **[Inferred]** The culture _values_ correctness and safe change, but currently relies on manual checklists and static analysis rather than an automated safety net.

> **[Suggested]** The single largest gap between engineering _philosophy_ and engineering _practice_ is the absence of tests. The AOS should treat closing this gap as a cultural decision for the Founder, not a task to be quietly assumed.

---

## 8. Knowledge Philosophy

_How the organization treats knowledge._

- **Repository as source of truth.** **[Observed]** Rules, rationale, and standards are committed to the repo (`/docs`, schema comments, `CLAUDE.md`). Knowledge is versioned with the code it governs.
- **Documentation as the primary knowledge medium.** **[Observed]** Ten governing documents, each with an "AI Development Rules" section; the precedence order makes the corpus authoritative and conflict-resolvable.
- **Rationale over instruction.** **[Observed]** The most valuable knowledge captured is _why_: why sessionNumber is permanent, why uniqueness is partial vs full, why the FK lives on Employee, why refetch-before-navigate. This is the organization's real intellectual asset.
- **Decisions, glossary, business rules — partially captured.** **[Observed]** Business rules are documented (Course-is-a-template, one-active-enrollment, planning≠execution). **[Observed gap]** There are **no formal decision records (ADRs)** and **no domain glossary**, despite several non-obvious, deliberate decisions and a bilingual (English code / Vietnamese UI) domain (PROJECT_ANALYSIS §14–15).
- **Learning.** **[Inferred]** ROADMAP entries record _when_ and _why_ things changed (e.g., "Scheduling Engine v1 (2026-07-05)," identity-audit debt "recorded 2026-07-02"), showing an organization that documents its own evolution.

> **[Suggested]** The future Knowledge Engine should be **distilled from the existing corpus first**, not authored from scratch — the `/docs` already function as an informal knowledge base. Priorities to add: an ADR practice for the deliberate decisions, and a bilingual domain glossary (NV-=Employee/Nhân viên, HS-=Student/Học sinh, etc.). _(Ratification needed — Open Question.)_

---

## 9. AI Philosophy

_How AI should participate in the organization._

**[Observed] The AI's role is already scoped in `CLAUDE.md` and this initiative's framing:** AI is the **Lead Implementation Engineer** — it implements, reviews, improves, and refactors within the rules; it _"Never redesigns the architecture without approval."_ AI is a builder and steward, **not** a decider.

**[Inferred] AI as a multi-hat contributor, all subordinate to human authority:**

- **Engineer** — implements features following existing patterns and standards.
- **Reviewer** — checks work against the written conventions and quality gates.
- **Planner** — proposes implementation plans and asks clarifying questions before coding.
- **Knowledge maintainer** — keeps documentation and rationale current with the code.

**Hard boundaries [Observed + Suggested]:**

- **[Observed]** AI never replaces the Founder and never makes business or architectural decisions; _"Every important decision requires Founder/System Architect approval."_
- **[Observed]** AI must _"Follow existing project patterns before introducing new ones"_ and _"ask one clarifying question"_ when unsure — i.e., **verify, don't guess**.
- **[Suggested]** AI must operate **evidence-first**: cite the doc/code that justifies a change; when no evidence exists, surface an assumption for approval rather than inventing one. (This blueprint models that discipline.)
- **[Suggested]** AI's authority boundaries beyond "architecture" are currently undefined (may it change schema? dependencies? public API contracts? create tests?). These need explicit ratification — see §12.

**[Inferred]** The intended relationship is **augmentation, not autonomy**: AI compresses the cost of building and maintaining a convention-heavy, documentation-first system, while humans retain judgment over _what_ to build and _why_.

---

## 10. Company Operating Model

_How humans and AI collaborate. The chain below is the intended authority-and-execution flow._

```
Founder                → owns mission, business, product scope, final approval
   ↓
System Architect       → owns architecture and organization rules
   ↓
Organization Rules     → Blueprint → (future) Constitution, Standards, Knowledge
   ↓
AI Runtime             → Lead Implementation Engineer: plan, implement, review, maintain
   ↓
Repository             → the single source of truth; where rules + code + knowledge live
   ↓
Knowledge              → captured rationale, decisions, glossary, business rules
```

**Reading of the model [Inferred]:**

- **Authority flows down; evidence and proposals flow up.** The Founder and Architect set direction and rules; the AI executes within them and escalates anything requiring judgment.
- **The Repository is the contract surface between layers.** **[Observed]** Rules are not verbal — they are committed. The AI is bound by what is written, and its output re-enters the repository (and knowledge) for review.
- **Knowledge is a feedback loop, not a terminus.** **[Inferred]** What the AI and team learn should flow back into documentation/decision records, keeping the rule layer alive.
- **Every layer is subordinate to the one above.** **[Observed]** No layer may redefine the layer above it without approval — the AI cannot change architecture; the rules cannot override the Founder's business intent (doc precedence puts BUSINESS first).

> **[Suggested]** The model implies but does not yet define the **review checkpoints** between layers (when does the Architect approve? what triggers escalation from AI to human?). Defining these checkpoints is a natural Sprint 2 concern.

---

## 11. Risks

_Organization-level risks. Product/technical risks are catalogued in PROJECT_ANALYSIS §18–20; here the focus is on the company, its knowledge, its AI, and its scaling._

### Organizational risks

- **[Observed] Key-person / continuity risk.** Deep, non-obvious rules live in one contributor's context; thin BACKEND/FRONTEND docs and zero tests mean continuity depends on that context. **[Assumption]** small team amplifies this.
- **[Observed] Practice-vs-principle gaps erode trust in the rules.** Where the docs say one thing and the code does another (inconsistent repository layer, drifted permissions, incomplete Swagger tags, response-shape mismatch), the authority of the written rules weakens — an organizational, not just technical, hazard.
- **[Observed] Scope ambiguity.** The "AI in/out of MVP" contradiction and the product-identity skew (education-center SaaS vs. school-news portal) can misdirect the whole organization if left unresolved.

### Knowledge risks

- **[Observed] Multiple sources of truth drift.** Permissions exist in three places (seed, admin constants, stale shared enum); types are hand-mirrored against Prisma. Without a single-source rule, the organization's "truth" fragments.
- **[Observed] Undocumented deliberate decisions.** No ADRs for choices that are easy to accidentally reverse (partial unique indexes, session-number permanence, JWT-embedded permissions). Future contributors (human or AI) may "fix" intentional designs.
- **[Observed] No glossary for a bilingual domain.** English code + Vietnamese UI/data with no mapping invites misinterpretation.

### AI risks

- **[Inferred] Convention-heavy + no tests = silent AI regressions.** The system leans on repeated patterns with no automated safety net; AI-generated changes can violate conventions or invariants without anything failing.
- **[Suggested/Inferred] Undefined AI authority.** Without explicit boundaries beyond "don't redesign architecture," AI could over-reach (schema, dependencies, public API) or under-serve (refuse safe work). Ambiguity is itself a risk.
- **[Inferred] Evidence-free generation.** If AI is allowed to "fill gaps" by inventing rather than surfacing assumptions, the knowledge base and code accrue plausible-but-unverified content.

### Scaling risks

- **[Observed] Single-tenant foundations vs. multi-tenant ambition.** No `organizationId`; global-scope unique constraints. Scaling to many centers requires a coordinated breaking migration (documented, ROADMAP Phase 7).
- **[Observed] Stateful runtime.** In-memory OAuth codes and process-local state block horizontal scaling; Redis is provisioned but unused.
- **[Inferred] Process debt compounds with growth.** Manual quality gates and hand-repeated module scaffolding scale sub-linearly; as module count grows, the absence of test/generation automation becomes a throughput ceiling.

---

## 12. Open Questions

_Inputs for Sprint 2. Each is a decision reserved to the Founder/System Architect; the AOS should not proceed on assumptions where an answer changes direction._

**Company & product identity**

1. Is the canonical product the **education-center operations SaaS** (BUSINESS/PRD), with the `school-portal` name and the `apps/web` school-news content treated as legacy/secondary?
2. What is the true **stage and shape of the organization** (team size, funding, single-founder vs. team)? This calibrates how much process the blueprint should prescribe.
3. **Is "AI" in or out of the current MVP?** BUSINESS.md lists it in both Included and Not-Included; PRD says out-of-scope. (Also affects the AI Philosophy scope.)

**Rules, authority & the operating model** 4. Will the future **AI Constitution supersede, incorporate, or sit above** `CLAUDE.md` and `/docs`? What is the conflict-resolution rule between them? 5. What are the **AI's authority boundaries** beyond "never redesign architecture" — may it change the database schema, add/remove dependencies, alter public API contracts, or author tests autonomously? 6. What are the **review checkpoints** between operating-model layers — when does the System Architect approve, and what triggers AI→human escalation? 7. Who plays the **System Architect** role today (a person, the Founder, or a role the AOS must define)?

**Knowledge & standards** 8. Should the **Knowledge Engine be distilled from the existing `/docs`** corpus, or authored fresh? 9. Will the organization **adopt an ADR practice** and a **bilingual domain glossary**, and are they in scope for the AOS build? 10. **Single-source-of-truth policy:** for permissions/types/validators currently duplicated across 2–3 places, does the Founder want one hand-authored source, a generated pipeline, or status quo for now?

**Culture, quality & scale** 11. **Testing posture:** will the organization mandate automated tests as part of the definition-of-done, and at what layers/coverage? (Today: none.) 12. Are there **hard non-functional constraints** the Constitution must encode — timeline to multi-tenancy, uptime, and security/compliance for **minors' PII and (future) payment data**? 13. How should the organization handle the **large body of uncommitted work** (Classroom→Scheduling modules + 8 migrations) — is versioning it part of foundation work? 14. **Language & i18n policy:** extract user-facing Vietnamese strings into a message catalog, or preserve inline for now?

---

_End of FOUNDER_ORGANIZATION_BLUEPRINT.md — AOS Sprint 1 deliverable._
_No source code and no existing documentation were modified. `docs/AI/PROJECT_ANALYSIS.md` was read, not changed._
_This document structures decisions; it does not make them. Awaiting Founder / System Architect review. Not proceeding to Sprint 2._
