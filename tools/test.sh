#!/usr/bin/env bash
# Build with test hooks, then run every regression. Needs node; the browser tests need Playwright + Chromium.
#   tools/test.sh          stub tests (fast, no browser)
#   tools/test.sh --all    stub tests + browser tests
set -e
cd "$(dirname "$0")/.."
python3 tools/build.py --tests
cd tests
for t in gstub.js chtest_run.js galtest_run.js cptest_run.js bosstest_run.js ch3test_run.js bal_run.js; do
  echo "== $t"; node "$t" | tail -4 | cut -c1-240
done
if [ "$1" = "--all" ]; then
  cd browser; mkdir -p bx
  for t in fin.cjs beast.cjs beast2.cjs sec.cjs dl.cjs mobile.cjs aim.cjs focus.cjs entrance.cjs; do echo "== browser/$t"; node "$t" | tail -3 | cut -c1-240; done
fi
