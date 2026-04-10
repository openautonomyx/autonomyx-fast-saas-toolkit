# How We Rebranded a Next.js Dashboard to IBM Carbon Design System in 3 Commits (and Kept First Load JS Under 102 KB)

**TL;DR:** We replaced a dark-themed, purple-accented Next.js dashboard with IBM Carbon Design System v11 — hand-building six primitives instead of pulling in `@carbon/react`. The result: matching Carbon's visual language exactly, same ~102 KB First Load JS, 480 lines of component code the team now owns. Here's the decision process, the code, the numbers, and what would have broken if we'd made the other choice.

- **Project:** [openautonomyx/autonomyx-fast-saas-toolkit](https://github.com/openautonomyx/autonomyx-fast-saas-toolkit) — the dashboard for a 22-module enterprise SaaS launchpad
- **Package:** `packages/dashboard`
- **Stack:** Next.js 15 App Router, React 19, Tailwind CSS v4, IBM Plex fonts
- **Rebrand commits:** `cc34c09` → `e3aafd5` → `6b36b1a`

---

## The starting point

The original dashboard was built in one commit (`b9b323a`) as a dark-themed command center using the Autonomyx brand palette: background `#080A10`, primary purple `#7B5CF0`, accent green `#00D28C`, Fraunces serif headings, DM Sans body. It looked fine. It shipped. Users found it.

But the more we sat with it, the more it felt like *another startup dashboard*. Rounded corners, gradient accents, a serif hero — the same aesthetic decisions you'd find on every Y Combinator batch demo day. For a product whose value proposition is "boring enterprise infrastructure, done right," that aesthetic was working against us. We wanted the dashboard to feel like **IBM Cloud**, not like **another Linear clone**.

Two weeks after the initial dashboard shipped, I opened a new branch to rebrand it against IBM Carbon Design System v11.

---

## Why Carbon

Carbon is IBM's open-source design system. It's the visual language behind IBM Cloud, Watson, and Think — products that serve tens of thousands of enterprise teams doing unglamorous, high-stakes work. The Carbon aesthetic is deliberate:

- **Sharp corners everywhere.** No `border-radius` anywhere. Carbon uses this as a design principle — rounded corners are informal, sharp corners are professional.
- **14 px base body text** with `letter-spacing: 0.16px`, `line-height: 1.28572`. These specific numbers come from the `body-01` type token. You hit them exactly or you don't match Carbon.
- **8-point grid** for spacing. Not 4-point, not arbitrary. Every gap, padding, and margin is a multiple of 8 pixels.
- **Gray 100 ramp** for neutrals: `#f4f4f4` (gray-10), `#e0e0e0` (gray-20), `#c6c6c6` (gray-30) … through `#161616` (gray-100). These hex values are published in `@carbon/colors` and treated as sacred.
- **Blue 60 (`#0f62fe`) as the single primary interaction color.** Not blue-500, not `#3B82F6` — specifically `#0f62fe`, which is called `interactive-01` in the Carbon token vocabulary.
- **IBM Plex Sans and IBM Plex Mono** as the fonts. Google Fonts hosts both; Carbon won't feel right in anything else.

What we liked about Carbon wasn't just the aesthetic. It was the discipline. Every value is a token. Every token has a name. Every decision is documented in a spec page on [carbondesignsystem.com](https://carbondesignsystem.com). There's no "what should the button height be" debate — Carbon says 32 / 40 / 48 pixels for small / medium / large, and if you disagree you're not using Carbon.

For a dashboard that's going to grow into 20+ pages of admin tooling, that kind of discipline was worth more than any visual opinion we had.

---

## The decision that shaped everything: `@carbon/react` or hand-build?

Carbon ships an official React component library: [`@carbon/react`](https://www.npmjs.com/package/@carbon/react). It has ~60 production-ready components — Button, DataTable, Modal, Tabs, Accordion, Breadcrumb, the whole kitchen. Drop it in and your dashboard looks like Carbon overnight.

We looked at it, and didn't use it.

Here's the math that drove the decision. The dashboard needs, by our count, **six** components:

| Component | Where it's used |
|---|---|
| **Shell** (header + side nav + content area) | Every page |
| **Button** | Actions everywhere |
| **TextInput** | Forms (future tenant/user editing) |
| **Modal** | Confirmation dialogs (future tenant delete, plan change) |
| **DataTable** | Overview page's service grid, future tenant/user tables |
| **StatTile** | Overview page's stats bar (4 tiles) |

Six components. `@carbon/react` gives us sixty. Installing the full package to use 10% of its surface area would add roughly **500 KB** of JavaScript to the bundle after tree-shaking — Carbon React is not aggressively tree-shakable because its components cross-reference each other and carry their own CSS-in-JS runtime. Measured against a baseline First Load JS of ~95 KB, that's a **6× increase** in bundle size to get six components we could hand-build from Carbon's published visual specs.

The other option: write the six components ourselves, using Tailwind v4 tokens for the Carbon color palette, `@carbon/icons-react` for the icon set (which is small and tree-shakes cleanly), and plain React for the component behavior. The Carbon spec pages document exact pixel values, exact hex codes, exact behaviors — there's no guesswork involved. Hand-building means maintaining ~500 lines of component code, but those 500 lines are ours, fit exactly our use cases, and don't ship anything we don't use.

We chose hand-building. Here's what that looked like in practice.

---

## Step 1: tokens first

The entire Carbon design system lives in tokens — colors, spacing, type, radius. Tailwind v4 introduced a new `@theme` directive in CSS that lets you declare design tokens and have them work as both Tailwind utility classes and raw CSS custom properties. This is the perfect home for Carbon tokens.

Here's what went into `src/app/globals.css`:

**27 color tokens** covering the Gray 100 ramp (10-100), the Blue 100 ramp (10-80), and status colors (red-60 for errors, green-50 for success, yellow-30 for warnings). Each value is a literal hex from `@carbon/colors` — not a "close enough" approximation. Specifically:

- Gray 10 `#f4f4f4` — page background
- Gray 20 `#e0e0e0` — borders and dividers
- Gray 70 `#525252` — body text
- Gray 100 `#161616` — primary text and the dark header
- Blue 60 `#0f62fe` — primary interactive
- Red 60 `#da1e28` — error / danger
- Green 50 `#24a148` — success

**10 spacing tokens** on the 8-point grid: spacing-01 through spacing-10, mapping to 2px, 4px, 8px, 12px, 16px, 24px, 32px, 40px, 48px, 64px. These become Tailwind classes like `p-[--spacing-05]` or can be used directly in CSS.

**Sharp-corner radius tokens.** All five radius tokens (`--radius-none`, `sm`, `md`, `lg`, `xl`) set to `0`. This was a deliberate override — by default Tailwind uses `--radius-md: 0.375rem` which would create rounded corners anywhere we forgot to override them. Setting them all to zero means we can never accidentally introduce a rounded corner.

**Font variables** for IBM Plex Sans and IBM Plex Mono, loaded via `next/font/google` in `layout.tsx` with the correct weight subsets (300/400/500/600 for Sans, 400/500 for Mono). The fonts are fetched at build time, self-hosted, and served with optimal `font-display: swap` behavior.

**Carbon type scale classes** — `.type-heading-01` through `.type-heading-06`, `.type-body-01`, `.type-body-02`, `.type-label-01`, `.type-code-01`. Each sets the exact font size, weight, line-height, and letter-spacing from Carbon's type spec. Using these instead of arbitrary Tailwind utilities means every heading in the dashboard is guaranteed Carbon-compliant.

**Body default** of 14 px with 0.16 px letter-spacing, antialiased. This is the `body-01` token — Carbon's baseline body text. Every text element in the dashboard inherits this unless explicitly overridden.

The whole design system is one CSS file. 91 lines. That's it.

Committed as `cc34c09`: `feat(dashboard): adopt IBM Carbon Design System tokens and fonts`.

---

## Step 2: primitives (the fun part)

With tokens in place, the six primitives came together quickly. Here are the actual line counts from the final code:

| Primitive | Lines | Carbon spec it matches |
|---|---|---|
| `Button.tsx` | 53 | [Button component](https://carbondesignsystem.com/components/button/usage/) |
| `TextInput.tsx` | 43 | [Text input component](https://carbondesignsystem.com/components/text-input/usage/) |
| `StatTile.tsx` | 44 | [Tile component](https://carbondesignsystem.com/components/tile/usage/) |
| `Shell.tsx` | 96 | [UI Shell pattern](https://carbondesignsystem.com/components/UI-shell-header/usage/) |
| `Modal.tsx` | 107 | [Modal component](https://carbondesignsystem.com/components/modal/usage/) |
| `DataTable.tsx` | 137 | [DataTable component](https://carbondesignsystem.com/components/data-table/usage/) |
| **Total** | **480** | |

A few specific decisions worth calling out:

### Button: 4 kinds × 3 sizes, no CSS-in-JS

Carbon specifies four button kinds — primary (blue-60), secondary (gray-80), tertiary (outlined blue), ghost (text-only), and danger (red-60) — and three sizes (32 / 40 / 48 pixels tall). The hand-built `Button.tsx` uses two lookup objects:

- `KIND_STYLES: Record<Kind, string>` mapping each kind to its Tailwind classes for background, text color, hover state, active state, and disabled state
- `SIZE_STYLES: Record<Size, string>` mapping each size to its height and padding classes

One JSX expression composes both with an optional `className` override and `forwardRef` for use in forms. 53 lines total, strictly typed, zero runtime CSS generation.

Carbon React's Button is ~300 lines and ships with its own SCSS compiler output. Ours is 53 lines of TypeScript plus whatever classes Tailwind compiles. The visual result is identical.

### DataTable: rendered the "if you have a row link, wrap the whole row in an anchor" idiom

Carbon's DataTable spec says clickable rows should be fully accessible — clicking anywhere in the row should navigate, not just the text in one cell. Most Carbon React usage achieves this with an `onRowClick` handler, which is keyboard-hostile (needs manual ARIA handling). Our DataTable accepts an optional `rowHref(row)` prop and, when present, wraps each cell's content in a Next.js `<Link>`. The row is fully accessible by default — Tab focuses it, Enter navigates it, screen readers announce it as a link. No handler gymnastics.

This is a small detail that matters for accessibility and was easier to get right in hand-built code than in patched third-party components.

### Shell: the 48 + 256 layout

Carbon's UI Shell is a pattern, not a component: a 48-pixel-tall black header fixed to the top of the viewport, a 256-pixel-wide white side nav fixed to the left, and content offset by both. The hand-built `Shell.tsx` is straight Tailwind — `fixed top-0 left-0 right-0 h-12` for the header, `fixed top-12 left-0 bottom-0 w-64` for the sidebar, `ml-64 mt-12` for the main content area. Zero JavaScript, pure layout.

The side nav has a `NAV_ITEMS` array with 7 items: Overview (active), Tenants, Users, Billing, Workflows, AI, Settings. Four are marked `disabled: true` as placeholders for pages that don't exist yet — they render in gray-40 with `cursor-not-allowed` instead of being clickable links. This is a Carbon pattern: disabled nav items stay visible so users can see what's coming without being able to click into half-built pages.

Icons come from `@carbon/icons-react`, which **does** tree-shake cleanly — we import only the 8 icons we need (Dashboard, Enterprise, User, ChartLineData, Flow, Ai, Settings, Logout, Close, CheckmarkFilled, WarningAltFilled, CircleDash) and get ~5 KB of added bundle size instead of the full icon catalog.

### Modal: ESC dismiss and click-outside handling

Modals are the most behavior-heavy primitive. Carbon's spec requires: ESC key dismisses, clicking the overlay dismisses, clicking inside the modal doesn't dismiss, focus is trapped inside while open, and primary/secondary buttons are full-width in the footer split 50/50. The hand-built `Modal.tsx` uses a `useEffect` for keyboard event binding, `stopPropagation` on the inner div to prevent overlay bubbling, and two flex-1 buttons for the footer.

107 lines. The Carbon React modal is closer to 500 and ships with a focus-trap library bolted on.

Committed as `e3aafd5`: `feat(dashboard): hand-built Carbon primitives (no Carbon React dep)`.

---

## Step 3: rewire the overview page

With tokens and primitives in place, the overview page needed to be rewired. The pre-rebrand version used a `ServiceCard` component for each of the 22 services, laid out in a responsive grid. The Carbon way is to show tabular data in a **DataTable**.

The rebrand replaces the card grid with a single DataTable, grouped by layer. Here's how the new `ServiceGrid.tsx` works:

1. Iterate over the 5 groups in display order: essential → core → ops → growth → ai
2. For each group, render a 36-pixel-tall group header row with the group's color swatch and name
3. Below the header, render the services in that group as standard DataTable rows with five columns: Status icon | Service name | Description | URL (clickable) | Latency (mono)
4. Use `CheckmarkFilled` / `WarningAltFilled` / `CircleDash` from `@carbon/icons-react` for the status column

The `StatsBar.tsx` got simpler: the old version had a 4-up grid of custom card components. The new version uses the shared `StatTile` primitive for each of the four tiles (Tenants, Users, API Calls, Services) with 1-pixel gaps in gray-20 between them to create the Carbon "data tile grid" look.

`ServiceCard.tsx` was deleted — its job is now done by the DataTable row pattern inside `ServiceGrid`. **Minus 60 lines** of code in exchange for a more information-dense layout.

Committed as `6b36b1a`: `refactor(dashboard): convert overview to Carbon DataTable pattern`.

---

## The numbers

Three commits. Here's what they did in diff-stat form:

```
 packages/dashboard/package.json                   |  10 +-
 packages/dashboard/src/app/globals.css            | 101 ++++++++++++---
 packages/dashboard/src/app/layout.tsx             |  51 ++++----
 packages/dashboard/src/app/page.tsx               |  37 +++---
 packages/dashboard/src/components/Button.tsx      |  53 ++++++++
 packages/dashboard/src/components/DataTable.tsx   | 137 ++++++++++++++++++++
 packages/dashboard/src/components/Modal.tsx       | 107 ++++++++++++++++
 packages/dashboard/src/components/ServiceCard.tsx |  60 ---------
 packages/dashboard/src/components/ServiceGrid.tsx | 145 ++++++++++++++++------
 packages/dashboard/src/components/Shell.tsx       |  96 ++++++++++++++
 packages/dashboard/src/components/StatTile.tsx    |  44 +++++++
 packages/dashboard/src/components/StatsBar.tsx    |  44 +++----
 packages/dashboard/src/components/TextInput.tsx   |  43 +++++++
 packages/dashboard/tsconfig.json                  |  29 ++++-
 14 files changed, 758 insertions(+), 199 deletions(-)
```

**Net: +559 lines.** That's the whole cost of the rebrand. 480 of those lines are the new primitives; the rest is tokens, layout wiring, and the DataTable-pattern rewrite of the overview.

The performance numbers from `pnpm build` on the final commit:

- **Compile time:** 3 seconds (unchanged from pre-rebrand)
- **First Load JS:** 102 KB (`chunks/695` = 45.3 KB, `chunks/d99d8e6a` = 54.2 KB, shared = 1.9 KB, page = 123 B)
- **Static pages generated:** 4
- **Runtime Carbon dependency:** zero (only `@carbon/icons-react` which tree-shakes to ~5 KB)

For comparison, installing `@carbon/react` and using a handful of its components typically adds 400-600 KB to First Load JS depending on which components you import. The hand-built approach keeps the bundle essentially unchanged while delivering the full Carbon visual language.

---

## What would have gone wrong with `@carbon/react`

Worth being explicit about what we gave up by not using the official library:

- **60 components for free**, not 6. If the dashboard grows to need Tabs, Accordion, Breadcrumb, Dropdown, DatePicker, FileUploader — we'd have to hand-build each of those too. `@carbon/react` already has them.
- **Documented accessibility.** Carbon React has been audited and tested. Our hand-built primitives rely on us reading the spec correctly. A subtle focus-trap bug in our Modal would need to be found and fixed by us, not caught by Carbon's test suite.
- **Upstream updates.** If IBM ships a new Carbon version with updated tokens, `@carbon/react` users get it by bumping a version. We'd need to diff our `globals.css` against the new spec manually.

And what we gained:

- **102 KB First Load JS** instead of ~500+ KB. For an internal tool dashboard, this difference is imperceptible — but it matters for caching, for rendering on slow connections, and for keeping the app light enough to load instantly.
- **Zero CSS-in-JS runtime.** Carbon React uses emotion internally. Our primitives use Tailwind utility classes compiled at build time. No runtime CSS generation, no style recalculation, no emotion hash collisions.
- **Complete ownership.** Every line of our component code is legible to the team. When something looks wrong, we can find it in ~500 lines of TypeScript instead of spelunking through node_modules.
- **Exact fit.** Our `DataTable` has the exact features we use — row linking, group headers, toolbar actions — and none of the features we don't. Carbon React's DataTable is much larger because it has to cover sortable columns, selection checkboxes, pagination, filtering, and about ten other features we don't need yet.

---

## When you should make the opposite call

The hand-built-Carbon approach is right for us because:

1. We need **fewer than 10 components**. The moment the count crosses that threshold, the maintenance cost of hand-building starts to exceed the bundle savings.
2. We have **full control over the design system**. No external team is going to tell us "use these Carbon React props to match our updated spec." Our tokens are our tokens.
3. Our users are **engineers and admins**, not end consumers. We don't need Carbon's full accessibility test suite because our test suite is real users running it every day.
4. The dashboard is **part of a larger codebase** we already own. Adding 480 lines of primitives is a rounding error on top of ~5,400 lines of TypeScript.

If your dashboard is 40+ pages with every Carbon component used somewhere, if your team rotates design ownership frequently, or if your users include people who rely on assistive tech, you should absolutely use `@carbon/react`. The 500 KB is a fair price for not reinventing the wheel 60 times.

The point isn't that hand-building is always right. The point is that **you should run the math** before adding a design system as a dependency. Count the components you actually need, benchmark the bundle delta, look at what the library ships that you'll never use. Sometimes the answer is the official library. Sometimes it's 480 lines of CSS and TSX.

---

## The result

Three commits later, the dashboard looks like IBM Cloud. Black 48-pixel header with the Autonomyx wordmark. 256-pixel white side nav with 7 menu items. Light gray content area with a 4-up stats grid and a DataTable showing 22 services grouped by layer. Sharp corners everywhere. IBM Plex Sans for body, IBM Plex Mono for latency values and code. Blue 60 links, red 60 errors, green 50 success checks.

102 KB First Load JS. 3 second build. 480 lines of primitive code we own.

The difference it makes is psychological as much as visual. When a user lands on the dashboard, they don't see "another startup dashboard" — they see an enterprise tool that takes itself seriously. For a product whose entire value proposition is "take SaaS infrastructure seriously so you can take your product seriously," that's worth more than any component library download count.

---

## Links

- **Repository:** [github.com/openautonomyx/autonomyx-fast-saas-toolkit](https://github.com/openautonomyx/autonomyx-fast-saas-toolkit)
- **Dashboard package:** [packages/dashboard](https://github.com/openautonomyx/autonomyx-fast-saas-toolkit/tree/main/packages/dashboard)
- **Rebrand commits:**
  - [`cc34c09` feat(dashboard): adopt IBM Carbon Design System tokens and fonts](https://github.com/openautonomyx/autonomyx-fast-saas-toolkit/commit/cc34c09)
  - [`e3aafd5` feat(dashboard): hand-built Carbon primitives (no Carbon React dep)](https://github.com/openautonomyx/autonomyx-fast-saas-toolkit/commit/e3aafd5)
  - [`6b36b1a` refactor(dashboard): convert overview to Carbon DataTable pattern](https://github.com/openautonomyx/autonomyx-fast-saas-toolkit/commit/6b36b1a)
- **Carbon Design System:** [carbondesignsystem.com](https://carbondesignsystem.com)
- **Carbon React (official library):** [npmjs.com/package/@carbon/react](https://www.npmjs.com/package/@carbon/react)
- **Carbon Icons React (tree-shakes):** [npmjs.com/package/@carbon/icons-react](https://www.npmjs.com/package/@carbon/icons-react)
- **Full toolkit case study:** [building-the-fast-saas-toolkit.md](../building-the-fast-saas-toolkit.md)
