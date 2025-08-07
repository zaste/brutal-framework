#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manual fixes for specific file patterns
const manualFixes = {
    '/workspaces/web/framework-v3/01-core/Component.js': [
        {
            line: 58,
            find: 'this.shadow = this.attachShadow({ )',
            replace: 'this.shadow = this.attachShadow({'
        },
        {
            line: 168,
            find: 'fragment.appendChild(template.content.cloneNode(true);)',
            replace: 'fragment.appendChild(template.content.cloneNode(true));'
        },
        {
            line: 210,
            find: 'this.shadow.appendChild(template.content.cloneNode(true);)',
            replace: 'this.shadow.appendChild(template.content.cloneNode(true));'
        },
        {
            line: 402,
            find: 'padding: 20px: background: #ff0000: color: white;',
            replace: 'padding: 20px; background: #ff0000; color: white;'
        },
        {
            line: 408,
            find: '${error?.message || \'Unknown error\'}</p>`',
            replace: '${error?.message || \'Unknown error\'}</p>'
        },
        {
            line: 412,
            find: '</details>`',
            replace: '</details>'
        },
        {
            line: 414,
            find: '</div>`',
            replace: '</div>'
        },
        {
            line: 461,
            find: '`',
            replace: ''
        }
    ],
    '/workspaces/web/framework-v3/01-core/EnhancedComponent.js': [
        {
            line: 135,
            find: 'this.shadow.appendChild(template.content.cloneNode(true);)',
            replace: 'this.shadow.appendChild(template.content.cloneNode(true));'
        },
        {
            line: 219,
            find: 'this.dispatchEvent(new CustomEvent(\'variantchange\', { detail: { from: oldVariant, to: variantName }))',
            replace: 'this.dispatchEvent(new CustomEvent(\'variantchange\', { detail: { from: oldVariant, to: variantName }'
        },
        {
            line: 220,
            find: '});',
            replace: '}));'
        },
        {
            line: 261,
            find: 'this.dispatchEvent(new CustomEvent(\'slotchange\', { detail: { slot: slotName, elements }))',
            replace: 'this.dispatchEvent(new CustomEvent(\'slotchange\', { detail: { slot: slotName, elements }'
        },
        {
            line: 262,
            find: '});',
            replace: '}));'
        },
        {
            line: 274,
            find: 'for (const [name, storeName] of Object.entries(stores){ {',
            replace: 'for (const [name, storeName] of Object.entries(stores)) {'
        },
        {
            line: 331,
            find: 'this.intersection = new IntersectionObserver()',
            replace: 'this.intersection = new IntersectionObserver('
        },
        {
            line: 340,
            find: 'this.resize = new ResizeObserver()',
            replace: 'this.resize = new ResizeObserver('
        },
        {
            line: 369,
            find: 'this.dispatchEvent(new CustomEvent(\'intersect\', { detail: entry });)',
            replace: 'this.dispatchEvent(new CustomEvent(\'intersect\', { detail: entry }))'
        },
        {
            line: 379,
            find: 'this.dispatchEvent(new CustomEvent(\'resize\', { detail: entry });)',
            replace: 'this.dispatchEvent(new CustomEvent(\'resize\', { detail: entry }))'
        },
        {
            line: 388,
            find: 'for (const [name, query] of Object.entries(queries){ {',
            replace: 'for (const [name, query] of Object.entries(queries)) {'
        },
        {
            line: 407,
            find: 'this.dispatchEvent(new CustomEvent(\'mediachange\', { detail: { name, matches: mq.matches }))',
            replace: 'this.dispatchEvent(new CustomEvent(\'mediachange\', { detail: { name, matches: mq.matches }'
        },
        {
            line: 408,
            find: '});',
            replace: '}));'
        },
        {
            line: 422,
            find: 'for (const [name, value] of Object.entries(config.properties){ {',
            replace: 'for (const [name, value] of Object.entries(config.properties)) {'
        },
        {
            line: 448,
            find: 'for (const [selector, binding] of Object.entries(this.constructor.bindings){ {',
            replace: 'for (const [selector, binding] of Object.entries(this.constructor.bindings)) {'
        },
        {
            line: 456,
            find: 'for (const [prop, value] of Object.entries(binding){ {',
            replace: 'for (const [prop, value] of Object.entries(binding)) {'
        },
        {
            line: 561,
            find: '});',
            replace: '}));'
        },
        {
            line: 564,
            find: '`',
            replace: ''
        }
    ],
    '/workspaces/web/framework-v3/01-core/Registry.js': [
        {
            line: 38,
            find: 'if (!this._isValidName(name){ {',
            replace: 'if (!this._isValidName(name)) {'
        },
        {
            line: 43,
            find: 'if (customElements.get(name){ {',
            replace: 'if (customElements.get(name)) {'
        },
        {
            line: 69,
            find: 'for (const [name, ComponentClass] of Object.entries(components){ {',
            replace: 'for (const [name, ComponentClass] of Object.entries(components)) {'
        },
        {
            line: 80,
            find: 'if (!this._isValidName(name){ {`)',
            replace: 'if (!this._isValidName(name)) {'
        },
        {
            line: 81,
            find: 'throw new Error(`Invalid component name: ${name}`);',
            replace: 'throw new Error(`Invalid component name: ${name}`);'
        },
        {
            line: 115,
            find: 'if (!definition) {`',
            replace: 'if (!definition) {'
        },
        {
            line: 124,
            find: 'if (this.loadingPromises.has(name){ {',
            replace: 'if (this.loadingPromises.has(name)) {'
        },
        {
            line: 139,
            find: 'if (!ComponentClass) {`',
            replace: 'if (!ComponentClass) {'
        },
        {
            line: 160,
            find: '} catch (error) {',
            replace: '} catch (error) {'
        },
        {
            line: 161,
            find: 'throw new Error(`Failed to load component ${name}: ${error.message}`);',
            replace: 'throw new Error(`Failed to load component ${name}: ${error.message}`);'
        },
        {
            line: 179,
            find: 'promises.push(this.load(name);)',
            replace: 'promises.push(this.load(name));'
        },
        {
            line: 196,
            find: 'if (this.definitions.has(name){ {',
            replace: 'if (this.definitions.has(name)) {'
        },
        {
            line: 212,
            find: 'if (!definition || !definition.loaded) {`',
            replace: 'if (!definition || !definition.loaded) {'
        },
        {
            line: 219,
            find: 'for (const [key, value] of Object.entries(props){ {',
            replace: 'for (const [key, value] of Object.entries(props)) {'
        },
        {
            line: 263,
            find: 'for (const [key, value] of Object.entries(definition.properties){ {',
            replace: 'for (const [key, value] of Object.entries(definition.properties)) {'
        },
        {
            line: 308,
            find: 'if (this.pendingRegistrations.has(name){ {',
            replace: 'if (this.pendingRegistrations.has(name)) {'
        },
        {
            line: 323,
            find: '} catch (error) {`',
            replace: '} catch (error) {'
        },
        {
            line: 354,
            find: 'const originalLazy = this.lazy.bind(this));',
            replace: 'const originalLazy = this.lazy.bind(this);'
        },
        {
            line: 407,
            find: 'if (customElements.get(name){ {',
            replace: 'if (customElements.get(name)) {'
        },
        {
            line: 412,
            find: 'if (this.loadingPromises.has(name){ {',
            replace: 'if (this.loadingPromises.has(name)) {'
        },
        {
            line: 418,
            find: 'if (!this.pendingRegistrations.has(name){ {',
            replace: 'if (!this.pendingRegistrations.has(name)) {'
        },
        {
            line: 435,
            find: 'return Array.from(this.definitions.keys();)',
            replace: 'return Array.from(this.definitions.keys());'
        },
        {
            line: 462,
            find: '`',
            replace: ''
        }
    ],
    '/workspaces/web/framework-v3/02-performance/09-GestureSystem.js': [
        {
            line: 39,
            find: 'this._boundHandlePointerDown = this._handlePointerDown.bind(this);',
            replace: 'this._boundHandlePointerDown = this._handlePointerDown.bind(this);'
        },
        {
            line: 40,
            find: 'this._boundHandlePointerMove = this._handlePointerMove.bind(this);',
            replace: 'this._boundHandlePointerMove = this._handlePointerMove.bind(this);'
        },
        {
            line: 41,
            find: 'this._boundHandlePointerUp = this._handlePointerUp.bind(this);',
            replace: 'this._boundHandlePointerUp = this._handlePointerUp.bind(this);'
        },
        {
            line: 42,
            find: 'this._boundHandlePointerCancel = this._handlePointerCancel.bind(this);',
            replace: 'this._boundHandlePointerCancel = this._handlePointerCancel.bind(this);'
        },
        {
            line: 57,
            find: 'if (!this._handlers.has(elementId){ {',
            replace: 'if (!this._handlers.has(elementId)) {'
        },
        {
            line: 58,
            find: 'this._handlers.set(elementId, new Map();)',
            replace: 'this._handlers.set(elementId, new Map());'
        },
        {
            line: 61,
            find: 'gestureList.forEach(gesture => {)',
            replace: 'gestureList.forEach(gesture => {'
        },
        {
            line: 69,
            find: 'gestureList.forEach(gesture => {)',
            replace: 'gestureList.forEach(gesture => {'
        },
        {
            line: 70,
            find: 'if (!this._recognizers.has(gesture){ {',
            replace: 'if (!this._recognizers.has(gesture)) {'
        },
        {
            line: 88,
            find: 'gestureList.forEach(gesture => handlers.delete(gesture);)',
            replace: 'gestureList.forEach(gesture => handlers.delete(gesture));'
        },
        {
            line: 108,
            find: 'this._recognizers.set(\'tap\', this._recognizeTap.bind(this);)',
            replace: 'this._recognizers.set(\'tap\', this._recognizeTap.bind(this));'
        },
        {
            line: 111,
            find: 'this._recognizers.set(\'doubletap\', this._recognizeDoubleTap.bind(this);)',
            replace: 'this._recognizers.set(\'doubletap\', this._recognizeDoubleTap.bind(this));'
        },
        {
            line: 114,
            find: 'this._recognizers.set(\'longpress\', this._recognizeLongPress.bind(this);)',
            replace: 'this._recognizers.set(\'longpress\', this._recognizeLongPress.bind(this));'
        },
        {
            line: 121,
            find: 'this._recognizers.set(\'swipe\', this._recognizeSwipe.bind(this);)',
            replace: 'this._recognizers.set(\'swipe\', this._recognizeSwipe.bind(this));'
        },
        {
            line: 127,
            find: 'this._recognizers.set(\'pan\', this._recognizePan.bind(this);)',
            replace: 'this._recognizers.set(\'pan\', this._recognizePan.bind(this));'
        },
        {
            line: 132,
            find: 'this._recognizers.set(\'pinch\', this._recognizePinch.bind(this);)',
            replace: 'this._recognizers.set(\'pinch\', this._recognizePinch.bind(this));'
        },
        {
            line: 135,
            find: 'this._recognizers.set(\'rotate\', this._recognizeRotate.bind(this);)',
            replace: 'this._recognizers.set(\'rotate\', this._recognizeRotate.bind(this));'
        },
        {
            line: 214,
            find: 'const dt = Math.max(1, now - (pointer.lastMoveTime || pointer.startTime);)',
            replace: 'const dt = Math.max(1, now - (pointer.lastMoveTime || pointer.startTime));'
        },
        {
            line: 322,
            find: 'const distance = Math.sqrt()',
            replace: 'const distance = Math.sqrt('
        },
        {
            line: 324,
            find: 'Math.pow(pointer.endY - pointer.startY, 2)',
            replace: 'Math.pow(pointer.endY - pointer.startY, 2));'
        },
        {
            line: 344,
            find: 'const distance = Math.sqrt()',
            replace: 'const distance = Math.sqrt('
        },
        {
            line: 346,
            find: 'Math.pow(pointer.endY - lastTap.y, 2)',
            replace: 'Math.pow(pointer.endY - lastTap.y, 2));'
        },
        {
            line: 351,
            find: '});`',
            replace: '});'
        },
        {
            line: 357,
            find: '// Store this tap`',
            replace: '// Store this tap'
        },
        {
            line: 367,
            find: '_recognizeLongPress(pointer, phase, gesture) {`',
            replace: '_recognizeLongPress(pointer, phase, gesture) {'
        },
        {
            line: 368,
            find: 'const key = `${pointer.elementId}-longpress`;',
            replace: 'const key = `${pointer.elementId}-longpress`;'
        },
        {
            line: 373,
            find: 'const distance = Math.sqrt()',
            replace: 'const distance = Math.sqrt('
        },
        {
            line: 375,
            find: 'Math.pow(pointer.y - pointer.startY, 2)',
            replace: 'Math.pow(pointer.y - pointer.startY, 2));'
        },
        {
            line: 390,
            find: 'const distance = Math.sqrt()',
            replace: 'const distance = Math.sqrt('
        },
        {
            line: 392,
            find: 'Math.pow(pointer.y - pointer.startY, 2)',
            replace: 'Math.pow(pointer.y - pointer.startY, 2));'
        },
        {
            line: 422,
            find: 'if (distance > this._config.swipeThreshold && )',
            replace: 'if (distance > this._config.swipeThreshold &&'
        },
        {
            line: 423,
            find: 'velocity > this._config.swipeVelocity * 1000) {',
            replace: 'velocity > this._config.swipeVelocity * 1000) {'
        },
        {
            line: 440,
            find: '// Check if specific direction matches`',
            replace: '// Check if specific direction matches'
        },
        {
            line: 441,
            find: 'if (gesture === \'swipe\' || gesture === `swipe${direction}`) {',
            replace: 'if (gesture === \'swipe\' || gesture === `swipe${direction}`) {'
        },
        {
            line: 456,
            find: '_recognizePan(pointer, phase, gesture) {`',
            replace: '_recognizePan(pointer, phase, gesture) {'
        },
        {
            line: 457,
            find: 'const key = `${pointer.elementId}-pan`;',
            replace: 'const key = `${pointer.elementId}-pan`;'
        },
        {
            line: 459,
            find: 'if (phase === \'start\' && gesture.includes(\'start\'){ {',
            replace: 'if (phase === \'start\' && gesture.includes(\'start\')) {'
        },
        {
            line: 496,
            find: '`',
            replace: ''
        },
        {
            line: 497,
            find: 'const key = `${pointer.elementId}-pinch`;',
            replace: 'const key = `${pointer.elementId}-pinch`;'
        },
        {
            line: 502,
            find: 'const distance = Math.sqrt()',
            replace: 'const distance = Math.sqrt('
        },
        {
            line: 504,
            find: 'Math.pow(p2.y - p1.y, 2)',
            replace: 'Math.pow(p2.y - p1.y, 2));'
        },
        {
            line: 518,
            find: '`',
            replace: ''
        },
        {
            line: 519,
            find: 'if (gesture === \'pinch\' || gesture === `pinch${direction}`) {',
            replace: 'if (gesture === \'pinch\' || gesture === `pinch${direction}`) {'
        },
        {
            line: 546,
            find: '`',
            replace: ''
        },
        {
            line: 547,
            find: 'const key = `${pointer.elementId}-rotate`;',
            replace: 'const key = `${pointer.elementId}-rotate`;'
        },
        {
            line: 607,
            find: '// Cancel long press`',
            replace: '// Cancel long press'
        },
        {
            line: 608,
            find: 'const longPressTimer = this._activeGestures.get(`${elementId}-longpress`);',
            replace: 'const longPressTimer = this._activeGestures.get(`${elementId}-longpress`);'
        },
        {
            line: 610,
            find: 'clearTimeout(longPressTimer);`',
            replace: 'clearTimeout(longPressTimer);'
        },
        {
            line: 611,
            find: 'this._activeGestures.delete(`${elementId}-longpress`);',
            replace: 'this._activeGestures.delete(`${elementId}-longpress`);'
        },
        {
            line: 614,
            find: '// Cancel pan`',
            replace: '// Cancel pan'
        },
        {
            line: 615,
            find: 'if (this._activeGestures.has(`${elementId}-pan`){ {',
            replace: 'if (this._activeGestures.has(`${elementId}-pan`)) {'
        },
        {
            line: 618,
            find: '});`',
            replace: '});'
        },
        {
            line: 619,
            find: 'this._activeGestures.delete(`${elementId}-pan`);',
            replace: 'this._activeGestures.delete(`${elementId}-pan`);'
        },
        {
            line: 622,
            find: '// Clean up other gestures`',
            replace: '// Clean up other gestures'
        },
        {
            line: 623,
            find: 'this._activeGestures.delete(`${elementId}-pinch`);`',
            replace: 'this._activeGestures.delete(`${elementId}-pinch`);'
        },
        {
            line: 624,
            find: 'this._activeGestures.delete(`${elementId}-rotate`);',
            replace: 'this._activeGestures.delete(`${elementId}-rotate`);'
        },
        {
            line: 676,
            find: 'if (!element._gestureId) {`',
            replace: 'if (!element._gestureId) {'
        },
        {
            line: 677,
            find: 'element._gestureId = `gesture-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;',
            replace: 'element._gestureId = `gesture-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;'
        },
        {
            line: 728,
            find: '`',
            replace: ''
        }
    ]
};

async function applyManualFixes(filePath, fixes) {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Sort fixes by line number in descending order to avoid offset issues
    fixes.sort((a, b) => b.line - a.line);
    
    for (const fix of fixes) {
        const lineIndex = fix.line - 1; // Convert to 0-based index
        if (lineIndex >= 0 && lineIndex < lines.length) {
            const currentLine = lines[lineIndex];
            if (currentLine.includes(fix.find)) {
                lines[lineIndex] = currentLine.replace(fix.find, fix.replace);
                console.log(`  Fixed line ${fix.line}: ${fix.find.substring(0, 30)}...`);
            }
        }
    }
    
    await fs.writeFile(filePath, lines.join('\n'), 'utf8');
}

async function main() {
    console.log('=== BRUTAL V3 Manual Syntax Fixer ===\n');
    
    let totalFixed = 0;
    
    for (const [filePath, fixes] of Object.entries(manualFixes)) {
        console.log(`Processing: ${filePath}`);
        
        try {
            await applyManualFixes(filePath, fixes);
            
            // Verify the fix
            try {
                execSync(`node --check "${filePath}"`, { stdio: 'pipe' });
                console.log(`  ✓ Fixed successfully!\n`);
                totalFixed++;
            } catch (error) {
                console.log(`  ✗ Still has errors after fix\n`);
            }
        } catch (error) {
            console.error(`  Error: ${error.message}\n`);
        }
    }
    
    console.log(`\nFixed ${totalFixed} out of ${Object.keys(manualFixes).length} files`);
}

main().catch(console.error);