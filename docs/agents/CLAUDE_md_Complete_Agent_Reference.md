# CLAUDE.md Agent Reference Snippet (Complete)

Replace the existing "Additional Specialized Agents" section in your `CLAUDE.md` with this updated version:

---

```markdown
---

## Additional Specialized Agents (Load on Demand)

The following specialized agents are available for specific tasks. Load them by asking Claude to read the file before starting the task.

### Agent Directory

| Agent | File | Purpose |
|-------|------|---------|
| **Testing Toolkit** | `docs/agents/testing-toolkit-agent.md` | Unit test generation, mock data factories, Jest setup, coverage analysis |
| **Librarian & Optimizer** | `docs/agents/librarian-optimizer-agent.md` | Project cleanup, documentation organization, health checks, folder structure |
| **UI/UX Design Expert** | `docs/agents/uiux-design-agent.md` | Visual design standards, component styling, design system documentation |
| **ACE Specialist** | `docs/agents/ace-specialist-agent.md` | Adaptive Card Extensions for Viva Connections and MS Teams |
| **List Architect** | `docs/agents/list-architect-agent.md` | SharePoint list schema design, indexing, large list optimization, PnP provisioning |
| **Integration** | `docs/agents/integration-agent.md` | Microsoft Graph API, HRIS sync, signing services, external API connections |
| **Performance** | `docs/agents/performance-agent.md` | Bundle optimization, caching strategies, render performance, API efficiency |
| **CSS Troubleshooting** | `docs/agents/css-troubleshooting-agent.md` | Debugging CSS conflicts, specificity issues, Fluent UI overrides, SharePoint style conflicts |
| **UI Review** | `docs/agents/ui-review-agent.md` | Comprehensive UI/UX audits, design system assessment, enhancement planning |

### How to Invoke

**Option 1 - Direct load with task:**
```
Read docs/agents/testing-toolkit-agent.md and generate unit tests for EmployeeCard
```

**Option 2 - Load then discuss:**
```
Load the UI Review agent from docs/agents/ui-review-agent.md
```

**Option 3 - Quick reference:**
```
Using the Performance agent, analyze the bundle size
```

### Agent Categories

**Design & UI**
- UI/UX Design Expert → Creating design standards and visual patterns
- UI Review → Auditing existing UI and recommending improvements
- CSS Troubleshooting → Fixing styling issues and conflicts

**Development & Architecture**
- List Architect → SharePoint list schema and data layer design
- Integration → External APIs, Graph, HRIS, signing services
- ACE Specialist → Viva Connections Adaptive Card Extensions

**Quality & Testing**
- Testing Toolkit → Automated tests, mocks, Jest framework
- Performance → Speed optimization, bundle analysis, caching

**Project Management**
- Librarian & Optimizer → Documentation and project organization

### Agent Collaboration Patterns

These agents are designed to work together. Common workflows:

```
UI Review identifies issues → UI/UX Designer creates standards → CSS Troubleshooting fixes problems
```

```
List Architect designs schema → Integration builds sync services → Performance optimizes queries
```

```
Developer completes feature → Testing Toolkit generates tests → QA Agent validates
```

```
ACE Specialist builds cards → UI/UX Designer ensures consistency → QA Agent tests
```

```
Any agent creates docs → Librarian organizes and files them
```

### Quick Reference by Task

| Task | Agent to Use |
|------|--------------|
| "Generate unit tests" | Testing Toolkit |
| "Clean up the project" | Librarian & Optimizer |
| "Create design standards" | UI/UX Design Expert |
| "Build a Viva Connections card" | ACE Specialist |
| "Design a new SharePoint list" | List Architect |
| "Integrate with Graph API" | Integration |
| "Why is the app slow?" | Performance |
| "CSS not working" | CSS Troubleshooting |
| "Review the entire UI" | UI Review |
| "Audit button consistency" | UI Review |
| "Fix SharePoint style conflicts" | CSS Troubleshooting |
| "Optimize bundle size" | Performance |
| "Sync data from HRIS" | Integration |
| "Large list performance issues" | List Architect |
| "Create mock data" | Testing Toolkit |

### Storage Structure

Ensure all agent files are stored in:
```
C:\Projects\SPFx\JML_SPO\
├── CLAUDE.md                              ← Core agents + this reference
└── docs/
    └── agents/
        ├── testing-toolkit-agent.md
        ├── librarian-optimizer-agent.md
        ├── uiux-design-agent.md
        ├── ace-specialist-agent.md
        ├── list-architect-agent.md
        ├── integration-agent.md
        ├── performance-agent.md
        ├── css-troubleshooting-agent.md
        └── ui-review-agent.md
```

### Notes

- **Core agents** (Developer, QA Specialist, UI/UX basics) remain in the main CLAUDE.md for always-on access
- **Specialized agents** are loaded on-demand to keep context focused
- **Multiple agents** can be loaded in sequence for complex tasks
- When in doubt about which agent to use, describe your task and ask for a recommendation
```

---

## Instructions

1. Open your existing `CLAUDE.md` at `C:\Projects\SPFx\JML_SPO\CLAUDE.md`
2. Find the existing "Additional Specialized Agents" section (from the earlier snippet)
3. Replace it entirely with the content above (everything between the ``` markers)
4. Save the file

## File Naming for Your docs/agents/ Folder

Rename the downloaded files to match the reference:

| Downloaded File | Rename To |
|-----------------|-----------|
| `JML_Testing_Toolkit_Addon.md` | `testing-toolkit-agent.md` |
| `JML_Project_Librarian_Optimizer_Agent_Prompt.md` | `librarian-optimizer-agent.md` |
| `JML_SPFx_UIUX_Design_Agent_Prompt.md` | `uiux-design-agent.md` |
| `JML_ACE_Specialist_Agent.md` | `ace-specialist-agent.md` |
| `JML_SharePoint_List_Architect_Agent.md` | `list-architect-agent.md` |
| `JML_Graph_Integration_Agent.md` | `integration-agent.md` |
| `JML_Performance_Optimization_Agent.md` | `performance-agent.md` |
| `JML_CSS_Troubleshooting_Agent.md` | `css-troubleshooting-agent.md` |
| `JML_UI_Review_Agent.md` | `ui-review-agent.md` |
