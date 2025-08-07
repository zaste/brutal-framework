#!/usr/bin/env node

/**
 * BRUTAL V5 - Learning Capture System
 * Automatically captures decisions, patterns, and learnings
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEARNINGS_DIR = path.join(__dirname, '../foundation/learnings');
const PATTERNS_DIR = path.join(__dirname, '../foundation/patterns');

class LearningCapture {
  constructor() {
    this.ensureDirectories();
  }

  ensureDirectories() {
    [LEARNINGS_DIR, PATTERNS_DIR].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  captureDecision(decision) {
    const timestamp = new Date().toISOString();
    const filename = `decision-${timestamp.split('T')[0]}-${Date.now()}.md`;
    
    const content = `# Decision: ${decision.title}

**Date**: ${timestamp}
**Context**: ${decision.context}
**Status**: ${decision.status || 'active'}

## Problem
${decision.problem}

## Decision
${decision.decision}

## Consequences
${decision.consequences}

## Alternatives Considered
${decision.alternatives || 'None documented'}

## References
${decision.references?.map(ref => `- ${ref}`).join('\n') || 'None'}
`;

    fs.writeFileSync(path.join(LEARNINGS_DIR, filename), content);
    console.log(`✅ Decision captured: ${filename}`);
  }

  evolvePa`ntern(patternName, evolution) {
    const patternFile = path.join(PATTERNS_DIR, `${patternName}.md`);
    
    if (!fs.existsSync(patternFile)) {
      console.error(`❌ Pattern not found: ${patternName}`);
      return;
    }

    const content = fs.readFileSync(patternFile, 'utf-8');
    const timestamp = new Date().toISOString();
    
    const evolutionSection = `

## Evolution: ${timestamp}

### What Changed
${evolution.change}

### Why
${evolution.why}

### Impact
${evolution.impact}

---
`;

    const updatedContent = content.replace(
      /## Pattern Evolution/,
      `## Pattern Evolution\n${evolutionSection}`
    );

    fs.writeFileSync(patternFile, updatedContent);
    console.log(`✅ Pattern evolved: ${patternName}`);
  }

  analyzeCodeChanges() {
    // TODO: Integrate with git to detect pattern violations
    console.log('🔍 Analyzing code changes for pattern compliance...');
  }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

const capture = new LearningCapture();

switch (command) {
  case 'decision':
    // Usage: node capture-learning.js decision "title" "problem" "decision" "consequences"
    capture.captureDecision({
      title: args[1],
      context: args[2],
      problem: args[3],
      decision: args[4],
      consequences: args[5]
    });
    break;
    
  case 'evolve':
    // Usage: node capture-learning.js evolve "pattern-name" "change" "why" "impact"
    capture.evolvePattern(args[1], {
      change: args[2],
      why: args[3],
      impact: args[4]
    });
    break;
    
  case 'analyze':
    capture.analyzeCodeChanges();
    break;
    
  default:
    console.log(`
BRUTAL V5 - Learning Capture System

Commands:
  decision <title> <context> <problem> <decision> <consequences>
    Capture a new architectural decision
    
  evolve <pattern-name> <change> <why> <impact>
    Document pattern evolution
    
  analyze
    Analyze code changes for pattern compliance
`);
}