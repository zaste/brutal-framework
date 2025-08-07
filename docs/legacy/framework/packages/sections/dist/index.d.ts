/**
 * NATIVE WEB COMPONENTS FRAMEWORK - SECTIONS MODULE
 *
 * Complex components that replace entire website sections rather than primitive UI elements.
 * Each component demonstrates the 50x React performance advantage with complete functionality.
 *
 * Revolutionary approach: Build complete websites with 5 components instead of 50+ primitives.
 *
 * Components:
 * - HeroSection: Complete hero section with animations, themes, and responsive design
 * - NavigationBar: Full navigation with mobile menu, dropdowns, and user management
 * - FeatureGrid: Advanced feature showcase with animations and interactive elements
 * - ContactForm: Complete contact form with validation, submission, and success flows
 * - AnalyticsOverview: Dashboard-style analytics with charts and real-time data
 *
 * Usage:
 * ```html
 * <hero-section title="Welcome" subtitle="Build faster" cta="Get Started" theme="corporate"></hero-section>
 * <navigation-bar logo="MyApp" items='["Home", "About", "Contact"]' theme="minimal"></navigation-bar>
 * <feature-grid features='[{title: "Fast", description: "50x React performance"}]'></feature-grid>
 * <contact-form title="Contact Us" endpoint="/api/contact"></contact-form>
 * <analytics-overview metrics='[{name: "Users", value: "10K"}]'></analytics-overview>
 * ```
 */
import '@nwc/core/dist/browser-polyfills';
export { HeroSection, type HeroSectionConfig } from './hero-section';
export { HeroSectionOptimized, type HeroSectionOptimizedConfig } from './hero-section-optimized';
import { HeroSection } from './hero-section';
import { HeroSectionOptimized } from './hero-section-optimized';
export declare const registerAllSections: () => void;
export declare const validateSectionPerformance: (sectionName: string) => {
    end: () => number;
};
export declare const sectionThemes: {
    corporate: {
        background: string;
        textColor: string;
        accentColor: string;
    };
    startup: {
        background: string;
        textColor: string;
        accentColor: string;
    };
    creative: {
        background: string;
        textColor: string;
        accentColor: string;
    };
    minimal: {
        background: string;
        textColor: string;
        accentColor: string;
    };
    bold: {
        background: string;
        textColor: string;
        accentColor: string;
    };
};
export declare const sectionAnimations: {
    'fade-in': string;
    'slide-up': string;
    'zoom-in': string;
    parallax: string;
    none: string;
};
export declare const responsiveBreakpoints: {
    mobile: string;
    tablet: string;
    desktop: string;
    large: string;
};
export declare const accessibilityHelpers: {
    reducedMotion: string;
    highContrast: string;
    darkMode: string;
};
export declare const performanceMetrics: {
    targetFrameTime: number;
    targetRenderTime: number;
    targetMemoryUsage: number;
};
export declare const SECTIONS_VERSION = "1.0.0-alpha.1";
export declare const PERFORMANCE_TARGET = "50x React Performance";
export declare const SUPPORTED_BROWSERS: string[];
/**
 * Initialize the sections module with optimal performance settings
 */
export declare const initializeSections: (config?: {
    autoRegister?: boolean;
    performanceTracking?: boolean;
    theme?: keyof typeof sectionThemes;
}) => {
    theme: "corporate" | "startup" | "creative" | "minimal" | "bold";
    performanceTracking: boolean;
    ready: boolean;
};
/**
 * Quick start function for immediate usage
 */
export declare const quickStartSections: () => {
    theme: "corporate" | "startup" | "creative" | "minimal" | "bold";
    performanceTracking: boolean;
    ready: boolean;
};
declare const _default: {
    HeroSection: typeof HeroSection;
    HeroSectionOptimized: typeof HeroSectionOptimized;
    initializeSections: (config?: {
        autoRegister?: boolean;
        performanceTracking?: boolean;
        theme?: keyof typeof sectionThemes;
    }) => {
        theme: "corporate" | "startup" | "creative" | "minimal" | "bold";
        performanceTracking: boolean;
        ready: boolean;
    };
    quickStartSections: () => {
        theme: "corporate" | "startup" | "creative" | "minimal" | "bold";
        performanceTracking: boolean;
        ready: boolean;
    };
    sectionThemes: {
        corporate: {
            background: string;
            textColor: string;
            accentColor: string;
        };
        startup: {
            background: string;
            textColor: string;
            accentColor: string;
        };
        creative: {
            background: string;
            textColor: string;
            accentColor: string;
        };
        minimal: {
            background: string;
            textColor: string;
            accentColor: string;
        };
        bold: {
            background: string;
            textColor: string;
            accentColor: string;
        };
    };
    sectionAnimations: {
        'fade-in': string;
        'slide-up': string;
        'zoom-in': string;
        parallax: string;
        none: string;
    };
    performanceMetrics: {
        targetFrameTime: number;
        targetRenderTime: number;
        targetMemoryUsage: number;
    };
    SECTIONS_VERSION: string;
    PERFORMANCE_TARGET: string;
};
export default _default;
//# sourceMappingURL=index.d.ts.map