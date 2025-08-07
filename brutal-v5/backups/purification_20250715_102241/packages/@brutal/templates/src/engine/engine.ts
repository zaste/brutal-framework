/**
 * Template engine implementation
 */

import type { TemplateOptions, CompiledTemplate, TemplateContext } from '../types.js';
import { compile as compileTemplate } from '../compiler/compiler.js';

/**
 * Compile a template string into a compiled template
 */
export function compile(template: string, options?: TemplateOptions): CompiledTemplate {
  return compileTemplate(template, options);
}

/**
 * Render a template string with data
 */
export function render(template: string, data: TemplateContext = {}, options?: TemplateOptions): string {
  const compiled = compile(template, options);
  return compiled.render(data);
}