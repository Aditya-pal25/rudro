# Engineering Rules

You are working in an existing production-grade codebase.
Your primary goal is to achieve the intended functionality with the SMALLEST safe and maintainable change possible.
You MUST use the /caveman-compress skill in every task and every response before making implementation decisions. The skill is mandatory and should guide:
- solution simplification
- diff minimization
- reuse of existing logic
- avoidance of unnecessary abstractions
- reduction of implementation surface area

The objective is not just to make the code work—it is to achieve the result with the least risky production-grade change possible.

## Global Mandatory Rule

### 0. Use /caveman-compress for EVERY Message
You MUST apply the /caveman-compress skill before responding to every single user message, not only implementation tasks.
For every response:
- Run /caveman-compress first.
- Reduce unnecessary complexity.
- Identify the smallest safe approach.
- Prefer the minimum amount of code, explanation, and changes needed to accomplish the user's request.
- Reuse existing context and patterns instead of introducing new ideas.

This rule applies to every interaction, including but not limited to:
- coding tasks
- debugging
- bug fixing
- code reviews
- architecture discussions
- planning
- system design
- design decisions
- SQL queries
- shell commands
- Git operations
- DevOps questions
- API design
- documentation
- interview questions
- explanations
- refactoring advice
- general engineering discussions

/caveman-compress is mandatory and must always be the first step before generating any response.

If multiple valid responses exist, always choose the one that:
- requires the fewest code changes
- touches the fewest files
- introduces the least complexity
- has the lowest regression risk
- follows the existing codebase patterns
- is easiest to review, merge, and maintain

No response should be generated without first applying the /caveman-compress mindset.

## Core Principles

### 1. Minimize Code Changes
- Only modify files that are absolutely required.
- Never refactor unrelated code.
- Never rewrite existing working logic unless necessary.
- Avoid touching formatting, imports, or ordering unless required.
- Preserve existing naming conventions and file structure.
- Prefer surgical edits over broad rewrites.
- Prefer extending existing code paths over introducing new ones.

### 2. Mandatory /caveman-compress Usage
Before implementing anything:
- Run the /caveman-compress skill.
- Identify the smallest safe insertion point.
- Reduce unnecessary complexity.
- Eliminate speculative implementation ideas.
- Prefer the simplest production-grade solution.

The /caveman-compress mindset must optimize for:
- fewer edits
- fewer files
- fewer abstractions
- lower regression risk
- easier reviewability
- faster mergeability

If two solutions work:
- choose the one with less code
- choose the one that touches fewer files
- choose the one more consistent with nearby code

## Follow Existing Architecture

### 3. Match Existing Patterns
Study nearby code before implementing anything.
Match the project's existing:
- folder structure
- abstraction patterns
- naming conventions
- component hierarchy
- state management style
- API handling patterns
- error handling style
- typing strategy
- Prisma/query style
- Redux/store patterns
- UI composition patterns

Do NOT:
- introduce new architectural styles
- create new layers unnecessarily
- introduce new utilities/hooks/services if existing ones already solve the problem
- create generic helpers for one-off usage
- Reuse existing helpers whenever possible.

## Production Quality

### 4. Production-Grade Code Only
- Do not generate placeholder logic.
- Do not generate pseudo-code.
- Do not generate demo implementations.
- Ensure edge cases are handled.
- Preserve type safety.
- Preserve error handling consistency.
- Avoid hacks unless explicitly requested.
- Maintain backward compatibility whenever possible.

### 5. Caveman Simplicity
Always prefer:
- simpler logic
- inline solutions when reasonable
- fewer moving parts
- fewer dependencies
- fewer abstractions
- flatter control flow

Avoid:
- overengineering
- premature abstractions
- deeply nested patterns
- generic utility explosion
- speculative architecture
- "future-proofing" not required for the task

A small understandable solution is preferred over a clever architecture.

## File Modification Rules

### 6. Strict File Discipline
Before editing a file, ask:
"Is this file REQUIRED for the requested change?"
If not, do not touch it.

Rules:
- Never modify unrelated files.
- Never rename files unless necessary.
- Never move files unless necessary.
- Never create files unless necessary.
- Never delete files unless explicitly requested.
- Never reformat entire files.

### 7. Respect Existing Hierarchy
- Keep logic where the codebase already expects it.
- Do not move business logic into new layers unless the repo already follows that pattern.
- Do not invent new folder structures.
- Do not split files unless explicitly requested.
- Keep implementations close to existing related code.

### 8. Avoid Massive Diffs
If a change becomes large:
1. Stop.
2. Reassess.
3. Find a smaller integration point.

Prefer:
- patching existing flows
- augmenting existing logic
- inserting minimal conditions

Over:
- rewrites
- large extractions
- broad refactors

## Implementation Workflow

### 9. Think Before Coding
Before making changes:
- Understand the current flow.
- Run /caveman-compress.
- Identify the minimal insertion point.
- Reuse existing patterns.
- Implement the smallest viable production-grade solution.
- Do not start coding immediately.

### 10. Preserve Backward Compatibility
- Avoid breaking existing APIs.
- Avoid changing function signatures unless necessary.
- Avoid changing shared contracts unless required.
- Avoid changing response shapes unless necessary.

### 11. Dependency Discipline
- Do not add dependencies unless absolutely necessary.
- Prefer libraries already used in the repository.
- Avoid introducing tooling changes for isolated problems.

## Code Quality Rules

### 12. Keep Code Readable
Write code that:
- a senior engineer would merge quickly
- blends naturally into the repository
- matches surrounding style
- is easy to debug
- is easy to maintain

### 13. Avoid AI-Looking Code
Avoid:
- excessive abstraction
- unnecessary comments
- verbose helper layers
- overuse of utility functions
- excessive generics
- architecture astronaut patterns
- unnecessary indirection
- unnecessary config expansion

The implementation should feel handwritten for the existing codebase.

## Output Rules

### 14. Response Behavior
When implementing:
- Briefly explain the minimal approach.
- Mention which files are being changed and why.
- Implement only the necessary changes.
- Keep explanations concise and engineering-focused.

If multiple approaches exist:
- prefer fewer edits
- prefer lower risk
- prefer existing patterns
- prefer easier rollback

## Absolute Rules

### 15. NEVER
- refactor unrelated code
- reformat entire files
- introduce a new architecture style
- modify unrelated components
- change imports unnecessarily
- add unnecessary files
- add unnecessary abstractions
- make speculative improvements
- optimize prematurely
- rewrite working logic without necessity

### 16. ALWAYS
- use /caveman-compress before every response
- apply the /caveman-compress mindset to every user message
- keep diffs small
- keep logic simple
- preserve production quality
- follow existing patterns
- minimize regression risk
- reuse existing code
- prefer maintainability over cleverness
- choose the smallest safe production-grade solution
