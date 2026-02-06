# Add to CLAUDE.md - Design Standards Agent

> Add this entry to your existing Agent Directory table:

---

## Agent Directory (add this row)

| # | Agent | File | Focus |
|---|-------|------|-------|
| 11 | **Design Standards** | `docs/agents/design-standards-agent.md` | Visual standards, naming conventions, compliance |

---

## Quick Reference by Task (add these rows)

| Task | Agent to Load |
|------|---------------|
| "What color for this button?" | Design Standards |
| "How should I name this file?" | Design Standards |
| "Check my component styles" | Design Standards |
| "What's the correct spacing?" | Design Standards |
| "Webpart naming convention?" | Design Standards |
| "SharePoint list naming?" | Design Standards |
| "Full compliance audit" | Design Standards |

---

## Invocation

```
"Read docs/agents/design-standards-agent.md"
```

or

```
"Load the Design Standards agent"
```

---

## What It Covers

**Visual Standards:**
- Colors (Primary, Teal, Gold, Semantic, Neutral, Process types)
- Typography (10 sizes, weights, line heights)
- Spacing (4px grid system)
- Buttons, Cards, Forms, Tables, Tabs, Headers, Footers
- Empty states, Loading states, Message bars
- Responsive breakpoints, Z-index scale

**Naming Conventions:**
- Webpart naming (titles, folders, aliases)
- File naming (components, services, hooks, models)
- SharePoint list naming
- CSS class naming (BEM + modules)
- TypeScript/code naming

**Critical Rules Embedded:**
- Teal (#03787C) for action buttons
- Green (#107c10) for status only
- "Manager" not "Management"
- JML prefix on all titles
- 4px spacing grid
