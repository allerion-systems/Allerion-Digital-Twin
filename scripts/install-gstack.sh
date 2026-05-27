#!/usr/bin/env bash
# Installs garrytan/gstack into ~/.claude/skills/gstack and runs its setup.
# Run this once on a fresh machine. gstack provides global Claude Code skills
# (CEO, Eng Manager, QA, Designer, Browser, etc.) used across every project.
#
# Allerion-specific construction skills live in this repo's .claude/skills/
# directory and auto-load alongside gstack when Claude Code opens this
# project.

set -euo pipefail

GSTACK_DIR="${HOME}/.claude/skills/gstack"

if [ -d "${GSTACK_DIR}/.git" ]; then
  echo "gstack already installed at ${GSTACK_DIR} — pulling latest"
  cd "${GSTACK_DIR}" && git pull --ff-only
else
  echo "Cloning gstack to ${GSTACK_DIR}"
  mkdir -p "$(dirname "${GSTACK_DIR}")"
  git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git "${GSTACK_DIR}"
fi

cd "${GSTACK_DIR}"
echo "Running gstack setup"
./setup

cat <<EOF

gstack installed at ${GSTACK_DIR}.
Allerion-local construction skills live in .claude/skills/ in this repo.
Both load automatically when you open Claude Code in this directory.

Global gstack skills available: /office-hours, /plan-ceo-review, /plan-eng-review,
/design-review, /review, /ship, /qa, /browse, /autoplan, /retro, /investigate,
/cso, /careful, /freeze, /guard, /unfreeze, /learn, /gstack-upgrade, and more.

Allerion construction skills available in this repo:
/office-hours (overridden — construction founder variant), /doctrine, /safety,
/geo, /permit, /equipment.

See .claude/skills/README.md for details.
See BATTLE_PLAN.md for the strategy this stack supports.
EOF
