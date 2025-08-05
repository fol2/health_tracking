# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This repository contains a health tracking application located in the `health-tracker` subdirectory. The main project is **not** at the repository root but in:

```
/health-tracker/
```

## Important Note

**Always navigate to the `health-tracker` directory before running any commands or making changes.** The actual project CLAUDE.md with detailed instructions is located at:

```
health-tracker/CLAUDE.md
```

## Quick Start

```bash
cd health-tracker
npm install
npm run dev
```

For complete development instructions, build commands, architecture details, and common tasks, please refer to `health-tracker/CLAUDE.md`.

## Important Flow

After each code editing / writing in the todoWrite, ALWAYS follow by calling code-simplifier to review the last edit.

## Available Agents

Claude Code has access to specialized agents that can be invoked for specific tasks. Use these agents proactively when their expertise matches the task at hand.

### Development & Code Quality Agents

1. **general-purpose** - Handles complex, multi-step tasks autonomously. Use for researching complex questions, searching for code, and executing multi-step tasks. When searching for keywords or files and not confident about finding the right match in first few tries, use this agent.

2. **code-architecture-guardian** - Reviews code architecture, ensures adherence to file size limits, folder organization standards, and identifies architectural anti-patterns. Invoke after writing new code modules, during code reviews, or when refactoring existing code.

3. **debug-detector** - Identifies, analyzes, and diagnoses bugs, errors, or unexpected behavior in code. Use after code execution problems are encountered or when proactive debugging is needed before deployment.

4. **code-simplifier** - Refactors functional code to improve readability, reduce complexity, or eliminate redundancy. Use to simplify nested conditionals, extract duplicated logic, modernize legacy code patterns, reduce cognitive complexity, or apply SOLID/DRY/YAGNI principles.

5. **code-reviewer** - Expert code review specialist. Proactively reviews code for quality, security, and maintainability. Use immediately after writing or modifying code.

6. **debugger** - Debugging specialist for errors, test failures, and unexpected behavior. Use proactively when encountering any issues.

7. **error-detective** - Searches logs and codebases for error patterns, stack traces, and anomalies. Correlates errors across systems and identifies root causes. Use proactively when debugging issues, analyzing logs, or investigating production errors.

### UI/Frontend Agents

8. **ui-component-builder** - Creates, implements, or integrates UI components in React/Next.js applications. Specializes in shadcn/ui, dark themes, responsive layouts, and reusable component libraries.

9. **data-viz-agent** - Creates data visualizations, implements analytics dashboards, performs statistical calculations, or designs data export functionality. Use for charts, graphs, KPIs, and statistical analysis.

10. **nextjs-setup-agent** - Initializes new Next.js 14 projects with App Router, configures Tailwind CSS with dark theme support, sets up Vercel deployment settings, or configures PWA capabilities.

### Health Tracking Specific Agents

11. **fasting-tracker-agent** - Implements fasting tracking functionality, including timer logic, session management, history tracking, and control features (start/stop/pause).

12. **health-metrics-tracker** - Implements health tracking features, including weight monitoring, health indicators systems, form creation for health data input, or data validation for health-related metrics.

13. **scheduler-calendar-agent** - Builds calendar functionality, implements scheduling features, handles recurring events, or integrates reminder systems. Use for calendar UI, drag-and-drop scheduling, event recurrence patterns, and notifications.

### Database & State Management Agents

14. **database-architect** - Designs database schemas, sets up Vercel Postgres or Supabase databases, creates database migrations, or defines data models and their relationships.

15. **state-management-architect** - Implements state management solutions in React applications, including global state stores (Zustand, Context API, Redux), local storage persistence, offline functionality, or data flow patterns.

### Specialized Agents

16. **fact-checker-researcher** - Verifies accuracy of claims, statements, or information by conducting thorough research and cross-referencing multiple sources. Use before publishing content or when evaluating credibility of information.

17. **commercial-insurance-expert** - Provides expert analysis on commercial insurance matters including policy evaluation, risk assessment, premium calculations, claims analysis, and regulatory compliance (UK commercial lines).

### System & DevOps Agents

18. **command-expert** - Creates CLI commands for the claude-code-templates components system. Specializes in command design, argument parsing, task automation, and CLI best practices.

19. **mcp-expert** - Creates Model Context Protocol (MCP) integrations for the cli-tool components system. Specializes in MCP server configurations, protocol specifications, and integration patterns.

20. **dx-optimizer** - Developer Experience specialist. Improves tooling, setup, and workflows. Use proactively when setting up new projects, after team feedback, or when development friction is noticed.

21. **context-manager** - Manages context across multiple agents and long-running tasks. Use when coordinating complex multi-agent workflows or when context needs to be preserved across multiple sessions. MUST BE USED for projects exceeding 10k tokens.

### Usage Guidelines

- Agents should be invoked proactively when their description matches the task
- Multiple agents can be launched concurrently for parallel tasks
- Each agent invocation is stateless - provide detailed task descriptions
- Agent outputs should generally be trusted
- Clearly specify whether the agent should write code or just research