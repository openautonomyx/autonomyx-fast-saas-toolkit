# Case Studies

In-depth writeups on how parts of the Autonomyx Fast SaaS Toolkit
were designed and built. Written for engineers who want to understand
the decisions, trade-offs, and numbers — not marketing.

## Available case studies

| File | Topic | Length |
|---|---|---|
| [building-the-fast-saas-toolkit.md](./building-the-fast-saas-toolkit.md) | Full story of how a 22-module enterprise SaaS launchpad came together in 25 commits | ~2,800 words |

## What makes a good case study here

- **Ground truth**: every number in a case study should be verifiable with
  `git log`, `wc -l`, or `find` — no rounded estimates, no "about 5,000 lines"
- **Decision-focused**: explain *why* choices were made, not just *what* was
  built. The alternatives considered, the trade-offs accepted.
- **Honest about scope**: include a "what it doesn't do" section. Silent
  omissions are the worst kind of misleading.
- **Commit-anchored**: reference specific commit SHAs where relevant so
  readers can `git show` any claim.

## Proposing a new case study

Open a PR adding a markdown file to this directory. Good candidates:
- A specific architectural decision and its alternatives
- A production incident and how it shaped the code
- A refactor with measurable before/after numbers
- A spec-conformance exercise (e.g., the Carbon rebrand)
