# ORGANIZATION OPERATING MODEL

> **AOS (AI Organization System) — Sprint 2 deliverable.**
> Purpose: define **how the organization operates** — how it decides, how knowledge flows,
> how work flows, and how humans and AI collaborate to turn ideas into production software.
>
> This document describes the **operating model of the company**, not the behavior of the
> software. It is written to be handed to _every new engineer and every future AI before
> they join_, so that anyone — human or machine — can understand how work happens here
> without being told verbally.
>
> **This document does not create rules; it structures how rules are made and followed.**
> No Constitution, Policy, Standard, Command, Agent, Workflow, Memory, or Template is created
> here. Nothing is decided here that is reserved to the Founder / System Architect.
>
> **Evidentiary discipline (unchanged from Sprint 1).** Every substantive claim is tagged:
>
> - **[Observed]** — directly present in the repository, `/docs`, or the two approved AOS documents.
> - **[Inferred]** — reasoned from observed evidence; a defensible reading, not a fact.
> - **[Suggested]** — a recommendation from the Lead Implementation Engineer; requires approval.
> - **[Assumption]** — a provisional gap-fill; must be confirmed.
>
> Inputs (read, not modified): `docs/AI/PROJECT_ANALYSIS.md`, `docs/AI/FOUNDER_ORGANIZATION_BLUEPRINT.md`,
> and the `/docs` corpus + `CLAUDE.md` they rest on.
>
> Authored by: Lead Implementation Engineer. Awaiting Founder / System Architect review.
> Not proceeding to Sprint 3.

---

## 1. Organization Structure

The organization is a layered chain of authority and execution. **[Observed]** The chain was ratified in the Blueprint (§10) as: Founder → System Architect → Organization Rules → AI Runtime → Repository → Knowledge. Below, each layer is given its operating responsibility.

| Layer                            | What it is                                                                                                                    | Core responsibility                                                                                                                                                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Founder**                      | The business owner and final authority. **[Observed]**                                                                        | Owns _why the company exists_, product scope, and final approval. Sets business intent (BUSINESS.md is highest doc precedence). Decides what is worth building.                                                                                                                    |
| **System Architect**             | The technical authority for structure and rules. **[Observed]**                                                               | Owns architecture and organization rules. Approves designs before implementation. _"Never redesign the architecture without approval"_ means this role holds that approval. **[Assumption]** May currently be the Founder or a single senior person — unconfirmed (Blueprint OQ7). |
| **Lead Implementation Engineer** | The execution role. **[Observed]** Currently played by the AI.                                                                | Implements, reviews, improves, refactors _within_ the rules. Plans work, asks clarifying questions, surfaces assumptions. Does **not** decide architecture or business.                                                                                                            |
| **AI Runtime**                   | The system that runs the AI in the Lead Engineer role. **[Inferred]**                                                         | Executes work against the repository under the organization's rules; produces code, docs, plans, and reviews that re-enter the repository for approval. Bound by what is written.                                                                                                  |
| **Repository**                   | The monorepo. **[Observed]**                                                                                                  | The single contract surface between all layers: rules, code, and knowledge live here and are versioned together. Nothing is authoritative until it is in the repository.                                                                                                           |
| **Knowledge**                    | The captured reasoning of the organization. **[Observed]** `/docs`, schema rationale, ROADMAP history, and the AOS documents. | Preserves _why_ decisions were made so they survive the people/sessions that made them. Feeds future decisions.                                                                                                                                                                    |
| **Future Team**                  | Additional humans and AI agents not yet present. **[Assumption / Inferred]**                                                  | Onboards through this operating model and the Knowledge layer. **[Inferred]** The Blueprint's reusable-spine and documentation-first strategy exist precisely so new members compose from known patterns rather than reinvent.                                                     |

**[Inferred] Structural reading:** this is a small, top-heavy organization where a large share of _execution_ is delegated to AI while all _judgment_ (business, architecture) is retained by humans. The structure is designed so that adding capacity (more AI, more engineers) does not require redistributing authority — it only adds execution throughput under the same rules.

> **[Suggested]** The "System Architect" and "Lead Implementation Engineer" are **roles, not necessarily people**. The operating model should be written to survive one person holding several roles today and different people/AI holding them later. This blueprint treats them as roles throughout.

---

## 2. Authority Model

_Who owns what, and who holds final approval. Ownership = accountable decision-maker, not sole worker._

| Domain                                           | Owner (accountable)                                  | Contributors                     | Basis                                                                                                                                                          |
| ------------------------------------------------ | ---------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Business** (why, scope, value)                 | Founder                                              | —                                | **[Observed]** BUSINESS.md is highest precedence; _"Every important decision requires Founder/System Architect approval."_                                     |
| **Product** (what to build, priority)            | Founder                                              | System Architect (feasibility)   | **[Observed]** PRD/ROADMAP express product intent under the Founder's mission.                                                                                 |
| **Architecture** (structure, patterns, rules)    | System Architect                                     | Lead Engineer (proposals)        | **[Observed]** _"You do NOT decide the architecture… Never redesign the architecture without approval."_                                                       |
| **Implementation** (code that follows the rules) | Lead Implementation Engineer (AI)                    | —                                | **[Observed]** The AI's mandate: implement/review/improve/refactor.                                                                                            |
| **Knowledge** (docs, rationale, decisions)       | System Architect (custody)                           | Lead Engineer (authoring/upkeep) | **[Inferred]** Knowledge is subordinate to architecture/business; the AI maintains it (Blueprint §9) but does not own its authority.                           |
| **Documentation** (the written rules)            | System Architect                                     | Lead Engineer (drafts)           | **[Observed]** Docs encode architecture/organization rules; changing them is a rule-change, reserved above the execution layer.                                |
| **Review** (does work meet the bar)              | System Architect (final), Lead Engineer (first-pass) | —                                | **[Observed]** Quality gates exist (`CLAUDE.md`); **[Suggested]** who signs off is not yet formalized (see §11).                                               |
| **Release** (what ships, when)                   | Founder / System Architect                           | Lead Engineer (prepares)         | **[Inferred]** Release = production impact, an "important decision" → human approval. **[Observed gap]** No documented release process (PROJECT_ANALYSIS §14). |

**Final approval [Observed]:** rests with the **Founder** for business/product/scope and the **System Architect** for architecture/rules. The implementation layer (AI) never holds final approval on anything reserved above it.

> **[Suggested]** Two ownership areas are under-defined today and should be ratified: **who signs off on a review** and **who authorizes a release**. This blueprint records them as open (§16), not resolved.

---

## 3. Decision Lifecycle

How an idea becomes an approved decision. **[Inferred]** stage model, built from observed rules (doc precedence, "verify don't guess," "approval required," "read docs before coding"). Each stage names its owner and its exit condition.

```
Idea → Analysis → Discussion → Architecture → Approval → Planning → Implementation → Review → Knowledge → Release
```

1. **Idea.** _Owner: anyone (Founder, Architect, Engineer/AI)._ A problem or opportunity is raised. **[Observed]** Framed against the business test — does it save time, reduce mistakes, increase revenue, improve satisfaction? _Exit:_ the idea is stated in business terms.
2. **Analysis.** _Owner: Lead Engineer (AI)._ Gather evidence from the repository and docs; identify affected modules, constraints, prior decisions. **[Observed]** _"Review similar existing modules before creating new ones"_; _"Never guess. Always verify."_ _Exit:_ an evidence-based understanding, with assumptions marked. (Sprint 0's PROJECT_ANALYSIS is the archetype.)
3. **Discussion.** _Owner: Founder/Architect + Engineer._ Clarify intent. **[Observed]** _"Ask ONE clarifying question if requirements are unclear."_ _Exit:_ ambiguity resolved or explicitly deferred.
4. **Architecture.** _Owner: System Architect._ Decide structure/pattern/data model — or confirm an existing pattern applies. **[Observed]** _"Follow existing project patterns before introducing new ones."_ _Exit:_ a design consistent with existing architecture.
5. **Approval.** _Owner: Founder/Architect._ **[Observed]** The gate: _"Every important decision requires Founder/System Architect approval."_ _Exit:_ explicit go/no-go. The AI never self-approves an architectural or business decision.
6. **Planning.** _Owner: Lead Engineer._ Define "done," break into tasks. **[Observed]** _"Define what 'done' means before writing code."_ _Exit:_ a concrete, reviewable plan.
7. **Implementation.** _Owner: Lead Engineer._ Build within the rules; change only what is necessary. **[Observed]** _"Change only what is necessary. Do not refactor unrelated modules."_ _Exit:_ code meeting the standards.
8. **Review.** _Owner: Architect (final) / Engineer (first-pass)._ Check against conventions + quality gates. **[Observed]** build/lint/type-check pass; existing functionality intact. _Exit:_ approved change.
9. **Knowledge.** _Owner: Lead Engineer._ Capture the decision and its rationale. **[Observed]** ROADMAP records dated decisions; **[Suggested]** formalize as decision records (§4, PROJECT_ANALYSIS §14). _Exit:_ rationale is written, not just remembered.
10. **Release.** _Owner: Founder/Architect._ Ship to production. **[Inferred]** production impact → human authorization. _Exit:_ shipped, with state updated.

> **[Suggested]** For _small, in-pattern, low-risk_ changes, stages 3–5 may collapse into a single lightweight confirmation — the full lifecycle is for _important_ decisions. Right-sizing the ceremony to the risk is a recommendation for the Architect to ratify.

---

## 4. Knowledge Lifecycle

How knowledge is created and reused. **[Observed]** the organization already treats the repository as the source of truth and captures rationale (Blueprint §8); this formalizes the loop.

```
Decision → Documentation → Implementation → Review → Lesson → Knowledge Base → Future Decisions
```

- **Decision → Documentation.** **[Observed]** A decision is written down _before/with_ the code (e.g., the scheduling-engine rationale in BUSINESS/DATABASE precedes and explains the modules). Documentation-first is an existing habit, not a new rule.
- **Documentation → Implementation.** **[Observed]** _"Before implementing any feature, read the relevant documentation in /docs."_ Code is produced _from_ the written intent, not the reverse.
- **Implementation → Review.** **[Observed]** Work is checked against the written standards and quality gates.
- **Review → Lesson.** **[Inferred]** What the review surfaces (a missed convention, a drift, a better pattern) is a lesson. **[Observed]** The repo already records lessons as dated notes (e.g., "identity-audit debt recorded 2026-07-02," "Scheduling Engine v1 2026-07-05").
- **Lesson → Knowledge Base.** **[Suggested]** Lessons and deliberate decisions should be distilled into durable knowledge (decision records, glossary) rather than left as scattered comments — closing the gaps PROJECT_ANALYSIS §14–15 identified. _(The Knowledge Engine itself is a later sprint; this only describes the flow.)_
- **Knowledge Base → Future Decisions.** **[Observed]** The precedence order exists so future disputes are resolved by _reference_ to written knowledge, not by memory. Knowledge closes the loop by informing the next Idea/Analysis.

**[Inferred] Governing principle of this lifecycle:** _knowledge is a byproduct that must be captured at the moment of decision and review, because its value decays as context is lost._ The organization's real asset is not the code but the recorded reasoning behind it.

---

## 5. Development Lifecycle

The engineering execution loop for a single unit of work. **[Inferred]** model assembled from observed engineering rules (CONVENTIONS, `CLAUDE.md`, CACHE, DATABASE).

```
Requirement → Analysis → Plan → Task → Implementation → Review → Refactor → Documentation → Done
```

- **Requirement.** **[Observed]** Stated with a business justification and clear acceptance ("define what 'done' means").
- **Analysis.** **[Observed]** Read the relevant `/docs`; review similar modules; identify reusable architecture and shared components before writing anything.
- **Plan.** **[Observed]** Decide the layered shape up front — backend `Controller → Service → Repository → Prisma`, frontend `Feature → API → Hooks → Components → Pages` — and where business logic lives (services only).
- **Task.** **[Inferred]** Work is decomposed into small, reviewable units; **[Observed]** _"Change only what is necessary."_
- **Implementation.** **[Observed]** Follow conventions exactly (naming, enums, soft-delete, audit on critical actions, validation on both ends, no hardcoded secrets, no `console.log`). Reuse before building.
- **Review.** **[Observed]** The pre-completion gate: build passes, lint passes, type-check passes, permissions verified, loading/empty/error states handled, existing functionality intact.
- **Refactor.** **[Observed]** Disciplined and _local_: _"Do not refactor unrelated modules"_; _"Avoid unnecessary abstractions."_ Improve the code just touched, not the code nearby.
- **Documentation.** **[Observed/Suggested]** Update the affected docs and rationale so knowledge stays current with code (§4). **[Observed gap]** This step is under-practiced (thin BACKEND/FRONTEND docs, stale Swagger tags) — a discipline to reinforce, not invent.
- **Done.** **[Observed]** Meets the standards _and_ the definition of done agreed at Requirement. **[Suggested]** For this organization, "Done" should eventually include automated tests — today it cannot, because none exist (PROJECT_ANALYSIS §18); flagged, not assumed.

---

## 6. Human + AI Collaboration

Who does what, and — as importantly — who _cannot_ do what. **[Observed]** roles from `CLAUDE.md` and the Blueprint; boundaries from the "approval required" and "never redesign" rules.

| Role                                                 | Does                                                                                                                                                     | Cannot do                                                                                                                                                                                                                        |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Founder**                                          | Sets mission, product scope, priorities; gives final business approval; authorizes release. **[Observed]**                                               | Is not expected to implement; **[Inferred]** does not need to (execution is delegated).                                                                                                                                          |
| **System Architect**                                 | Owns architecture and rules; approves designs; adjudicates doc conflicts; custodian of knowledge. **[Observed]**                                         | Does not override the Founder's business intent (BUSINESS is top precedence). **[Observed]**                                                                                                                                     |
| **Lead Implementation Engineer (Human, if present)** | Plans, implements, reviews, refactors within rules; mentors/checks AI output. **[Inferred]**                                                             | Does not decide architecture or business without approval. **[Observed]**                                                                                                                                                        |
| **Reviewer**                                         | Verifies work against conventions and quality gates; first-pass by Engineer, final by Architect. **[Observed/Suggested]**                                | Does not approve architectural/business changes — that is escalation, not review. **[Inferred]**                                                                                                                                 |
| **AI Runtime (Lead Engineer role today)**            | Analyzes with evidence; plans; implements in-pattern; reviews; maintains documentation/knowledge; asks when unsure; surfaces assumptions. **[Observed]** | Never decides architecture or business; never self-approves; never redesigns; never guesses in place of verifying; **[Suggested]** never changes schema/dependencies/public API without approval (boundary to be ratified — §7). |

**[Inferred] Collaboration principle:** **humans hold judgment; AI holds throughput.** The two meet at _approval gates_ (decision lifecycle §3) and at the _repository_ (the shared contract). AI amplifies the organization's ability to build and maintain a convention-heavy, documentation-first system; it does not shift where authority sits.

> **[Suggested]** Define the **escalation trigger** explicitly: when the AI encounters a decision it is not authorized to make (architecture, business, ambiguous scope, or anything requiring an assumption), it must _stop and ask_ rather than proceed. This blueprint models that behavior; it should be ratified as the operating norm.

---

## 7. AI Governance

AI authority boundaries. **[Observed]** derived strictly from `CLAUDE.md` and the two approved AOS documents; **[Suggested]** items are recommendations to fill gaps the prior sprints already flagged (Blueprint OQ5). Nothing here is invented as a company decision.

**AI MAY** _(permitted within the rules)_ —

- Analyze the repository and docs and produce evidence-based findings. **[Observed]**
- Propose plans, designs, and refactors for approval. **[Observed]**
- Implement features that follow existing patterns and standards. **[Observed]**
- Author and update documentation and captured rationale. **[Inferred]**

**AI SHOULD** _(expected default behavior)_ —

- Read the relevant `/docs` before implementing. **[Observed]**
- Reuse existing architecture and shared components before creating new ones. **[Observed]**
- Ask **one** clarifying question when requirements are unclear. **[Observed]**
- Mark assumptions explicitly and separate Observed / Inferred / Suggested. **[Observed]** (the method of these AOS docs).
- Keep changes minimal and local. **[Observed]**

**AI MUST** _(non-negotiable within its mandate)_ —

- Follow the documentation precedence order and existing conventions. **[Observed]**
- Validate inputs, handle loading/empty/error states, enforce permissions server-side. **[Observed]**
- Pass the quality gates (build, lint, type-check; existing functionality intact) before calling work done. **[Observed]**
- Preserve business history (soft delete, audit on critical actions). **[Observed]**
- Surface — not bury — anything requiring a decision above its authority. **[Suggested]**

**AI MUST NOT** _(prohibited actions)_ —

- Redesign or change the architecture without approval. **[Observed]**
- Make business or product-scope decisions. **[Observed]**
- Refactor unrelated modules or introduce unnecessary abstractions. **[Observed]**
- Log secrets/passwords/tokens; expose internal errors. **[Observed]**
- **[Suggested]** Change the database schema, add/remove dependencies, or alter public API contracts without explicit approval _(pending ratification of AI authority boundaries)_.

**AI CAN NEVER** _(absolute, identity-level limits)_ —

- Replace the Founder or assume final approval. **[Observed]** (_"Never replace Founder. Never replace business decisions."_)
- Invent facts, history, or company decisions; guess in place of verifying. **[Observed]**
- Be the sole and final authority on anything reserved to a human layer. **[Observed]**

> **[Suggested]** The **MUST NOT / MAY boundary around schema, dependencies, and public API** is the single most important undefined line for AI governance. Until ratified, the AI should treat these as MUST-NOT-without-approval.

---

## 8. Human Governance

The human authority map, stated plainly for onboarding.

- **Who makes business decisions?** **[Observed]** The **Founder**. Business intent (BUSINESS.md) sits above all other documents; scope and value are the Founder's call.
- **Who makes architecture decisions?** **[Observed]** The **System Architect**. Architecture and rules may not be changed without this role's approval. **[Assumption]** currently possibly the Founder or one senior person (unconfirmed — §16).
- **Who approves implementation?** **[Observed/Suggested]** First-pass verification against standards by the Lead Engineer/Reviewer; **[Suggested]** final sign-off by the System Architect. The exact sign-off authority is not yet formalized (§11, §16).
- **Who owns knowledge?** **[Inferred]** The **System Architect** holds custody of the rules and knowledge (they are architecture-adjacent); the **Lead Engineer** authors and maintains it. Ownership of _authority_ over knowledge stays human; the _labor_ of upkeep is delegable to AI.
- **Who authorizes release?** **[Inferred/Suggested]** Founder/Architect, as a production-impact decision — process undefined today (§16).

**[Inferred] Human-governance principle:** humans govern by _setting and approving_, not by _doing_. Their leverage is judgment applied at gates; the operating model concentrates human attention on the few decisions that are expensive to reverse (business, architecture, release) and delegates the rest.

---

## 9. Knowledge Hierarchy

The precedence order for _authority over what is true and binding_ in the organization. **[Observed]** the top of this hierarchy (documentation precedence) exists in `CLAUDE.md`; **[Inferred]** the full stack extends that logic to the AOS layers being built.

```
Organization (mission, Founder intent)
   ↓
Constitution            ← (not yet created; future top rule layer)
   ↓
Policies
   ↓
Standards               ← (CONVENTIONS, DATABASE, API, CACHE, QUERY_KEYS today)
   ↓
Knowledge               ← (rationale, decision records, glossary)
   ↓
Current State           ← (ROADMAP status, what is/ isn't built, PROJECT_ANALYSIS)
   ↓
Tasks
   ↓
Source Code
```

**Conflict resolution [Observed + Inferred]:**

- **Higher layer wins.** **[Observed]** `CLAUDE.md` already fixes this for documents: _"If documents conflict, follow this order: BUSINESS → PRD → ROADMAP → CONVENTIONS → Technical Documents."_ The general rule extends it: a Policy overrides a Standard; the Constitution (once it exists) overrides Policies; Founder/Organization intent overrides all.
- **Source code never overrides written rules.** **[Observed/Inferred]** When code contradicts the standards (e.g., the drifted permission sources, inconsistent repository layer — PROJECT_ANALYSIS §11/§18), the **code is the defect**, not a redefinition of the rule. Code is the lowest layer of authority even though it is the product.
- **Current State is descriptive, not prescriptive.** **[Inferred]** "What is built" (ROADMAP status, analysis) records reality; it does not authorize deviation from higher rules.
- **Unresolved conflicts escalate.** **[Suggested]** Where two layers genuinely conflict and precedence is unclear, the Lead Engineer must escalate to the System Architect rather than choose — consistent with "verify, don't guess."

> **[Observed caveat]** The **Constitution, Policies, and formal Knowledge layers do not exist yet** — they are the forward-looking targets of the AOS. This hierarchy names the intended shape so later sprints slot into it; it does not create those layers.

---

## 10. Documentation Hierarchy

The priority order for _documentation content_ (distinct from §9's authority stack — this is about which document to read/trust first).

```
Organization  →  Business  →  Architecture  →  Implementation  →  State
```

- **Organization** — this operating model and the Blueprint: _how the company works_. Read first because it frames how to interpret everything else. **[Suggested]** (new AOS layer).
- **Business** — BUSINESS.md, PRD.md: _why and what_. **[Observed]** Highest content precedence in `CLAUDE.md`.
- **Architecture** — CONVENTIONS, BACKEND, FRONTEND, DATABASE, API, CACHE, QUERY_KEYS: _how it must be built_. **[Observed]**
- **Implementation** — code-level docs, DTOs, Swagger, inline rationale: _how it is built_. **[Observed]**
- **State** — ROADMAP status, PROJECT_ANALYSIS: _where we are now_. **[Observed]**

**Why this order [Inferred]:**

- **Purpose before mechanism.** You cannot correctly build or judge a feature without first knowing _why it exists_ (business) — hence business outranks architecture, which outranks implementation.
- **Intent is more stable than state.** Business intent changes slowly; implementation and state change constantly. Anchoring on the stable layers prevents chasing a moving target.
- **It mirrors the decision lifecycle.** Ideas are justified by business, shaped by architecture, realized in implementation, and recorded as state — reading in that order reconstructs the reasoning.
- **[Observed] It is already how the codebase resolves conflicts** — this section simply makes the existing precedence explicit and extends it upward to the Organization layer.

---

## 11. Review Model

The kinds of review the organization runs, what each protects, and who owns it. **[Observed]** the quality gates and RBAC/security checks exist; **[Suggested]** the _structuring into named review types with owners_ is a recommendation, since no formal review process is documented today (PROJECT_ANALYSIS §14/§16).

| Review                  | Protects                   | Checks (evidence-based)                                                                                                                                                         | Owner                                   |
| ----------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Business Review**     | Business value             | Does it pass the six-question test? Right priority vs. ROADMAP? **[Observed]**                                                                                                  | Founder                                 |
| **Architecture Review** | Structural integrity       | Follows layered/clean architecture and existing patterns? No unapproved redesign? Reusable spines respected? **[Observed]**                                                     | System Architect                        |
| **Engineering Review**  | Code quality & consistency | Naming, layering, reuse, soft-delete, audit, validation both ends, no secrets/`console.log`. **[Observed]**                                                                     | Lead Engineer (first-pass)              |
| **AI Review**           | Trust in AI output         | Evidence cited? Assumptions marked? In-pattern? No overreach beyond authority? No invented facts? **[Suggested]**                                                               | Human (Architect/Engineer) over AI work |
| **Quality Review**      | Release safety             | Build/lint/type-check pass; loading/empty/error states; permissions verified; existing functionality intact. **[Observed]** — **[Observed gap]** no automated tests to gate on. | Lead Engineer                           |
| **Release Review**      | Production stability       | Migrations reviewed/tested; state updated; rollback considered. **[Observed]** migration discipline; **[Observed gap]** no documented release process.                          | Founder / Architect                     |

**[Inferred] Review principle:** reviews are layered like authority — **business and architecture reviews are gates _before_ significant work; engineering, AI, and quality reviews are gates _on_ the work; release review is the gate _to production_.** Each review answers to the owner of the domain it protects.

> **[Suggested]** Because there are **no automated tests**, the Quality and AI reviews currently carry the entire regression-safety burden manually. This is fragile for a convention-heavy system with AI-generated change (Blueprint §7, §11). Establishing a test-based Quality gate is a recommendation for the Founder/Architect, recorded — not assumed.

---

## 12. Organization Principles

The operating principles, each tied to evidence. These are the compressed "how we work" that a new engineer or AI should internalize first.

- **Default to Documentation.** **[Observed]** Read docs before coding; write the rule down, don't hold it in conversation. (`CLAUDE.md`, precedence order.)
- **Business before Technology.** **[Observed]** Business Value is first in every priority order; features without value are not built.
- **Knowledge before Memory.** **[Observed/Inferred]** Rationale is captured so it outlives sessions and people; the repo, not recall, is authoritative.
- **Repository is Source of Truth.** **[Observed]** Rules, code, and knowledge are versioned together; nothing is binding until it is committed.
- **Evidence before Opinion.** **[Observed]** _"Never guess. Always verify."_ Decisions and analyses cite the docs/code that justify them; assumptions are labeled.
- **Consistency over Cleverness.** **[Observed]** Follow existing patterns before inventing; _"Maintainability over Cleverness"_ (Blueprint §4).
- **Maintainability over Speed.** **[Observed]** Stability > new features; minimal, local change; long-term maintainability over short-term convenience.
- **Automation after Understanding.** **[Observed]** _"Never optimize prematurely… Measure first."_ **[Inferred]** the organization automates what it already understands and has stabilized — it does not automate to avoid understanding. (This is why automation today is limited to formatting/static checks; deeper automation is earned.)

---

## 13. Organization Maturity Model

A ladder describing how the organization itself matures. **[Inferred]** model, aligned to the Blueprint's value-gated expansion strategy and the ROADMAP's own progression. Current position is assessed from evidence.

| Level | Name                | Definition                                                                                                                                                                                                     | Evidence / position                                                                                                                                                                     |
| ----- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **Project**         | A codebase built to work; ad-hoc process; knowledge in heads.                                                                                                                                                  | **[Observed]** Passed — the repo is well past ad-hoc.                                                                                                                                   |
| **2** | **Product**         | A coherent product with conventions, docs, and a roadmap; repeatable modules.                                                                                                                                  | **[Observed] Current level.** Strong `/docs`, uniform patterns, ROADMAP, quality gates — but manual process, no tests, some drift.                                                      |
| **3** | **Platform**        | Reusable spines and shared packages let new capabilities compose rather than reinvent; still single-organization.                                                                                              | **[Inferred] Partially entered.** Reusable identity-linking and planning/execution spines, `packages/*`, module template exist — but reuse is not yet enforced (permission/type drift). |
| **4** | **Organization**    | Explicit operating model, authority, review, and knowledge governance; multiple humans/roles coordinate predictably; automation of quality.                                                                    | **[Inferred] Target of the AOS Sprints 1–3.** This document and the Blueprint are the first artifacts of Level 4.                                                                       |
| **5** | **AI Organization** | AI is a governed, first-class participant in decision-execution-knowledge loops, operating safely within a codified constitution and standards; throughput scales with AI + humans without diluting authority. | **[Inferred] The AOS end-state.** Requires the Constitution, Knowledge/Workflow engines, and test-backed governance still to be built.                                                  |

**[Inferred] Reading:** the organization sits at **Level 2 → 3**, and the AOS initiative is the deliberate climb to **Levels 4–5**. Maturity here means _governance and knowledge maturity_, not just product completeness — a very complete product can still be a Level 2 organization if its process lives in one person's head.

> **[Suggested]** Each level should have explicit _exit criteria_ before claiming it (e.g., Level 4 requires ratified authority + review model + a decision-record practice; Level 5 requires codified AI governance + a regression safety net). Defining these criteria is a Founder/Architect decision, flagged for later.

---

## 14. Scalability Model

How the organization grows along five axes, and what each axis stresses. **[Inferred]** from the Blueprint's expansion strategy and PROJECT_ANALYSIS's scaling risks; **[Observed]** where the repo shows the enabling or limiting factor.

- **More Engineers.** **[Observed enabler]** Documentation-first + uniform module template make onboarding a matter of reading the corpus and copying the pattern. **[Observed limiter]** Thin BACKEND/FRONTEND docs, no tests, and inconsistent repository usage raise the cost of a new engineer being _safe_ quickly. _Stress:_ knowledge completeness and safety nets.
- **More AI.** **[Observed enabler]** The AI-oriented rules and this governance model let additional AI runtimes operate under the same constraints. **[Inferred limiter]** Without codified AI governance and tests, more AI multiplies both throughput _and_ the risk of silent, in-convention regressions. _Stress:_ AI governance and automated verification.
- **More Products.** **[Observed enabler]** Reusable spines (identity-linking, planning/execution, RBAC, audit) and shared `packages/*` let new products compose. **[Observed limiter]** Single-source-of-truth drift (permissions/types) shows reuse is not yet drift-proof. _Stress:_ discipline of the reusable platform.
- **More Customers.** **[Observed limiter]** Single-tenant foundations (no `organizationId`), global-scope unique constraints, and stateful runtime (in-memory OAuth, unused Redis) cap horizontal and multi-tenant scale until addressed (ROADMAP Phase 7). _Stress:_ architecture's tenancy and statelessness — a human-owned decision, not an execution task.
- **More Knowledge.** **[Observed enabler]** The repo already accumulates dated decisions and rationale. **[Suggested limiter]** Without an ADR practice, glossary, and a maintained knowledge structure, more knowledge becomes harder to find and trust, not easier. _Stress:_ knowledge organization and upkeep.

**[Inferred] Scalability principle:** the organization scales cleanly on the axes it has _invested in governing_ (docs, patterns, roles) and scales poorly on the axes it has _deferred_ (tenancy, tests, single-source-of-truth). Growth exposes the deferred decisions first — so the AOS's job is to convert deferrals into governed choices before the growth arrives.

---

## 15. Risks

Operating-model risks. Distinct from PROJECT_ANALYSIS §18–20 (technical) and Blueprint §11 (organizational); the focus here is on _how the model itself can fail_.

### Organizational risks

- **[Observed] Roles concentrated in too few people.** If Founder, Architect, and Reviewer are one person, the approval gates that give the model its integrity become self-approval, weakening the very controls the model relies on. **[Assumption]** small team.
- **[Observed] Undefined gates (review sign-off, release, escalation trigger).** A lifecycle with unspecified owners at key gates degrades into ad-hoc decisions — the model exists on paper but not in practice.

### Knowledge risks

- **[Observed] Rule authority undermined by drift.** When code contradicts standards (permission sources, repository inconsistency), and the discrepancy is tolerated, the organization implicitly teaches that written rules are optional — corroding §9's hierarchy.
- **[Observed/Suggested] No decision-record practice.** Deliberate, easy-to-reverse decisions are undocumented; a future contributor (human or AI) can "correct" an intentional design, and the model has no record to prevent it.

### Governance risks

- **[Suggested/Inferred] Ambiguous AI authority boundary.** Until the schema/dependency/public-API line is ratified (§7), governance depends on the AI's restraint rather than an explicit rule — fragile and non-auditable.
- **[Inferred] Approval fatigue vs. approval bypass.** If every trivial change requires the full lifecycle, humans will bypass it; if nothing does, the gates are meaningless. The model needs risk-tiering (flagged §3) to stay both safe and usable.

### AI risks

- **[Inferred] Silent regression at scale.** Convention-heavy system + AI throughput + no automated tests = defects that pass every _manual_ gate. The more the organization leans on AI, the sharper this risk.
- **[Observed] Evidence-free content accretion.** If the "surface assumptions, don't invent" discipline is not enforced, plausible-but-unverified content enters the knowledge base and compounds.

### Scaling risks

- **[Observed] Deferred architecture decisions block growth abruptly.** Tenancy and statelessness are not incremental fixes; hitting them without preparation stalls customer growth (ROADMAP Phase 7 breaking migration).
- **[Inferred] Process debt scales worse than code debt.** Manual gates and hand-scaffolded modules impose a throughput ceiling that tightens as engineers/AI/products multiply.

---

## 16. Open Questions

Inputs for Sprint 3. Each is reserved to the Founder/System Architect; the AOS should not proceed on assumption where the answer changes the operating model. _(Questions already raised in Blueprint §12 are referenced, not repeated, unless the operating model sharpens them.)_

**Roles & authority**

1. Who holds the **System Architect** role today, and are Founder/Architect/Reviewer distinct people or combined? (Determines whether approval gates are real or self-approval.) _(Sharpens Blueprint OQ7.)_
2. **Who signs off a review**, per review type (§11), and **who authorizes a release** (§2)? No formal owners exist today.
3. What is the exact **escalation trigger** from AI to human — enumerated (architecture, business, ambiguous scope, any required assumption, schema/dependency/API), or judgment-based? (§6)

**Decision & work flow** 4. Should the **decision lifecycle be risk-tiered** (a lightweight path for small, in-pattern changes vs. the full path for important decisions)? Where is the line? (§3) 5. What is the organization's **release process and rollback expectation** (§2, §11)? None is documented.

**Governance** 6. What are the ratified **AI authority boundaries** for schema, dependencies, and public API contracts? Until answered, the AI treats these as forbidden-without-approval. (§7; Blueprint OQ5.) 7. How will the future **Constitution relate to `CLAUDE.md` and `/docs`** — supersede, incorporate, or sit above — and what resolves conflicts between them? (§9; Blueprint OQ4.)

**Knowledge** 8. Will the organization **adopt a decision-record (ADR) practice and a bilingual glossary** as governed parts of the Knowledge layer? (§4, §9; Blueprint OQ9.) 9. Is the **single-source-of-truth policy** for permissions/types/validators to be enforced (one source or generated), and does resolving current drift belong to foundation work? (§13, §14; Blueprint OQ10.)

**Culture, quality & maturity** 10. Will the **definition of done include automated tests**, and does the organization accept test-based Quality/AI review gates? (§5, §11, §15 — the model's single largest safety gap.) 11. What are the **exit criteria for each maturity level** (§13), so the organization can claim Level 4/5 by evidence rather than assertion? 12. What **non-functional constraints** (multi-tenancy timeline, statelessness, uptime, minors'-PII & payment compliance) must the operating model treat as hard, human-owned decisions before the corresponding growth? (§14; Blueprint OQ12.)

**Foundational hygiene** 13. How is the **large body of uncommitted work** (Classroom→Scheduling + 8 migrations) to be handled under this model — is versioning it a precondition to further work? (Blueprint OQ13; PROJECT_ANALYSIS §18.)

---

_End of ORGANIZATION_OPERATING_MODEL.md — AOS Sprint 2 deliverable._
_No source code and no existing documentation were modified. The two approved AOS documents were read, not changed._
_This document structures how the organization operates and how decisions are made; it makes none of them. Awaiting Founder / System Architect review. Not proceeding to Sprint 3._
