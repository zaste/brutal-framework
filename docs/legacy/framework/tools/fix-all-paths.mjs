#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Arreglando TODAS las rutas de importación...\n');

// Archivos conocidos y sus ubicaciones reales
const fileLocations = {
    'base-framework.js': '/workspaces/web/framework/core/engine/base-framework.js',
    'component-base.js': '/workspaces/web/framework/core/systems/component-base.js',
    'state-manager.js': '/workspaces/web/framework/core/systems/state-manager.js',
    'router.js': '/workspaces/web/framework/core/systems/router.js',
    'ssr.js': '/workspaces/web/framework/core/systems/ssr.js',
    'framework-core.js': '/workspaces/web/framework/core/engine/framework-core.js',
    'shadow-optimizer-v2.js': '/workspaces/web/framework/research/advanced-features/shadow-optimizer-v2.js',
    'events.js': '/workspaces/web/framework/core/performance/events.js',
    'templates.js': '/workspaces/web/framework/core/performance/templates.js',
    'shadow-dom.js': '/workspaces/web/framework/core/performance/shadow-dom.js',
    'style.js': '/workspaces/web/framework/core/performance/style.js',
    'engine.js': '/workspaces/web/framework/core/performance/engine.js',
    'infrastructure.js': '/workspaces/web/framework/tools/testing/infrastructure.js',
    'core-api-layer.js': '/workspaces/web/framework/platform/integrations/core-api-layer.js',
    'framework-bridge.js': '/workspaces/web/framework/platform/integrations/framework-bridge.js',
    'monitoring.js': '/workspaces/web/framework/enterprise/analytics/monitoring.js',
    'framework.js': '/workspaces/web/framework/enterprise/security/framework.js',
    'system.js': '/workspaces/web/framework/enterprise/deployment/system.js'
};

function calculateRelativePath(fromFile, toFile) {
    const fromDir = path.dirname(fromFile);
    let relativePath = path.relative(fromDir, toFile);
    
    if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
    }
    
    return relativePath;
}

function fixImportsInFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`❌ Archivo no existe: ${filePath}`);
        return;
    }
    
    console.log(`📝 Procesando: ${filePath}`);
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Buscar todos los imports y requires
        const importRegex = /(?:import|from|require\s*\()\s*['"]([^'"]+)['"]/g;
        let match;
        const replacements = [];
        
        while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1];
            
            // Si es una ruta relativa
            if (importPath.startsWith('.')) {
                // Extraer el nombre del archivo
                const fileName = path.basename(importPath);
                
                // Si conocemos la ubicación real del archivo
                if (fileLocations[fileName]) {
                    const correctPath = calculateRelativePath(filePath, fileLocations[fileName]);
                    
                    if (importPath !== correctPath) {
                        replacements.push({
                            from: importPath,
                            to: correctPath,
                            fullMatch: match[0]
                        });
                    }
                }
            }
        }
        
        // Aplicar los reemplazos
        replacements.forEach(replacement => {
            const newMatch = replacement.fullMatch.replace(replacement.from, replacement.to);
            content = content.replace(replacement.fullMatch, newMatch);
            console.log(`  ✓ ${replacement.from} → ${replacement.to}`);
            modified = true;
        });
        
        // Arreglar rutas específicas mal calculadas
        const specificFixes = [
            // Arreglar rutas que apuntan a directorios incorrectos
            { from: /\.\.\/core\/engine\/base-framework\.js/g, to: '../../../core/engine/base-framework.js' },
            { from: /\.\.\/\.\.\/\.\.\/\.\.\/core\/engine\/base-framework\.js/g, to: '../../../core/engine/base-framework.js' },
            { from: /platform\/core\/engine\/base-framework\.js/g, to: 'core/engine/base-framework.js' }
        ];
        
        specificFixes.forEach(fix => {
            if (fix.from.test(content)) {
                content = content.replace(fix.from, fix.to);
                console.log(`  ✓ Arreglado patrón específico`);
                modified = true;
            }
        });
        
        if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`  ✅ Archivo actualizado`);
        } else {
            console.log(`  ℹ️  No se requirieron cambios`);
        }
        
    } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
    }
}

// Buscar todos los archivos JavaScript
function findJavaScriptFiles(dir, files = []) {
    try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory() && !item.includes('node_modules') && !item.startsWith('.')) {
                findJavaScriptFiles(fullPath, files);
            } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.mjs'))) {
                files.push(fullPath);
            }
        }
    } catch (error) {
        // Ignorar errores de permisos
    }
    
    return files;
}

// Procesar todos los archivos
const frameworkDir = '/workspaces/web/framework';
const files = findJavaScriptFiles(frameworkDir);

console.log(`\n🔍 Encontrados ${files.length} archivos JavaScript\n`);

// Procesar archivos en orden de dependencia
const priorityFiles = [
    'base-framework.js',
    'framework-bridge.js',
    'core-api-layer.js',
    'infrastructure.js',
    'templates.js',
    'component-base.js'
];

// Procesar archivos prioritarios primero
files.sort((a, b) => {
    const aName = path.basename(a);
    const bName = path.basename(b);
    const aPriority = priorityFiles.indexOf(aName);
    const bPriority = priorityFiles.indexOf(bName);
    
    if (aPriority !== -1 && bPriority !== -1) {
        return aPriority - bPriority;
    } else if (aPriority !== -1) {
        return -1;
    } else if (bPriority !== -1) {
        return 1;
    }
    return 0;
});

files.forEach(fixImportsInFile);

console.log('\n✅ Proceso completado!');