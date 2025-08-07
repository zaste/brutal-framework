/**
 * Base component class for BRUTAL
 */

export abstract class BrutalComponent extends HTMLElement {
  protected _initialized = false;
  
  connectedCallback(): void {
    if (!this._initialized) {
      this.init();
      this._initialized = true;
    }
  }
  
  protected abstract init(): void;
  
  protected abstract render(): void;
}
