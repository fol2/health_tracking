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

## CRITICAL SECURITY GUIDELINES

### Never Commit Secrets (HIGHEST PRIORITY!)

**Recent Incident**: Hardcoded OAuth credentials and database passwords in a script file triggered GitHub push protection, blocking deployment and potentially exposing sensitive data.

**Prevention Protocol**:
1. **BEFORE ANY CODE CHANGES**: Check for hardcoded credentials
2. **BEFORE COMMITTING**: Run security scan:
   ```bash
   grep -r "GOCSPX\|sk-\|pk-\|Bearer\|postgres://\|mongodb://\|mysql://\|redis://" \
     --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
     --include="*.sh" --include="*.env" --include="*.json" .
   ```
3. **USE ENVIRONMENT VARIABLES**: Never hardcode any credentials
4. **VERIFY GITIGNORE**: Ensure all `.env` files are properly ignored

### Security Checklist for Every Session

- [ ] No API keys, OAuth secrets, or database passwords in code
- [ ] All credentials stored in `.env` files
- [ ] `.env` files are gitignored
- [ ] Created `.env.example` files with dummy values
- [ ] Scanned for base64 encoded secrets
- [ ] Checked `git diff --cached` before commit

## Agent Collaboration Workflow

### 1. Primary Development Flow

For any coding task, follow this sequence:

```
1. TodoWrite → Plan and track the task
2. Code Implementation → Write/modify code
3. code-simplifier → ALWAYS review after editing (MANDATORY)
4. code-reviewer → Security and quality check
5. debugger/debug-detector → If any issues arise
```

### 2. Mandatory Agent Usage

#### After EVERY Code Edit:
- **code-simplifier** - MUST be called to review and improve code
- **code-reviewer** - Should be called for security checks

#### Before Deployment:
- **debug-detector** - Check for potential bugs
- **code-architecture-guardian** - Verify architectural standards

#### When Dealing with Credentials:
- **error-detective** - Search for exposed secrets in logs
- **code-reviewer** - Double-check for hardcoded credentials

### 3. Concurrent Agent Usage

Launch multiple agents in parallel for efficiency:

```javascript
// Good - Parallel execution
await Promise.all([
  Task({ subagent_type: 'code-simplifier', ... }),
  Task({ subagent_type: 'code-reviewer', ... }),
  Task({ subagent_type: 'debug-detector', ... })
])

// Avoid - Sequential execution (slower)
await Task({ subagent_type: 'code-simplifier', ... })
await Task({ subagent_type: 'code-reviewer', ... })
```

### 4. Agent Selection Matrix

| Scenario | Primary Agent | Supporting Agents |
|----------|--------------|-------------------|
| New Feature | ui-component-builder | code-simplifier, code-reviewer |
| Bug Fix | debugger/debug-detector | error-detective, code-simplifier |
| Refactoring | code-simplifier | code-architecture-guardian, code-reviewer |
| Database Changes | database-architect | code-reviewer |
| State Management | state-management-architect | code-simplifier |
| Production Issues | error-detective | debugger, debug-detector |
| Security Audit | code-reviewer | error-detective |

### 5. Critical Collaboration Rules

1. **NEVER skip code-simplifier** after code edits
2. **ALWAYS use code-reviewer** when handling authentication or sensitive data
3. **USE context-manager** for tasks exceeding 10k tokens
4. **INVOKE error-detective** when debugging production issues
5. **EMPLOY concurrent agents** when tasks are independent

## Available Agents

Claude Code has access to specialized agents that can be invoked for specific tasks. Use these agents proactively when their expertise matches the task at hand.

### Development & Code Quality Agents

1. **general-purpose** - Handles complex, multi-step tasks autonomously. Use for researching complex questions, searching for code, and executing multi-step tasks. When searching for keywords or files and not confident about finding the right match in first few tries, use this agent.

2. **code-architecture-guardian** - Reviews code architecture, ensures adherence to file size limits, folder organization standards, and identifies architectural anti-patterns. Invoke after writing new code modules, during code reviews, or when refactoring existing code.

3. **debug-detector** - Identifies, analyzes, and diagnoses bugs, errors, or unexpected behavior in code. Use after code execution problems are encountered or when proactive debugging is needed before deployment.

4. **code-simplifier** - Refactors functional code to improve readability, reduce complexity, or eliminate redundancy. Use to simplify nested conditionals, extract duplicated logic, modernize legacy code patterns, reduce cognitive complexity, or apply SOLID/DRY/YAGNI principles. **MANDATORY after every code edit.**

5. **code-reviewer** - Expert code review specialist. Proactively reviews code for quality, security, and maintainability. Use immediately after writing or modifying code. **CRITICAL for security checks.**

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

21. **context-manager** - Manages context across multiple agents and long-running tasks. Use when coordinating complex multi-agent workflows or when context needs to be preserved across multiple sessions. **MUST BE USED for projects exceeding 10k tokens.**

### Usage Guidelines

- Agents should be invoked proactively when their description matches the task
- Multiple agents can be launched concurrently for parallel tasks
- Each agent invocation is stateless - provide detailed task descriptions
- Agent outputs should generally be trusted
- Clearly specify whether the agent should write code or just research

## Error Prevention Patterns

### Common Mistakes to Avoid

1. **Hardcoding Credentials**
   ```javascript
   // BAD - Never do this
   const API_KEY = "sk-abc123xyz"
   
   // GOOD - Use environment variables
   const API_KEY = process.env.API_KEY
   ```

2. **Skipping Agent Reviews**
   ```
   // BAD - Direct deployment after coding
   Code → Deploy
   
   // GOOD - Always review with agents
   Code → code-simplifier → code-reviewer → Deploy
   ```

3. **Sequential Agent Calls**
   ```javascript
   // INEFFICIENT - Sequential
   await agent1()
   await agent2()
   await agent3()
   
   // EFFICIENT - Parallel
   await Promise.all([agent1(), agent2(), agent3()])
   ```

### Best Practices

1. **Environment Management**
   - Keep `.env.example` updated with all required variables
   - Never commit `.env` files
   - Use different env files for different environments

2. **Security First**
   - Scan for secrets before every commit
   - Use code-reviewer for authentication code
   - Rotate credentials if ever exposed

3. **Agent Collaboration**
   - Use TodoWrite to plan complex tasks
   - Always use code-simplifier after edits
   - Launch independent agents concurrently

## Emergency Procedures

### If Credentials Are Exposed

1. **Immediately rotate all exposed credentials**
2. **Use `git commit --amend` to fix the commit**
3. **Force push with `git push --force-with-lease`**
4. **Notify team members if in shared repository**
5. **Check logs for any unauthorized access**

### If Production Is Down

1. **Use error-detective to analyze logs**
2. **Check Vercel deployment status**
3. **Verify environment variables are set**
4. **Run database migrations if needed**
5. **Rollback to previous deployment if critical**

## Conclusion

This guide ensures secure, efficient development with proper agent collaboration. The key principles:

1. **Security is paramount** - Never expose credentials
2. **Agent collaboration is mandatory** - Always use code-simplifier
3. **Parallel execution is preferred** - Launch agents concurrently
4. **Prevention is better than cure** - Check before committing

Remember: The recent security incident with hardcoded credentials could have been prevented by following these guidelines. Always prioritize security and use the agent collaboration workflow.