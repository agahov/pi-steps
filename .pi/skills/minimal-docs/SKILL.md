---
name: minimal-docs
description: Write, review, or shorten project context, architecture, and feature documents. Keep intent, decisions, constraints, and shared terms. Remove obvious text, implementation detail, and repetition.
---

# Minimal documentation

1. Read the brief, relevant documents, glossary, and code needed to verify claims. Identify the reader's question and document scope. Below the title, add one `Scope:` line when the boundary is not clear from the title. Do not add a Purpose section.
2. Keep only what answers that question: intent, boundaries, rules, constraints, rationale, or acceptance criteria. Omit obvious statements and details readily found in code unless needed to explain a contract or boundary.
3. Use shared terms across prose, diagrams, specifications, and code. Flag conflicting meanings; do not silently rename concepts.
4. Explain each fact once. Link to its home. Separate domain, tech, architecture, current work, and workflow. Create a file only for a distinct purpose. Move or merge only within scope; preserve unique content and fix links.
5. Use Mermaid maps for useful relationships. Label arrows with what crosses each boundary. Do not repeat diagram edges in prose. Add text or a focused diagram only for missing detail, such as communication timing or rendering transforms.
6. Use short, direct sentences. Cut words and sections when meaning stays the same. Preserve requirement strength, conditions, exceptions, and uncertainty.
7. Distinguish agreed design, implemented behavior, and proposals. Do not invent decisions. Ask about blockers; otherwise list unresolved decisions once under Open questions.

## Scope rules

- **Project context:** project goal, major boundaries, and links to details. Distinguish the product from tools or agents used to develop it. Link to the glossary, feature scope, stack, and architecture; do not copy them. Mention configuration only to explain its role or ownership, not its keys or defaults.
- **Domain:** meanings and game rules. Put canonical terms in the glossary; reference it elsewhere. Exclude tooling and module design.
- **Tech:** stack, tooling choices, and technical constraints. Exclude documentation rules and runtime flow.
- **Architecture:** ownership, boundary map, rationale, and details absent from the map. Use Open questions for unresolved design decisions. Do not repeat them elsewhere.
- **Feature:** spec defines the outcome and exclusions; plan defines implementation steps; cases define observable checks. Reference project-wide decisions instead of restating them.
- **Operation:** current focus, status, blockers, and next action. Link to the active feature; do not copy its task list.
- **Workflow:** repeatable planning, implementation, review, and evaluation rules. Keep agent instructions separate from game behavior and game configuration.

These are content boundaries, not required files or sections. Omit empty sections. If a fact belongs elsewhere, link to its home. If that home is missing, report the gap instead of filling an unrelated document.

## Check

- Claims have evidence or a clear proposal/open label.
- Terms and requirements retain their meaning.
- Each fact fits the document's scope and appears once; use references for shared terms and decisions.
- No diagram narration, copied glossary, or filler remains.
- Links resolve. Validate Mermaid if possible; report verification limits.
