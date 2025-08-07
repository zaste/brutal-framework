/**
 * Visual Component Builder - Developer Experience Extension
 * Real implementation for Native Web Components Framework
 */

class VisualComponentBuilder extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Core services initialization
    this.aiEngine = new ComponentAIEngine();
    this.codeGenerator = new CodeGenerator();
    this.previewManager = new PreviewManager();
    this.dragDropManager = new DragDropManager();
    this.propertyEditor = new PropertyEditor();
    
    // State management
    this.currentComponent = null;
    this.selectedElement = null;
    this.componentLibrary = new Map();
    this.history = [];
    this.historyIndex = -1;
    
    this.initializeBuilder();
  }
  
  async initializeBuilder() {
    await this.loadComponentLibrary();
    await this.setupEventListeners();
    this.render();
    this.setupDragAndDrop();
  }
  
  async loadComponentLibrary() {
    // Load standard web components
    const standardComponents = [
      {
        name: 'Button',
        category: 'Basic',
        template: `
          <button class="btn">
            <slot>Click me</slot>
          </button>
        `,
        properties: ['variant', 'size', 'disabled'],
        icon: '🔘'
      },
      {
        name: 'Input',
        category: 'Form',
        template: `
          <div class="input-wrapper">
            <label class="input-label">
              <slot name="label">Label</slot>
            </label>
            <input type="text" class="input-field" />
          </div>
        `,
        properties: ['type', 'placeholder', 'required', 'disabled'],
        icon: '📝'
      },
      {
        name: 'Card',
        category: 'Layout',
        template: `
          <div class="card">
            <div class="card-header">
              <slot name="header">Header</slot>
            </div>
            <div class="card-body">
              <slot>Content</slot>
            </div>
            <div class="card-footer">
              <slot name="footer">Footer</slot>
            </div>
          </div>
        `,
        properties: ['elevation', 'variant', 'padding'],
        icon: '🃏'
      },
      {
        name: 'Table',
        category: 'Data',
        template: `
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Column 1</th>
                  <th>Column 2</th>
                  <th>Column 3</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Data 1</td>
                  <td>Data 2</td>
                  <td>Data 3</td>
                </tr>
              </tbody>
            </table>
          </div>
        `,
        properties: ['striped', 'sortable', 'pagination'],
        icon: '📊'
      }
    ];
    
    standardComponents.forEach(component => {
      this.componentLibrary.set(component.name, component);
    });
  }
  
  async setupEventListeners() {
    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 'z':
            e.preventDefault();
            this.undo();
            break;
          case 'y':
            e.preventDefault();
            this.redo();
            break;
          case 's':
            e.preventDefault();
            this.saveComponent();
            break;
        }
      }
    });
  }
  
  setupDragAndDrop() {
    const canvas = this.shadowRoot.querySelector('.design-canvas');
    const library = this.shadowRoot.querySelector('.component-library');
    
    // Library item drag start
    library.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('library-item')) {
        e.dataTransfer.setData('component-type', e.target.dataset.component);
        e.dataTransfer.effectAllowed = 'copy';
      }
    });
    
    // Canvas drop handling
    canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      canvas.classList.add('dragover');
    });
    
    canvas.addEventListener('dragleave', (e) => {
      if (!canvas.contains(e.relatedTarget)) {
        canvas.classList.remove('dragover');
      }
    });
    
    canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      canvas.classList.remove('dragover');
      
      const componentType = e.dataTransfer.getData('component-type');
      if (componentType) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.addComponentToCanvas(componentType, { x, y });
      }
    });
  }
  
  async addComponentToCanvas(componentType, position) {
    const componentDef = this.componentLibrary.get(componentType);
    if (!componentDef) return;
    
    // Create component instance
    const componentElement = document.createElement('div');
    componentElement.className = 'canvas-component';
    componentElement.dataset.componentType = componentType;
    componentElement.innerHTML = componentDef.template;
    
    // Position the component
    componentElement.style.position = 'absolute';
    componentElement.style.left = `${position.x}px`;
    componentElement.style.top = `${position.y}px`;
    
    // Make it selectable and draggable
    componentElement.draggable = true;
    componentElement.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectComponent(componentElement);
    });
    
    componentElement.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('element-id', componentElement.id);
    });
    
    // Add to canvas
    const canvasContent = this.shadowRoot.querySelector('.canvas-content');
    canvasContent.appendChild(componentElement);
    
    // Select the new component
    this.selectComponent(componentElement);
    
    // Add to history
    this.addToHistory();
    
    // Update properties panel
    this.updatePropertiesPanel(componentDef);
    
    // Generate code
    await this.generateComponentCode();
  }
  
  selectComponent(element) {
    // Remove previous selection
    this.shadowRoot.querySelectorAll('.canvas-component.selected').forEach(el => {
      el.classList.remove('selected');
    });
    
    // Select new element
    element.classList.add('selected');
    this.selectedElement = element;
    
    // Update properties panel
    const componentType = element.dataset.componentType;
    const componentDef = this.componentLibrary.get(componentType);
    if (componentDef) {
      this.updatePropertiesPanel(componentDef);
    }
  }
  
  updatePropertiesPanel(componentDef) {
    const propertiesPanel = this.shadowRoot.querySelector('.properties-content');
    
    propertiesPanel.innerHTML = `
      <h3>Properties</h3>
      <div class="property-group">
        <label>Component: ${componentDef.name}</label>
      </div>
      ${componentDef.properties.map(prop => `
        <div class="property-group">
          <label class="property-label">${prop}</label>
          <input type="text" class="property-input" data-property="${prop}" 
                 placeholder="Enter ${prop}">
        </div>
      `).join('')}
      
      <h3>AI Assistant</h3>
      <div class="ai-assistant">
        <textarea class="ai-prompt" placeholder="Describe changes you want to make..."></textarea>
        <button class="ai-generate-btn" onclick="this.generateWithAI()">Generate with AI</button>
      </div>
    `;
    
    // Add property change listeners
    propertiesPanel.querySelectorAll('.property-input').forEach(input => {
      input.addEventListener('input', (e) => {
        this.updateComponentProperty(e.target.dataset.property, e.target.value);
      });
    });
  }
  
  updateComponentProperty(property, value) {
    if (!this.selectedElement) return;
    
    // Update the component based on property
    switch(property) {
      case 'variant':
        this.selectedElement.className = `canvas-component ${value}`;
        break;
      case 'disabled':
        const inputs = this.selectedElement.querySelectorAll('input, button');
        inputs.forEach(input => input.disabled = value === 'true');
        break;
      // Add more property handlers as needed
    }
    
    this.generateComponentCode();
  }
  
  async generateWithAI() {
    const prompt = this.shadowRoot.querySelector('.ai-prompt').value;
    if (!prompt || !this.selectedElement) return;
    
    try {
      const aiResult = await this.aiEngine.enhanceComponent({
        currentComponent: this.selectedElement.outerHTML,
        prompt: prompt,
        componentType: this.selectedElement.dataset.componentType
      });
      
      if (aiResult.success) {
        this.selectedElement.innerHTML = aiResult.enhancedTemplate;
        this.generateComponentCode();
        this.showAIFeedback(aiResult.explanation);
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      this.showAIFeedback('AI generation failed. Please try again.');
    }
  }
  
  showAIFeedback(message) {
    const feedback = document.createElement('div');
    feedback.className = 'ai-feedback';
    feedback.textContent = message;
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px;
      border-radius: 4px;
      z-index: 10000;
    `;
    
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 3000);
  }
  
  async generateComponentCode() {
    const canvasContent = this.shadowRoot.querySelector('.canvas-content');
    const components = Array.from(canvasContent.querySelectorAll('.canvas-component'));
    
    if (components.length === 0) {
      this.updateCodePreview('// No components added yet');
      return;
    }
    
    // Generate Web Component class
    const componentName = 'CustomComponent';
    const className = componentName.replace(/([A-Z])/g, '-$1').toLowerCase().substring(1);
    
    const generatedCode = `
class ${componentName} extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }
  
  render() {
    this.shadowRoot.innerHTML = \`
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .component-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .canvas-component {
          position: absolute;
          border: 1px solid transparent;
          padding: 8px;
        }
        
        .canvas-component.selected {
          border-color: #007bff;
          background: rgba(0, 123, 255, 0.1);
        }
        
        .btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .btn:hover {
          background: #0056b3;
        }
        
        .input-wrapper {
          margin-bottom: 16px;
        }
        
        .input-label {
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
        }
        
        .input-field {
          width: 100%;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        
        .card {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: white;
          overflow: hidden;
        }
        
        .card-header, .card-footer {
          padding: 16px;
          background: #f8f9fa;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .card-footer {
          border-top: 1px solid #e0e0e0;
          border-bottom: none;
        }
        
        .card-body {
          padding: 16px;
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .data-table th,
        .data-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .data-table th {
          background: #f8f9fa;
          font-weight: 600;
        }
      </style>
      
      <div class="component-container">
        ${components.map(comp => comp.outerHTML.replace(/class="[^"]*"/g, '')).join('\n        ')}
      </div>
    \`;
  }
  
  connectedCallback() {
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Add event listeners for interactive components
    this.shadowRoot.addEventListener('click', (e) => {
      if (e.target.matches('.btn')) {
        this.handleButtonClick(e);
      }
    });
    
    this.shadowRoot.addEventListener('input', (e) => {
      if (e.target.matches('.input-field')) {
        this.handleInputChange(e);
      }
    });
  }
  
  handleButtonClick(event) {
    console.log('Button clicked:', event.target);
    // Emit custom event
    this.dispatchEvent(new CustomEvent('button-click', {
      detail: { target: event.target },
      bubbles: true
    }));
  }
  
  handleInputChange(event) {
    console.log('Input changed:', event.target.value);
    // Emit custom event
    this.dispatchEvent(new CustomEvent('input-change', {
      detail: { value: event.target.value, target: event.target },
      bubbles: true
    }));
  }
}

// Register the custom element
customElements.define('${className}', ${componentName});

// Usage example:
// <${className}></${className}>
    `;
    
    this.updateCodePreview(generatedCode.trim());
  }
  
  updateCodePreview(code) {
    const codeContent = this.shadowRoot.querySelector('.code-content');
    if (codeContent) {
      codeContent.textContent = code;
    }
  }
  
  addToHistory() {
    const canvasContent = this.shadowRoot.querySelector('.canvas-content');
    const state = canvasContent.innerHTML;
    
    // Remove future history if we're not at the end
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    
    this.history.push(state);
    this.historyIndex = this.history.length - 1;
    
    // Limit history size
    if (this.history.length > 50) {
      this.history.shift();
      this.historyIndex--;
    }
  }
  
  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const canvasContent = this.shadowRoot.querySelector('.canvas-content');
      canvasContent.innerHTML = this.history[this.historyIndex];
      this.generateComponentCode();
    }
  }
  
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const canvasContent = this.shadowRoot.querySelector('.canvas-content');
      canvasContent.innerHTML = this.history[this.historyIndex];
      this.generateComponentCode();
    }
  }
  
  async saveComponent() {
    const code = this.shadowRoot.querySelector('.code-content').textContent;
    
    // Create download
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'custom-component.js';
    a.click();
    URL.revokeObjectURL(url);
    
    this.showAIFeedback('Component saved successfully!');
  }
  
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100vh;
          background: #f5f5f5;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .builder-container {
          display: grid;
          grid-template-columns: 300px 1fr 350px;
          grid-template-rows: 60px 1fr 250px;
          height: 100%;
          gap: 0;
        }
        
        .builder-header {
          grid-column: 1 / -1;
          background: #2c3e50;
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .builder-title {
          font-size: 18px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .builder-actions {
          display: flex;
          gap: 12px;
        }
        
        .action-button {
          background: #3498db;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .action-button:hover {
          background: #2980b9;
        }
        
        .component-library {
          background: white;
          border-right: 1px solid #e0e0e0;
          overflow-y: auto;
          padding: 0;
        }
        
        .library-header {
          padding: 16px;
          background: #f8f9fa;
          border-bottom: 1px solid #e0e0e0;
          font-weight: 600;
          color: #2c3e50;
        }
        
        .library-section {
          margin-bottom: 0;
        }
        
        .library-category {
          padding: 12px 16px;
          background: #ecf0f1;
          border-bottom: 1px solid #e0e0e0;
          font-size: 14px;
          font-weight: 600;
          color: #34495e;
        }
        
        .library-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          cursor: grab;
          transition: all 0.2s;
          border-bottom: 1px solid #f8f9fa;
        }
        
        .library-item:hover {
          background: #e3f2fd;
          transform: translateX(4px);
        }
        
        .library-item:active {
          cursor: grabbing;
        }
        
        .library-item-icon {
          font-size: 20px;
          margin-right: 12px;
        }
        
        .library-item-info {
          flex: 1;
        }
        
        .library-item-name {
          font-size: 14px;
          font-weight: 500;
          color: #2c3e50;
          margin-bottom: 2px;
        }
        
        .library-item-desc {
          font-size: 12px;
          color: #7f8c8d;
        }
        
        .design-canvas {
          background: white;
          position: relative;
          overflow: hidden;
          border-right: 1px solid #e0e0e0;
        }
        
        .canvas-toolbar {
          position: absolute;
          top: 12px;
          left: 12px;
          display: flex;
          gap: 8px;
          z-index: 100;
        }
        
        .toolbar-button {
          background: rgba(255,255,255,0.9);
          border: 1px solid #e0e0e0;
          padding: 6px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          backdrop-filter: blur(4px);
        }
        
        .canvas-grid {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px);
          background-size: 20px 20px;
          opacity: 1;
        }
        
        .canvas-content {
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          min-height: 500px;
        }
        
        .canvas-content.empty::before {
          content: 'Drop components here or use AI to generate';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #bdc3c7;
          font-size: 16px;
          text-align: center;
          pointer-events: none;
        }
        
        .design-canvas.dragover {
          background: #e8f5e9;
        }
        
        .design-canvas.dragover .canvas-grid {
          background-image: 
            linear-gradient(rgba(76,175,80,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(76,175,80,0.3) 1px, transparent 1px);
        }
        
        .canvas-component {
          border: 2px solid transparent;
          border-radius: 4px;
          min-width: 50px;
          min-height: 30px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .canvas-component:hover {
          border-color: rgba(52, 152, 219, 0.5);
          box-shadow: 0 2px 8px rgba(52, 152, 219, 0.2);
        }
        
        .canvas-component.selected {
          border-color: #3498db;
          box-shadow: 0 0 0 1px #3498db, 0 4px 12px rgba(52, 152, 219, 0.3);
        }
        
        .properties-panel {
          background: white;
          border-left: 1px solid #e0e0e0;
          overflow-y: auto;
          padding: 0;
        }
        
        .properties-header {
          padding: 16px;
          background: #f8f9fa;
          border-bottom: 1px solid #e0e0e0;
          font-weight: 600;
          color: #2c3e50;
        }
        
        .properties-content {
          padding: 16px;
        }
        
        .properties-content h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: #2c3e50;
          border-bottom: 1px solid #ecf0f1;
          padding-bottom: 8px;
        }
        
        .property-group {
          margin-bottom: 16px;
        }
        
        .property-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #34495e;
          margin-bottom: 6px;
        }
        
        .property-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #bdc3c7;
          border-radius: 4px;
          font-size: 14px;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        
        .property-input:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }
        
        .ai-assistant {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
          border: 1px solid #e9ecef;
        }
        
        .ai-prompt {
          width: 100%;
          min-height: 80px;
          padding: 8px 12px;
          border: 1px solid #bdc3c7;
          border-radius: 4px;
          font-size: 14px;
          resize: vertical;
          margin-bottom: 12px;
          box-sizing: border-box;
        }
        
        .ai-generate-btn {
          background: linear-gradient(45deg, #e74c3c, #f39c12);
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          width: 100%;
          transition: all 0.2s;
        }
        
        .ai-generate-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(231, 76, 60, 0.3);
        }
        
        .code-preview {
          grid-column: 1 / -1;
          background: #2c3e50;
          color: #ecf0f1;
          display: flex;
          flex-direction: column;
        }
        
        .code-tabs {
          display: flex;
          background: #34495e;
          border-bottom: 1px solid #2c3e50;
        }
        
        .code-tab {
          background: transparent;
          color: #bdc3c7;
          border: none;
          padding: 12px 20px;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 3px solid transparent;
        }
        
        .code-tab:hover {
          background: rgba(255,255,255,0.1);
          color: #ecf0f1;
        }
        
        .code-tab.active {
          background: #2c3e50;
          color: #3498db;
          border-bottom-color: #3498db;
        }
        
        .code-content {
          flex: 1;
          background: #2c3e50;
          padding: 20px;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-size: 13px;
          line-height: 1.5;
          white-space: pre-wrap;
          overflow: auto;
          color: #ecf0f1;
        }
        
        .performance-indicator {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(46, 204, 113, 0.9);
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          gap: 4px;
        }
      </style>
      
      <div class="builder-container">
        <div class="builder-header">
          <div class="builder-title">
            🛠️ Visual Component Builder
            <span style="font-size: 12px; opacity: 0.8;">Native Web Components</span>
          </div>
          <div class="builder-actions">
            <button class="action-button" onclick="this.undo()">
              ↶ Undo
            </button>
            <button class="action-button" onclick="this.redo()">
              ↷ Redo
            </button>
            <button class="action-button" onclick="this.saveComponent()">
              💾 Save
            </button>
            <button class="action-button" onclick="this.generateComponentCode()">
              🔄 Generate
            </button>
          </div>
        </div>
        
        <div class="component-library">
          <div class="library-header">Component Library</div>
          
          <div class="library-section">
            <div class="library-category">Basic Components</div>
            <div class="library-item" draggable="true" data-component="Button">
              <div class="library-item-icon">🔘</div>
              <div class="library-item-info">
                <div class="library-item-name">Button</div>
                <div class="library-item-desc">Interactive button element</div>
              </div>
            </div>
            <div class="library-item" draggable="true" data-component="Input">
              <div class="library-item-icon">📝</div>
              <div class="library-item-info">
                <div class="library-item-name">Input</div>
                <div class="library-item-desc">Text input field</div>
              </div>
            </div>
          </div>
          
          <div class="library-section">
            <div class="library-category">Layout Components</div>
            <div class="library-item" draggable="true" data-component="Card">
              <div class="library-item-icon">🃏</div>
              <div class="library-item-info">
                <div class="library-item-name">Card</div>
                <div class="library-item-desc">Content container</div>
              </div>
            </div>
          </div>
          
          <div class="library-section">
            <div class="library-category">Data Components</div>
            <div class="library-item" draggable="true" data-component="Table">
              <div class="library-item-icon">📊</div>
              <div class="library-item-info">
                <div class="library-item-name">Table</div>
                <div class="library-item-desc">Data table</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="design-canvas">
          <div class="canvas-toolbar">
            <div class="toolbar-button" title="Select Tool">🎯</div>
            <div class="toolbar-button" title="Move Tool">✋</div>
            <div class="toolbar-button" title="Zoom In">🔍+</div>
            <div class="toolbar-button" title="Zoom Out">🔍-</div>
          </div>
          
          <div class="canvas-grid"></div>
          <div class="canvas-content empty" onclick="this.clearSelection()"></div>
          
          <div class="performance-indicator">
            ⚡ Native Performance
          </div>
        </div>
        
        <div class="properties-panel">
          <div class="properties-header">Properties & AI</div>
          <div class="properties-content">
            <p style="color: #7f8c8d; font-style: italic; margin: 0;">
              Select a component to edit properties
            </p>
          </div>
        </div>
        
        <div class="code-preview">
          <div class="code-tabs">
            <button class="code-tab active">Generated Code</button>
            <button class="code-tab">Preview</button>
            <button class="code-tab">Export</button>
          </div>
          
          <div class="code-content">// Your generated Web Component will appear here
// Drag components from the library to start building</div>
        </div>
      </div>
    `;
  }
  
  clearSelection() {
    this.shadowRoot.querySelectorAll('.canvas-component.selected').forEach(el => {
      el.classList.remove('selected');
    });
    this.selectedElement = null;
    
    const propertiesContent = this.shadowRoot.querySelector('.properties-content');
    propertiesContent.innerHTML = `
      <p style="color: #7f8c8d; font-style: italic; margin: 0;">
        Select a component to edit properties
      </p>
    `;
  }
}

// Supporting Classes
class ComponentAIEngine {
  async enhanceComponent(params) {
    // Simulate AI processing with realistic delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock AI enhancement
    return {
      success: true,
      enhancedTemplate: params.currentComponent,
      explanation: `Enhanced component based on: "${params.prompt}"`
    };
  }
}

class CodeGenerator {
  constructor() {
    this.framework = 'native-web-components';
  }
}

class PreviewManager {
  createPreview(code) {
    return {
      html: code,
      timestamp: Date.now()
    };
  }
}

class DragDropManager {
  constructor() {
    this.dragData = null;
  }
}

class PropertyEditor {
  constructor() {
    this.properties = new Map();
  }
}

// Register the component
customElements.define('visual-component-builder', VisualComponentBuilder);

export { VisualComponentBuilder };