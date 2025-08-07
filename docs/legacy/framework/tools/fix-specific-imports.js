#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Arreglando imports específicos del framework...\n');

// Mapeo de archivos antiguos a nuevos
const fileMapping = {
    'missing-base-framework.cjs': 'core/engine/base-framework.js',
    'native-component-base.cjs': 'core/systems/component-base.js',
    'native-state-manager.cjs': 'core/systems/state-manager.js',
    'native-router.cjs': 'core/systems/router.js',
    'native-ssr-system.cjs': 'core/systems/ssr.js',
    'native-framework-core.cjs': 'core/engine/framework-core.js',
    'advanced-shadow-optimizer.cjs': 'research/advanced-features/shadow-optimizer-v2.js',
    'event-handling-optimizer.cjs': 'core/performance/events.js',
    'template-optimizer.cjs': 'core/performance/templates.js',
    'shadow-dom-optimizer.cjs': 'core/performance/shadow-dom.js',
    'css-styling-optimizer.cjs': 'core/performance/style.js',
    'performance-optimization-engine.cjs': 'core/performance/engine.js'
};

function getRelativePath(from, to) {
    // Calcular la ruta relativa correcta
    const fromDir = path.dirname(from);
    const toPath = to;
    let relativePath = path.relative(fromDir, `/workspaces/web/framework/${toPath}`);
    
    // Asegurarse de que la ruta empiece con ./ o ../
    if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
    }
    
    return relativePath;
}

function fixImportsInFile(filePath) {
    console.log(`📝 Procesando: ${filePath}`);
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Arreglar cada mapeo
        for (const [oldFile, newFile] of Object.entries(fileMapping)) {
            const oldFileBase = oldFile.replace('.cjs', '');
            
            // Patrones a buscar
            const patterns = [
                // require patterns
                `require\\(['"\`]([^'"\`]*/)?(${oldFileBase}|${oldFile})['"\`]\\)`,
                // import patterns
                `from ['"\`]([^'"\`]*/)?(${oldFileBase}|${oldFile})['"\`]`,
            ];
            
            patterns.forEach(pattern => {
                const regex = new RegExp(pattern, 'g');
                const matches = content.match(regex);
                
                if (matches) {
                    matches.forEach(match => {
                        const relativePath = getRelativePath(filePath, newFile);
                        const newMatch = match.replace(/(['"\`])([^'"\`]+)(['"\`])/, `$1${relativePath}$3`);
                        content = content.replace(match, newMatch);
                        modified = true;
                        console.log(`  ✓ ${match} → ${newMatch}`);
                    });
                }
            });
        }
        
        // Convertir require a import
        content = content.replace(/const\s+{\s*([^}]+)\s*}\s*=\s*require\s*\(/g, 'import { $1 } from ');
        content = content.replace(/const\s+(\w+)\s*=\s*require\s*\(/g, 'import $1 from ');
        content = content.replace(/\);\s*$/gm, ';');
        
        // Convertir module.exports a export
        content = content.replace(/module\.exports\s*=\s*{/g, 'export {');
        content = content.replace(/module\.exports\s*=\s*/g, 'export default ');
        
        if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`  ✅ Archivo actualizado`);
        } else {
            console.log(`  ℹ️  No se encontraron cambios necesarios`);
        }
        
    } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
    }
}

// Buscar todos los archivos JavaScript
function findJavaScriptFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.includes('node_modules')) {
            findJavaScriptFiles(fullPath, files);
        } else if (stat.isFile() && item.endsWith('.js')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

// Procesar todos los archivos
const frameworkDir = '/workspaces/web/framework';
const files = findJavaScriptFiles(frameworkDir);

console.log(`\n🔍 Encontrados ${files.length} archivos JavaScript\n`);

files.forEach(fixImportsInFile);

console.log('\n✅ Proceso completado!');