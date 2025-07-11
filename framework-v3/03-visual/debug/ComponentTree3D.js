/**
 * @fileoverview BRUTAL V3 - Component Tree 3D Visualization
 * Interactive 3D visualization of component hierarchy using WebGL
 * @version 3.0.0
 */

import { GPUDetector } from '../gpu/GPUDetector.js';

/**
 * Component Tree 3D - Navigate your app like a spaceship
 */
export class ComponentTree3D {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.gl = null;
        this.webgl2 = false;
        
        // Configuration
        this.config = {
            nodeSize: options.nodeSize || 20,
            edgeWidth: options.edgeWidth || 2,
            levelHeight: options.levelHeight || 100,
            nodeSpacing: options.nodeSpacing || 50,
            animationSpeed: options.animationSpeed || 0.02,
            showLabels: options.showLabels ?? true,
            showStats: options.showStats ?? true,
            ...options
        };
        
        // Scene state
        this.nodes = new Map();
        this.edges = [];
        this.rootNode = null;
        
        // Camera
        this.camera = {
            position: { x: 0, y: 0, z: 500 },
            rotation: { x: 0, y: 0, z: 0 },
            target: { x: 0, y: 0, z: 0 },
            fov: 60,
            near: 0.1,
            far: 10000
        };
        
        // Controls
        this.controls = {
            mouseDown: false,
            lastMouseX: 0,
            lastMouseY: 0,
            zoom: 1,
            autoRotate: true,
            rotationSpeed: 0.001
        };
        
        // Selection
        this.selectedNode = null;
        this.hoveredNode = null;
        
        // Layout engine
        this.layout = {
            type: 'tree', // 'tree' | 'force' | 'radial' | 'grid'
            needsUpdate: true,
            animationProgress: 0
        };
        
        // WebGL resources
        this.shaders = {};
        this.buffers = {};
        this.textures = {};
        this.framebuffers = {};
        
        // Node types with colors
        this.nodeTypes = {
            root: { color: [1.0, 1.0, 1.0, 1.0], icon: '🌍' },
            component: { color: [0.0, 1.0, 0.5, 1.0], icon: '📦' },
            worker: { color: [1.0, 0.5, 0.0, 1.0], icon: '⚙️' },
            gpu: { color: [0.0, 0.5, 1.0, 1.0], icon: '🎮' },
            error: { color: [1.0, 0.0, 0.0, 1.0], icon: '❌' },
            loading: { color: [1.0, 1.0, 0.0, 1.0], icon: '⏳' }
        };
        
        // Performance tracking
        this.stats = {
            nodeCount: 0,
            edgeCount: 0,
            drawCalls: 0,
            vertices: 0,
            fps: 0,
            lastFrame: performance.now()
        };
        
        // Animation state
        this.time = 0;
        this.animationId = null;
        
        // Text rendering (for labels)
        this.labelCanvas = document.createElement('canvas');
        this.labelCtx = this.labelCanvas.getContext('2d');
        this.labelCanvas.width = 2048;
        this.labelCanvas.height = 2048;
        
        // V8 optimizations
        this._boundRender = this._render.bind(this);
        this._boundHandleMouseMove = this._handleMouseMove.bind(this);
        this._boundHandleMouseDown = this._handleMouseDown.bind(this);
        this._boundHandleMouseUp = this._handleMouseUp.bind(this);
        this._boundHandleWheel = this._handleWheel.bind(this);
    }
    
    /**
     * Initialize 3D tree visualization
     */
    async init() {
        // Get WebGL context
        this.gl = this.canvas.getContext('webgl2');
        if (this.gl) {
            this.webgl2 = true;
        } else {
            this.gl = this.canvas.getContext('webgl');
            if (!this.gl) {
                throw new Error('WebGL not supported');
            }
        }
        
        const gl = this.gl;
        
        // Enable depth testing and blending
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        // Initialize shaders
        await this._initShaders();
        
        // Initialize buffers
        this._initBuffers();
        
        // Initialize textures
        this._initTextures();
        
        // Attach event listeners
        this._attachEventListeners();
        
        // Start render loop
        this._startRenderLoop();
        
        }
    
    /**
     * Initialize shaders
     */
    async _initShaders() {
        // Node shader
        const nodeVS = `
            attribute vec3 a_position;
            attribute vec3 a_normal;
            attribute vec2 a_texCoord;
            attribute float a_nodeType;
            
            uniform mat4 u_projection;
            uniform mat4 u_view;
            uniform mat4 u_model;
            uniform float u_time;
            
            varying vec3 v_normal;
            varying vec2 v_texCoord;
            varying float v_nodeType;
            varying vec3 v_position;
            
            void main() {
                vec4 worldPos = u_model * vec4(a_position, 1.0);
                
                // Add floating animation
                worldPos.y += sin(u_time + worldPos.x * 0.01) * 5.0;
                
                v_position = worldPos.xyz;
                v_normal = mat3(u_model) * a_normal;
                v_texCoord = a_texCoord;
                v_nodeType = a_nodeType;
                
                gl_Position = u_projection * u_view * worldPos;
            }
        `;
        
        const nodeFS = `
            precision highp float;
            
            varying vec3 v_normal;
            varying vec2 v_texCoord;
            varying float v_nodeType;
            varying vec3 v_position;
            
            uniform vec4 u_nodeColors[6];
            uniform vec3 u_lightPos;
            uniform vec3 u_cameraPos;
            uniform float u_selected;
            uniform float u_hovered;
            uniform sampler2D u_labelTexture;
            
            void main() {
                // Get node color based on type
                vec4 baseColor = u_nodeColors[int(v_nodeType)];
                
                // Basic lighting
                vec3 normal = normalize(v_normal);
                vec3 lightDir = normalize(u_lightPos - v_position);
                float diffuse = max(dot(normal, lightDir), 0.0);
                
                // Specular
                vec3 viewDir = normalize(u_cameraPos - v_position);
                vec3 reflectDir = reflect(-lightDir, normal);
                float specular = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
                
                // Rim lighting
                float rim = 1.0 - max(dot(viewDir, normal), 0.0);
                rim = pow(rim, 2.0);
                
                // Combine lighting
                vec3 color = baseColor.rgb * (0.3 + diffuse * 0.7) + specular * 0.5;
                color += baseColor.rgb * rim * 0.3;
                
                // Selection/hover highlight
                if (u_selected > 0.5) {
                    color = mix(color, vec3(1.0, 1.0, 0.0), 0.5);
                } else if (u_hovered > 0.5) {
                    color = mix(color, vec3(1.0, 1.0, 1.0), 0.3);
                }
                
                // Pulse effect
                float pulse = sin(u_time * 3.0) * 0.5 + 0.5;
                color += baseColor.rgb * pulse * 0.1;
                
                gl_FragColor = vec4(color, baseColor.a);
            }
        `;
        
        // Edge shader
        const edgeVS = `
            attribute vec3 a_position;
            attribute float a_progress;
            
            uniform mat4 u_projection;
            uniform mat4 u_view;
            uniform float u_time;
            
            varying float v_progress;
            
            void main() {
                v_progress = a_progress;
                gl_Position = u_projection * u_view * vec4(a_position, 1.0);
            }
        `;
        
        const edgeFS = `
            precision highp float;
            
            varying float v_progress;
            
            uniform vec4 u_edgeColor;
            uniform float u_time;
            uniform float u_flowSpeed;
            
            void main() {
                // Data flow animation
                float flow = fract(v_progress - u_time * u_flowSpeed);
                float intensity = smoothstep(0.0, 0.1, flow) * smoothstep(1.0, 0.9, flow);
                
                vec3 color = u_edgeColor.rgb;
                color += vec3(0.5, 0.5, 1.0) * intensity;
                
                float alpha = u_edgeColor.a * (0.5 + intensity * 0.5);
                
                gl_FragColor = vec4(color, alpha);
            }
        `;
        
        // Compile shaders
        this.shaders.node = this._createShaderProgram(nodeVS, nodeFS);
        this.shaders.edge = this._createShaderProgram(edgeVS, edgeFS);
    }
    
    /**
     * Create shader program
     */
    _createShaderProgram(vsSource, fsSource) {
        const gl = this.gl;
        
        const vertexShader = this._loadShader(gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this._loadShader(gl.FRAGMENT_SHADER, fsSource);
        
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            );
            return null;
        }
        
        // Get attribute and uniform locations
        const attributes = {};
        const uniforms = {};
        
        const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < numAttributes; i++) {
            const info = gl.getActiveAttrib(program, i);
            attributes[info.name] = gl.getAttribLocation(program, info.name);
        }
        
        const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < numUniforms; i++) {
            const info = gl.getActiveUniform(program, i);
            uniforms[info.name] = gl.getUniformLocation(program, info.name);
        }
        
        return { program, attributes, uniforms };
    }
    
    /**
     * Load shader
     */
    _loadShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            );
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    /**
     * Initialize buffers
     */
    _initBuffers() {
        const gl = this.gl;
        
        // Create sphere geometry for nodes
        const sphere = this._createSphere(1, 16, 16);
        
        this.buffers.nodeVertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.nodeVertices);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.vertices), gl.STATIC_DRAW);
        
        this.buffers.nodeNormals = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.nodeNormals);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.normals), gl.STATIC_DRAW);
        
        this.buffers.nodeTexCoords = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.nodeTexCoords);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.texCoords), gl.STATIC_DRAW);
        
        this.buffers.nodeIndices = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.nodeIndices);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphere.indices), gl.STATIC_DRAW);
        
        this.nodeIndexCount = sphere.indices.length;
        
        // Edge buffers (will be updated dynamically)
        this.buffers.edgeVertices = gl.createBuffer();
        this.buffers.edgeProgress = gl.createBuffer();
    }
    
    /**
     * Create sphere geometry
     */
    _createSphere(radius, widthSegments, heightSegments) {
        const vertices = [];
        const normals = [];
        const texCoords = [];
        const indices = [];
        
        for (let y = 0; y <= heightSegments; y++) {
            const v = y / heightSegments;
            const phi = v * Math.PI;
            
            for (let x = 0; x <= widthSegments; x++) {
                const u = x / widthSegments;
                const theta = u * Math.PI * 2;
                
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                const sinTheta = Math.sin(theta);
                const cosTheta = Math.cos(theta);
                
                const nx = cosTheta * sinPhi;
                const ny = cosPhi;
                const nz = sinTheta * sinPhi;
                
                vertices.push(radius * nx, radius * ny, radius * nz);
                normals.push(nx, ny, nz);
                texCoords.push(u, v);
            }
        }
        
        for (let y = 0; y < heightSegments; y++) {
            for (let x = 0; x < widthSegments; x++) {
                const a = (widthSegments + 1) * y + x;
                const b = (widthSegments + 1) * (y + 1) + x;
                const c = (widthSegments + 1) * (y + 1) + (x + 1);
                const d = (widthSegments + 1) * y + (x + 1);
                
                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }
        
        return { vertices, normals, texCoords, indices };
    }
    
    /**
     * Initialize textures
     */
    _initTextures() {
        const gl = this.gl;
        
        // Label texture
        this.textures.labels = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.textures.labels);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.labelCanvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }
    
    /**
     * Add component node
     */
    addNode(id, data) {
        const node = {
            id,
            parent: data.parent || null,
            children: [],
            type: data.type || 'component',
            label: data.label || id,
            position: { x: 0, y: 0, z: 0 },
            targetPosition: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            size: this.config.nodeSize,
            level: 0,
            expanded: true,
            stats: data.stats || {},
            metadata: data.metadata || {}
        };
        
        this.nodes.set(id, node);
        
        // Update parent's children
        if (node.parent && this.nodes.has(node.parent)) {
            const parent = this.nodes.get(node.parent);
            parent.children.push(id);
            node.level = parent.level + 1;
        } else if (!this.rootNode) {
            this.rootNode = id;
        }
        
        // Update stats
        this.stats.nodeCount = this.nodes.size;
        
        // Trigger layout update
        this.layout.needsUpdate = true;
        
        return node;
    }
    
    /**
     * Remove node
     */
    removeNode(id) {
        const node = this.nodes.get(id);
        if (!node) return;
        
        // Remove from parent's children
        if (node.parent && this.nodes.has(node.parent)) {
            const parent = this.nodes.get(node.parent);
            parent.children = parent.children.filter(child => child !== id);
        }
        
        // Remove all children recursively
        node.children.forEach(childId => this.removeNode(childId));
        
        // Remove edges connected to this node
        this.edges = this.edges.filter(edge => 
            edge.source !== id && edge.target !== id
        );
        
        this.nodes.delete(id);
        this.stats.nodeCount = this.nodes.size;
        this.layout.needsUpdate = true;
    }
    
    /**
     * Add edge between nodes
     */
    addEdge(sourceId, targetId, data = {}) {
        if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) return;
        
        const edge = {
            source: sourceId,
            target: targetId,
            type: data.type || 'data',
            strength: data.strength || 1.0,
            color: data.color || [0.5, 0.5, 1.0, 0.5]
        };
        
        this.edges.push(edge);
        this.stats.edgeCount = this.edges.length;
        
        return edge;
    }
    
    /**
     * Update node stats
     */
    updateNodeStats(id, stats) {
        const node = this.nodes.get(id);
        if (!node) return;
        
        node.stats = { ...node.stats, ...stats };
        
        // Update node appearance based on stats
        if (stats.error) {
            node.type = 'error';
        } else if (stats.loading) {
            node.type = 'loading';
        }
    }
    
    /**
     * Apply layout algorithm
     */
    _applyLayout() {
        if (!this.layout.needsUpdate) return;
        
        switch (this.layout.type) {
            case 'tree':
                this._applyTreeLayout();
                break;
            case 'force':
                this._applyForceLayout();
                break;
            case 'radial':
                this._applyRadialLayout();
                break;
            case 'grid':
                this._applyGridLayout();
                break;
        }
        
        this.layout.needsUpdate = false;
        this.layout.animationProgress = 0;
    }
    
    /**
     * Apply tree layout
     */
    _applyTreeLayout() {
        if (!this.rootNode) return;
        
        const visited = new Set();
        const queue = [{
            id: this.rootNode,
            x: 0,
            depth: 0,
            spread: Math.PI * 2
        }];
        
        while (queue.length > 0) {
            const { id, x, depth, spread } = queue.shift();
            if (visited.has(id)) continue;
            
            visited.add(id);
            const node = this.nodes.get(id);
            if (!node) continue;
            
            // Set target position
            node.targetPosition = {
                x: x * this.config.nodeSpacing,
                y: -depth * this.config.levelHeight,
                z: 0
            };
            
            // Process children
            if (node.expanded && node.children.length > 0) {
                const childSpread = spread / node.children.length;
                const startAngle = -spread / 2;
                
                node.children.forEach((childId, i) => {
                    const angle = startAngle + (i + 0.5) * childSpread;
                    const radius = this.config.nodeSpacing * (depth + 1);
                    
                    queue.push({
                        id: childId,
                        x: x + Math.sin(angle) * radius / this.config.nodeSpacing,
                        depth: depth + 1,
                        spread: childSpread
                    });
                });
            }
        }
    }
    
    /**
     * Apply force-directed layout
     */
    _applyForceLayout() {
        const nodes = Array.from(this.nodes.values());
        const iterations = 50;
        
        for (let iter = 0; iter < iterations; iter++) {
            // Apply repulsion between all nodes
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const a = nodes[i];
                    const b = nodes[j];
                    
                    const dx = a.position.x - b.position.x;
                    const dy = a.position.y - b.position.y;
                    const dz = a.position.z - b.position.z;
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
                    
                    const force = 1000 / (dist * dist);
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    const fz = (dz / dist) * force;
                    
                    a.velocity.x += fx;
                    a.velocity.y += fy;
                    a.velocity.z += fz;
                    b.velocity.x -= fx;
                    b.velocity.y -= fy;
                    b.velocity.z -= fz;
                }
            }
            
            // Apply attraction along edges
            this.edges.forEach(edge => {
                const source = this.nodes.get(edge.source);
                const target = this.nodes.get(edge.target);
                if (!source || !target) return;
                
                const dx = target.position.x - source.position.x;
                const dy = target.position.y - source.position.y;
                const dz = target.position.z - source.position.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
                
                const force = (dist - this.config.nodeSpacing * 2) * 0.01;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;
                const fz = (dz / dist) * force;
                
                source.velocity.x += fx;
                source.velocity.y += fy;
                source.velocity.z += fz;
                target.velocity.x -= fx;
                target.velocity.y -= fy;
                target.velocity.z -= fz;
            });
            
            // Apply velocities with damping
            nodes.forEach(node => {
                node.targetPosition.x = node.position.x + node.velocity.x;
                node.targetPosition.y = node.position.y + node.velocity.y;
                node.targetPosition.z = node.position.z + node.velocity.z;
                
                node.velocity.x *= 0.8;
                node.velocity.y *= 0.8;
                node.velocity.z *= 0.8;
            });
        }
    }
    
    /**
     * Update node positions with smooth animation
     */
    _updateNodePositions(deltaTime) {
        const lerpFactor = 1 - Math.exp(-deltaTime * 5);
        
        this.nodes.forEach(node => {
            node.position.x += (node.targetPosition.x - node.position.x) * lerpFactor;
            node.position.y += (node.targetPosition.y - node.position.y) * lerpFactor;
            node.position.z += (node.targetPosition.z - node.position.z) * lerpFactor;
        });
    }
    
    /**
     * Update edge geometry
     */
    _updateEdgeGeometry() {
        const vertices = [];
        const progress = [];
        
        this.edges.forEach(edge => {
            const source = this.nodes.get(edge.source);
            const target = this.nodes.get(edge.target);
            if (!source || !target) return;
            
            // Create bezier curve for edge
            const midX = (source.position.x + target.position.x) / 2;
            const midY = (source.position.y + target.position.y) / 2 - 50;
            const midZ = (source.position.z + target.position.z) / 2;
            
            // Sample curve
            const segments = 20;
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const t2 = t * t;
                const t3 = t2 * t;
                
                // Cubic bezier
                const x = (1 - t) * (1 - t) * (1 - t) * source.position.x +
                         3 * (1 - t) * (1 - t) * t * source.position.x +
                         3 * (1 - t) * t * t * target.position.x +
                         t * t * t * target.position.x;
                
                const y = (1 - t) * (1 - t) * (1 - t) * source.position.y +
                         3 * (1 - t) * (1 - t) * t * midY +
                         3 * (1 - t) * t * t * midY +
                         t * t * t * target.position.y;
                
                const z = (1 - t) * (1 - t) * (1 - t) * source.position.z +
                         3 * (1 - t) * (1 - t) * t * midZ +
                         3 * (1 - t) * t * t * midZ +
                         t * t * t * target.position.z;
                
                vertices.push(x, y, z);
                progress.push(t);
            }
        });
        
        // Update buffers
        const gl = this.gl;
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.edgeVertices);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.edgeProgress);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(progress), gl.DYNAMIC_DRAW);
        
        this.edgeVertexCount = vertices.length / 3;
    }
    
    /**
     * Render frame
     */
    _render(timestamp) {
        const deltaTime = (timestamp - this.stats.lastFrame) / 1000;
        this.stats.lastFrame = timestamp;
        this.stats.fps = 1 / deltaTime;
        
        this.time += deltaTime;
        
        // Update layout
        this._applyLayout();
        this._updateNodePositions(deltaTime);
        this._updateEdgeGeometry();
        
        // Update camera
        if (this.controls.autoRotate) {
            this.camera.rotation.y += this.controls.rotationSpeed * deltaTime * 60;
        }
        
        // Clear
        const gl = this.gl;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0.05, 0.05, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Calculate matrices
        const projection = this._perspective(
            this.camera.fov * Math.PI / 180,
            this.canvas.width / this.canvas.height,
            this.camera.near,
            this.camera.far
        );
        
        const view = this._lookAt(
            this.camera.position,
            this.camera.target,
            { x: 0, y: 1, z: 0 }
        );
        
        // Apply camera rotation
        const rotation = this._rotationMatrix(
            this.camera.rotation.x,
            this.camera.rotation.y,
            this.camera.rotation.z
        );
        
        const viewRotated = this._multiplyMatrices(view, rotation);
        
        // Render edges first
        this._renderEdges(projection, viewRotated);
        
        // Render nodes
        this._renderNodes(projection, viewRotated);
        
        // Update stats
        this.stats.drawCalls = 0;
        
        // Continue render loop
        this.animationId = requestAnimationFrame(this._boundRender);
    }
    
    /**
     * Render edges
     */
    _renderEdges(projection, view) {
        const gl = this.gl;
        const shader = this.shaders.edge;
        
        gl.useProgram(shader.program);
        
        // Set uniforms
        gl.uniformMatrix4fv(shader.uniforms.u_projection, false, projection);
        gl.uniformMatrix4fv(shader.uniforms.u_view, false, view);
        gl.uniform1f(shader.uniforms.u_time, this.time);
        gl.uniform1f(shader.uniforms.u_flowSpeed, 0.5);
        gl.uniform4fv(shader.uniforms.u_edgeColor, [0.2, 0.5, 1.0, 0.5]);
        
        // Bind buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.edgeVertices);
        gl.vertexAttribPointer(shader.attributes.a_position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shader.attributes.a_position);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.edgeProgress);
        gl.vertexAttribPointer(shader.attributes.a_progress, 1, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shader.attributes.a_progress);
        
        // Draw as line strip
        gl.lineWidth(this.config.edgeWidth);
        
        let offset = 0;
        const segmentsPerEdge = 21;
        
        this.edges.forEach(edge => {
            gl.drawArrays(gl.LINE_STRIP, offset, segmentsPerEdge);
            offset += segmentsPerEdge;
            this.stats.drawCalls++;
        });
    }
    
    /**
     * Render nodes
     */
    _renderNodes(projection, view) {
        const gl = this.gl;
        const shader = this.shaders.node;
        
        gl.useProgram(shader.program);
        
        // Set uniforms
        gl.uniformMatrix4fv(shader.uniforms.u_projection, false, projection);
        gl.uniformMatrix4fv(shader.uniforms.u_view, false, view);
        gl.uniform1f(shader.uniforms.u_time, this.time);
        gl.uniform3fv(shader.uniforms.u_lightPos, [100, 200, 300]);
        gl.uniform3fv(shader.uniforms.u_cameraPos, [
            this.camera.position.x,
            this.camera.position.y,
            this.camera.position.z
        ]);
        
        // Set node colors
        const colors = Object.values(this.nodeTypes).map(type => type.color).flat();
        gl.uniform4fv(shader.uniforms.u_nodeColors, colors);
        
        // Bind buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.nodeVertices);
        gl.vertexAttribPointer(shader.attributes.a_position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shader.attributes.a_position);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.nodeNormals);
        gl.vertexAttribPointer(shader.attributes.a_normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shader.attributes.a_normal);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.nodeTexCoords);
        gl.vertexAttribPointer(shader.attributes.a_texCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shader.attributes.a_texCoord);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.nodeIndices);
        
        // Render each node
        this.nodes.forEach(node => {
            // Model matrix
            const model = this._translationMatrix(
                node.position.x,
                node.position.y,
                node.position.z
            );
            
            const scale = this._scaleMatrix(
                node.size,
                node.size,
                node.size
            );
            
            const modelScaled = this._multiplyMatrices(model, scale);
            
            gl.uniformMatrix4fv(shader.uniforms.u_model, false, modelScaled);
            
            // Node type
            const typeIndex = Object.keys(this.nodeTypes).indexOf(node.type);
            gl.vertexAttrib1f(shader.attributes.a_nodeType, typeIndex);
            
            // Selection state
            gl.uniform1f(shader.uniforms.u_selected, node === this.selectedNode ? 1.0 : 0.0);
            gl.uniform1f(shader.uniforms.u_hovered, node === this.hoveredNode ? 1.0 : 0.0);
            
            // Draw
            gl.drawElements(gl.TRIANGLES, this.nodeIndexCount, gl.UNSIGNED_SHORT, 0);
            this.stats.drawCalls++;
        });
    }
    
    /**
     * Matrix math helpers
     */
    _perspective(fov, aspect, near, far) {
        const f = 1.0 / Math.tan(fov / 2);
        const nf = 1 / (near - far);
        
        return new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) * nf, -1,
            0, 0, (2 * far * near) * nf, 0
        ]);
    }
    
    _lookAt(eye, target, up) {
        const zAxis = this._normalize({
            x: eye.x - target.x,
            y: eye.y - target.y,
            z: eye.z - target.z
        });
        
        const xAxis = this._normalize(this._cross(up, zAxis));
        const yAxis = this._cross(zAxis, xAxis);
        
        return new Float32Array([
            xAxis.x, xAxis.y, xAxis.z, 0,
            yAxis.x, yAxis.y, yAxis.z, 0,
            zAxis.x, zAxis.y, zAxis.z, 0,
            -this._dot(xAxis, eye),
            -this._dot(yAxis, eye),
            -this._dot(zAxis, eye),
            1
        ]);
    }
    
    _translationMatrix(x, y, z) {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, z, 1
        ]);
    }
    
    _scaleMatrix(x, y, z) {
        return new Float32Array([
            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1
        ]);
    }
    
    _rotationMatrix(x, y, z) {
        const cx = Math.cos(x), sx = Math.sin(x);
        const cy = Math.cos(y), sy = Math.sin(y);
        const cz = Math.cos(z), sz = Math.sin(z);
        
        return new Float32Array([
            cy * cz, sx * sy * cz - cx * sz, cx * sy * cz + sx * sz, 0,
            cy * sz, sx * sy * sz + cx * cz, cx * sy * sz - sx * cz, 0,
            -sy, sx * cy, cx * cy, 0,
            0, 0, 0, 1
        ]);
    }
    
    _multiplyMatrices(a, b) {
        const result = new Float32Array(16);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                result[i * 4 + j] = 0;
                for (let k = 0; k < 4; k++) {
                    result[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j];
                }
            }
        }
        return result;
    }
    
    _normalize(v) {
        const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        return {
            x: v.x / len,
            y: v.y / len,
            z: v.z / len
        };
    }
    
    _cross(a, b) {
        return {
            x: a.y * b.z - a.z * b.y,
            y: a.z * b.x - a.x * b.z,
            z: a.x * b.y - a.y * b.x
        };
    }
    
    _dot(a, b) {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }
    
    /**
     * Event listeners
     */
    _attachEventListeners() {
        this.canvas.addEventListener('mousedown', this._boundHandleMouseDown);
        this.canvas.addEventListener('mousemove', this._boundHandleMouseMove);
        this.canvas.addEventListener('mouseup', this._boundHandleMouseUp);
        this.canvas.addEventListener('wheel', this._boundHandleWheel);
        
        // Handle resize
        window.addEventListener('resize', () => {
            this.canvas.width = this.canvas.parentElement.clientWidth;
            this.canvas.height = this.canvas.parentElement.clientHeight;
        });
    }
    
    _handleMouseDown(e) {
        this.controls.mouseDown = true;
        this.controls.lastMouseX = e.clientX;
        this.controls.lastMouseY = e.clientY;
        
        // Check for node selection
        this._pickNode(e.clientX, e.clientY);
    }
    
    _handleMouseMove(e) {
        if (this.controls.mouseDown) {
            const deltaX = e.clientX - this.controls.lastMouseX;
            const deltaY = e.clientY - this.controls.lastMouseY;
            
            this.camera.rotation.y += deltaX * 0.01;
            this.camera.rotation.x += deltaY * 0.01;
            
            this.controls.lastMouseX = e.clientX;
            this.controls.lastMouseY = e.clientY;
        }
        
        // Update hover
        this._updateHover(e.clientX, e.clientY);
    }
    
    _handleMouseUp() {
        this.controls.mouseDown = false;
    }
    
    _handleWheel(e) {
        e.preventDefault();
        
        const delta = e.deltaY * 0.01;
        this.controls.zoom = Math.max(0.1, Math.min(10, this.controls.zoom + delta));
        
        this.camera.position.z = 500 * this.controls.zoom;
    }
    
    /**
     * Node picking (simplified)
     */
    _pickNode(x, y) {
        // Convert mouse coords to normalized device coords
        const rect = this.canvas.getBoundingClientRect();
        const ndcX = ((x - rect.left) / rect.width) * 2 - 1;
        const ndcY = -((y - rect.top) / rect.height) * 2 + 1;
        
        // Find closest node (simplified - in production use ray casting)
        let closestNode = null;
        let closestDistance = Infinity;
        
        this.nodes.forEach(node => {
            // Project node position to screen
            // This is simplified - proper implementation would use full projection
            const screenX = node.position.x / this.camera.position.z;
            const screenY = node.position.y / this.camera.position.z;
            
            const dist = Math.sqrt(
                Math.pow(screenX - ndcX, 2) +
                Math.pow(screenY - ndcY, 2)
            );
            
            if (dist < closestDistance && dist < 0.1) {
                closestDistance = dist;
                closestNode = node;
            }
        });
        
        this.selectedNode = closestNode;
        
        if (closestNode) {
            // Emit selection event
            window.dispatchEvent(new CustomEvent('brutal:node-selected', {
                detail: { node: closestNode }
            }));
        }
    }
    
    _updateHover(x, y) {
        // Similar to pick but for hover
        // Update this.hoveredNode
    }
    
    /**
     * Start render loop
     */
    _startRenderLoop() {
        this.stats.lastFrame = performance.now();
        this.animationId = requestAnimationFrame(this._boundRender);
    }
    
    /**
     * Set layout type
     */
    setLayout(type) {
        this.layout.type = type;
        this.layout.needsUpdate = true;
    }
    
    /**
     * Focus on node
     */
    focusNode(id) {
        const node = this.nodes.get(id);
        if (!node) return;
        
        // Animate camera to focus on node
        this.camera.target = { ...node.position };
        this.selectedNode = node;
    }
    
    /**
     * Expand/collapse node
     */
    toggleNode(id) {
        const node = this.nodes.get(id);
        if (!node) return;
        
        node.expanded = !node.expanded;
        this.layout.needsUpdate = true;
    }
    
    /**
     * Get stats
     */
    getStats() {
        return {
            nodes: this.stats.nodeCount,
            edges: this.stats.edgeCount,
            fps: Math.round(this.stats.fps),
            drawCalls: this.stats.drawCalls
        };
    }
    
    /**
     * Destroy
     */
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Clean up WebGL resources
        const gl = this.gl;
        
        Object.values(this.buffers).forEach(buffer => {
            gl.deleteBuffer(buffer);
        });
        
        Object.values(this.textures).forEach(texture => {
            gl.deleteTexture(texture);
        });
        
        Object.values(this.shaders).forEach(shader => {
            gl.deleteProgram(shader.program);
        });
        
        // Remove event listeners
        this.canvas.removeEventListener('mousedown', this._boundHandleMouseDown);
        this.canvas.removeEventListener('mousemove', this._boundHandleMouseMove);
        this.canvas.removeEventListener('mouseup', this._boundHandleMouseUp);
        this.canvas.removeEventListener('wheel', this._boundHandleWheel);
        
        // Clear data
        this.nodes.clear();
        this.edges = [];
    }
}