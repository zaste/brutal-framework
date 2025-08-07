/**
 * Report Generator - Multi-format report generation
 */

import { promises as fs } from 'fs';
import path from 'path';

export class ReportGenerator {
    constructor(config) {
        this.config = config;
        this.outputDir = config.outputDir || './brutal-test-results';
    }

    async generate(results) {
        // Ensure output directory exists
        await fs.mkdir(this.outputDir, { recursive: true });
        
        // Generate all report formats
        const reports = await Promise.all([
            this.generateHTMLReport(results),
            this.generateJSONReport(results),
            this.generateMarkdownReport(results)
        ]);
        
        // Create index file
        await this.createIndexFile(reports);
        
        return {
            outputDir: this.outputDir,
            files: reports
        };
    }

    async generateHTMLReport(results) {
        const htmlContent = this.createHTMLReport(results);
        const filePath = path.join(this.outputDir, 'report.html');
        
        await fs.writeFile(filePath, htmlContent);
        
        return {
            type: 'html',
            path: filePath,
            size: Buffer.byteLength(htmlContent)
        };
    }

    createHTMLReport(results) {
        const timestamp = new Date(results.timestamp).toLocaleString();
        const errorCount = results.errors?.length || 0;
        const testCount = results.tests?.length || 0;
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BRUTAL Test Report - ${timestamp}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #e0e0e0;
            line-height: 1.6;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        header {
            text-align: center;
            padding: 40px 0;
            border-bottom: 2px solid #333;
            margin-bottom: 40px;
        }
        h1 {
            font-size: 48px;
            background: linear-gradient(45deg, #00ff00, #00ffff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: #1a1a1a;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            border: 1px solid #333;
            transition: all 0.3s ease;
        }
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 255, 0, 0.2);
        }
        .stat-value {
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .stat-label {
            font-size: 16px;
            color: #888;
        }
        .good { color: #00ff00; }
        .warning { color: #ffff00; }
        .bad { color: #ff0000; }
        .section {
            background: #1a1a1a;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            border: 1px solid #333;
        }
        h2 {
            font-size: 28px;
            margin-bottom: 20px;
            color: #00ffff;
        }
        .error-item, .test-item {
            background: #222;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 8px;
            border-left: 4px solid #ff0000;
        }
        .test-item.passed {
            border-left-color: #00ff00;
        }
        .error-type {
            font-weight: bold;
            color: #ff6666;
            margin-bottom: 5px;
        }
        .error-message {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #ccc;
            white-space: pre-wrap;
            word-break: break-all;
        }
        .performance-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .metric {
            background: #222;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .metric-value {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .metric-label {
            font-size: 14px;
            color: #888;
        }
        .timeline {
            position: relative;
            padding-left: 30px;
        }
        .timeline-item {
            position: relative;
            padding: 10px 0;
            border-left: 2px solid #333;
            padding-left: 20px;
            margin-left: 10px;
        }
        .timeline-item::before {
            content: '';
            position: absolute;
            left: -7px;
            top: 15px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #00ff00;
            border: 2px solid #0a0a0a;
        }
        .timeline-item.error::before {
            background: #ff0000;
        }
        .recommendations {
            background: #1a2a1a;
            border: 1px solid #00ff00;
        }
        .recommendation-item {
            padding: 15px;
            margin-bottom: 10px;
            background: #0f1f0f;
            border-radius: 5px;
        }
        .recommendation-title {
            font-weight: bold;
            color: #00ff00;
            margin-bottom: 5px;
        }
        pre {
            background: #000;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            font-size: 12px;
        }
        .footer {
            text-align: center;
            padding: 40px 0;
            border-top: 1px solid #333;
            margin-top: 60px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>BRUTAL TEST REPORT</h1>
            <p>Generated: ${timestamp}</p>
            <p>Mode: ${results.config?.mode || 'complete'}</p>
        </header>
        
        <div class="summary">
            <div class="stat-card">
                <div class="stat-value ${errorCount === 0 ? 'good' : 'bad'}">${errorCount}</div>
                <div class="stat-label">Total Errors</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${testCount}</div>
                <div class="stat-label">Tests Run</div>
            </div>
            <div class="stat-card">
                <div class="stat-value ${this.getPerformanceClass(results)}">${this.getPerformanceScore(results)}%</div>
                <div class="stat-label">Performance Score</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${this.getDuration(results)}s</div>
                <div class="stat-label">Duration</div>
            </div>
        </div>
        
        ${this.renderErrors(results)}
        ${this.renderPerformance(results)}
        ${this.renderRootCauses(results)}
        ${this.renderRecommendations(results)}
        ${this.renderTests(results)}
        ${this.renderTimeline(results)}
        
        <footer class="footer">
            <p>BRUTAL Test System v1.0.0 - Zero Mercy Edition</p>
            <p>Report generated in ${this.outputDir}</p>
        </footer>
    </div>
</body>
</html>`;
    }

    renderErrors(results) {
        if (!results.errors || results.errors.length === 0) {
            return `
            <section class="section">
                <h2>✅ Errors</h2>
                <p style="color: #00ff00;">No errors detected!</p>
            </section>`;
        }
        
        const errorsByType = {};
        results.errors.forEach(error => {
            const type = error.type || error.source || 'unknown';
            if (!errorsByType[type]) errorsByType[type] = [];
            errorsByType[type].push(error);
        });
        
        return `
        <section class="section">
            <h2>❌ Errors (${results.errors.length})</h2>
            ${Object.entries(errorsByType).map(([type, errors]) => `
                <h3 style="margin: 20px 0 10px; color: #ff6666;">${type} (${errors.length})</h3>
                ${errors.slice(0, 5).map(error => `
                    <div class="error-item">
                        <div class="error-type">${error.type || 'ERROR'}</div>
                        <div class="error-message">${this.escapeHtml(error.message || error.text || JSON.stringify(error))}</div>
                        ${error.stack ? `<pre>${this.escapeHtml(error.stack)}</pre>` : ''}
                    </div>
                `).join('')}
                ${errors.length > 5 ? `<p style="color: #666;">... and ${errors.length - 5} more</p>` : ''}
            `).join('')}
        </section>`;
    }

    renderPerformance(results) {
        const perf = results.analysis?.performance;
        if (!perf) return '';
        
        return `
        <section class="section">
            <h2>⚡ Performance Analysis</h2>
            <div class="performance-grid">
                ${this.renderMetric('FCP', perf.firstContentfulPaint, 'ms', 1800)}
                ${this.renderMetric('TBT', perf.totalBlockingTime, 'ms', 300)}
                ${this.renderMetric('CLS', perf.cumulativeLayoutShift, '', 0.1)}
                ${this.renderMetric('FPS', perf.averageFPS, '', 30, true)}
                ${this.renderMetric('Score', perf.performanceScore, '%', 70, true)}
                ${this.renderMetric('Grade', perf.grade || 'N/A', '', null)}
            </div>
            ${perf.issues?.length > 0 ? `
                <h3 style="margin: 20px 0 10px;">Performance Issues</h3>
                ${perf.issues.map(issue => `
                    <div class="error-item">
                        <div class="error-type">${issue.metric} - ${issue.severity}</div>
                        <div class="error-message">${issue.impact}</div>
                    </div>
                `).join('')}
            ` : ''}
        </section>`;
    }

    renderMetric(label, value, unit = '', threshold = null, higherBetter = false) {
        const numValue = parseFloat(value) || 0;
        let colorClass = '';
        
        if (threshold !== null && !isNaN(numValue)) {
            if (higherBetter) {
                colorClass = numValue >= threshold ? 'good' : 'bad';
            } else {
                colorClass = numValue <= threshold ? 'good' : 'bad';
            }
        }
        
        return `
        <div class="metric">
            <div class="metric-value ${colorClass}">${value}${unit}</div>
            <div class="metric-label">${label}</div>
        </div>`;
    }

    renderRootCauses(results) {
        const rootCauses = results.analysis?.rootCauses;
        if (!rootCauses || rootCauses.rootCauses?.length === 0) return '';
        
        return `
        <section class="section">
            <h2>🔍 Root Cause Analysis</h2>
            ${rootCauses.primaryCause ? `
                <div style="background: #2a1a1a; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #ff6666;">
                    <h3 style="color: #ff6666; margin-bottom: 10px;">Primary Root Cause</h3>
                    <p style="font-size: 18px; margin-bottom: 10px;">${rootCauses.primaryCause.rootCause}</p>
                    <p style="color: #888;">Pattern: ${rootCauses.primaryCause.pattern}</p>
                    <p style="color: #888;">Confidence: ${Math.round(rootCauses.primaryCause.confidence * 100)}%</p>
                </div>
            ` : ''}
            
            ${rootCauses.fixPlan?.length > 0 ? `
                <h3 style="margin: 20px 0 10px;">Fix Plan</h3>
                <ol style="padding-left: 20px;">
                    ${rootCauses.fixPlan.map(step => `
                        <li style="margin-bottom: 10px;">
                            <strong>${step.action}</strong>
                            <br><span style="color: #888;">${step.reason}</span>
                        </li>
                    `).join('')}
                </ol>
            ` : ''}
        </section>`;
    }

    renderRecommendations(results) {
        const recommendations = results.suggestions || results.analysis?.performance?.recommendations;
        if (!recommendations || recommendations.length === 0) return '';
        
        return `
        <section class="section recommendations">
            <h2>💡 Recommendations</h2>
            ${recommendations.map(rec => `
                <div class="recommendation-item">
                    <div class="recommendation-title">${rec.title}</div>
                    <p>${rec.description || ''}</p>
                    ${rec.suggestions ? `
                        <ul style="margin-top: 10px; padding-left: 20px;">
                            ${rec.suggestions.map(s => `<li>${s}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            `).join('')}
        </section>`;
    }

    renderTests(results) {
        if (!results.tests || results.tests.length === 0) return '';
        
        const passed = results.tests.filter(t => t.result?.status === 'passed').length;
        const failed = results.tests.length - passed;
        
        return `
        <section class="section">
            <h2>📋 Test Results (${passed}/${results.tests.length} passed)</h2>
            ${results.tests.slice(0, 20).map(test => `
                <div class="test-item ${test.result?.status === 'passed' ? 'passed' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong>${test.name}</strong>
                        <span class="${test.result?.status === 'passed' ? 'good' : 'bad'}">${test.result?.status || 'unknown'}</span>
                    </div>
                    ${test.result?.errors?.length > 0 ? `
                        <div class="error-message" style="margin-top: 10px;">
                            ${test.result.errors[0].message}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
            ${results.tests.length > 20 ? `<p style="color: #666;">... and ${results.tests.length - 20} more tests</p>` : ''}
        </section>`;
    }

    renderTimeline(results) {
        // Create timeline from various sources
        const events = [];
        
        if (results.errors) {
            results.errors.forEach(error => {
                if (error.timestamp) {
                    events.push({
                        time: error.timestamp,
                        type: 'error',
                        message: error.message || error.type || 'Error'
                    });
                }
            });
        }
        
        if (events.length === 0) return '';
        
        events.sort((a, b) => a.time - b.time);
        const startTime = events[0].time;
        
        return `
        <section class="section">
            <h2>📅 Event Timeline</h2>
            <div class="timeline">
                ${events.slice(0, 20).map(event => `
                    <div class="timeline-item ${event.type}">
                        <strong>${((event.time - startTime) / 1000).toFixed(2)}s</strong>
                        <span style="margin-left: 10px; color: #888;">${event.type}</span>
                        <div style="color: #ccc; font-size: 14px;">${this.escapeHtml(event.message)}</div>
                    </div>
                `).join('')}
            </div>
        </section>`;
    }

    async generateJSONReport(results) {
        const jsonContent = JSON.stringify(results, null, 2);
        const filePath = path.join(this.outputDir, 'report.json');
        
        await fs.writeFile(filePath, jsonContent);
        
        return {
            type: 'json',
            path: filePath,
            size: Buffer.byteLength(jsonContent)
        };
    }

    async generateMarkdownReport(results) {
        const mdContent = this.createMarkdownReport(results);
        const filePath = path.join(this.outputDir, 'report.md');
        
        await fs.writeFile(filePath, mdContent);
        
        return {
            type: 'markdown',
            path: filePath,
            size: Buffer.byteLength(mdContent)
        };
    }

    createMarkdownReport(results) {
        const timestamp = new Date(results.timestamp).toLocaleString();
        const errorCount = results.errors?.length || 0;
        
        return `# BRUTAL Test Report

Generated: ${timestamp}

## Summary

- **Errors**: ${errorCount}
- **Performance Score**: ${this.getPerformanceScore(results)}%
- **Duration**: ${this.getDuration(results)}s
- **Mode**: ${results.config?.mode || 'complete'}

## Errors

${errorCount === 0 ? '✅ No errors detected!' : this.formatErrorsMarkdown(results.errors)}

## Performance

${this.formatPerformanceMarkdown(results.analysis?.performance)}

## Root Causes

${this.formatRootCausesMarkdown(results.analysis?.rootCauses)}

## Recommendations

${this.formatRecommendationsMarkdown(results.suggestions || results.analysis?.performance?.recommendations)}

---

*Generated by BRUTAL Test System v1.0.0*
`;
    }

    formatErrorsMarkdown(errors) {
        if (!errors || errors.length === 0) return '';
        
        return errors.slice(0, 10).map(error => 
            `- **${error.type || 'ERROR'}**: ${error.message || error.text || 'Unknown error'}`
        ).join('\n');
    }

    formatPerformanceMarkdown(perf) {
        if (!perf) return 'No performance data available';
        
        return `
- FCP: ${perf.firstContentfulPaint}ms
- TBT: ${perf.totalBlockingTime}ms
- CLS: ${perf.cumulativeLayoutShift}
- FPS: ${perf.averageFPS} avg
- Score: ${perf.performanceScore}%
- Grade: ${perf.grade || 'N/A'}
`;
    }

    formatRootCausesMarkdown(rootCauses) {
        if (!rootCauses?.primaryCause) return 'No root cause analysis available';
        
        return `
**Primary Cause**: ${rootCauses.primaryCause.rootCause}
- Pattern: ${rootCauses.primaryCause.pattern}
- Confidence: ${Math.round(rootCauses.primaryCause.confidence * 100)}%

### Fix Plan
${rootCauses.fixPlan?.map((step, i) => `${i + 1}. ${step.action} - ${step.reason}`).join('\n') || 'No fix plan generated'}
`;
    }

    formatRecommendationsMarkdown(recommendations) {
        if (!recommendations || recommendations.length === 0) return 'No recommendations';
        
        return recommendations.map(rec => `
### ${rec.title}
${rec.description || ''}
${rec.suggestions ? rec.suggestions.map(s => `- ${s}`).join('\n') : ''}
`).join('\n');
    }

    async createIndexFile(reports) {
        const indexContent = `# BRUTAL Test Results

## Generated Reports

${reports.map(report => `- [${report.type.toUpperCase()} Report](${path.basename(report.path)}) (${(report.size / 1024).toFixed(2)} KB)`).join('\n')}

## Quick Links

- [HTML Dashboard](report.html) - Interactive report with visualizations
- [JSON Data](report.json) - Raw test data for processing
- [Markdown Summary](report.md) - Text-based summary

Generated: ${new Date().toLocaleString()}
`;
        
        await fs.writeFile(path.join(this.outputDir, 'index.md'), indexContent);
    }

    // Helper methods
    getPerformanceScore(results) {
        return results.analysis?.performance?.performanceScore || 0;
    }

    getPerformanceClass(results) {
        const score = this.getPerformanceScore(results);
        if (score >= 90) return 'good';
        if (score >= 50) return 'warning';
        return 'bad';
    }

    getDuration(results) {
        if (results.duration) return (results.duration / 1000).toFixed(2);
        return '0';
    }

    escapeHtml(text) {
        const div = { innerHTML: '' };
        div.innerHTML = text;
        return div.innerHTML
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}