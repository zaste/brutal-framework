/**
 * Sandbox Worker for isolated code execution
 */

import { parentPort, workerData } from 'worker_threads';
import * as vm from 'vm';

interface WorkerMessage {
  type: 'result' | 'error' | 'violation';
  data?: any;
  error?: string;
  violation?: any;
  violations?: any[];
  metrics?: any;
}

if (parentPort) {
  const { code, context, permissions } = workerData;
  const violations: any[] = [];
  const startTime = Date.now();
  
  try {
    // Create restricted context
    const sandbox = Object.create(null);
    
    // Add minimal safe globals
    sandbox.Object = Object;
    sandbox.Array = Array;
    sandbox.String = String;
    sandbox.Number = Number;
    sandbox.Boolean = Boolean;
    sandbox.Math = Math;
    sandbox.JSON = JSON;
    sandbox.Date = Date;
    
    // Add allowed APIs based on permissions
    if (permissions.apis?.console) {
      sandbox.console = {
        log: (...args: any[]) => {
          parentPort!.postMessage({
            type: 'log',
            data: args
          });
        }
      };
    }
    
    // Add user context
    Object.assign(sandbox, context);
    
    // Create VM context
    const vmContext = vm.createContext(sandbox);
    
    // Execute code
    const script = new vm.Script(code);
    const result = script.runInContext(vmContext, {
      timeout: permissions.resources?.timeoutMs || 5000
    });
    
    // Send result
    parentPort.postMessage({
      type: 'result',
      data: result,
      violations,
      metrics: {
        executionTime: Date.now() - startTime,
        memoryUsed: process.memoryUsage().heapUsed,
        cpuTime: process.cpuUsage().user + process.cpuUsage().system
      }
    } as WorkerMessage);
  } catch (error) {
    parentPort.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : String(error),
      violations
    } as WorkerMessage);
  }
}