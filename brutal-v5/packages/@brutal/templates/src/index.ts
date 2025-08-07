/**
 * @brutal/templates - Template engine for BRUTAL V5
 * 
 * Lightweight, fast template engine with control flow and expressions
 * 
 * @packageDocumentation
 */

// Core template engine - use ultra-minimal version for best size
export { compile, TemplateError } from './ultra-minimal.js';



// Render helper
export { render } from './ultra-minimal.js';

// Types
export type {
  TemplateFunction,
  TemplateContext,
  TemplateOptions,
  CompiledTemplate,
  FilterFunction,
  Directive,
  ExpressionNode
} from './types.js';

// Constants
export { VERSION, DEFAULT_CONFIG } from './constants.js';

// Package metadata
export const PACKAGE_NAME = '@brutal/templates';