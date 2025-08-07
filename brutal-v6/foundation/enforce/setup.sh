#!/bin/bash
# Setup BRUTAL Foundation enforcement
# Run this once to install all enforcement mechanisms

echo "🛡️  Setting up BRUTAL Foundation enforcement..."

# Get the root directory
ROOT_DIR=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$ROOT_DIR"

# 1. Install pre-commit hook
echo "📎 Installing pre-commit hook..."
mkdir -p .git/hooks
cp foundation/enforce/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# 2. Create npm scripts
echo "📝 Adding npm scripts..."
if [ -f package.json ]; then
  # Check if scripts section exists
  if ! grep -q '"scripts"' package.json; then
    # Add scripts section
    sed -i '/"name":/a\  "scripts": {},' package.json
  fi
  
  # Add foundation scripts (using node to properly handle JSON)
  node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  pkg.scripts = pkg.scripts || {};
  pkg.scripts['foundation:validate'] = 'node -r ./foundation/validate.js -e \"validate(\\'.\\').then(r => console.log(r.summary))\"';
  pkg.scripts['foundation:fix'] = 'node -r ./foundation/validate.js -e \"validate(\\'.\\', {fix: true}).then(r => console.log(r.summary))\"';
  pkg.scripts['foundation:monitor'] = 'node ./foundation/enforce/monitor.js';
  
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
  "
fi

# 3. Create GitHub Actions workflow
echo "🔧 Setting up GitHub Actions..."
mkdir -p .github/workflows
cp foundation/enforce/ci.yml .github/workflows/foundation-validation.yml

# 4. Add foundation check to .gitignore
echo "📄 Updating .gitignore..."
if [ -f .gitignore ]; then
  if ! grep -q "foundation/*.js" .gitignore; then
    echo -e "\n# Foundation compiled files\nfoundation/*.js\nfoundation/*.d.ts" >> .gitignore
  fi
else
  echo -e "# Foundation compiled files\nfoundation/*.js\nfoundation/*.d.ts" > .gitignore
fi

# 5. Compile foundation for immediate use
echo "🔨 Compiling foundation..."
cd foundation
npx tsc *.ts --module commonjs --target es2020 2>/dev/null || {
  echo "⚠️  TypeScript not found. Install with: npm install -D typescript"
}
cd ..

echo "
✅ BRUTAL Foundation enforcement installed!

🚀 Quick Start:
  - npm run foundation:validate   # Check for violations
  - npm run foundation:fix       # Auto-fix violations
  - npm run foundation:monitor   # Start continuous monitoring

🛡️  Protection Active:
  - Pre-commit validation ✓
  - GitHub Actions CI ✓
  - Runtime monitoring ✓

⚠️  Important:
  - Commits will be BLOCKED if validation fails
  - CI will fail PRs with violations
  - No bypasses are possible
"