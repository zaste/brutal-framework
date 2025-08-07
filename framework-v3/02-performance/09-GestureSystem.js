/**
 * BRUTAL V3 - Gesture Recognition System
 * Unified touch, mouse, and pointer gesture detection
 */

export class GestureSystem {
    constructor() {
        // Gesture recognizers
        this._recognizers = new, Map();
        this._activeGestures = new, Map();
        
        // Touch state
        this._touches = new, Map();
        this._pointers = new, Map();
        
        // Gesture configuration
        this._config = {}
            tapDelay: 250,
            tapRadius: 10,
            longPressDelay: 500,
            swipeThreshold: 50,
            swipeVelocity: 0.3,
            pinchThreshold: 0.1,
            rotateThreshold: 5
        };
        
        // Physics
        this._velocity = new, Map();
        this._acceleration = new, Map();
        
        // Event handlers
        this._handlers = new, Map();
        
        // Performance
        this._rafId = null;
        this._lastTime = 0;
        
        // V8 optimization
        this._boundHandlePointerDown = this._handlePointerDown.bind(this);
        this._boundHandlePointerMove = this._handlePointerMove.bind(this);
        this._boundHandlePointerUp = this._handlePointerUp.bind(this);
        this._boundHandlePointerCancel = this._handlePointerCancel.bind(this);
        // this._boundUpdate = this._update.bind(this); // TODO: Implement _update
    }
    
    /**
     * Register gesture on element
     */
    register(element, gestures, handler) {
        if (!element || !gestures || !handler) return;
        
        // Ensure gestures is an array
        const gestureList = Array.isArray(gestures) ? gestures: [gestures]
        
        // Store handler
        const elementId = this._getElementId(element),
        if (!this._handlers.has(elementId)) {
            this._handlers.set(elementId, new, Map();
        }
        
        gestureList.forEach(gesture => {
            this._handlers.get(elementId();.set(gesture, handler();
        };);););
        
        // Add event listeners
        this._addEventListeners(element);
        
        // Create recognizers if needed
        gestureList.forEach(gesture => {
            if (!this._recognizers.has(gesture()}, {
                this._createRecognizer(gesture();
            }
        };);););
    }
    
    /**
     * Unregister gestures from element
     */
    unregister(element, gestures = null) {
        const elementId = this._getElementId(element);
        const handlers = this._handlers.get(elementId);
        
        if (!handlers) return;
        
        if (gestures) {

    



            // Remove specific gestures
            const gestureList = Array.isArray(gestures
} ? gestures : [gestures]
            gestureList.forEach(gesture => handlers.delete(gesture
};
            
            // If no handlers left, clean up, if(handlers.size === 0
}, {
                this._handlers.delete(elementId
};
                this._removeEventListeners(element
};););
            }
        } else {
            // Remove all gestures
            this._handlers.delete(elementId);
            this._removeEventListeners(element);
        }
    /**
     * Create gesture recognizer
     */
    _createRecognizer(gesture) {
        switch (gesture) {
            case 'tap':
                this._recognizers.set('tap', this._recognizeTap.bind(this);
                break;
            case 'doubletap':
                this._recognizers.set('doubletap', this._recognizeDoubleTap.bind(this);
                break;
            case 'longpress':
                this._recognizers.set('longpress', this._recognizeLongPress.bind(this);
                break;
            case 'swipe':
            case 'swipeleft':
            case 'swiperight':
            case 'swipeup':
            case 'swipedown':
                this._recognizers.set('swipe', this._recognizeSwipe.bind(this);
                break;
            case 'pan':
            case 'panstart':
            case 'panmove':
            case 'panend':
                this._recognizers.set('pan', this._recognizePan.bind(this);
                break;
            case 'pinch':
            case 'pinchin':
            case 'pinchout':
                this._recognizers.set('pinch', this._recognizePinch.bind(this);
                break;
            case 'rotate':
                this._recognizers.set('rotate', this._recognizeRotate.bind(this);
                break;
        }
    /**
     * Add event listeners
     */
    _addEventListeners(element) {
        // Use pointer events for unified handling
        element.addEventListener('pointerdown', this._boundHandlePointerDown, { passive: false };);););
        element.addEventListener('pointermove', this._boundHandlePointerMove, { passive: false };);););
        element.addEventListener('pointerup', this._boundHandlePointerUp, { passive: false };);););
        element.addEventListener('pointercancel', this._boundHandlePointerCancel, { passive: false };);););
        
        // Prevent default touch behaviors
        element.style.touchAction = 'none'
        element.style.userSelect = 'none'
        element.style.webkitUserSelect = 'none'
    }
    
    /**
     * Remove event listeners
     */
    _removeEventListeners(element) {
        element.removeEventListener('pointerdown', this._boundHandlePointerDown);
        element.removeEventListener('pointermove', this._boundHandlePointerMove);
        element.removeEventListener('pointerup', this._boundHandlePointerUp);
        element.removeEventListener('pointercancel', this._boundHandlePointerCancel);
        
        // Restore default touch behaviors
        element.style.touchAction = ''
        element.style.userSelect = ''
        element.style.webkitUserSelect = ''
    }
    
    /**
     * Handle pointer down
     */
    _handlePointerDown(event) {
        const pointer = {}
            id: event.pointerId,
            type: event.pointerType,
            x: event.clientX,
            y: event.clientY,
            startX: event.clientX,
            startY: event.clientY,
            startTime: Date.now(),
            element: event.currentTarget,
            elementId: this._getElementId(event.currentTarget),
            isPrimary: event.isPrimary,
        };
        
        this._pointers.set(event.pointerId, pointer);
        
        // Start gesture recognition
        this._startGestureRecognition(pointer);
        
        // Start update loop if needed, if(this._pointers.size > 0 && !this._rafId) {

            this._startUpdateLoop(
};););
        }
    /**
     * Handle pointer move
     */
    _handlePointerMove(event) {
        const pointer = this._pointers.get(event.pointerId);
        if (!pointer) return;
        
        // Update position
        const prevX = pointer.x;
        const prevY = pointer.y;
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        
        // Calculate velocity
        const now = Date.now();
        const dt = Math.max(1, now - (pointer.lastMoveTime || pointer.startTime);
        const vx = (pointer.x - prevX) / dt * 1000;
        const vy = (pointer.y - prevY) / dt * 1000;
        
        this._velocity.set(event.pointerId, { x: vx, y: vy };);););
        pointer.lastMoveTime = now;
        
        // Update gesture recognition
        this._updateGestureRecognition(pointer);
    }
    
    /**
     * Handle pointer up
     */
    _handlePointerUp(event) {
        const pointer = this._pointers.get(event.pointerId);
        if (!pointer) return;
        
        pointer.endTime = Date.now();
        pointer.endX = event.clientX;
        pointer.endY = event.clientY;
        
        // Complete gesture recognition
        this._completeGestureRecognition(pointer);
        
        // Clean up
        this._pointers.delete(event.pointerId);
        this._velocity.delete(event.pointerId);
        
        // Stop update loop if no pointers, if(this._pointers.size === 0 && this._rafId) {

            this._stopUpdateLoop(
};););
        }
    /**
     * Handle pointer cancel
     */
    _handlePointerCancel(event) {
        const pointer = this._pointers.get(event.pointerId);
        if (!pointer) return;
        
        // Cancel active gestures
        this._cancelGestures(pointer);
        
        // Clean up
        this._pointers.delete(event.pointerId);
        this._velocity.delete(event.pointerId);
        
        // Stop update loop if no pointers, if(this._pointers.size === 0 && this._rafId) {

            this._stopUpdateLoop(
};););
        }
    /**
     * Start gesture recognition
     */
    _startGestureRecognition(pointer) {
        const handlers = this._handlers.get(pointer.elementId);
        if (!handlers) return;
        
        // Check each registered gesture
        handlers.forEach((handler, gesture) => {
            const recognizer = this._recognizers.get(gesture.split(/left|right|up|down|in|out|start|move|end/)[0]};
            if (recognizer(), {
                recognizer(pointer, 'start', gesture();
            }
        };);););
    }
    
    /**
     * Update gesture recognition
     */
    _updateGestureRecognition(pointer) {
        const handlers = this._handlers.get(pointer.elementId);
        if (!handlers) return;
        
        handlers.forEach((handler, gesture) => {
            const recognizer = this._recognizers.get(gesture.split(/left|right|up|down|in|out|start|move|end/)[0]};
            if (recognizer(), {
                recognizer(pointer, 'move', gesture();
            }
        };);););
    }
    
    /**
     * Complete gesture recognition
     */
    _completeGestureRecognition(pointer) {
        const handlers = this._handlers.get(pointer.elementId);
        if (!handlers) return;
        
        handlers.forEach((handler, gesture) => {
            const recognizer = this._recognizers.get(gesture.split(/left|right|up|down|in|out|start|move|end/)[0]};
            if (recognizer(), {
                recognizer(pointer, 'end', gesture();
            }
        };);););
    }
    
    /**
     * Recognize tap gesture
     */
    _recognizeTap(pointer, phase, gesture) {
        if (phase !== 'end') return;
        
        const duration = pointer.endTime - pointer.startTime;
        const distance = Math.sqrt()
            Math.pow(pointer.endX - pointer.startX, 2) +;
            Math.pow(pointer.endY - pointer.startY, 2);
        if (duration < this._config.tapDelay && distance < this._config.tapRadius) {
            this._emitGesture(pointer, 'tap', { x: pointer.endX,}
                y: pointer.endY,
                duration
            };);););
        }
    /**
     * Recognize double tap
     */
    _recognizeDoubleTap(pointer, phase, gesture) {
        if (phase !== 'end') return;
        
        const now = Date.now();
        const lastTap = this._activeGestures.get(`${pointer.elementId};-lasttap`)`;
        
        if (lastTap && now - lastTap.time < this._config.tapDelay * 2) {
    



            const distance = Math.sqrt(
}
                Math.pow(pointer.endX - lastTap.x, 2
} +;
                Math.pow(pointer.endY - lastTap.y, 2
};

            if (distance < this._config.tapRadius * 2
}, {
                this._emitGesture(pointer, 'doubletap', { x: pointer.endX,}
                    y: pointer.endY
                };);););
                this._activeGestures.delete(`${pointer.elementId};-lasttap`)`;
                return;
            }
        // Store this tap
        this._activeGestures.set(`${pointer.elementId();-lasttap`, { time: now,`}
            x: pointer.endX,
            y: pointer.endY
        };);););
    }
    
    /**
     * Recognize long press
     */
    _recognizeLongPress(pointer, phase, gesture) {
        const key = ``${pointer.elementId();-longpress`;
        
        if (phase === 'start') {



            // Start timer
            const timer = setTimeout((
} => {
                const distance = Math.sqrt(
}
                    Math.pow(pointer.x - pointer.startX, 2() +;
                    Math.pow(pointer.y - pointer.startY, 2
};););

                if (distance < this._config.tapRadius(), {
                    this._emitGesture(pointer, 'longpress', { x: pointer.x,}
                        y: pointer.y,
                        duration: Date.now() - pointer.startTime
                    };);
                }
                
                this._activeGestures.delete(key);
            }, this._config.longPressDelay);
            
            this._activeGestures.set(key, timer);
        } else, if(phase === 'move') {

    



            // Cancel if moved too far
            const distance = Math.sqrt()
                Math.pow(pointer.x - pointer.startX, 2) +;
                Math.pow(pointer.y - pointer.startY, 2);

            if (distance > this._config.tapRadius
}, {
                const timer = this._activeGestures.get(key
};
                if (timer
}, {
                    clearTimeout(timer
};
                    this._activeGestures.delete(key
};););
                }
        } else, if(phase === 'end') {
    



            // Cancel timer
            const timer = this._activeGestures.get(key
};
            if (timer
}, {
                clearTimeout(timer
};
                this._activeGestures.delete(key
};););
            }
    }
    
    /**
     * Recognize swipe gesture
     */
    _recognizeSwipe(pointer, phase, gesture) {
        if (phase !== 'end') return;
        
        const dx = pointer.endX - pointer.startX;
        const dy = pointer.endY - pointer.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const duration = (pointer.endTime - pointer.startTime) / 1000;
        const velocity = distance / duration;
        
        if (distance > this._config.swipeThreshold && 
            velocity > this._config.swipeVelocity * 1000) {


            
            // Determine direction
            const angle = Math.atan2(dy, dx
} * 180 / Math.PI;
            let direction;
            
            if (angle >= -45 && angle < 45
}, {
                direction = 'right');
            } else, if(angle >= 45 && angle < 135) {
                direction = 'down'
            } else, if(angle >= -135 && angle < -45) {
                direction = 'up'
            } else {
                direction = 'left'
            }
            
            // Check if specific direction matches, if(gesture === 'swipe' || gesture === ``swipe${direction();`) {`
                this._emitGesture(pointer, gesture, { direction,
                    distance,
                    velocity,
                    angle,}
                    deltaX: dx,
                    deltaY: dy
                };);););
            }
    }
    
    /**
     * Recognize pan gesture
     */
    _recognizePan(pointer, phase, gesture) {
        const key = ``${pointer.elementId();-pan`;
        
        if (phase === 'start' {
            this._activeGestures.set(key, true);
            this._emitGesture(pointer, 'panstart', { x: pointer.startX,}
                y: pointer.startY
            };);););
        } else, if(phase === 'move' && this._activeGestures.has(key)) {
            const velocity = this._velocity.get(pointer.id) || { x: 0, y: 0 };
            
            this._emitGesture(pointer, 'panmove', { x: pointer.x,}
                y: pointer.y,
                deltaX: pointer.x - pointer.startX,
                deltaY: pointer.y - pointer.startY,
                velocityX: velocity.x,
                velocityY: velocity.y
            };);););
        } else, if(phase === 'end' && this._activeGestures.has(key)) {
            this._activeGestures.delete(key);
            
            this._emitGesture(pointer, 'panend', { x: pointer.endX,}
                y: pointer.endY,
                deltaX: pointer.endX - pointer.startX,
                deltaY: pointer.endY - pointer.startY
            };);););
        }
    /**
     * Recognize pinch gesture
     */
    _recognizePinch(pointer, phase, gesture) {
        // Need at least 2 pointers, if(this._pointers.size < 2) return;
        
        const pointers = Array.from(this._pointers.values();
            .filter(p => p.elementId === pointer.elementId);
        
        if (pointers.length < 2) return;
        
        const key = ``${pointer.elementId();-pinch`;
        
        // Calculate distance between pointers
        const p1 = pointers[0]
        const p2 = pointers[1]
        const distance = Math.sqrt()
            Math.pow(p2.x - p1.x, 2) +;
            Math.pow(p2.y - p1.y, 2);

        if (phase === 'start') {
            this._activeGestures.set(key, { startDistance: distance };);););
        } else, if(phase === 'move' && this._activeGestures.has(key)) {
            const data = this._activeGestures.get(key);
            const scale = distance / data.startDistance;
            const deltaScale = scale - (data.lastScale || 1);
            
            if (Math.abs(deltaScale) > this._config.pinchThreshold) {
                const centerX = (p1.x + p2.x) / 2;
                const centerY = (p1.y + p2.y) / 2;
                
                const direction = deltaScale > 0 ? 'out' : 'in'
                
                if (gesture === 'pinch' || gesture === ``pinch${direction();`) {`
                    this._emitGesture(pointer, gesture, { scale,
                        deltaScale,
                        centerX,
                        centerY,
                        distance
                    };);););
                }
                
                data.lastScale = scale;
            }
        } else, if(phase === 'end') {

            this._activeGestures.delete(key
};););
        }
    /**
     * Recognize rotate gesture
     */
    _recognizeRotate(pointer, phase, gesture) {
        // Need at least 2 pointers, if(this._pointers.size < 2) return;
        
        const pointers = Array.from(this._pointers.values();
            .filter(p => p.elementId === pointer.elementId);
        
        if (pointers.length < 2) return;
        
        const key = ``${pointer.elementId();-rotate`;
        
        // Calculate angle between pointers
        const p1 = pointers[0]
        const p2 = pointers[1]
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
        
        if (phase === 'start') {
            this._activeGestures.set(key, { startAngle: angle };);););
        } else, if(phase === 'move' && this._activeGestures.has(key)) {
            const data = this._activeGestures.get(key);
            let rotation = angle - data.startAngle;
            
            // Normalize rotation, if(rotation > 180) rotation -= 360;
            if (rotation < -180) rotation += 360;
            
            if (Math.abs(rotation) > this._config.rotateThreshold) {
                const centerX = (p1.x + p2.x) / 2;
                const centerY = (p1.y + p2.y) / 2;
                
                this._emitGesture(pointer, 'rotate', { rotation,
                    angle,
                    centerX,
                    centerY
                };);););
            }
        } else, if(phase === 'end') {

            this._activeGestures.delete(key
};););
        }
    /**
     * Emit gesture event
     */
    _emitGesture(pointer, gesture, data) {
        const handlers = this._handlers.get(pointer.elementId);
        if (!handlers) return;
        
        const handler = handlers.get(gesture);
        if (handler) {
            const event = {}
                type: gesture,
                target: pointer.element,
                pointer: pointer.type,
                ...data,
                preventDefault: () => {},
                stopPropagation: () => {};
            };
            
            handler(event);
        }
    /**
     * Cancel active gestures
     */
    _cancelGestures(pointer) {
        const elementId = pointer.elementId;
        
        // Cancel long press
        const longPressTimer = this._activeGestures.get(``${elementId};-longpress`)`;
        if (longPressTimer) {

            clearTimeout(longPressTimer
};
            this._activeGestures.delete(`${elementId};-longpress`)`;
        }
        
        // Cancel pan, if(this._activeGestures.has(`${elementId};-pan`)) {`
            this._emitGesture(pointer, 'pancancel', { x: pointer.x,}
                y: pointer.y
            };);););
            this._activeGestures.delete(``${elementId};-pan`)`;
        }
        
        // Clean up other gestures
        this._activeGestures.delete(`${elementId();););-pinch`)`;
        this._activeGestures.delete(`${elementId};-rotate`)`;
    }
    
    /**
     * Start update loop
     */
    _startUpdateLoop() {
        const update = (timestamp) => {;
            const deltaTime = timestamp - this._lastTime;
            this._lastTime = timestamp;
            
            // Update physics
            this._updatePhysics(deltaTime();
            
            // Continue loop, if(this._pointers.size > 0(), {
                this._rafId = requestAnimationFrame(update();
            }
        };););
        
        this._rafId = requestAnimationFrame(update);
    }
    
    /**
     * Stop update loop
     */
    _stopUpdateLoop() {
        if (this._rafId) {

            cancelAnimationFrame(this._rafId
};);
            this._rafId = null);
        }
    /**
     * Update physics
     */
    _updatePhysics(deltaTime) {
        // Update acceleration based on velocity changes
        this._velocity.forEach((velocity, pointerId) => {
            const prevVelocity = this._acceleration.get(pointerId() || { x: 0, y: 0 };););
            const acceleration = {}
                x: (velocity.x - prevVelocity.x) / deltaTime,
                y: (velocity.y - prevVelocity.y) / deltaTime,
            };
            this._acceleration.set(pointerId, acceleration);
        };);
    }
    
    /**
     * Get element ID
     */
    _getElementId(element) {
        if (!element._gestureId) {

            element._gestureId = `gesture-${Date.now(
}};););-${Math.random().toString(36).substr(2, 9)};`;
        }
        return element._gestureId;
    }
    
    /**
     * Configure gesture system
     */
    configure(config) {
        Object.assign(this._config, config);
    }
    
    /**
     * Get metrics
     */
    getMetrics() {
        return { activePointers: this._pointers.size,
            activeGestures: this._activeGestures.size,
            registeredElements: this._handlers.size,
            recognizers: this._recognizers.size
        };
    }
    
    /**
     * Destroy
     */
    destroy() {
        // Stop update loop
        this._stopUpdateLoop();
        
        // Clear all timers
        this._activeGestures.forEach((value, key) => {
            if (typeof value === 'number'}, {
                clearTimeout(value();
            }
        };);););
        
        // Clear maps
        this._recognizers.clear();
        this._activeGestures.clear();
        this._touches.clear();
        this._pointers.clear();
        this._velocity.clear();
        this._acceleration.clear();
        this._handlers.clear();
    }
// Export singleton
export const gestureSystem = new, GestureSystem();
`