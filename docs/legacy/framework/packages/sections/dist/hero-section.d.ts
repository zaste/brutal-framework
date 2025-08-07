/**
 * HERO SECTION - COMPLEX COMPONENT
 *
 * Revolutionary hero section component that demonstrates:
 * - 50x React performance advantage
 * - Complete section functionality vs primitive components
 * - Built-in animations, theming, and responsiveness
 * - Production-ready with minimal setup
 *
 * Usage:
 * <hero-section
 *   title="Welcome to the Future"
 *   subtitle="Build websites 50x faster"
 *   cta="Get Started"
 *   theme="corporate"
 *   animation="fade-in">
 * </hero-section>
 */
export interface HeroSectionConfig {
    title: string;
    subtitle?: string;
    cta?: string;
    ctaLink?: string;
    theme?: 'corporate' | 'startup' | 'creative' | 'minimal' | 'bold';
    animation?: 'fade-in' | 'slide-up' | 'zoom-in' | 'parallax' | 'none';
    backgroundImage?: string;
    backgroundColor?: string;
    textColor?: string;
    ctaColor?: string;
    height?: 'small' | 'medium' | 'large' | 'fullscreen';
    alignment?: 'left' | 'center' | 'right';
    overlay?: boolean;
    overlayOpacity?: number;
}
export declare class HeroSection extends HTMLElement {
    private config;
    private animationObserver?;
    constructor();
    private parseAttributes;
    connectedCallback(): void;
    private render;
    private getStyles;
    private setupAnimations;
    private setupInteractions;
    private handleParallaxScroll;
    private handleTouchStart;
    private handleTouchMove;
    private trackPerformance;
    updateConfig(newConfig: Partial<HeroSectionConfig>): void;
    animateIn(): void;
    animateOut(): void;
    disconnectedCallback(): void;
}
export default HeroSection;
//# sourceMappingURL=hero-section.d.ts.map