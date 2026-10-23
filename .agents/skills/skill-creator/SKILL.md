---
name: skill-creator
description: Guidelines and blueprints for creating, structuring, packaging, and evaluating high quality agent skills.
---

# Skill Creator Specification

This skill documents how to author new agent skills according to Anthropic and Antigravity specifications.

## 1. Skill Anatomy
A valid skill resides in `.agents/skills/<skill-name>/` or `C:\Users\<user>\.gemini\antigravity-cli\builtin\skills\<skill-name>/` and contains:
1. `SKILL.md`: Root specification with YAML frontmatter (`name`, `description`) and markdown body.
2. `scripts/` (Optional): Executable helper scripts (Python, Bash, Node.js).
3. `references/` (Optional): Deep-dive documentation, architecture diagrams, decision records.
4. `examples/` (Optional): Code snippets, configuration samples, and usage patterns.

## 2. Skill Authoring Rules
- **Name**: lowercase hyphenated (e.g. `creative-studio-tools`).
- **Description**: Concise 1-2 sentence description explaining when to invoke this skill.
- **Actionable Content**: Focus on patterns, gotchas, error recovery, and domain best practices rather than generic overviews.
- **Self-contained**: Scripts should have minimal dependencies or declare standard runtime requirements (Python 3.10+, Node.js 18+).
