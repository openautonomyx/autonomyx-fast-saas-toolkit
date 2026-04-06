#!/usr/bin/env bash
set -euo pipefail

# Autonomyx Fast SaaS Toolkit — Skill Installer
# Installs the Claude Code skill to ~/.claude/skills/fast-saas-toolkit/

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$HOME/.claude/skills/fast-saas-toolkit"

echo "Installing fast-saas-toolkit skill..."

# Create skill directory
mkdir -p "$SKILL_DIR/templates"

# Copy skill file
cp "$SCRIPT_DIR/SKILL.md" "$SKILL_DIR/SKILL.md"

# Copy templates
cp "$SCRIPT_DIR/templates/"*.json "$SKILL_DIR/templates/"

echo "✓ Installed to $SKILL_DIR"
echo ""
echo "Usage: /fast-saas-toolkit in Claude Code"
echo ""
echo "Modes:"
echo "  Scaffold  — 'create a new SaaS project'"
echo "  Configure — 'set up billing plans'"
echo "  Convert   — 'turn this into a SaaS'"
echo "  Deploy    — 'deploy to production'"
echo "  Diagnose  — 'why is auth down?'"
