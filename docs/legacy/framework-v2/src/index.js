/**
 * Native Web Components Framework v2
 * Clean architecture, no dependencies, maximum performance
 * Now with full integration: Components + State + Router
 */

// Core exports
export { Component } from './core/component.js';
export { EnhancedComponent, createEnhancedComponent } from './core/enhanced-component-integrated.js';
export { ComponentRegistry, registry, registerComponent, loadComponent, createComponent } from './core/component-registry.js';

// State Management
export { StateStore, createStore, getStore } from './core/state.js';

// Router
export { Router, createRouter, getRouter } from './core/router.js';

// Utilities
export { html, css } from './utils/template.js';
export { createApp } from './app.js';

// Components
export { HeroSection } from './components/sections/hero-section.js';

// Version
export const VERSION = '2.0.0';

// Performance metrics
export const metrics = {
  componentsCreated: 0,
  renderTime: 0,
  lastUpdate: Date.now()
};

// Feature flags
export const FEATURES = {
  components: true,
  enhancedComponents: true,
  stateManagement: true,
  routing: true,
  virtualDom: false, // Coming soon
  responsive: true,
  a11y: true,
  themes: true,
  variants: true,
  zeroConfig: true,
  zeroDependencies: true
};

// Quick start helper
export function initFramework(config = {}) {
  const framework = {
    router: config.routing !== false ? createRouter(config.router) : null,
    stores: new Map(),
    registry: registry,
    metrics: metrics
  };
  
  // Create default stores if specified
  if (config.stores) {
    Object.entries(config.stores).forEach(([name, initialState]) => {
      framework.stores.set(name, createStore(name, initialState));
    });
  }
  
  // Auto-register components if specified
  if (config.components) {
    Object.entries(config.components).forEach(([name, component]) => {
      registerComponent(name, component);
    });
  }
  
  // Setup routes if specified
  if (config.routes && framework.router) {
    Object.entries(config.routes).forEach(([path, handler]) => {
      framework.router.route(path, handler);
    });
  }
  
  // Global access if requested
  if (config.global) {
    window.FrameworkV2 = framework;
  }
  
  console.log(`🚀 Native Framework v${VERSION} initialized`);
  console.log(`📦 Features enabled:`, Object.entries(FEATURES).filter(([_, v]) => v).map(([k]) => k).join(', '));
  
  return framework;
}

// Default export for convenience
export default {
  Component,
  EnhancedComponent,
  createEnhancedComponent,
  ComponentRegistry,
  StateStore,
  Router,
  createStore,
  createRouter,
  initFramework,
  VERSION,
  FEATURES,
  metrics
};