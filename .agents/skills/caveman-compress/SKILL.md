---
name: caveman-compress
description: >-
  Compress solutions, minimize diffs, identify minimal safe insertion points, eliminate unnecessary abstractions, and ensure the smallest safe production-grade change before responding or implementing.
---

# Caveman Compress Skill

Use this skill before every response and implementation decision to simplify solutions, minimize diffs, and eliminate unnecessary abstractions.

## Core Directives

1. **Reduce Complexity**: Strip away speculative architecture, generic helpers for one-off tasks, and premature abstractions.
2. **Minimal Safe Insertion Point**: Identify the smallest surgical place in existing code to achieve the goal.
3. **Reuse Existing Patterns**: Mirror adjacent naming conventions, error handling, state management, and file structure.
4. **Smallest Safe Diff**: Prefer 1-line or few-line surgical modifications over large refactors or rewrites.
5. **Production Grade**: Ensure edge cases, error handling, and type safety are maintained without pseudo-code or demo hacks.
