import { ExampleFeature } from '../../dist/index.js';

const feature = new ExampleFeature();
const iterations = 10000;

console.log(`Running ${iterations} iterations...`);

const start = performance.now();

for (let i = 0; i < iterations; i++) {
  await feature.execute(`test-${i}`);
}

const end = performance.now();
const duration = end - start;
const opsPerSecond = (iterations / duration) * 1000;

console.log(`Duration: ${duration.toFixed(2)}ms`);
console.log(`Ops/sec: ${opsPerSecond.toFixed(2)}`);
