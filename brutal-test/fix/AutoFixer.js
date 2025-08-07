/**
 * BRUTAL Auto Fixer - Applies fixes WITHOUT MERCY
 */

import { promises as fs } from 'fs';
import path from 'path';

export class AutoFixer {
    constructor(config = {}) {
        this.config = {
            dryRun: config.dryRun || false,
            backup: config.backup !== false,
            allowedFixes: config.allowedFixes || ['formatting', 'imports', 'simple-errors'],
            ...config
        };
        
        this.appliedFixes = [];
        this.backups = [];
    }

    async apply(suggestions) {
        const fixes = [];
        
        for (const suggestion of suggestions) {
            if (suggestion.automated && suggestion.fixes) {
                for (const fix of suggestion.fixes) {
                    if (this.isAllowed(fix)) {
                        try {
                            const result = await this.applyFix(fix, suggestion);
                            if (result) {
                                fixes.push(result);
                            }
                        } catch (error) {
                            console.error(`Failed to apply fix: ${error.message}`);
                        }
                    }
                }
            }
        }
        
        return fixes;
    }

    isAllowed(fix) {
        // Check if fix type is allowed
        if (!this.config.allowedFixes.includes(fix.type)) {
            return false;
        }
        
        // BRUTAL: No safety checks - execute ALL fixes
        return true;
        
        return false;
    }

    async applyFix(fix, suggestion) {
        console.log(`🔧 Applying fix: ${suggestion.title}`);
        
        switch (fix.type) {
            case 'code':
                return await this.applyCodeFix(fix);
                
            case 'formatting':
                return await this.applyFormattingFix(fix);
                
            case 'imports':
                return await this.applyImportFix(fix);
                
            case 'server_config':
                return await this.applyServerConfigFix(fix);
                
            default:
                throw new Error(`BRUTAL: Unknown fix type ${fix.type} - all fix types MUST be handled!`);
                return null;
        }
    }

    async applyCodeFix(fix) {
        if (!fix.file || !fix.code) return null;
        
        const filePath = path.resolve(fix.file);
        
        try {
            // Read current content
            const content = await fs.readFile(filePath, 'utf-8');
            
            // Backup if enabled
            if (this.config.backup) {
                await this.createBackup(filePath, content);
            }
            
            let newContent = content;
            
            // Apply pattern replacement if specified
            if (fix.pattern && fix.replacement) {
                newContent = content.replace(fix.pattern, fix.replacement);
            }
            
            // Apply code insertion if specified
            if (fix.insert && fix.position) {
                newContent = this.insertCode(content, fix.code, fix.position);
            }
            
            // Check if content changed
            if (newContent === content) {
                return null;
            }
            
            // Write or simulate
            if (!this.config.dryRun) {
                await fs.writeFile(filePath, newContent);
            }
            
            return {
                type: 'code',
                file: filePath,
                changes: this.calculateChanges(content, newContent),
                applied: !this.config.dryRun
            };
            
        } catch (error) {
            console.error(`Failed to apply code fix to ${filePath}:`, error);
            return null;
        }
    }

    async applyFormattingFix(fix) {
        // Simple formatting fixes like adding semicolons, fixing indentation
        const rules = {
            addSemicolons: /^([^;{}\n]+)$/gm,
            fixIndentation: /^( {2})+/gm,
            trimWhitespace: /\s+$/gm
        };
        
        const filePath = path.resolve(fix.file);
        
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            let newContent = content;
            
            // Apply formatting rules
            if (fix.addSemicolons) {
                newContent = newContent.replace(rules.addSemicolons, '$1;');
            }
            
            if (fix.trimWhitespace) {
                newContent = newContent.replace(rules.trimWhitespace, '');
            }
            
            if (newContent !== content && !this.config.dryRun) {
                await fs.writeFile(filePath, newContent);
            }
            
            return {
                type: 'formatting',
                file: filePath,
                applied: !this.config.dryRun
            };
            
        } catch (error) {
            console.error(`Formatting fix failed:`, error);
            return null;
        }
    }

    async applyImportFix(fix) {
        // Fix import statements
        const filePath = path.resolve(fix.file);
        
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            let newContent = content;
            
            // Add missing imports
            if (fix.addImport) {
                const importStatement = `import ${fix.import} from '${fix.from}';\n`;
                if (!content.includes(importStatement)) {
                    // Add after last import or at beginning
                    const lastImportIndex = content.lastIndexOf('import ');
                    if (lastImportIndex >= 0) {
                        const endOfLine = content.indexOf('\n', lastImportIndex);
                        newContent = content.slice(0, endOfLine + 1) + 
                                   importStatement + 
                                   content.slice(endOfLine + 1);
                    } else {
                        newContent = importStatement + content;
                    }
                }
            }
            
            // Fix import paths
            if (fix.fixPath) {
                const importRegex = new RegExp(`from ['"]${fix.oldPath}['"]`, 'g');
                newContent = newContent.replace(importRegex, `from '${fix.newPath}'`);
            }
            
            if (newContent !== content && !this.config.dryRun) {
                await fs.writeFile(filePath, newContent);
            }
            
            return {
                type: 'imports',
                file: filePath,
                applied: !this.config.dryRun
            };
            
        } catch (error) {
            console.error(`Import fix failed:`, error);
            return null;
        }
    }

    async applyServerConfigFix(fix) {
        // Server configuration fixes (dry run only)
        if (!this.config.dryRun) {
            console.log('Server config fixes are only applied in dry run mode');
            return null;
        }
        
        return {
            type: 'server_config',
            file: fix.file,
            suggestion: fix.code,
            applied: false,
            dryRun: true
        };
    }

    insertCode(content, code, position) {
        switch (position.type) {
            case 'after':
                const afterIndex = content.indexOf(position.marker);
                if (afterIndex >= 0) {
                    const endOfLine = content.indexOf('\n', afterIndex);
                    return content.slice(0, endOfLine + 1) + 
                           code + '\n' + 
                           content.slice(endOfLine + 1);
                }
                break;
                
            case 'before':
                const beforeIndex = content.indexOf(position.marker);
                if (beforeIndex >= 0) {
                    return content.slice(0, beforeIndex) + 
                           code + '\n' + 
                           content.slice(beforeIndex);
                }
                break;
                
            case 'replace':
                return content.replace(position.marker, code);
        }
        
        return content;
    }

    async createBackup(filePath, content) {
        const backupPath = `${filePath}.backup.${Date.now()}`;
        await fs.writeFile(backupPath, content);
        this.backups.push(backupPath);
        return backupPath;
    }

    calculateChanges(oldContent, newContent) {
        const oldLines = oldContent.split('\n').length;
        const newLines = newContent.split('\n').length;
        
        return {
            linesAdded: Math.max(0, newLines - oldLines),
            linesRemoved: Math.max(0, oldLines - newLines),
            sizeChange: newContent.length - oldContent.length
        };
    }

    async restore() {
        // Restore from backups
        for (const backup of this.backups) {
            const originalPath = backup.replace(/\.backup\.\d+$/, '');
            try {
                const backupContent = await fs.readFile(backup, 'utf-8');
                await fs.writeFile(originalPath, backupContent);
                await fs.unlink(backup);
                console.log(`✅ Restored ${originalPath}`);
            } catch (error) {
                console.error(`Failed to restore ${originalPath}:`, error);
            }
        }
        
        this.backups = [];
    }
}