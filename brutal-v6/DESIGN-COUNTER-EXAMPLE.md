# 🔢 Counter Example Design

## Goal
Demonstrate BRUTAL's power in < 10 lines of actual logic code.

## Requirements (from North Star)
- Must work with @brutal/core alone
- Must be < 10 lines of logic
- Must show reactive state
- Must handle events
- Must be obviously simple

## Design

### HTML Structure
```html
<!DOCTYPE html>
<html>
<head>
    <title>BRUTAL Counter - 8 Lines</title>
    <style>
        button {
            font-size: 24px;
            padding: 20px 40px;
            border: 3px solid black;
            background: white;
            cursor: pointer;
            font-weight: bold;
            transition: transform 0.1s;
        }
        button:active {
            transform: scale(0.95);
        }
        .brutal-info {
            margin-top: 20px;
            font-family: monospace;
            color: #666;
        }
    </style>
</head>
<body>
    <h1>BRUTAL Counter Example</h1>
    <div id="app"></div>
    <div class="brutal-info">
        <p>Framework size: @brutal/core (2KB)</p>
        <p>Logic lines: 8</p>
        <p>No virtual DOM, no build step, just the web.</p>
    </div>
    
    <script type="module">
        import { compose, withState, withEvents } from './node_modules/@brutal/core/dist/index.js';
        
        // THE ENTIRE COUNTER APP (8 lines)
        const counter = compose(
            withEvents({ click: (e) => e.target.state.count++ }),
            withState({ count: 0 })
        )(document.createElement('button'));
        
        counter.update = () => counter.textContent = `Count: ${counter.state.count}`;
        counter.update();
        document.getElementById('app').appendChild(counter);
    </script>
</body>
</html>
```

### Line-by-Line Breakdown

```javascript
// Line 1-2: Import (not counted as logic)
import { compose, withState, withEvents } from '@brutal/core';

// Line 1-4: Create enhanced button with behaviors
const counter = compose(
    withEvents({ click: (e) => e.target.state.count++ }),
    withState({ count: 0 })
)(document.createElement('button'));

// Line 5-6: Define update function
counter.update = () => counter.textContent = `Count: ${counter.state.count}`;

// Line 7: Initial render
counter.update();

// Line 8: Add to DOM
document.getElementById('app').appendChild(counter);
```

### Alternative: Ultra-Minified Version (6 lines)
```javascript
import { c, s, e } from '@brutal/core';

const counter = c(
    e({ click: e => e.target.state.count++ }),
    s({ count: 0 })
)(document.createElement('button'));
counter.update = () => counter.textContent = `Count: ${counter.state.count}`;
counter.update() || document.getElementById('app').appendChild(counter);
```

### Alternative: With More Features (10 lines)
```javascript
import { compose, withState, withEvents, withLifecycle } from '@brutal/core';

const counter = compose(
    withLifecycle({ onMount: () => console.log('Counter mounted!') }),
    withEvents({ 
        click: (e) => e.target.state.count++,
        contextmenu: (e) => { e.preventDefault(); e.target.state.count = 0; }
    }),
    withState({ count: 0 })
)(document.createElement('button'));

counter.update = () => counter.textContent = `Count: ${counter.state.count} (right-click to reset)`;
counter.update();
document.getElementById('app').appendChild(counter);
```

## Comparison

### React Version (30+ lines)
```javascript
import React, { useState } from 'react';
import ReactDOM from 'react-dom';

function Counter() {
    const [count, setCount] = useState(0);
    
    return (
        <button onClick={() => setCount(count + 1)}>
            Count: {count}
        </button>
    );
}

ReactDOM.render(<Counter />, document.getElementById('app'));

// Plus: package.json, webpack.config.js, babel config, build step...
// Total: 150KB+ bundle
```

### Vanilla JS (15+ lines)
```javascript
const button = document.createElement('button');
let count = 0;

function updateButton() {
    button.textContent = `Count: ${count}`;
}

button.addEventListener('click', () => {
    count++;
    updateButton();
});

updateButton();
document.getElementById('app').appendChild(button);

// No reactivity, manual updates, imperative
```

## Key Advantages Demonstrated

1. **Reactive**: State changes auto-trigger updates
2. **Composable**: Behaviors can be mixed and matched
3. **No Build**: Works directly in browser
4. **Tiny**: 2KB vs 150KB+ for React
5. **Simple**: 8 lines vs 30+ for React
6. **Fast**: Direct DOM, no virtual DOM overhead

## Success Metrics

✅ Less than 10 lines of logic (8 lines)
✅ Obviously simpler than alternatives
✅ Shows the composition pattern
✅ Demonstrates reactivity
✅ No build step needed
✅ Would make developers say "Is that it?"

## Next: Implementation Phase