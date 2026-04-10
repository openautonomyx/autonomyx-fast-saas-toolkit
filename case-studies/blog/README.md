# Blog Posts

Short, focused technical posts about specific decisions and refactors
inside the Autonomyx Fast SaaS Toolkit. Each post targets a single
topic and tells its story in ~1,500–3,000 words.

For long-form case studies covering an entire feature or rebuild,
see the parent [case-studies/](../) directory.

## Posts

| File | Topic | Length |
|---|---|---|
| [carbon-dashboard-rebrand.md](./carbon-dashboard-rebrand.md) | How the Next.js dashboard was rebranded to IBM Carbon Design System in 3 commits — `@carbon/react` vs hand-built, the 480-line primitive set, and how First Load JS stayed under 102 KB | ~3,000 words |

## WordPress versions

Each post has a paired `.wp.html` file in WordPress Gutenberg block
format. Paste the contents into the WordPress block editor for a
clean import — paragraphs, tables, lists, code blocks, and separators
all appear as native blocks.

The `.wp.html` files are generated from the markdown sources using
[`../md-to-wp.py`](../md-to-wp.py) with the `--base-url` flag set so
relative cross-links resolve to absolute GitHub URLs.

## Proposing a new post

Open a PR adding a markdown file here. Good blog post material:

- A small refactor with a clear before/after
- A specific feature decision and the alternatives you considered
- A library evaluation (X vs Y vs Z) grounded in real numbers from your project
- A production incident that taught a lesson worth keeping
- A migration story (one tool to another, one stack to another)

Same standards as the long-form case studies: ground every number in
a verifiable command, explain *why* not just *what*, and be honest
about what didn't work.
