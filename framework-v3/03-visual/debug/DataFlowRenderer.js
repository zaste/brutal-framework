/**
 * @fileoverview BRUTAL V3 - Data Flow Renderer
 * Visualizes state changes and data flow between components
 * @version 3.0.0
 */

/**
 * Data Flow Renderer - See your data flow like The Matrix
 */
export class DataFlowRenderer {
    constructor(ctx) {
        this.ctx = ctx;
        
        // Active flows
        this.flows = [];
        this.connections = new Map();
        
        // Visualization settings
        this.settings = {
            lineWidth: 2,
            flowSpeed: 0.5,
            particleSize: 4,
            fadeTime: 2000,
            colors: {
                state: '#00ffff',
                props: '#ffff00',
                events: '#ff00ff',
                shared: '#00ff00'
            }
        };
        
        // SharedArrayBuffer activity
        this.sharedMemoryActivity = [];
        
        // V8 optimization
        this._flowPool = [];
        this._particlePool = [];
    }
    
    /**
     * Render state change
     */
    renderStateChange(component, oldState, newState) {
        if (!component || !component.getBoundingClientRect) {
            return; // Skip if component is invalid
        }
        
        const rect = component.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Create flow visualization
        const flow = this._getFlow();
        flow.type = 'state';
        flow.startTime = performance.now();
        flow.duration = this.settings.fadeTime;
        flow.component = component;
        flow.data = this._diffStates(oldState, newState);
        
        // Create ripple effect
        flow.ripple = {
            x: centerX,
            y: centerY,
            radius: 0,
            maxRadius: 100,
            opacity: 1
        };
        
        // Add data particles
        flow.particles = [];
        for (let i = 0; i < flow.data.length; i++) {
            const angle = (i / flow.data.length) * Math.PI * 2;
            const particle = this._getParticle();
            particle.x = centerX;
            particle.y = centerY;
            particle.vx = Math.cos(angle) * 2;
            particle.vy = Math.sin(angle) * 2;
            particle.data = flow.data[i];
            particle.color = this.settings.colors.state;
            flow.particles.push(particle);
        }
        
        this.flows.push(flow);
        
        // Track connections
        this._trackConnection(component, 'state', flow.data);
    }
    
    /**
     * Render prop flow
     */
    renderPropFlow(fromComponent, toComponent, props) {
        const fromRect = fromComponent.getBoundingClientRect();
        const toRect = toComponent.getBoundingClientRect();
        
        const flow = this._getFlow();
        flow.type = 'props';
        flow.startTime = performance.now();
        flow.duration = 1000;
        flow.from = {
            x: fromRect.left + fromRect.width / 2,
            y: fromRect.top + fromRect.height / 2
        };
        flow.to = {
            x: toRect.left + toRect.width / 2,
            y: toRect.top + toRect.height / 2
        };
        flow.progress = 0;
        flow.data = props;
        flow.color = this.settings.colors.props;
        
        this.flows.push(flow);
    }
    
    /**
     * Render event flow
     */
    renderEventFlow(component, eventName, detail) {
        const rect = component.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        const flow = this._getFlow();
        flow.type = 'event';
        flow.startTime = performance.now();
        flow.duration = 1500;
        flow.x = x;
        flow.y = y;
        flow.eventName = eventName;
        flow.detail = detail;
        flow.radius = 0;
        flow.maxRadius = 150;
        flow.color = this.settings.colors.events;
        
        this.flows.push(flow);
    }
    
    /**
     * Track SharedArrayBuffer activity
     */
    trackSharedMemoryAccess(index, value, operation) {
        const activity = {
            timestamp: performance.now(),
            index,
            value,
            operation, // 'read' | 'write' | 'atomic'
            x: 50 + (index % 10) * 30,
            y: 50 + Math.floor(index / 10) * 30,
            opacity: 1
        };
        
        this.sharedMemoryActivity.push(activity);
        
        // Keep last 50 activities
        if (this.sharedMemoryActivity.length > 50) {
            this.sharedMemoryActivity.shift();
        }
    }
    
    /**
     * Update animations
     */
    update(deltaTime) {
        const now = performance.now();
        
        // Update flows
        for (let i = this.flows.length - 1; i >= 0; i--) {
            const flow = this.flows[i];
            const elapsed = now - flow.startTime;
            const progress = Math.min(elapsed / flow.duration, 1);
            
            switch (flow.type) {
                case 'state':
                    this._updateStateFlow(flow, progress, deltaTime);
                    break;
                case 'props':
                    this._updatePropFlow(flow, progress);
                    break;
                case 'event':
                    this._updateEventFlow(flow, progress);
                    break;
            }
            
            // Remove completed flows
            if (progress >= 1) {
                this._releaseFlow(flow);
                this.flows.splice(i, 1);
            }
        }
        
        // Update shared memory activity
        for (let i = this.sharedMemoryActivity.length - 1; i >= 0; i--) {
            const activity = this.sharedMemoryActivity[i];
            activity.opacity -= deltaTime / 2000; // Fade over 2 seconds
            
            if (activity.opacity <= 0) {
                this.sharedMemoryActivity.splice(i, 1);
            }
        }
    }
    
    /**
     * Render all flows
     */
    render() {
        // Save context state
        this.ctx.save();
        
        // Render connections
        this._renderConnections();
        
        // Render flows
        for (const flow of this.flows) {
            switch (flow.type) {
                case 'state':
                    this._renderStateFlow(flow);
                    break;
                case 'props':
                    this._renderPropFlow(flow);
                    break;
                case 'event':
                    this._renderEventFlow(flow);
                    break;
            }
        }
        
        // Render shared memory activity
        this._renderSharedMemory();
        
        // Restore context
        this.ctx.restore();
    }
    
    /**
     * Update state flow
     */
    _updateStateFlow(flow, progress, deltaTime) {
        // Update ripple
        flow.ripple.radius = flow.ripple.maxRadius * progress;
        flow.ripple.opacity = 1 - progress;
        
        // Update particles
        for (const particle of flow.particles) {
            particle.x += particle.vx * deltaTime * 0.1;
            particle.y += particle.vy * deltaTime * 0.1;
            particle.opacity = 1 - progress;
        }
    }
    
    /**
     * Update prop flow
     */
    _updatePropFlow(flow, progress) {
        flow.progress = progress;
    }
    
    /**
     * Update event flow
     */
    _updateEventFlow(flow, progress) {
        flow.radius = flow.maxRadius * progress;
        flow.opacity = 1 - progress;
    }
    
    /**
     * Render state flow
     */
    _renderStateFlow(flow) {
        // Render ripple
        this.ctx.strokeStyle = this.settings.colors.state;
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = flow.ripple.opacity;
        this.ctx.beginPath();
        this.ctx.arc(flow.ripple.x, flow.ripple.y, flow.ripple.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Render particles
        for (const particle of flow.particles) {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, this.settings.particleSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Render data label
            if (particle.data && particle.opacity > 0.5) {
                this.ctx.font = '10px monospace';
                this.ctx.fillText(
                    `${particle.data.key}: ${JSON.stringify(particle.data.new)}`,
                    particle.x + 10,
                    particle.y
                );
            }
        }
    }
    
    /**
     * Render prop flow
     */
    _renderPropFlow(flow) {
        const x = flow.from.x + (flow.to.x - flow.from.x) * flow.progress;
        const y = flow.from.y + (flow.to.y - flow.from.y) * flow.progress;
        
        // Draw trail
        this.ctx.strokeStyle = flow.color;
        this.ctx.lineWidth = this.settings.lineWidth;
        this.ctx.globalAlpha = 1 - flow.progress * 0.5;
        this.ctx.beginPath();
        this.ctx.moveTo(flow.from.x, flow.from.y);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        
        // Draw data packet
        this.ctx.fillStyle = flow.color;
        this.ctx.globalAlpha = 1;
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.settings.particleSize * 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw arrow
        if (flow.progress < 0.9) {
            const angle = Math.atan2(flow.to.y - flow.from.y, flow.to.x - flow.from.x);
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(angle);
            this.ctx.beginPath();
            this.ctx.moveTo(5, 0);
            this.ctx.lineTo(-5, -5);
            this.ctx.lineTo(-5, 5);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.restore();
        }
    }
    
    /**
     * Render event flow
     */
    _renderEventFlow(flow) {
        this.ctx.strokeStyle = flow.color;
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = flow.opacity;
        
        // Draw expanding circle
        this.ctx.beginPath();
        this.ctx.arc(flow.x, flow.y, flow.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw event name
        if (flow.opacity > 0.5) {
            this.ctx.fillStyle = flow.color;
            this.ctx.font = 'bold 12px monospace';
            this.ctx.fillText(flow.eventName, flow.x + 10, flow.y - flow.radius - 5);
        }
    }
    
    /**
     * Render connections between components
     */
    _renderConnections() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        
        for (const [from, connections] of this.connections) {
            if (!from.isConnected) continue;
            
            const fromRect = from.getBoundingClientRect();
            const fx = fromRect.left + fromRect.width / 2;
            const fy = fromRect.top + fromRect.height / 2;
            
            for (const { to, type, count } of connections) {
                if (!to.isConnected) continue;
                
                const toRect = to.getBoundingClientRect();
                const tx = toRect.left + toRect.width / 2;
                const ty = toRect.top + toRect.height / 2;
                
                // Draw connection line
                this.ctx.globalAlpha = Math.min(count * 0.1, 0.5);
                this.ctx.beginPath();
                this.ctx.moveTo(fx, fy);
                this.ctx.lineTo(tx, ty);
                this.ctx.stroke();
            }
        }
        
        this.ctx.setLineDash([]);
    }
    
    /**
     * Render shared memory activity
     */
    _renderSharedMemory() {
        if (this.sharedMemoryActivity.length === 0) return;
        
        // Draw memory grid background
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
        this.ctx.fillRect(40, 40, 320, 120);
        
        // Draw activities
        for (const activity of this.sharedMemoryActivity) {
            const color = activity.operation === 'write' ? '#ff0000' :
                         activity.operation === 'atomic' ? '#ffff00' : '#00ff00';
            
            this.ctx.fillStyle = color;
            this.ctx.globalAlpha = activity.opacity;
            
            // Draw activity indicator
            this.ctx.beginPath();
            this.ctx.arc(activity.x, activity.y, 10, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw value
            if (activity.opacity > 0.5) {
                this.ctx.font = '10px monospace';
                this.ctx.fillStyle = 'white';
                this.ctx.fillText(activity.value.toString(), activity.x - 5, activity.y + 3);
            }
        }
        
        // Draw label
        this.ctx.globalAlpha = 1;
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        this.ctx.font = 'bold 12px monospace';
        this.ctx.fillText('SharedArrayBuffer Activity', 50, 30);
    }
    
    /**
     * Track connection between components
     */
    _trackConnection(from, type, data) {
        // Find connected components based on data flow
        const connectedElements = this._findConnectedComponents(from, data);
        
        for (const to of connectedElements) {
            if (!this.connections.has(from)) {
                this.connections.set(from, []);
            }
            
            const connections = this.connections.get(from);
            const existing = connections.find(c => c.to === to && c.type === type);
            
            if (existing) {
                existing.count++;
            } else {
                connections.push({ to, type, count: 1 });
            }
        }
    }
    
    /**
     * Find components connected by data flow
     */
    _findConnectedComponents(component, data) {
        const connected = [];
        
        // Check children
        const children = component.querySelectorAll('*');
        for (const child of children) {
            if (child.tagName.includes('-')) {
                connected.push(child);
            }
        }
        
        // Check parent
        if (component.parentElement && component.parentElement.tagName.includes('-')) {
            connected.push(component.parentElement);
        }
        
        return connected;
    }
    
    /**
     * Diff states
     */
    _diffStates(oldState, newState) {
        const changes = [];
        const allKeys = new Set([...Object.keys(oldState || {}), ...Object.keys(newState || {})]);
        
        for (const key of allKeys) {
            if (oldState?.[key] !== newState?.[key]) {
                changes.push({
                    key,
                    old: oldState?.[key],
                    new: newState?.[key]
                });
            }
        }
        
        return changes;
    }
    
    /**
     * Get flow from pool
     */
    _getFlow() {
        return this._flowPool.pop() || {};
    }
    
    /**
     * Release flow to pool
     */
    _releaseFlow(flow) {
        // Clean up particles
        if (flow.particles) {
            for (const particle of flow.particles) {
                this._releaseParticle(particle);
            }
        }
        
        // Reset flow
        flow.type = null;
        flow.particles = null;
        flow.data = null;
        
        this._flowPool.push(flow);
    }
    
    /**
     * Get particle from pool
     */
    _getParticle() {
        return this._particlePool.pop() || {};
    }
    
    /**
     * Release particle to pool
     */
    _releaseParticle(particle) {
        particle.x = 0;
        particle.y = 0;
        particle.vx = 0;
        particle.vy = 0;
        particle.data = null;
        
        this._particlePool.push(particle);
    }
    
    /**
     * Clear all flows
     */
    clear() {
        // Release all flows
        for (const flow of this.flows) {
            this._releaseFlow(flow);
        }
        
        this.flows = [];
        this.connections.clear();
        this.sharedMemoryActivity = [];
    }
    
    /**
     * Destroy the renderer
     */
    destroy() {
        this.clear();
        this._flowPool = [];
        this._particlePool = [];
    }
}