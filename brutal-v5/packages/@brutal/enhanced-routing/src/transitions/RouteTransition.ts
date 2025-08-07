/**
 * Route transition animations and effects
 */

export interface TransitionOptions {
  duration?: number;
  easing?: string;
  enterClass?: string;
  leaveClass?: string;
  mode?: 'in-out' | 'out-in' | 'simultaneous';
}

export interface TransitionState {
  isTransitioning: boolean;
  from?: string;
  to?: string;
  progress: number;
}

export class RouteTransition {
  private options: Required<TransitionOptions>;
  private state: TransitionState = {
    isTransitioning: false,
    progress: 0
  };
  
  constructor(options: TransitionOptions = {}) {
    this.options = {
      duration: options.duration ?? 300,
      easing: options.easing ?? 'ease-in-out',
      enterClass: options.enterClass ?? 'route-enter',
      leaveClass: options.leaveClass ?? 'route-leave',
      mode: options.mode ?? 'out-in'
    };
  }

  async transition(
    fromElement: HTMLElement | null,
    toElement: HTMLElement,
    from: string,
    to: string
  ): Promise<void> {
    this.state = {
      isTransitioning: true,
      from,
      to,
      progress: 0
    };

    try {
      switch (this.options.mode) {
        case 'out-in':
          await this.outInTransition(fromElement, toElement);
          break;
        case 'in-out':
          await this.inOutTransition(fromElement, toElement);
          break;
        case 'simultaneous':
          await this.simultaneousTransition(fromElement, toElement);
          break;
      }
    } finally {
      this.state.isTransitioning = false;
      this.state.progress = 1;
    }
  }

  private async outInTransition(
    fromElement: HTMLElement | null,
    toElement: HTMLElement
  ): Promise<void> {
    if (fromElement) {
      await this.animateOut(fromElement);
      fromElement.style.display = 'none';
    }
    await this.animateIn(toElement);
  }

  private async inOutTransition(
    fromElement: HTMLElement | null,
    toElement: HTMLElement
  ): Promise<void> {
    await this.animateIn(toElement);
    if (fromElement) {
      await this.animateOut(fromElement);
      fromElement.style.display = 'none';
    }
  }

  private async simultaneousTransition(
    fromElement: HTMLElement | null,
    toElement: HTMLElement
  ): Promise<void> {
    const promises: Promise<void>[] = [this.animateIn(toElement)];
    if (fromElement) {
      promises.push(this.animateOut(fromElement));
    }
    await Promise.all(promises);
    if (fromElement) {
      fromElement.style.display = 'none';
    }
  }

  private animateIn(element: HTMLElement): Promise<void> {
    return this.animate(element, this.options.enterClass, 'enter');
  }

  private animateOut(element: HTMLElement): Promise<void> {
    return this.animate(element, this.options.leaveClass, 'leave');
  }

  private animate(
    element: HTMLElement,
    className: string,
    direction: 'enter' | 'leave'
  ): Promise<void> {
    return new Promise(resolve => {
      element.classList.add(className);
      element.style.transition = `all ${this.options.duration}ms ${this.options.easing}`;
      
      const cleanup = () => {
        element.classList.remove(className);
        element.style.transition = '';
        resolve();
      };

      // Use requestAnimationFrame for smooth animations
      requestAnimationFrame(() => {
        element.classList.add(`${className}-active`);
        
        setTimeout(() => {
          element.classList.remove(`${className}-active`);
          cleanup();
        }, this.options.duration);
      });
    });
  }

  getState(): TransitionState {
    return { ...this.state };
  }
}

export function createTransition(options?: TransitionOptions): RouteTransition {
  return new RouteTransition(options);
}