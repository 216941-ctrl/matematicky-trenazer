# Math App — Czech High School Math Practice

## Project overview
A static web application where students practice high school math problems. Hosted on GitHub Pages and shared via Moodle.

## Tech stack
- **Frontend**: Pure HTML + CSS + JavaScript (no framework, no bundler, no npm)
- **Hosting**: GitHub Pages (serves `index.html` from repository root)
- **Data**: JSON files in `data/` — one file per topic
- **Integration**: Shared with students via Moodle link

## Directory structure
```
index.html          — main page (GitHub Pages entry point)
src/                — JS modules and CSS
data/               — JSON question sets (one file per topic)
tasks/              — agent task files
tests/              — data validation scripts
.claude/agents/     — custom agents
```

## Question data format
All problems are stored as JSON arrays in `data/<topic>.json`. Each object:

```json
{
  "id": "kv-001",
  "topic": "kvadratické rovnice",
  "type": "equation",
  "difficulty": 1,
  "question": "Vyřeš rovnici: $x^2 - 5x + 6 = 0$",
  "answer": "$x_1 = 2, x_2 = 3$",
  "hint": "Použij diskriminant nebo faktorizaci.",
  "solution_steps": ["krok 1", "krok 2"],
  "theory": "Obecná metoda pro tento typ příkladu a vzorce.",
  "intuition": "Grafické nebo praktické přiblížení.",
  "graph": {
    "fn": "x^2 - 5*x + 6",
    "xDomain": [-1, 6],
    "yDomain": [-2, 8],
    "points": [{"x": 2, "label": "x₁"}, {"x": 3, "label": "x₂"}]
  }
}
```

**Required:** `id`, `topic`, `type`, `difficulty`, `question`, `answer`  
**Always add:** `hint`, `solution_steps`, `theory`, `intuition`  
**Add where applicable:** `graph` (equations, functions), `covers` (mix only)

### Difficulty levels
- `1` — Basic: direct formula application, one method, minimal algebra
- `2` — Intermediate: multiple steps, domain conditions, combining rules
- `3` — Advanced: substitution, non-obvious method, or combining multiple concepts

### Graph field
Include `graph` wherever a function or geometric object can be visualized:
- Equations → plot both sides or the expression set to 0
- Inequalities → shade solution region
- Trig → unit circle description or sin/cos curve
- Logarithms → log curve with key point

For mix/system problems use `"type": "points"` with coordinates instead of `fn`.

## Data rules
- **Problems live only in `data/*.json` files** — never inline in HTML or JS
- **Every new problem must be verified by `math-verifier` (sympy) before being written**
- Full criteria in `data/EXAMPLE_CRITERIA.md`

## Math verification rule
**Every new problem and its solution MUST be verified by the `example-creator` or `math-verifier` agent before being added to a data file.** This runs Python/sympy to confirm the solution is mathematically correct.

## Git / deployment
- **Never commit or push without explicit instruction from the user.**
- Deployment = `git push` to `main` branch → GitHub Pages auto-updates.
- When the user says to publish/update, then run git operations.

## Agent roles
| Agent | Purpose |
|-------|---------|
| `orchestrator` | Manages full workflow: plan → verify math → implement → test → review |
| `planner` | Splits tasks into `tasks/TASK-XXX-*.md` files |
| `math-verifier` | Verifies problem + solution correctness using sympy (REQUIRED before adding questions) |
| `implementor` | Implements planned tasks, updates task status |
| `tester` | Validates JSON data files and HTML structure |
| `reviewer` | Reviews implemented tasks, approves or requests rework |

## Language
- Code and comments: English
- All UI text, labels, messages: Czech
