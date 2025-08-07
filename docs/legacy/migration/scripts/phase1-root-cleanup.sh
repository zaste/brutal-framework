#!/bin/bash
# PHASE 1: Root Directory Cleanup

set -e

MIGRATION_DIR="/workspaces/web/migration"
PHASE_LOG="$MIGRATION_DIR/logs/phase1_$(date +%Y%m%d_%H%M%S).log"

echo "🚀 Starting Phase 1: Root Directory Cleanup" | tee "$PHASE_LOG"

# Create target directories
mkdir -p /workspaces/web/docs/01-strategic/{master-plans,roadmaps,business-analysis}
mkdir -p /workspaces/web/docs/02-technical/{architecture,specifications}
mkdir -p /workspaces/web/docs/03-implementation/phases/{phase-1,phase-2,phase-3}
mkdir -p /workspaces/web/docs/04-progress/{daily-logs,weekly-reports,handshakes}
mkdir -p /workspaces/web/docs/05-research
mkdir -p /workspaces/web/docs/archive/{deprecated,experiments}

echo "✅ Created target directory structure" | tee -a "$PHASE_LOG"

# Function for safe file operations
safe_move() {
    local source=$1
    local target=$2
    
    if [[ -f "$source" ]]; then
        # Create target directory if it doesn't exist
        mkdir -p "$(dirname "$target")"
        
        # Move file
        mv "$source" "$target"
        echo "✅ MOVED: $(basename "$source") -> $target" | tee -a "$PHASE_LOG"
        return 0
    else
        echo "⚠️  SKIP: $source (not found)" | tee -a "$PHASE_LOG"
        return 1
    fi
}

# Counter for tracking moves
moved_count=0
skipped_count=0

# Strategic Planning Documents
echo "=== Moving Strategic Planning Documents ===" | tee -a "$PHASE_LOG"

if safe_move "/workspaces/web/STRATEGIC-PLANNING-END-TO-END.md" "/workspaces/web/docs/01-strategic/master-plans/end-to-end-strategy.md"; then
    ((moved_count++))
else
    ((skipped_count++))
fi

if safe_move "/workspaces/web/MASTER-IMPLEMENTATION-ROADMAP-REFORMULATED.md" "/workspaces/web/docs/01-strategic/roadmaps/master-implementation.md"; then
    ((moved_count++))
else
    ((skipped_count++))
fi

if safe_move "/workspaces/web/MASTER-IMPLEMENTATION-ROADMAP-FINAL.md" "/workspaces/web/docs/01-strategic/roadmaps/master-implementation-final.md"; then
    ((moved_count++))
else
    ((skipped_count++))
fi

if safe_move "/workspaces/web/COMPLEX-COMPONENTS-EVOLUTION-STRATEGY.md" "/workspaces/web/docs/01-strategic/business-analysis/complex-components-strategy.md"; then
    ((moved_count++))
else
    ((skipped_count++))
fi

if safe_move "/workspaces/web/VISUAL-DEMONSTRATION-PLATFORM-PLAN.md" "/workspaces/web/docs/01-strategic/business-analysis/visual-demo-platform.md"; then
    ((moved_count++))
else
    ((skipped_count++))
fi

if safe_move "/workspaces/web/MASTER-EXECUTION-PLAN.md" "/workspaces/web/docs/01-strategic/master-plans/execution-plan.md"; then
    ((moved_count++))
else
    ((skipped_count++))
fi

if safe_move "/workspaces/web/QUICK-START.md" "/workspaces/web/docs/01-strategic/quick-start.md"; then
    ((moved_count++))
else
    ((skipped_count++))
fi

# Technical Architecture Documents
echo "=== Moving Technical Architecture Documents ===" | tee -a "$PHASE_LOG"

if safe_move "/workspaces/web/NATIVE-WEB-COMPONENTS-FRAMEWORK-COMPLETE.md" "/workspaces/web/docs/02-technical/architecture/framework-complete.md"; then
    ((moved_count++))
else
    ((skipped_count++))
fi

if safe_move "/workspaces/web/NATIVE-WEB-COMPONENTS-FRAMEWORK-FINAL-DOCUMENTATION.md" "/workspaces/web/docs/02-technical/architecture/framework-final-documentation.md"; then
    ((moved_count++))
else
    ((skipped_count++))
fi

if safe_move "/workspaces/web/NATIVE-WEB-COMPONENTS-FRAMEWORK-FINAL-HANDSHAKE.md" "/workspaces/web/docs/02-technical/architecture/framework-final-handshake.md"; then
    ((moved_count++))
else
    ((skipped_count++))
fi

if safe_move "/workspaces/web/NATIVE-WEB-COMPONENTS-FRAMEWORK-PHASE-I-COMPLETE.md" "/workspaces/web/docs/02-technical/architecture/framework-phase-1-complete.md"; then
    ((moved_count++))
else
    ((skipped_count++))
fi

if safe_move "/workspaces/web/VALIDATION-FRAMEWORK.md" "/workspaces/web/docs/02-technical/specifications/validation-framework.md"; then
    ((moved_count++))
else
    ((skipped_count++))
fi

# Implementation Phase Documents
echo "=== Moving Implementation Phase Documents ===" | tee -a "$PHASE_LOG"

# Phase I documents
for file in /workspaces/web/PHASE-I-*.md; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file" | tr '[:upper:]' '[:lower:]')
        if safe_move "$file" "/workspaces/web/docs/03-implementation/phases/phase-1/$filename"; then
            ((moved_count++))
        else
            ((skipped_count++))
        fi
    fi
done

# Phase II documents
for file in /workspaces/web/PHASE-II-*.md; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file" | tr '[:upper:]' '[:lower:]')
        if safe_move "$file" "/workspaces/web/docs/03-implementation/phases/phase-2/$filename"; then
            ((moved_count++))
        else
            ((skipped_count++))
        fi
    fi
done

# Phase III documents
for file in /workspaces/web/PHASE-III-*.md; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file" | tr '[:upper:]' '[:lower:]')
        if safe_move "$file" "/workspaces/web/docs/03-implementation/phases/phase-3/$filename"; then
            ((moved_count++))
        else
            ((skipped_count++))
        fi
    fi
done

# Implementation plans
for file in /workspaces/web/IMPLEMENTATION-*.md /workspaces/web/PLAN-*.md /workspaces/web/PLANIFICACION-*.md; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file" | tr '[:upper:]' '[:lower:]')
        if safe_move "$file" "/workspaces/web/docs/03-implementation/$filename"; then
            ((moved_count++))
        else
            ((skipped_count++))
        fi
    fi
done

# Progress Tracking Documents
echo "=== Moving Progress Tracking Documents ===" | tee -a "$PHASE_LOG"

# Daily progress logs
for file in /workspaces/web/DAY-*.md; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file" | tr '[:upper:]' '[:lower:]')
        if safe_move "$file" "/workspaces/web/docs/04-progress/daily-logs/$filename"; then
            ((moved_count++))
        else
            ((skipped_count++))
        fi
    fi
done

# Weekly reports
for file in /workspaces/web/WEEK-*.md /workspaces/web/FASE-*.md; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file" | tr '[:upper:]' '[:lower:]')
        if safe_move "$file" "/workspaces/web/docs/04-progress/weekly-reports/$filename"; then
            ((moved_count++))
        else
            ((skipped_count++))
        fi
    fi
done

# Project status documents
if safe_move "/workspaces/web/PROJECT-STATUS-EXECUTIVE-SUMMARY.md" "/workspaces/web/docs/04-progress/weekly-reports/executive-summary.md"; then
    ((moved_count++))
else
    ((skipped_count++))
fi

# Handshake Documents
echo "=== Moving Handshake Documents ===" | tee -a "$PHASE_LOG"

# Context handshakes
for file in /workspaces/web/CONTEXT-*-HANDSHAKE*.md /workspaces/web/*HANDSHAKE*.md; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file" | tr '[:upper:]' '[:lower:]')
        if safe_move "$file" "/workspaces/web/docs/04-progress/handshakes/$filename"; then
            ((moved_count++))
        else
            ((skipped_count++))
        fi
    fi
done

# Window transition documents
for file in /workspaces/web/WINDOW-*.md; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file" | tr '[:upper:]' '[:lower:]')
        if safe_move "$file" "/workspaces/web/docs/04-progress/handshakes/$filename"; then
            ((moved_count++))
        else
            ((skipped_count++))
        fi
    fi
done

# Deprecated/Archive Documents
echo "=== Moving Deprecated Documents ===" | tee -a "$PHASE_LOG"

for file in /workspaces/web/DOCUMENTATION-*.md /workspaces/web/OPERATIONAL-*.md /workspaces/web/SYSTEMATIC-*.md; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file" | tr '[:upper:]' '[:lower:]')
        if safe_move "$file" "/workspaces/web/docs/archive/deprecated/$filename"; then
            ((moved_count++))
        else
            ((skipped_count++))
        fi
    fi
done

# Research and Extension Documents
echo "=== Moving Research Documents ===" | tee -a "$PHASE_LOG"

for file in /workspaces/web/EXTENSION-*.md /workspaces/web/REALIGNED-*.md; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file" | tr '[:upper:]' '[:lower:]')
        if safe_move "$file" "/workspaces/web/docs/05-research/$filename"; then
            ((moved_count++))
        else
            ((skipped_count++))
        fi
    fi
done

# Move remaining POST-PHASE documents
for file in /workspaces/web/POST-*.md; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file" | tr '[:upper:]' '[:lower:]')
        if safe_move "$file" "/workspaces/web/docs/03-implementation/$filename"; then
            ((moved_count++))
        else
            ((skipped_count++))
        fi
    fi
done

# Final verification - check what's left in root
echo "=== Final Root Directory Check ===" | tee -a "$PHASE_LOG"
remaining_md=$(find /workspaces/web -maxdepth 1 -name "*.md" -not -name "README.md" -not -name "CLAUDE.md" | wc -l)
echo "Remaining markdown files in root: $remaining_md" | tee -a "$PHASE_LOG"

if [[ $remaining_md -gt 0 ]]; then
    echo "⚠️  Files still in root:" | tee -a "$PHASE_LOG"
    find /workspaces/web -maxdepth 1 -name "*.md" -not -name "README.md" -not -name "CLAUDE.md" | tee -a "$PHASE_LOG"
fi

# Summary
echo "=== PHASE 1 SUMMARY ===" | tee -a "$PHASE_LOG"
echo "Files moved: $moved_count" | tee -a "$PHASE_LOG"
echo "Files skipped: $skipped_count" | tee -a "$PHASE_LOG"
echo "Files remaining in root: $remaining_md" | tee -a "$PHASE_LOG"

# Create index files for new directory structure
echo "=== Creating Documentation Index Files ===" | tee -a "$PHASE_LOG"

# Create main docs README
cat > /workspaces/web/docs/README.md << 'EOF'
# Native Web Components Framework Documentation

This directory contains the comprehensive documentation for the Native Web Components Framework project.

## Directory Structure

### 01-strategic/
Strategic planning and business analysis documents
- **master-plans/**: High-level strategic roadmaps
- **roadmaps/**: Implementation timelines and milestones
- **business-analysis/**: Market analysis and business strategies

### 02-technical/
Technical documentation and specifications
- **architecture/**: System architecture and framework design
- **specifications/**: Technical specifications and validation frameworks

### 03-implementation/
Implementation guides and phase documentation
- **phases/**: Phase-by-phase implementation details
  - **phase-1/**: Web Components Standards Foundation
  - **phase-2/**: Universal Web APIs Research
  - **phase-3/**: Framework Architecture Implementation

### 04-progress/
Progress tracking and status reports
- **daily-logs/**: Day-by-day progress reports
- **weekly-reports/**: Weekly status summaries
- **handshakes/**: Context transition documentation

### 05-research/
Research documentation and analysis
- Extensions research and exploration

### archive/
Historical and deprecated documentation
- **deprecated/**: Outdated documentation
- **experiments/**: Failed experiments and explorations

## Quick Navigation

- [Strategic Overview](./01-strategic/master-plans/end-to-end-strategy.md)
- [Implementation Roadmap](./01-strategic/roadmaps/master-implementation.md)
- [Framework Architecture](./02-technical/architecture/framework-complete.md)
- [Current Status](./04-progress/weekly-reports/executive-summary.md)
EOF

echo "✅ Created main documentation index" | tee -a "$PHASE_LOG"

echo "✅ Phase 1 completed successfully!" | tee -a "$PHASE_LOG"
echo "📊 Migration Statistics:" | tee -a "$PHASE_LOG"
echo "   - Files moved: $moved_count" | tee -a "$PHASE_LOG"
echo "   - Files skipped: $skipped_count" | tee -a "$PHASE_LOG"
echo "   - Root cleanup: $(expr 54 - $remaining_md) of 54 files moved" | tee -a "$PHASE_LOG"
echo "📄 Detailed log: $PHASE_LOG"