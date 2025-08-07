#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function fixImportsInFile(filePath) {
    console.log(`📝 Procesando: ${filePath}`);
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Arreglar referencias a missing-base-framework
        if (content.includes('missing-base-framework')) {
            // Calcular la ruta relativa correcta
            const fromDir = path.dirname(filePath);
            const toPath = '/workspaces/web/framework/core/engine/base-framework.js';
            let relativePath = path.relative(fromDir, toPath);
            
            if (!relativePath.startsWith('.')) {
                relativePath = './' + relativePath;
            }
            
            // Reemplazar todas las variantes
            const patterns = [
                /require\(['"]\.\.?\/.*?missing-base-framework\.cjs['"]\)/g,
                /from ['"]\.\.?\/.*?missing-base-framework\.cjs['"]/g,
                /import\s+.*?\s+from\s+['"]\.\.?\/.*?missing-base-framework\.cjs['"]/g
            ];
            
            patterns.forEach(pattern => {
                if (pattern.test(content)) {
                    content = content.replace(pattern, (match) => {
                        if (match.includes('require')) {
                            return `require('${relativePath}')`;
                        } else {
                            return `from '${relativePath}'`;
                        }
                    });
                    modified = true;
                }
            });
        }
        
        // Arreglar otros imports
        Object.entries(fileMapping).forEach(([oldFile, newFile]) => {
            if (content.includes(oldFile)) {
                const fromDir = path.dirname(filePath);
                const toPath = `/workspaces/web/framework/${newFile}`;
                let relativePath = path.relative(fromDir, toPath);
                
                if (!relativePath.startsWith('.')) {
                    relativePath = './' + relativePath;
                }
                
                content = content.replace(new RegExp(oldFile, 'g'), relativePath);
                modified = true;
            }
        });
        
        if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`  ✅ Archivo actualizado`);
        }
        
    } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
    }
}

// Procesar archivos específicos que sabemos que tienen problemas
const problemFiles = [
    '/workspaces/web/framework/core/performance/engine.js',
    '/workspaces/web/framework/core/performance/templates.js',
    '/workspaces/web/framework/core/systems/ssr.js',
    '/workspaces/web/framework/platform/integrations/framework-bridge.js',
    '/workspaces/web/framework/platform/integrations/adapters.js',
    '/workspaces/web/framework/platform/integrations/core-api-layer.js',
    '/workspaces/web/framework/components/intelligence/ux-system.js',
    '/workspaces/web/framework/enterprise/core/features-system.js'
];

problemFiles.forEach(file => {
    if (fs.existsSync(file)) {
        fixImportsInFile(file);
    }
});

console.log('\n✅ Proceso completado!');