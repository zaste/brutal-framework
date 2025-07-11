const fs = require('fs');

// Read the Modal.js file
const modalCode = fs.readFileSync('./04-components/ui/Modal.js', 'utf8');

// Feature validation
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
    if (hasFeature) passCount++;
}

// Method validation
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
    `);
    if (hasMethod) passCount++;
}

// WebGL Shader validation
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
    if (hasFeature) passCount++;
}

// Animation types validation
const animations = ['scale', 'slide', 'flip', 'rotate', 'fade'];
for (const anim of animations) {
    totalTests++;
    const hasAnimation = modalCode.includes(`case '${anim}':`);
    if (hasAnimation) passCount++;
}

// Size variants validation
const sizes = ['small', 'medium', 'large', 'fullscreen'];
for (const size of sizes) {
    totalTests++;
    const hasSize = modalCode.includes(`.${size} .modal-content`);
    if (hasSize) passCount++;
}

// Performance features
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
    if (hasFeature) passCount++;
}

// Code quality checks
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
    if (hasCheck) passCount++;
}

// Summary
* 100).toFixed(1)}%`);

if (passCount === totalTests) {
    } else {
    }

// File size check
const fileSize = Buffer.byteLength(modalCode, 'utf8');
.toFixed(2)} KB`);

// Line count
const lineCount = modalCode.split('\n').length;
// Check for TODO items
const todoCount = (modalCode.match(/TODO|FIXME|HACK/gi) || []).length;
