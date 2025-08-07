/**
 * SessionStorage adapter for state persistence
 */

import { WebStorageAdapter } from './web-storage.js';

export class SessionStorageAdapter extends WebStorageAdapter {
  constructor() {
    super(sessionStorage);
  }
}