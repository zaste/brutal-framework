/**
 * Drag & Drop System - Visual component manipulation
 * High-performance drag and drop with smooth animations
 */

export class DragDropSystem {
    constructor(config = {}) {
        this.config = {
            snapToGrid: true,
            gridSize: 8,
            animationDuration: 200,
            placeholder: true,
            multiSelect: true,
            autoScroll: true,
            ...config
        };
        
        this.dropZones = new Map();
        this.draggables = new Map();
        this.activeElement = null;
        this.ghostElement = null;
        this.placeholder = null;
        this.selectedItems = new Set();
        
        // Performance optimizations
        this.rafId = null;
        this.scrollRafId = null;
        this.isDragging = false;
        
        // State
        this.dragState = {
            startX: 0,
            startY: 0,
            offsetX: 0,
            offsetY: 0,
            currentZone: null,
            validZones: new Set()
        };
        
        this.init();
    }

    init() {
        // Global event listeners
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Touch support
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Create styles
        this.injectStyles();
    }

    injectStyles() {
        if (document.getElementById('brutal-dragdrop-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'brutal-dragdrop-styles';
        style.textContent = `
            .brutal-draggable {
                cursor: move;
                touch-action: none;
                user-select: none;
                transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .brutal-draggable.dragging {
                opacity: 0.5;
                pointer-events: none;
            }
            
            .brutal-draggable.selected {
                outline: 2px solid #3b82f6;
                outline-offset: 2px;
            }
            
            .brutal-ghost {
                position: fixed;
                pointer-events: none;
                z-index: 9999;
                opacity: 0.8;
                transform: scale(1.05);
                filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3));
            }
            
            .brutal-dropzone {
                position: relative;
                min-height: 100px;
                transition: all 0.2s ease;
            }
            
            .brutal-dropzone.drag-over {
                background: rgba(59, 130, 246, 0.1);
                border: 2px dashed #3b82f6;
            }
            
            .brutal-placeholder {
                background: rgba(59, 130, 246, 0.2);
                border: 2px dashed #3b82f6;
                border-radius: 4px;
                transition: all 0.2s ease;
            }
            
            .brutal-drop-indicator {
                position: absolute;
                height: 2px;
                background: #3b82f6;
                pointer-events: none;
                z-index: 9998;
                animation: pulse 1s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            .brutal-auto-scroll-zone {
                position: fixed;
                pointer-events: none;
                z-index: 9997;
            }
            
            .brutal-auto-scroll-zone.top {
                top: 0;
                left: 0;
                right: 0;
                height: 50px;
                background: linear-gradient(to bottom, rgba(0,0,0,0.1), transparent);
            }
            
            .brutal-auto-scroll-zone.bottom {
                bottom: 0;
                left: 0;
                right: 0;
                height: 50px;
                background: linear-gradient(to top, rgba(0,0,0,0.1), transparent);
            }
        `;
        document.head.appendChild(style);
    }

    // Make element draggable
    enableDrag(element, options = {}) {
        const config = {
            handle: null,
            data: {},
            group: 'default',
            disabled: false,
            ...options
        };
        
        element.classList.add('brutal-draggable');
        element.draggable = false; // Disable native drag
        
        const handle = config.handle ? element.querySelector(config.handle) : element;
        
        this.draggables.set(element, {
            element,
            handle,
            config,
            originalParent: element.parentNode,
            originalIndex: Array.from(element.parentNode.children).indexOf(element)
        });
        
        // Mouse events
        handle.addEventListener('mousedown', (e) => this.handleMouseDown(e, element));
        
        // Touch events
        handle.addEventListener('touchstart', (e) => this.handleTouchStart(e, element), { passive: false });
        
        return element;
    }

    // Create drop zone
    createDropZone(element, options = {}) {
        const config = {
            accepts: ['default'],
            maxItems: Infinity,
            sortable: true,
            direction: 'vertical',
            onDragEnter: null,
            onDragLeave: null,
            onDrop: null,
            ...options
        };
        
        element.classList.add('brutal-dropzone');
        
        this.dropZones.set(element, {
            element,
            config,
            items: []
        });
        
        // Drop zone events
        element.addEventListener('dragover', (e) => e.preventDefault());
        
        return element;
    }

    // Mouse/Touch handlers
    handleMouseDown(e, element) {
        if (e.button !== 0) return; // Only left click
        
        const draggable = this.draggables.get(element);
        if (!draggable || draggable.config.disabled) return;
        
        e.preventDefault();
        this.startDrag(e.clientX, e.clientY, element);
    }

    handleTouchStart(e, element) {
        const draggable = this.draggables.get(element);
        if (!draggable || draggable.config.disabled) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        this.startDrag(touch.clientX, touch.clientY, element);
    }

    startDrag(x, y, element) {
        this.isDragging = true;
        this.activeElement = element;
        
        const rect = element.getBoundingClientRect();
        
        this.dragState = {
            startX: x,
            startY: y,
            offsetX: x - rect.left,
            offsetY: y - rect.top,
            currentZone: this.findDropZone(element),
            validZones: this.findValidDropZones(element)
        };
        
        // Multi-select support
        if (!this.selectedItems.has(element)) {
            if (!this.config.multiSelect || !this.isMultiSelectKey) {
                this.selectedItems.clear();
            }
            this.selectedItems.add(element);
        }
        
        // Create ghost element
        this.createGhost(element);
        
        // Add dragging class
        this.selectedItems.forEach(item => item.classList.add('dragging'));
        
        // Create placeholder
        if (this.config.placeholder) {
            this.createPlaceholder(element);
        }
        
        // Start auto-scroll detection
        if (this.config.autoScroll) {
            this.startAutoScroll();
        }
    }

    handleMouseMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        this.updateDrag(e.clientX, e.clientY);
    }

    handleTouchMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        this.updateDrag(touch.clientX, touch.clientY);
    }

    updateDrag(x, y) {
        if (!this.rafId) {
            this.rafId = requestAnimationFrame(() => {
                this.performDragUpdate(x, y);
                this.rafId = null;
            });
        }
    }

    performDragUpdate(x, y) {
        // Update ghost position
        if (this.ghostElement) {
            let finalX = x - this.dragState.offsetX;
            let finalY = y - this.dragState.offsetY;
            
            // Snap to grid
            if (this.config.snapToGrid) {
                finalX = Math.round(finalX / this.config.gridSize) * this.config.gridSize;
                finalY = Math.round(finalY / this.config.gridSize) * this.config.gridSize;
            }
            
            this.ghostElement.style.left = `${finalX}px`;
            this.ghostElement.style.top = `${finalY}px`;
        }
        
        // Find drop zone under cursor
        const elementBelow = document.elementFromPoint(x, y);
        const dropZone = this.findNearestDropZone(elementBelow);
        
        if (dropZone && this.dragState.validZones.has(dropZone)) {
            this.handleDragOver(dropZone, x, y);
        } else {
            this.clearDropIndicators();
        }
    }

    handleDragOver(dropZone, x, y) {
        const zone = this.dropZones.get(dropZone);
        if (!zone) return;
        
        dropZone.classList.add('drag-over');
        
        // Update placeholder position for sortable zones
        if (zone.config.sortable && this.placeholder) {
            const afterElement = this.getDragAfterElement(dropZone, y);
            if (afterElement == null) {
                dropZone.appendChild(this.placeholder);
            } else {
                dropZone.insertBefore(this.placeholder, afterElement);
            }
        }
        
        // Call custom handler
        if (zone.config.onDragOver) {
            zone.config.onDragOver(this.activeElement, dropZone);
        }
    }

    handleMouseUp(e) {
        if (!this.isDragging) return;
        this.endDrag(e.clientX, e.clientY);
    }

    handleTouchEnd(e) {
        if (!this.isDragging) return;
        const touch = e.changedTouches[0];
        this.endDrag(touch.clientX, touch.clientY);
    }

    endDrag(x, y) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        // Find final drop zone
        const elementBelow = document.elementFromPoint(x, y);
        const dropZone = this.findNearestDropZone(elementBelow);
        
        // Perform drop
        if (dropZone && this.dragState.validZones.has(dropZone)) {
            this.performDrop(dropZone);
        } else {
            this.cancelDrag();
        }
        
        // Cleanup
        this.cleanup();
    }

    performDrop(dropZone) {
        const zone = this.dropZones.get(dropZone);
        if (!zone) return;
        
        // Get drop position
        const afterElement = this.placeholder ? 
            this.placeholder.nextSibling : 
            this.getDragAfterElement(dropZone, this.ghostElement.offsetTop);
        
        // Move elements
        this.selectedItems.forEach(item => {
            if (afterElement) {
                dropZone.insertBefore(item, afterElement);
            } else {
                dropZone.appendChild(item);
            }
            
            // Update zone tracking
            const oldZone = this.findDropZone(item);
            if (oldZone && oldZone !== dropZone) {
                const oldZoneData = this.dropZones.get(oldZone);
                if (oldZoneData) {
                    const index = oldZoneData.items.indexOf(item);
                    if (index > -1) oldZoneData.items.splice(index, 1);
                }
            }
            
            zone.items.push(item);
        });
        
        // Call drop handler
        if (zone.config.onDrop) {
            zone.config.onDrop(Array.from(this.selectedItems), dropZone);
        }
        
        // Animate to final position
        this.animateToFinalPosition();
    }

    cancelDrag() {
        // Return items to original positions
        this.selectedItems.forEach(item => {
            const draggable = this.draggables.get(item);
            if (draggable && draggable.originalParent) {
                const siblings = Array.from(draggable.originalParent.children);
                const nextSibling = siblings[draggable.originalIndex];
                
                if (nextSibling && nextSibling.parentNode === draggable.originalParent) {
                    draggable.originalParent.insertBefore(item, nextSibling);
                } else {
                    draggable.originalParent.appendChild(item);
                }
            }
        });
    }

    cleanup() {
        // Remove ghost
        if (this.ghostElement) {
            this.ghostElement.remove();
            this.ghostElement = null;
        }
        
        // Remove placeholder
        if (this.placeholder) {
            this.placeholder.remove();
            this.placeholder = null;
        }
        
        // Remove classes
        this.selectedItems.forEach(item => {
            item.classList.remove('dragging');
        });
        
        // Clear drop indicators
        this.clearDropIndicators();
        
        // Stop auto-scroll
        if (this.scrollRafId) {
            cancelAnimationFrame(this.scrollRafId);
            this.scrollRafId = null;
        }
        
        // Reset state
        this.activeElement = null;
        this.dragState = {
            startX: 0,
            startY: 0,
            offsetX: 0,
            offsetY: 0,
            currentZone: null,
            validZones: new Set()
        };
    }

    // Helper methods
    createGhost(element) {
        this.ghostElement = element.cloneNode(true);
        this.ghostElement.classList.add('brutal-ghost');
        
        const rect = element.getBoundingClientRect();
        this.ghostElement.style.width = `${rect.width}px`;
        this.ghostElement.style.height = `${rect.height}px`;
        this.ghostElement.style.left = `${rect.left}px`;
        this.ghostElement.style.top = `${rect.top}px`;
        
        document.body.appendChild(this.ghostElement);
    }

    createPlaceholder(element) {
        this.placeholder = document.createElement('div');
        this.placeholder.classList.add('brutal-placeholder');
        
        const rect = element.getBoundingClientRect();
        this.placeholder.style.width = `${rect.width}px`;
        this.placeholder.style.height = `${rect.height}px`;
        
        element.parentNode.insertBefore(this.placeholder, element);
    }

    findDropZone(element) {
        let parent = element.parentElement;
        while (parent) {
            if (this.dropZones.has(parent)) {
                return parent;
            }
            parent = parent.parentElement;
        }
        return null;
    }

    findNearestDropZone(element) {
        if (!element) return null;
        
        // Check if element itself is a drop zone
        if (this.dropZones.has(element)) {
            return element;
        }
        
        // Check parents
        return this.findDropZone(element);
    }

    findValidDropZones(element) {
        const draggable = this.draggables.get(element);
        if (!draggable) return new Set();
        
        const validZones = new Set();
        const group = draggable.config.group;
        
        this.dropZones.forEach((zone, zoneElement) => {
            if (zone.config.accepts.includes(group) || zone.config.accepts.includes('*')) {
                validZones.add(zoneElement);
            }
        });
        
        return validZones;
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.brutal-draggable:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    clearDropIndicators() {
        document.querySelectorAll('.brutal-dropzone').forEach(zone => {
            zone.classList.remove('drag-over');
        });
        
        document.querySelectorAll('.brutal-drop-indicator').forEach(indicator => {
            indicator.remove();
        });
    }

    animateToFinalPosition() {
        this.selectedItems.forEach(item => {
            item.style.transition = 'none';
            item.offsetHeight; // Force reflow
            item.style.transition = '';
        });
    }

    // Auto-scroll functionality
    startAutoScroll() {
        const scrollZones = {
            top: { y: 50, speed: -5 },
            bottom: { y: window.innerHeight - 50, speed: 5 }
        };
        
        const checkScroll = () => {
            if (!this.isDragging) return;
            
            const mouseY = this.ghostElement ? 
                parseInt(this.ghostElement.style.top) + this.dragState.offsetY : 0;
            
            let scrollSpeed = 0;
            
            if (mouseY < scrollZones.top.y) {
                scrollSpeed = scrollZones.top.speed;
            } else if (mouseY > scrollZones.bottom.y) {
                scrollSpeed = scrollZones.bottom.speed;
            }
            
            if (scrollSpeed !== 0) {
                window.scrollBy(0, scrollSpeed);
            }
            
            this.scrollRafId = requestAnimationFrame(checkScroll);
        };
        
        checkScroll();
    }

    // Keyboard support
    handleKeyDown(e) {
        this.isMultiSelectKey = e.ctrlKey || e.metaKey;
        
        if (e.key === 'Escape' && this.isDragging) {
            this.cancelDrag();
            this.cleanup();
        }
    }

    // Public API
    disable(element) {
        const draggable = this.draggables.get(element);
        if (draggable) {
            draggable.config.disabled = true;
            element.classList.add('disabled');
        }
    }

    enable(element) {
        const draggable = this.draggables.get(element);
        if (draggable) {
            draggable.config.disabled = false;
            element.classList.remove('disabled');
        }
    }

    destroy() {
        // Remove all event listeners
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchend', this.handleTouchEnd);
        
        // Clear all data
        this.draggables.clear();
        this.dropZones.clear();
        this.selectedItems.clear();
        
        // Remove styles
        const styles = document.getElementById('brutal-dragdrop-styles');
        if (styles) styles.remove();
    }
}

// Export singleton instance
export const dragDropSystem = new DragDropSystem();