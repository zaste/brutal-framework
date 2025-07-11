/**
 * BRUTAL V3 - Components Module
 * High-performance components with GPU acceleration
 */

// Base component class
export { BrutalComponent } from './base/BrutalComponent.js';

// Core components
export { HeroSection } from './core/HeroSection.js';
export { NavigationBar } from './navigation/NavigationBar.js';
export { Modal } from './ui/Modal.js';
// export { Notifications } from './core/Notifications.js';

// Data components
export { DataGrid } from './data/DataGrid.js';
export { FormBuilder } from './forms/FormBuilder.js';
// export { SearchBox } from './data/SearchBox.js';
// export { Charts } from './data/Charts.js';

// Media components
// export { Carousel } from './media/Carousel.js';
// export { ImageGallery } from './media/ImageGallery.js';
// export { VideoPlayer } from './media/VideoPlayer.js';
// export { Timeline } from './media/Timeline.js';

// UI components
// export { TabPanel } from './ui/TabPanel.js';
// export { Accordion } from './ui/Accordion.js';
// export { Tooltip } from './ui/Tooltip.js';
// export { ProgressBar } from './ui/ProgressBar.js';
// export { LoadingSpinner } from './ui/LoadingSpinner.js';

// Advanced components
// export { CodeEditor } from './advanced/CodeEditor.js';
// export { DragDropZone } from './advanced/DragDropZone.js';

// Showcase
// export { ShowcaseDemo } from './showcase/ShowcaseDemo.js';

/**
 * Register all components
 */
export function registerAllComponents() {
    // Components auto-register when imported
    }

/**
 * Component utilities
 */
export const componentUtils = {
    /**
     * Create component programmatically
     */
    create(tagName, props = {}) {
        const element = document.createElement(tagName);
        
        // Set properties
        for (const [key, value] of Object.entries(props)) {
            if (key === 'children') {
                element.innerHTML = value;
            } else if (key === 'style') {
                Object.assign(element.style, value);
            } else if (key.startsWith('on')) {
                const event = key.slice(2).toLowerCase();
                element.addEventListener(event, value);
            } else {
                element[key] = value;
            }
        }
        
        return element;
    },
    
    /**
     * Mount component to DOM
     */
    mount(component, container) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        if (container) {
            container.appendChild(component);
        }
        
        return component;
    },
    
    /**
     * Batch create and mount components
     */
    batchMount(components, container) {
        const fragment = document.createDocumentFragment();
        
        components.forEach(comp => {
            fragment.appendChild(comp);
        });
        
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        if (container) {
            container.appendChild(fragment);
        }
    }
};