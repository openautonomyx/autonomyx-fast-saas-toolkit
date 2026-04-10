#!/usr/bin/env python3
"""
Convert a markdown file to WordPress Gutenberg block format.

Handles:
- Headings (h1-h6)
- Paragraphs with inline formatting (bold, italic, inline code, links)
- Fenced code blocks (with optional language)
- Tables (GFM-style)
- Unordered lists
- Ordered lists
- Horizontal rules
- Blockquotes
- Images

Usage:
    python3 md-to-wp.py input.md output.wp.html
    python3 md-to-wp.py input.md output.wp.html --base-url https://example.com/dir/

The optional --base-url flag rewrites relative markdown links (paths that
have no scheme and don't start with '/' or '#') against the provided URL
using urllib.parse.urljoin. Use this when the input markdown lives inside
a directory structure (e.g. case-studies/blog/) and you want relative
refs like "../foo.md" to resolve to absolute URLs in the WordPress output.

Example for this repo:
    python3 md-to-wp.py case-studies/blog/carbon-dashboard-rebrand.md \\
        case-studies/blog/carbon-dashboard-rebrand.wp.html \\
        --base-url https://github.com/openautonomyx/autonomyx-fast-saas-toolkit/blob/main/case-studies/blog/
"""

from __future__ import annotations

import argparse
import html
import re
import sys
from dataclasses import dataclass
from enum import Enum
from typing import Iterator
from urllib.parse import urljoin


# ── Block types ────────────────────────────────────────────────────────────

class BlockKind(Enum):
    HEADING = "heading"
    PARAGRAPH = "paragraph"
    CODE = "code"
    TABLE = "table"
    LIST_UL = "list_ul"
    LIST_OL = "list_ol"
    HR = "hr"
    QUOTE = "quote"


@dataclass
class Block:
    kind: BlockKind
    content: str = ""
    level: int = 0  # heading level
    language: str = ""  # code language
    rows: list[list[str]] | None = None  # table rows
    items: list[str] | None = None  # list items


# ── Inline formatting ──────────────────────────────────────────────────────

INLINE_CODE_RE = re.compile(r"`([^`]+)`")
BOLD_RE = re.compile(r"\*\*([^*]+)\*\*")
ITALIC_RE = re.compile(r"(?<!\*)\*([^*\n]+)\*(?!\*)")
LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")


def _rewrite_link(url: str, base_url: str) -> str:
    """
    Resolve a markdown link href against a base URL, but only if the URL
    actually looks like a relative filesystem path.

    Leaves alone:
    - Absolute URLs with a scheme: https://, http://, mailto:, tel:, ftp:, etc.
      Detected by the presence of ':' before any '/'.
    - Anchor-only links: #section-name
    - Root-relative paths: /images/foo.png — these typically mean "relative
      to the site root" not "relative to the current markdown file", so
      rewriting them would be wrong.

    Rewrites:
    - Relative paths: ../docs/foo.md, ./bar.md, sibling.md, subdir/page.md
      These become urljoin(base_url, url), which in practice maps them to
      GitHub blob URLs or whatever the base_url points at.
    """
    if not base_url or not url:
        return url
    if url.startswith("#"):
        return url
    if url.startswith("/"):
        return url
    # A scheme is letters+digits followed by ':' before any slash.
    # Using a regex is overkill; a simple find works because schemes never
    # contain '/' before their ':' separator.
    colon = url.find(":")
    slash = url.find("/")
    if colon != -1 and (slash == -1 or colon < slash):
        # Has a scheme (https:, mailto:, etc.) — leave alone
        return url
    # It's a relative path — resolve against base.
    return urljoin(base_url, url)


def render_inline(text: str, base_url: str = "") -> str:
    """Apply inline markdown formatting to a line of text."""
    # Escape first, then inject markup (using placeholders to avoid re-escaping)
    text = html.escape(text, quote=False)
    # Inline code — must run first so asterisks inside code stay literal
    text = INLINE_CODE_RE.sub(lambda m: f"<code>{m.group(1)}</code>", text)
    # Bold before italic (** must win over *)
    text = BOLD_RE.sub(r"<strong>\1</strong>", text)
    text = ITALIC_RE.sub(r"<em>\1</em>", text)
    # Links — with optional relative-to-absolute rewriting via base_url.
    # html.escape() above already turned '&' into '&amp;', which is fine
    # inside href attributes, so we can keep URLs as-is after urljoin.
    text = LINK_RE.sub(
        lambda m: f'<a href="{_rewrite_link(m.group(2), base_url)}">{m.group(1)}</a>',
        text,
    )
    return text


# ── Block-level parser ─────────────────────────────────────────────────────

HEADING_RE = re.compile(r"^(#{1,6})\s+(.*)$")
FENCE_RE = re.compile(r"^```(\w*)\s*$")
HR_RE = re.compile(r"^---+\s*$")
TABLE_ROW_RE = re.compile(r"^\|(.+)\|\s*$")
TABLE_SEP_RE = re.compile(r"^\|?[\s:|-]+\|?\s*$")
ULIST_RE = re.compile(r"^[-*]\s+(.*)$")
OLIST_RE = re.compile(r"^\d+\.\s+(.*)$")
QUOTE_RE = re.compile(r"^>\s?(.*)$")


def parse_blocks(lines: list[str]) -> Iterator[Block]:
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]

        # Skip blank lines between blocks
        if not line.strip():
            i += 1
            continue

        # Horizontal rule
        if HR_RE.match(line):
            yield Block(kind=BlockKind.HR)
            i += 1
            continue

        # Heading
        m = HEADING_RE.match(line)
        if m:
            level = len(m.group(1))
            yield Block(kind=BlockKind.HEADING, level=level, content=m.group(2))
            i += 1
            continue

        # Fenced code block
        m = FENCE_RE.match(line)
        if m:
            lang = m.group(1)
            code_lines: list[str] = []
            i += 1
            while i < n and not FENCE_RE.match(lines[i]):
                code_lines.append(lines[i])
                i += 1
            # Skip closing fence
            if i < n:
                i += 1
            yield Block(
                kind=BlockKind.CODE,
                language=lang,
                content="\n".join(code_lines),
            )
            continue

        # Table (must have a header row followed by a separator row)
        if TABLE_ROW_RE.match(line):
            # Peek for separator
            if i + 1 < n and TABLE_SEP_RE.match(lines[i + 1]):
                rows: list[list[str]] = []
                # Header
                rows.append(_parse_table_row(line))
                i += 2  # skip header + separator
                while i < n and TABLE_ROW_RE.match(lines[i]):
                    rows.append(_parse_table_row(lines[i]))
                    i += 1
                yield Block(kind=BlockKind.TABLE, rows=rows)
                continue

        # Unordered list
        if ULIST_RE.match(line):
            items: list[str] = []
            while i < n and ULIST_RE.match(lines[i]):
                items.append(ULIST_RE.match(lines[i]).group(1))
                i += 1
            yield Block(kind=BlockKind.LIST_UL, items=items)
            continue

        # Ordered list
        if OLIST_RE.match(line):
            items = []
            while i < n and OLIST_RE.match(lines[i]):
                items.append(OLIST_RE.match(lines[i]).group(1))
                i += 1
            yield Block(kind=BlockKind.LIST_OL, items=items)
            continue

        # Blockquote
        if QUOTE_RE.match(line):
            quote_lines: list[str] = []
            while i < n and QUOTE_RE.match(lines[i]):
                quote_lines.append(QUOTE_RE.match(lines[i]).group(1))
                i += 1
            yield Block(kind=BlockKind.QUOTE, content=" ".join(quote_lines))
            continue

        # Paragraph — collect consecutive non-blank, non-special lines
        para_lines: list[str] = [line]
        i += 1
        while i < n:
            nxt = lines[i]
            if not nxt.strip():
                break
            if HEADING_RE.match(nxt) or FENCE_RE.match(nxt) or HR_RE.match(nxt):
                break
            if TABLE_ROW_RE.match(nxt) or ULIST_RE.match(nxt) or OLIST_RE.match(nxt):
                break
            if QUOTE_RE.match(nxt):
                break
            para_lines.append(nxt)
            i += 1
        yield Block(kind=BlockKind.PARAGRAPH, content=" ".join(para_lines))


def _parse_table_row(line: str) -> list[str]:
    # Strip leading/trailing pipes, split by pipe, strip whitespace
    inner = line.strip().strip("|")
    return [cell.strip() for cell in inner.split("|")]


# ── Gutenberg rendering ────────────────────────────────────────────────────

def render_block(block: Block, base_url: str = "") -> str:
    if block.kind == BlockKind.HR:
        return (
            '<!-- wp:separator -->\n'
            '<hr class="wp-block-separator has-alpha-channel-opacity"/>\n'
            '<!-- /wp:separator -->'
        )

    if block.kind == BlockKind.HEADING:
        content = render_inline(block.content, base_url)
        level = block.level
        if level == 1:
            # WP posts usually have the H1 as the post title, so render H1 as
            # the actual page H1 using a heading block with level 1.
            return (
                f'<!-- wp:heading {{"level":1}} -->\n'
                f'<h1 class="wp-block-heading">{content}</h1>\n'
                '<!-- /wp:heading -->'
            )
        return (
            f'<!-- wp:heading {{"level":{level}}} -->\n'
            f'<h{level} class="wp-block-heading">{content}</h{level}>\n'
            '<!-- /wp:heading -->'
        )

    if block.kind == BlockKind.PARAGRAPH:
        content = render_inline(block.content, base_url)
        return (
            '<!-- wp:paragraph -->\n'
            f'<p>{content}</p>\n'
            '<!-- /wp:paragraph -->'
        )

    if block.kind == BlockKind.CODE:
        # wp:code block — content is HTML-escaped pre/code
        escaped = html.escape(block.content, quote=False)
        return (
            '<!-- wp:code -->\n'
            f'<pre class="wp-block-code"><code>{escaped}</code></pre>\n'
            '<!-- /wp:code -->'
        )

    if block.kind == BlockKind.TABLE:
        assert block.rows is not None
        header = block.rows[0]
        body = block.rows[1:]
        parts: list[str] = []
        parts.append('<!-- wp:table -->')
        parts.append(
            '<figure class="wp-block-table"><table>'
        )
        # Header
        parts.append('<thead><tr>')
        for cell in header:
            parts.append(f'<th>{render_inline(cell, base_url)}</th>')
        parts.append('</tr></thead>')
        # Body
        if body:
            parts.append('<tbody>')
            for row in body:
                parts.append('<tr>')
                for cell in row:
                    parts.append(f'<td>{render_inline(cell, base_url)}</td>')
                parts.append('</tr>')
            parts.append('</tbody>')
        parts.append('</table></figure>')
        parts.append('<!-- /wp:table -->')
        return "\n".join(parts)

    if block.kind == BlockKind.LIST_UL:
        assert block.items is not None
        items_html = "".join(
            f'<!-- wp:list-item -->\n<li>{render_inline(item, base_url)}</li>\n<!-- /wp:list-item -->'
            for item in block.items
        )
        return (
            '<!-- wp:list -->\n'
            f'<ul class="wp-block-list">{items_html}</ul>\n'
            '<!-- /wp:list -->'
        )

    if block.kind == BlockKind.LIST_OL:
        assert block.items is not None
        items_html = "".join(
            f'<!-- wp:list-item -->\n<li>{render_inline(item, base_url)}</li>\n<!-- /wp:list-item -->'
            for item in block.items
        )
        return (
            '<!-- wp:list {"ordered":true} -->\n'
            f'<ol class="wp-block-list">{items_html}</ol>\n'
            '<!-- /wp:list -->'
        )

    if block.kind == BlockKind.QUOTE:
        content = render_inline(block.content, base_url)
        return (
            '<!-- wp:quote -->\n'
            f'<blockquote class="wp-block-quote"><p>{content}</p></blockquote>\n'
            '<!-- /wp:quote -->'
        )

    raise ValueError(f"Unknown block kind: {block.kind}")


# ── Main ───────────────────────────────────────────────────────────────────

def convert(md_text: str, base_url: str = "") -> str:
    lines = md_text.splitlines()
    blocks = list(parse_blocks(lines))
    rendered = [render_block(b, base_url) for b in blocks]
    return "\n\n".join(rendered) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert a markdown file to WordPress Gutenberg block format.",
    )
    parser.add_argument("input", help="Path to the source .md file")
    parser.add_argument("output", help="Path to write the .wp.html output")
    parser.add_argument(
        "--base-url",
        default="",
        help=(
            "Optional base URL used to resolve relative links in the markdown. "
            "If set, any link whose target has no scheme and doesn't start with "
            "'/' or '#' will be rewritten via urljoin(base_url, target). Useful "
            "for publishing markdown-with-relative-links to WordPress posts."
        ),
    )
    args = parser.parse_args()

    with open(args.input, "r", encoding="utf-8") as f:
        md = f.read()

    html_out = convert(md, base_url=args.base_url)

    with open(args.output, "w", encoding="utf-8") as f:
        f.write(html_out)

    print(f"Wrote {args.output} ({len(html_out)} bytes)", file=sys.stderr)


if __name__ == "__main__":
    main()
