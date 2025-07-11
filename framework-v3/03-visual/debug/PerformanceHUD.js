/**
 * @fileoverview BRUTAL V3 - Performance HUD
 * Real-time performance metrics overlay
 * @version 3.0.0
 */

/**
 * Performance HUD - Real-time metrics at your fingertips
 */
export class PerformanceHUD {
    constructor(ctx) {
        this.ctx = ctx;
        
        // Position and size
        this.x = 10;
        this.y = 10;
        this.width = 300;
        this.height = 200;
        this.minimized = false;
        
        // Metrics history
        this.fpsHistory = new Array(60).fill(60);
        this.memoryHistory = new Array(60).fill(0);
        this.renderHistory = new Array(60).fill(0);
        
        // Performance metrics
        this.fps = 60;
        this.frameTime = 0;
        this.lastFrameTime = performance.now();
        
        // Style
        this.style = {
            background: 'rgba(0, 0, 0, 0.8)',
            border: 'rgba(0, 255, 0, 0.5)',
            text: '#00ff00',
            graph: {
                fps: '#00ff00',
                memory: '#00ffff',
                renders: '#ffff00'
            }
        };
        
        // Performance Gems activity
        this.gemsActivity = new Map();
        
        // V8 optimization
        this._frameCount = 0;
        this._lastFPSUpdate = performance.now();
    }
    
    /**
     * Update metrics
     */
    update(deltaTime) {
        // Calculate FPS
        this._frameCount++;
        const now = performance.now();
        const elapsed = now - this._lastFPSUpdate;
        
        if (elapsed >= 1000) {
            this.fps = Math.round((this._frameCount * 1000) / elapsed);
            this._frameCount = 0;
            this._lastFPSUpdate = now;
            
            // Update history
            this.fpsHistory.shift();
            this.fpsHistory.push(this.fps);
        }
        
        // Frame time
        this.frameTime = deltaTime;
        
        // Memory usage
        if (performance.memory) {
            const memoryMB = performance.memory.usedJSHeapSize / 1024 / 1024;
            this.memoryHistory.shift();
            this.memoryHistory.push(memoryMB);
        }
    }
    
    /**
     * Render the HUD
     */
    render(metrics, deltaTime) {
        // Update metrics
        this.update(deltaTime);
        
        // Update render history
        this.renderHistory.shift();
        this.renderHistory.push(metrics.renders);
        
        if (this.minimized) {
            this._renderMinimized();
        } else {
            this._renderFull(metrics);
        }
    }
    
    /**
     * Render minimized view
     */
    _renderMinimized() {
        // Small FPS counter
        this.ctx.fillStyle = this.style.background;
        this.ctx.fillRect(this.x, this.y, 80, 30);
        
        this.ctx.strokeStyle = this.style.border;
        this.ctx.strokeRect(this.x, this.y, 80, 30);
        
        // FPS text
        this.ctx.fillStyle = this._getFPSColor(this.fps);
        this.ctx.font = 'bold 16px monospace';
        this.ctx.fillText(`${this.fps} FPS`, this.x + 10, this.y + 20);
    }
    
    /**
     * Render full view
     */
    _renderFull(metrics) {
        // Background
        this.ctx.fillStyle = this.style.background;
        this.ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Border
        this.ctx.strokeStyle = this.style.border;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Title
        this.ctx.fillStyle = this.style.text;
        this.ctx.font = 'bold 14px monospace';
        this.ctx.fillText('BRUTAL Performance Monitor', this.x + 10, this.y + 20);
        
        // FPS Section
        this._renderFPSSection();
        
        // Memory Section
        this._renderMemorySection();
        
        // Metrics Section
        this._renderMetricsSection(metrics);
        
        // Graphs
        this._renderGraphs();
        
        // Performance Gems
        this._renderGemsActivity();
    }
    
    /**
     * Render FPS section
     */
    _renderFPSSection() {
        const y = this.y + 35;
        
        // FPS
        this.ctx.fillStyle = this._getFPSColor(this.fps);
        this.ctx.font = 'bold 24px monospace';
        this.ctx.fillText(`${this.fps}`, this.x + 10, y + 20);
        
        this.ctx.font = '12px monospace';
        this.ctx.fillText('FPS', this.x + 50, y + 20);
        
        // Frame time
        this.ctx.fillStyle = this.style.text;
        this.ctx.font = '10px monospace';
        this.ctx.fillText(`Frame: ${this.frameTime.toFixed(2)}ms`, this.x + 10, y + 35);
    }
    
    /**
     * Render memory section
     */
    _renderMemorySection() {
        if (!performance.memory) return;
        
        const y = this.y + 90;
        const memoryMB = performance.memory.usedJSHeapSize / 1024 / 1024;
        const limitMB = performance.memory.jsHeapSizeLimit / 1024 / 1024;
        
        this.ctx.fillStyle = this.style.text;
        this.ctx.font = '10px monospace';
        this.ctx.fillText(`Memory: ${memoryMB.toFixed(1)}MB / ${limitMB.toFixed(0)}MB`, this.x + 10, y);
    }
    
    /**
     * Render metrics section
     */
    _renderMetricsSection(metrics) {
        const y = this.y + 105;
        
        this.ctx.fillStyle = this.style.text;
        this.ctx.font = '10px monospace';
        
        // Render count
        this.ctx.fillText(`Renders: ${metrics.renders}`, this.x + 10, y);
        
        // Component count
        this.ctx.fillText(`Components: ${metrics.activeComponents || 0}`, this.x + 100, y);
        
        // Errors
        const errorColor = metrics.errors > 0 ? '#ff0000' : this.style.text;
        this.ctx.fillStyle = errorColor;
        this.ctx.fillText(`Errors: ${metrics.errors}`, this.x + 200, y);
    }
    
    /**
     * Render graphs
     */
    _renderGraphs() {
        const graphY = this.y + 120;
        const graphHeight = 40;
        const graphWidth = this.width - 20;
        
        // FPS Graph
        this._drawGraph(
            this.x + 10,
            graphY,
            graphWidth,
            graphHeight,
            this.fpsHistory,
            60, // max value
            this.style.graph.fps,
            'FPS'
        );
        
        // Memory Graph (if available)
        if (performance.memory) {
            this._drawGraph(
                this.x + 10,
                graphY + graphHeight + 5,
                graphWidth,
                graphHeight / 2,
                this.memoryHistory,
                Math.max(...this.memoryHistory) || 100,
                this.style.graph.memory,
                'Mem'
            );
        }
    }
    
    /**
     * Draw a graph
     */
    _drawGraph(x, y, width, height, data, maxValue, color, label) {
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(x, y, width, height);
        
        // Border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.strokeRect(x, y, width, height);
        
        // Data
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        
        const stepX = width / (data.length - 1);
        for (let i = 0; i < data.length; i++) {
            const value = data[i];
            const px = x + i * stepX;
            const py = y + height - (value / maxValue) * height;
            
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        
        this.ctx.stroke();
        
        // Label
        this.ctx.fillStyle = color;
        this.ctx.font = '8px monospace';
        this.ctx.fillText(label, x + 2, y + 10);
    }
    
    /**
     * Render Performance Gems activity
     */
    _renderGemsActivity() {
        const y = this.y + this.height - 20;
        
        this.ctx.fillStyle = this.style.text;
        this.ctx.font = '9px monospace';
        this.ctx.fillText('Performance Gems:', this.x + 10, y);
        
        // Gem indicators
        const gems = [
            { name: 'Style', active: this.gemsActivity.get('StyleManager') },
            { name: 'Frag', active: this.gemsActivity.get('FragmentPool') },
            { name: 'DOM', active: this.gemsActivity.get('DOMScheduler') },
            { name: 'Tmpl', active: this.gemsActivity.get('TemplateCache') },
            { name: 'Event', active: this.gemsActivity.get('EventManager') },
            { name: 'Theme', active: this.gemsActivity.get('ThemeEngine') },
            { name: 'Layout', active: this.gemsActivity.get('LayoutOptimizer') }
        ];
        
        let offsetX = 110;
        for (const gem of gems) {
            // Indicator circle
            this.ctx.fillStyle = gem.active ? '#00ff00' : '#333333';
            this.ctx.beginPath();
            this.ctx.arc(this.x + offsetX, y - 3, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Label
            this.ctx.fillStyle = gem.active ? '#00ff00' : '#666666';
            this.ctx.fillText(gem.name, this.x + offsetX + 6, y);
            
            offsetX += 35;
        }
    }
    
    /**
     * Track Performance Gem activity
     */
    trackGemActivity(gemName) {
        this.gemsActivity.set(gemName, true);
        
        // Auto-clear after 100ms
        setTimeout(() => {
            this.gemsActivity.set(gemName, false);
        }, 100);
    }
    
    /**
     * Get FPS color based on performance
     */
    _getFPSColor(fps) {
        if (fps >= 55) return '#00ff00'; // Green
        if (fps >= 30) return '#ffff00'; // Yellow
        return '#ff0000'; // Red
    }
    
    /**
     * Toggle minimized state
     */
    toggle() {
        this.minimized = !this.minimized;
    }
    
    /**
     * Handle window resize
     */
    resize(width, height) {
        // Keep HUD in viewport
        if (this.x + this.width > width) {
            this.x = width - this.width - 10;
        }
        if (this.y + this.height > height) {
            this.y = height - this.height - 10;
        }
    }
    
    /**
     * Export performance data
     */
    exportData() {
        return {
            timestamp: Date.now(),
            fps: {
                current: this.fps,
                history: [...this.fpsHistory],
                average: this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
            },
            memory: {
                history: [...this.memoryHistory],
                current: this.memoryHistory[this.memoryHistory.length - 1]
            },
            frameTime: {
                current: this.frameTime,
                average: this.renderHistory.reduce((a, b) => a + b, 0) / this.renderHistory.length
            }
        };
    }
    
    /**
     * Destroy the HUD
     */
    destroy() {
        // Clear histories
        this.fpsHistory = [];
        this.memoryHistory = [];
        this.renderHistory = [];
        this.gemsActivity.clear();
    }
}