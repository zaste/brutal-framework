# Contributing to BRUTAL Framework

Thank you for your interest in contributing to BRUTAL Framework! We're building the future of web development, and we'd love your help.

## 🎯 Our Philosophy

- **Performance First**: Every line of code must be optimized
- **Zero Dependencies**: We build everything from scratch
- **Innovation**: Push the boundaries of what's possible
- **Simplicity**: Complex implementation, simple API

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- Modern browser (Chrome 90+)
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/brutal/framework.git
cd framework

# Install dev dependencies (only for building)
npm install

# Start development server
npm run dev
```

## 💻 Development

### Project Structure

```
framework-v3/
├── 01-core/           # Core framework systems
├── 02-performance/    # Performance optimizations
├── 03-visual/         # GPU and visual systems
├── 04-components/     # Component library
├── 05-debug/          # Debug tools
├── 06-cache/          # Caching system
├── 07-ai/             # AI features
├── 08-builders/       # Visual builders
├── tests/             # Test suites
└── dist/              # Production builds
```

### Code Style

- ES6+ syntax
- No external dependencies
- Optimize for V8
- Document complex algorithms
- Keep bundle size minimal

### Performance Guidelines

1. **Avoid These Patterns**:
   - `delete` operator
   - `with` statements
   - Arguments array access
   - Polymorphic functions
   - Frequent object shape changes

2. **Prefer These Patterns**:
   - Hidden class stability
   - Monomorphic functions
   - Object pooling
   - RAF batching
   - Inline caching

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test
npm test -- --filter="Button"

# Performance benchmarks
npm run benchmark
```

### Writing Tests

```javascript
// test/MyComponent.test.js
import { test } from '../test-framework.js';
import { MyComponent } from '../components/MyComponent.js';

test('MyComponent renders correctly', async (t) => {
    const component = new MyComponent();
    t.assert(component.render().includes('expected-content'));
});
```

## 📝 Pull Request Process

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### PR Requirements

- [ ] All tests pass
- [ ] No console.logs in production code
- [ ] Bundle size impact documented
- [ ] Performance benchmarks included
- [ ] Cross-browser tested
- [ ] Documentation updated

## 🐛 Reporting Issues

### Bug Reports

Include:
- Browser version
- Minimal reproduction
- Expected vs actual behavior
- Performance metrics if relevant

### Feature Requests

Include:
- Use case description
- API proposal
- Performance implications
- Bundle size estimate

## 🏗️ Adding Components

### Component Template

```javascript
import { BrutalComponent } from '../01-core/BrutalComponent.js';

export class MyComponent extends BrutalComponent {
    static get observedAttributes() {
        return ['attribute1', 'attribute2'];
    }
    
    constructor() {
        super();
        this.state = {
            // Initial state
        };
    }
    
    render() {
        return `
            <div class="my-component">
                <!-- Component HTML -->
            </div>
        `;
    }
    
    style() {
        return `
            .my-component {
                /* Component styles */
            }
        `;
    }
    
    connectedCallback() {
        super.connectedCallback();
        // Setup logic
    }
    
    disconnectedCallback() {
        super.disconnectedCallback();
        // Cleanup logic
    }
}

customElements.define('brutal-my-component', MyComponent);
```

## 🚀 Performance Optimization

### Checklist

- [ ] Measure before optimizing
- [ ] Profile with Chrome DevTools
- [ ] Check V8 optimization status
- [ ] Minimize reflows/repaints
- [ ] Use RAF for animations
- [ ] Pool objects when possible
- [ ] Leverage GPU when beneficial

### Benchmarking

```javascript
// Always benchmark optimizations
performance.mark('operation-start');
// ... operation ...
performance.mark('operation-end');
performance.measure('operation', 'operation-start', 'operation-end');

const measure = performance.getEntriesByName('operation')[0];
console.log(`Operation took ${measure.duration}ms`);
```

## 📚 Documentation

- Update API docs for new features
- Include code examples
- Document performance characteristics
- Add to component showcase

## 🤝 Community

- Discord: [discord.gg/brutal](https://discord.gg/brutal)
- Twitter: [@brutalframework](https://twitter.com/brutalframework)
- Discussions: [GitHub Discussions](https://github.com/brutal/framework/discussions)

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Given credit in documentation

---

**Remember**: We're building something BRUTAL. Make it fast, make it clean, make it revolutionary! 🚀