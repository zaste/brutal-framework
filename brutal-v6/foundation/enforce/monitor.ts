/**
 * Runtime monitoring for foundation violations
 * Catches violations that slip through other checks
 */

import { validate } from '../validate';
import { checkInvariants } from '../invariants';

interface MonitorOptions {
  interval?: number; // ms between checks
  autoFix?: boolean;
  onViolation?: (result: any) => void;
}

class FoundationMonitor {
  private interval: NodeJS.Timeout | null = null;
  private lastCheck: Date = new Date();
  
  /**
   * Start continuous monitoring
   */
  start(options: MonitorOptions = {}) {
    const {
      interval = 60000, // Check every minute by default
      autoFix = false,
      onViolation = this.defaultViolationHandler
    } = options;
    
    if (this.interval) {
      console.warn('Monitor already running');
      return;
    }
    
    // Initial check
    this.check(autoFix, onViolation);
    
    // Set up interval
    this.interval = setInterval(() => {
      this.check(autoFix, onViolation);
    }, interval);
    
    console.log(`🛡️  Foundation monitor started (checking every ${interval}ms)`);
  }
  
  /**
   * Stop monitoring
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('🛑 Foundation monitor stopped');
    }
  }
  
  /**
   * Run a single check
   */
  async check(autoFix: boolean = false, onViolation?: (result: any) => void) {
    try {
      // First check invariants - these are critical
      await checkInvariants();
      
      const result = await validate('.', { fix: autoFix });
      
      if (!result.valid) {
        console.error(`\n❌ Foundation violations detected at ${new Date().toISOString()}`);
        console.error(result.summary);
        
        if (onViolation) {
          onViolation(result);
        }
        
        if (autoFix && result.fixed && result.fixed > 0) {
          console.log(`\n🔧 Auto-fixed ${result.fixed} violations`);
          // Re-check after fixes
          const recheck = await validate('.');
          if (recheck.valid) {
            console.log('✅ All violations fixed');
          } else {
            console.error('⚠️  Some violations remain after auto-fix');
          }
        }
      }
      
      this.lastCheck = new Date();
    } catch (error) {
      console.error('Monitor check failed:', error);
    }
  }
  
  /**
   * Default handler for violations
   */
  private defaultViolationHandler(result: any) {
    // In development, just log
    if (process.env.NODE_ENV === 'development') {
      console.warn('\n⚠️  Fix these violations before committing');
      return;
    }
    
    // In production, could send alerts, metrics, etc.
    if (process.env.NODE_ENV === 'production') {
      // Would send to monitoring service
      console.error('🚨 PRODUCTION VIOLATIONS DETECTED');
    }
  }
  
  /**
   * Get monitor status
   */
  status() {
    return {
      running: this.interval !== null,
      lastCheck: this.lastCheck,
      nextCheck: this.interval ? new Date(this.lastCheck.getTime() + 60000) : null
    };
  }
}

// Export singleton instance
export const monitor = new FoundationMonitor();

// Auto-start in development
if (process.env.NODE_ENV === 'development' && !process.env.DISABLE_MONITOR) {
  monitor.start({
    interval: 300000, // 5 minutes in dev
    autoFix: true
  });
}