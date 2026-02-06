# CLAUDE.md Agent Reference Snippet

Add this section to the end of your existing `CLAUDE.md` file:

---

```markdown
---

## Additional Specialized Agents (Load on Demand)

The following specialized agents are available for specific tasks. Load them by asking Claude to read the file before starting the task.

### Available Agents

| Agent | File | Use When |
|-------|------|----------|
| **Testing Toolkit** | `docs/agents/testing-toolkit-agent.md` | Generating unit tests, creating mock data factories, Jest setup, coverage analysis |
| **Librarian & Optimizer** | `docs/agents/librarian-optimizer-agent.md` | Project cleanup, documentation organization, health checks, folder structure |
| **UI/UX Design Expert** | `docs/agents/uiux-design-agent.md` | Visual design standards, component styling, accessibility, design system documentation |

### How to Invoke

**Option 1 - Direct load:**
```
Read docs/agents/testing-toolkit-agent.md and then generate unit tests for EmployeeCard
```

**Option 2 - Session switch:**
```
Load the Librarian agent from docs/agents/librarian-optimizer-agent.md
```

**Option 3 - Quick reference:**
```
Using the Testing Toolkit, run a coverage analysis
```

### Agent Collaboration

These agents are designed to work together:

- **QA Agent** identifies testing gaps → **Testing Toolkit** generates the tests
- **UI/UX Designer** creates design standards → **Librarian** files the documentation
- **Developer** completes a feature → **Librarian** runs a health check → **QA Agent** validates

### Storage Locations

Ensure agent files are stored in:
```
C:\Projects\SPFx\JML_SPO\docs\agents\
├── testing-toolkit-agent.md
├── librarian-optimizer-agent.md
└── uiux-design-agent.md
```
```

---

## Instructions

1. Open your existing `CLAUDE.md` at `C:\Projects\SPFx\JML_SPO\CLAUDE.md`
2. Scroll to the end of the file
3. Copy everything between the ``` markers above
4. Paste at the end of your CLAUDE.md
5. Save the file

Your agent ecosystem is now fully documented and discoverable!
