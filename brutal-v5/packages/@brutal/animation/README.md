# @brutal/animation

Ultra-lightweight animation library for BRUTAL V5 with GPU-accelerated transforms.

## Features

- 🎯 **Tiny Bundle**: Only 2.3KB (minified + gzipped)
- ⚡ **GPU Accelerated**: Transform-only animations for 60fps
- 🎨 **Simple API**: One function to rule them all
- 🔄 **Timeline Support**: Sequential animations made easy
- 📦 **Zero Dependencies**: True to BRUTAL principles
- 🚀 **RAF Optimized**: Single loop for all animations

## Installation

```bash
npm install @brutal/animation
```

## Quick Start

```javascript
import { animate, timeline } from '@brutal/animation';

// Simple animation
animate(element, { x: 100, opacity: 0.5 }, { duration: 300 });

// With options
animate(element, 
  { x: 200, y: -50, scale: 1.5, rotate: 45 }, 
  { 
    duration: 600,
    delay: 100,
    easing: 'easeInOut',
    onComplete: () => console.log('Done!')
  }
);

// Timeline
timeline([
  [el1, { x: 100 }, { duration: 200 }],
  [el2, { y: -50 }, { duration: 300 }],
  [el3, { scale: 2 }, { duration: 400 }]
]);
```

## API

### `animate(element, properties, options)`

Animates an element with the specified properties.

#### Parameters

- `element` (HTMLElement): The element to animate
- `properties` (Object): Properties to animate
  - `x` (number): Translate X in pixels
  - `y` (number): Translate Y in pixels
  - `scale` (number): Scale factor
  - `rotate` (number): Rotation in degrees
  - `opacity` (number): Opacity (0-1)
- `options` (Object): Animation options
  - `duration` (number): Duration in ms (default: 300)
  - `delay` (number): Delay before start in ms (default: 0)
  - `easing` (string|function): Easing function (default: 'easeOut')
  - `onComplete` (function): Callback when animation completes
  - `onUpdate` (function): Callback on each frame with progress (0-1)

#### Returns

Object with:
- `stop()`: Function to stop the animation
- `promise`: Promise that resolves when animation completes

### `timeline(sequence)`

Runs animations in sequence.

#### Parameters

- `sequence` (Array): Array of animation definitions `[element, properties, options?]`

#### Returns

Object with:
- `stop()`: Function to stop all animations
- `promise`: Promise that resolves when all animations complete

## Easing Functions

Built-in easing functions:
- `linear`: Constant speed
- `easeIn`: Accelerate from zero
- `easeOut`: Decelerate to zero (default)
- `easeInOut`: Accelerate then decelerate

Custom easing:
```javascript
animate(element, { x: 100 }, {
  easing: (t) => t * t * t // cubic easing
});
```

## Advanced Examples

### Chained Animations

```javascript
animate(box, { x: 100 }, { duration: 300 })
  .promise.then(() => 
    animate(box, { y: -50 }, { duration: 300 }).promise
  ).then(() =>
    animate(box, { rotate: 360 }, { duration: 500 }).promise
  );
```

### Interruptible Animations

```javascript
const anim = animate(element, { x: 200 }, { duration: 1000 });

// Stop after 500ms
setTimeout(() => anim.stop(), 500);
```

### Progress Tracking

```javascript
animate(element, { scale: 2 }, {
  duration: 1000,
  onUpdate: (progress) => {
    console.log(`Animation ${Math.round(progress * 100)}% complete`);
  }
});
```

### Complex Timeline

```javascript
const slideIn = timeline([
  // Fade in all elements
  [header, { opacity: 1 }, { duration: 200 }],
  [content, { opacity: 1 }, { duration: 200 }],
  [footer, { opacity: 1 }, { duration: 200 }],
  // Then slide them in
  [header, { x: 0 }, { duration: 300, easing: 'easeOut' }],
  [content, { x: 0 }, { duration: 300, easing: 'easeOut' }],
  [footer, { x: 0 }, { duration: 300, easing: 'easeOut' }]
]);

// Stop the entire timeline if needed
document.querySelector('.skip').onclick = () => slideIn.stop();
```

## Performance Tips

1. **Stick to transform and opacity**: These are GPU-accelerated
2. **Batch animations**: Use timeline for sequential animations
3. **Avoid animating layout properties**: No width, height, margin, etc.
4. **Use will-change sparingly**: The library handles this automatically

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- All modern mobile browsers

## Size Comparison

| Library | Size (min+gzip) | Features |
|---------|-----------------|----------|
| @brutal/animation | 2.3KB | Transform, opacity, timeline |
| anime.js | 8KB | Full animation library |
| GSAP | 71KB | Professional animation suite |
| Framer Motion | 48KB | React animation library |

## License

MIT