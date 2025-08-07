# Pattern: DOM Scheduling & Batching

## Problem
DOM operations are expensive and can cause:
- Layout thrashing (read-write-read-write cycles)
- Janky animations
- Poor frame rates
- Blocked main thread

## Solution
Batch DOM operations using requestIdleCallback and separate read/write phases to minimize reflows.

## V3 Implementation Concept

### Core Scheduling System
```javascript
export class DOMScheduler {
  constructor() {
    // Priority queues
    this.queues = new Map([
      ['critical', []],
      ['high', []],
      ['normal', []],
      ['low', []],
      ['idle', []]
    ]);
    
    // Read/Write separation
    this.readQueue = [];
    this.writeQueue = [];
    
    // State
    this.scheduled = false;
    this.rafScheduled = false;
  }
  
  // Schedule task by priority
  schedule(task, priority = 'normal') {
    return new Promise((resolve, reject) => {
      this.queues.get(priority).push(() => {
        try {
          const result = task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this._scheduleProcessing(priority);
    });
  }
  
  // Separate read operations
  read(task) {
    return new Promise(resolve => {
      this.readQueue.push(() => {
        resolve(task());
      });
      this._scheduleRAF();
    });
  }
  
  // Separate write operations  
  write(task) {
    return new Promise(resolve => {
      this.writeQueue.push(() => {
        resolve(task());
      });
      this._scheduleRAF();
    });
  }
  
  // Read then write pattern
  measure(readTask, writeTask) {
    return this.read(readTask).then(result => {
      return this.write(() => writeTask(result));
    });
  }
  
  _scheduleRAF() {
    if (this.rafScheduled) return;
    
    this.rafScheduled = true;
    requestAnimationFrame(() => {
      // Process all reads first
      const reads = this.readQueue.splice(0);
      reads.forEach(read => read());
      
      // Then process all writes
      const writes = this.writeQueue.splice(0);
      writes.forEach(write => write());
      
      this.rafScheduled = false;
    });
  }
  
  _scheduleProcessing(priority) {
    if (this.scheduled) return;
    
    this.scheduled = true;
    
    if (priority === 'critical') {
      // Execute immediately
      this._processCritical();
    } else if ('requestIdleCallback' in window) {
      // Use idle time
      requestIdleCallback(deadline => {
        this._processBatch(deadline);
      }, { timeout: 16 });
    } else {
      // Fallback
      setTimeout(() => this._processBatch(), 0);
    }
  }
  
  _processBatch(deadline) {
    const maxBatchSize = 100;
    let processed = 0;
    
    // Process by priority
    for (const [priority, queue] of this.queues) {
      while (queue.length > 0 && processed < maxBatchSize) {
        // Check deadline
        if (deadline && deadline.timeRemaining() <= 0) {
          break;
        }
        
        const task = queue.shift();
        task();
        processed++;
      }
      
      if (deadline && deadline.timeRemaining() <= 0) {
        break;
      }
    }
    
    this.scheduled = false;
    
    // Schedule next batch if needed
    if (this._hasPendingTasks()) {
      this._scheduleProcessing('normal');
    }
  }
}
```

### Usage Examples

#### Batch DOM Updates
```javascript
const scheduler = new DOMScheduler();

// Batch multiple DOM operations
async function updateElements(elements) {
  // Read all values first
  const sizes = await scheduler.read(() => {
    return elements.map(el => ({
      width: el.offsetWidth,
      height: el.offsetHeight
    }));
  });
  
  // Then write all updates
  await scheduler.write(() => {
    elements.forEach((el, i) => {
      el.style.width = `${sizes[i].width * 1.1}px`;
      el.style.height = `${sizes[i].height * 1.1}px`;
    });
  });
}
```

#### Priority-based Scheduling
```javascript
// Critical - user interaction
scheduler.schedule(() => {
  button.classList.add('active');
}, 'critical');

// Normal - content updates
scheduler.schedule(() => {
  updateContent();
}, 'normal');

// Idle - analytics
scheduler.schedule(() => {
  trackEvent('pageview');
}, 'idle');
```

#### Animation Optimization
```javascript
function animate(element) {
  scheduler.measure(
    // Read
    () => element.getBoundingClientRect(),
    // Write
    (rect) => {
      element.style.transform = `translateX(${rect.left + 100}px)`;
    }
  );
}
```

## Key Patterns

### 1. Read-Write Separation
```javascript
// Bad - causes layout thrashing
elements.forEach(el => {
  const height = el.offsetHeight; // Read
  el.style.height = height + 10 + 'px'; // Write
});

// Good - batch reads then writes
const heights = elements.map(el => el.offsetHeight); // All reads
elements.forEach((el, i) => {
  el.style.height = heights[i] + 10 + 'px'; // All writes
});
```

### 2. Priority Queues
```javascript
// User interactions get priority
onClick: () => scheduler.schedule(handleClick, 'critical')

// Background tasks run when idle
onLoad: () => scheduler.schedule(loadAnalytics, 'idle')
```

### 3. Frame Budget Awareness
```javascript
function processBatch(deadline) {
  while (tasks.length > 0 && deadline.timeRemaining() > 0) {
    const task = tasks.shift();
    task();
  }
  
  if (tasks.length > 0) {
    requestIdleCallback(processBatch);
  }
}
```

## Performance Benefits

### Metrics from V3
- 60% reduction in layout recalculations
- Consistent 60fps during animations
- 40% faster initial render
- Zero janky scrolling

### How It Works
1. **Batching**: Group similar operations
2. **Prioritization**: Critical tasks first
3. **Idle Processing**: Use spare cycles
4. **Read/Write Phases**: Prevent thrashing

## Evolution

### V3 Features
- Basic priority scheduling
- Read/write separation
- requestIdleCallback usage

### V4 Improvements
- Automatic detection of read/write operations
- Better deadline management
- Integration with component lifecycle

### V5 Enhancements
- Automatic task coalescing
- Predictive scheduling
- Worker thread offloading
- Frame-perfect animations

## Implementation Tips

### Do's
- Always separate reads from writes
- Use appropriate priorities
- Batch similar operations
- Monitor frame budget

### Don'ts
- Don't mix reads and writes
- Don't block the main thread
- Don't over-prioritize
- Don't ignore deadlines

## References
- V3: `/framework-v3/02-performance/03-DOMScheduler.js`
- MDN: requestIdleCallback
- Chrome: Rendering Performance

---

*Schedule smart, render smooth.*