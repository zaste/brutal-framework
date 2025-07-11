/**
 * BRUTAL Framework V3 - Full Bundle Entry
 * Everything included - All features enabled
 */

// Re-export everything from main index
export * from './brutal-index.js';

// Additional exports for full bundle
// All visual debug tools
export * from './03-visual/debug/VisualDebugLayerGPU.js';
export * from './03-visual/debug/ComponentTree3D.js';
export * from './03-visual/debug/RecordingEngine.js';
export * from './03-visual/debug/PerformanceHUD.js';
export * from './03-visual/debug/DataFlowRenderer.js';
export * from './03-visual/debug/AutomatedVisualTester.js';

// All GPU effects
export * from './03-visual/gpu/effects/GPUBlur.js';
export * from './03-visual/gpu/effects/GPUGlow.js';
export * from './03-visual/gpu/effects/GPUDistortion.js';
export * from './03-visual/gpu/effects/GPUTransition.js';

// All advanced components
export * from './04-components/advanced/CodeEditor.js';
export * from './04-components/advanced/DragDropZone.js';

// All UI components
export * from './04-components/ui/Accordion.js';
export * from './04-components/ui/Carousel.js';
export * from './04-components/ui/Charts.js';
export * from './04-components/ui/Modal.js';
export * from './04-components/ui/TabPanel.js';
export * from './04-components/ui/Timeline.js';
export * from './04-components/ui/Tooltip.js';
export * from './04-components/ui/SearchBox.js';
export * from './04-components/ui/ProgressBar.js';
export * from './04-components/ui/LoadingSpinner.js';
export * from './04-components/ui/Notifications.js';

// All media components
export * from './04-components/media/VideoPlayer.js';
export * from './04-components/media/ImageGallery.js';

// All data components
export * from './04-components/data/DataGrid.js';

// All form components
export * from './04-components/forms/FormBuilder.js';

// Theme system
export * from './02-performance/10-ThemeSystem.js';
export * from './02-performance/06-ThemeEngine.js';

// Animation system
export * from './02-performance/08-AnimationSystem.js';

// Gesture system
export * from './02-performance/09-GestureSystem.js';

