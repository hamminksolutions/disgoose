# Claude Code: Agents & Skills setup for this project

## 1. What the video shows
The video ("5 Claude Code skills I use every single day") is by Matt Pocock and describes his open-source skill set `mattpocock/skills` (MIT license, tens of thousands of GitHub stars). The core idea: AI agents have no memory — every session starts blank. The solution isn't more "vibe coding", but **locking down a strict process in skills** (markdown files with instructions) so Claude Code follows the same, reliable path every time.

His daily pipeline, in order:

1. **`/grill-me`** — a "relentless" interview to sharpen an idea/design before building starts. Surfaces assumptions and edge cases by probing.
2. **`/write-a-prd`** (also `/to-prd`) — turns that shared clarity into a PRD (Product Requirements Document) — a durable reference document.
3. **`/prd-to-issues`** (also `/to-issues`) — cuts the PRD into small, independently buildable "vertical slices" (issues), marked as suitable/not suitable for the AI to execute independently.
4. **`/tdd`** — executes each issue following red-green-refactor: first write a failing test, then the simplest implementation, then clean up.
5. **`/improve-codebase-architecture`** — periodically scans the codebase for "shallow modules" (interface as complex as the implementation behind it) and proposes ways to deepen/consolidate.

## 2. How to apply this to your project

**Step 1 — Install the skill set**
```
npx skills@latest add mattpocock/skills
```
This puts the skills in your `.claude` directory, working within Claude Code.

**Step 2 — Configure per project**
Run `/setup-matt-pocock-skills` — this records where your issue tracker/domain docs live (for a small solo project that can be a local markdown issue list, no GitHub requirement).

**Step 3 — Start with `/grill-me`, fed by your own documents**
Instruct Claude Code: *"Grill me about the PoC requirements in `03-poc-requirements-claude-code.md`, supported by the technical plan in `02-technisch-plan.md`."* This forces you (again, but deeper than I already did above) to surface vague spots in your own plan before any code is written.

**Step 4 — `/write-a-prd`**
Have the outcome of the grilling turned into a formal PRD — this becomes the definitive "source of truth" that `/tdd` will build against.

**Step 5 — `/prd-to-issues`**
Suggestion for the first vertical slices, based on the build order in `03-poc-requirements-claude-code.md` section 7:
- Issue 1: Auth + project skeleton
- Issue 2: Data model + migrations
- Issue 3: MusicBrainz search endpoint + caching
- Issue 4: "Add album" flow
- Issue 5: Profile grid
- Issue 6: Edge cases/empty states

**Step 6 — `/tdd` per issue**
Each issue handled separately, test-first.

**Step 7 — Periodic `/improve-codebase-architecture`**
For example after every 2-3 completed issues, to prevent the codebase (especially with AI-generated code) from becoming a collection of loose, shallow files.

## 3. Extra: project-specific skills worth adding yourself

Matt Pocock's standard set is generic (TypeScript/Node conventions). For this project, there are two custom skills that add a lot of value because they capture knowledge that would otherwise need re-explaining every session:

1. **`musicbrainz-integration` skill** — records: always search at the release-group level (not release level), respect proper rate-limiting/User-Agent headers, always cache results in the own database, and the exact shape of the cached response. Without this skill, every new session risks Claude Code "reinventing" this and implementing it inconsistently.
2. **`design-system` skill** — once Claude Design produces output (colors, typography, component style from `01-design-brief.md`), lock those design tokens into a skill so every UI Claude Code builds stays visually consistent, instead of every screen looking slightly different.

## 4. Hard question to ask yourself
Are you willing to actually take the time for the `/grill-me` → `/write-a-prd` → `/prd-to-issues` steps before letting Claude Code build, or is the temptation strong to just say "build this" right away? The entire value of this process lies in the discipline not to skip straight to code — precisely because that's the trap these skills try to prevent.
