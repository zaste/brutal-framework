/**
 * Visual Capture - Screenshots, visual regression, and recording
 */

import { promises as fs } from 'fs';
import path from 'path';
import { createHash } from 'crypto';

export class VisualCapture {
    constructor(config = {}) {
        this.config = {
            screenshotDir: config.screenshotDir || './brutal-test-results/screenshots',
            baselineDir: config.baselineDir || './brutal-test-results/baselines',
            recordVideo: config.recordVideo || false,
            fullPage: config.fullPage !== false,
            ...config
        };
        
        this.page = null;
        this.isCapturing = false;
        this.screenshots = [];
        this.recordings = [];
    }

    async attach(page, cdp) {
        this.page = page;
        this.cdp = cdp;
        
        // Ensure directories exist
        await this.ensureDirectories();
        
        // Setup visual debugging if enabled
        await this.setupVisualDebugging();
    }

    async ensureDirectories() {
        const dirs = [
            this.config.screenshotDir,
            this.config.baselineDir,
            path.join(this.config.screenshotDir, 'diffs')
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    async setupVisualDebugging() {
        // Inject visual debugging helpers
        await this.page.evaluateOnNewDocument(() => {
            window.__BRUTAL_VISUAL__ = {
                highlights: [],
                annotations: [],
                recordings: []
            };

            // Highlight element function
            window.__highlightElement = (selector, color = 'red') => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    const highlight = document.createElement('div');
                    highlight.style.cssText = `
                        position: fixed;
                        top: ${rect.top}px;
                        left: ${rect.left}px;
                        width: ${rect.width}px;
                        height: ${rect.height}px;
                        border: 3px solid ${color};
                        pointer-events: none;
                        z-index: 999999;
                        box-shadow: 0 0 10px ${color};
                    `;
                    document.body.appendChild(highlight);
                    window.__BRUTAL_VISUAL__.highlights.push(highlight);
                });
            };

            // Annotate function
            window.__annotate = (x, y, text, color = 'yellow') => {
                const annotation = document.createElement('div');
                annotation.style.cssText = `
                    position: fixed;
                    top: ${y}px;
                    left: ${x}px;
                    background: ${color};
                    color: black;
                    padding: 5px 10px;
                    border-radius: 3px;
                    font-size: 14px;
                    font-weight: bold;
                    z-index: 999999;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                `;
                annotation.textContent = text;
                document.body.appendChild(annotation);
                window.__BRUTAL_VISUAL__.annotations.push(annotation);
            };

            // Clear all visual debugging
            window.__clearVisualDebug = () => {
                window.__BRUTAL_VISUAL__.highlights.forEach(h => h.remove());
                window.__BRUTAL_VISUAL__.annotations.forEach(a => a.remove());
                window.__BRUTAL_VISUAL__.highlights = [];
                window.__BRUTAL_VISUAL__.annotations = [];
            };
        });
    }

    async start() {
        this.isCapturing = true;
        this.screenshots = [];
        this.recordings = [];
        
        // Start video recording if enabled
        if (this.config.recordVideo && this.page.video) {
            try {
                await this.page.video().start();
            } catch (error) {
                throw new Error(`BRUTAL: Video recording FAILED - ${error.message}`);
            }
        }
        
        return { status: 'capturing' };
    }

    async captureScreenshot(name, options = {}) {
        const screenshotOptions = {
            path: path.join(this.config.screenshotDir, `${name}-${Date.now()}.png`),
            fullPage: this.config.fullPage,
            ...options
        };
        
        try {
            await this.page.screenshot(screenshotOptions);
            
            const screenshotData = {
                name,
                path: screenshotOptions.path,
                timestamp: Date.now(),
                viewport: await this.page.viewport(),
                url: await this.page.url()
            };
            
            this.screenshots.push(screenshotData);
            
            // Compare with baseline if exists
            if (options.compare !== false) {
                const comparison = await this.compareWithBaseline(name, screenshotOptions.path);
                screenshotData.comparison = comparison;
            }
            
            return screenshotData;
        } catch (error) {
            console.error(`Failed to capture screenshot ${name}:`, error);
            throw error;
        }
    }

    async compareWithBaseline(name, screenshotPath) {
        const baselinePath = path.join(this.config.baselineDir, `${name}-baseline.png`);
        
        try {
            // Check if baseline exists
            await fs.access(baselinePath);
            
            // Read both images
            const [screenshot, baseline] = await Promise.all([
                fs.readFile(screenshotPath),
                fs.readFile(baselinePath)
            ]);
            
            // Simple hash comparison first
            const screenshotHash = createHash('sha256').update(screenshot).digest('hex');
            const baselineHash = createHash('sha256').update(baseline).digest('hex');
            
            if (screenshotHash === baselineHash) {
                return {
                    match: true,
                    difference: 0
                };
            }
            
            // Pixel-by-pixel comparison would go here
            // For now, we'll use a simplified approach
            const sizeDiff = Math.abs(screenshot.length - baseline.length);
            const percentDiff = (sizeDiff / baseline.length) * 100;
            
            return {
                match: false,
                difference: percentDiff,
                diffPath: await this.createDiffImage(name, screenshot, baseline)
            };
            
        } catch (error) {
            // No baseline exists
            if (error.code === 'ENOENT') {
                // Save current as baseline
                await fs.copyFile(screenshotPath, baselinePath);
                return {
                    match: true,
                    newBaseline: true
                };
            }
            throw error;
        }
    }

    async createDiffImage(name, screenshot, baseline) {
        // Simplified diff creation - in production, use proper image diff library
        const diffPath = path.join(this.config.screenshotDir, 'diffs', `${name}-diff-${Date.now()}.png`);
        
        // For now, just copy the screenshot to diff
        await fs.writeFile(diffPath, screenshot);
        
        return diffPath;
    }

    async captureElement(selector, name) {
        try {
            const element = await this.page.$(selector);
            if (!element) {
                throw new Error(`Element not found: ${selector}`);
            }
            
            const boundingBox = await element.boundingBox();
            if (!boundingBox) {
                throw new Error(`Element has no bounding box: ${selector}`);
            }
            
            return await this.captureScreenshot(name, {
                clip: boundingBox,
                fullPage: false
            });
        } catch (error) {
            console.error(`Failed to capture element ${selector}:`, error);
            throw error;
        }
    }

    async captureViewport(name) {
        return await this.captureScreenshot(name, {
            fullPage: false
        });
    }

    async captureWithHighlight(selector, name, color = 'red') {
        // Highlight element
        await this.page.evaluate((sel, col) => {
            window.__highlightElement(sel, col);
        }, selector, color);
        
        // Wait a bit for highlight to render
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Capture screenshot
        const result = await this.captureScreenshot(name);
        
        // Clear highlights
        await this.page.evaluate(() => {
            window.__clearVisualDebug();
        });
        
        return result;
    }

    async captureWithAnnotation(annotations, name) {
        // Add annotations
        for (const annotation of annotations) {
            await this.page.evaluate((ann) => {
                window.__annotate(ann.x, ann.y, ann.text, ann.color);
            }, annotation);
        }
        
        // Wait for annotations to render
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Capture screenshot
        const result = await this.captureScreenshot(name);
        
        // Clear annotations
        await this.page.evaluate(() => {
            window.__clearVisualDebug();
        });
        
        return result;
    }

    async captureSequence(steps, baseName) {
        const sequence = [];
        
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            
            // Execute step action if provided
            if (step.action) {
                await step.action(this.page);
            }
            
            // Wait if specified
            if (step.wait) {
                await new Promise(resolve => setTimeout(resolve, step.wait));
            }
            
            // Capture screenshot
            const screenshot = await this.captureScreenshot(
                `${baseName}-step-${i + 1}-${step.name || 'unnamed'}`,
                step.options || {}
            );
            
            sequence.push({
                step: i + 1,
                name: step.name,
                screenshot
            });
        }
        
        return sequence;
    }

    async stop() {
        this.isCapturing = false;
        
        // Stop video recording if active
        let videoPath = null;
        if (this.config.recordVideo && this.page.video) {
            try {
                videoPath = await this.page.video().path();
            } catch (error) {
                throw new Error(`BRUTAL: Video path FAILED - ${error.message}`);
            }
        }
        
        // Generate visual report
        const report = await this.generateReport();
        
        return {
            screenshots: this.screenshots,
            videoPath,
            report,
            summary: this.generateSummary()
        };
    }

    async generateReport() {
        const report = {
            totalScreenshots: this.screenshots.length,
            comparisons: {
                total: 0,
                matched: 0,
                different: 0,
                new: 0
            },
            issues: []
        };
        
        // Analyze comparisons
        for (const screenshot of this.screenshots) {
            if (screenshot.comparison) {
                report.comparisons.total++;
                
                if (screenshot.comparison.newBaseline) {
                    report.comparisons.new++;
                } else if (screenshot.comparison.match) {
                    report.comparisons.matched++;
                } else {
                    report.comparisons.different++;
                    report.issues.push({
                        type: 'visual_regression',
                        screenshot: screenshot.name,
                        difference: screenshot.comparison.difference,
                        diffPath: screenshot.comparison.diffPath
                    });
                }
            }
        }
        
        return report;
    }

    generateSummary() {
        const summary = {
            captured: this.screenshots.length,
            regressions: this.screenshots.filter(s => 
                s.comparison && !s.comparison.match && !s.comparison.newBaseline
            ).length,
            newBaselines: this.screenshots.filter(s => 
                s.comparison && s.comparison.newBaseline
            ).length
        };
        
        return summary;
    }
}