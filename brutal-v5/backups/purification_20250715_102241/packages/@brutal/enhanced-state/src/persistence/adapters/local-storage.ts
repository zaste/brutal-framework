/**
 * LocalStorage adapter for state persistence
 */

import { WebStorageAdapter } from './web-storage.js';

export class LocalStorageAdapter extends WebStorageAdapter {
  constructor() {
    super(localStorage);
  }
}