import { EnhancedComponent } from '../../core/enhanced-component.js';

export class HeroSection extends EnhancedComponent {
  static variants = {
    default: {
      classes: ['hero-default'],
      attributes: { 'data-layout': 'center' }
    },
    split: {
      classes: ['hero-split'],
      attributes: { 'data-layout': 'split' }
    },
    fullscreen: {
      classes: ['hero-fullscreen'],
      attributes: { 'data-layout': 'fullscreen' }
    },
    video: {
      classes: ['hero-video'],
      attributes: { 'data-layout': 'video' }
    },
    gradient: {
      classes: ['hero-gradient'],
      attributes: { 'data-layout': 'gradient' }
    },
    minimal: {
      classes: ['hero-minimal'],
      attributes: { 'data-layout': 'minimal' }
    },
    particles: {
      classes: ['hero-particles'],
      attributes: { 'data-layout': 'particles' }
    },
    parallax: {
      classes: ['hero-parallax'],
      attributes: { 'data-layout': 'parallax' }
    },
    animated: {
      classes: ['hero-animated'],
      attributes: { 'data-layout': 'animated' }
    },
    cta: {
      classes: ['hero-cta'],
      attributes: { 'data-layout': 'cta' }
    }
  };
  
  constructor() {
    super({
      variant: 'default'
    });
    
    this.state = {
      title: 'Welcome to Our Platform',
      subtitle: 'Build amazing experiences with zero dependencies',
      primaryAction: { text: 'Get Started', href: '#' },
      secondaryAction: { text: 'Learn More', href: '#' },
      image: null,
      video: null,
      background: null
    };
  }
  
  template() {
    const variant = this.config.variant;
    
    switch(variant) {
      case 'split':
        return this.renderSplit();
      case 'fullscreen':
        return this.renderFullscreen();
      case 'video':
        return this.renderVideo();
      case 'gradient':
        return this.renderGradient();
      case 'minimal':
        return this.renderMinimal();
      case 'particles':
        return this.renderParticles();
      case 'parallax':
        return this.renderParallax();
      case 'animated':
        return this.renderAnimated();
      case 'cta':
        return this.renderCTA();
      default:
        return this.renderDefault();
    }
  }
  
  renderDefault() {
    return `
      <div class="hero-container">
        <div class="hero-content">
          <h1 class="hero-title">${this.state.title}</h1>
          <p class="hero-subtitle">${this.state.subtitle}</p>
          <div class="hero-actions">
            ${this.renderActions()}
          </div>
        </div>
        ${this.state.image ? `<img class="hero-image" src="${this.state.image}" alt="">` : ''}
      </div>
    `;
  }
  
  renderSplit() {
    return `
      <div class="hero-container hero-split-container">
        <div class="hero-content-section">
          <h1 class="hero-title">${this.state.title}</h1>
          <p class="hero-subtitle">${this.state.subtitle}</p>
          <div class="hero-actions">
            ${this.renderActions()}
          </div>
        </div>
        <div class="hero-media-section">
          ${this.state.image ? `<img class="hero-image" src="${this.state.image}" alt="">` : ''}
        </div>
      </div>
    `;
  }
  
  renderFullscreen() {
    return `
      <div class="hero-container hero-fullscreen-container">
        ${this.state.background ? `<div class="hero-background" style="background-image: url(${this.state.background})"></div>` : ''}
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <h1 class="hero-title hero-title-large">${this.state.title}</h1>
          <p class="hero-subtitle">${this.state.subtitle}</p>
          <div class="hero-actions">
            ${this.renderActions()}
          </div>
        </div>
      </div>
    `;
  }
  
  renderVideo() {
    return `
      <div class="hero-container hero-video-container">
        ${this.state.video ? `
          <video class="hero-video-bg" autoplay muted loop playsinline>
            <source src="${this.state.video}" type="video/mp4">
          </video>
        ` : ''}
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <h1 class="hero-title">${this.state.title}</h1>
          <p class="hero-subtitle">${this.state.subtitle}</p>
          <div class="hero-actions">
            ${this.renderActions()}
          </div>
        </div>
      </div>
    `;
  }
  
  renderGradient() {
    return `
      <div class="hero-container hero-gradient-container">
        <div class="hero-gradient-bg"></div>
        <div class="hero-content">
          <h1 class="hero-title hero-title-gradient">${this.state.title}</h1>
          <p class="hero-subtitle">${this.state.subtitle}</p>
          <div class="hero-actions">
            ${this.renderActions()}
          </div>
        </div>
      </div>
    `;
  }
  
  renderMinimal() {
    return `
      <div class="hero-container hero-minimal-container">
        <h1 class="hero-title hero-title-minimal">${this.state.title}</h1>
        <p class="hero-subtitle hero-subtitle-minimal">${this.state.subtitle}</p>
        <div class="hero-actions hero-actions-minimal">
          ${this.renderActions()}
        </div>
      </div>
    `;
  }
  
  renderParticles() {
    return `
      <div class="hero-container hero-particles-container">
        <canvas class="hero-particles-canvas"></canvas>
        <div class="hero-content">
          <h1 class="hero-title">${this.state.title}</h1>
          <p class="hero-subtitle">${this.state.subtitle}</p>
          <div class="hero-actions">
            ${this.renderActions()}
          </div>
        </div>
      </div>
    `;
  }
  
  renderParallax() {
    return `
      <div class="hero-container hero-parallax-container" data-parallax>
        <div class="hero-parallax-layer" data-depth="0.2">
          ${this.state.background ? `<img src="${this.state.background}" alt="">` : ''}
        </div>
        <div class="hero-content" data-depth="0.8">
          <h1 class="hero-title">${this.state.title}</h1>
          <p class="hero-subtitle">${this.state.subtitle}</p>
          <div class="hero-actions">
            ${this.renderActions()}
          </div>
        </div>
      </div>
    `;
  }
  
  renderAnimated() {
    return `
      <div class="hero-container hero-animated-container">
        <div class="hero-content">
          <h1 class="hero-title hero-animated-title">${this.state.title}</h1>
          <p class="hero-subtitle hero-animated-subtitle">${this.state.subtitle}</p>
          <div class="hero-actions hero-animated-actions">
            ${this.renderActions()}
          </div>
        </div>
        <div class="hero-animated-bg">
          <div class="hero-shape hero-shape-1"></div>
          <div class="hero-shape hero-shape-2"></div>
          <div class="hero-shape hero-shape-3"></div>
        </div>
      </div>
    `;
  }
  
  renderCTA() {
    return `
      <div class="hero-container hero-cta-container">
        <div class="hero-cta-badge">Limited Time Offer</div>
        <h1 class="hero-title hero-title-cta">${this.state.title}</h1>
        <p class="hero-subtitle hero-subtitle-cta">${this.state.subtitle}</p>
        <div class="hero-actions hero-actions-cta">
          ${this.renderActions()}
        </div>
        <div class="hero-cta-features">
          <span class="hero-feature">✓ No Credit Card Required</span>
          <span class="hero-feature">✓ 30-Day Free Trial</span>
          <span class="hero-feature">✓ Cancel Anytime</span>
        </div>
      </div>
    `;
  }
  
  renderActions() {
    const { primaryAction, secondaryAction } = this.state;
    return `
      ${primaryAction ? `<a href="${primaryAction.href}" class="hero-btn hero-btn-primary">${primaryAction.text}</a>` : ''}
      ${secondaryAction ? `<a href="${secondaryAction.href}" class="hero-btn hero-btn-secondary">${secondaryAction.text}</a>` : ''}
    `;
  }
  
  styles() {
    return `
      :host {
        display: block;
        width: 100%;
        position: relative;
      }
      
      .hero-container {
        min-height: 500px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4rem 2rem;
        position: relative;
        overflow: hidden;
      }
      
      .hero-content {
        text-align: center;
        max-width: 800px;
        z-index: 2;
        position: relative;
      }
      
      .hero-title {
        font-size: 3rem;
        font-weight: 800;
        line-height: 1.2;
        margin-bottom: 1.5rem;
        color: var(--hero-title-color, #1a1a1a);
      }
      
      .hero-subtitle {
        font-size: 1.25rem;
        line-height: 1.6;
        margin-bottom: 2rem;
        color: var(--hero-subtitle-color, #666);
      }
      
      .hero-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
      }
      
      .hero-btn {
        padding: 0.875rem 2rem;
        border-radius: 0.5rem;
        font-weight: 600;
        text-decoration: none;
        transition: all 0.2s;
        display: inline-block;
      }
      
      .hero-btn-primary {
        background: var(--hero-primary-color, #3b82f6);
        color: white;
      }
      
      .hero-btn-primary:hover {
        background: var(--hero-primary-hover, #2563eb);
        transform: translateY(-2px);
      }
      
      .hero-btn-secondary {
        background: transparent;
        color: var(--hero-secondary-color, #3b82f6);
        border: 2px solid currentColor;
      }
      
      .hero-btn-secondary:hover {
        background: var(--hero-secondary-color, #3b82f6);
        color: white;
      }
      
      /* Split variant */
      .hero-split-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4rem;
        align-items: center;
      }
      
      .hero-split-container .hero-content-section {
        text-align: left;
      }
      
      .hero-split-container .hero-actions {
        justify-content: flex-start;
      }
      
      /* Fullscreen variant */
      .hero-fullscreen-container {
        min-height: 100vh;
        position: relative;
      }
      
      .hero-background {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
      }
      
      .hero-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
      }
      
      .hero-fullscreen-container .hero-title {
        color: white;
        font-size: 4rem;
      }
      
      .hero-fullscreen-container .hero-subtitle {
        color: rgba(255, 255, 255, 0.9);
      }
      
      /* Video variant */
      .hero-video-bg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      /* Gradient variant */
      .hero-gradient-bg {
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        opacity: 0.9;
      }
      
      .hero-gradient-container .hero-title,
      .hero-gradient-container .hero-subtitle {
        color: white;
      }
      
      /* Minimal variant */
      .hero-minimal-container {
        min-height: 400px;
        padding: 6rem 2rem;
      }
      
      .hero-title-minimal {
        font-size: 2.5rem;
        font-weight: 400;
      }
      
      /* Animated variant */
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .hero-animated-title {
        animation: fadeInUp 0.8s ease-out;
      }
      
      .hero-animated-subtitle {
        animation: fadeInUp 0.8s ease-out 0.2s both;
      }
      
      .hero-animated-actions {
        animation: fadeInUp 0.8s ease-out 0.4s both;
      }
      
      .hero-shape {
        position: absolute;
        border-radius: 50%;
        filter: blur(40px);
        opacity: 0.5;
      }
      
      .hero-shape-1 {
        width: 400px;
        height: 400px;
        background: #3b82f6;
        top: -200px;
        right: -100px;
      }
      
      .hero-shape-2 {
        width: 300px;
        height: 300px;
        background: #8b5cf6;
        bottom: -150px;
        left: -100px;
      }
      
      /* CTA variant */
      .hero-cta-container {
        background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
        padding: 5rem 2rem;
      }
      
      .hero-cta-badge {
        display: inline-block;
        background: #ef4444;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 600;
        margin-bottom: 1rem;
      }
      
      .hero-cta-features {
        margin-top: 3rem;
        display: flex;
        gap: 2rem;
        justify-content: center;
        flex-wrap: wrap;
      }
      
      .hero-feature {
        color: #059669;
        font-weight: 500;
      }
      
      /* Responsive */
      @media (max-width: 768px) {
        .hero-title {
          font-size: 2rem;
        }
        
        .hero-subtitle {
          font-size: 1.125rem;
        }
        
        .hero-split-container {
          grid-template-columns: 1fr;
          text-align: center;
        }
        
        .hero-split-container .hero-actions {
          justify-content: center;
        }
        
        .hero-fullscreen-container .hero-title {
          font-size: 3rem;
        }
      }
    `;
  }
  
  connectedCallback() {
    super.connectedCallback();
    
    if (this.config.variant === 'particles') {
      this.initParticles();
    } else if (this.config.variant === 'parallax') {
      this.initParallax();
    }
  }
  
  initParticles() {
    requestAnimationFrame(() => {
      const canvas = this.querySelector('.hero-particles-canvas');
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      canvas.width = this.offsetWidth;
      canvas.height = this.offsetHeight;
      
      const particles = [];
      const particleCount = 50;
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2 + 1
        });
      }
      
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
          particle.x += particle.vx;
          particle.y += particle.vy;
          
          if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
          if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
          
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
          ctx.fill();
        });
        
        requestAnimationFrame(animate);
      };
      
      animate();
    });
  }
  
  initParallax() {
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const layers = this.querySelectorAll('[data-depth]');
      
      layers.forEach(layer => {
        const depth = layer.dataset.depth;
        const transform = `translateY(${scrolled * depth}px)`;
        layer.style.transform = transform;
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    this._parallaxHandler = handleScroll;
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    
    if (this._parallaxHandler) {
      window.removeEventListener('scroll', this._parallaxHandler);
    }
  }
  
  updateContent(content) {
    Object.assign(this.state, content);
    this.requestUpdate();
  }
}

customElements.define('hero-section', HeroSection);