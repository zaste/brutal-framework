# 🎯 BRUTAL Test System

> Detects ALL failures with zero mercy

## Overview

The BRUTAL Test System is a comprehensive testing framework designed specifically for the BRUTAL Framework V3. It captures every possible error, analyzes performance, performs visual regression testing, and provides actionable insights.

## Features

- **Complete Error Detection**: Captures runtime, console, network, promise, and security errors
- **Performance Analysis**: FCP, TBT, CLS, FPS, memory leak detection
- **Visual Regression**: Screenshot comparison with baseline management
- **State Tracking**: Monitor application state changes in real-time
- **Multi-Browser Support**: Chrome, Firefox, Safari via Puppeteer/Playwright
- **Root Cause Analysis**: Intelligent error pattern recognition
- **Auto-Fix Suggestions**: Automated fixes for common issues
- **Live Dashboard**: Real-time test monitoring

## Installation

```bash
cd brutal-test
npm install
```

## Usage

### Command Line

```bash
# Run complete test suite
npm test

# Quick smoke tests
npm run test:quick

# Visual regression tests
npm run test:visual

# Interactive mode with UI
npm run test:interactive

# Continuous monitoring
npm run test:continuous
```

### CLI Options

```bash
brutal-test --help

Options:
  -m, --mode <mode>        Test mode (quick|visual|complete|interactive|continuous)
  -b, --browsers <list>    Browsers to test (comma-separated)
  -p, --path <path>       Path to test
  --headless              Run in headless mode
  --no-headless           Run with browser UI
  -d, --dashboard         Enable live dashboard
  --auto-fix              Automatically apply fixes
  -o, --output <dir>      Output directory
  -v, --viewport <size>   Viewport size (WIDTHxHEIGHT)
  --record                Record video of test session
```

## Architecture

```
brutal-test/
├── core/               # Core engine components
│   ├── TestEngine.js   # Test discovery and execution
│   ├── BrowserController.js  # Multi-browser automation
│   └── EmbeddedServer.js    # Server with correct headers
├── capture/            # Data capture layer
│   ├── ErrorCapture.js      # Comprehensive error capture
│   ├── PerformanceCapture.js # Performance metrics
│   ├── VisualCapture.js     # Screenshots and visual testing
│   └── StateCapture.js      # Application state tracking
├── analysis/           # Analysis engines
│   ├── ErrorAnalyzer.js     # Error classification
│   ├── PerformanceAnalyzer.js # Performance analysis
│   └── RootCauseEngine.js   # Root cause detection
├── report/             # Reporting system
│   ├── ReportGenerator.js   # Multi-format reports
│   └── DashboardServer.js   # Live dashboard
└── fix/                # Fix suggestion engine
    ├── AutoFixer.js         # Automated fixes
    └── FixSuggestionEngine.js # Fix recommendations
```

## Test Modes

### Quick Mode
- Runs only critical tests
- Fast smoke testing
- ~30 seconds execution time

### Visual Mode
- Screenshot capture and comparison
- Visual regression detection
- Component rendering validation

### Complete Mode
- All test types
- Full coverage analysis
- Performance profiling
- Accessibility checks

### Interactive Mode
- Browser UI for test selection
- Real-time results
- Debug capabilities

### Continuous Mode
- Runs tests at intervals
- Monitors for regressions
- Alerts on failures

## Configuration

Create `brutal-test.config.js` in your project root:

```javascript
export default {
    testPath: './framework-v3',
    outputDir: './brutal-test-results',
    
    server: {
        port: 3333,
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp'
        }
    },
    
    browsers: ['chrome', 'firefox'],
    
    performance: {
        firstContentfulPaint: 1800,
        totalBlockingTime: 300,
        cumulativeLayoutShift: 0.1
    }
};
```

## Output

Test results are saved to `brutal-test-results/`:

```
brutal-test-results/
├── report.html         # Interactive dashboard
├── errors.json         # All captured errors
├── performance.json    # Performance metrics
├── coverage.json       # Code coverage data
├── screenshots/        # Visual captures
├── videos/            # Session recordings
└── suggestions.json    # Fix recommendations
```

## Integration with BRUTAL Framework

The test system is specifically designed for BRUTAL Framework V3:

1. **SharedArrayBuffer Testing**: Validates cross-origin isolation
2. **Worker Pool Testing**: Ensures parallel processing works
3. **GPU Acceleration Testing**: Validates WebGPU/WebGL cascade
4. **Component Testing**: All 40+ BRUTAL components
5. **Performance Validation**: 15x React benchmark

## Common Issues

### SharedArrayBuffer Not Available
```bash
# Solution: Ensure server has correct headers
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

### Puppeteer Installation
```bash
# If Puppeteer fails to download Chrome
PUPPETEER_SKIP_DOWNLOAD=true npm install
# Then manually set executable path in config
```

## Development

### Adding New Test Types

1. Create capture module in `capture/`
2. Create analyzer in `analysis/`
3. Register in `TestEngine.js`
4. Add to test modes

### Custom Assertions

```javascript
// In your test files
window.__BRUTAL_ASSERT__ = (condition, message) => {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
};
```

## License

MIT