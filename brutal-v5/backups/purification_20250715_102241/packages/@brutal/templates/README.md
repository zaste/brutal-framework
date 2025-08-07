# @brutal/templates

Lightweight, fast template engine for BRUTAL V5 with control flow and safe expression evaluation.

## Features

- 🚀 **Zero runtime dependencies**
- 📦 **Small bundle size** (targeting < 7KB minified)
- 🔒 **Safe expression evaluation** (no eval())
- 🎯 **Full TypeScript support**
- ⚡ **High performance** template compilation
- 🔄 **Control flow** (if/else, for, each)
- 🔧 **Filters/pipes** for value transformation
- 🎨 **HTML escaping** by default
- 📝 **Tagged template literals** support

## Installation

```bash
npm install @brutal/templates
```

## Basic Usage

### Simple Templates

```typescript
import { render } from '@brutal/templates';

const result = render('Hello, {{name}}!', { name: 'World' });
// Output: "Hello, World!"
```

### Compile Once, Render Many

```typescript
import { compile } from '@brutal/templates';

const template = compile('Hello, {{name}}!');

console.log(template.render({ name: 'Alice' })); // "Hello, Alice!"
console.log(template.render({ name: 'Bob' }));   // "Hello, Bob!"
```

### HTML Tagged Templates

```typescript
import { html } from '@brutal/templates';

// Simple interpolation
const name = 'World';
const greeting = html`<h1>Hello, ${name}!</h1>`;
// Output: "<h1>Hello, World!</h1>"

// Arrays are automatically joined
const items = ['Apple', 'Banana', 'Orange'];
const list = html`
  <ul>
    ${items.map(item => html`<li>${item}</li>`)}
  </ul>
`;
```

### Reusable Template Functions

```typescript
import { html } from '@brutal/templates';

const userCard = html.template`
  <div class="user-card">
    <h2>${'name'}</h2>
    <p>${'email'}</p>
  </div>
`;

const result = userCard({ name: 'John', email: 'john@example.com' });
```

## Template Syntax

### Expressions

```typescript
// Simple expressions
render('{{name}}', { name: 'John' }); // "John"

// Property access
render('{{user.name}}', { user: { name: 'John' } }); // "John"

// Array access
render('{{items[0]}}', { items: ['first', 'second'] }); // "first"

// Computed expressions
render('{{price * quantity}}', { price: 10, quantity: 3 }); // "30"

// Ternary operator
render('{{age >= 18 ? "Adult" : "Minor"}}', { age: 20 }); // "Adult"

// Function calls
render('{{greet(name)}}', { 
  name: 'John',
  greet: (n: string) => `Hello, ${n}!`
}); // "Hello, John!"
```

### Conditional Rendering

```typescript
// Simple if
const template = `
{{#if isLoggedIn}}
  Welcome back!
{{/if}}
`;

// If-else
const template = `
{{#if user}}
  Hello, {{user.name}}!
{{#else}}
  Please log in.
{{/if}}
`;

// If-elseif-else
const template = `
{{#if score >= 90}}Grade: A
{{#elseif score >= 80}}Grade: B
{{#elseif score >= 70}}Grade: C
{{#else}}Grade: F{{/if}}
`;
```

### Loops

```typescript
// For loop
const template = `
{{#for item in items}}
  - {{item}}
{{/for}}
`;

render(template, { items: ['Apple', 'Banana', 'Orange'] });

// Each loop (with index)
const template = `
{{#each value, index in items}}
  {{index}}: {{value}}
{{/each}}
`;

// Each loop with objects
const template = `
{{#each value, key in user}}
  {{key}}: {{value}}
{{/each}}
`;

render(template, { user: { name: 'John', age: 30 } });
// Output: "name: John\nage: 30"
```

### Filters

```typescript
import { render } from '@brutal/templates';

// Define filters
const filters = {
  uppercase: (str: string) => str.toUpperCase(),
  truncate: (str: string, len: number) => str.slice(0, len),
  currency: (num: number) => `$${num.toFixed(2)}`
};

// Use filters
render('{{name | uppercase}}', { name: 'john' }, { filters });
// Output: "JOHN"

// Chain filters
render('{{title | truncate(10) | uppercase}}', 
  { title: 'This is a long title' }, 
  { filters }
);
// Output: "THIS IS A "

// Filter with arguments
render('{{price | currency}}', { price: 19.99 }, { filters });
// Output: "$19.99"
```

## Advanced Usage

### Expression Evaluator

```typescript
import { ExpressionEvaluator } from '@brutal/templates';

const evaluator = new ExpressionEvaluator({
  uppercase: (s: string) => s.toUpperCase()
});

// Evaluate expressions directly
const result = evaluator.evaluate('name | uppercase', { name: 'john' });
// Output: "JOHN"
```

### Custom Compiler

```typescript
import { Compiler } from '@brutal/templates';

const compiler = new Compiler({
  escape: false, // Disable HTML escaping
  filters: {
    reverse: (s: string) => s.split('').reverse().join('')
  }
});

const template = compiler.compile('{{text | reverse}}');
console.log(template.render({ text: 'Hello' })); // "olleH"
```

### Template Class

```typescript
import { Template } from '@brutal/templates';

// For simple ${} interpolation
const template = new Template(
  ['Hello, ', '!'],
  ['name']
);

console.log(template.render({ name: 'World' })); // "Hello, World!"
```

## Security

### HTML Escaping

By default, all expressions are HTML-escaped to prevent XSS attacks:

```typescript
render('{{userInput}}', { 
  userInput: '<script>alert("XSS")</script>' 
});
// Output: "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;"
```

To disable escaping for trusted content:

```typescript
compile('{{html}}', { escape: false });
```

### Safe Expression Evaluation

The template engine uses a custom expression evaluator that:
- Does NOT use `eval()` or `new Function()` for expressions
- Only allows property access, not arbitrary code execution
- Validates all expressions at compile time
- Prevents access to global objects unless explicitly provided

## API Reference

### `compile(template: string, options?: TemplateOptions): CompiledTemplate`

Compiles a template string into a reusable template function.

### `render(template: string, data: TemplateContext, options?: TemplateOptions): string`

Compiles and renders a template in one step.

### `html\`template\`: string`

Tagged template literal for HTML generation with automatic escaping.

### `html.template\`template\`: (data: any) => string`

Creates a reusable template function from a tagged template literal.

### Types

```typescript
interface TemplateOptions {
  escape?: boolean;              // Enable HTML escaping (default: true)
  filters?: Record<string, FilterFunction>;
  strict?: boolean;              // Throw on undefined variables
}

interface CompiledTemplate {
  render: (context: TemplateContext) => string;
  source: string;
  timestamp: number;
}

type FilterFunction = (value: any, ...args: any[]) => any;
type TemplateContext = Record<string, any>;
```

## Performance

The template engine is designed for high performance:

- Templates are compiled to optimized JavaScript functions
- Expressions are parsed once at compile time
- Minimal runtime overhead
- Efficient string concatenation
- Smart caching opportunities

## Bundle Size

Current implementation: ~18KB minified (working to reduce to < 7KB)

The large size is due to the comprehensive expression evaluator and template compiler. Future optimizations planned:
- Simplified expression parser
- Optional features via tree-shaking
- More aggressive minification

## Contributing

Please see the main BRUTAL V5 repository for contribution guidelines.

## License

Part of BRUTAL V5 - See main repository for license details.