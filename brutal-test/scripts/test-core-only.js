// Test loading core only
import('../../framework-v3/01-core/index.js')
  .then(m => {
    console.log('✅ Core loaded successfully!');
    console.log('Core exports:', Object.keys(m));
  })
  .catch(e => {
    console.error('❌ Error loading core:');
    console.error('Message:', e.message);
    console.error('File:', e.stack?.match(/at (.+\.js:\d+:\d+)/)?.[1]);
  });