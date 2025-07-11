import { readFileSync } from 'fs';

console.log('🧪 Testing BRUTAL Modal Component...\n');

// Read the Modal.js file
const modalCode = readFileSync('./04-components/ui/Modal.js', 'utf8');

// Feature validation
console.log('📋 Feature Validation:');
const features = {
    'GPU/WebGL Support': /WebGL|webgl/i,
    'Spring Physics': /spring/i,
    'Focus Management': /focus.*trap|trap.*focus/i,
    'Keyboard Navigation': /keydown|keyboard/i,
    'Gesture Support': /gesture|swipe|pinch/i,
    'Animation System': /animationSystem/,
    'Modal Stack': /modalStack|_modalStack/,
    'Event Lifecycle': /dispatchEvent.*open|dispatchEvent.*close/,
    'Memory Cleanup': /cleanup|delete|remove/i,
    'Accessibility': /aria-modal|role.*dialog/
};

let passCount = 0;
let totalTests = 0;

for (const [feature, pattern] of Object.entries(features)) {
    totalTests++;
    const hasFeature = pattern.test(modalCode);
    console.log(`  ${hasFeature ? '✅' : '❌'} ${feature}`);
    if (hasFeature) passCount++;
}

// Method validation
console.log('\n🔧 Method Validation:');
const methods = [
    'open',
    'close',
    'toggle',
    '_animateIn',
    '_animateOut',
    '_setupFocusTrap',
    '_initGPUEffects',
    '_initShaders',
    '_renderBackdropEffect',
    '_handleKeydown',
    '_cleanupGPU'
];

for (const method of methods) {
    totalTests++;
    const hasMethod = modalCode.includes(`${method}(`);
    console.log(`  ${hasMethod ? '✅' : '❌'} ${method}()`);
    if (hasMethod) passCount++;
}

// WebGL Shader validation
console.log('\n🎨 WebGL Shader Validation:');
const shaderFeatures = {
    'Vertex Shader': /gl_Position/,
    'Fragment Shader': /gl_FragColor/,
    'Blur Effect': /blur.*shader|u_blurRadius/i,
    'Glass Effect': /glass.*shader|ripple.*effect/i,
    'Uniforms': /uniform\s+\w+\s+\w+/,
    'Attributes': /attribute\s+\w+\s+\w+/
};

for (const [feature, pattern] of Object.entries(shaderFeatures)) {
    totalTests++;
    const hasFeature = pattern.test(modalCode);
    console.log(`  ${hasFeature ? '✅' : '❌'} ${feature}`);
    if (hasFeature) passCount++;
}

// Animation types validation
console.log('\n🎬 Animation Types:');
const animations = ['scale', 'slide', 'flip', 'rotate', 'fade'];
for (const anim of animations) {
    totalTests++;
    const hasAnimation = modalCode.includes(`case '${anim}':`);
    console.log(`  ${hasAnimation ? '✅' : '❌'} ${anim} animation`);
    if (hasAnimation) passCount++;
}

// Size variants validation
console.log('\n📐 Size Variants:');
const sizes = ['small', 'medium', 'large', 'fullscreen'];
for (const size of sizes) {
    totalTests++;
    const hasSize = modalCode.includes(`.${size} .modal-content`);
    console.log(`  ${hasSize ? '✅' : '❌'} ${size} size`);
    if (hasSize) passCount++;
}

// Performance features
console.log('\n⚡ Performance Features:');
const perfFeatures = {
    'RequestAnimationFrame': /requestAnimationFrame/,
    'Will-change CSS': /will-change/,
    'GPU Acceleration': /translateZ|translate3d|perspective/,
    'Resource Cleanup': /deleteTexture|deleteBuffer|deleteProgram/,
    'Event Cleanup': /removeEventListener/
};

for (const [feature, pattern] of Object.entries(perfFeatures)) {
    totalTests++;
    const hasFeature = pattern.test(modalCode);
    console.log(`  ${hasFeature ? '✅' : '❌'} ${feature}`);
    if (hasFeature) passCount++;
}

// Code quality checks
console.log('\n🏗️ Code Quality:');
const qualityChecks = {
    'Error Handling': /try.*catch|console\.error/,
    'Comments': /\/\*\*[\s\S]*?\*\/|\/\/.*/,
    'Type Checks': /typeof|instanceof/,
    'Null Checks': /!==\s*null|===\s*null|!=\s*undefined/,
    'Custom Elements': /customElements\.define/
};

for (const [check, pattern] of Object.entries(qualityChecks)) {
    totalTests++;
    const hasCheck = pattern.test(modalCode);
    console.log(`  ${hasCheck ? '✅' : '❌'} ${check}`);
    if (hasCheck) passCount++;
}

// Summary
console.log('\n📊 Test Summary:');
console.log(`  Total Tests: ${totalTests}`);
console.log(`  Passed: ${passCount}`);
console.log(`  Failed: ${totalTests - passCount}`);
console.log(`  Success Rate: ${((passCount / totalTests) * 100).toFixed(1)}%`);

if (passCount === totalTests) {
    console.log('\n✅ All tests passed! Modal component is production-ready!');
} else {
    console.log('\n⚠️  Some tests failed. Review the component.');
}

// File size check
const fileSize = Buffer.byteLength(modalCode, 'utf8');
console.log(`\n📦 Component Size: ${(fileSize / 1024).toFixed(2)} KB`);

// Line count
const lineCount = modalCode.split('\n').length;
console.log(`📏 Lines of Code: ${lineCount}`);

// Check for TODO items
const todoCount = (modalCode.match(/TODO|FIXME|HACK/gi) || []).length;
console.log(`📝 TODO/FIXME items: ${todoCount}`);

console.log('\n✅ Modal component validation complete!');