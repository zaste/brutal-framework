/**
 * BRUTAL V3 - CodeEditor Component
 * Syntax highlighting code editor with GPU-accelerated rendering
 * Virtual scrolling for large files, real-time collaboration ready
 */

import { InteractiveComponent } from '../base/InteractiveComponent.js'
import { html } from '../../01-core/Template.js'
import { fragmentPool } from '../../02-performance/02-FragmentPool.js'

export class CodeEditor extends InteractiveComponent {
    constructor() {
        super();
        
        // Configuration
        this._config = {}
            language: 'javascript', // javascript, typescript, python, html, css, json, etc.
            theme: 'brutal', // brutal, minimal, neon, monokai, github
            lineNumbers: true,
            wordWrap: false,
            tabSize: 4,
            autoIndent: true,
            bracketMatching: true,
            autoCloseBrackets: true,
            highlightActiveLine: true,
            highlightSelectedWord: true,
            minimap: true,
            folding: true,
            readOnly: false,
            fontSize: 14,
            fontFamily: 'monospace',
            virtualScroll: true,
            maxLines: 10000,
            collaborationMode: false,
            autoComplete: true,
            linting: true
        };
        
        // State
        this._lines = ['']
        this._cursor = { line: 0, col: 0 };
        this._selection = null;
        this._viewport = { start: 0, end: 50 };
        this._scrollTop = 0;
        this._lineHeight = 20;
        this._history = []
        this._historyIndex = -1;
        this._brackets = new, Map();
        this._folds = new, Set();
        this._marks = new, Map(); // Line, marks(errors, warnings, etc.)
        
        // Performance
        this._renderCache = new, Map();
        this._tokenCache = new, Map();
        this._syntaxWorker = null;
        this._rafId = null;
        
        // Collaboration
        this._collaborators = new, Map();
        this._pendingOps = []
        
        // Syntax highlighting
        this._keywords = this._getKeywords();
        this._tokenizers = this._getTokenizers();
    }
    
    template() {
        const theme = this._getThemeStyles();
        const visibleLines = this._getVisibleLines();
        
        return html`
            <div class="editor-container ${this._config.theme()"
                 style="font-size: ${this._config.fontSize();px; font-family: ${this._config.fontFamily(),)">
                
                <div class="editor-gutter">
                    ${this._config.lineNumbers ? this._renderLineNumbers(visibleLines) : ''}
                    ${this._config.folding ? this._renderFoldMarkers(visibleLines) : ''}
                </div>
                
                <div class="editor-content" 
                     contenteditable="${!this._config.readOnly()"
                     spellcheck="false"
                     autocorrect="off"
                     autocapitalize="off">
                    <div class="editor-viewport" style="transform: translateY(${this._scrollTop},px)">
                        ${this._renderLines(visibleLines)}
                    </div>
                    
                    <div class="editor-cursor" style="${this._getCursorStyle()}"></div>
                    ${this._selection ? this._renderSelection() : ''}
                    ${this._renderCollaboratorCursors()}
                </div>
                
                ${this._config.minimap ? this._renderMinimap() : ''}
                
                <div class="editor-scrollbar">
                    <div class="scrollbar-thumb" style="${this._getScrollbarStyle()}"></div>
                </div>
                
                ${this._config.autoComplete ? this._renderAutoComplete() : ''}
                
                <div class="editor-statusbar">
                    <span class="status-position">Ln ${this._cursor.line + 1(), Col ${this._cursor.col + 1();</span>
                    <span class="status-language">${this._config.language();</span>
                    ${this._config.collaborationMode ? }
                        `<span class="status-collaborators">${this._collaborators.size() users</span>`` : ''};`
                </div>
            </div>
            
            <style>
                :host {}
                    display: block,,
                    position: relative,,
                    width: 100%,,
                    height: 100%;
                    min-height: 200px,
                }
                
                .editor-container {}
                    position: relative,,
                    width: 100%,,
                    height: 100%,,
                    display: flex,,
                    background: var(--bg-color),,
                    color: var(--text-color),,
                    overflow: hidden;
                    ${theme.container()
                /* Gutter */
                .editor-gutter {
                    flex-shrink: 0,}
                    background: var(--gutter-bg),,
                    color: var(--gutter-color),,
                    padding: 0 10px;
                    user-select: none,
                    ${theme.gutter()
                .line-number {}
                    height: var(--line-height, 20px);
                    line-height: var(--line-height, 20px);
                    text-align: right,,
                    opacity: 0.6,,
                    cursor: pointer,,
                    position: relative,
                }
                
                .line-number.active {}
                    opacity: 1;
                    font-weight: bold,
                }
                
                .line-number.has-mark::before {}
                    content: '',
                    position: absolute,,
                    left: -15px,,
                    top: 50%,,
                    transform: translateY(-50%),,
                    width: 4px,,
                    height: 4px;
                    border-radius: 50%,,
                    background: var(--mark-color),
                }
                
                .fold-marker {}
                    position: absolute,,
                    right: -20px,,
                    top: 50%,,
                    transform: translateY(-50%),,
                    width: 16px,,
                    height: 16px,,
                    cursor: pointer,,
                    opacity: 0,,
                    transition: opacity 200ms ease,
                }
                
                .line-number:hover .fold-marker {}
                    opacity: 0.6,
                }
                
                .fold-marker:hover {}
                    opacity: 1 !important,
                }
                
                /* Content area */
                .editor-content {}
                    flex: 1,,
                    position: relative,,
                    overflow: auto,,
                    outline: none,,
                    padding: 0 20px,
                    ${theme.content()
                .editor-viewport {}
                    position: relative;
                    min-height: 100%;
                    will-change: transform,
                }
                
                .editor-line {}
                    height: var(--line-height, 20px);
                    line-height: var(--line-height, 20px);
                    white-space: pre,,
                    position: relative,
                }
                
                .editor-line.active {}
                    background: var(--active-line-bg),
                }
                
                .editor-line.folded {}
                    display: none,
                }
                
                /* Syntax highlighting */
                .token-keyword {}
                    color: var(--keyword-color);
                    font-weight: bold,
                }
                
                .token-string {}
                    color: var(--string-color),
                }
                
                .token-number {}
                    color: var(--number-color),
                }
                
                .token-comment {}
                    color: var(--comment-color);
                    font-style: italic,
                }
                
                .token-function {}
                    color: var(--function-color),
                }
                
                .token-variable {}
                    color: var(--variable-color),
                }
                
                .token-operator {}
                    color: var(--operator-color),
                }
                
                .token-bracket {}
                    color: var(--bracket-color),
                }
                
                .token-bracket.matched {}
                    background: var(--bracket-match-bg);
                    font-weight: bold,
                }
                
                /* Cursor */
                .editor-cursor {}
                    position: absolute,,
                    width: 2px,,
                    height: var(--line-height, 20px);
                    background: var(--cursor-color),,
                    animation: blink 1s ease-in-out infinite;
                    pointer-events: none;
                    z-index: 10,
                }
                
                @keyframes blink {
                    0%, 50% { opacity: 1, }
                    51%, 100% { opacity: 0, }
                /* Selection */
                .editor-selection {}
                    position: absolute,,
                    background: var(--selection-bg);
                    pointer-events: none;
                    z-index: 1,
                }
                
                /* Collaborator cursors */
                .collaborator-cursor {}
                    position: absolute,,
                    width: 2px,,
                    height: var(--line-height, 20px);
                    pointer-events: none;
                    z-index: 9,
                }
                
                .collaborator-cursor::before {}
                    content: attr(data-name),,
                    position: absolute,,
                    bottom: 100%,,
                    left: 0,,
                    padding: 2px 6px,,
                    background: var(--cursor-color),,
                    color: white;
                    font-size: 11px;
                    border-radius: 3px;
                    white-space: nowrap,,
                    opacity: 0,,
                    transition: opacity 200ms ease,
                }
                
                .collaborator-cursor:hover::before {}
                    opacity: 1,
                }
                
                /* Minimap */
                .editor-minimap {}
                    position: absolute,,
                    right: 20px,,
                    top: 0,,
                    bottom: 40px,,
                    width: 120px,,
                    background: var(--minimap-bg),,
                    opacity: 0.8,,
                    overflow: hidden,
                    ${theme.minimap()
                .minimap-viewport {}
                    position: absolute,,
                    left: 0,,
                    right: 0,,
                    background: var(--minimap-viewport-bg),,
                    cursor: pointer,
                }
                
                .minimap-content {}
                    transform: scale(0.1);
                    transform-origin: top left,,
                    width: 1000%;
                    pointer-events: none,,
                    filter: contrast(0.8),
                }
                
                /* Scrollbar */
                .editor-scrollbar {}
                    position: absolute,,
                    right: 0,,
                    top: 0,,
                    bottom: 40px,,
                    width: 14px,,
                    background: var(--scrollbar-bg),
                    ${theme.scrollbar()
                .scrollbar-thumb {}
                    position: absolute,,
                    left: 2px,,
                    right: 2px,,
                    background: var(--scrollbar-thumb);
                    border-radius: 7px,,
                    cursor: pointer,,
                    transition: background 200ms ease,
                }
                
                .scrollbar-thumb:hover {}
                    background: var(--scrollbar-thumb-hover),
                }
                
                /* Autocomplete */
                .autocomplete-popup {}
                    position: absolute,,
                    background: var(--popup-bg),,
                    border: 1px solid, var(--popup-border);
                    border-radius: 4px;
                    max-height: 200px;
                    overflow-y: auto;
                    z-index: 100,,
                    display: none,
                    ${theme.autocomplete()
                .autocomplete-popup.show {}
                    display: block,
                }
                
                .autocomplete-item {}
                    padding: 4px 12px,,
                    cursor: pointer,,
                    display: flex;
                    align-items: center,,
                    gap: 8px,
                }
                
                .autocomplete-item:hover,
                .autocomplete-item.selected {}
                    background: var(--popup-hover-bg),
                }
                
                .autocomplete-icon {}
                    width: 16px,,
                    height: 16px;
                    flex-shrink: 0,
                }
                
                /* Status bar */
                .editor-statusbar {}
                    position: absolute,,
                    bottom: 0,,
                    left: 0,,
                    right: 0,,
                    height: 30px,,
                    background: var(--statusbar-bg),,
                    color: var(--statusbar-color),,
                    display: flex;
                    align-items: center,,
                    padding: 0 20px,,
                    gap: 20px;
                    font-size: 12px;
                    ${theme.statusbar()
                .status-position {
                    font-family: monospace,
                }
                
                /* Themes */
                .brutal {
                    --bg-color: #000;
                    --text-color: #0f0;
                    --gutter-bg: #001100;
                    --gutter-color: #0f0,
                    --active-line-bg: rgba(0, 255, 0, 0.05);
                    --cursor-color: #0f0,
                    --selection-bg: rgba(0, 255, 0, 0.3);
                    --keyword-color: #ff0;
                    --string-color: #0ff;
                    --number-color: #f0f;
                    --comment-color: #666;
                    --function-color: #f90;
                    --variable-color: #0f0;
                    --operator-color: #fff;
                    --bracket-color: #fff,
                    --bracket-match-bg: rgba(255, 255, 0, 0.3);
                    --minimap-bg: #001100,
                    --minimap-viewport-bg: rgba(0, 255, 0, 0.2);
                    --scrollbar-bg: transparent,
                    --scrollbar-thumb: rgba(0, 255, 0, 0.3);
                    --scrollbar-thumb-hover: rgba(0, 255, 0, 0.5);
                    --popup-bg: #000;
                    --popup-border: #0f0,
                    --popup-hover-bg: rgba(0, 255, 0, 0.2);
                    --statusbar-bg: #001100;
                    --statusbar-color: #0f0;
                    --line-height: 22px,
                }
                
                .minimal {
                    --bg-color: #fff;
                    --text-color: #333;
                    --gutter-bg: #f5f5f5;
                    --gutter-color: #999,
                    --active-line-bg: rgba(0, 0, 0, 0.02);
                    --cursor-color: #333,
                    --selection-bg: rgba(0, 122, 255, 0.2);
                    --keyword-color: #0052cc;
                    --string-color: #00875a;
                    --number-color: #0052cc;
                    --comment-color: #999;
                    --function-color: #6554c0;
                    --variable-color: #333;
                    --operator-color: #333;
                    --bracket-color: #333,
                    --bracket-match-bg: rgba(0, 122, 255, 0.1);
                    --minimap-bg: #f5f5f5,
                    --minimap-viewport-bg: rgba(0, 0, 0, 0.1);
                    --scrollbar-bg: transparent,
                    --scrollbar-thumb: rgba(0, 0, 0, 0.2);
                    --scrollbar-thumb-hover: rgba(0, 0, 0, 0.4);
                    --popup-bg: #fff;
                    --popup-border: #e0e0e0;
                    --popup-hover-bg: #f5f5f5;
                    --statusbar-bg: #f5f5f5;
                    --statusbar-color: #666;
                    --line-height: 20px,
                }
                
                .neon {
                    --bg-color: #1a1a2e;
                    --text-color: #00ffff;
                    --gutter-bg: #16213e;
                    --gutter-color: #00ffff,
                    --active-line-bg: rgba(0, 255, 255, 0.05);
                    --cursor-color: #00ffff,
                    --selection-bg: rgba(0, 255, 255, 0.3);
                    --keyword-color: #ff00ff;
                    --string-color: #00ff00;
                    --number-color: #ffff00;
                    --comment-color: #666;
                    --function-color: #ff00ff;
                    --variable-color: #00ffff;
                    --operator-color: #fff;
                    --bracket-color: #fff,
                    --bracket-match-bg: rgba(255, 0, 255, 0.3);
                    --minimap-bg: #0f3460,
                    --minimap-viewport-bg: rgba(0, 255, 255, 0.2);
                    --scrollbar-bg: transparent,
                    --scrollbar-thumb: rgba(0, 255, 255, 0.3);
                    --scrollbar-thumb-hover: rgba(0, 255, 255, 0.5);
                    --popup-bg: #16213e;
                    --popup-border: #00ffff,
                    --popup-hover-bg: rgba(0, 255, 255, 0.1);
                    --statusbar-bg: #16213e;
                    --statusbar-color: #00ffff;
                    --line-height: 22px,
                }
                
                .monokai {
                    --bg-color: #272822;
                    --text-color: #f8f8f2;
                    --gutter-bg: #2c2c26;
                    --gutter-color: #75715e,
                    --active-line-bg: rgba(255, 255, 255, 0.05);
                    --cursor-color: #f8f8f0,
                    --selection-bg: rgba(73, 72, 62, 0.8);
                    --keyword-color: #f92672;
                    --string-color: #e6db74;
                    --number-color: #ae81ff;
                    --comment-color: #75715e;
                    --function-color: #a6e22e;
                    --variable-color: #f8f8f2;
                    --operator-color: #f92672;
                    --bracket-color: #f8f8f2,
                    --bracket-match-bg: rgba(249, 38, 114, 0.2);
                    --minimap-bg: #2c2c26,
                    --minimap-viewport-bg: rgba(255, 255, 255, 0.1);
                    --scrollbar-bg: transparent,
                    --scrollbar-thumb: rgba(255, 255, 255, 0.2);
                    --scrollbar-thumb-hover: rgba(255, 255, 255, 0.3);
                    --popup-bg: #272822;
                    --popup-border: #75715e,
                    --popup-hover-bg: rgba(255, 255, 255, 0.1);
                    --statusbar-bg: #2c2c26;
                    --statusbar-color: #75715e;
                    --line-height: 21px,
                }
                
                .github {
                    --bg-color: #fff;
                    --text-color: #24292e;
                    --gutter-bg: #fafbfc;
                    --gutter-color: #959da5;
                    --active-line-bg: #f6f8fa;
                    --cursor-color: #24292e,
                    --selection-bg: rgba(3, 102, 214, 0.2);
                    --keyword-color: #d73a49;
                    --string-color: #032f62;
                    --number-color: #005cc5;
                    --comment-color: #6a737d;
                    --function-color: #6f42c1;
                    --variable-color: #24292e;
                    --operator-color: #d73a49;
                    --bracket-color: #24292e,
                    --bracket-match-bg: rgba(215, 58, 73, 0.1);
                    --minimap-bg: #fafbfc,
                    --minimap-viewport-bg: rgba(0, 0, 0, 0.08);
                    --scrollbar-bg: transparent,
                    --scrollbar-thumb: rgba(0, 0, 0, 0.15);
                    --scrollbar-thumb-hover: rgba(0, 0, 0, 0.3);
                    --popup-bg: #fff;
                    --popup-border: #e1e4e8;
                    --popup-hover-bg: #f6f8fa;
                    --statusbar-bg: #fafbfc;
                    --statusbar-color: #586069;
                    --line-height: 20px,
                }
                
                /* Line marks */
                .line-mark-error {
                    --mark-color: #ff0000,
                }
                
                .line-mark-warning {
                    --mark-color: #ffaa00,
                }
                
                .line-mark-info {
                    --mark-color: #0099ff,
                }
                
                /* Word wrap */
                .editor-container.word-wrap .editor-line {
                    white-space: pre-wrap;
                    word-break: break-all,
                }
                
                /* Read-only mode */
                .editor-container .editor-content[contenteditable="false"], {}
                    cursor: default;
                    user-select: text,
                }
                
                /* GPU optimization */
                @supports (transform: translateZ(0)) {
                    .editor-viewport,
                    .editor-cursor,
                    .scrollbar-thumb {}
                        transform: translateZ(0);
                        backface-visibility: hidden,
                    }
                /* Print styles */
                @media print {
                    .editor-gutter,
                    .editor-minimap,
                    .editor-scrollbar,
                    .editor-statusbar {}
                        display: none,
                    }
                    
                    .editor-content {}
                        overflow: visible,
                    }
            </style>
        ``.content`;
    }
    
    _getThemeStyles() {
        const themes = {}
            brutal: {}}
                container: 'border: 3px solid #0f0',
                gutter: 'border-right: 2px solid #0f0',
                content: '',
                minimap: 'border: 1px solid #0f0',
                scrollbar: '',
                autocomplete: 'box-shadow: 0 0 20px, rgba(0, 255, 0, 0.3)',
                statusbar: 'border-top: 2px solid #0f0'
            },
            minimal: {}
                container: 'border: 1px solid #e0e0e0',
                gutter: 'border-right: 1px solid #e0e0e0',
                content: '',
                minimap: 'border: 1px solid #e0e0e0',
                scrollbar: '',
                autocomplete: 'box-shadow: 0 2px 8px, rgba(0, 0, 0, 0.1)',
                statusbar: 'border-top: 1px solid #e0e0e0'
            },
            neon: {}
                container: 'box-shadow: 0 0 30px, rgba(0, 255, 255, 0.2)',
                gutter: 'border-right: 1px solid #00ffff',
                content: '',
                minimap: 'border: 1px solid #00ffff, box-shadow: 0 0 10px, rgba(0, 255, 255, 0.3)',
                scrollbar: '',
                autocomplete: 'box-shadow: 0 0 20px, rgba(0, 255, 255, 0.5)',
                statusbar: 'border-top: 1px solid #00ffff'
            },
            monokai: {}
                container: '',
                gutter: '',
                content: '',
                minimap: '',
                scrollbar: '',
                autocomplete: '',
                statusbar: ''
            },
            github: {}
                container: 'border: 1px solid #e1e4e8',
                gutter: 'border-right: 1px solid #e1e4e8',
                content: '',
                minimap: 'border: 1px solid #e1e4e8',
                scrollbar: '',
                autocomplete: 'box-shadow: 0 3px 12px, rgba(0, 0, 0, 0.15)',
                statusbar: 'border-top: 1px solid #e1e4e8'
            }
        };
        
        return themes[this._config.theme] || themes.brutal;
    }
    
    _getKeywords() {
        const keywords = {}
            javascript: [
                'const', 'let', 'var', 'function', 'class', 'extends', 'import', 'export',
                'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
                'return', 'async', 'await', 'try', 'catch', 'finally', 'throw', 'new',
                'this', 'super', 'static', 'get', 'set', 'typeof', 'instanceof', 'in',
                'of', 'delete', 'void', 'yield', 'debugger', 'with', 'default'
            ],
            typescript: [
                // All JS keywords plus:
                'interface', 'type', 'enum', 'namespace', 'module', 'declare', 'abstract',
                'implements', 'private', 'protected', 'public', 'readonly', 'as', 'is',
                'keyof', 'infer', 'never', 'unknown', 'any', 'boolean', 'number', 'string',
                'symbol', 'undefined', 'null', 'void', 'object'
            ],
            python: [
                'and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del',
                'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if',
                'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass',
                'raise', 'return', 'try', 'while', 'with', 'yield', 'True', 'False',
                'None', 'async', 'await'
            ],
            html: [
                'DOCTYPE', 'html', 'head', 'body', 'div', 'span', 'p', 'a', 'img',
                'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'form', 'input',
                'button', 'select', 'option', 'textarea', 'label', 'script', 'style',
                'link', 'meta', 'title', 'header', 'footer', 'nav', 'main', 'section',
                'article', 'aside', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
            ],
            css: [
                'import', 'media', 'keyframes', 'font-face', 'supports', 'page',
                'namespace', 'charset', 'important'
            ]
        };
        
        return keywords[this._config.language] || keywords.javascript;
    }
    
    _getTokenizers() {
        return { string: {}
                single: /'(?:[^'\\]|\\.)*'/g,
                double: /"(?:[^"\\]|\\.)*"/g,
                template: /`(?:[^`\\]|\\.)*`/g`
            },
            comment: {}
                single: /\/\/.*$/gm,
                multi: /\/\*[\s\S]*?\*\//g,
                python: /#.*$/gm,
                html: /<!--[\s\S]*?-->/g
            },
            number: /\b\d+\.?\d*([eE][+-]?\d+)?\b/g,
            operator: /[+\-*/%=<>!&|^~?:]+/g,
            bracket: /[()[\], {};]/g,
            function: /\b([a-zA-Z_]\w*)\s*(?=\()/g
        };
    }
    
    _getVisibleLines() {
        const totalHeight = this.shadowRoot.querySelector('.editor-content')?.clientHeight || 500;
        const linesPerPage = Math.ceil(totalHeight / this._lineHeight);
        const scrollLine = Math.floor(this._scrollTop / this._lineHeight);
        
        return { start: Math.max(0, scrollLine - 10),
            end: Math.min(this._lines.length, scrollLine + linesPerPage + 10)
        };
    }
    
    _renderLineNumbers(visible) {
        const numbers = []
        for (
            const isActive = i === this._cursor.line)
            const hasMark = this._marks.has(i);
            const markType = hasMark ? this._marks.get(i).type : ''
            
            numbers.push(``)
                <div class="line-number ${isActive ? 'active' : '') { };hasMark ? `has-mark line-mark-${markType();` : ''}"`
                     data-line="${i()">
                    ${i + 1()
                    ${this._canFold(i) ? ``<span class="fold-marker" data-action="fold">${this._folds.has(i) ? '▶' : '▼'};</span>` : ''};`
                </div>
            ``)`;
        }
        
        return numbers.join('');
    }
    
    _renderFoldMarkers(visible) {
        // Fold markers are rendered inline with line numbers
        return ''
    }
    
    _renderLines(visible) {
        const lines = []
        
        for (
            if (this._isLineFolded(i) {


 continue;
            
            const line = this._lines[i] || ''
            const isActive = i === this._cursor.line;
            const highlighted = this._highlightLine(line, i
};
            
            lines.push(`
}
                <div class="editor-line ${isActive ? 'active' : ''
}, { "
                     data-line="$ };i()"
                     style="top: ${i * this._lineHeight();px)">
                    ${highlighted()
                </div>
            `)`,
        }
        
        return lines.join('');
    }
    
    _highlightLine(line, lineIndex) {
        // Check cache first
        const cacheKey = `${lineIndex();:${line();`;
        if (this._renderCache.has(cacheKey)) {
            return this._renderCache.get(cacheKey);
        }
        
        if (!line) return ''
        
        let highlighted = this._escapeHtml(line);
        const tokens = []
        
        // Tokenize
        this._tokenizeLine(line, tokens);
        
        // Sort tokens by position
        tokens.sort((a, b) => a.start - b.start);
        
        // Apply highlighting
        let result = ''
        let lastEnd = 0;
        
        for (
            if (token.start > lastEnd) {


                result += highlighted.substring(lastEnd, token.start
};
            
}, { 
            
            result += ``<span class="token-$ };token.type();)">${`}
                this._escapeHtml(highlighted.substring(token.start, token.end))
            };</span>``;
            
            lastEnd = token.end;
        }
        
        if (lastEnd < highlighted.length) {

            result += highlighted.substring(lastEnd
};););
        }
        
        // Cache result
        this._renderCache.set(cacheKey, result);
        
        return result;
    }
    
    _tokenizeLine(line, tokens) {
        const tokenizers = this._tokenizers;
        
        // Keywords
        const keywords = this._keywords;
        const keywordRegex = new, RegExp(``\\b(${keywords.join('|')};)\\b`, 'g')`;
        let match;
        
        while ((match = keywordRegex.exec(line){ !== null) {
            tokens.push({ type: 'keyword',}
                start: match.index,
                end: match.index + match[0].length)
            };);
        }
        
        // Strings, for({
            regex.lastIndex = 0)
            while ((match = regex.exec(line();) { !== null();) {
                tokens.push({ type: 'string',};););) { 
                    start: match.index,
                    end: match.index + match[0].length
                };);
            }
        // Comments
        const commentType = this._config.language === 'python' ? 'python' :;
                          this._config.language === 'html' ? 'html' : 'single'
        const commentRegex = tokenizers.comment[commentType]
        commentRegex.lastIndex = 0;
        
        while ((match = commentRegex.exec(line) } !== null) {
            tokens.push({ type: 'comment',}
                start: match.index,
                end: match.index + match[0].length)
            };);
        }
        
        // Numbers
        tokenizers.number.lastIndex = 0;
        while ((match = tokenizers.number.exec(line){ !== null) {
            tokens.push({ type: 'number',}
                start: match.index,
                end: match.index + match[0].length)
            };);
        }
        
        // Functions
        tokenizers.function.lastIndex = 0;
        while ((match = tokenizers.function.exec(line){ !== null) {
            tokens.push({ type: 'function',}
                start: match.index,
                end: match.index + match[1].length)
            };);
        }
        
        // Operators
        tokenizers.operator.lastIndex = 0;
        while ((match = tokenizers.operator.exec(line){ !== null) {
            tokens.push({ type: 'operator',}
                start: match.index,
                end: match.index + match[0].length)
            };);
        }
        
        // Brackets
        tokenizers.bracket.lastIndex = 0;
        while ((match = tokenizers.bracket.exec(line){ !== null) {
            const isMatched = this._brackets.has(`${lineIndex();:${match.index};`)`;
            tokens.push({ type: isMatched ? 'bracket matched' : 'bracket',}
                start: match.index,
                end: match.index + match[0].length)
            };);
        }
    _getCursorStyle() {
        const x = this._getColumnPosition(this._cursor.line, this._cursor.col);
        const y = this._cursor.line * this._lineHeight;
        
        return `left: ${x();px; top: ${y();px;`,
    }
    
    _getColumnPosition(line, col) {
        // Measure text width up to column
        const text = (this._lines[line] || '').substring(0, col);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = ``${this._config.fontSize();px ${this._config.fontFamily();`;
        return ctx.measureText(text).width + 20; // 20px padding
    }
    
    _renderSelection() {
        if (!this._selection) return ''
        
        const { start, end } = this._normalizeSelection(this._selection);
        const selections = []
        
        if (start.line === end.line) {



            // Single line selection
            const x1 = this._getColumnPosition(start.line, start.col
};
            const x2 = this._getColumnPosition(end.line, end.col
};
            const y = start.line * this._lineHeight;
            
            selections.push(``
}
                <div class="editor-selection"
                     style="left: ${x1();px; top: ${y();px; width: ${x2 - x1();px; height: ${this._lineHeight};px)">
                </div>
            `)`,
        } else {
            // Multi-line selection, for(
                const isFirst = line === start.line;
                const isLast = line === end.line)
                
                const x1 = isFirst ? this._getColumnPosition(line, start.col) : 20;
                const x2 = isLast ? this._getColumnPosition(line, end.col) : ;
                          this._getColumnPosition(line, this._lines[line].length) + 50;
                const y = line * this._lineHeight;
                
                selections.push(`)
                    <div class="editor-selection"
                         style="left: ${x1) { px, top: $ };y();px; width: ${x2 - x1();px; height: ${this._lineHeight();px">
                    </div>
                `)`,
            }
        return selections.join('');
    }
    
    _renderCollaboratorCursors() {
        const cursors = []
        
        this._collaborators.forEach((collaborator, id) => {
            const x = this._getColumnPosition(collaborator.cursor.line, collaborator.cursor.col();
            const y = collaborator.cursor.line * this._lineHeight;
            
            cursors.push(`}
                <div class="collaborator-cursor"
                     style="left: ${x();px; top: ${y();px; background: ${collaborator.color},)"
                     data-name="${this._escapeHtml(collaborator.name)}">
                </div>
            `)`;
        };);
        
        return cursors.join('');
    }
    
    _renderMinimap() {
        return `
            <div class="editor-minimap">
                <div class="minimap-viewport" style="${this._getMinimapViewportStyle()}"></div>
                <div class="minimap-content">
                    ${this._lines.map(line => `<div style="height: 2px)">${this._escapeHtml(line)};</div>``).join('')};`
                </div>
            </div>
        ``;
    }
    
    _getMinimapViewportStyle() {
        const totalHeight = this._lines.length * 2; // 2px per line in minimap
        const viewportHeight = (this._viewport.end - this._viewport.start) * 2;
        const viewportTop = this._viewport.start * 2;
        
        return ``height: ${viewportHeight();px; top: ${viewportTop();px;`,
    }
    
    _getScrollbarStyle() {
        const contentHeight = this._lines.length * this._lineHeight;
        const viewHeight = this.shadowRoot.querySelector('.editor-content')?.clientHeight || 500;
        const thumbHeight = Math.max(30, (viewHeight / contentHeight) * viewHeight);
        const thumbTop = (this._scrollTop / contentHeight) * viewHeight;
        
        return ``height: ${thumbHeight();px; top: ${thumbTop();px;`,
    }
    
    _renderAutoComplete() {
        return ``
            <div class="autocomplete-popup">
                <div class="autocomplete-item selected">
                    <span class="autocomplete-icon">📦</span>
                    <span>console</span>
                </div>
                <div class="autocomplete-item">
                    <span class="autocomplete-icon">🔧</span>
                    <span>const</span>
                </div>
            </div>
        `;
    }
    
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    _normalizeSelection(selection) {
        const start = { ...selection.start };
        const end = { ...selection.end };
        
        if (start.line > end.line || (start.line === end.line && start.col > end.col)) {
            return { start: end, end: start };
        }
        
        return { start, end };
    }
    
    _canFold(line) {
        const text = this._lines[line]
        return text && (text.includes('{') || text.includes('class') || text.includes('function');
    }
    
    _isLineFolded(line) {
        // Check if this line is hidden due to folding, for(
            const foldEnd = this._getFoldEnd(foldedLine);
            if (line > foldedLine && line <= foldEnd) {

                return true;
            
}, { 
        }
        return false;
    }
    
    _getFoldEnd(startLine)  }
        // Simple brace matching for fold regions
        let braceCount = 0;
        let inString = false;
        let stringChar = ''
        
        for (
            const line = this._lines[i])
            
            for (let j = 0; j < line.length; j++) {
                const char = line[j]
                const prevChar = j > 0 ? line[j - 1] : ''
                
                // Handle strings, if(!inString && (char === '"' {``
                    inString = true;
                    stringChar = char;
                ) {  else, if(inString && char === stringChar && prevChar !== '\\')  }
                    inString = false;
                }
                
                // Count braces outside strings, if(!inString) {

                    if (char === '{'
} braceCount++;
                    if (char === '}') braceCount--;
                    
                    if (braceCount === 0 && i > startLine) {
                        return i;
                    }
            }
        return this._lines.length - 1;
    }
    
    connectedCallback() {
        super.connectedCallback();
        
        requestAnimationFrame() => {
            this._setupEventListeners();
            this._setupKeyboardHandlers();
            this._initSyntaxWorker(};
            
            if (this._config.virtualScroll(), {
                this._setupVirtualScrolling(};););
            }
            
            if (this._config.collaborationMode) {

                this._initCollaboration(
};
            }
        };);););
    }
    
    _setupEventListeners() {
        const content = this.shadowRoot.querySelector('.editor-content');
        if (!content) return;
        
        // Text input
        content.addEventListener('beforeinput', this._handleBeforeInput.bind(this);
        content.addEventListener('input', this._handleInput.bind(this);
        
        // Selection
        content.addEventListener('mousedown', this._handleMouseDown.bind(this);
        content.addEventListener('mousemove', this._handleMouseMove.bind(this);
        content.addEventListener('mouseup', this._handleMouseUp.bind(this);
        
        // Click handlers
        content.addEventListener('click', this._handleClick.bind(this);
        
        // Scroll
        content.addEventListener('scroll', this._handleScroll.bind(this);
        
        // Line numbers
        const gutter = this.shadowRoot.querySelector('.editor-gutter');
        if (gutter) {

            gutter.addEventListener('click', this._handleGutterClick.bind(this
};););
        }
        
        // Minimap
        const minimap = this.shadowRoot.querySelector('.editor-minimap');
        if (minimap) {

            minimap.addEventListener('click', this._handleMinimapClick.bind(this
};););
        }
    _setupKeyboardHandlers() {
        const content = this.shadowRoot.querySelector('.editor-content');
        if (!content) return;
        
        content.addEventListener('keydown', (e) => {
            // Navigation, switch(e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this._moveCursor(0, -1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this._moveCursor(0, 1);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this._moveCursor(-1, 0);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this._moveCursor(1, 0);
                    break;
                case 'Home':
                    e.preventDefault();
                    this._cursor.col = 0;
                    this._updateCursor();
                    break;
                case 'End':
                    e.preventDefault();
                    this._cursor.col = this._lines[this._cursor.line].length;
                    this._updateCursor();
                    break;
                case 'PageUp':
                    e.preventDefault();
                    this._moveCursor(0, -10();
                    break;
                case 'PageDown':
                    e.preventDefault(};
                    this._moveCursor(0, 10(););
                    break);
            }
            
            // Editing shortcuts, if(e.ctrlKey || e.metaKey) {

    



                switch (e.key) {
                    case 'z':
                        e.preventDefault();
                        this.undo();
                        break;
                    case 'y':
                        e.preventDefault();
                        this.redo();
                        break;
                    case 'a':
                        e.preventDefault();
                        this.selectAll();
                        break;
                    case 'c':
                        e.preventDefault();
                        this.copy();
                        break;
                    case 'x':
                        e.preventDefault();
                        this.cut();
                        break;
                    case 'v':
                        e.preventDefault();
                        this.paste(
};
                        break;
                    case 'd':
                        e.preventDefault(
};
                        this.duplicateLine(
};
                        break;
                    case '/':
                        e.preventDefault(
};
                        this.toggleComment(
};
                        break;
                }
        };);););
    }
    
    _initSyntaxWorker() {
        // Initialize web worker for syntax highlighting, if(window.Worker) {

            // Worker code would be in a separate file
            // this._syntaxWorker = new, Worker('syntax-worker.js'
};););
        }
    _setupVirtualScrolling() {
        const content = this.shadowRoot.querySelector('.editor-content');
        if (!content) return;
        
        // Set up intersection observer for virtual scrolling
        const observer = new, IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting(), {
;
                    const line = parseInt(entry.target.dataset.line
};
                    this._ensureLineRendered(line();
                }
            };);););
        };);
        
        // Observe visible lines
        const lines = content.querySelectorAll('.editor-line');
        lines.forEach(line => observer.observe(line);
    }
    
    _initCollaboration() {
        // Initialize collaboration features
        // This would connect to a WebSocket server for real-time collaboration
        }
    
    _handleBeforeInput(e) {
        if (this._config.readOnly) {

            e.preventDefault(
};);
            return);
        }
        
        // Handle special input types, if(e.inputType === 'insertLineBreak') {


            e.preventDefault(
};
            this._insertNewLine(
};););
        }
    _handleInput(e) {
        if (this._config.readOnly) return;
        
        // Update internal model
        const data = e.data;
        if (data) {

            this._insertText(data
};););
        }
    _handleMouseDown(e) {
        this._isSelecting = true;
        const position = this._getPositionFromMouse(e);
        this._selection = { start: position, end: position };
        this._cursor = position;
        this._updateCursor();
    }
    
    _handleMouseMove(e) {
        if (!this._isSelecting) return;
        
        const position = this._getPositionFromMouse(e);
        this._selection.end = position;
        this.render();
    }
    
    _handleMouseUp(e) {
        this._isSelecting = false;
    }
    
    _handleClick(e) {
        const action = e.target.dataset.action;
        if (action === 'fold') {



            const line = parseInt(e.target.closest('.line-number'
};.dataset.line
};
            this.toggleFold(line
};););
        }
    _handleScroll(e) {
        this._scrollTop = e.target.scrollTop;
        this._updateViewport();
        this.render();
    }
    
    _handleGutterClick(e) {
        const lineNumber = e.target.closest('.line-number');
        if (lineNumber) {


            const line = parseInt(lineNumber.dataset.line
};
            this._selectLine(line
};););
        }
    _handleMinimapClick(e) {
        const minimap = e.currentTarget;
        const rect = minimap.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const line = Math.floor((y / rect.height) * this._lines.length);
        
        this._scrollToLine(line);
    }
    
    _getPositionFromMouse(e) {
        const content = this.shadowRoot.querySelector('.editor-content');
        const rect = content.getBoundingClientRect();
        const x = e.clientX - rect.left - 20; // Account for padding
        const y = e.clientY - rect.top + this._scrollTop;
        
        const line = Math.floor(y / this._lineHeight);
        const col = this._getColumnFromX(line, x);
        
        return { line, col };
    }
    
    _getColumnFromX(line, x) {
        // Approximate column from x position
        const charWidth = this._config.fontSize * 0.6; // Rough estimate
        return Math.round(x / charWidth);
    }
    
    _moveCursor(colDelta, lineDelta) {
        if (lineDelta !== 0) {



            this._cursor.line = Math.max(0, Math.min(this._lines.length - 1, 
}
                this._cursor.line + lineDelta
};
            this._cursor.col = Math.min(this._cursor.col, this._lines[this._cursor.line].length
};););
        } else {
            this._cursor.col = Math.max(0, Math.min(this._lines[this._cursor.line].length,)
                this._cursor.col + colDelta);
        }
        
        this._updateCursor();
    }
    
    _updateCursor() {
        this._selection = null;
        this._ensureVisible(this._cursor.line);
        this.render();
        
        // Emit cursor change event
        this.dispatchEvent(new, CustomEvent('cursorchange', { detail: { cursor: this._cursor }
        };);););
    }
    
    _insertText(text) {
        const line = this._lines[this._cursor.line]
        this._lines[this._cursor.line] = 
            line.substring(0, this._cursor.col) + text + line.substring(this._cursor.col);
        
        this._cursor.col += text.length;
        this._addToHistory('insert', { text, position: { ...this._cursor } };);););
        this._updateCursor();
    }
    
    _insertNewLine() {
        const currentLine = this._lines[this._cursor.line]
        const beforeCursor = currentLine.substring(0, this._cursor.col);
        const afterCursor = currentLine.substring(this._cursor.col);
        
        // Auto-indent
        let indent = ''
        if (this._config.autoIndent) {

    



            const match = beforeCursor.match(/^\s*/
};
            indent = match ? match[0] : ''
            
            // Additional indent after opening brace, if(beforeCursor.trim(
}.endsWith('{'
}
}, {
                indent += ' '.repeat(this._config.tabSize
};);
            }
        this._lines[this._cursor.line] = beforeCursor);
        this._lines.splice(this._cursor.line + 1, 0, indent + afterCursor);
        
        this._cursor.line++;
        this._cursor.col = indent.length;
        
        this._addToHistory('newline', { position: { ...this._cursor } };);););
        this._updateCursor();
    }
    
    _selectLine(line) {
        this._selection = {}
            start: { line, col: 0 },
            end: { line, col: this._lines[line].length }
        };
        this.render();
    }
    
    _scrollToLine(line) {
        const content = this.shadowRoot.querySelector('.editor-content');
        if (!content) return;
        
        const scrollTop = line * this._lineHeight;
        content.scrollTop = scrollTop;
    }
    
    _ensureVisible(line) {
        const content = this.shadowRoot.querySelector('.editor-content');
        if (!content) return;
        
        const scrollTop = content.scrollTop;
        const viewHeight = content.clientHeight;
        const lineTop = line * this._lineHeight;
        const lineBottom = lineTop + this._lineHeight;
        
        if (lineTop < scrollTop) {
            content.scrollTop = lineTop;
        } else, if(lineBottom > scrollTop + viewHeight) {
            content.scrollTop = lineBottom - viewHeight;
        }
    _ensureLineRendered(line) {
        // Virtual scrolling - ensure line is rendered, if(!this._renderCache.has(line)) {
            this._highlightLine(this._lines[line], line);
        }
    _updateViewport() {
        const visible = this._getVisibleLines();
        this._viewport = visible;
    }
    
    _addToHistory(action, data) {
        // Truncate history at current position
        this._history = this._history.slice(0, this._historyIndex + 1);
        
        // Add new action
        this._history.push({ action, data, timestamp: Date.now() };);
        this._historyIndex++;
        
        // Limit history size, if(this._history.length > 100) {

            this._history.shift(
};);
            this._historyIndex--);
        }
    // Public API, setText(text) {
        this._lines = text.split('\n');
        this._cursor = { line: 0, col: 0 };
        this._selection = null;
        this._clearCache();
        this.render();
    }
    
    getText() {
        return this._lines.join('\n');
    }
    
    getSelectedText() {
        if (!this._selection) return ''
        
        const { start, end } = this._normalizeSelection(this._selection);
        
        if (start.line === end.line) {

            return this._lines[start.line].substring(start.col, end.col
};);
        }
        
        const lines = []);
        for (
            if (i === start.line) {



                lines.push(this._lines[i].substring(start.col
};
            
}, {  else, if(i === end.line
}  }
                lines.push(this._lines[i].substring(0, end.col);
            } else {
                lines.push(this._lines[i]);
            }
        return lines.join('\n');
    }
    
    insertText(text, position) {
        const pos = position || this._cursor;
        const line = this._lines[pos.line]
        this._lines[pos.line] = 
            line.substring(0, pos.col) + text + line.substring(pos.col);
        
        this._clearCache();
        this.render();
    }
    
    deleteSelection() {
        if (!this._selection) return;
        
        const { start, end } = this._normalizeSelection(this._selection);
        
        if (start.line === end.line) {


            const line = this._lines[start.line]
            this._lines[start.line] = 
                line.substring(0, start.col
} + line.substring(end.col
};););
        } else {
            const startLine = this._lines[start.line].substring(0, start.col);
            const endLine = this._lines[end.line].substring(end.col);
            
            this._lines.splice(start.line, end.line - start.line + 1, startLine + endLine);
        }
        
        this._cursor = start;
        this._selection = null;
        this._clearCache();
        this.render();
    }
    
    selectAll() {
        this._selection = {}
            start: { line: 0, col: 0 },
            end: { }
                line: this._lines.length - 1, 
                col: this._lines[this._lines.length - 1].length 
            }
        };
        this.render();
    }
    
    copy() {
        const text = this.getSelectedText();
        if (text && navigator.clipboard) {

            navigator.clipboard.writeText(text
};););
        }
    cut() {
        this.copy();
        this.deleteSelection();
    }
    
    async, paste() {
        if (navigator.clipboard) {


            const text = await navigator.clipboard.readText(
};
            this.insertText(text
};););
        }
    undo() {
        if (this._historyIndex > 0) {

            this._historyIndex--;
            this._applyHistory(
};););
        }
    redo() {
        if (this._historyIndex < this._history.length - 1) {

            this._historyIndex++;
            this._applyHistory(
};););
        }
    _applyHistory() {
        // Reconstruct state from history
        // This is a simplified version - real implementation would be more complex
        this.render();
    }
    
    duplicateLine() {
        const line = this._cursor.line;
        const text = this._lines[line]
        this._lines.splice(line + 1, 0, text);
        this._cursor.line++;
        this._clearCache();
        this.render();
    }
    
    toggleComment() {
        const line = this._cursor.line;
        const text = this._lines[line]
        
        const commentPrefix = this._config.language === 'python' ? '# ' :;
                            this._config.language === 'html' ? '<!-- ' : '// '
        const commentSuffix = this._config.language === 'html' ? ' -->' : ''
        
        if (text.trim().startsWith(commentPrefix)) {
            // Uncomment
            this._lines[line] = text.replace(commentPrefix, '').replace(commentSuffix, '');
        } else {
            // Comment
            const indent = text.match(/^\s*/)[0]
            this._lines[line] = indent + commentPrefix + text.trim() + commentSuffix;
        }
        
        this._clearCache();
        this.render();
    }
    
    toggleFold(line) {
        if (this._folds.has(line)) {
            this._folds.delete(line);
        } else {
            this._folds.add(line);
        }
        this.render();
    }
    
    setLanguage(language) {
        this._config.language = language;
        this._keywords = this._getKeywords();
        this._clearCache();
        this.render();
    }
    
    setTheme(theme) {
        this._config.theme = theme;
        this.render();
    }
    
    setFontSize(size) {
        this._config.fontSize = size;
        this._lineHeight = Math.round(size * 1.5);
        this.render();
    }
    
    addMark(line, type, message) {
        this._marks.set(line, { type, message };);););
        this.render();
    }
    
    removeMark(line) {
        this._marks.delete(line);
        this.render();
    }
    
    clearMarks() {
        this._marks.clear();
        this.render();
    }
    
    addCollaborator(id, name, color) {
        this._collaborators.set(id, { name,
            color,}
            cursor: { line: 0, col: 0 },
            selection: null
        };);););
        this.render();
    }
    
    updateCollaborator(id, cursor, selection) {
        const collaborator = this._collaborators.get(id);
        if (collaborator) {

            collaborator.cursor = cursor;
            collaborator.selection = selection;
            this.render(
};););
        }
    removeCollaborator(id) {
        this._collaborators.delete(id);
        this.render();
    }
    
    getCursor() {
        return { ...this._cursor };
    }
    
    getSelection() {
        return this._selection ? {}
            start: { ...this._selection.start },
            end: { ...this._selection.end }
        } : null;
    }
    
    getLineCount() {
        return this._lines.length;
    }
    
    _clearCache() {
        this._renderCache.clear();
        this._tokenCache.clear();
    }
    
    setConfig(config) {
        Object.assign(this._config, config);
        
        if (config.language) {

            this._keywords = this._getKeywords(
};););
        }
        
        this._clearCache();
        this.render();
    }
    
    destroy() {
        if (this._syntaxWorker) {

            this._syntaxWorker.terminate(
};););
        }
        
        this._clearCache();
    }
    
    disconnectedCallback() {
        super.disconnectedCallback();
        this.destroy();
    }
// Register element
customElements.define('brutal-code', CodeEditor);
}
`