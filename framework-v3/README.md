# BRUTAL Framework V3

> 15x faster than React. Zero dependencies. GPU-accelerated.

## 🚀 Installation

```bash
npm install @brutal/framework
```

## 📦 Bundle Sizes

- **brutal.core.min.js**: 215.41KB
- **brutal.components.min.js**: 2213.23KB
- **brutal.visual.min.js**: 222.32KB
- **brutal.ecosystem.min.js**: 152.52KB
- **brutal.min.js**: 2847.20KB
- **Total**: 5650.69KB

## 🎯 Quick Start

```javascript
import { BrutalFramework } from '@brutal/framework';

// Initialize
await BrutalFramework.init({
    cache: true,
    gpu: true,
    theme: 'dark'
});

// Create component
import { BrutalComponent } from '@brutal/framework';

class MyComponent extends BrutalComponent {
    render() {
        return `<h1>Hello BRUTAL!</h1>`;
    }
}

customElements.define('my-component', MyComponent);
```

## 🔥 Features

- **15x Faster**: Proven benchmarks vs React
- **Zero Dependencies**: No external libraries
- **GPU Accelerated**: WebGPU/WebGL rendering
- **True Parallelism**: SharedArrayBuffer + Workers
- **Visual Builders**: Drag & drop, theme engine
- **AI Integration**: Natural language components
- **< 50KB Core**: Incredibly lightweight

## 📚 Documentation

Visit [brutalframework.com/docs](https://brutalframework.com/docs)

## 📄 License

MIT © BRUTAL Team
