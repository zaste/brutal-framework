import { HeroSection } from '../src/components/sections/hero-section.js';

console.log('🚀 Enhanced Component Performance Test\n');

// Test 1: Component Creation Time
const createStart = performance.now();
const hero = document.createElement('hero-section');
const createEnd = performance.now();
const createTime = createEnd - createStart;

console.log(`✅ Component Creation: ${createTime.toFixed(3)}ms`);
console.log(`   ${createTime < 1 ? '🎯 EXCELLENT' : '⚠️  NEEDS OPTIMIZATION'}`);

// Test 2: Initial Render Time
document.body.appendChild(hero);
const renderStart = performance.now();
hero.connectedCallback();
const renderEnd = performance.now();
const renderTime = renderEnd - renderStart;

console.log(`\n✅ Initial Render: ${renderTime.toFixed(3)}ms`);
console.log(`   ${renderTime < 5 ? '🎯 EXCELLENT' : '⚠️  NEEDS OPTIMIZATION'}`);

// Test 3: Variant Switch Performance
const variants = ['default', 'split', 'fullscreen', 'gradient', 'minimal', 'animated'];
const variantTimes = [];

variants.forEach(variant => {
  const switchStart = performance.now();
  hero.updateVariant(variant);
  const switchEnd = performance.now();
  const switchTime = switchEnd - switchStart;
  variantTimes.push(switchTime);
  console.log(`\n✅ Switch to ${variant}: ${switchTime.toFixed(3)}ms`);
});

const avgVariantTime = variantTimes.reduce((a, b) => a + b) / variantTimes.length;
console.log(`\n📊 Average Variant Switch: ${avgVariantTime.toFixed(3)}ms`);
console.log(`   ${avgVariantTime < 2 ? '🎯 EXCELLENT' : '⚠️  NEEDS OPTIMIZATION'}`);

// Test 4: Content Update Performance
const updateStart = performance.now();
hero.updateContent({
  title: 'Updated Title',
  subtitle: 'Updated subtitle with new content',
  primaryAction: { text: 'New CTA', href: '#' }
});
const updateEnd = performance.now();
const updateTime = updateEnd - updateStart;

console.log(`\n✅ Content Update: ${updateTime.toFixed(3)}ms`);
console.log(`   ${updateTime < 1 ? '🎯 EXCELLENT' : '⚠️  NEEDS OPTIMIZATION'}`);

// Test 5: Memory Usage
if (performance.memory) {
  const memoryUsed = performance.memory.usedJSHeapSize / 1024 / 1024;
  console.log(`\n💾 Memory Usage: ${memoryUsed.toFixed(2)}MB`);
  console.log(`   ${memoryUsed < 10 ? '🎯 EXCELLENT' : '⚠️  HIGH MEMORY USAGE'}`);
}

// Test 6: Multiple Instances
console.log('\n🔄 Multiple Instance Test:');
const instances = [];
const multiStart = performance.now();

for (let i = 0; i < 100; i++) {
  const instance = document.createElement('hero-section');
  instance.updateVariant(variants[i % variants.length]);
  instances.push(instance);
}

const multiEnd = performance.now();
const multiTime = multiEnd - multiStart;
const avgInstanceTime = multiTime / 100;

console.log(`   Created 100 instances in ${multiTime.toFixed(3)}ms`);
console.log(`   Average per instance: ${avgInstanceTime.toFixed(3)}ms`);
console.log(`   ${avgInstanceTime < 0.5 ? '🎯 EXCELLENT' : '⚠️  NEEDS OPTIMIZATION'}`);

// Summary
console.log('\n📋 PERFORMANCE SUMMARY:');
console.log('─────────────────────────');
console.log(`Component Creation: ${createTime < 1 ? '✅' : '❌'} ${createTime.toFixed(3)}ms`);
console.log(`Initial Render:     ${renderTime < 5 ? '✅' : '❌'} ${renderTime.toFixed(3)}ms`);
console.log(`Variant Switch:     ${avgVariantTime < 2 ? '✅' : '❌'} ${avgVariantTime.toFixed(3)}ms`);
console.log(`Content Update:     ${updateTime < 1 ? '✅' : '❌'} ${updateTime.toFixed(3)}ms`);
console.log(`Mass Creation:      ${avgInstanceTime < 0.5 ? '✅' : '❌'} ${avgInstanceTime.toFixed(3)}ms/instance`);

const allPassed = createTime < 1 && renderTime < 5 && avgVariantTime < 2 && 
                  updateTime < 1 && avgInstanceTime < 0.5;

console.log('\n' + (allPassed ? '🎉 ALL PERFORMANCE TARGETS MET!' : '⚠️  Some optimizations needed'));

// Comparison with React (from previous benchmarks)
console.log('\n📊 VS REACT COMPARISON:');
console.log('─────────────────────────');
console.log('React component creation: ~0.031ms');
console.log(`Our component creation:   ${createTime.toFixed(3)}ms (${(0.031/createTime).toFixed(1)}x faster)`);
console.log('\nReact initial render: ~0.157ms');
console.log(`Our initial render:   ${renderTime.toFixed(3)}ms (${renderTime < 0.157 ? (0.157/renderTime).toFixed(1) + 'x faster' : 'slower'})`);

export { createTime, renderTime, avgVariantTime, updateTime, avgInstanceTime };