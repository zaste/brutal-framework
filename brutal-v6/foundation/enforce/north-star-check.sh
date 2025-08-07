#!/bin/bash
# North Star Check - Runs before every commit
# Reminds developers of the true goal

echo "
🔥 NORTH STAR CHECK - NO COMPROMISE 🔥
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8.5KB must do EVERYTHING that matters from React's 300KB+
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MANDATORY CAPABILITIES:
✓ Reactive Components (like useState, useEffect)
✓ Global State (like Redux but simpler)
✓ SPA Routing (like React Router)
✓ Animations (like Framer Motion)
✓ Data Fetching (like SWR)
✓ Form Handling (like React Hook Form)

Ask yourself:
1. Does this commit prove 8.5KB > 300KB?
2. Or are we becoming 'React-lite'?

If #2: DELETE YOUR WORK. RE-READ decisions/009.

Remember: If it doesn't provoke 'this is impossible', we've failed.
"

# Check current size
if [ -d "packages" ]; then
  TOTAL_SIZE=$(find packages -name "*.js" -o -name "*.ts" | xargs wc -c | tail -1 | awk '{print $1}')
  TOTAL_KB=$((TOTAL_SIZE / 1024))
  
  echo "📊 Current total size: ${TOTAL_KB}KB / 8.5KB"
  
  if [ $TOTAL_KB -gt 9 ]; then
    echo "❌ OVER BUDGET! Every byte from here must REPLACE existing code."
  fi
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Don't block commit, just remind
exit 0