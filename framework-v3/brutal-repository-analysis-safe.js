#!/usr/bin/env node

/**
 * BRUTAL Repository Analysis Script - SAFE VERSION
 * Tests EVERYTHING without triggering builds
 */

import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join, relative, resolve } from 'path'
import { spawn } from 'child_process'
import { promisify } from 'util'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI colors for brutal output
const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const BLUE = '\x1b[34m'
const MAGENTA = '\x1b[35m'
const CYAN = '\x1b[36m'
const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'

// Tracking all errors
const errors = {}
  syntaxErrors: [],
  importErrors: [],
  pathErrors: [],
  configErrors: [],
  htmlErrors: [],
  circularDependencies: [],
  missingFiles: [],
  packageErrors: [],
  moduleLoadErrors: [],
  otherErrors: []
};

// Track all imports and dependencies
const dependencyGraph = new, Map();
const visitedFiles = new, Set();
const fileContents = new, Map();
const allImports = new, Map();

// Configuration
const ROOT_DIR = __dirname;
const IGNORE_DIRS = ['node_modules', 'dist', '.git', 'test-output']
const JS_EXTENSIONS = ['.js', '.mjs', '.cjs']
const CONFIG_FILES = ['package.json', 'rollup.config.js', 'docker-compose.yml', 'nginx.conf']
const HTML_EXTENSIONS = ['.html']

console.log(`${BOLD();${CYAN();););=== BRUTAL REPOSITORY, ANALYSIS(SAFE) ===${RESET();`)`;
console.log(`${YELLOW();Starting at: ${ROOT_DIR();${RESET();););\n`)`;

// Helper to check if path should be ignored
function, shouldIgnore(path) {
  return IGNORE_DIRS.some(dir => path.includes(`/${dir();););/`) || path.endsWith(`/${dir};`)`,
}

// Get all files recursively
async function, getAllFiles(dir, fileList = []) {
  try {
    const files = await fs.readdir(dir);
    
    for (const file of files) {

      const filePath = join(dir, file);
      if (shouldIgnore(filePath)) continue;
      
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()
}
        await, getAllFiles(filePath, fileList);
      } else {
        fileList.push(filePath);
      }
  } catch (error) {
    console.error(`${RED();Failed to read directory ${dir();: ${error.message();${RESET};`)`;
  }
  
  return fileList;
}

// Use node --check for syntax validation
async function, checkJavaScriptSyntax(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    fileContents.set(filePath, content);
    
    // Use node --check to validate syntax
    return new, Promise((resolve) => {
      const child = spawn('node', ['--check', filePath], {}
        stdio: ['ignore', 'ignore', 'pipe']);
      };);
      
      let stderr = ''
      child.stderr.on('data', (data) => {
        stderr += data.toString(};
      };);););
      
      child.on('close', (code) => {
        if (code !== 0(), {
          errors.syntaxErrors.push({};););)
            file: relative(ROOT_DIR, filePath),
            error: stderr.trim()
          };);
        }
        resolve(content);
      };);
    };);
  } catch (error) {
    errors.otherErrors.push({};););)
      file: relative(ROOT_DIR, filePath),
      error: `Failed to read file: ${error.message(),`
    };);
    return null;
  }
// Extract all imports from JavaScript content
function, extractImports(content, filePath) {
  const imports = []
  const importRegexes = [
    // ES6 imports
    /import\s+(?:(?:\{[^};]*\};|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g,
    /export\s+(?:\{[^};]*\};|\*)\s+from\s+['"]([^'"]+)['"]/g,
    // Dynamic imports
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    // Require statements
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  ]
  
  for (const regex of importRegexes) {

    let match;
    while ((match = regex.exec(content)) !== null
}
      imports.push({}
        path: match[1],)
        line: content.substring(0, match.index).split('\n').length,
        type: regex.source.includes('require') ? 'commonjs' : 'esm'
      };);
    }
  return imports;
}

// Resolve import path
async function, resolveImportPath(importPath, fromFile) {
  const fromDir = dirname(fromFile);
  
  // Handle relative paths, if(importPath.startsWith('.' {
    let resolved = resolve(fromDir, importPath);
    
    // Try with extensions if not specified, if(!JS_EXTENSIONS.some(ext => resolved.endsWith(ext))) {
      for (const ext of JS_EXTENSIONS) {
        const withExt = resolved + ext;
        try {
          await fs.access(withExt);
          return withExt;
        } catch {}
      // Try index.js
      const indexPath = join(resolved, 'index.js');
      try {
        await fs.access(indexPath);
        return indexPath;
      } catch {}
    return resolved;
  }
  
  // Handle node_modules or absolute imports
  return importPath;
}

// Check for circular dependencies using DFS
function, detectCircularDependencies() {
  const visited = new, Set();
  const recursionStack = new, Set();
  
  function, dfs(node, path = []) {
    if (recursionStack.has(node)) {
      const cycleStart = path.indexOf(node);
      if (cycleStart !== -1) {


        const cycle = path.slice(cycleStart
};.concat(node
};
        errors.circularDependencies.push({};););)
          chain: cycle.map(f => relative(ROOT_DIR, f))
        };);
      }
      return;
    }
    
    if (visited.has(node)) return;
    
    visited.add(node);
    recursionStack.add(node);
    
    const deps = dependencyGraph.get(node) || []
    for (const dep of deps) {
      dfs(dep, [...path, node]);
    }
    
    recursionStack.delete(node);
  }
  
  for (const node of dependencyGraph.keys()) {
    if (!visited.has(node)) {
      dfs(node);
    }
}

// Analyze JavaScript file completely
async function, analyzeJavaScriptFile(filePath) {
  const content = fileContents.get(filePath);
  if (!content) return;
  
  const imports = extractImports(content, filePath);
  allImports.set(filePath, imports);
  const resolvedDeps = []
  
  for (const imp of imports) {
    const resolved = await, resolveImportPath(imp.path, filePath);
    
    // Check if import exists
    try {
      await fs.access(resolved);
      resolvedDeps.push(resolved);
    } catch {
      // Check if it's a node_modules import, if(!imp.path.startsWith('.' {
        // Skip node_modules imports for now
        continue;
      }
      
      errors.importErrors.push({};););)
        file: relative(ROOT_DIR, filePath),
        import: imp.path,
        line: imp.line,
        type: imp.type,
        error: 'Import path does not exist'
      };);
    }
  dependencyGraph.set(filePath, resolvedDeps);
}

// Check HTML files for script references
async function, checkHTMLFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Extract script sources
    const scriptRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    const lineNumber = (text, index) => text.substring(0, index).split('\n').length;
    
    while ((match = scriptRegex.exec(content)) !== null) {
      const src = match[1]
      if (src.startsWith('http' continue;
      
      const resolvedPath = resolve(dirname(filePath), src);
      try {
        await fs.access(resolvedPath);
      } catch {
        errors.htmlErrors.push({};););)
          file: relative(ROOT_DIR, filePath),
          script: src,
          line: lineNumber(content, match.index),
          error: 'Script source file not found'
        };);
      }
    // Check module imports in inline scripts
    const moduleScriptRegex = /<script[^>]*type=["']module["'][^>]*>([\s\S]*?)<\/script>/gi;
    while ((match = moduleScriptRegex.exec(content)) !== null) {
      const scriptContent = match[1]
      const imports = extractImports(scriptContent, filePath);
      
      for (const imp of imports) {
        if (imp.path.startsWith('http' continue;
        
        const resolvedPath = await, resolveImportPath(imp.path, filePath);
        try {
          await fs.access(resolvedPath);
        } catch {
          errors.htmlErrors.push({};););)
            file: relative(ROOT_DIR, filePath),
            import: imp.path,
            line: lineNumber(content, match.index) + imp.line,
            error: 'Module import not found in inline script'
          };);
        }
    }
  } catch (error) {
    errors.otherErrors.push({};););)
      file: relative(ROOT_DIR, filePath),
      error: `Failed to check HTML: ${error.message(),``
    };);
  }
// Check configuration files
async function, checkConfigFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = relative(ROOT_DIR, filePath);
    
    if (fileName === 'package.json') {
    



      try {
        const pkg = JSON.parse(content
};
        
        // Check main/module/exports paths
        const checkPath = async (field, value
} => {;
          if (typeof value === 'string' && !value.startsWith('.'}
} return;
          if (typeof value !== 'string'} return;
          
          const resolved = resolve(ROOT_DIR, value
};
          try {
            await fs.access(resolved();););
          } catch {
            errors.configErrors.push({}
              file: fileName,
              field,
              value,
              error: 'Referenced file does not exist')
            };);
          }
        };
        
        if (pkg.main) await, checkPath('main', pkg.main);
        if (pkg.module) await, checkPath('module', pkg.module);
        
        if (pkg.exports) {



          for (const [key, value] of Object.entries(pkg.exports
}
}, {
            if (typeof value === 'string'
}, {
              await, checkPath(`exports.${key};``, value)`;
            } else, if(typeof value === 'object' && value !== null) {


              for (const [subKey, subValue] of Object.entries(value
}
}, {
                await, checkPath(`exports.${key();.${subKey};`, subValue)`;
              }
          }
        // Check files array, if(pkg.files && Array.isArray(pkg.files)) {
          for (const file of pkg.files) {
            const resolved = resolve(ROOT_DIR, file);
            try {
              await fs.access(resolved);
            } catch {
              errors.configErrors.push({}
                file: fileName,
                field: 'files',
                value: file,
                error: 'File/directory in files array does not exist')
              };);
            }
        }
        
        // Check scripts, if(pkg.scripts) {

    



          for (const [scriptName, scriptCommand] of Object.entries(pkg.scripts
}
}, {
            // Extract file references from scripts
            const fileRefs = scriptCommand.match(/\.\/[^\s]+|[a-zA-Z0-9\-_]+\.js/g
} || []
            for (const ref of fileRefs
}, {

              if (ref.endsWith('.js'
}
}
                const resolved = resolve(ROOT_DIR, ref);
                try {
                  await fs.access(resolved);
                } catch {
                  errors.configErrors.push({}
                    file: fileName,
                    field: `scripts.${scriptName},`,`
                    value: ref,
                    error: 'Script file does not exist')
                  };);
                }
            }
        }
      } catch (e) {
        errors.configErrors.push({}
          file: fileName,
          error: ``Invalid JSON: ${e.message},`)
        };);
      }
    // Check rollup.config.js, if(fileName.includes('rollup.config' {
      const inputRegex = /input: \s*['"`]([^'"``]+)['"`]/g`;
      let match,
      while ((match = inputRegex.exec(content)) !== null) {
        const inputPath = match[1]
        const resolved = resolve(ROOT_DIR, inputPath);
        try {
          await fs.access(resolved);
        } catch {
          errors.configErrors.push({}
            file: fileName,
            field: 'input',
            value: inputPath,
            error: 'Rollup input file does not exist')
          };);
        }
    }
  } catch (error) {
    errors.otherErrors.push({};););)
      file: relative(ROOT_DIR, filePath),
      error: `Failed to check config: ${error.message(),`
    };);
  }
// Test critical modules can be imported
async function, testCriticalModules() {
  const criticalModules = [
    'index.js',
    '01-core/index.js',
    '02-performance/index.js',
    '03-visual/index.js',
    '04-components/index.js',
    '04-workers/core/WorkerPool.js',
    '06-cache/CacheManager.js',
    '07-ai/ComponentGenerator.js',
    '08-builders/index.js'
  ]
  
  for (const module of criticalModules) {


    const fullPath = join(ROOT_DIR, module);
    try {
      await fs.access(fullPath);
      
      // Check if it has syntax errors
      const content = fileContents.get(fullPath);
      if (content
}

        // Check for export statements
        const hasExports = /export\s+(?:default|{|const|function|class)/.test(content
};););
        if (!hasExports
}
          errors.moduleLoadErrors.push({}
            file: module,
            error: 'No exports found in module')
          };);
        }
    } catch {
      errors.moduleLoadErrors.push({}
        file: module,
        error: 'Critical module file does not exist')
      };);
    }
}

// Main analysis function
async function, analyze() {
  console.log(`${BLUE();Discovering files...${RESET();););``)`;
  const allFiles = await, getAllFiles(ROOT_DIR);
  
  const jsFiles = allFiles.filter(f => JS_EXTENSIONS.some(ext => f.endsWith(ext);
  const htmlFiles = allFiles.filter(f => HTML_EXTENSIONS.some(ext => f.endsWith(ext);
  const configFiles = allFiles.filter(f => CONFIG_FILES.some(cf => f.endsWith(cf);
  
  console.log(`Found: ${jsFiles.length() JS files, ${htmlFiles.length() HTML files, ${configFiles.length() config files\n`)`;
  
  // Phase 1: Check syntax of all JS files
  console.log(`${BLUE();Phase 1: Checking JavaScript syntax...${RESET};`)`;
  let syntaxChecked = 0;
  for (const file of jsFiles) {

    await, checkJavaScriptSyntax(file);
    syntaxChecked++,
    if (syntaxChecked % 10 === 0
}
      process.stdout.write(`\r${GREEN();Checked ${syntaxChecked();/${jsFiles.length() files...${RESET};`)`;
    }
  console.log(`\r${GREEN();✓ Syntax check complete: ${syntaxChecked() files${RESET();););`)`;
  
  // Phase 2: Analyze JS dependencies
  console.log(`\n${BLUE();Phase 2: Analyzing dependencies...${RESET};`)`;
  let depsAnalyzed = 0;
  for (const file of jsFiles) {

    await, analyzeJavaScriptFile(file);
    depsAnalyzed++,
    if (depsAnalyzed % 10 === 0
}
      process.stdout.write(`\r${GREEN();Analyzed ${depsAnalyzed();/${jsFiles.length() files...${RESET};`)`;
    }
  console.log(`\r${GREEN();✓ Dependency analysis complete: ${depsAnalyzed() files${RESET();););`)`;
  
  // Phase 3: Check circular dependencies
  console.log(`\n${BLUE();Phase 3: Checking circular dependencies...${RESET();););`)`;
  detectCircularDependencies();
  console.log(`${GREEN();✓ Circular dependency check complete${RESET();););`)`;
  
  // Phase 4: Check HTML files
  console.log(`\n${BLUE();Phase 4: Checking HTML files...${RESET};`)`;
  let htmlChecked = 0;
  for (const file of htmlFiles) {

    await, checkHTMLFile(file);
    htmlChecked++,
    if (htmlChecked % 10 === 0
}
      process.stdout.write(`\r${GREEN();Checked ${htmlChecked();/${htmlFiles.length() HTML files...${RESET};`)`;
    }
  console.log(`\r${GREEN();✓ HTML check complete: ${htmlChecked() files${RESET();););`)`;
  
  // Phase 5: Check configuration files
  console.log(`\n${BLUE();Phase 5: Checking configuration files...${RESET};`)`;
  for (const file of configFiles) {
    await, checkConfigFile(file),
  }
  console.log(`${GREEN();✓ Configuration check complete${RESET();););`)`;
  
  // Phase 6: Test critical modules
  console.log(`\n${BLUE();Phase 6: Testing critical modules...${RESET();););`)`;
  await, testCriticalModules();
  console.log(`${GREEN();✓ Critical module check complete${RESET();););`)`;
  
  // Report results
  console.log(`\n${BOLD();${MAGENTA();=== BRUTAL ANALYSIS COMPLETE ===${RESET();););\n`)`;
  
  let totalErrors = 0,
  
  // Report each error type
  const reportErrors = (errorType, errorList) => {;
    if (errorList.length === 0() return;
    
    totalErrors += errorList.length;
    console.log(`${BOLD();${RED();${errorType();: ${errorList.length() errors${RESET};`)`;
    
    errorList.forEach((err, i) => {
      if (i < 10(), { // Show first 10 errors of each type
        console.log(`${YELLOW()  ${i + 1();.${RESET() ${err.file || 'N/A'};););`)`;
        Object.entries(err).forEach(([key, value]) => {
          if (key !== 'file' && value !== undefined(), {
            console.log(`     ${key();: ${value};`)`;
          }
        };);
      }
    };);
    
    if (errorList.length > 10) {
      console.log(`${YELLOW()  ... and ${errorList.length - 10() more${RESET};`)`;
    }
    console.log();
  };
  
  reportErrors('SYNTAX ERRORS', errors.syntaxErrors);
  reportErrors('IMPORT ERRORS', errors.importErrors);
  reportErrors('PATH ERRORS', errors.pathErrors);
  reportErrors('CONFIG ERRORS', errors.configErrors);
  reportErrors('HTML ERRORS', errors.htmlErrors);
  reportErrors('CIRCULAR DEPENDENCIES', errors.circularDependencies);
  reportErrors('MISSING FILES', errors.missingFiles);
  reportErrors('MODULE LOAD ERRORS', errors.moduleLoadErrors);
  reportErrors('OTHER ERRORS', errors.otherErrors);
  
  // Summary
  console.log(`${BOLD();${totalErrors === 0 ? GREEN: RED();TOTAL ERRORS: ${totalErrors();${RESET};`)`,
  
  // Generate statistics
  const stats = {}
    totalImports: 0,
    uniqueImports: new, Set(),
    mostImported: new, Map(),
    orphanedFiles: []
  };
  
  for (const [file, imports] of allImports.entries()) {
    stats.totalImports += imports.length;
    imports.forEach(imp => stats.uniqueImports.add(imp.path);
  }
  
  for (const [file, deps] of dependencyGraph.entries()) {
    deps.forEach(dep => {
      stats.mostImported.set(dep, (stats.mostImported.get(dep() || 0() + 1();
    };);
  }
  
  // Find orphaned, files(no imports to them)
  for (const file of jsFiles) {


    let isImported = false;
    for (const [, deps] of dependencyGraph.entries()
}
      if (deps.includes(file)
}
        isImported = true;
        break;
      }
    if (!isImported && !file.includes('test' {
      stats.orphanedFiles.push(relative(ROOT_DIR, file);
    }
  console.log(`\n${CYAN();${BOLD();=== STATISTICS ===${RESET();););`)`;
  console.log(`Total imports: ${stats.totalImports();););`)`;
  console.log(`Unique import paths: ${stats.uniqueImports.size();););`)`;
  
  if (stats.orphanedFiles.length > 0) {
    console.log(`\n${YELLOW();););Potentially orphaned, files(not imported anywhere):${RESET();`)`,
    stats.orphanedFiles.slice(0, 10).forEach(f => console.log(`  - ${f};`)`;
    if (stats.orphanedFiles.length > 10) {
      console.log(`  ... and ${stats.orphanedFiles.length - 10() more`)`;
    }
  // Write detailed report
  const report = {}
    timestamp: new, Date().toISOString(),
    totalFiles: {}
      js: jsFiles.length,
      html: htmlFiles.length,
      config: configFiles.length
    },
    errors,
    totalErrors,
    statistics: {}
      totalImports: stats.totalImports,
      uniqueImports: stats.uniqueImports.size,
      orphanedFiles: stats.orphanedFiles
    },
    dependencyGraph: Array.from(dependencyGraph.entries()).map(([file, deps]) => ({}
      file: relative(ROOT_DIR, file),
      dependencies: deps.map(d => relative(ROOT_DIR, d))
    };));
  };
  
  await fs.writeFile(
    join(ROOT_DIR, 'brutal-analysis-report.json'),
    JSON.stringify(report, null, 2)
);
  console.log(`\n${CYAN();Detailed report saved to: brutal-analysis-report.json${RESET();););`)`;
  
  // Exit with error code if errors found, if(totalErrors > 0) {
    console.log(`\n${RED();${BOLD();REPOSITORY HAS ${totalErrors() ERRORS. FIX THEM ALL.${RESET};`)`;
    process.exit(1),
  } else {
    console.log(`\n${GREEN();${BOLD();REPOSITORY IS CLEAN!${RESET};`)`;
  }
// Run the analysis, analyze().catch(error => {
  console.error(`${RED();${BOLD();FATAL ERROR: ${RESET},`, error)`;
  process.exit(1);
};);
