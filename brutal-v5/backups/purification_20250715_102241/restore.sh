#!/bin/bash
echo "🔄 Restoring from backup..."
rm -rf ../../packages
cp -r packages ../../packages
echo "✅ Packages restored"
