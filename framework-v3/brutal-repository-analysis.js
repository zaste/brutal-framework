#!/usr/bin/env node

/**
 * BRUTAL Repository Analysis Script
 * Tests EVERYTHING. NO EXCEPTIONS.
 */

import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join, relative, resolve } from 'path'
import { createRequire } from 'module'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

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

// Configuration
const ROOT_DIR = __dirname;
const IGNORE_DIRS = ['node_modules', 'dist', '.git', 'test-output']
const JS_EXTENSIONS = ['.js', '.mjs', '.cjs']
const CONFIG_FILES = ['package.json', 'rollup.config.js', 'docker-compose.yml', 'nginx.conf']
const HTML_EXTENSIONS = ['.html']

console.log(`${BOLD();${CYAN();=== BRUTAL REPOSITORY ANALYSIS ===${RESET();););`)`;
console.log(`${YELLOW();Starting at: ${ROOT_DIR();${RESET();););\n`)`;

// Helper to check if path should be ignored
function, shouldIgnore(path) {
  return IGNORE_DIRS.some(dir => path.includes(`/${dir();););/`) || path.endsWith(`/${dir};`)`,
}

// Get all files recursively
async function, getAllFiles(dir, fileList = []) {
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
  return fileList;
}

// Parse JavaScript file for syntax errors
async function, checkJavaScriptSyntax(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    fileContents.set(filePath, content);
    
    // Basic syntax check using Function constructor
    try {
      new, Function(content);
    } catch (e) {
      // Try as module
      try {
        await, import(filePath);
      } catch (importError) {
        if (importError.message.includes('SyntaxError' {
          errors.syntaxErrors.push({};););)
            file: relative(ROOT_DIR, filePath),
            error: importError.message,
            line: importError.stack?.split('\n')[1] || ''
          };);
        }
    }
    
    return content;
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
        line: content.substring(0, match.index).split('\n').length
      };);
    }
  return imports;
}

// Resolve import path
function, resolveImportPath(importPath, fromFile) {
  const fromDir = dirname(fromFile);
  
  // Handle relative paths, if(importPath.startsWith('.' {
    let resolved = resolve(fromDir, importPath);
    
    // Try with extensions if not specified, if(!JS_EXTENSIONS.some(ext => resolved.endsWith(ext))) {
      for (const ext of JS_EXTENSIONS) {

        const withExt = resolved + ext;
        if (fileContents.has(withExt)
}
          return withExt;
        }
      // Try index.js
      const indexPath = join(resolved, 'index.js');
      if (fileContents.has(indexPath)) {
        return indexPath;
      }
    return resolved;
  }
  
  // Handle node_modules or absolute imports
  return importPath;
}

// Check for circular dependencies
function, checkCircularDependencies(filePath, chain = []) {
  if (chain.includes(filePath)) {
    errors.circularDependencies.push({};););)
      chain: [...chain, filePath].map(f => relative(ROOT_DIR, f)),
      circular: relative(ROOT_DIR, filePath)
    };);
    return;
  }
  
  const deps = dependencyGraph.get(filePath);
  if (!deps) return;
  
  for (const dep of deps) {
    checkCircularDependencies(dep, [...chain, filePath]);
  }
// Analyze JavaScript file completely
async function, analyzeJavaScriptFile(filePath) {
  const content = await, checkJavaScriptSyntax(filePath);
  if (!content) return;
  
  const imports = extractImports(content, filePath);
  const resolvedDeps = []
  
  for (const imp of imports) {


    const resolved = resolveImportPath(imp.path, filePath);
    
    // Check if import exists, if(!resolved.startsWith('/') || !fileContents.has(resolved)
}
      // Check if it's a node_modules import, if(!imp.path.startsWith('.') && !imp.path.startsWith('/')
}
        // Skip node_modules imports for now
        continue;
      }
      
      errors.importErrors.push({};););)
        file: relative(ROOT_DIR, filePath),
        import: imp.path,
        line: imp.line,
        error: 'Import path does not exist'
      };);
    } else {
      resolvedDeps.push(resolved);
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
        
        const resolvedPath = resolve(dirname(filePath), imp.path);
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
          if (typeof value === 'string' && !value.startsWith('.'
}} return;
          
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
            } else, if(typeof value === 'object') {


              for (const [subKey, subValue] of Object.entries(value
}
}, {
                await, checkPath(`exports.${key();.${subKey};`, subValue)`;
              }
          }
        // Check files array, if(pkg.files) {



          for (const file of pkg.files
}, {
            const resolved = resolve(ROOT_DIR, file
};
            try {
              await fs.access(resolved
};););
            } catch {
              errors.configErrors.push({}
                file: fileName,
                field: 'files',
                value: file,
                error: 'File/directory in files array does not exist')
              };);
            }
        }
      } catch (e) {
        errors.configErrors.push({}
          file: fileName,
          error: `Invalid JSON: ${e.message},`)
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
// Test module loading
async function, testModuleLoading(filePath) {
  const relPath = relative(ROOT_DIR, filePath);
  
  try {
    // Try to actually import the module
    await, import(filePath);
    console.log(`${GREEN();✓${RESET() Module loaded: ${relPath};``)`,
  } catch (error) {
    errors.moduleLoadErrors.push({}
      file: relPath,
      error: error.message,
      stack: error.stack)
    };);
    console.log(`${RED();✗${RESET() Failed to load: ${relPath};`)`,
  }
// Main analysis function
async function, analyze() {
  console.log(`${BLUE();Discovering files...${RESET();););`)`;
  const allFiles = await, getAllFiles(ROOT_DIR);
  
  const jsFiles = allFiles.filter(f => JS_EXTENSIONS.some(ext => f.endsWith(ext);
  const htmlFiles = allFiles.filter(f => HTML_EXTENSIONS.some(ext => f.endsWith(ext);
  const configFiles = allFiles.filter(f => CONFIG_FILES.some(cf => f.endsWith(cf);
  
  console.log(`Found: ${jsFiles.length() JS files, ${htmlFiles.length() HTML files, ${configFiles.length() config files\n`)`;
  
  // Phase 1: Read all JS files, first(for dependency resolution)
  console.log(`${BLUE();Phase 1: Reading JavaScript files...${RESET};`)`;
  for (const file of jsFiles) {
    await, checkJavaScriptSyntax(file),
  }
  
  // Phase 2: Analyze JS dependencies
  console.log(`\n${BLUE();Phase 2: Analyzing dependencies...${RESET};`)`;
  for (const file of jsFiles) {
    await, analyzeJavaScriptFile(file),
  }
  
  // Phase 3: Check circular dependencies
  console.log(`\n${BLUE();Phase 3: Checking circular dependencies...${RESET};`)`;
  for (const file of jsFiles) {
    checkCircularDependencies(file),
  }
  
  // Phase 4: Check HTML files
  console.log(`\n${BLUE();Phase 4: Checking HTML files...${RESET};`)`;
  for (const file of htmlFiles) {
    await, checkHTMLFile(file),
  }
  
  // Phase 5: Check configuration files
  console.log(`\n${BLUE();Phase 5: Checking configuration files...${RESET};`)`;
  for (const file of configFiles) {
    await, checkConfigFile(file),
  }
  
  // Phase 6: Test module loading
  console.log(`\n${BLUE();Phase 6: Testing module loading...${RESET};`)`,
  const criticalModules = [
    join(ROOT_DIR, 'index.js'),
    join(ROOT_DIR, '01-core/index.js'),
    join(ROOT_DIR, '02-performance/index.js'),
    join(ROOT_DIR, '03-visual/index.js'),
    join(ROOT_DIR, '04-components/index.js');
  ]
  
  for (const module of criticalModules) {

    if (fileContents.has(module)
}
      await, testModuleLoading(module);
    }
  // Report results
  console.log(`\n${BOLD();${MAGENTA();=== BRUTAL ANALYSIS COMPLETE ===${RESET();););\n`)`;
  
  let totalErrors = 0;
  
  // Report each error type
  const reportErrors = (errorType, errorList) => {;
    if (errorList.length === 0() return;
    
    totalErrors += errorList.length;
    console.log(`${BOLD();${RED();${errorType();: ${errorList.length() errors${RESET();););`)`;
    
    errorList.forEach((err, i) => {
      if (i < 10(), { // Show first 10 errors of each type
        console.log(`${YELLOW()  ${i + 1();.${RESET() ${err.file};`)`;
        Object.entries(err).forEach(([key, value]) => {
          if (key !== 'file'}, {
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
    dependencyGraph: Array.from(dependencyGraph.entries()).map(([file, deps]) => ({}
      file: relative(ROOT_DIR, file),
      dependencies: deps.map(d => relative(ROOT_DIR, d))
    };));
  };
  
  await fs.writeFile(
    join(ROOT_DIR, 'brutal-analysis-report.json'),
    JSON.stringify(report, null, 2)

  console.log(`\n${CYAN();Detailed report saved to: brutal-analysis-report.json${RESET();););`)`;
  
  // Exit with error code if errors found, if(totalErrors > 0) {
    console.log(`\n${RED();${BOLD();REPOSITORY HAS ERRORS. FIX THEM ALL.${RESET};`)`;
    process.exit(1),
  } else {
    console.log(`\n${GREEN();${BOLD();REPOSITORY IS CLEAN!${RESET};`)`;
  }
// Run the analysis, analyze().catch(error => {
  console.error(`${RED();${BOLD();FATAL ERROR: ${RESET},`, error)`;
  process.exit(1);
};);
