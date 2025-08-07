#!/usr/bin/env node

/**
 * BRUTAL Test System CLI
 */

import { program } from 'commander';
import chalk from 'chalk';
import { BrutalTestSystem } from './index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ASCII Art Banner
const banner = `
${chalk.green('██████╗ ██████╗ ██╗   ██╗████████╗ █████╗ ██╗     ')}
${chalk.green('██╔══██╗██╔══██╗██║   ██║╚══██╔══╝██╔══██╗██║     ')}
${chalk.green('██████╔╝██████╔╝██║   ██║   ██║   ███████║██║     ')}
${chalk.green('██╔══██╗██╔══██╗██║   ██║   ██║   ██╔══██║██║     ')}
${chalk.green('██████╔╝██║  ██║╚██████╔╝   ██║   ██║  ██║███████╗')}
${chalk.green('╚═════╝ ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝╚══════╝')}
${chalk.cyan('           TEST SYSTEM - Zero Mercy Edition         ')}
`;

console.log(banner);

// CLI Configuration
program
  .name('brutal-test')
  .description('BRUTAL Test System - Detects ALL failures')
  .version('1.0.0');

program
  .option('-m, --mode <mode>', 'Test mode: quick, visual, complete, interactive, continuous', 'complete')
  .option('-b, --browsers <browsers>', 'Browsers to test (comma-separated)', 'chrome')
  .option('-p, --path <path>', 'Path to test', path.resolve(__dirname, '../framework-v3'))
  .option('--headless', 'Run in headless mode', true)
  .option('--no-headless', 'Run with browser UI')
  .option('-d, --dashboard', 'Enable live dashboard')
  .option('--auto-fix', 'Automatically apply fixes')
  .option('-o, --output <dir>', 'Output directory', path.resolve(__dirname, 'results'))
  .option('-v, --viewport <size>', 'Viewport size (WIDTHxHEIGHT)', '1920x1080')
  .option('--record', 'Record video of test session')
  .action(async (options) => {
    try {
      // Parse viewport
      const [width, height] = options.viewport.split('x').map(Number);
      
      // Parse browsers
      const browsers = options.browsers.split(',').map(b => b.trim());
      
      // Create test system
      const testSystem = new BrutalTestSystem({
        mode: options.mode,
        browsers: browsers,
        headless: options.headless,
        dashboard: options.dashboard,
        autoFix: options.autoFix,
        outputDir: options.output,
        viewport: { width, height },
        recordVideo: options.record
      });
      
      console.log(chalk.cyan('\n🚀 Initializing BRUTAL Test System...'));
      console.log(chalk.gray(`Mode: ${options.mode}`));
      console.log(chalk.gray(`Path: ${options.path}`));
      console.log(chalk.gray(`Browsers: ${browsers.join(', ')}`));
      console.log(chalk.gray(`Headless: ${options.headless}`));
      
      // Initialize
      await testSystem.initialize();
      
      // Run tests
      const results = await testSystem.run(options.path);
      
      // Display results
      displayResults(results);
      
      // Exit code based on results
      const hasErrors = results.errors && results.errors.length > 0;
      process.exit(hasErrors ? 1 : 0);
      
    } catch (error) {
      console.error(chalk.red('\n❌ Fatal error:'), error.message);
      console.error(chalk.gray(error.stack));
      process.exit(1);
    }
  });

// Add specific mode commands
program
  .command('quick')
  .description('Run quick smoke tests')
  .action(() => runMode('quick'));

program
  .command('visual')
  .description('Run visual regression tests')
  .action(() => runMode('visual'));

program
  .command('complete')
  .description('Run complete test suite')
  .action(() => runMode('complete'));

program
  .command('interactive')
  .description('Run tests with interactive UI')
  .action(() => runMode('interactive'));

program
  .command('continuous')
  .description('Run continuous monitoring')
  .option('-i, --interval <ms>', 'Test interval in milliseconds', '300000')
  .action((options) => runMode('continuous', options));

// Helper function to run specific mode
async function runMode(mode, modeOptions = {}) {
  const options = {
    ...program.opts(),
    mode,
    ...modeOptions
  };
  
  await program._actionHandler(options);
}

// Results display
function displayResults(results) {
  console.log(chalk.cyan('\n📊 Test Results:'));
  console.log(chalk.gray('─'.repeat(60)));
  
  // Summary
  if (results.summary) {
    console.log(chalk.white('\nSummary:'));
    Object.entries(results.summary).forEach(([key, value]) => {
      console.log(chalk.gray(`  ${key}:`), chalk.white(value));
    });
  }
  
  // Errors
  if (results.errors && results.errors.length > 0) {
    console.log(chalk.red(`\n❌ Errors Found: ${results.errors.length}`));
    results.errors.slice(0, 5).forEach((error, i) => {
      console.log(chalk.red(`\n${i + 1}. ${error.type || 'ERROR'}`));
      console.log(chalk.gray(`   ${error.message}`));
      if (error.source) {
        console.log(chalk.gray(`   Source: ${error.source}`));
      }
    });
    
    if (results.errors.length > 5) {
      console.log(chalk.gray(`\n... and ${results.errors.length - 5} more errors`));
    }
  } else {
    console.log(chalk.green('\n✅ No errors detected!'));
  }
  
  // Performance
  if (results.analysis?.performance) {
    console.log(chalk.yellow('\n⚡ Performance:'));
    const perf = results.analysis.performance;
    console.log(chalk.gray(`  Score: ${perf.performanceScore}/100`));
    console.log(chalk.gray(`  FCP: ${perf.firstContentfulPaint}ms`));
    console.log(chalk.gray(`  TBT: ${perf.totalBlockingTime}ms`));
    console.log(chalk.gray(`  CLS: ${perf.cumulativeLayoutShift}`));
  }
  
  // Suggestions
  if (results.suggestions && results.suggestions.length > 0) {
    console.log(chalk.blue(`\n💡 Suggestions: ${results.suggestions.length}`));
    results.suggestions.slice(0, 3).forEach((suggestion, i) => {
      console.log(chalk.blue(`\n${i + 1}. ${suggestion.title}`));
      console.log(chalk.gray(`   ${suggestion.description}`));
    });
  }
  
  // Output location
  console.log(chalk.gray(`\n📁 Full report saved to: ${results.outputDir || './brutal-test-results'}`));
  console.log(chalk.gray('─'.repeat(60)));
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise);
  console.error(chalk.red('Reason:'), reason);
  process.exit(1);
});

// Parse arguments
program.parse();