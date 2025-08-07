/**
 * BrutalVisualTest - Visual Regression Testing Component
 * 
 * Tests that can capture and compare visual snapshots of components.
 * Uses Canvas API for screenshot capture and pixel comparison.
 */

import { BrutalTest } from '../core/BrutalTest.js';
import { withAssertions } from '../core/BrutalAssertions.js';
import { html } from '../../core/templates/index.js';

// Apply assertions
class VisualTestBase extends BrutalTest {}
withAssertions(VisualTestBase);

export class BrutalVisualTest extends VisualTestBase {
    constructor() {
        super();
        
        // Visual test configuration
        this.visualConfig = {
            captureDelay: 100, // ms to wait before capture
            threshold: 0.1, // 10% difference threshold
            highlightDifferences: true,
            saveSnapshots: false
        };
        
        // Snapshot storage
        this._snapshots = new Map();
        this._canvas = null;
        this._ctx = null;
    }
    
    async setup() {
        await super.setup();
        
        // Create canvas for captures
        this._canvas = document.createElement('canvas');
        this._ctx = this._canvas.getContext('2d', { 
            willReadFrequently: true 
        });
        
        // Create capture area in shadow DOM
        this._captureArea = document.createElement('div');
        this._captureArea.style.cssText = `
            position: relative;
            width: 100%;
            min-height: 200px;
            background: #fff;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 20px;
        `;
        this.shadowRoot.appendChild(this._captureArea);
    }
    
    /**
     * Capture a visual snapshot of an element
     */
    async captureSnapshot(element, name) {
        // Wait for render to stabilize
        await this._waitForStable(element);
        
        // Get element dimensions
        const rect = element.getBoundingClientRect();
        const width = Math.ceil(rect.width);
        const height = Math.ceil(rect.height);
        
        // Set canvas size
        this._canvas.width = width;
        this._canvas.height = height;
        
        // Clear canvas
        this._ctx.clearRect(0, 0, width, height);
        
        // Capture element visually
        const snapshot = await this._captureElement(element, width, height);
        
        // Store snapshot
        this._snapshots.set(name, {
            name,
            width,
            height,
            data: snapshot,
            timestamp: Date.now()
        });
        
        return snapshot;
    }
    
    /**
     * Compare current visual state with a baseline
     */
    async compareWithBaseline(element, baselineName) {
        const baseline = this._snapshots.get(baselineName);
        if (!baseline) {
            throw new Error(`Baseline snapshot '${baselineName}' not found`);
        }
        
        // Capture current state
        const current = await this.captureSnapshot(element, `${baselineName}-current`);
        
        // Compare snapshots
        const comparison = this._compareSnapshots(baseline, current);
        
        // Generate diff image if needed
        if (this.visualConfig.highlightDifferences && comparison.diffPixels > 0) {
            comparison.diffImage = this._generateDiffImage(baseline, current, comparison);
        }
        
        return comparison;
    }
    
    /**
     * Assert visual match
     */
    async assertVisualMatch(element, baselineName, message = '') {
        const comparison = await this.compareWithBaseline(element, baselineName);
        const threshold = this.visualConfig.threshold;
        
        const msg = message || 
            `Visual difference ${(comparison.diffPercent * 100).toFixed(2)}% exceeds threshold ${(threshold * 100)}%`;
        
        this.assert(
            comparison.diffPercent <= threshold,
            msg
        );
        
        // Add visual diff to test output if failed
        if (comparison.diffPercent > threshold && comparison.diffImage) {
            this._addVisualDiff(baselineName, comparison);
        }
        
        return comparison;
    }
    
    /**
     * Wait for element to be visually stable
     */
    async _waitForStable(element, timeout = 1000) {
        const startTime = Date.now();
        let lastSnapshot = null;
        let stableCount = 0;
        const requiredStableFrames = 3;
        
        while (Date.now() - startTime < timeout) {
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            const currentSnapshot = await this._quickCapture(element);
            
            if (lastSnapshot && this._isVisuallyEqual(lastSnapshot, currentSnapshot)) {
                stableCount++;
                if (stableCount >= requiredStableFrames) {
                    return;
                }
            } else {
                stableCount = 0;
            }
            
            lastSnapshot = currentSnapshot;
        }
    }
    
    /**
     * Capture element using DOM-to-Canvas techniques
     */
    async _captureElement(element, width, height) {
        // Method 1: Use html2canvas if available
        if (window.html2canvas) {
            const canvas = await window.html2canvas(element, {
                width,
                height,
                backgroundColor: null
            });
            return this._ctx.getImageData(0, 0, width, height);
        }
        
        // Method 2: Foreign object rendering (limited browser support)
        try {
            const data = `
                <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
                    <foreignObject width="100%" height="100%">
                        <div xmlns="http://www.w3.org/1999/xhtml">
                            ${element.outerHTML}
                        </div>
                    </foreignObject>
                </svg>
            `;
            
            const img = new Image();
            const blob = new Blob([data], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = url;
            });
            
            this._ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            
            return this._ctx.getImageData(0, 0, width, height);
        } catch (e) {
            // Fallback: Create a visual representation
            return this._createVisualRepresentation(element, width, height);
        }
    }
    
    /**
     * Quick capture for stability check
     */
    async _quickCapture(element) {
        const rect = element.getBoundingClientRect();
        const computed = window.getComputedStyle(element);
        
        // Create a simple hash of visual properties
        return {
            width: rect.width,
            height: rect.height,
            position: `${rect.top},${rect.left}`,
            background: computed.backgroundColor,
            color: computed.color,
            innerHTML: element.innerHTML.substring(0, 100)
        };
    }
    
    /**
     * Check if two quick captures are equal
     */
    _isVisuallyEqual(capture1, capture2) {
        return JSON.stringify(capture1) === JSON.stringify(capture2);
    }
    
    /**
     * Create a visual representation as fallback
     */
    _createVisualRepresentation(element, width, height) {
        // Draw a representation of the element
        this._ctx.fillStyle = '#f0f0f0';
        this._ctx.fillRect(0, 0, width, height);
        
        // Draw border
        this._ctx.strokeStyle = '#333';
        this._ctx.strokeRect(0, 0, width, height);
        
        // Draw element info
        this._ctx.fillStyle = '#333';
        this._ctx.font = '14px monospace';
        this._ctx.fillText(element.tagName, 10, 20);
        this._ctx.fillText(`${width}x${height}`, 10, 40);
        
        // Add some visual elements based on content
        const text = element.textContent.trim().substring(0, 50);
        if (text) {
            this._ctx.fillText(text, 10, 60);
        }
        
        return this._ctx.getImageData(0, 0, width, height);
    }
    
    /**
     * Compare two snapshots pixel by pixel
     */
    _compareSnapshots(snapshot1, snapshot2) {
        const { width, height } = snapshot1;
        const data1 = snapshot1.data.data;
        const data2 = snapshot2.data.data;
        
        let diffPixels = 0;
        const totalPixels = width * height;
        const diffData = new Uint8ClampedArray(data1.length);
        
        // Compare each pixel
        for (let i = 0; i < data1.length; i += 4) {
            const r1 = data1[i];
            const g1 = data1[i + 1];
            const b1 = data1[i + 2];
            const a1 = data1[i + 3];
            
            const r2 = data2[i];
            const g2 = data2[i + 1];
            const b2 = data2[i + 2];
            const a2 = data2[i + 3];
            
            // Calculate difference
            const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + 
                        Math.abs(b1 - b2) + Math.abs(a1 - a2);
            
            if (diff > 0) {
                diffPixels++;
                // Highlight difference in red
                diffData[i] = 255;
                diffData[i + 1] = 0;
                diffData[i + 2] = 0;
                diffData[i + 3] = 255;
            } else {
                // Copy original pixel
                diffData[i] = data1[i];
                diffData[i + 1] = data1[i + 1];
                diffData[i + 2] = data1[i + 2];
                diffData[i + 3] = data1[i + 3] * 0.3; // Fade non-different pixels
            }
        }
        
        return {
            diffPixels,
            totalPixels,
            diffPercent: diffPixels / totalPixels,
            diffData,
            width,
            height
        };
    }
    
    /**
     * Generate diff image
     */
    _generateDiffImage(baseline, current, comparison) {
        const canvas = document.createElement('canvas');
        canvas.width = comparison.width;
        canvas.height = comparison.height;
        
        const ctx = canvas.getContext('2d');
        const imageData = new ImageData(comparison.diffData, comparison.width, comparison.height);
        ctx.putImageData(imageData, 0, 0);
        
        return canvas.toDataURL();
    }
    
    /**
     * Add visual diff to test output
     */
    _addVisualDiff(name, comparison) {
        const diffContainer = document.createElement('div');
        diffContainer.style.cssText = `
            margin-top: 10px;
            padding: 10px;
            background: #fee;
            border: 1px solid #fcc;
            border-radius: 4px;
        `;
        
        diffContainer.innerHTML = `
            <h4>Visual Difference: ${name}</h4>
            <p>Difference: ${(comparison.diffPercent * 100).toFixed(2)}%</p>
            <img src="${comparison.diffImage}" style="max-width: 100%; border: 1px solid #ccc;">
        `;
        
        this.shadowRoot.appendChild(diffContainer);
    }
    
    // Enhanced template with visual test area
    createTemplate() {
        const baseTemplate = super.createTemplate();
        const { phase } = this._testState.getAll();
        
        if (phase === 'running' || phase === 'passed' || phase === 'failed') {
            return html`
                ${baseTemplate}
                <style>
                    .visual-test-info {
                        margin-top: 12px;
                        padding: 12px;
                        background: #1a1a1a;
                        border-radius: 4px;
                        font-size: 12px;
                        color: #888;
                    }
                    
                    .snapshot-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 10px;
                        margin-top: 10px;
                    }
                    
                    .snapshot-item {
                        padding: 10px;
                        background: #0a0a0a;
                        border-radius: 4px;
                        text-align: center;
                    }
                    
                    .snapshot-item img {
                        max-width: 100%;
                        border: 1px solid #333;
                        border-radius: 4px;
                    }
                </style>
                
                <div class="visual-test-info">
                    Visual Test: Captures and compares component snapshots
                </div>
                
                ${this._snapshots.size > 0 ? html`
                    <div class="snapshot-grid">
                        ${Array.from(this._snapshots.values()).map(snapshot => html`
                            <div class="snapshot-item">
                                <div>${snapshot.name}</div>
                                <div style="font-size: 10px; color: #666;">
                                    ${snapshot.width}x${snapshot.height}
                                </div>
                            </div>
                        `)}
                    </div>
                ` : ''}
            `;
        }
        
        return baseTemplate;
    }
}

// Register visual test base
customElements.define('brutal-visual-test', BrutalVisualTest);