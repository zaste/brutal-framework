#!/usr/bin/env node
// BRUTAL V5 - Feature Preservation Matrix
// Maps features across all implementations to ensure nothing is lost

const fs = require('fs');
const path = require('path');

const PACKAGES_DIR = path.join(__dirname, '../../packages/@brutal');
const OUTPUT_PATH = path.join(__dirname, 'feature-preservation-matrix.json');

const featureMatrix = {
  timestamp: new Date().toISOString(),
  packages: {}
};

// Package-specific feature extractors
const FEATURE_EXTRACTORS = {
  templates: {
    patterns: [
      { regex: /compile|parse/, feature: 'compilation' },
      { regex: /render/, feature: 'rendering' },
      { regex: /expression|\\$\\{/, feature: 'expressions' },
      { regex: /if|conditional/, feature: 'conditionals' },
      { regex: /for|each|loop/, feature: 'loops' },
      { regex: /filter/, feature: 'filters' },
      { regex: /cache/, feature: 'caching' },
      { regex: /escape|sanitize/, feature: 'escaping' },
      { regex: /directive/, feature: 'directives' },
      { regex: /ast|tree/, feature: 'ast' }
    ]
  },
  components: {
    patterns: [
      { regex: /lifecycle|connected|disconnected/, feature: 'lifecycle' },
      { regex: /state|setState/, feature: 'state' },
      { regex: /props|attributes/, feature: 'props' },
      { regex: /render/, feature: 'rendering' },
      { regex: /event|addEventListener/, feature: 'events' },
      { regex: /shadow|shadowRoot/, feature: 'shadow-dom' },
      { regex: /slot/, feature: 'slots' },
      { regex: /observe|mutation/, feature: 'observers' },
      { regex: /style|css/, feature: 'styling' },
      { regex: /register|define/, feature: 'registration' }
    ]
  },
  state: {
    patterns: [
      { regex: /store|createStore/, feature: 'store' },
      { regex: /subscribe|listener/, feature: 'subscriptions' },
      { regex: /dispatch|action/, feature: 'actions' },
      { regex: /reducer/, feature: 'reducers' },
      { regex: /selector/, feature: 'selectors' },
      { regex: /middleware/, feature: 'middleware' },
      { regex: /computed/, feature: 'computed' },
      { regex: /reactive|proxy/, feature: 'reactivity' },
      { regex: /persist/, feature: 'persistence' },
      { regex: /devtools/, feature: 'devtools' }
    ]
  },
  routing: {
    patterns: [
      { regex: /route|path/, feature: 'routes' },
      { regex: /navigate|push/, feature: 'navigation' },
      { regex: /history/, feature: 'history' },
      { regex: /params|parameter/, feature: 'params' },
      { regex: /query/, feature: 'query' },
      { regex: /guard|before/, feature: 'guards' },
      { regex: /lazy|dynamic/, feature: 'lazy-loading' },
      { regex: /match/, feature: 'matching' },
      { regex: /link/, feature: 'links' },
      { regex: /redirect/, feature: 'redirects' }
    ]
  }
};

function extractFeatures(pkgName, filePath) {
  const features = new Set();
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const extractor = FEATURE_EXTRACTORS[pkgName];
    
    if (extractor) {
      extractor.patterns.forEach(({ regex, feature }) => {
        if (regex.test(content)) {
          features.add(feature);
        }
      });
    }
    
    // Generic feature detection
    if (/async|await|Promise/.test(content)) features.add('async');
    if (/error|throw|catch/.test(content)) features.add('error-handling');
    if (/test|spec|jest/.test(content)) features.add('testing');
    if (/Worker|worker/.test(content)) features.add('workers');
    if (/performance|optimize/.test(content)) features.add('performance');
    
  } catch (e) {
    console.warn(`Could not analyze ${filePath}`);
  }
  
  return features;
}

function analyzePackage(pkgName) {
  console.log(`📊 Analyzing features in @brutal/${pkgName}...`);
  
  const pkgPath = path.join(PACKAGES_DIR, pkgName);
  const srcPath = path.join(pkgPath, 'src');
  
  if (!fs.existsSync(srcPath)) {
    console.log(`  ⚠️  No src directory found`);
    return {};
  }
  
  const implementations = {};
  
  // Find all implementations
  function scanDir(dir, implName = 'main') {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Special handling for known implementation directories
        if (['compiler', 'core', 'engine', 'base', 'minimal'].includes(item)) {
          scanDir(fullPath, item);
        } else {
          scanDir(fullPath, implName);
        }
      } else if (item.endsWith('.ts') && !item.endsWith('.test.ts')) {
        // Determine implementation name
        let impl = implName;
        if (item === 'minimal.ts') impl = 'minimal';
        else if (item === 'index.ts' && implName === 'main') impl = 'index';
        else if (item.includes('minimal')) impl = 'ultra-minimal';
        
        if (!implementations[impl]) {
          implementations[impl] = {
            files: [],
            features: new Set()
          };
        }
        
        implementations[impl].files.push(path.relative(srcPath, fullPath));
        const features = extractFeatures(pkgName, fullPath);
        features.forEach(f => implementations[impl].features.add(f));
      }
    });
  }
  
  scanDir(srcPath);
  
  // Convert sets to arrays and create matrix
  const matrix = {};
  Object.keys(implementations).forEach(impl => {
    matrix[impl] = {
      files: implementations[impl].files.length,
      features: Array.from(implementations[impl].features)
    };
  });
  
  // Summary
  const allFeatures = new Set();
  Object.values(implementations).forEach(impl => {
    impl.features.forEach(f => allFeatures.add(f));
  });
  
  console.log(`  ✅ Implementations: ${Object.keys(implementations).length}`);
  console.log(`  ✅ Total features: ${allFeatures.size}`);
  
  return {
    implementations: matrix,
    allFeatures: Array.from(allFeatures),
    summary: {
      implementationCount: Object.keys(implementations).length,
      featureCount: allFeatures.size
    }
  };
}

// Analyze all packages
console.log('🔍 Creating Feature Preservation Matrix...\n');

const CORE_PACKAGES = [
  'foundation', 'shared', 'events', 'templates', 'components',
  'state', 'routing', 'cache', 'http', 'validation', 'animation', 'testing'
];

CORE_PACKAGES.forEach(pkg => {
  featureMatrix.packages[pkg] = analyzePackage(pkg);
  console.log('');
});

// Save matrix
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(featureMatrix, null, 2));

// Generate summary report
console.log('📋 FEATURE PRESERVATION SUMMARY');
console.log('==============================\n');

Object.entries(featureMatrix.packages).forEach(([pkg, data]) => {
  if (data.summary && data.summary.implementationCount > 1) {
    console.log(`${pkg}:`);
    console.log(`  Implementations: ${data.summary.implementationCount}`);
    console.log(`  Total features: ${data.summary.featureCount}`);
    
    // Check feature coverage
    const implNames = Object.keys(data.implementations);
    const featureCoverage = {};
    
    data.allFeatures.forEach(feature => {
      featureCoverage[feature] = implNames.filter(impl => 
        data.implementations[impl].features.includes(feature)
      ).length;
    });
    
    const missingFeatures = Object.entries(featureCoverage)
      .filter(([_, count]) => count < implNames.length)
      .map(([feature, count]) => `${feature} (${count}/${implNames.length})`);
    
    if (missingFeatures.length > 0) {
      console.log(`  ⚠️  Inconsistent features: ${missingFeatures.join(', ')}`);
    }
    console.log('');
  }
});

console.log(`✅ Feature matrix saved to: ${OUTPUT_PATH}`);