# RFC-000 — AOS Vision

| Field             | Value                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **RFC**           | 000                                                                                                                                  |
| **Title**         | AOS Vision — The AI Organization System                                                                                              |
| **Status**        | Draft — awaiting System Architect review                                                                                             |
| **Type**          | Vision (non-technical; North Star)                                                                                                   |
| **Author**        | Lead Implementation Engineer                                                                                                         |
| **Supersedes**    | —                                                                                                                                    |
| **Superseded by** | —                                                                                                                                    |
| **Depends on**    | `docs/AI/PROJECT_ANALYSIS.md`, `docs/AI/FOUNDER_ORGANIZATION_BLUEPRINT.md`, `docs/AI/ORGANIZATION_OPERATING_MODEL.md` (all approved) |

> **What this document is.** RFC-000 is the vision of the **AI Organization System (AOS)**. It defines
> _why AOS exists, what it is, what it is not, who it serves, and how it evolves_. It is the North
> Star every future RFC must align to. It is **not** a technical specification: it defines no
> implementation, workflow, command, agent, kernel, memory, or runtime.
>
> **What this document is not.** It does not invent company strategy. It synthesizes the three
> approved AOS documents. Where those documents leave something unstated, this RFC marks the gap
> rather than filling it.
>
> **Evidentiary discipline (carried from Sprints 0–2, unchanged).** Every substantive statement is tagged:
>
> - **[Observed]** — directly present in the repository, `/docs`, or the three approved AOS documents.
> - **[Inferred]** — reasoned from observed evidence; a defensible reading, not a fact.
> - **[Suggested]** — a recommendation from the Lead Implementation Engineer; requires approval.
> - **[Assumption]** — a provisional gap-fill; must be confirmed.
>
> Reserved decisions (business, architecture, scope, release) belong to the Founder / System Architect.
> This RFC proposes a vision for ratification; it decides nothing.

---

## 1. Purpose

**[Inferred]** AOS exists to make an **AI-augmented software organization operate reliably** — to turn the organization's mission, rules, and knowledge into something an AI can execute against safely, and a human can govern with confidence.

The purpose is grounded in three observed facts:

- **[Observed]** The organization has already chosen to make AI a first-class contributor: `CLAUDE.md` and every technical doc carry explicit "AI Development Rules"; the AI is designated the **Lead Implementation Engineer** (implement / review / improve / refactor within the rules).
- **[Observed]** The organization is **documentation-first and knowledge-driven**: a ten-document `/docs` corpus with a fixed precedence order governs all work; rationale is captured, not just instructions (Blueprint §3, §8).
- **[Observed]** Yet the AI-governance layer is thin — only `CLAUDE.md` plus a minimal `.claude/settings.json` exist; there is no Constitution, Knowledge Engine, or codified operating model beyond the AOS documents now being written (PROJECT_ANALYSIS §13).

**[Inferred]** AOS's purpose is to close that gap: to give the organization a **governed system in which AI participates** — bound by written rules, grounded in the repository, and always subordinate to human authority.

> **[Suggested]** State AOS's purpose in one sentence for ratification: _AOS is the system that lets an organization safely delegate software execution to AI while keeping judgment, authority, and knowledge with humans._

---

## 2. Problem Statement

The problems AOS solves are the operating-level problems the prior sprints surfaced — not the product's business problems, but the _organization's_ problems in building software with AI.

- **[Observed] Knowledge lives in prose and heads, not in a governed system.** Deep, non-obvious rules (partial unique indexes, session-number permanence, JWT-embedded permissions) are captured only as scattered comments; no decision records, no glossary (PROJECT_ANALYSIS §14–15). New contributors — human or AI — cannot reliably consume it.
- **[Observed] Rules exist but drift from practice.** The documented standards are strong, yet code contradicts them in places (three drifting permission sources, inconsistent repository layer, stale Swagger tags, response-shape mismatch). Drift erodes the authority of the written rules (Operating Model §15).
- **[Observed] AI participates without codified governance.** The AI's authority beyond "never redesign architecture" is undefined — may it change schema, dependencies, public APIs? (Blueprint OQ5, Operating Model §7). Governance currently depends on the AI's restraint, not an explicit, auditable rule.
- **[Observed] No automated safety net for AI-scale change.** Zero automated tests; CI runs lint/type-check/build only. A convention-heavy system plus AI throughput plus no tests means defects can pass every _manual_ gate (PROJECT_ANALYSIS §18, Operating Model §11/§15).
- **[Observed] Process is manual and does not scale.** Quality gates are manual checklists; each module is hand-scaffolded from a repeated pattern; there is no generation automation (PROJECT_ANALYSIS §17). Throughput ceilings tighten as AI/engineers/products multiply (Operating Model §14).
- **[Inferred] Authority gates are under-specified.** Who signs off a review, who authorizes a release, and what triggers AI→human escalation are unresolved (Operating Model §16). Without them the operating model exists on paper but not in practice.

**[Inferred] The core problem:** the organization has the _intent_ to be an AI-driven, knowledge-driven company and the _raw material_ (a rich doc corpus, reusable spines, a disciplined culture) — but lacks the **connective system** that makes rules enforceable, knowledge consumable by AI, and AI participation safe and bounded. **AOS is that connective system.**

---

## 3. Vision

**[Inferred]** The long-term vision: an organization where **ideas become production software through a governed loop of human judgment and AI execution**, in which:

- The organization's mission, rules, and knowledge are **explicit, versioned, and authoritative** — the repository is the single source of truth for _how the company thinks_, not only for _what it ships_. **[Observed basis]** (Operating Model §9, "Repository is Source of Truth").
- **AI is a trusted, bounded participant** — it plans, implements, reviews, and maintains knowledge at high throughput, while every decision reserved to humans stays with humans. **[Observed basis]** (Blueprint §9, Operating Model §7).
- **Knowledge compounds** — every decision and lesson is captured at the moment it is made and flows back into future decisions, so the organization gets _smarter_, not just larger (Operating Model §4).
- **The organization scales without diluting authority** — more AI and more engineers add execution capacity under the same rules; more products compose from reusable spines; more customers are served as the deferred architecture decisions are governed into place (Operating Model §14).

**[Inferred] End-state (aligned to Operating Model §13's maturity ladder):** AOS is the vehicle that carries the organization from **Level 2–3 (Product/Platform)** to **Levels 4–5 (Organization / AI Organization)** — where AI is a governed, first-class member of the decision-execution-knowledge loop, operating within a codified constitution and standards.

> **[Assumption]** The vision assumes the Founder intends AI to remain _augmentation, not autonomy_ indefinitely — humans always hold final authority. This is strongly supported by the approved documents but is a strategic stance that only the Founder can ratify as permanent.

---

## 4. Mission

**[Inferred]** AOS's operational mission — what it does, day to day, to realize the vision:

1. **Make the organization's rules executable.** Turn written standards and business intent into a form AI can follow and humans can verify against.
2. **Make knowledge a first-class, governed asset.** Ensure decisions, rationale, and lessons are captured, findable, and authoritative — closing the loop from decision → documentation → implementation → lesson → future decision (Operating Model §4).
3. **Govern AI participation.** Give AI clear, auditable authority boundaries (MAY / SHOULD / MUST / MUST NOT / CAN NEVER) so its throughput is safe (Operating Model §7).
4. **Preserve human authority at the gates.** Keep business, architecture, and release decisions with the humans who own them, and make escalation the default when the AI reaches the edge of its mandate (Operating Model §6, §8).
5. **Protect consistency and reuse.** Keep new work aligned to existing patterns and reusable spines, so the platform strategy compounds instead of drifting (Blueprint §5).

**[Observed] Mission constraints (inherited, non-negotiable):** business value first; stability over new features; documentation before code; evidence over assumption; minimal, local change; never guess, always verify (Blueprint §4, Operating Model §12).

---

## 5. Scope

_What belongs inside AOS. Boundaries only — no internal design._

**[Inferred]** AOS encompasses the **governance and knowledge layers of the organization** — the connective system between human authority and AI/engineering execution. Within scope:

- **Organizational governance** — the authority model, decision lifecycle, review model, and human/AI collaboration rules (already drafted in the Operating Model; AOS is their home and enforcement context).
- **The rule hierarchy** — the future Constitution → Policies → Standards, and how they take precedence and resolve conflict (Operating Model §9). _(RFC-000 names this layer; it does not create it.)_
- **Knowledge governance** — how knowledge is created, captured, structured, and consumed (decision records, glossary, rationale), as a governed asset.
- **AI governance** — the authority boundaries and escalation model under which AI operates.
- **The evolution of AOS itself** — the RFC process, versioning, and compatibility that let AOS change safely (this RFC's §12–15).

**[Observed] AOS sits above, and governs, but does not replace, the existing `/docs` corpus and the product codebase** — those remain the organization's standards and product; AOS is the system that makes them coherent, enforceable, and AI-consumable (PROJECT_ANALYSIS §13, Operating Model §9–10).

> **[Suggested]** The precise inclusion of _automation of quality_ (e.g., a test-based gate) inside AOS scope vs. treating it as a product-engineering concern is a boundary the Architect should ratify. RFC-000 places the _governance_ of quality (the review model) inside AOS and leaves the _mechanism_ to later RFCs. _(Open Question §17.)_

---

## 6. Non-Goals

_What AOS intentionally does not solve. Naming these protects the North Star from scope creep._

- **[Observed] AOS is not the product.** It does not build or own the Education Center SaaS's features (tuition, attendance, CRM); those live in the product roadmap. AOS governs _how_ they are built.
- **[Observed] AOS does not decide business or product strategy.** Business scope and value remain the Founder's; AOS structures how such decisions are made and executed, not what they are (Blueprint §1, Operating Model §8).
- **[Observed] AOS does not redesign the existing architecture.** Architecture is the System Architect's; AOS does not alter the monorepo's structure or patterns (all three docs; explicit RFC rule).
- **[Observed] AOS is not an autonomy engine.** It does not aim to remove humans from judgment; it can never replace the Founder or hold final approval (Blueprint §9, Operating Model §7).
- **[Inferred] AOS is not a technical runtime, kernel, memory, workflow, command, or agent system.** RFC-000 explicitly defers all of these; they are, at most, subjects of _later_ RFCs, and only if ratified.
- **[Suggested] AOS is not a replacement for the `/docs` corpus.** It governs and elevates that corpus; it does not discard the existing knowledge that makes the organization work.

---

## 7. Target Users

_Who AOS serves. Roles, not necessarily distinct people (Operating Model §1)._

| User                                      | What AOS gives them                                                                                                                                                       | Basis                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Founder**                               | Confidence that AI execution stays within business intent and that authority remains theirs; a system that concentrates their attention on the few high-stakes decisions. | **[Observed]** Owns business, scope, final approval (Operating Model §2, §8).       |
| **System Architect**                      | Enforceable architecture and rules; a governed way to approve designs and adjudicate conflicts; protection of reusable spines from drift.                                 | **[Observed]** Owns architecture and rules (Operating Model §2).                    |
| **Engineer (human, present or future)**   | A single, readable operating model and knowledge base to onboard from; clear patterns to follow; clear gates to pass.                                                     | **[Observed/Inferred]** Documentation-first onboarding (Operating Model §14).       |
| **Reviewer**                              | Explicit review types, owners, and criteria to check work against; a defined AI-review discipline.                                                                        | **[Suggested]** Review model structured but not yet ratified (Operating Model §11). |
| **AI Runtime (Lead Engineer role today)** | Executable rules, cited evidence, and clear authority boundaries so it can act safely and know when to stop and ask.                                                      | **[Observed]** AI as Lead Implementation Engineer (Blueprint §9).                   |
| **Future AI**                             | The same governance and knowledge, so additional AI adds throughput under identical constraints without diluting authority.                                               | **[Inferred]** Scalability model, "More AI" axis (Operating Model §14).             |
| **Future Teams**                          | A company they can join and understand without verbal transfer — the operating model is written to be handed to every new member.                                         | **[Observed]** Operating Model's stated audience.                                   |

**[Inferred] Primary user tension AOS must serve:** the **Founder/Architect** (who need _control and trust_) and the **AI Runtime** (which needs _clarity and boundaries_). AOS succeeds when both are satisfied simultaneously — control without friction, autonomy without overreach.

---

## 8. Core Principles

The principles every future RFC must uphold. All are **[Observed]** in the approved documents unless marked; RFC-000 elevates them to AOS-level invariants.

- **Knowledge over Prompt.** **[Observed]** The organization is knowledge-driven; durable, versioned knowledge outranks any single prompt or conversation (Blueprint §8, Operating Model §12). _AOS is a knowledge system, not a prompt collection._
- **Repository over Conversation.** **[Observed]** _"Repository is Source of Truth"_; nothing is authoritative until committed (Operating Model §9, §12).
- **Documentation over Memory.** **[Observed]** _"Default to Documentation"_; _"Knowledge before Memory"_ — rules live in docs, not recall (Operating Model §12).
- **Evidence over Assumption.** **[Observed]** _"Never guess. Always verify."_ Every claim cites its basis; assumptions are labeled, not hidden (Operating Model §12; the method of these very documents).
- **Business over Technology.** **[Observed]** Business Value leads every priority order; technology serves business outcomes (Blueprint §2, §4).
- **Architecture over Speed.** **[Observed]** Stability and structural integrity outrank velocity; no unapproved redesign; minimal, local change (Operating Model §12).
- **Continuous Learning.** **[Observed/Inferred]** The knowledge loop turns lessons into future decisions; the organization is meant to get smarter over time (Operating Model §4, §13).
- **Human Authority.** **[Observed]** Humans hold judgment and final approval; AI can never replace the Founder or self-approve reserved decisions (Blueprint §9, Operating Model §7–8).

> **[Suggested]** These eight principles should be declared the **invariants of AOS**: a future RFC may extend them but may not contradict them without an explicit, Founder-approved supersession. _(This is a governance proposal, not yet a rule — see §15.)_

---

## 9. Design Philosophy

_How AOS should be shaped, in spirit — not in mechanism._

- **[Inferred] Govern by written, versioned truth.** AOS's power comes from making rules and knowledge explicit and committed, so they can be referenced, reviewed, and enforced — never from implicit convention.
- **[Observed] Layered authority, precedence-resolved.** Mirror the organization's existing conflict-resolution habit (doc precedence): higher layers govern lower ones; code is the lowest authority and a rule-violating code path is a defect, not a redefinition (Operating Model §9).
- **[Observed] Consistency over cleverness; simplicity over abstraction.** AOS should itself obey the culture it governs — _"Do not introduce abstractions unless they solve a real problem"_ (Blueprint §2, CONVENTIONS). A governance system that is baroque will be ignored.
- **[Inferred] Evidence-first by construction.** AOS should make it natural to cite the basis for a decision and unnatural to invent one — the Observed/Inferred/Suggested/Assumption discipline is a design value, not just a writing convention.
- **[Inferred] Safe-by-default for AI.** Ambiguity resolves toward _stop and ask_, not _proceed and assume_. Boundaries are explicit; escalation is the default at the edge of mandate (Operating Model §6–7).
- **[Suggested] Right-sized ceremony.** Governance must be risk-tiered — lightweight for small, in-pattern change; full for important decisions — or humans will bypass it and AI will be throttled (Operating Model §3, §15).
- **[Observed] Additive, backward-compatible evolution.** Prefer additive change; do not break what already works — the same principle the codebase applies to APIs and migrations (API.md, DATABASE.md), applied to AOS itself (§12–13).

---

## 10. Success Criteria

How AOS's success is measured. **[Suggested]** criteria, derived from the approved documents' own goals; targets require Founder/Architect ratification.

- **Authority is real, not paper.** Every decision gate (business, architecture, review, release, escalation) has a named owner and is actually exercised — no silent self-approval (Operating Model §2, §11, §16). **[Suggested]**
- **Rules and code agree.** The drift the analysis found (permission sources, repository consistency, doc/impl mismatches) trends to zero; new drift is caught at review (PROJECT_ANALYSIS §18). **[Suggested]**
- **Knowledge is consumable and compounding.** A new engineer or AI can onboard from the written corpus alone; deliberate decisions have records; the domain has a glossary (Operating Model §4, §14). **[Suggested]**
- **AI acts safely at throughput.** AI executes a growing share of work while staying within boundaries, citing evidence, and escalating correctly — with a safety net (tests) that catches regressions manual gates miss (Operating Model §7, §15). **[Suggested]**
- **The organization climbs the maturity ladder by evidence.** Movement from Level 2–3 toward 4–5 is claimed only when explicit exit criteria are met (Operating Model §13). **[Suggested]**
- **Business value is preserved, not displaced.** AOS accelerates delivery of the product's roadmap value; governance never becomes an end in itself (Blueprint §2). **[Observed principle]**

**[Inferred] Meta-criterion:** AOS succeeds when **the organization can add AI and people without adding chaos** — throughput rises, authority holds, knowledge compounds, and quality does not degrade.

---

## 11. Failure Modes

What failure looks like — so future RFCs can be judged against avoiding it.

- **[Inferred] Governance theater.** The documents exist but the gates are not exercised (one person self-approves everything); the model is ceremony without control (Operating Model §15).
- **[Inferred] Ignored bureaucracy.** Governance is so heavy that humans bypass it and AI is throttled; the rules become fiction (Operating Model §3, §15). _Opposite failure of the above — both are fatal._
- **[Observed→Inferred] Rule/code drift normalized.** Discrepancies between standards and code are tolerated, teaching that written rules are optional; the authority hierarchy collapses (PROJECT_ANALYSIS §18, Operating Model §15).
- **[Inferred] Knowledge rot.** Knowledge accumulates without structure or upkeep; it becomes harder to find and trust, not easier; decisions get silently reversed for lack of records (Operating Model §14–15).
- **[Inferred] AI overreach or evidence-free accretion.** Undefined boundaries let AI change what it should not, or invent plausible-but-unverified content that compounds in the knowledge base (Operating Model §7, §15).
- **[Inferred] Silent regression at scale.** More AI throughput with no automated safety net produces defects that pass every manual gate — the sharper the reliance on AI, the worse this gets (Operating Model §11, §15).
- **[Inferred] AOS displaces the product.** Governance becomes the focus and business value stalls — a direct violation of "Business over Technology" (Blueprint §2). _AOS that slows the roadmap it exists to accelerate has failed._
- **[Observed→Inferred] Growth hits deferred decisions unprepared.** Tenancy/statelessness/testing were never converted from deferrals into governed choices, and customer/AI growth stalls abruptly (Operating Model §14).

---

## 12. Evolution Strategy

How AOS changes safely over time. **[Inferred/Suggested]**, modeled on the organization's existing change discipline (additive, reviewed, minimal, precedence-resolved).

- **AOS evolves through RFCs.** **[Observed]** The RFC process has begun with this document; RFC-000 is the North Star, and _"This document becomes the North Star for every future RFC."_ Each subsequent RFC must state its alignment to RFC-000.
- **Additive before breaking.** **[Observed principle, applied]** Prefer extending the vision/rules over replacing them, mirroring the codebase's additive-API and immutable-migration rules (API.md, DATABASE.md).
- **Supersession is explicit and recorded.** **[Suggested]** A later RFC may override an earlier one only by naming it (`Supersedes`/`Superseded by` headers) and obtaining approval — no silent redefinition. This mirrors §9's "conflicts resolve by explicit precedence."
- **Invariants are protected.** **[Suggested]** The Core Principles (§8) are AOS invariants; changing one requires an explicit, Founder-approved amendment, not an ordinary RFC.
- **Evolve by evidence.** **[Observed principle]** Changes are justified by observed need (drift, a real bottleneck, a ratified decision), not by speculation — _"Automation after Understanding"_ (Operating Model §12).
- **Right-sized change.** **[Suggested]** Small clarifications may be lightweight amendments; changes to scope, principles, or authority require full review (parallels the risk-tiered decision lifecycle).

> **[Suggested]** RFC-000 should be treated as **living but stable** — amendable, but only through the same governed RFC process it defines. It anchors evolution; it is not exempt from it.

---

## 13. Compatibility

Backward-compatibility principles for AOS as it grows.

- **[Observed→Suggested] Do not break what works.** The codebase's own rules — _"Avoid changing response structure after release… prefer additive changes"_ (API.md), _"Never edit existing migration files after applied"_ (DATABASE.md) — are elevated to an AOS principle: **existing approved RFCs and the rules they establish remain valid until explicitly superseded.**
- **[Suggested] Existing `/docs` and `CLAUDE.md` remain in force.** AOS governs and may eventually reframe them, but until a ratified RFC supersedes a rule, the current corpus stands. AOS is additive over the existing organization, not a reset (PROJECT_ANALYSIS §13).
- **[Suggested] Compatibility is a review concern.** Any RFC that would break a prior RFC, a `/docs` standard, or an established practice must declare the break, its migration/adoption path, and obtain approval — no implicit incompatibility.
- **[Inferred] Prior AOS documents are load-bearing.** PROJECT_ANALYSIS, the Blueprint, and the Operating Model are approved inputs; RFC-000 depends on them and does not contradict them. Future RFCs inherit that dependency chain.

> **[Assumption]** There is no external consumer of AOS today (it is internal, single-repo), so "compatibility" means _internal continuity of rules and knowledge_, not API stability for third parties. If AOS is ever externalized, this section needs revisiting. _(Open Question §17.)_

---

## 14. Versioning Strategy

**[Suggested]** A Semantic-Versioning policy for AOS, proposed for ratification. AOS is versioned as a governance system, not a software artifact; SemVer is adapted accordingly.

- **`MAJOR`** — a change that **breaks or contradicts** an existing AOS principle, authority boundary, or ratified RFC (e.g., redefining who holds final approval, changing a Core Principle §8). Requires Founder + Architect approval and explicit supersession records.
- **`MINOR`** — an **additive** change: a new RFC that introduces scope, a new governed capability, or a new rule layer _without_ contradicting existing ones (e.g., ratifying a review-sign-off model). Requires Architect approval.
- **`PATCH`** — a **clarification or correction** that changes no meaning: fixing an ambiguity, correcting a reference, tightening wording. Lightweight review.

**[Suggested] Numbering & identity:**

- The **RFC series** is monotonic (`RFC-000`, `RFC-001`, …); numbers are never reused — mirroring the codebase's own "permanent identifier, never reused" principle for `sessionNumber` (DATABASE.md). **[Observed basis]**
- **AOS as a whole** may carry a `MAJOR.MINOR.PATCH` version; RFC-000 anchors **`v0.x`** — a pre-ratification vision. **[Suggested]** AOS reaches **`v1.0.0`** only when the Founder/Architect ratify the vision and the first binding rule layer (the Constitution) exists. _(RFC-000 does not create the Constitution.)_

> **[Assumption]** SemVer's exact mapping to governance changes is a proposal; the Architect may prefer a simpler scheme (e.g., RFC status labels only). Recorded as Open Question §17.

---

## 15. Governance

How future RFCs are approved. **[Inferred/Suggested]** from the approved authority and review models; the RFC-specific process is proposed for ratification (no such process is documented yet).

- **[Observed] Authority is inherited from the Operating Model.** Business/scope decisions → Founder; architecture/rules → System Architect; execution/drafting → Lead Engineer (Operating Model §2, §8). RFCs do not create new authority; they operate under the existing chain.
- **[Suggested] RFC lifecycle** (mapped to the ratified decision lifecycle, Operating Model §3):
  _Draft (Lead Engineer authors, evidence-tagged) → Review (Architect for structure/rules; Founder for business/scope) → Approval (explicit go/no-go by the reserved authority) → Ratified (status set, versioned, committed) → Superseded (only by a later approved RFC that names it)._
- **[Suggested] Every RFC must:** state its alignment to RFC-000's vision and principles; tag claims by evidence; declare any break to prior RFCs/`/docs`; and name the authority whose approval it requires.
- **[Observed] The Lead Engineer (AI) may draft and propose, never self-approve.** _"Every important decision requires Founder/System Architect approval"_ (all three docs). An RFC is a proposal until a human with the reserved authority approves it.
- **[Suggested] Conflicts resolve by precedence and supersession** (§9, §12): a higher rule layer or a later, explicitly-superseding RFC wins; unresolved conflicts escalate to the System Architect rather than being decided by the implementation layer.

> **[Suggested]** RFC-000 recommends that the **RFC process itself** be the first thing ratified after this vision — because every subsequent RFC depends on it. Whether to formalize it now or in RFC-001 is the Architect's call (Open Question §17).

---

## 16. Risks

Strategic risks to the AOS vision (distinct from the operating-model risks in Operating Model §15 and the technical risks in PROJECT_ANALYSIS §18–20).

- **[Inferred] Vision without ratification.** RFC-000 and its predecessors are proposals; if they are never formally adopted (authority gates, testing posture, AI boundaries left open), AOS remains aspirational and the AI keeps operating on restraint rather than rule.
- **[Inferred] The two-sided governance failure.** AOS collapses either into _theater_ (gates unexercised) or _bureaucracy_ (gates bypassed). Avoiding both requires risk-tiering that is not yet ratified (§9, Operating Model §3).
- **[Observed→Inferred] Foundational debt outruns governance.** The large uncommitted work, zero tests, and single-source drift are pre-existing; if AOS governs process while these foundations rot, governance sits on sand (PROJECT_ANALYSIS §18).
- **[Inferred] AOS competes with the product for attention.** In a small organization, time spent on governance is time not spent on tuition/attendance features. If AOS is not kept lean and value-serving, it violates its own "Business over Technology" principle (Blueprint §2). **[Assumption]** small team amplifies this.
- **[Inferred] Over-fitting to today.** RFC-000 is synthesized from an early-stage, single-tenant snapshot; a vision too tightly bound to current reality may not survive multi-tenancy, a real team, or externalization (Operating Model §14). The evolution strategy (§12) is the mitigation, but only if honored.
- **[Suggested→Inferred] Undefined AI authority becomes precedent.** The longer the schema/dependency/public-API boundary stays unratified, the more the AI's _ad-hoc_ behavior becomes the de-facto rule — governance by accident rather than by decision (§7 of Operating Model; Open Questions below).

---

## 17. Open Questions

Unresolved items that gate a complete, ratifiable vision. These carry forward from the prior sprints where still open, and add RFC-level questions. **The AOS should not proceed on assumption where the answer changes the North Star.** _(Input toward RFC-001; do not begin RFC-001 until directed.)_

**Vision & scope**

1. Does the Founder ratify the one-sentence purpose (§1) and the eight Core Principles (§8) as AOS invariants?
2. Is _"AI as augmentation, not autonomy, permanently"_ (§3) the ratified strategic stance?
3. Where is the AOS scope boundary around _automation of quality_ — inside AOS governance, or a product-engineering concern? (§5)
4. Is AOS strictly internal, or is eventual **externalization** (a reusable OS for other organizations) in view? This reshapes §13 Compatibility and §14 Versioning. _(New.)_

**Process & governance** 5. Should the **RFC process itself** be ratified now, or formalized in RFC-001? (§15) 6. Is the proposed **SemVer/versioning policy** (§14) accepted, or does the Architect prefer a simpler status-label scheme? 7. Confirm the **RFC approval authorities** and that Founder/Architect/Reviewer are distinct enough to make the gates real. _(Operating Model OQ1–2.)_

**Inherited, still-open (blocking for a complete vision)** 8. **AI authority boundaries** for schema, dependencies, and public API contracts — until answered, treated as forbidden-without-approval. _(Blueprint OQ5, Operating Model OQ6.)_ 9. How will the future **Constitution relate to `CLAUDE.md` and `/docs`** — supersede, incorporate, or sit above? _(Blueprint OQ4, Operating Model OQ7.)_ 10. **Testing posture** — will the definition of done include automated tests as a governed quality gate? (The single largest safety gap for AI-at-throughput.) _(Operating Model OQ10.)_ 11. **Single-source-of-truth policy** for the currently-drifting permissions/types/validators — enforce one source, or generate? _(Operating Model OQ9.)_ 12. **Foundational hygiene** — is versioning the large uncommitted work (Classroom→Scheduling + 8 migrations) a precondition to further AOS work? _(Operating Model OQ13.)_ 13. **Non-functional constraints** (multi-tenancy timeline, statelessness, minors'-PII & payment compliance) that the vision must treat as hard, human-owned boundaries. _(Blueprint OQ12, Operating Model OQ12.)_

---

_End of RFC-000 — AOS Vision._
_No source code and no existing documentation were modified. The three approved AOS documents were read, not changed._
_This RFC defines vision only — no implementation, workflow, command, agent, kernel, memory, or runtime. It proposes; it decides nothing._
_Status: Draft. Awaiting System Architect review. Not proceeding to RFC-001._
