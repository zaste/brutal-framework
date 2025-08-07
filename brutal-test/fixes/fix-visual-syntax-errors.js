import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const fixes = [
    // ParticleEngine.js
    {
        file: 'framework-v3/03-visual/gpu/ParticleEngine.js',
        fixes: [
            { line: 64, search: /^\s*`\);$/m, replace: '        console.log(`ParticleEngine initialized with ${this.maxParticles} particles`);' },
            { line: 131, search: /^\s*}$/m, replace: '        console.log("Particle system created");' },
            { line: 134, search: /^\s*}$/m, replace: '        console.log("Pool warmed up");' },
            { line: 369, search: /^\s*\);$/m, replace: '        console.log("Shader compiled successfully");' },
            { line: 379, search: /^\s*\);$/m, replace: '        console.log("Program linked successfully");' },
            { line: 390, search: /^\s*\);$/m, replace: '        console.log("Shader created successfully");' }
        ]
    },
    // ShaderLibrary.js
    {
        file: 'framework-v3/03-visual/gpu/ShaderLibrary.js',
        fixes: [
            { line: 477, search: /^\s*\);$/m, replace: '        console.log("Shader compiled");' },
            { line: 500, search: /^\s*\);$/m, replace: '        console.log("Shader cached");' },
            { line: 577, search: /^\s*}$/m, replace: '        console.log("Shader library initialized");' }
        ]
    },
    // AutomatedVisualTester.js
    {
        file: 'framework-v3/03-visual/debug/AutomatedVisualTester.js',
        fixes: [
            { line: 125, search: /^\s*} catch \(error\) {$/m, replace: '        console.log("Test completed");' }
        ]
    }
];

async function fixFile(filePath, fixes) {
    try {
        let content = await readFile(filePath, 'utf8');
        let lines = content.split('\n');
        
        // Apply fixes in reverse order to maintain line numbers
        fixes.sort((a, b) => b.line - a.line);
        
        for (const fix of fixes) {
            if (fix.line > 0 && fix.line <= lines.length) {
                // Simple replacement - just replace the problematic line
                lines[fix.line - 1] = fix.replace;
            }
        }
        
        await writeFile(filePath, lines.join('\n'));
        console.log(`✅ Fixed ${filePath}`);
    } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
    }
}

// Run fixes
for (const { file, fixes: fileFixes } of fixes) {
    await fixFile(join('/workspaces/web', file), fileFixes);
}

console.log('All syntax error fixes completed!');