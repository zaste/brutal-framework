/**
 * Demo implementation using Native Framework v2
 */

import { Component, StateStore, createApp, html, css } from '../src/index.js';

// Counter Component
class DemoCounter extends Component {
  init() {
    this.setState({ count: 0 });
  }
  
  template() {
    return html`
      <div class="counter">
        <button id="dec">-</button>
        <span class="count">${this.state.count}</span>
        <button id="inc">+</button>
      </div>
    `;
  }
  
  styles() {
    return css`
      .counter {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;
        margin-top: 1rem;
      }
      
      button {
        background: #667eea;
        color: white;
        border: none;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        font-size: 1.2rem;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      button:hover {
        background: #5a67d8;
        transform: scale(1.1);
      }
      
      button:active {
        transform: scale(0.95);
      }
      
      .count {
        font-size: 2rem;
        font-weight: bold;
        min-width: 60px;
        text-align: center;
      }
    `;
  }
  
  afterRender() {
    this.$('#inc').onclick = () => {
      this.setState({ count: this.state.count + 1 });
    };
    
    this.$('#dec').onclick = () => {
      this.setState({ count: this.state.count - 1 });
    };
  }
}

// Todo List Component
class TodoList extends Component {
  init() {
    this.setState({
      todos: [],
      input: ''
    });
  }
  
  template() {
    return html`
      <div class="todo-list">
        <div class="todo-input">
          <input 
            type="text" 
            id="todo-input" 
            placeholder="Add a todo..."
            value="${this.state.input}"
          >
          <button id="add-todo">Add</button>
        </div>
        <ul class="todos">
          ${this.state.todos.map((todo, index) => html`
            <li class="todo-item ${todo.done ? 'done' : ''}">
              <input 
                type="checkbox" 
                ${todo.done ? 'checked' : ''}
                data-index="${index}"
                class="todo-checkbox"
              >
              <span>${todo.text}</span>
              <button class="delete-todo" data-index="${index}">×</button>
            </li>
          `).join('')}
        </ul>
        ${this.state.todos.length === 0 ? '<p class="empty">No todos yet!</p>' : ''}
      </div>
    `;
  }
  
  styles() {
    return css`
      .todo-list {
        margin-top: 1rem;
      }
      
      .todo-input {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }
      
      input[type="text"] {
        flex: 1;
        padding: 0.5rem;
        border: 2px solid #e9ecef;
        border-radius: 4px;
        font-size: 1rem;
        transition: border-color 0.2s;
      }
      
      input[type="text"]:focus {
        outline: none;
        border-color: #667eea;
      }
      
      button {
        background: #667eea;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        transition: background 0.2s;
      }
      
      button:hover {
        background: #5a67d8;
      }
      
      .todos {
        list-style: none;
        padding: 0;
      }
      
      .todo-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        background: #f8f9fa;
        border-radius: 4px;
        margin-bottom: 0.5rem;
        transition: opacity 0.2s;
      }
      
      .todo-item.done {
        opacity: 0.6;
      }
      
      .todo-item.done span {
        text-decoration: line-through;
      }
      
      .todo-checkbox {
        width: 20px;
        height: 20px;
        cursor: pointer;
      }
      
      .todo-item span {
        flex: 1;
      }
      
      .delete-todo {
        background: #dc3545;
        color: white;
        border: none;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .delete-todo:hover {
        background: #c82333;
      }
      
      .empty {
        text-align: center;
        color: #6c757d;
        margin-top: 2rem;
      }
    `;
  }
  
  afterRender() {
    const input = this.$('#todo-input');
    const addBtn = this.$('#add-todo');
    
    // Update input state
    input.oninput = (e) => {
      this.setState({ input: e.target.value });
    };
    
    // Add todo
    const addTodo = () => {
      const text = this.state.input.trim();
      if (text) {
        this.setState({
          todos: [...this.state.todos, { text, done: false }],
          input: ''
        });
      }
    };
    
    addBtn.onclick = addTodo;
    input.onkeypress = (e) => {
      if (e.key === 'Enter') {
        addTodo();
      }
    };
    
    // Toggle todo
    this.$$('.todo-checkbox').forEach(checkbox => {
      checkbox.onchange = (e) => {
        const index = parseInt(e.target.dataset.index);
        const todos = [...this.state.todos];
        todos[index].done = e.target.checked;
        this.setState({ todos });
      };
    });
    
    // Delete todo
    this.$$('.delete-todo').forEach(btn => {
      btn.onclick = (e) => {
        const index = parseInt(e.target.dataset.index);
        const todos = this.state.todos.filter((_, i) => i !== index);
        this.setState({ todos });
      };
    });
  }
}

// Timer Component
class DemoTimer extends Component {
  init() {
    this.setState({ 
      seconds: 0,
      running: false 
    });
    this.interval = null;
  }
  
  template() {
    const { seconds, running } = this.state;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    return html`
      <div class="timer">
        <div class="time">
          ${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}
        </div>
        <div class="controls">
          <button id="toggle">${running ? 'Pause' : 'Start'}</button>
          <button id="reset">Reset</button>
        </div>
      </div>
    `;
  }
  
  styles() {
    return css`
      .timer {
        text-align: center;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;
        margin-top: 1rem;
      }
      
      .time {
        font-size: 3rem;
        font-weight: bold;
        font-family: 'Courier New', monospace;
        margin-bottom: 1rem;
        color: #333;
      }
      
      .controls {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
      }
      
      button {
        background: #667eea;
        color: white;
        border: none;
        padding: 0.5rem 1.5rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        transition: background 0.2s;
      }
      
      button:hover {
        background: #5a67d8;
      }
      
      #reset {
        background: #6c757d;
      }
      
      #reset:hover {
        background: #5a6268;
      }
    `;
  }
  
  afterRender() {
    this.$('#toggle').onclick = () => {
      if (this.state.running) {
        this.pause();
      } else {
        this.start();
      }
    };
    
    this.$('#reset').onclick = () => {
      this.reset();
    };
  }
  
  start() {
    this.setState({ running: true });
    this.interval = setInterval(() => {
      this.setState({ seconds: this.state.seconds + 1 });
    }, 1000);
  }
  
  pause() {
    this.setState({ running: false });
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
  
  reset() {
    this.pause();
    this.setState({ seconds: 0 });
  }
  
  cleanup() {
    this.pause();
  }
}

// Create and setup app
const app = createApp({
  router: { outlet: '#demo-outlet' }
});

// Register components
app.component('DemoCounter', DemoCounter);
app.component('TodoList', TodoList);
app.component('DemoTimer', DemoTimer);

// Setup demo routing
app.routing({
  '/': () => '<h3>Router Home</h3><p>Click the navigation links above!</p>',
  '/about': () => '<h3>About</h3><p>Native Framework v2 with clean architecture</p>',
  '/components': () => '<h3>Components</h3><p>Reusable web components with Shadow DOM</p>',
  '/docs': () => '<h3>Documentation</h3><p>Coming soon...</p>'
});

// Mount app
app.mount('#app');

// Display metrics
function updateMetrics() {
  const metrics = {
    components: app.components.size,
    stores: app.stores.size,
    routes: app.router ? app.router.routes.size : 0,
    timestamp: new Date().toLocaleTimeString()
  };
  
  document.getElementById('metrics').innerHTML = `
    <strong>Framework Metrics:</strong><br>
    Components: ${metrics.components} | 
    Stores: ${metrics.stores} | 
    Routes: ${metrics.routes} | 
    Updated: ${metrics.timestamp}
  `;
}

// Update metrics every second
setInterval(updateMetrics, 1000);
updateMetrics();

// Performance test
console.time('Create 1000 elements');
const elements = [];
for (let i = 0; i < 1000; i++) {
  elements.push(document.createElement('div'));
}
console.timeEnd('Create 1000 elements');

console.log('✅ Native Framework v2 Demo loaded successfully!');