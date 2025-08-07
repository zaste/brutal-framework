#!/bin/bash
# BRUTAL V5 - Emergency Rollback Script
# Quick rollback to main branch state

echo "🚨 EMERGENCY ROLLBACK INITIATED"
echo "This will:"
echo "  - Discard ALL changes in purification-v5 branch"
echo "  - Restore packages from main branch"
echo "  - Switch back to main branch"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Rolling back..."
    
    # Stash any uncommitted changes
    git stash push -m "purification-rollback-$(date +%s)"
    
    # Checkout main
    git checkout main
    
    # Reset packages to main state
    git checkout main -- packages/
    git checkout main -- foundation/
    
    echo "✅ Rollback complete"
    echo "📌 Your changes were stashed and can be recovered with: git stash list"
else
    echo "❌ Rollback cancelled"
fi