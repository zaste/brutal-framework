// Test framework loading
import('../../framework-v3/index.js')
  .then(m => {
    console.log('✅ Framework loaded successfully!');
    console.log('Exports:', Object.keys(m));
    console.log('Version:', m.VERSION);
    console.log('Build:', m.BUILD);
    
    // Test initialization
    if (m.init) {
      m.init({ debug: true });
      console.log('✅ Framework initialized');
    }
  })
  .catch(e => {
    console.error('❌ Error loading framework:');
    console.error('Message:', e.message);
    console.error('Stack:', e.stack);
  });