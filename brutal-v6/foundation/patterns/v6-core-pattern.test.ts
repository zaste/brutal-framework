/**
 * V6 Core Pattern Test
 * 
 * This test captures the ESSENTIAL lesson from V3-V5:
 * Constraints must be code, not intentions.
 * 
 * If this test fails, V6 is becoming V7.
 */

import { test, expect } from '@brutal/testing';
import * as fs from 'fs/promises';
import * as path from 'path';

test('V6 maintains its core discipline', async () => {
  // 1. Foundation must remain small
  const foundationSize = await getDirectorySize('./foundation');
  expect(foundationSize).toBeLessThan(50_000); // 50KB max
  
  // 2. Principles must be functions, not documentation
  const { PRINCIPLES } = await import('../principles');
  for (const [name, principle] of Object.entries(PRINCIPLES)) {
    expect(typeof principle).toBe('function');
    expect(principle.length).toBeGreaterThan(0); // Has parameters
  }
  
  // 3. No "flexible" or "living" patterns
  const foundationFiles = await getAllFiles('./foundation');
  for (const file of foundationFiles) {
    const content = await fs.readFile(file, 'utf-8');
    expect(content).not.toMatch(/living foundation/i);
    expect(content).not.toMatch(/flexible architecture/i);
    expect(content).not.toMatch(/evolving design/i);
  }
  
  // 4. Package count must stay under control
  const packages = await fs.readdir('./packages/@brutal');
  expect(packages.length).toBeLessThanOrEqual(7); // The 7 decided packages
  
  // 5. No escape hatches in enforcement
  const enforceFiles = await getAllFiles('./foundation/enforce');
  for (const file of enforceFiles) {
    const content = await fs.readFile(file, 'utf-8');
    expect(content).not.toMatch(/SKIP_VALIDATION/);
    expect(content).not.toMatch(/FORCE_PASS/);
    expect(content).not.toMatch(/--no-verify/);
  }
});

test('V6 enforces the single-implementation principle', async () => {
  // Look for multiple implementations of the same concept
  const patterns = new Map<string, string[]>();
  
  // Check for multiple template engines
  const templateFiles = await findFiles('./packages', /template|render/i);
  expect(templateFiles.length).toBeLessThanOrEqual(1);
  
  // Check for multiple state managers
  const stateFiles = await findFiles('./packages', /state|store/i);
  expect(stateFiles.length).toBeLessThanOrEqual(1);
  
  // Check for multiple routers
  const routerFiles = await findFiles('./packages', /rout(er|ing)/i);
  expect(routerFiles.length).toBeLessThanOrEqual(1);
});

test('V6 rejects feature requests without user demand', async () => {
  // This is more philosophical but we can check for TODOs that indicate imagined features
  const allFiles = await getAllFiles('./packages');
  
  for (const file of allFiles) {
    const content = await fs.readFile(file, 'utf-8');
    const todos = content.match(/TODO:.*$/gm) || [];
    
    for (const todo of todos) {
      // TODOs should reference issues or user requests
      expect(todo).toMatch(/#\d+|user request|requested by/i);
    }
  }
});

// Helper functions
async function getDirectorySize(dir: string): Promise<number> {
  let size = 0;
  const files = await getAllFiles(dir);
  for (const file of files) {
    const stats = await fs.stat(file);
    size += stats.size;
  }
  return size;
}

async function getAllFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      files.push(...await getAllFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  
  return files;
}

async function findFiles(dir: string, pattern: RegExp): Promise<string[]> {
  const allFiles = await getAllFiles(dir);
  return allFiles.filter(file => pattern.test(file));
}